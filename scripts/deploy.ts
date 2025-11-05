// scripts/01-deploy.ts
import { ethers } from "ethers"; // 1. 'ethers'에서 직접 import
import hre from "hardhat"; // 2. 'hre'는 artifacts를 위해 import
import "dotenv/config";
import fs from "fs";

// 3. .env에서 변수 로드
const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;

async function main() {
  if (!PRIVATE_KEY || !SEPOLIA_RPC_URL) {
    throw new Error("Missing PRIVATE_KEY or SEPOLIA_RPC_URL in .env file");
  }

  // 4. Ethers v6 방식: Provider 및 Signer(Wallet) 수동 설정
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const deployer = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("Deploying contract with the account:", deployer.address);

  // 5. hre를 사용하여 ABI와 Bytecode 읽기
  const artifact = await hre.artifacts.readArtifact("SoulboundToken");

  // 6. Ethers v6 방식: ContractFactory 수동 생성
  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    deployer // Signer 연결
  );

  // 7. 배포
  const tokenName = "MySoulboundToken";
  const tokenSymbol = "MSBT";
  const sbt = await factory.deploy(tokenName, tokenSymbol);

  await sbt.waitForDeployment();

  const deployedAddress = await sbt.getAddress();
  console.log(`✅ SoulboundToken deployed to: ${deployedAddress}`);

  // 8. 배포 주소 저장 (로직 동일)
  const deploymentData = {
    address: deployedAddress,
  };
  fs.writeFileSync(
    "deployment-address.json",
    JSON.stringify(deploymentData)
  );
  console.log("Deployment address saved to deployment-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });