import { ethers } from "ethers";
import { FileContract } from "./contract";
import { v4 as uuidv4} from 'uuid';
import {deriveFileKey, fileEncrypt} from "@/utils/w3crypto";

const stringToHex = (s) => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(s));

const readFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (res) => {
      resolve(Buffer.from(res.target.result));
    };
    reader.readAsArrayBuffer(file);
  });
}

const bufferChunk = (buffer, chunkSize) => {
  let i = 0;
  let result = [];
  const len = buffer.length;
  const chunkLength = Math.ceil(len / chunkSize);
  while (i < len) {
    result.push(buffer.slice(i, i += chunkLength));
  }
  return result;
}

export const request = async ({
  driveKey,
  emailUuid,
  contractAddress,
  file,
  onSuccess,
  onError,
  onProgress
}) => {
  let account;
  try {
    account = await window.ethereum.enable();
    if (!account) {
      onError(new Error("Can't get Account"));
      return;
    }
  } catch (e) {
    onError(new Error("Can't get Account"));
    return;
  }

  const fileUuid = uuidv4();
  const emailKey = await deriveFileKey(driveKey, emailUuid);
  // read file
  const rawFile = file.raw;
  const data = await readFile(rawFile);
  // encrypt file
  const encryptResult = await fileEncrypt(emailKey, data);
  const content = Buffer.concat([
    Buffer.from(encryptResult.cipherIV, 'base64'), // 12
    encryptResult.data,
  ]);

  // Data need to be sliced if file > 475K
  let fileSize = content.length;
  let chunks = [];
  if (fileSize > 475 * 1024) {
    const chunkSize = Math.ceil(fileSize / (475 * 1024));
    chunks = bufferChunk(content, chunkSize);
    fileSize = fileSize / chunkSize;
  } else {
    chunks.push(content);
  }

  // file name
  const hexUuid = stringToHex(fileUuid);
  const hexName = stringToHex(rawFile.name);

  const fileContract = FileContract(contractAddress);
  let uploadState = true;
  let notEnoughBalance = false;
  for (const index in chunks) {
    const chunk = chunks[index];
    let cost = 0;
    if (fileSize > 24 * 1024 - 326) {
      cost = Math.floor((fileSize + 326) / 1024 / 24);
    }
    const hexData = '0x' + chunk.toString('hex');
    try {
      const balance = await fileContract.provider.getBalance(account[0]);
      if(balance.lte(ethers.utils.parseEther(cost.toString()))){
        // not enough balance
        uploadState = false;
        notEnoughBalance = true;
        break;
      }

      // file is remove or change
      const tx = await fileContract.writeChunk(hexUuid, hexName, index, hexData, {
        value: ethers.utils.parseEther(cost.toString())
      });
      console.log(`Transaction Id: ${tx.hash}`);
      const receipt = await tx.wait();
      if (!receipt.status) {
        uploadState = false;
        break;
      }
      onProgress({ percent: Number(index) + 1});
    } catch (e) {
      uploadState = false;
      break;
    }
  }
  if (uploadState) {
    onSuccess({ uuid: fileUuid});
  } else {
    if (notEnoughBalance) {
      onError(new NotEnoughBalance('Not enough balance'));
    } else {
      onError(new Error('upload request failed!'));
    }
  }
};

export class NotEnoughBalance extends Error {}
