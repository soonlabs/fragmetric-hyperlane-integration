import {
  Cluster,
  generateSigner,
  percentAmount,
  publicKey,
  signerIdentity,
  some,
} from "@metaplex-foundation/umi";
import { AccountLoader, getAddr, getConnection, sendTxn, writeOneAddress } from "../../utils/utils";
import { ethers } from "ethers";
import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction,
  Transaction,
} from "@solana/web3.js";
import { getKeypairFromEnvironment } from "@solana-developers/node-helpers";
import {
  createBurnCheckedInstruction,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";

async function burnNft(params: { conn: Connection; owner: Keypair; mint: PublicKey }) {
  const tokenProgram = (await params.conn.getAccountInfo(params.mint))?.owner;

  if (!tokenProgram) {
    throw new Error("Token program not found");
  }

  const tokenAccount = getAssociatedTokenAddressSync(
    params.mint,
    params.owner.publicKey,
    true,
    tokenProgram
  );

  const burnIx = createBurnCheckedInstruction(
    tokenAccount,
    params.mint,
    params.owner.publicKey,
    1, // amount
    0, // decimals
    [],
    tokenProgram
  );

  let tx = new Transaction();
  tx.add(burnIx);
  await sendTxn(sendAndConfirmTransaction(params.conn, tx, [params.owner]), "burn NFT");
}

async function main() {
  const al = new AccountLoader();
  const mint = new PublicKey("");

  // const owner = al.getKeypairFromEnvironmentDecrypt("ADMIN");
  const owner = getKeypairFromEnvironment("OWNER");
  const conn = getConnection();

  await burnNft({ conn, owner, mint });
}

if (require.main === module) {
  main();
}
