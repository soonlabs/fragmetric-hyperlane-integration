import { restake } from "./restake";
import { bridgeWfragSolFromSolanaToSoon } from "./bridgeWfragSolFromSolanaToSoon";
import { AccountLoader, getConnection, sendTxn } from "../../utils/utils";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { wrap } from "./wrap";

async function pipeline({
  user,
  conn,
  assetMint,
  assetAmount,
}: {
  user: PublicKey;
  conn: Connection;
  assetMint: string | null;
  assetAmount: bigint;
}) {
  const {
    tx: restakeTx,
    lutLs: restakeLutLs,
    signers: restakeSigners,
  } = await restake({
    user,
    conn,
    assetMint,
    assetAmount,
  });

  const {
    tx: wrapTx,
    lutLs: wrapLutLs,
    signers: wrapSigners,
  } = await wrap({
    user,
    conn,
    assetAmount: BigInt(0.000001 * LAMPORTS_PER_SOL),
  });

  const {
    tx: bridgeWfragSolTx,
    lutLs: bridgeWfragSolLutLs,
    signers: bridgeWfragSolSigners,
  } = await bridgeWfragSolFromSolanaToSoon({
    conn,
    sender: user,
    recipient: user,
    bridgeAmount: BigInt(0.000001 * LAMPORTS_PER_SOL),
    destination: "soon",
  });

  const tx = new Transaction().add(restakeTx, wrapTx, bridgeWfragSolTx);

  // filter unique lookup table addresses
  const uniqueLutLs = [...new Set([...restakeLutLs, ...wrapLutLs, ...bridgeWfragSolLutLs])];

  // get lookup table accounts
  const lookupTableAccounts = await Promise.all(
    uniqueLutLs.map(
      async (address) => (await conn.getAddressLookupTable(new PublicKey(address))).value
    )
  );

  const messageV0 = new TransactionMessage({
    payerKey: user,
    recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
    instructions: tx.instructions, // note this is an array of instructions
  }).compileToV0Message(lookupTableAccounts.filter((account) => account !== null));

  const transactionV0 = new VersionedTransaction(messageV0);

  // filter unique signers
  const uniqueSigners = [...new Set([...restakeSigners, ...wrapSigners, ...bridgeWfragSolSigners])];

  // delete sender from unique signers
  const signersExceptForSender = uniqueSigners.filter((signer) => !signer.publicKey.equals(user));

  transactionV0.sign(signersExceptForSender);

  return { tx: transactionV0 };
}

async function main() {
  const conn = getConnection();
  const al = new AccountLoader();
  const user = al.getKeypairFromEnvironmentDecrypt("ADMIN");
  const assetMint = null;
  const assetAmount = BigInt(0.001 * LAMPORTS_PER_SOL);
  const { tx } = await pipeline({ user: user.publicKey, conn, assetMint, assetAmount });

  tx.sign([user]);

  await sendTxn(conn.sendTransaction(tx), "pipeline");
}

if (require.main === module) {
  main();
}
