import {ethers} from "ethers";

const FileContractInfo = {
    abi: [
        "function writeChunk(bytes memory uuid, bytes memory name, bytes memory iv, bytes memory fileType, uint256 chunkCount, uint256 chunkId, bytes calldata data) public payable",
        "function remove(bytes memory uuid) external returns (uint256)",
        "function removes(bytes[] memory uuids) public",

        "function createDrive(bytes memory uuid, bytes memory iv, bytes memory driveEncrypt) public",
        "function getDrive() public view returns(bytes memory uuid, bytes memory iv, bytes memory driveEncrypt)",
        "function getFileInfos() public view returns (uint256[] memory times,bytes[] memory uuids,bytes[] memory names,bytes[] memory types)",
        "function getFileInfo(bytes memory uuid) public view returns(uint256 realChunkCount,uint256 chunkCount,uint256 time,bytes memory name,bytes memory fileType,bytes memory iv)",
        "function getFile(bytes memory uuid, uint256 chunkId) public view returns(bytes memory)"
    ],
};

export const FileContract = (address) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(address, FileContractInfo.abi, provider);
    return contract.connect(provider.getSigner());
};
