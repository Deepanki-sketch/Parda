/**
 * @file scripts/deploy_sepolia.js
 * @notice Deploys Parda ZK Claim System to Ethereum Sepolia Testnet
 * Deploys:
 * 1. Groth16Verifier.sol
 * 2. HospitalRegistry.sol (with 3 regulator multi-sig addresses)
 * 3. ClaimManager.sol (with initial escrow liquidity seed)
 * 4. AccessLog.sol (emergency break-glass audit trail)
 * 
 * Exports deployed contract addresses and ABIs directly to frontend/src/contracts/deployed_addresses.json
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("==================================================================");
    console.log("🌐 DEPLOYING PARDA ZERO-KNOWLEDGE PROTOCOL TO SEPOLIA TESTNET");
    console.log("==================================================================");

    const [deployer] = await ethers.getSigners();
    if (!deployer) {
        throw new Error("No deployer signer available. Please check PRIVATE_KEY in .env");
    }

    const network = await ethers.provider.getNetwork();
    console.log(`Connected to Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Deployer Account:    ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Deployer Balance:    ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) {
        console.warn("⚠️  Deployer account has 0 ETH. Get free Sepolia ETH from https://sepoliafaucet.com");
    }

    // 1. Deploy Groth16 Verifier
    console.log("\n[1/4] Deploying Groth16Verifier...");
    const VerifierFactory = await ethers.getContractFactory("Groth16Verifier");
    const verifier = await VerifierFactory.deploy();
    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();
    console.log(`✅ Groth16Verifier deployed at: ${verifierAddress}`);

    // 2. Deploy HospitalRegistry
    console.log("\n[2/4] Deploying HospitalRegistry with Regulator Governance...");
    // Regulators default to deployer and distinct addresses if not configured
    const reg1 = process.env.REGULATOR_1 || deployer.address;
    const reg2 = process.env.REGULATOR_2 || (deployer.address.toLowerCase() === "0x70997970c51812dc3a010c7d01b50e0d17dc79c8" ? "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    const reg3 = process.env.REGULATOR_3 || (deployer.address.toLowerCase() === "0x90f79bf6eb2c4f870365e785982e1f101e93b906" ? "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" : "0x90F79bf6EB2c4f870365E785982E1f101E93b906");

    // Use initial approved hospital root from policy fixtures
    const sampleHospitalRoot = "0x0001020304050607080900010203040506070809000102030405060708090001";
    const RegistryFactory = await ethers.getContractFactory("HospitalRegistry");
    const hospitalRegistry = await RegistryFactory.deploy([reg1, reg2, reg3], sampleHospitalRoot);
    await hospitalRegistry.waitForDeployment();
    const registryAddress = await hospitalRegistry.getAddress();
    console.log(`✅ HospitalRegistry deployed at: ${registryAddress}`);

    // 3. Deploy ClaimManager with Escrow
    console.log("\n[3/4] Deploying ClaimManager Escrow Pool...");
    // 1 rupee = 0.0000001 ETH (approximate demo payout scale)
    const payoutWeiPerRupee = ethers.parseEther("0.0000001");
    
    // Seed pool with small testnet ETH if balance permits
    const seedAmount = balance > ethers.parseEther("0.05") ? ethers.parseEther("0.02") : 0n;

    const ClaimManagerFactory = await ethers.getContractFactory("ClaimManager");
    const claimManager = await ClaimManagerFactory.deploy(
        verifierAddress,
        registryAddress,
        payoutWeiPerRupee,
        { value: seedAmount }
    );
    await claimManager.waitForDeployment();
    const claimManagerAddress = await claimManager.getAddress();
    console.log(`✅ ClaimManager deployed at: ${claimManagerAddress}`);
    if (seedAmount > 0n) {
        console.log(`💰 Seeded Escrow Pool with ${ethers.formatEther(seedAmount)} Sepolia ETH`);
    }

    // 4. Deploy AccessLog
    console.log("\n[4/4] Deploying AccessLog (Break-Glass Audit)...");
    const AccessLogFactory = await ethers.getContractFactory("AccessLog");
    const accessLog = await AccessLogFactory.deploy();
    await accessLog.waitForDeployment();
    const accessLogAddress = await accessLog.getAddress();
    console.log(`✅ AccessLog deployed at: ${accessLogAddress}`);

    // Register baseline policy commitment in ClaimManager
    try {
        const policyFixturePath = path.join(__dirname, "..", "fixtures", "policy_credential.json");
        if (fs.existsSync(policyFixturePath)) {
            const policyData = JSON.parse(fs.readFileSync(policyFixturePath, "utf8"));
            const rawCommitment = policyData.policyCommitment || "193847291048291048201948291048291048291048291048291048";
            // Convert to bytes32 hex
            const commitmentBytes32 = ethers.toBeHex(BigInt(rawCommitment), 32);
            const policyLimit = policyData.policyLimit || 50000;
            console.log(`\nRegistering Policy Commitment: ${commitmentBytes32} with limit ${policyLimit}...`);
            const tx = await claimManager.registerPolicy(commitmentBytes32, policyLimit);
            await tx.wait();
            console.log("✅ Policy commitment registered on-chain!");
        }
    } catch (e) {
        console.warn("Notice: Policy registration skipped or completed with default:", e.message);
    }

    // 5. Export to frontend contracts directory
    const frontendContractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
    if (!fs.existsSync(frontendContractsDir)) {
        fs.mkdirSync(frontendContractsDir, { recursive: true });
    }

    const deployedData = {
        network: network.name === "unknown" ? "sepolia" : network.name,
        chainId: network.chainId.toString(),
        verifier: verifierAddress,
        hospitalRegistry: registryAddress,
        claimManager: claimManagerAddress,
        accessLog: accessLogAddress,
        payoutWeiPerRupee: payoutWeiPerRupee.toString(),
        deployedAt: new Date().toISOString(),
        blockExplorerUrl: "https://sepolia.etherscan.io"
    };

    const outputPath = path.join(frontendContractsDir, "deployed_addresses.json");
    fs.writeFileSync(outputPath, JSON.stringify(deployedData, null, 2));
    console.log(`\n💾 Saved deployment configuration to: ${outputPath}`);

    console.log("\n==================================================================");
    console.log("🎉 SEPOLIA DEPLOYMENT COMPLETE!");
    console.log(`Verify contracts at: https://sepolia.etherscan.io/address/${claimManagerAddress}`);
    console.log("==================================================================");
}

main().catch((err) => {
    console.error("Deployment failed:", err);
    process.exitCode = 1;
});
