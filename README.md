# Scripts to integrate with Fragmetric and Hyperlane

# Pipeline

The pipeline script packages the instructions for **sol** **restaking** , **fragSol**  **wrapping** , and **bridging wfragSol to Soon** into a single transaction.

```
ts-node scripts/interact/fragmetric/pipeline.ts  --network solana-mainnet               
```

# Restake sol

```
ts-node scripts/interact/fragmetric/restake.ts  --network solana-mainnet
```

# Wrap fragSol into wfragSol

```
ts-node scripts/interact/fragmetric/wrap.ts  --network solana-mainnet
```

# Bridge wfragSol from Solana to Soon

```
ts-node scripts/interact/fragmetric/bridgeWfragSolFromSolanaToSoon.ts  --network solana-mainnet
```

# Bridge wfragSol from Soon to Solana

```
ts-node scripts/interact/fragmetric/bridgeWfragSolFromSoonToSolana.ts  --network solana-mainnet
```
