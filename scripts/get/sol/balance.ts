import { Connection, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from "@solana/web3.js";

async function main() {
  // establish connection to the cluster
  const url = clusterApiUrl("testnet");
  const connection = new Connection(url);

  const address = new PublicKey("CenYq6bDRB7p73EjsPEpiYN7uveyPUTdXkDkgUduboaN");

  const balance = await connection.getBalance(address);

  const balanceInSol = balance / LAMPORTS_PER_SOL;

  console.log({ balanceInSol });
}

main();
