import {
  Cluster,
  generateSigner,
  KeypairSigner,
  percentAmount,
  publicKey,
  signerIdentity,
  some,
} from "@metaplex-foundation/umi";
import { AccountLoader, getAddr, getConnection, sendTxn, writeOneAddress } from "../../utils/utils";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createMint, initializeMint } from "@metaplex-foundation/mpl-toolbox";
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, Transaction } from "@solana/web3.js";
import { mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import {
  createFungible,
  mintV1,
  mplTokenMetadata,
  TokenStandard,
  transferV1,
} from "@metaplex-foundation/mpl-token-metadata";
import { ethers } from "ethers";
import bs58 from "bs58";
import {
  fromWeb3JsKeypair,
  fromWeb3JsPublicKey,
  toWeb3JsKeypair,
  toWeb3JsLegacyTransaction,
  toWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";

async function transferToken(params: {
  tokenMint: PublicKey;
  from: KeypairSigner;
  to: KeypairSigner;
  amount: bigint;
}) {
  // const user = al.getMetaplexKeypairSignerFromEnv(umi, "USER_1");
  // const to = publicKey("BBDaDzjgVtpbjcs2apMszoMSSp5MksXq52JT8G81wXpm");

  const tx = new Transaction();
  tx.add(
    createTransferInstruction(
      getAssociatedTokenAddressSync(params.tokenMint, toWeb3JsPublicKey(params.from.publicKey)),
      getAssociatedTokenAddressSync(params.tokenMint, toWeb3JsPublicKey(params.to.publicKey)),
      toWeb3JsPublicKey(params.from.publicKey),
      params.amount
    )
  );

  const conn = getConnection();
  await sendTxn(
    conn.sendTransaction(tx, [toWeb3JsKeypair(params.from)]),
    `transfer ${params.amount.toString()} to ${params.to}`
  );
}

async function main() {
  const umi = createUmi(getConnection().rpcEndpoint, "finalized");
  const al = new AccountLoader();
  const from = al.getMetaplexKeypairSignerFromEnv(umi, "ADMIN");
  const to = al.getMetaplexKeypairSignerFromEnv(umi, "USER_1");
  const tokenMint = new PublicKey();
  const decimals = 9;
  const amount = 10;
  const amountDecimalFormat = ethers.parseUnits(amount.toString(), decimals);
  transferToken({
    tokenMint: al.getMetaplexKeypairSignerFromEnv(umi, "TOKEN_MINT").publicKey,
    from,
    to,
    amount: amountDecimalFormat,
  });
}

if (require.main === module) {
  main();
}
