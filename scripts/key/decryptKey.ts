import { Keypair } from "@solana/web3.js";
import { AccountLoader } from "../utils/utils";
import bs58 from "bs58";

function decryptKey(encryptedKey: string) {
  console.log(AccountLoader.decryptKey(encryptedKey));
}

async function main() {
  decryptKey(
    "92d485258aee66f90a2e29dd52ddf2f2:7ad049cad5c81cf77c276f025fd512b026dd28b3e23bdf412203e2177c0f6eaeadd30ca88370312ea81d669630e4f6d502697be8743f5fb669e2ee93351bb2082d6386797c99bfa53df634302a4b65c55c9d0bc3b607ce9e8a084fc66626bb3e"
  );
}

if (require.main === module) {
  main();
}
