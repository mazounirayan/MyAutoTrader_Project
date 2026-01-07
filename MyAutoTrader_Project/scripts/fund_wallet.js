async function main() {
  const receiverAddress = process.env.TARGET_ADDRESS;
  
  if (!receiverAddress) {
    console.error("❌ Erreur : Veuillez spécifier votre adresse avec la variable TARGET_ADDRESS");
    process.exit(1);
  }

  console.log(`💸 Envoi de fonds de test vers : ${receiverAddress}`);

  const [sender] = await ethers.getSigners();
  
  // Envoi de 100 ETH (fictifs)
  const tx = await sender.sendTransaction({
    to: receiverAddress,
    value: ethers.parseEther("100.0"),
  });

  await tx.wait();

  console.log(`✅ Succès ! 100 ETH (Test) envoyés.`);
  console.log(`Hash de transaction : ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
