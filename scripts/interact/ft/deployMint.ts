import {
  Cluster,
  generateSigner,
  percentAmount,
  publicKey,
  signerIdentity,
  some,
} from "@metaplex-foundation/umi";
import { AccountLoader, getConnection, writeOneAddress } from "../../utils/utils";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { createMint, initializeMint } from "@metaplex-foundation/mpl-toolbox";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import { createFungible, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";

async function deployMint() {
  const umi = createUmi(getConnection().rpcEndpoint, "finalized");
  const al = new AccountLoader();
  const admin = al.getMetaplexKeypairSignerFromEnv(umi, "ADMIN");
  umi.use(signerIdentity(admin)).use(mplTokenMetadata());

  const mint = generateSigner(umi);
  await createFungible(umi, {
    mint,
    name: "Tether USD",
    symbol: "USDT",
    uri: "https://ipfs.io/ipfs/QmcN7iRtugw7tQy3qXtEDKr5PrCCX2kevAX4gSXdUw9LVd",
    sellerFeeBasisPoints: percentAmount(0),
    decimals: some(6),
    authority: admin,
  }).sendAndConfirm(umi);

  writeOneAddress(new PublicKey(mint.publicKey), "USDT");
}

async function main() {
  deployMint();
}

if (require.main === module) {
  main();
}
