import { createPublicClient, http, defineChain } from 'viem';

/** Base Sepolia details */
export const BASE_SEPOLIA = defineChain({
    id: 84532,
    name: 'Base Sepolia',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH'
    },
    rpcUrls: {
        default: {
            http: ['https://public.stackup.sh/api/v1/node/base-sepolia'],
            webSocket: ['wss://base-sepolia-rpc.publicnode.com']
        }
    },
    blockExplorers: {
        default: { name: 'Basescan Sepolia', url: 'https://sepolia-explorer.base.org' }
    }
});

/** Instantiates a Base Sepolia client instance */
export const BASE_SEPOLIA_CLIENT = createPublicClient({
    chain: BASE_SEPOLIA,
    transport: http()
});