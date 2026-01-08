const { ethers } = require("hardhat");

async function main() {
  const c = await ethers.getContractAt(
    "MyAutoTrader",
    "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
  );

  console.log(await c.owner());
}

main();
