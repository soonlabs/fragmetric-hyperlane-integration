export enum Explorer {
  Official,
  Solscan,
  Fm,
}

export const DEFAULT_EXPLORER = Explorer.Official;

export const NETWORK_CONFIG: Record<
  string,
  {
    rpc: string;
    explorer: Record<string, { explorer: string; explorerParam: string }>;
  }
> = {
  "solana-mainnet": {
    // rpc: "https://api.mainnet-beta.solana.com",
    rpc: "https://hidden-light-dinghy.solana-mainnet.quiknode.pro/ff574d230bdfb5aa424f25fe4976975334a39a99/",
    explorer: {
      official: {
        explorer: "https://explorer.solana.com/",
        explorerParam: "",
      },
      solsacn: {
        explorer: "https://solscan.io/",
        explorerParam: "",
      },
      fm: {
        explorer: "https://solana.fm/",
        explorerParam: "?cluster=mainnet-alpha",
      },
    },
  },
  "solana-devnet": {
    rpc: "https://api.devnet.solana.com",
    explorer: {
      official: {
        explorer: "https://explorer.solana.com/",
        explorerParam: "?cluster=devnet",
      },
      solscan: {
        explorer: "https://solscan.io/",
        explorerParam: "?cluster=devnet",
      },
      fm: {
        explorer: "https://solana.fm/",
        explorerParam: "?cluster=devnet-solana",
      },
    },
  },
  "solana-testnet": {
    rpc: "https://api.testnet.solana.com",
    explorer: {
      official: {
        explorer: "https://explorer.solana.com/",
        explorerParam: "?cluster=testnet",
      },
      solscan: {
        explorer: "https://solscan.io/",
        explorerParam: "?cluster=testnet",
      },
      fm: {
        explorer: "https://solana.fm/",
        explorerParam: "?cluster=testnet-solana",
      },
    },
  },
  "soon-mainnet": {
    rpc: "https://rpc.mainnet.soo.network/rpc",
    explorer: {
      official: {
        explorer: "https://explorer.mainnet.soo.network/",
        explorerParam: "",
      },
      solscan: {
        explorer: "",
        explorerParam: "",
      },
      fm: {
        explorer: "",
        explorerParam: "",
      },
    },
  },
  "soon-devnet": {
    rpc: "https://rpc.devnet.soo.network/rpc",
    explorer: {
      official: {
        explorer: "https://explorer.devnet.soo.network/",
        explorerParam: "",
      },
      solscan: {
        explorer: "",
        explorerParam: "",
      },
      fm: {
        explorer: "",
        explorerParam: "",
      },
    },
  },
  "soon-testnet": {
    rpc: "https://rpc.testnet.soo.network/rpc",
    explorer: {
      official: {
        explorer: "https://explorer.testnet.soo.network/",
        explorerParam: "",
      },
      solscan: {
        explorer: "",
        explorerParam: "",
      },
      fm: {
        explorer: "",
        explorerParam: "",
      },
    },
  },
  "soon-dev0": {
    rpc: "https://rpc.dev0.soo.network/rpc",
    explorer: {
      official: {
        explorer: "https://explorer.devnet.soo.network/",
        explorerParam: "?cluster=dev0",
      },
      solscan: {
        explorer: "",
        explorerParam: "",
      },
      fm: {
        explorer: "",
        explorerParam: "",
      },
    },
  },
  "soon-dev1": {
    rpc: "https://rpc.dev1.soo.network/rpc",
    explorer: {
      official: {
        explorer: "https://explorer.devnet.soo.network/",
        explorerParam: "?cluster=dev1",
      },
      solscan: {
        explorer: "",
        explorerParam: "",
      },
      fm: {
        explorer: "",
        explorerParam: "",
      },
    },
  },
  "soon-qa": {
    rpc: "https://rpc.ops0.soo.network/rpc",
    explorer: {
      official: {
        explorer: "https://explorer.ops0.soo.network/",
        explorerParam: "",
      },
      solscan: {
        explorer: "",
        explorerParam: "",
      },
      fm: {
        explorer: "",
        explorerParam: "",
      },
    },
  },
  "soon-testnet-metaplex-test": {
    rpc: "https://rpc.testnet.soo.network/rpc",
    explorer: {
      official: {
        explorer: "https://explorer.testnet.soo.network/",
        explorerParam: "",
      },
      solscan: {
        explorer: "",
        explorerParam: "",
      },
      fm: {
        explorer: "",
        explorerParam: "",
      },
    },
  },
  "soon-mainnet-preview": {
    rpc: "https://rpc-preview.mainnet.soo.network/rpc/andrew-kIqQqG1npgwKLYHlqJ96SFFs1IUuiC1O",
    explorer: {
      official: {
        explorer: "https://explorer.devnet.soo.network/",
        explorerParam: "?cluster=dev1",
      },
      solscan: {
        explorer: "",
        explorerParam: "",
      },
      fm: {
        explorer: "",
        explorerParam: "",
      },
    },
  },
  "soon-svm-bnb-mainnet": {
    rpc: "https://rpc.svmbnbmainnet.soo.network/rpc",
    explorer: {
      official: {
        explorer: "https://explorer.svmbnbmainnet.soo.network/",
        explorerParam: "",
      },
      solscan: {
        explorer: "",
        explorerParam: "",
      },
      fm: {
        explorer: "",
        explorerParam: "",
      },
    },
  },
};
