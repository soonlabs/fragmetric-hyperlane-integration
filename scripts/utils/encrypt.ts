import * as forge from "node-forge";
import * as fs from "fs";
import * as path from "path";
import * as readlineSync from "readline-sync";
import * as crypto from "crypto";
import * as CryptoJS from "crypto-js";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";

// Function to securely prompt for password
export function promptForPassword(promptMessage: string): string {
  return readlineSync.question(promptMessage, {
    hideEchoBack: true, // The input is hidden
    mask: "*", // No mask character is displayed
  });
}

export function generateAndSavePrivateKey(keyPath: string, randomString: string) {
  const password = promptForPassword("enter key to encrypt the private key\n");

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
export function loadSymmetricKey(
  keyPath: string = "/Users/senn/.sennKey/blockchain/key.enc"
): Buffer {
  const password = promptForPassword("enter key to decrypt the private key\n : ");

  const encryptedKey = fs.readFileSync(keyPath, "utf-8");

  // Decrypt the key using the password
  const decryptedKeyHex = CryptoJS.AES.decrypt(encryptedKey, password).toString(CryptoJS.enc.Utf8);

  if (!decryptedKeyHex) {
    throw new Error("Incorrect password or corrupted key.");
  }

  return Buffer.from(decryptedKeyHex, "hex");
}

// Function to encrypt a message using the symmetric key
export function encryptMessage(message: string, key: Buffer): string {
  const iv = crypto.randomBytes(16); // Initialization vector

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(message, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return the IV and encrypted message as a combined string
  return iv.toString("hex") + ":" + encrypted;
}

// Function to decrypt a message using the symmetric key
export function decryptMessage(encryptedMessage: string, key: Buffer): string {
  const [ivHex, encryptedData] = encryptedMessage.split(":");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

async function test() {
  const keyPath = "/Users/senn/.sennKey/blockchain/key.enc";
  generateAndSavePrivateKey(keyPath, "senn 9o0q.");
  const pk = loadSymmetricKey(keyPath);

  const message = "hello world";

  const encryptedMsg = encryptMessage(message, pk);
  const decryptedMsg = decryptMessage(encryptedMsg, pk);
  console.log({ message, encryptedMsg, decryptedMsg });
}

if (require.main === module) {
  test();
}
