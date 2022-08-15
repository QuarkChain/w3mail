import {ethers} from "ethers";

const FileContractInfo = {
    abi: [
        "function getPublicKey(address userAddress) public view returns(bytes32 publicKey) ",
        "function getSentEmails() public view returns (bool[] memory isEncryptions,uint256[] memory times,address[] memory fromMails,address[] memory toMails,bytes[] memory uuids,bytes[] memory titles,bytes[] memory fileUuids,bytes[] memory fileNames)",
        "function getInboxEmails() public view returns (bool[] memory isEncryptions,uint256[] memory times,address[] memory fromMails,address[] memory toMails,bytes[] memory uuids,bytes[] memory titles,bytes[] memory fileUuids,bytes[] memory fileNames)",
        "function getEmailContent(address fromAddress, bytes memory uuid, uint256 chunkId) public view returns(bytes memory data)",
        "function getFile(bytes memory fromMail, bytes memory uuid, uint256 chunkId) public view returns(bytes memory data)",
        "function countChunks(bytes memory fromMail, bytes memory uuid) public view returns (uint256)",

        "function register(bytes32 publicKey) public",
        "function sendEmail(bytes memory toEmail,bytes memory uuid,bytes memory title,bytes calldata encryptData,bytes memory fileUuid) public payable",
        "function writeChunk(bytes memory uuid, bytes memory name, uint256 chunkId, bytes calldata data) public payable",
        "function removeEmails(uint256 types, bytes[] memory uuids) public",
    ],
};

export const FileContract = (address) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(address, FileContractInfo.abi, provider);
    return contract.connect(provider.getSigner());
};
