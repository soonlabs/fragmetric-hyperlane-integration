import { AccountLoader } from "../utils/utils";

async function generateNewKeys(count: number) {
  AccountLoader.generateEncryptedKeySVM(count);
}

async function main() {
  generateNewKeys(5);
}

if (require.main === module) {
  main();
}
