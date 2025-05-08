import { TransactionSignature } from "@solana/web3.js";
import { randomBytes } from "crypto";
import { NETWORK_CONFIG, Explorer, DEFAULT_EXPLORER } from "../../solana.config";
const fs = require("fs");
const path = require("path");
import * as web3 from "@solana/web3.js";
import { createSignerFromKeypair, generateSigner, lamports, Umi } from "@metaplex-foundation/umi";
import { getKeypairFromEnvironment } from "@solana-developers/node-helpers";
import bs58 from "bs58";
import { decryptMessage, loadSymmetricKey } from "./encrypt";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import * as readlineSync from "readline-sync";
import * as crypto from "crypto";
import * as CryptoJS from "crypto-js";
import { base58 } from "@metaplex-foundation/umi/serializers";
require("dotenv").config();

// get contract addresses path
function getContractAddressesPath() {
  const network = getArgFromInput("network");

  // check network exists in config
  if (!Object.keys(NETWORK_CONFIG).includes(network)) {
    throw new Error("network not found in config");
  }

  return path.join(__dirname, "..", "..", "contractAddress", `contract-addresses-${network}.json`);
}

export async function getAddr(label: string): Promise<web3.PublicKey> {
  const addrs = await readAddresses();

  // check whether include
  if (!addrs[label]) {
    throw new Error("address not found");
  }

  return new web3.PublicKey(addrs[label]);
}

export async function readContractAddress(): Promise<Record<string, string>> {
  const path = getContractAddressesPath();
  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path));
  }
  return {};
}

export async function sendTxn(
  txnPromise: Promise<TransactionSignature>,
  label?: string,
  explorer?: Explorer
) {
  console.info(`Sending ${label}...`);
  const txHash = await txnPromise;

  showTxn(txHash, label, explorer);
  return txHash;
}

export function showTxn(txHash: string, label?: string, explorer?: Explorer) {
  // get network
  const network = getArgFromInput("network");

  // check network exists in config
  if (!Object.keys(NETWORK_CONFIG).includes(network)) {
    throw new Error("network not found in config");
  }

  // get network config
  const config = NETWORK_CONFIG[network];

  let explorerConfig;

  if (explorer == undefined || explorer == null) {
    explorer = DEFAULT_EXPLORER;
  }

  if (explorer == Explorer.Solscan) {
    explorerConfig = config.explorer["solscan"];
  } else if (explorer == Explorer.Fm) {
    explorerConfig = config.explorer["fm"];
  } else if (explorer == Explorer.Official) {
    explorerConfig = config.explorer["official"];
  } else {
    throw "wrong explorer name";
  }

  // get explorer from config
  const scanUrl = explorerConfig.explorer;
  const explorerParam = explorerConfig.explorerParam;

  console.info(`... Sent! ${scanUrl}tx/${txHash}${explorerParam ? explorerParam : ""}`);
}

// function decode args
export function decodeArgsFromInput(): Record<string, string> {
  const args = process.argv.slice(2);

  const argObject: Record<string, string> = {};

  // assert args length is even
  if (args.length % 2 !== 0) {
    throw new Error("args length should be even");
  }

  // decode args
  for (let i = 0; i < args.length; i += 2) {
    // args[i] is key, args[i+1] is value
    // args[i] should start with "--"
    if (!args[i].startsWith("--")) {
      throw new Error("args[i] should start with '--'");
    }

    // args[i+1] should not start with "--"
    if (args[i + 1].startsWith("--")) {
      throw new Error("args[i+1] should not start with '--'");
    }

    const key = args[i].slice(2);
    const value = args[i + 1];

    // check key and value is not empty
    if (!key || !value) {
      throw new Error("key and value should not be empty");
    }

    argObject[key] = value;
  }

  return argObject;
}

export function getArgFromInput(key: string): string {
  const argObject = decodeArgsFromInput();
  const value = argObject[key];

  // check value exists
  if (!value) {
    throw new Error("value should not be empty");
  }

  return value;
}

async function callWithRetries(func: any, args: any[], retriesCount = 10) {
  let i = 0;
  while (true) {
    i++;
    try {
      return await func(...args);
    } catch (ex: any) {
      if (i === retriesCount) {
        console.error("call failed %s times. throwing error", retriesCount);
        throw ex;
      }
      console.error("call i=%s failed. retrying....", i);
      console.error(ex.message);
    }
  }
}

function readAddresses() {
  const path = getContractAddressesPath();
  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path));
  }
  return {};
}

function writeAddresses(json: any) {
  const path = getContractAddressesPath();

  const currentAddresses = readAddresses();
  const ks = Object.keys(json);
  for (let i = 0; i < ks.length; i++) {
    if (currentAddresses[ks[i]]) {
      // use red color to indicate error
      console.log(`\x1b[31m%s\x1b[0m", "Error: key ${ks[i]} existed, exit process`);
      process.exit();
    }
  }

  const tmpAddresses = Object.assign(currentAddresses, json);
  fs.writeFileSync(path, JSON.stringify(tmpAddresses));
}

export function writeOneAddress(address: web3.PublicKey, label: string): web3.PublicKey {
  const json = {
    [label]: address.toBase58(),
  };

  writeAddresses(json);

  return address;
}

// fetch connection
export function getConnection() {
  // get network
  const network = getArgFromInput("network");

  // check network exists in config
  if (!Object.keys(NETWORK_CONFIG).includes(network)) {
    throw new Error("network not found in config");
  }

  // get network config
  const config = NETWORK_CONFIG[network];

  // connection
  const connection = new web3.Connection(config.rpc);

  return connection;
}

// log account info
export async function logAccountInfo(addr: string, label: string) {
  const connection = getConnection();

  // fetch balance
  const balance = await connection.getBalance(new web3.PublicKey(addr));

  // log
  console.log(`${label}: ${addr}, balance: ${balance / web3.LAMPORTS_PER_SOL}\n`);
}

// log transaction
export function logTx(txHash: string, label?: string, explorer?: Explorer) {
  // get network
  const network = getArgFromInput("network");

  // check network exists in config
  if (!Object.keys(NETWORK_CONFIG).includes(network)) {
    throw new Error("network not found in config");
  }

  // get network config
  const config = NETWORK_CONFIG[network];

  let explorerConfig;

  if (explorer == undefined || explorer == null) {
    explorer = DEFAULT_EXPLORER;
  }

  if (explorer == Explorer.Solscan) {
    explorerConfig = config.explorer["solscan"];
  } else if (explorer == Explorer.Fm) {
    explorerConfig = config.explorer["fm"];
  } else if (explorer == Explorer.Official) {
    explorerConfig = config.explorer["official"];
  } else {
    throw "wrong explorer name";
  }

  // get explorer from config
  const scanUrl = explorerConfig.explorer;
  const explorerParam = explorerConfig.explorerParam;

  console.info(`... Sent! ${label}: ${scanUrl}tx/${txHash}${explorerParam ? explorerParam : ""}`);
}

// log address
export function logAddr(addr: string, label?: string, explorer?: Explorer) {
  // get network
  const network = getArgFromInput("network");

  // check network exists in config
  if (!Object.keys(NETWORK_CONFIG).includes(network)) {
    throw new Error("network not found in config");
  }

  // get network config
  const config = NETWORK_CONFIG[network];

  let explorerConfig;

  if (explorer == undefined || explorer == null) {
    explorer = DEFAULT_EXPLORER;
  }

  if (explorer == Explorer.Solscan) {
    explorerConfig = config.explorer["solscan"];
  } else if (explorer == Explorer.Fm) {
    explorerConfig = config.explorer["fm"];
  } else {
    throw "wrong explorer name";
  }

  // get explorer from config
  const scanUrl = explorerConfig.explorer;
  const explorerParam = explorerConfig.explorerParam;

  console.info(
    `addr ${label}: ${scanUrl}address/${addr}/transactions${explorerParam ? explorerParam : ""}`
  );
}

export function getMetaplexKeypairFromEnv(umi: Umi, name: string) {
  return umi.eddsa.createKeypairFromSecretKey(getKeypairFromEnvironment(name).secretKey);
}
export function getMetaplexKeypairSignerFromEnv(umi: Umi, name: string) {
  return createSignerFromKeypair(
    umi,
    umi.eddsa.createKeypairFromSecretKey(getKeypairFromEnvironment(name).secretKey)
  );
}

export async function transferSol(
  connection: web3.Connection,
  from: web3.Signer,
  to: web3.PublicKey,
  lamports: number
) {
  var transaction = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to,
      lamports: lamports,
    })
  );
  // Sign transaction, broadcast, and confirm
  var signature = await web3.sendAndConfirmTransaction(connection, transaction, [from]);
  logTx(signature, "transfer", Explorer.Official);
}

export class AccountLoader {
  private _pk: Buffer;
  private static _keyPath: string = "/Users/senn/.sennKey/blockchain/key.enc";

  constructor(keyPath?: string) {
    this._pk = AccountLoader._loadSymmetricKey(keyPath ?? AccountLoader._keyPath);
  }

  private _getPk(): Buffer {
    return this._pk;
  }

  getKeypairFromEnvironmentDecrypt(name: string) {
    const secretKeyStringEncrypt = process.env[name];

    if (!secretKeyStringEncrypt) {
      throw new Error(`Please set '${name}' in environment.`);
    }

    const secretKeyString = AccountLoader._decryptMessage(secretKeyStringEncrypt, this._getPk());

    const decodedSecretKey = bs58.decode(secretKeyString);
    return web3.Keypair.fromSecretKey(decodedSecretKey);
  }

  getMetaplexKeypairFromEnv(umi: Umi, name: string) {
    return umi.eddsa.createKeypairFromSecretKey(
      this.getKeypairFromEnvironmentDecrypt(name).secretKey
    );
  }

  getMetaplexKeypairSignerFromEnv(umi: Umi, name: string) {
    return createSignerFromKeypair(
      umi,
      umi.eddsa.createKeypairFromSecretKey(this.getKeypairFromEnvironmentDecrypt(name).secretKey)
    );
  }

  // Function to securely prompt
  static _prompt(promptMessage: string): string {
    return readlineSync.question(promptMessage, {
      hideEchoBack: true, // The input is hidden
      mask: "*", // No mask character is displayed
    });
  }

  static generateAndSavePrivateKey(keyPath: string) {
    const password = AccountLoader._prompt("enter key to encrypt the private key\n");

    const randomString = AccountLoader._prompt("enter random seed to generate private key\n");

    // Generate RSA key pair
    const privateKeyHex = keccak256(
      toUtf8Bytes(
        crypto.randomBytes(32).toString("hex") +
          keccak256(toUtf8Bytes(randomString)) +
          new Date().getTime().toString()
      )
    ).slice(2);

    // Encrypt the key using AES
    const encryptedKey = CryptoJS.AES.encrypt(privateKeyHex, password).toString();

    // decrypt to check if the key is correct
    {
      const decryptedKeyHex = CryptoJS.AES.decrypt(encryptedKey, password).toString(
        CryptoJS.enc.Utf8
      );
      if (decryptedKeyHex !== privateKeyHex) {
        throw new Error("Failed to encrypt the private key.");
      }
    }

    // check if the file exists
    if (fs.existsSync(keyPath)) {
      throw new Error("Key already exists.");
    }

    fs.writeFileSync(keyPath, encryptedKey, {
      encoding: "utf-8",
      mode: 0o600,
    });

    console.log("Private key is encrypted with password and saved.");
  }

  // Function to load and decrypt the symmetric key
  static _loadSymmetricKey(keyPath: string): Buffer {
    const password = AccountLoader._prompt("enter key to decrypt the private key\n");

    const encryptedKey = fs.readFileSync(keyPath, "utf-8");

    // Decrypt the key using the password
    const decryptedKeyHex = CryptoJS.AES.decrypt(encryptedKey, password).toString(
      CryptoJS.enc.Utf8
    );

    if (!decryptedKeyHex) {
      throw new Error("Incorrect password or corrupted key.");
    }

    return Buffer.from(decryptedKeyHex, "hex");
  }

  // Function to encrypt a message using the symmetric key
  static _encryptMessage(message: string, key: Buffer): string {
    const iv = crypto.randomBytes(16); // Initialization vector

    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return the IV and encrypted message as a combined string
    return iv.toString("hex") + ":" + encrypted;
  }

  // Function to decrypt a message using the symmetric key
  static _decryptMessage(encryptedMessage: string, key: Buffer): string {
    const [ivHex, encryptedData] = encryptedMessage.split(":");
    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  static generateEncryptedKeySVM(counts: number = 16, keyPath?: string) {
    const pk = AccountLoader._loadSymmetricKey(keyPath ?? AccountLoader._keyPath);

    const seed = AccountLoader._prompt("enter random seed to generate private key\n");

    let count = 0;

    while (count < counts) {
      var source = keccak256(
        toUtf8Bytes(
          randomBytes(32).toString("hex") +
            keccak256(toUtf8Bytes(seed)) +
            new Date().getTime().toString()
        )
      );

      // Convert hex string to Uint8Array
      const privateKey = new Uint8Array(Buffer.from(source.slice(2), "hex"));

      // Create a Solana key pair
      const keypair = web3.Keypair.fromSeed(privateKey);

      console.log(
        `private key: ${AccountLoader._encryptMessage(
          bs58.encode(keypair.secretKey),
          pk
        )} #address: ${keypair.publicKey.toBase58()}`
      );

      count++;
    }
  }

  static generateEncryptedKeyFromRawKey(envKeyName: string, keyPath?: string) {
    const pk = AccountLoader._loadSymmetricKey(keyPath ?? AccountLoader._keyPath);

    // Convert hex string to Uint8Array
    const keypair = getKeypairFromEnvironment(envKeyName);

    console.log(
      `private key: ${AccountLoader._encryptMessage(
        bs58.encode(keypair.secretKey),
        pk
      )} #address: ${keypair.publicKey.toBase58()}`
    );
  }

  static decryptKey(encryptedKey: string, keyPath?: string) {
    const pk = AccountLoader._loadSymmetricKey(keyPath ?? AccountLoader._keyPath);

    const secretKeyString = AccountLoader._decryptMessage(encryptedKey, pk);

    const decodedSecretKey = bs58.decode(secretKeyString);
    const keyPair = web3.Keypair.fromSecretKey(decodedSecretKey);
    return {
      publicKey: keyPair.publicKey.toBase58(),
      secretKey: bs58.encode(keyPair.secretKey),
    };
  }
}

export class AddressManage {
  static isBase58 = (value: string) => /^[A-HJ-NP-Za-km-z1-9]*$/.test(value);
  static generateMetaplexSigner(umi: Umi, prefix?: string) {
    // check whether prefix matches the pattern
    if (prefix && !this.isBase58(prefix)) {
      throw new Error("prefix should be base58 encoded");
    }

    let count = 0;
    // loop until find a valid key
    while (true) {
      const acc = generateSigner(umi);

      if (prefix) {
        // clear the line in the console
        process.stdout.write(
          `\rfinding key with prefix: ${prefix}, round: ${count}, k: ${acc.publicKey.toString()}`
        );
        count++;
      }

      // check whether prefix matches the pattern
      if (prefix && !acc.publicKey.toString().toLowerCase().startsWith(prefix.toLowerCase())) {
        continue;
      }

      return acc;
    }
  }

  static generateWeb3Keypair(prefix?: string) {
    // check whether prefix matches the pattern
    if (prefix && !this.isBase58(prefix)) {
      throw new Error("prefix should be base58 encoded");
    }

    let count = 0;
    // loop until find a valid key
    while (true) {
      const acc = web3.Keypair.generate();

      if (prefix) {
        // clear the line in the console
        process.stdout.write(
          `\rfinding key with prefix: ${prefix}, round: ${count}, k: ${acc.publicKey.toString()}`
        );
        count++;
      }

      // check whether prefix matches the pattern
      if (prefix && !acc.publicKey.toBase58().toLowerCase().startsWith(prefix.toLowerCase())) {
        continue;
      }
      return acc;
    }
  }
}
