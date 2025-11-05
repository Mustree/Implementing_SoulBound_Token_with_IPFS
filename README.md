
# IPFS CID를 위한 온체인 접근 제어 SBT

## 개요

이 프로젝트는 Hardhat을 사용하여 Soulbound Token (SBT)을 구현합니다. 이 SBT는 단순한 전송 불가 토큰이 아니라, IPFS에 저장된 개인 데이터(CID)에 대한 접근을 온체인에서 제어하는 기능을 포함합니다.

토큰 소유자(Owner)는 개인 CID가 연결된 SBT를 민팅할 수 있습니다. 특정 사용자(Viewer)가 데이터에 접근을 요청하고, 소유자가 이를 승인하면, 해당 사용자만 스마트 컨트랙트를 통해 개인 CID URL을 조회할 수 있습니다.

## 주요 기능

  * SBT 구현: ERC721을 상속받으며, `_transfer` 관련 함수들을 오버라이드하여 토큰 전송을 막습니다.
  * 데이터 분리: `_publicTokenURIs` (마켓플레이스 등 외부 공개용)와 `_privateCidUrls` (IPFS 기반의 실제 데이터)를 별도로 저장하여 관리합니다.
  * 접근 제어 워크플로: 데이터에 접근하려는 사용자는 먼저 `requestViewCID` 함수를 호출하여 접근을 요청해야 합니다.
  * 소유자 승인: 컨트랙트의 Owner는 `approveViewer` 함수를 통해 요청을 승인하거나 `revokeViewer` 함수로 권한을 취소할 수 있습니다.
  * 데이터 조회: Owner 또는 접근을 승인받은 뷰어만 `EmitCID` 또는 `getCID` 함수를 호출하여 `_privateCidUrls`에 저장된 실제 IPFS URL을 반환받을 수 있습니다.
  * 로그 기록: 승인된 뷰어가 `EmitCID` 함수를 호출하여 데이터를 조회할 때마다, 호출자와 시간 등 로그가 컨트랙트 내부에 기록됩니다.

## 프로젝트 구조

  * `contracts/Create SBT Using CID and Granting Permission.sol`: 접근 제어 로직이 포함된 핵심 SoulboundToken 스마트 컨트랙트입니다.
  * `scripts/deploy.ts`: 컨트랙트를 네트워크에 배포하는 스크립트입니다. 배포 후 `deployment-address.json`에 주소를 저장합니다.
  * `scripts/interact.ts`: 배포된 컨트랙트와 상호작용하는 시나리오 스크립트입니다.
  * `hardhat.config.ts`: Hardhat 설정 파일. Sepolia 네트워크 및 배포/테스트 계정을 구성합니다.
  * `.env.examle`: 프로젝트 실행에 필요한 환경 변수 예시 파일입니다.

## 사용 방법

1.  의존성 설치

    ```bash
    npm install
    ```

2.  환경 변수 설정
    `.env.examle` 파일을 복사하여 `.env` 파일을 생성하고, 파일 내의 변수들을 채워줍니다.

      * `SEPOLIA_RPC_URL`: Sepolia 테스트넷 RPC URL (Alchemy, Infura 등)
      * `PRIVATE_KEY`: 컨트랙트 배포자(Owner) 계정의 비공개 키
      * `PRIVATE_KEY_VIEWER`: 데이터 접근을 테스트할 뷰어(Viewer) 계정의 비공개 키

3.  컨트랙트 컴파일

    ```bash
    npx hardhat compile
    ```

4.  컨트랙트 배포
    `deploy.ts` 스크립트를 실행하여 Sepolia 네트워크에 컨트랙트를 배포합니다.

    ```bash
    npx hardhat run scripts/deploy.ts --network sepolia
    ```

    성공 시, 프로젝트 루트에 `deployment-address.json` 파일이 생성되고 배포된 주소가 기록됩니다.

5.  테스트 CID 수정 (중요)
    `scripts/interact.ts` 파일에는 테스트용으로 하드코딩된 IPFS CID가 있습니다.
    이 스크립트를 실행하기 전에, `privateCID` 변수의 값을 본인이 테스트하려는 실제 IPFS CID로 직접 수정해야 합니다.

    ```typescript
    // scripts/interact.ts 에서
    // ...
    const tokenId = 1;
    const privateCID = "bafkreiflumket2dclo4sjyvmi245tkl4mrse57j5z2ovujmgb3gi67hckq"; // 여기를 직접 수정하세요
    // ...
    ```

6.  상호작용 스크립트 실행
    CID를 수정한 후, `interact.ts` 스크립트를 실행하여 민팅부터 데이터 조회까지의 전체 워크플로를 테스트합니다.

    ```bash
    npx hardhat run scripts/interact.ts --network sepolia
    ```

## 스크립트 워크플로 (interact.ts)

`interact.ts` 스크립트는 다음 순서로 작업을 자동 수행합니다:

1.  (Owner) `PRIVATE_KEY_VIEWER`의 주소를 대상으로 토큰을 민팅합니다 (`mint`).
2.  (Viewer) 민팅된 토큰에 대한 CID 접근을 요청합니다 (`requestViewCID`).
3.  (Owner) 뷰어의 요청을 승인합니다 (`approveViewer`).
4.  (Viewer) 승인된 권한으로 개인 CID URL을 성공적으로 가져옵니다 (`EmitCID`).
5.  스크립트가 가져온 IPFS URL의 실제 콘텐츠를 fetch하여 터미널에 출력합니다.