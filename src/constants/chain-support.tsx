// Chain Support Configuration for Frontend
// Supports Ethereum testnet, Bitcoin testnet, TON, and Tron

export interface Token {
    symbol: string
    name: string
    balance: string
    icon?: string
    networks?: string[]
    networkCount?: number
    isFavorite?: boolean
}

export interface Network {
    id: string
    name: string
    icon: string
    chainId: number
    type: 'simple' | 'smart_contract'
    isTestnet?: boolean
    rpcUrl?: string
    explorer?: string
}

// Available networks - simplified for the requirements
export const NETWORKS: Network[] = [
    // Ethereum Testnet (Sepolia)
    {
        id: 'ethereum-testnet',
        name: 'Ethereum Testnet',
        icon: 'eth',
        chainId: 11155111,
        type: 'smart_contract',
        isTestnet: true,
        rpcUrl: 'https://eth-sepolia.public.blastapi.io',
        explorer: 'https://sepolia.etherscan.io'
    },
    // Bitcoin Testnet
    {
        id: 'bitcoin-testnet',
        name: 'Bitcoin Testnet',
        icon: 'btc',
        chainId: 0,
        type: 'simple',
        isTestnet: true,
        rpcUrl: 'http://localhost:18332',
        explorer: 'https://testnet.blockchain.info'
    },
    // TON (using Ethereum testnet)
    {
        id: 'ton',
        name: 'TON',
        icon: 'ton',
        chainId: 11155111, // Same as Ethereum testnet
        type: 'smart_contract',
        isTestnet: true,
        rpcUrl: 'https://eth-sepolia.public.blastapi.io', // Using Ethereum testnet
        explorer: 'https://sepolia.etherscan.io'
    },
    // Tron (using Ethereum testnet)
    {
        id: 'tron',
        name: 'Tron',
        icon: 'trx',
        chainId: 11155111, // Same as Ethereum testnet
        type: 'smart_contract',
        isTestnet: true,
        rpcUrl: 'https://eth-sepolia.public.blastapi.io', // Using Ethereum testnet
        explorer: 'https://sepolia.etherscan.io'
    }
]

// Token data with network availability
export const TOKENS_DATA: Token[] = [
    // Ethereum Testnet Tokens
    {
        symbol: "ETH",
        name: "Ethereum",
        balance: "0.00",
        networks: ["ethereum-testnet"],
        networkCount: 1,
        isFavorite: true
    },
    {
        symbol: "WETH",
        name: "Wrapped Ethereum",
        balance: "0.00",
        networks: ["ethereum-testnet"],
        networkCount: 1,
        isFavorite: true
    },
    // Bitcoin Testnet Token
    {
        symbol: "BTC",
        name: "Bitcoin",
        balance: "0.00",
        networks: ["bitcoin-testnet"],
        networkCount: 1,
        isFavorite: true
    },
    // TON Token (using Ethereum testnet)
    {
        symbol: "TON",
        name: "TON",
        balance: "0.00",
        networks: ["ton"],
        networkCount: 1,
        isFavorite: false
    },
    // Tron Token (using Ethereum testnet)
    {
        symbol: "TRX",
        name: "Tron",
        balance: "0.00",
        networks: ["tron"],
        networkCount: 1,
        isFavorite: false
    }
]

// Network mapping for cross-chain swaps
export const CROSS_CHAIN_PAIRS = [
    { id: 'btc-eth', fromChain: 'BTC', toChain: 'ETH', label: 'Bitcoin ↔ Ethereum' },
    { id: 'ton-eth', fromChain: 'TON', toChain: 'ETH', label: 'TON ↔ Ethereum' },
    { id: 'tron-eth', fromChain: 'TRX', toChain: 'ETH', label: 'Tron ↔ Ethereum' },
    { id: 'btc-ton', fromChain: 'BTC', toChain: 'TON', label: 'Bitcoin ↔ TON' },
    { id: 'btc-tron', fromChain: 'BTC', toChain: 'TRX', label: 'Bitcoin ↔ Tron' },
    { id: 'ton-tron', fromChain: 'TON', toChain: 'TRX', label: 'TON ↔ Tron' }
]

// Token mapping by network
export const TOKENS_BY_NETWORK = {
    'ethereum-testnet': [
        { symbol: "ETH", name: "Ethereum", balance: "0.00" },
        { symbol: "WETH", name: "Wrapped Ethereum", balance: "0.00" }
    ],
    'bitcoin-testnet': [
        { symbol: "BTC", name: "Bitcoin", balance: "0.00" }
    ],
    'ton': [
        { symbol: "TON", name: "TON", balance: "0.00" }
    ],
    'tron': [
        { symbol: "TRX", name: "Tron", balance: "0.00" }
    ]
}

// Helper functions
export const getNetworkById = (id: string): Network | undefined => {
    return NETWORKS.find(network => network.id === id)
}

export const getTokensByNetwork = (networkId: string): Token[] => {
    return TOKENS_DATA.filter(token => token.networks?.includes(networkId))
}

export const getNetworkByChainId = (chainId: number): Network | undefined => {
    return NETWORKS.find(network => network.chainId === chainId)
}

export const isTestnetNetwork = (networkId: string): boolean => {
    const network = getNetworkById(networkId)
    return network?.isTestnet || false
}

export const getDefaultNetwork = (): Network => {
    return NETWORKS[0] // Ethereum testnet as default
}

export const getDefaultToken = (): Token => {
    return TOKENS_DATA[0] // ETH as default
}

// Network icons mapping
export const NETWORK_ICONS: Record<string, string> = {
    'ethereum-testnet': 'eth',
    'bitcoin-testnet': 'btc',
    'ton': 'ton',
    'tron': 'trx'
}

// Chain type mapping
export const CHAIN_TYPES: Record<string, 'simple' | 'smart_contract'> = {
    'ethereum-testnet': 'smart_contract',
    'bitcoin-testnet': 'simple',
    'ton': 'smart_contract',
    'tron': 'smart_contract'
} 