import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getConnection } from "../../utils/utils";

async function main() {
  const connection = getConnection();

  const rent = await connection.getMinimumBalanceForRentExemption(1308);

  const total = rent + 5440;

  console.log({ total: total / LAMPORTS_PER_SOL });
}

main();
