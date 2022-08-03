import {ethers} from "ethers";
import {FileContract} from "../contract";
import {deriveDriveKey, deriveFileKey, fileEncrypt, driveDecrypt, fileDecrypt} from "./w3crypto";

// const stringToHex = (s) => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(s));
const hexToString = (h) => ethers.utils.toUtf8String(h);



export const getDrive = async (controller) => {
    const fileContract = FileContract(controller);
    const result = await fileContract.getDrive();
    return {
        uuid: result.uuid !== "0x" ? hexToString(result.uuid) : 'none',
        iv: result.iv !== "0x" ? hexToString(result.iv) : 'none',
        encrypt: result.driveEncrypt !== "0x" ? result.driveEncrypt : 'none',
    }
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

