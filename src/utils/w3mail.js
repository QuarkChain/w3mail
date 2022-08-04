import { encrypt } from '@metamask/eth-sig-util';
import {deriveDriveKey, deriveFileKey, driveDecrypt, driveEncrypt, fileEncrypt} from "@/utils/dirve/w3crypto";
import {FileContract} from "@/utils/contract";
import {ethers} from "ethers";
import {v4 as uuidv4} from "uuid";
import BigNumber from "bignumber.js";
const ascii85 = require('ascii85');

const stringToHex = (s) => ethers.utils.hexlify(ethers.utils.toUtf8Bytes(s));
const hexToString = (h) => ethers.utils.toUtf8String(h);

function createSignMessage(address, publicKey, networkId) {
    return `W3Mail wants you to sign in with your Ethereum account:\n${address}\n\n`+
        + 'URI: https://galileo.web3q.io/w3mail.w3q/\n'
        + 'Version: 1\n'
        + `Chain ID: ${networkId}\n`
        + `Nonce: ${publicKey}`;
}

export async function getEmailInfo(controller, account) {
    const fileContract = FileContract(controller);
    const result = await fileContract.getUserInfo(account);
    const publicKey = result.publicKey.substr(2, result.publicKey.length - 1);
    return {
        email: result.email !== "0x" ? hexToString(result.email) : 'none',
        publicKey: Buffer.from(publicKey, 'hex').toString('base64'),
        encrypt: result.encryptData !== "0x" ? result.encryptData : 'none',
        iv: result.iv !== "0x" ? hexToString(result.iv) : 'none',
    }
}

export async function getPublicKeyByEmail(controller, email) {
    const fileContract = FileContract(controller);
    email = stringToHex(email);
    const result = await fileContract.getPublicKeyByEmail(email);
    if (new BigNumber(result).toNumber() === 0) {
        return undefined;
    }
    const publicKey = result.substr(2, result.length - 1);
    return Buffer.from(publicKey, 'hex').toString('base64');
}

export async function getPublicKey(account) {
    try{
        return await window.ethereum.request({
            method: 'eth_getEncryptionPublicKey',
            params: [account],
        });
    } catch (e) {
        return undefined;
    }
}

export async function signInfo(address, publicKey, networkId) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    try {
        const message = createSignMessage(address, publicKey, networkId);
        return await signer.signMessage(message);
    } catch (e) {
        return undefined;
    }
}

export async function isRegistered(controller, email) {
    email = stringToHex(email);
    const fileContract = FileContract(controller);
    const address = await fileContract.emailList(email);
    return address !== '0x0000000000000000000000000000000000000000';
}

export async function register(controller, publicKey, signature, email, password) {
    // create key
    const driveKey = await deriveDriveKey(signature, password);
    // encrypt public key
    const driveEncryptData = await driveEncrypt(driveKey, publicKey);
    const hexData = '0x' + driveEncryptData.data.toString('hex');
    const iv = stringToHex(driveEncryptData.cipherIV);

    publicKey = '0x' + Buffer.from(publicKey, 'base64').toString('hex');
    email = stringToHex(email);
    const fileContract = FileContract(controller);
    const tx = await fileContract.register(publicKey, email, hexData, iv);
    const receipt = await tx.wait();
    if (receipt.status) {
        return driveKey;
    }
    return "";
}

export async function encryptDrive(signature, password, encryptData, iv) {
    // create key
    const rootKey = await deriveDriveKey(signature, password);
    encryptData = encryptData.substr(2, encryptData.length - 1);
    const data = Buffer.from(encryptData, 'hex');
    try {
        await driveDecrypt(iv, rootKey, data);
        return rootKey;
    } catch (e) {
        return undefined;
    }
}

// email send & receive
// publicKey: base64, data: Buffer|string : return Buffer
function encryptEmailKey(publicKey, data) {
    // Returned object contains 4 properties: version, ephemPublicKey, nonce, ciphertext
    // Each contains data encoded using base64, version is always the same string
    const enc = encrypt({
        publicKey: publicKey,
        data: ascii85.encode(data).toString(),
        version: 'x25519-xsalsa20-poly1305',
    });

    // We want to store the data in smart contract, therefore we concatenate them
    // into single Buffer
    const buf = Buffer.concat([
        Buffer.from(enc.ephemPublicKey, 'base64'),
        Buffer.from(enc.nonce, 'base64'),
        Buffer.from(enc.ciphertext, 'base64'),
    ]);

    // In smart contract we are using `bytes[112]` variable (fixed size byte array)
    // you might need to use `bytes` type for dynamic sized array
    // We are also using ethers.js which requires type `number[]` when passing data
    // for argument of type `bytes` to the smart contract function
    // Next line just converts the buffer to `number[]` required by contract function
    // THIS LINE IS USED IN OUR ORIGINAL CODE:
    // return buf.toJSON().data;

    // Return just the Buffer to make the function directly compatible with decryptData function
    return buf;
}

export async function sendEmail(controller, driveKey, publicKey, toEmail, title, message) {
    // create key
    const emailUuid = uuidv4();
    const emailKey = await deriveFileKey(driveKey, emailUuid);
    // encrypt email key by receive user public key
    const encryptKey = encryptEmailKey(publicKey, emailKey);
    // encrypt content
    const encryptResult = await fileEncrypt(emailKey, message);
    // data
    const encryptContent = Buffer.concat([
        encryptKey, // 126
        Buffer.from(encryptResult.cipherIV, 'base64'), // 12
        encryptResult.data,
    ]);

    const fileSize = Buffer.byteLength(encryptContent);
    let cost = 0;
    if (fileSize > 24 * 1024 - 326) {
        cost = Math.floor((fileSize + 326) / 1024 / 24);
    }

    const hexUuid = stringToHex(emailUuid);
    const hexToEmail = stringToHex(toEmail);
    const hexTitle = stringToHex(title);
    const hexData = '0x' + encryptContent.toString('hex');
    const fileContract = FileContract(controller);
    try {
        const tx = await fileContract.sendEmail(hexToEmail, hexUuid, hexTitle, hexData, '0x', {
            value: ethers.utils.parseEther(cost.toString())
        });
        const receipt = await tx.wait();
        return receipt.status;
    } catch (e) {
        console.log(e)
        return false;
    }
}




// account: string, data: Buffer): Promise<Buffer>
export async function decryptEmailKey(account, data) {
    // Reconstructing the original object outputed by encryption
    const structuredData = {
        version: 'x25519-xsalsa20-poly1305',
        ephemPublicKey: data.slice(0, 32).toString('base64'),
        nonce: data.slice(32, 56).toString('base64'),
        ciphertext: data.slice(56).toString('base64'),
    };
    // Convert data to hex string required by MetaMask
    const ct = `0x${Buffer.from(JSON.stringify(structuredData), 'utf8').toString('hex')}`;
    // Send request to MetaMask to decrypt the ciphertext
    // Once again application must have acces to the account
    const decrypt = await window.ethereum.request({
        method: 'eth_decrypt',
        params: [ct, account],
    });
    // Decode the base85 to final bytes
    return ascii85.decode(decrypt);
}

