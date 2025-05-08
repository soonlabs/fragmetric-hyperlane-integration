// @ts-ignore
// Using dynamic import for ES modules
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
// import { AccountLoader, getConnection } from "../../utils/utils";
import fs from "fs";
import {
  MultiProtocolProvider,
  SealevelHypTokenAdapter,
  SealevelOverheadIgpAdapter,
  Token,
  TokenStandard,
  WarpCore,
} from "@hyperlane-xyz/sdk";
import {
  solanamainnet,
  soon,
  solanamainnetAddresses,
  soonAddresses,
} from "@hyperlane-xyz/registry";
import yaml from "yaml";
import { ethers } from "ethers";
import { AccountLoader, getConnection, sendTxn } from "../../utils/utils";
import assert from "assert";

export async function bridgeWfragSolFromSolanaToSoon({
  conn,
  sender,
  recipient,
  bridgeAmount,
  destination,
}: {
  conn: Connection;
  sender: PublicKey;
  recipient: PublicKey;
  bridgeAmount: bigint;
  destination: string;
}) {
  const multiProvider = new MultiProtocolProvider({
    solanamainnet: Object.assign({}, solanamainnet, { mailbox: solanamainnetAddresses.mailbox }),
    soon: Object.assign({}, soon, { mailbox: soonAddresses.mailbox }),
  });

  const warpRouteConfig = yaml.parse(
    fs.readFileSync("./warp_route/warp-core-config.yaml", "utf-8")
  );

  const warpCore = new WarpCore(
    multiProvider,
    warpRouteConfig.tokens.map((token: any) => new Token(token))
  );

  const solanaWfragSol = warpCore.tokens.filter(
    (token) => token.chainName === "solanamainnet" && token.symbol === "wfragSOL"
  )[0];

  const txs = await warpCore.getTransferRemoteTxs({
    originTokenAmount: solanaWfragSol.amount(bridgeAmount),
    destination,
    sender: sender.toBase58(),
    recipient: recipient.toBase58(),
  });

  let bridgeTx = txs[0].transaction as Transaction;

  // replace the random wallet in the original bridgeTx
  const randomWallet = Keypair.generate();

  {
    const hypAdapter = solanaWfragSol.getHypAdapter(
      warpCore.multiProvider,
      destination
    ) as SealevelHypTokenAdapter;
    const mailBox = new PublicKey(hypAdapter.addresses.mailbox);
    const igp = await hypAdapter.getIgpKeys();

    const originalRandomWallet = bridgeTx.instructions[2].keys[7].pubkey;
    const originalMessageStoragePda = hypAdapter.deriveMsgStorageAccount(
      mailBox,
      originalRandomWallet
    );
    const newMessageStoragePda = hypAdapter.deriveMsgStorageAccount(
      mailBox,
      randomWallet.publicKey
    );

    // replace the original random wallet with the new random wallet
    assert(
      bridgeTx.instructions[2].keys[7].pubkey.equals(originalRandomWallet),
      "original random wallet should equal"
    );
    bridgeTx.instructions[2].keys[7].pubkey = randomWallet.publicKey;

    // replace the original message storage pda with the new message storage pda
    assert(
      bridgeTx.instructions[2].keys[8].pubkey.equals(originalMessageStoragePda),
      "original message storage pda should equal"
    );
    bridgeTx.instructions[2].keys[8].pubkey = newMessageStoragePda;

    if (igp) {
      const originalGasPaymentPda = SealevelOverheadIgpAdapter.deriveGasPaymentPda(
        igp.programId,
        originalRandomWallet
      );
      const newGasPaymentPda = SealevelOverheadIgpAdapter.deriveGasPaymentPda(
        igp.programId,
        randomWallet.publicKey
      );

      assert(
        bridgeTx.instructions[2].keys[11].pubkey.equals(originalGasPaymentPda),
        "original gas payment pda should equal"
      );
      bridgeTx.instructions[2].keys[11].pubkey = newGasPaymentPda;
    }
  }

  // clear signatures of tx and only keep the bridge instruction
  const newBridgeTx = new Transaction().add(bridgeTx.instructions[2]);

  newBridgeTx.feePayer = sender;

  // await sendTxn(conn.sendTransaction(newBridgeTx, [sender, randomWallet]), "bridge wfragSOL");

  return { tx: newBridgeTx, signers: [randomWallet], lutLs: [] };
}

async function main() {
  const conn = getConnection();
  const al = new AccountLoader();
  const sender = al.getKeypairFromEnvironmentDecrypt("ADMIN");
  const bridgeAmount = ethers.utils.parseUnits("0.000001", 9).toBigInt();
  const destination = "soon";

  await bridgeWfragSolFromSolanaToSoon({
    conn,
    sender: sender.publicKey,
    recipient: sender.publicKey,
    bridgeAmount,
    destination,
  });
}

if (require.main === module) {
  main();
}
