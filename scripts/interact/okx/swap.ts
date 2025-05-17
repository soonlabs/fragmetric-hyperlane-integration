// DexClient.ts
import { OKXDexClient } from "@okx-dex/okx-dex-sdk";
import "dotenv/config";
import { AccountLoader, getConnection } from "../../utils/utils";
import { createWallet } from "@okx-dex/okx-dex-sdk/dist/core/wallet";
import bs58 from "bs58";
import { ethers } from "ethers";
import { Connection, Keypair } from "@solana/web3.js";

/**
 * Example: Execute a swap from SOL to USDC
 */
async function executeSwap({
  conn,
  client,
  user,
  tokenIn,
  tokenOut,
  amount,
  slippage,
  chainId,
  tokenDecimals,
}: {
  conn: Connection;
  client: OKXDexClient;
  user: Keypair;
  tokenIn: string;
  tokenOut: string;
  amount: number;
  slippage: number;
  chainId: string;
  tokenDecimals: number;
}) {
  try {
    // Get quote to fetch token information
    console.log("Getting token information...");
    const quote = await client.dex.getQuote({
      chainId,
      fromTokenAddress: tokenIn,
      toTokenAddress: tokenOut,
      amount: ethers.utils.parseUnits(amount.toString(), tokenDecimals).toString(), // Small amount for quote
      slippage: slippage.toString(),
    });
    const tokenInfo = {
      fromToken: {
        symbol: quote.data[0].fromToken.tokenSymbol,
        decimals: parseInt(quote.data[0].fromToken.decimal),
        price: quote.data[0].fromToken.tokenUnitPrice,
      },
      toToken: {
        symbol: quote.data[0].toToken.tokenSymbol,
        decimals: parseInt(quote.data[0].toToken.decimal),
        price: quote.data[0].toToken.tokenUnitPrice,
      },
    };

    // Convert amount to base units (for display purposes)
    const rawAmount = ethers.utils
      .parseUnits(amount.toString(), tokenInfo.fromToken.decimals)
      .toString();
    console.log("\nSwap Details:");
    console.log("--------------------");
    console.log(`From: ${tokenInfo.fromToken.symbol}`);
    console.log(`To: ${tokenInfo.toToken.symbol}`);
    console.log(`Amount: ${amount} ${tokenInfo.fromToken.symbol}`);
    console.log(`Amount in base units: ${rawAmount}`);
    console.log(
      `Approximate USD value: $${(amount * parseFloat(tokenInfo.fromToken.price)).toFixed(2)}`
    );

    // Execute the swap
    console.log("\nExecuting swap...");
    const swapResult = await client.dex.executeSwap({
      chainId,
      fromTokenAddress: tokenIn,
      toTokenAddress: tokenOut,
      amount: rawAmount,
      slippage: slippage.toString(),
      userWalletAddress: user.publicKey.toBase58(),
    });
    console.log("Swap executed successfully:");
    console.log(JSON.stringify(swapResult, null, 2));

    return swapResult;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error executing swap:", error.message);
      // API errors include details in the message
      if (error.message.includes("API Error:")) {
        const match = error.message.match(/API Error: (.*)/);
        if (match) console.error("API Error Details:", match[1]);
      }
    }
    throw error;
  }
}

async function main() {
  // Validate environment variables
  const requiredEnvVars = ["OKX_API_KEY", "OKX_SECRET_KEY", "OKX_API_PASSPHRASE", "OKX_PROJECT_ID"];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // load wallet
  const al = new AccountLoader();
  const user = al.getKeypairFromEnvironmentDecrypt("USER_1");
  const conn = getConnection();

  // create okx sdk wallet object
  const userWallet = createWallet(bs58.encode(user.secretKey), conn);

  // Initialize the client
  const client = new OKXDexClient({
    apiKey: process.env.OKX_API_KEY!,
    secretKey: process.env.OKX_SECRET_KEY!,
    apiPassphrase: process.env.OKX_API_PASSPHRASE!,
    projectId: process.env.OKX_PROJECT_ID!,
    solana: {
      wallet: userWallet,
      computeUnits: 300000,
      maxRetries: 3,
    },
  });

  // define swap parameters
  const amount = 0.00001;
  const tokenIn = "11111111111111111111111111111111";
  const tokenOut = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const slippage = 0.5; // 0.5% slippage
  const chainId = "501"; // solana chain id
  const tokenDecimals = 9;

  // execute swap
  await executeSwap({
    client,
    user,
    tokenIn,
    tokenOut,
    amount,
    slippage,
    conn,
    chainId,
    tokenDecimals,
  });
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}
