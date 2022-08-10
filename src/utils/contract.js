import {ethers} from "ethers";

const FileContractInfo = {
    abi: [
        "function emailList(bytes memory email) public view returns(address)",
        "function getPublicKeyByEmail(bytes memory email) public view returns(bytes32 publicKey)",
        "function getUserInfo(address user) public view returns(bytes32 publicKey,bytes memory email,bytes memory encryptData,bytes memory iv)",
        "function getSentEmails() public view returns (uint256[] memory times,bytes[] memory uuids,bytes[] memory fromMails,bytes[] memory toMails,bytes[] memory titles,bytes[] memory fileUuids,bytes[] memory fileNames)",
        "function getInboxEmails() public view returns (uint256[] memory times,bytes[] memory uuids,bytes[] memory fromMails,bytes[] memory toMails,bytes[] memory titles,bytes[] memory fileUuids,bytes[] memory fileNames)",
        "function getEmailContent(bytes memory fromMail, bytes memory uuid, uint256 chunkId) public view returns(bytes memory data)",
        "function getFile(bytes memory fromMail, bytes memory uuid, uint256 chunkId) public view returns(bytes memory data)",
        "function countChunks(bytes memory fromMail, bytes memory uuid) public view returns (uint256)",
        "function defaultEmail() public view returns(string memory)",

        "function register(bytes32 publicKey, bytes memory email, bytes memory encryptData, bytes memory iv) public",
        "function sendEmail(bytes memory toEmail,bytes memory uuid,bytes memory title,bytes calldata encryptData,bytes memory fileUuid) public payable",
        "function writeChunk(bytes memory uuid, bytes memory name, uint256 chunkId, bytes calldata data) public payable",
        "function remove(bytes memory uuid) external returns (uint256)",
        "function removes(bytes[] memory uuids) public",
    ],
};

export const FileContract = (address) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(address, FileContractInfo.abi, provider);
    return contract.connect(provider.getSigner());
};
