import {
  AddressLookupTableProgram,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { AccountLoader, getAddr, getConnection, sendTxn, writeOneAddress } from "../../utils/utils";

async function extendLookupTable({
  lutAuthority,
  addrs,
  lookupTableAddress,
}: {
  lutAuthority: Keypair;
  addrs: PublicKey[];
  lookupTableAddress: PublicKey;
}) {
  const conn = getConnection();

  // Get the current slot using a helper function from @solana/web3.js
  const slot = await conn.getSlot();

  // loop to extend lookup table
  // filter duplicate addrs
  addrs = [...new Set(addrs)];
  {
    let offset = 0;
    while (offset < addrs.length) {
      const extendInstruction = AddressLookupTableProgram.extendLookupTable({
        payer: lutAuthority.publicKey, // The payer of transaction fees
        authority: lutAuthority.publicKey, // The authority to extend the lookup table
        lookupTable: lookupTableAddress, // Address of the lookup table to extend
        addresses: addrs.slice(offset, offset + 30), // Add up to 30 addresses per instruction
      });

      // Create the transaction message
      const message = new TransactionMessage({
        payerKey: lutAuthority.publicKey, // Public key of the payer account
        recentBlockhash: (await conn.getLatestBlockhash()).blockhash, // Most recent blockhash
        instructions: [extendInstruction], // Transaction instructions
      }).compileToV0Message();

      // Create the versioned transaction from the compiled message
      const tx = new VersionedTransaction(message);

      // Sign the transaction with the payer's keypair
      tx.sign([lutAuthority]);

      await sendTxn(
        conn.sendTransaction(tx, { preflightCommitment: "confirmed" }),
        `extend lookup table ${offset} to ${offset + 30}`
      );
      offset += 30;
    }
  }
}

async function main() {
  const al = new AccountLoader();
  const admin = al.getKeypairFromEnvironmentDecrypt("ADMIN");
  const lutAuthority = admin;

  const lookupTableAddress = await getAddr("LOOKUP_TABLE");

  const addrs = [
    "11111111111111111111111111111111",
    "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV",
    "BjWvsUakX74ZutdRnwvBhDz2um9b9kNXwkGHqGtvhpFg",
    "E588QtVUvresuXq2KoNEwAmoifCzYGpRBdHByN9KQMbi",
    "BvZpTuYLAR77mPhH4GtvwEWUTs53GQqkgBNuXpCePVNk",
    "5xgpS1UkLJhDgtLhCpTBsKLgDWXiRt2zmMFoYTvZh8MF",
    "13iFD5HFatKjA88AG5qwZtGUtyLhKeza8EcdaASStxsQ",
    "2YXnzXVp2Z4SUSgnxD4YtS2pKmmBguQN96m6fi5VgmG6",
    "4Qetf95RRgM8WUrkJD5EucguPYpbhyTmjCLx1i8exJ34",
    "BhNcatUDC2D5JTyeaqrdSukiVFsEHK7e3hVmKMztwefv",
    "8Cv4PHJ6Cf3xY7dse7wYeZKtuQv9SAN6ujt5w22a2uho",
    "FFJtLgEJWRZHjNUz34T7pw635rGyRm4Bx1RgcewjdZzd",
    "AkeHBbE5JkwVppujCQQ6WuxsVsJtruBAjUo6fDCFp6fF",
    "JAvHW21tYXE9dtdG83DReqU2b4LUexFuCbtJT5tF8X6M",
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "WFRGSWjaz8tbAxsJitmbfRuFV2mSNwy7BMWcCwaA28U",
    "BBwus2mdWxyNMXHLeSBVnyR9N8uh3GBtaz5iUsb88H27",
    "PMST7CMBeJubWwhieuTvjgyEEwH8FLdNorZdvMJ3aVA",
  ];

  await extendLookupTable({
    lutAuthority,
    addrs: addrs.map((v) => new PublicKey(v)),
    lookupTableAddress,
  });
}

if (require.main === module) {
  main();
}
