import { getConnection } from "../../utils/utils";

async function getBlock() {
  const conn = getConnection();

  let height = 480200;

  console.log(await conn.getBlockHeight())
}

async function main() {
  await getBlock();
}

if (require.main === module) {
  main();
}
