// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @notice Academic simulation – no real trading executed

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract MyAutoTrader is ERC721, Ownable {
    // ======== GLOBAL ========
    bool public constant IS_SIMULATION = true;

    uint256 public nextTokenId;
    address public executor;

    AggregatorV3Interface internal priceFeed;
    IERC20 public usdcToken;
    IERC20 public wethToken;

    uint256 public constant PERFORMANCE_FEE = 500; // 5%

    // ======== DATA ========
    struct Strategy {
        uint256 id;
        uint256 amountDeposited;
        uint256 buyPrice;
        uint256 sellPrice;
        uint256 stopLossPrice;
        bool isInvested;
        bool isActive;
        uint256 entryPrice;
        uint256 exitPrice;
        int256 pnl;
        uint256 feesPaid;
    }

    mapping(uint256 => Strategy) public strategies;

    // ======== EVENTS ========
    event StrategyCreated(uint256 indexed tokenId, address indexed owner, uint256 amount);
    event StrategyDeactivated(uint256 indexed tokenId);
    event FundsWithdrawn(uint256 indexed tokenId, uint256 amount, address indexed to);
    event StrategyTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event StrategyExecuted(uint256 indexed tokenId, string action, uint256 price);
    event FeeCollected(uint256 indexed tokenId, uint256 fee, address indexed user);

    // ======== MODIFIERS ========
    modifier onlyExecutor() {
        require(msg.sender == executor || msg.sender == owner(), "Not authorized");
        _;
    }

    // ======== CONSTRUCTOR ========
    constructor(
        address _priceFeed,
        address _usdc,
        address _weth
    )
        ERC721("AutoTraderStrategy", "ATS")
        Ownable(msg.sender)
    {
        priceFeed = AggregatorV3Interface(_priceFeed);
        usdcToken = IERC20(_usdc);
        wethToken = IERC20(_weth);
        executor = msg.sender;
    }

    // ======== ADMIN ========
    function setExecutor(address _executor) external onlyOwner {
        executor = _executor;
    }

    // ======== STRATEGY CREATION ========
    function createStrategy(
        uint256 _buyPrice,
        uint256 _sellPrice,
        uint256 _stopLoss,
        uint256 _amount
    ) external {
        require(_buyPrice > 0, "Invalid buy price");
        require(_sellPrice > _buyPrice, "Sell must be > buy");
        if (_stopLoss > 0) {
            require(_stopLoss < _buyPrice, "Stop loss must be < buy");
        }

        require(
            usdcToken.transferFrom(msg.sender, address(this), _amount),
            "Deposit failed"
        );

        uint256 tokenId = nextTokenId++;
        _mint(msg.sender, tokenId);

        strategies[tokenId] = Strategy({
            id: tokenId,
            amountDeposited: _amount,
            buyPrice: _buyPrice,
            sellPrice: _sellPrice,
            stopLossPrice: _stopLoss,
            isInvested: false,
            isActive: true,
            entryPrice: 0,
            exitPrice: 0,
            pnl: 0,
            feesPaid: 0
        });

        emit StrategyCreated(tokenId, msg.sender, _amount);
    }

    // ======== COPY STRATEGY (SIMULATION) ========
    function copyStrategy(uint256 tokenId, uint256 _amount) external {
        Strategy memory original = strategies[tokenId];
        require(original.isActive, "Strategy inactive");

        require(
            usdcToken.transferFrom(msg.sender, address(this), _amount),
            "Deposit failed"
        );

        uint256 newTokenId = nextTokenId++;
        _mint(msg.sender, newTokenId);

        strategies[newTokenId] = Strategy({
            id: newTokenId,
            amountDeposited: _amount,
            buyPrice: original.buyPrice,
            sellPrice: original.sellPrice,
            stopLossPrice: original.stopLossPrice,
            isInvested: false,
            isActive: true,
            entryPrice: 0,
            exitPrice: 0,
            pnl: 0,
            feesPaid: 0
        });

        emit StrategyCreated(newTokenId, msg.sender, _amount);
    }

    // ======== MANAGEMENT ========
    function deactivateStrategy(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        Strategy storage strategy = strategies[tokenId];
        require(strategy.isActive, "Already inactive");

        if (strategy.isInvested) {
            uint256 currentPrice = getLatestPrice();
            _executeSell(tokenId, currentPrice);
        }

        strategy.isActive = false;
        emit StrategyDeactivated(tokenId);
    }

    function withdraw(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        Strategy storage strategy = strategies[tokenId];
        require(!strategy.isActive, "Deactivate first");
        require(strategy.amountDeposited > 0, "No funds");

        uint256 amount = strategy.amountDeposited;
        strategy.amountDeposited = 0;

        require(usdcToken.transfer(msg.sender, amount), "Transfer failed");
        emit FundsWithdrawn(tokenId, amount, msg.sender);
    }

    // ======== NFT TRANSFER ========
    function transferFrom(address from, address to, uint256 tokenId) public override {
        Strategy storage strategy = strategies[tokenId];
        require(!strategy.isInvested, "Close position before transfer");

        super.transferFrom(from, to, tokenId);
        emit StrategyTransferred(tokenId, from, to);
    }

    // ======== EXECUTION ========
    function executeStrategy(uint256 tokenId) public  {
        Strategy storage strategy = strategies[tokenId];
        require(strategy.isActive, "Inactive");

        uint256 currentPrice = getLatestPrice();

        if (!strategy.isInvested && currentPrice <= strategy.buyPrice) {
            _executeBuy(tokenId, currentPrice);
        }

        if (
            strategy.isInvested &&
            (
                currentPrice >= strategy.sellPrice ||
                (strategy.stopLossPrice > 0 && currentPrice <= strategy.stopLossPrice)
            )
        ) {
            _executeSell(tokenId, currentPrice);
        }
    }

    function executeAllStrategies() external onlyExecutor {
        for (uint256 i = 0; i < nextTokenId; i++) {
            if (_ownerOf(i) != address(0) && strategies[i].isActive) {
                executeStrategy(i);
            }
        }
    }

    function _executeBuy(uint256 tokenId, uint256 price) internal {
        Strategy storage strategy = strategies[tokenId];
        strategy.entryPrice = price;
        strategy.isInvested = true;
        emit StrategyExecuted(tokenId, "BUY", price);
    }

    function _executeSell(uint256 tokenId, uint256 price) internal {
        Strategy storage strategy = strategies[tokenId];
        require(strategy.entryPrice > 0, "Invalid entry price");

        uint256 initialValue = strategy.amountDeposited;
        uint256 finalValue = (initialValue * price) / strategy.entryPrice;
        uint256 fee = 0;

        // Si profit
        if (finalValue > initialValue) {
            uint256 profit = finalValue - initialValue;
            fee = (profit * PERFORMANCE_FEE) / 10000;
            strategy.amountDeposited = finalValue - fee;
            emit FeeCollected(tokenId, fee, ownerOf(tokenId));
        } else {
            // Si perte
            strategy.amountDeposited = finalValue;
        }

        strategy.exitPrice = price;
        strategy.pnl = int256(strategy.amountDeposited) - int256(initialValue);
        strategy.feesPaid = fee;
        strategy.isInvested = false;

        emit StrategyExecuted(tokenId, "SELL", price);
    }

    // ======== VIEWS ========
    function getLatestPrice() public view returns (uint256) {
        (, int price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        return uint256(price);
    }

    function getStrategy(uint256 tokenId) external view returns (Strategy memory) {
        require(_ownerOf(tokenId) != address(0), "Does not exist");
        return strategies[tokenId];
    }

    function getMyStrategies(address user) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(user);
        uint256[] memory tokenIds = new uint256[](balance);

        uint256 counter;
        for (uint256 i = 0; i < nextTokenId; i++) {
            if (_ownerOf(i) == user) {
                tokenIds[counter++] = i;
            }
        }
        return tokenIds;
    }

    // ======== NFT METADATA (MINIMAL) ========
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        Strategy memory s = strategies[tokenId];
        return string(
            abi.encodePacked(
                "data:application/json,{",
                '"name":"AutoTrader Strategy #', Strings.toString(tokenId), '",',
                '"description":"Academic automated trading strategy (simulation)",',
                '"attributes":[',
                    '{"trait_type":"Buy Price","value":"', Strings.toString(s.buyPrice), '"},',
                    '{"trait_type":"Sell Price","value":"', Strings.toString(s.sellPrice), '"},',
                    '{"trait_type":"Active","value":"', s.isActive ? "true" : "false", '"}',
                "]}"
            )
        );
    }
}
