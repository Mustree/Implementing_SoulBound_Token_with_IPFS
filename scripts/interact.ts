// scripts/02-interact.ts
import { ethers } from "ethers"; // 1. 'ethers'에서 직접 import
import hre from "hardhat"; // 2. 'hre'는 artifacts를 위해 import
import "dotenv/config";
import fs from "fs";

// 3. .env에서 모든 키 로드
const { SEPOLIA_RPC_URL, PRIVATE_KEY, PRIVATE_KEY_VIEWER } = process.env;

async function main() {
  // --- 1. 설정 ---

  if (!PRIVATE_KEY || !PRIVATE_KEY_VIEWER || !SEPOLIA_RPC_URL) {
    throw new Error(
      "Missing SEPOLIA_RPC_URL, PRIVATE_KEY, or PRIVATE_KEY_VIEWER in .env"
    );
  }

  // 배포된 주소 읽기
  const data = fs.readFileSync("deployment-address.json", "utf8");
  const { address } = JSON.parse(data);
  if (!address) {
    throw new Error("Contract address not found. Run 01-deploy.ts first.");
  }

  // 4. Ethers v6 방식: Provider 및 Signer 2개 수동 설정
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const owner = new ethers.Wallet(PRIVATE_KEY, provider);
  const viewer = new ethers.Wallet(PRIVATE_KEY_VIEWER, provider);

  console.log(`Using contract at: ${address}`);
  console.log(`Owner (Signer 0): ${owner.address}`);
  console.log(`Viewer (Signer 1): ${viewer.address}`);

  // 5. hre로 ABI 읽기
  const artifact = await hre.artifacts.readArtifact("SoulboundToken");

  // 6. Ethers v6 방식: Contract 인스턴스 생성 (Signer는 나중에 .connect()로 연결)
  const sbt = new ethers.Contract(address, artifact.abi, provider);

  // 테스트 CID
  const tokenId = 1;
  const privateCID = "bafkreiflumket2dclo4sjyvmi245tkl4mrse57j5z2ovujmgb3gi67hckq"; // 직접 수정하세요

  // --- 2. 시나리오 시작 ---

  console.log("\n--- 1. Minting Token (by Owner) ---");
  // 7. 트랜잭션 전송 시 .connect(signer) 사용
  const txMint = await sbt.connect(owner).mint(viewer.address, tokenId, privateCID);
  await txMint.wait();
  console.log(`Token ${tokenId} minted for ${viewer.address}`);

  console.log("\n--- 2. Requesting Access (by Viewer) ---");
  const txRequest = await sbt.connect(viewer).requestViewCID(tokenId);
  await txRequest.wait();
  console.log(`Viewer ${viewer.address} requested access for token ${tokenId}`);

  console.log("\n--- 3. Approving Request (by Owner) ---");
  const txApprove = await sbt.connect(owner).approveViewer(viewer.address, tokenId);
  await txApprove.wait();
  console.log(`Owner approved access for ${viewer.address}`);

  console.log("\n--- 4. Fetching Private URL (by Viewer) ---");
  // .connect(viewer)를 사용하여 호출자 변경
  const privateUrl = await sbt.connect(viewer).EmitCID(tokenId);
  console.log(`✅ Success! Private URL retrieved by viewer:`);
  console.log(privateUrl);

  // --- 3. URL 내용 출력 ---
  console.log("\n--- 5. Fetching content from the URL ---");
  try {
    const response = await fetch(privateUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const content = await response.text();
    console.log("--- URL Content Start ---");
    console.log(content);
    console.log("--- URL Content End ---");
  } catch (error: any) {
    console.error("Failed to fetch URL content:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });