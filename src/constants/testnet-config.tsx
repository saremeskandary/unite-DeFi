// Testnet Configuration for 1inch Integration
export interface TestnetConfig {
    ethereum: {
        network: 'sepolia' | 'goerli';
        rpcUrl: string;
        chainId: number;
        explorer: string;
    };
    bitcoin: {
        network: 'testnet';
        rpcUrl: string;
        explorer: string;
    };
    tokens: {
        usdc: string;
        wbtc: string;
        weth: string;
    };
}

// Sepolia Testnet Configuration
export const SEPOLIA_CONFIG: TestnetConfig = {
    ethereum: {
        network: 'sepolia',
        rpcUrl: 'https://sepolia.infura.io/v3/',
        chainId: 11155111,
        explorer: 'https://sepolia.etherscan.io',
    },
    bitcoin: {
        network: 'testnet',
        rpcUrl: 'http://localhost:18332',
        explorer: 'https://testnet.blockchain.info',
    },
    tokens: {
        // Sepolia testnet token addresses
        usdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC on Sepolia
        wbtc: '0x29f2D40B060490436847878FEB7BDE9b230230a2', // WBTC on Sepolia
        weth: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', // WETH on Sepolia
    },
};

// Goerli Testnet Configuration (alternative)
export const GOERLI_CONFIG: TestnetConfig = {
    ethereum: {
        network: 'goerli',
        rpcUrl: 'https://goerli.infura.io/v3/',
        chainId: 5,
        explorer: 'https://goerli.etherscan.io',
    },
    bitcoin: {
        network: 'testnet',
        rpcUrl: 'http://localhost:18332',
        explorer: 'https://testnet.blockchain.info',
    },
    tokens: {
        // Goerli testnet token addresses
        usdc: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F', // USDC on Goerli
        wbtc: '0xC04B0d3107736C32e19F1c62b2aF67BE61d63a05', // WBTC on Goerli
        weth: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', // WETH on Goerli
    },
};

export function getTestnetConfig(network: 'sepolia' | 'goerli' = 'sepolia'): TestnetConfig {
    return network === 'sepolia' ? SEPOLIA_CONFIG : GOERLI_CONFIG;
}

export function get1inchTestnetUrl(network: 'sepolia' | 'goerli' = 'sepolia'): string {
    // 1inch API supports testnets through the same endpoint
    // The network is determined by the chainId parameter in requests
    return 'https://api.1inch.dev';
}

export function getChainId(network: 'sepolia' | 'goerli' = 'sepolia'): number {
    return network === 'sepolia' ? 11155111 : 5;
} 