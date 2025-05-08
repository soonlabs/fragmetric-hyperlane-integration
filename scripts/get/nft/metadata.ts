import { fetchDigitalAsset, Metadata } from "@metaplex-foundation/mpl-token-metadata";

import { getConnection, getMetaplexKeypairSignerFromEnv } from "../../utils/utils";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { isSome, publicKey, Umi } from "@metaplex-foundation/umi";
import {
  ExtensionType,
  getAccount,
  getExtensionData,
  getExtensionTypes,
  getMint,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
require("dotenv").config();

/**
 * Fetch token metadata
 * @param {Umi} umi umi instance
 * @param {string} tokenMint token mint address
 * @return {Promise<Metadata>} token metadata
 */
export async function fetchTokenMetadata(umi: Umi, tokenMint: string): Promise<Metadata> {
  const asset = await fetchDigitalAsset(umi, publicKey(tokenMint));
  return asset.metadata;
}

async function main() {
  const connection = getConnection();
  const umi = createUmi(connection.rpcEndpoint, "finalized");

  const tokenMint = "HUEwXmxmPgPpeGhM4votRPQFFMLpsRkHZ1cX2sksEtE9";
  const metadata = await fetchTokenMetadata(umi, tokenMint);

  console.log({
    metadata,
    collection: metadata.collection,
    uri: metadata.uri,
  });
}

main();
