import { RestakingProgram } from "@fragmetric-labs/sdk";
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
import { convertIinstructionToInstruction, getLookupTableAddress } from "./utils";

export async function wrap({
  user,
  conn,
  assetAmount,
}: {
  user: PublicKey;
  conn: Connection;
  assetAmount: bigint;
}) {
  const restaking = RestakingProgram.mainnet();

  const userObj = restaking.fragSOL.user(user.toBase58());

  const rawTx = await userObj.wrap.assemble({
    receiptTokenAmount: assetAmount,
    receiptTokenAmountAsTargetBalance: false,
  });

  const instructions = rawTx.instructions.map(convertIinstructionToInstruction);
  const tx = new Transaction().add(...instructions);

  // get lookup table address
  const lookupTableAddress = getLookupTableAddress(rawTx.instructions as any);

  const lookupTableAccounts = await Promise.all(
    lookupTableAddress.map(
      async (address) => (await conn.getAddressLookupTable(new PublicKey(address))).value
    )
  );

  // construct a v0 compatible transaction `Message`
  const messageV0 = new TransactionMessage({
    payerKey: user,
    recentBlockhash: (await conn.getLatestBlockhash()).blockhash,
    instructions: tx.instructions, // note this is an array of instructions
  }).compileToV0Message(lookupTableAccounts.filter((account) => account !== null));

  // create a v0 transaction from the v0 message
  const transactionV0 = new VersionedTransaction(messageV0);

  // await sendTxn(conn.sendTransaction(transactionV0, { skipPreflight: false }), "wrap");
  return { tx, lutLs: lookupTableAddress, signers: [] };
}

async function main() {
  const conn = getConnection();
  const al = new AccountLoader();

  const user = al.getKeypairFromEnvironmentDecrypt("ADMIN");
  const assetAmount = BigInt(0.00001 * LAMPORTS_PER_SOL);
  console.log({ assetAmount });

  const { tx } = await wrap({ user: user.publicKey, conn, assetAmount });

  await sendTxn(conn.sendTransaction(tx, [user]), "wrap");
}

if (require.main === module) {
  main();
}
