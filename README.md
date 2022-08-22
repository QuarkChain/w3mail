# W3Mail

## Introduction
W3Mail is a decentralized email based on the Web3Q chain. This email enables anyone to send or receive mail without permission. 
There are two types of emails: plaintext and ciphertext. Plaintext emails can be sent to any wallet address, while ciphertext emails 
can only be sent to wallet addresses that have submitted public keys.
   
The official home page of the W3Mail project is https://web3q.io/w3mail.w3q/.


## Structure
The front-end code and all data of this project are stored on the blockchain to achieve complete decentralization of the website.
The project is implemented by two contracts, the front-end contract w3mail.w3q and the function contract SimpleW3Mail.

### w3mail.w3q
[w3mail.w3q](https://web3q.io/w3ns.w3q/#/domains/w3mail.w3q) is a w3ns domain name, which maps a contract address, 
the contract is a FlatDirectory contract that stores w3mail's website files.

FlatDirectory is the implementation of the web3 storage data contract. Click [here](https://docs.web3q.io/tutorials/migrate-your-website-to-web3q-in-5-mins) for details.

The flow chart is as follows:
![](public/diagram.jpg)

#### Public key
Emails are encrypted using a symmetric key, a symmetric key needs to be encrypted with the public key.
```
export async function getPublicKey(account) {
    try {
        return await window.ethereum.request({
            method: 'eth_getEncryptionPublicKey',
            params: [account],
        });
    } catch (e) {
        return undefined;
    }
}
```

#### Register
When a user registers, his public key is submitted to the blockchain, allowing other users to send him encrypted emails.
```
export async function register(contract, publicKey) {
    publicKey = '0x' + Buffer.from(publicKey, 'base64').toString('hex');
    const fileContract = FileContract(contract);
    const tx = await fileContract.register(publicKey);
    return await tx.wait();
}
```

#### Mail key
Each email has a unique id, and the id is used to generate a random mail key to encrypt the email.
```
export const deriveMailKey = async (rootKey, mailId) => {
    const seed = new Uint16Array(8);
    window.crypto.getRandomValues(seed);
    const info = Buffer.from(parse(mailId));
    const fileKey = hkdf(seed.buffer, keyByteLength, {info, hash: keyHash});
    return urlEncodeHashKey(mailId);
}
```

#### Encrypt Mail key
Call the encryption function in "metamask" to encrypt the mail key with the public key.
```
import {encrypt} from '@metamask/eth-sig-util';

function encryptEmailKey(publicKey, data) {
    // Returned object contains 4 properties: version, ephemPublicKey, nonce, ciphertext
    // Each contains data encoded using base64, version is always the same string
    const enc = encrypt({
        publicKey: publicKey,
        data: ascii85.encode(data).toString(),
        version: 'x25519-xsalsa20-poly1305',
    });
    return Buffer.concat([
        Buffer.from(enc.ephemPublicKey, 'base64'),
        Buffer.from(enc.nonce, 'base64'),
        Buffer.from(enc.ciphertext, 'base64'),
    ]);
}
```

#### Send Mail
Generate the mail key, encrypt the mail key with the public key of the sender and recipient, and encrypt the content of the mail with the mail key.

The length of the encrypted mail key is fixed at 112 bits, and they are spliced before the content of the mail and uploaded to the blockchain.
```
export async function sendEmail(emailId, driveKey, sendPublicKey, receivePublicKey, toAddress, title, message, fileId) {
    const emailKey = await deriveMailKey(driveKey, emailId);
    // encrypt email key by receive user public key
    const encryptSendKey = encryptEmailKey(sendPublicKey, Buffer.from(emailKey, 'base64'));
    const encryptReceiveKey = encryptEmailKey(receivePublicKey, Buffer.from(emailKey, 'base64'));
    // encrypt content
    const encryptResult = await mailEncrypt(emailKey, message);
    // data
    const encryptContent = Buffer.concat([
        encryptSendKey, // 112
        encryptReceiveKey, // 112
        Buffer.from(encryptResult.cipherIV, 'base64'), // 12
        encryptResult.data,
    ]);
    hexData = '0x' + encryptContent.toString('hex');

    const fileContract = FileContract(controller);
    const tx = await fileContract.sendEmail(toAddress, true, emailId, title, hexData, fileId, {
        value: ethers.utils.parseEther(cost.toString())
    });
    return await tx.wait();
}
```

#### Decrypt Mail Key
```
async function decryptMailKey(account, data) {
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
```

#### Read Mail
Get the mail content from the contract, intercept the encrypted mail key in the content header according to the sender or recipient, 
and call "metamask" to decrypt the mail key.
```
export async function getEmailMessageByUuid(contract, account, isEncryption, types, fromMail, uuid) {
    const fileContract = FileContract(contract);
    const content = await fileContract.getEmailContent(fromMail, uuid, 0);
    const data = Buffer.from(content, 'hex');
    let mailKeyData;
    if (types === '1') {
        mailKeyData = data.slice(112, 224); // inbox [112 - 224)
    } else {
        mailKeyData = data.slice(0, 112); // sendKey [0 - 112)
    }
    const encryptKey = await decryptMailKey(account, mailKeyData);
    const iv = data.slice(224, 236).toString('base64');
    const contentData = data.slice(236, data.length);
    const bf = await fileDecrypt(iv, encryptKey.toString('base64'), contentData);
    return {
        key: encryptKey.toString('base64'),
        content: bf.toString()
    };
}
```
<br>


### SimpleW3Mail
SimpleW3Mail is used to manage user mails.

#### Storage structure
```
contract SimpleW3Mail {
    struct User {
        bytes32 publicKey;
        address fdContract;
    
        Email[] sentEmails;
        mapping(bytes => uint256) sentEmailIds;
        Email[] inboxEmails;
        mapping(bytes => uint256) inboxEmailIds;
    
        mapping(bytes => File) files;
    }
    mapping(address => User) userInfos; // // User upload info mapping
}
```

#### Register
Before sending mails, you need to submit public key for registration, and receive a welcome mail.
```
function register(bytes32 publicKey) public {
    User storage user = userInfos[msg.sender];
    require(user.fdContract == address(0), "Address is registered");
    user.publicKey = publicKey;
    FlatDirectory fileContract = new FlatDirectory(0);
    user.fdContract = address(fileContract);

    // default email
    Email memory dEmail;
    dEmail.time = block.timestamp;
    dEmail.from = address(this);
    dEmail.to = msg.sender;
    dEmail.uuid = 'default-email';
    dEmail.title = 'Welcome to W3Mail!';
    // add email
    user.inboxEmails.push(dEmail);
    user.inboxEmailIds['default-email'] = 1;
}
```

#### Send
```
function sendEmail(
    address toAddress, 
    bool isEncryption, 
    bytes memory uuid, 
    bytes memory title, 
    bytes calldata encryptData, 
    bytes memory fileUuid
)
    public
    payable
    isRegistered
{
    User storage toInfo = userInfos[toAddress];
    require(!isEncryption || toInfo.fdContract != address(0), "Unregistered users can only send unencrypted emails");

    User storage fromInfo = userInfos[msg.sender];
    // create email
    Email memory email;
    email.isEncryption = isEncryption;
    ...
    email.fileUuid = fileUuid;

    // add email
    fromInfo.sentEmails.push(email);
    fromInfo.sentEmailIds[uuid] = fromInfo.sentEmails.length;
    toInfo.inboxEmails.push(email);
    toInfo.inboxEmailIds[uuid] = toInfo.inboxEmails.length;

    // write email
    FlatDirectory fileContract = FlatDirectory(fromInfo.fdContract);
    fileContract.writeChunk{value: msg.value}(getNewName(uuid, 'message'), 0, encryptData);
}
```

#### Inbox
```
function getInboxEmails() public view
    returns (
        bool[] memory isEncryptions,
        uint256[] memory times,
        address[] memory fromMails,
        address[] memory toMails,
        bytes[] memory uuids,
        bytes[] memory titles,
        bytes[] memory fileUuids,
        bytes[] memory fileNames
        )
    {
        User storage info = userInfos[msg.sender];
        uint256 length = info.inboxEmails.length;
        isEncryptions = new bool[](length);
        ...
        fileNames = new bytes[](length);
        for (uint256 i; i < length; i++) {
            isEncryptions[i] = info.inboxEmails[i].isEncryption;
            ...
            fileUuids[i] = info.inboxEmails[i].fileUuid;
            fileNames[i] = userInfos[fromMails[i]].files[fileUuids[i]].name;
        }
    }
```

#### Content of Mail
The email context and attachments are stored in the sender's contract. If the sender deletes the email, 
the recipient will no longer be able to see the email.
```
function getEmailContent(address fromEmail, bytes memory uuid, uint256 chunkId) public view returns(bytes memory data) {
    if(fromEmail == address(this) &&  keccak256(uuid) == keccak256('default-email')) {
        // default mail context
        return bytes(defaultEmail);
    }
    FlatDirectory fileContract = FlatDirectory(userInfos[fromEmail].fdContract);
    (data, ) = fileContract.readChunk(getNewName(uuid, bytes('message')), chunkId);
}
```
