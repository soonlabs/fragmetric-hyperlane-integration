import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { config } from "dotenv";
import { AccountLoader, getConnection, logAccountInfo, sendTxn } from "../../utils/utils";
config();

async function main() {
  const connection = getConnection();

  const accountLoader = new AccountLoader();

  const senderKeyPair = accountLoader.getKeypairFromEnvironmentDecrypt("ADMIN");
  await logAccountInfo(senderKeyPair.publicKey.toBase58(), "sender");

  const to = new PublicKey("13iFD5HFatKjA88AG5qwZtGUtyLhKeza8EcdaASStxsQ");
  await logAccountInfo(to.toBase58(), "to");

  const transaction = new Transaction();

  const LAMPORTS_TO_SEND = 0.119 * LAMPORTS_PER_SOL;

  const sendSolInstruction = SystemProgram.transfer({
    fromPubkey: senderKeyPair.publicKey,
    toPubkey: to,
    lamports: LAMPORTS_TO_SEND,
  });

  transaction.add(sendSolInstruction);

  await sendTxn(
    sendAndConfirmTransaction(connection, transaction, [senderKeyPair]),
    `transfer sol to ${to}`
  );
}

main();
