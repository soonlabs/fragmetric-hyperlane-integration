import { PublicKey } from "@solana/web3.js";
import { getConnection } from "../../utils/utils";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

async function getAccount() {
  const conn = getConnection();

  const account = await conn.getAccountInfo(
    new PublicKey("FRAGSEthVFL7fdqM8hxfxkfCZzUvmg21cqPJVvC1qdbo")
  );

  console.log(account?.owner);
}

async function main() {
  await getAccount();
}

if (require.main === module) {
  main();
}
