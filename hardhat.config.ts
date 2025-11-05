// hardhat.config.ts

import { defineConfig } from "hardhat/config"; // 1. defineConfig 임포트
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "dotenv/config";

// .env 파일에서 변수를 읽어옵니다.
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PRIVATE_KEY_VIEWER = process.env.PRIVATE_KEY_VIEWER;

// 2. 스크립트에서 [owner, viewer]로 사용하기 위해 계정 배열 생성
const accounts: string[] = [];
if (PRIVATE_KEY) {
  accounts.push(PRIVATE_KEY); // [0]번 인덱스 (Owner)
}
if (PRIVATE_KEY_VIEWER) {
  accounts.push(PRIVATE_KEY_VIEWER); // [1]번 인덱스 (Viewer)
}

// 3. export default defineConfig({...})로 전체를 감싸줍니다.
export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.20", // solidity 버전은 0.8.20 이상이면 괜찮습니다.
      },
      production: {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      // 4. 'configVariable' 대신 .env에서 읽어온 변수 사용
      url: SEPOLIA_RPC_URL,
      // 5. 두 개의 계정을 모두 포함하는 배열로 수정
      accounts: accounts,
    },
  },
});