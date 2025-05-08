import { getConnection } from "../../utils/utils";
import bs58 from "bs58";

async function getTx() {
  const conn = getConnection();
  const tx = await conn.getTransaction(
    "5tKZN44x5kygr8excM4ZXqHdVPyiRbHjV52tySRWTbj1R6omnsf9wxmNq6R3AHMK4WfSZZNmfa5uLCMWo4xF57Gd",
    { maxSupportedTransactionVersion: 0 }
  );

  // console.log(JSON.stringify(tx, null, 2));

  console.log(bs58.decode("3xEFBf9DDCiB"));
}

async function main() {
  await getTx();
}

if (require.main === module) {
  main();
}
