const hre = require('hardhat')

async function main () {
  // 1. Récupérer le contrat
  const Voting = await hre.ethers.getContractFactory('Voting')

  // 2. Déployer le contrat
  const voting = await Voting.deploy()

  // 3. Attendre que le contrat soit miné
  await voting.waitForDeployment()

  // 4. Afficher l'adresse du contrat
  console.log(`Voting deployed to: ${await voting.getAddress()}`)
}

// Gérer les erreurs et exécuter le script
main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
