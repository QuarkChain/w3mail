import { deriveFileKey, fileEncrypt , fileDecrypt} from "./w3crypto";


export const createFileEncrypt = async (driveKey, fileId, data) => {
    const fileKey = await deriveFileKey(driveKey, fileId);
    return await fileEncrypt(fileKey, data);
}

export const decryptFile = async (driveKey, fileId, encryptData, iv) => {
    const fileKey = await deriveFileKey(driveKey, fileId);
    const data = Buffer.from(encryptData, 'hex');
    return await fileDecrypt(iv, fileKey, data);
}

