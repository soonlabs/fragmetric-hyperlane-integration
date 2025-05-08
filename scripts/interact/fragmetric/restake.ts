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

export async function restake({
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
  const restaking = RestakingProgram.mainnet();

  // user constructor accepts: null | string | Address | TransactionSigner | () => Promise<null | string | Address | TransactionSigner>
  // so we can resolve user address in lazy way.
  const userObj = restaking.fragSOL.user(user.toBase58());

  const rawTx = await userObj.deposit.assemble({
    assetMint, // null means SOL
    assetAmount,
    metadata: null,
    applyPresetComputeUnitLimit: true,
  });

  const instructions = rawTx.instructions.map(convertIinstructionToInstruction);
  const tx = new Transaction().add(...instructions);

  // get lookup table address
  const lookupTableAddress = getLookupTableAddress(rawTx.instructions as any);
  // console.log({ lookupTableAddress, ins: tx.instructions });

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

  // await sendTxn(conn.sendTransaction(transactionV0, { skipPreflight: false }), "restake");
  return { tx, lutLs: lookupTableAddress, signers: [] };
}

async function main() {
  const conn = getConnection();
  const al = new AccountLoader();

  const user = al.getKeypairFromEnvironmentDecrypt("ADMIN");
  const assetMint = null; // null means SOL
  const assetAmount = BigInt(0.001 * LAMPORTS_PER_SOL);

  const { tx } = await restake({ user: user.publicKey, conn, assetMint, assetAmount });

  await sendTxn(conn.sendTransaction(tx, [user]), "restake");
}

if (require.main === module) {
  main();
}
