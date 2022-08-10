import { deriveFileKey, fileDecrypt} from "./w3crypto";


export const decryptFile = async (driveKey, fileId, encryptData, iv) => {
    const fileKey = await deriveFileKey(driveKey, fileId);
    const data = Buffer.from(encryptData, 'hex');
    return await fileDecrypt(iv, fileKey, data);
}

