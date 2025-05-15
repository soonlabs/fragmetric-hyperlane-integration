import {
  AddressLookupTableProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemInstruction,
  SystemProgram,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_SLOT_HASHES_PUBKEY,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { AccountLoader, getAddr, getConnection, sendTxn, writeOneAddress } from "../../utils/utils";
import {
  fetchCandyMachine,
  findCandyGuardPda,
  findCandyMachineAuthorityPda,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createNoopSigner, publicKey, signerIdentity } from "@metaplex-foundation/umi";
import { fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import {
  fetchDigitalAsset,
  findMasterEditionPda,
  findMetadataDelegateRecordPda,
  findMetadataPda,
  MetadataDelegateRole,
} from "@metaplex-foundation/mpl-token-metadata";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

async function createLookupTable({
  lutAuthority,
  addrs,
}: {
  lutAuthority: Keypair;
  addrs: PublicKey[];
}) {
  const conn = getConnection();

  // Get the current slot using a helper function from @solana/web3.js
  const slot = await conn.getSlot();

  // Create an instruction for creating a lookup table
  // and retrieve the address of the new lookup table
  const [lookupTableInst, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
    authority: lutAuthority.publicKey, // The authority to modify the lookup table
    payer: lutAuthority.publicKey, // The payer for transaction fees
    recentSlot: slot - 1, // The slot for lookup table address derivation
  });
  console.log("Lookup Table Address:", lookupTableAddress.toBase58());

  // create lookup table
  {
    // Create the transaction message
    const message = new TransactionMessage({
      payerKey: lutAuthority.publicKey, // Public key of the payer account
      recentBlockhash: (await conn.getLatestBlockhash()).blockhash, // Most recent blockhash
      instructions: [lookupTableInst], // Transaction instructions
    }).compileToV0Message();

    // Create the versioned transaction from the compiled message
    const tx = new VersionedTransaction(message);

    // Sign the transaction with the payer's keypair
    tx.sign([lutAuthority]);

    await sendTxn(
      conn.sendTransaction(tx, { preflightCommitment: "confirmed" }),
      "create lookup table"
    );
  }

  // sleep 1 minutes
  await new Promise((resolve) => setTimeout(resolve, 60000));

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

  writeOneAddress(lookupTableAddress, "LOOKUP_TABLE");

  return lookupTableAddress;
}

async function main() {
  const al = new AccountLoader();
  const admin = al.getKeypairFromEnvironmentDecrypt("ADMIN");

  const conn = getConnection();

  const lutAuthority = admin;

  const referLut = new PublicKey("HjNXH2HMfso5YU6U7McfhsbfoecGR5QTBAxTCSbFoYqy");
  const lutData = await conn.getAddressLookupTable(referLut);

  console.log({ lutData: lutData.value?.state });

  await createLookupTable({
    lutAuthority,
    addrs: [
      ...(lutData.value?.state.addresses.map((v) => new PublicKey(v)) as PublicKey[]),
      new PublicKey("Bybit2vBJGhPF52GBdNaQfUJ6ZpThSgHBobjWZpLPb4B"),
    ],
  });
}

if (require.main === module) {
  main();
}
