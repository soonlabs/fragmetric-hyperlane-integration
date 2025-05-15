import { getConnection } from "../../utils/utils";

async function getBlock() {
  const conn = getConnection();

  console.log(
    await conn.getBlock(339923608, {
      maxSupportedTransactionVersion: 0,
    })
  );
}

async function main() {
  await getBlock();
}

if (require.main === module) {
  main();
}
