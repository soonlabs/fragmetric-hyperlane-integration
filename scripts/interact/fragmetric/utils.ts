import { AccountRole, IInstruction } from "@solana/instructions";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";

export function convertIinstructionToInstruction(instruction: IInstruction) {
  return new TransactionInstruction({
    keys:
      instruction.accounts?.map((account) => ({
        pubkey: new PublicKey(account.address),
        isSigner:
          account.role === AccountRole.WRITABLE_SIGNER ||
          account.role === AccountRole.READONLY_SIGNER,
        isWritable:
          account.role === AccountRole.WRITABLE || account.role === AccountRole.WRITABLE_SIGNER,
      })) ?? [],
    data: instruction.data ? Buffer.from(instruction.data) : undefined,
    programId: new PublicKey(instruction.programAddress),
  });
}

export function getLookupTableAddress(instructions: IInstruction[]) {
  const lookupTableAddress = new Set<string>();
  for (const instruction of instructions) {
    if (instruction.accounts) {
      for (const account of instruction.accounts) {
        // if account has key lookupTableAddress
        if ("lookupTableAddress" in account) {
          lookupTableAddress.add(account.lookupTableAddress);
        }
      }
    }
  }

  return Array.from(lookupTableAddress);
}
