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
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

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
  const fragSolMint = new PublicKey("FRAGSEthVFL7fdqM8hxfxkfCZzUvmg21cqPJVvC1qdbo");

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

  let mintedTokenAmount = BigInt(0);

  {
    // simulate the transaction to get minted fragSol amount
    const simulation = await conn.simulateTransaction(transactionV0, {
      sigVerify: false,
      innerInstructions: true,
    });

    if (!simulation.value.innerInstructions) {
      throw new Error("innerInstructions is null");
    }

    // iterate inner instructions to get mintTo
    let mintToIns: any[] = [];
    for (const innerInstruction of simulation.value.innerInstructions) {
      for (const instruction of innerInstruction.instructions) {
        if (
          instruction.programId.equals(TOKEN_2022_PROGRAM_ID) &&
          (instruction as any).parsed.type === "mintTo"
        ) {
          mintToIns.push(instruction);
        }
      }
    }

    if (mintToIns.length != 1) {
      throw new Error("mintToIns length is not 1");
    }

    const mintIns = mintToIns[0];

    if (
      !new PublicKey((mintIns as any).parsed.info.mint).equals(fragSolMint) ||
      !new PublicKey((mintIns as any).parsed.info.account).equals(
        getAssociatedTokenAddressSync(fragSolMint, user, false, TOKEN_2022_PROGRAM_ID)
      )
    ) {
      throw new Error("mintIns is not a mintTo instruction");
    }

    mintedTokenAmount = BigInt((mintIns as any).parsed.info.amount);
  }

  // await sendTxn(conn.sendTransaction(transactionV0), "restake");

  return { tx, lutLs: lookupTableAddress, signers: [], mintedTokenAmount, transactionV0 };
}

async function main() {
  const conn = getConnection();
  const al = new AccountLoader();

  const user = al.getKeypairFromEnvironmentDecrypt("USER_1");
  // const assetMint = null; // null means SOL
  const assetMint = "Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B";
  const assetAmount = BigInt(0.0001 * LAMPORTS_PER_SOL);

  const { tx, mintedTokenAmount, transactionV0, lutLs } = await restake({
    user: user.publicKey,
    conn,
    assetMint,
    assetAmount,
  });

  console.log({ mintedTokenAmount, lutLs });

  // {
  //   transactionV0.sign([user]);
  //   await sendTxn(conn.sendTransaction(transactionV0), "restake");
  // }

  // await sendTxn(conn.sendTransaction(tx, [user]), "restake");
}

if (require.main === module) {
  main();
}
