import {
  Cluster,
  generateSigner,
  percentAmount,
  publicKey,
  signerIdentity,
  some,
} from "@metaplex-foundation/umi";
import { AccountLoader, getAddr, getConnection, writeOneAddress } from "../../utils/utils";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createMint, initializeMint } from "@metaplex-foundation/mpl-toolbox";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import {
  createFungible,
  mintV1,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { ethers } from "ethers";

async function deployMint() {
  const umi = createUmi(getConnection().rpcEndpoint, "finalized");
  const al = new AccountLoader();
  const admin = al.getMetaplexKeypairSignerFromEnv(umi, "ADMIN");
  // const user = al.getMetaplexKeypairSignerFromEnv(umi, "USER_1");
  // const to = publicKey("BBDaDzjgVtpbjcs2apMszoMSSp5MksXq52JT8G81wXpm");
  const to = admin.publicKey;
  umi.use(signerIdentity(admin)).use(mplTokenMetadata());

  const mint = await getAddr("USDT");
  const amount = ethers.utils.parseUnits("1000000", 6);

  await mintV1(umi, {
    mint: publicKey(mint),
    authority: admin,
    amount: amount.toBigInt(),
    tokenOwner: to,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi);
}

async function main() {
  deployMint();
}

if (require.main === module) {
  main();
}
