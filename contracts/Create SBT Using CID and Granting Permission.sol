// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SoulboundToken is ERC721, Ownable {
    
    struct CIDViewLog {
        address viewer;
        uint256 tokenId; 
        uint256 timestamp;
    }

    // 토큰별 접근 제어를 위한 중첩 매핑
    mapping(address => mapping(uint256 => bool)) private approvedViewers;
    mapping(address => mapping(uint256 => bool)) private accessRequests;
    
    CIDViewLog[] private viewLogs;

    event CIDViewed(address indexed viewer, uint256 indexed tokenId, uint256 timestamp);

    //  (공개/비공개 분리)
    mapping(uint256 => string) private _publicTokenURIs; 
    mapping(uint256 => string) private _privateCidUrls;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
    }

    /**
     * @notice SBT 민팅 (publicURI 제거됨)
     * @param to SBT를 받을 주소
     * @param tokenId 민팅할 토큰 ID
     * @param privateCID dApp에서 접근제어할 실제 데이터 CID
     */
    function mint(address to, uint256 tokenId, string memory privateCID) public onlyOwner {
        _mint(to, tokenId);
        
        string memory uri = string(abi.encodePacked("https://ipfs.io/ipfs/", privateCID)); 
        
        // publicURI 설정 로직 제거됨 (기본값: "")
        _privateCidUrls[tokenId] = uri;
    }

    /**
     * @notice  공개 메타데이터 URI를 설정 (Owner 전용)   현재 사용x 나중에 사용 또는 수정가능. baseurl 사용하는 방식으로도
     * @param tokenId URI를 설정할 토큰 ID
     * @param publicURI 오픈씨/메타마스크에 표시될 메타데이터 URI
     */
    function setPublicURI(uint256 tokenId, string memory publicURI) public onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _publicTokenURIs[tokenId] = publicURI;
    }

    // --- SBT 전송 방지 로직 (유지) ---
    function _transfer(address, address, uint256) internal virtual override {
        revert("SBT: transfer of token is not allowed");
    }
    function safeTransferFrom(address, address, uint256) public virtual override {
        revert("SBT: transfer of token is not allowed");
    }
    function safeTransferFrom(address, address, uint256, bytes memory) public virtual override {
        revert("SBT: transfer of token is not allowed");
    }
    function transferFrom(address, address, uint256) public virtual override {
        revert("SBT: transfer of token is not allowed");
    }
    // ---

    // --- 토큰별 접근 제어 로직 (유지) ---
    function requestViewCID(uint256 tokenId) public {
        require(_exists(tokenId), "Token does not exist");
        require(!approvedViewers[msg.sender][tokenId], "Already approved to view CID");
        require(!accessRequests[msg.sender][tokenId], "Access request already pending");
        accessRequests[msg.sender][tokenId] = true;
    }

    function approveViewer(address viewer, uint256 tokenId) public onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        require(accessRequests[viewer][tokenId], "No request from this address");
        approvedViewers[viewer][tokenId] = true;
        accessRequests[viewer][tokenId] = false;
    }

    function revokeViewer(address viewer, uint256 tokenId) public onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        approvedViewers[viewer][tokenId] = false;
    }
    // ---

    // --- 데이터 반환 함수 (유지) ---
    function EmitCID(uint256 tokenId) public returns (string memory) {
        require(approvedViewers[msg.sender][tokenId] || msg.sender == owner(), "Not authorized to view CID");
        require(_exists(tokenId), "Token does not exist");

        uint256 currentTime = block.timestamp;
        emit CIDViewed(msg.sender, tokenId, currentTime);
        viewLogs.push(CIDViewLog(msg.sender, tokenId, currentTime));
        return _privateCidUrls[tokenId];
    }

    function getViewLogs() public view onlyOwner returns (CIDViewLog[] memory) {
        return viewLogs;
    }

    function getCID(uint256 tokenId) public view returns (string memory) {
        require(approvedViewers[msg.sender][tokenId] || msg.sender == owner(), "Not authorized to view CID");
        require(_exists(tokenId), "Token does not exist");
        return _privateCidUrls[tokenId];
    }
    // ---

    // --- tokenURI (유지) ---
    // 이 함수는 setPublicURI가 호출되기 전까지 "" (빈 문자열)을 반환합니다.
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
        return _publicTokenURIs[tokenId]; 
    }
}