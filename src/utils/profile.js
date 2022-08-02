import {FileContract} from "./contract";
import {decryptFile} from "./dirve/w3drive";
import {ethers} from "ethers";
const hexToString = (h) => ethers.utils.toUtf8String(h);

// contract
export const getUploadByAddress = async (contract) => {
    const fileContract = FileContract(contract);
    const result = await fileContract.getFileInfos();
    const files = [];
    const times = result[0];
    const uuids = result[1];
    const names = result[2];
    const types = result[3];
    for (let i = 0; i < uuids.length; i++) {
        const file = {
            time: new Date(parseInt(times[i], 10) * 1000),
            uuid: uuids[i],
            name: names[i],
            type: types[i],
            showProgress: false
        };
        files.push(file);
    }
    files.sort(function (a, b) {
        return a.time - b.time
    });
    return files;
}

export const deleteFile = async (contract, uuid) => {
    const fileContract = FileContract(contract);
    const tx = await fileContract.remove(uuid);
    const receipt = await tx.wait();
    return receipt.status;
}

export const deleteFiles = async (contract, uuids) => {
    const fileContract = FileContract(contract);
    const tx = await fileContract.removes(uuids);
    const receipt = await tx.wait();
    return receipt.status;
}

export const getFile = async (contract, driveKey, uuid) => {
    const fileContract = FileContract(contract);
    const fileInfo  = await fileContract.getFileInfo(uuid);
    // file not upload success
    if (fileInfo.realChunkCount.toNumber() !== fileInfo.chunkCount.toNumber()) {
        return {
            name: fileInfo.name,
            time: new Date(parseInt(fileInfo.time, 10) * 1000),
            type: fileInfo.fileType,
            isFail: true
        }
    }

    const fileType = hexToString(fileInfo.fileType);
    if (fileType.includes('image')) {
        const quest = [];
        for (let i = 0; i < fileInfo.chunkCount.toNumber(); i++) {
            quest.push(fileContract.getFile(uuid, i));
        }
        const encryptDatas = await Promise.all(quest);
        let encryptData = '';
        for (let data of encryptDatas) {
            data = data.substr(2, data.length - 1);
            encryptData = encryptData + data;
        }
        uuid = hexToString(uuid);
        const iv = hexToString(fileInfo.iv);
        const data = await decryptFile(driveKey, uuid, encryptData, iv);
        return {
            name: fileInfo.name,
            time: new Date(parseInt(fileInfo.time, 10) * 1000),
            type: fileInfo.fileType,
            data,
        }
    }
    return {
        name: fileInfo.name,
        time: new Date(parseInt(fileInfo.time, 10) * 1000),
        type: fileInfo.fileType,
        chunkCount: fileInfo.chunkCount.toNumber(),
        iv: hexToString(fileInfo.iv),
    }
}

export const downloadFile = async (contract, driveKey, uuid, iv, count) => {
    const fileContract = FileContract(contract);
    const quest = [];
    for (let i = 0; i < count; i++) {
        quest.push(fileContract.getFile(uuid, i));
    }
    const encryptDatas = await Promise.all(quest);
    let encryptData = '';
    for (let data of encryptDatas) {
        data = data.substr(2, data.length - 1);
        encryptData = encryptData + data;
    }

    // decrypt
    uuid = hexToString(uuid);
    return await decryptFile(driveKey, uuid, encryptData, iv);
}
