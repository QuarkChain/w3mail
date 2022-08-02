import {ethers} from "ethers";
import {FileContract} from "../contract";
import {deriveDriveKey, deriveFileKey, fileEncrypt, driveEncrypt, driveDecrypt, fileDecrypt} from "./w3crypto";

const stringToHex = (s) => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(s));
const hexToString = (h) => ethers.utils.toUtf8String(h);

const domain = window.location.host;
const origin = window.location.origin;

function createSiweMessage(address, driveId, networkId, statement) {
    return `${domain} wants you to sign in with your Ethereum account:
        \n${address}\n\n${statement}\n\nURI: ${origin}\nVersion: 1\nChain ID: ${networkId}\nNonce: ${driveId}`;
}

export const getDrive = async (controller) => {
    const fileContract = FileContract(controller);
    const result = await fileContract.getDrive();
    return {
        uuid: result.uuid !== "0x" ? hexToString(result.uuid) : 'none',
        iv: result.iv !== "0x" ? hexToString(result.iv) : 'none',
        encrypt: result.driveEncrypt !== "0x" ? result.driveEncrypt : 'none',
    }
}

export const login = async (driveId, address, networkId) =>{
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    try {
        const message = createSiweMessage(
            address,
            driveId,
            networkId,
            'Login in with W3DRIVE app.'
        );
        console.log(message);
        return await signer.signMessage(message);
    } catch (e) {
        return undefined;
    }
}

export const createDrive = async (controller, driveId, signature, password) => {
    // create key
    const driveKey = await deriveDriveKey(signature, password);
    // update driveId
    const id = stringToHex(driveId);
    const driveEncryptData = await driveEncrypt(driveKey, driveId);
    const cipherIV = stringToHex(driveEncryptData.cipherIV);
    const hexData = '0x' + driveEncryptData.data.toString('hex');

    const fileContract = FileContract(controller);
    const tx = await fileContract.createDrive(id, cipherIV, hexData);
    const receipt = await tx.wait();
    if (receipt.status) {
        return driveKey;
    }
    return "";
}

export const encryptDrive = async (signature, password, iv, encryptData) => {
    // create key
    const driveKey = await deriveDriveKey(signature, password);
    encryptData = encryptData.substr(2, encryptData.length - 1);
    const data = Buffer.from(encryptData, 'hex');
    try {
        await driveDecrypt(iv, driveKey, data);
        return driveKey;
    } catch (e) {
        return undefined;
    }
}

export const createFileEncrypt = async (driveKey, fileId, data) => {
    const fileKey = await deriveFileKey(driveKey, fileId);
    return await fileEncrypt(fileKey, data);
}

export const decryptFile = async (driveKey, fileId, encryptData, iv) => {
    const fileKey = await deriveFileKey(driveKey, fileId);
    const data = Buffer.from(encryptData, 'hex');
    return await fileDecrypt(iv, fileKey, data);
}

