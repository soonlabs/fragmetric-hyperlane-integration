import { Connection, GetProgramAccountsResponse, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getConnection } from "../../utils/utils";

async function getTokenAccountsOfMint(
  conn: Connection,
  mint: PublicKey
): Promise<
  {
    programOwner: string;
    address: string;
    tokenOwner: string;
    amount: bigint;
  }[]
> {
  enum AccountType {
    /// Marker for 0 data
    Uninitialized,
    /// Mint account with additional extensions
    Mint,
    /// Token holding account with additional extensions
    Account,
  }

  const TOKEN_ACC_SIZE = 165;

  let totalAccs: GetProgramAccountsResponse = [];

  {
    const accs = await conn.getProgramAccounts(TOKEN_PROGRAM_ID, {
      dataSlice: { offset: 0, length: TOKEN_ACC_SIZE + 1 },
      filters: [{ dataSize: TOKEN_ACC_SIZE }, { memcmp: { offset: 0, bytes: mint.toBase58() } }],
    });

    totalAccs = totalAccs.concat(accs);
  }

  {
    let accs = await conn.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
      dataSlice: { offset: 0, length: TOKEN_ACC_SIZE + 1 },
      filters: [{ memcmp: { offset: 0, bytes: mint.toBase58() } }],
    });

    // filter out non-tokenAccount accounts
    accs = accs.filter((acc) => acc.account.data[TOKEN_ACC_SIZE] == AccountType.Account);

    totalAccs = totalAccs.concat(accs);
  }

  // Filter out zero balance accounts
  const nonZeroAccs = totalAccs.filter(
    (acc) => !acc.account.data.subarray(64, 64 + 8).equals(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]))
  );

  const finalAccs = nonZeroAccs.map((acc) => {
    return {
      programOwner: acc.account.owner.toBase58(),
      address: acc.pubkey.toBase58(),
      tokenOwner: new PublicKey(acc.account.data.subarray(32, 64)).toBase58(),
      amount: acc.account.data.subarray(64, 64 + 8).readBigUInt64LE(),
    };
  });

  return finalAccs;
}

async function main() {
  const conn = getConnection();
  console.log(
    await getTokenAccountsOfMint(
      conn,
      new PublicKey("71kRXzJMvSeArtXYNEWa8KAjpRJosdMQ7Dpgy5Jt5zfd")
    )
  );
}

main();
