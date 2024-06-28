import { createPublicClient, http, defineChain, createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

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
    transport: http(),
    batch: {
        multicall: true
    }
});

/** Instantiates a generic wallet client for Base Sepolia */
export const WALLET_CLIENT = createWalletClient({
    chain: BASE_SEPOLIA,
    transport: http()
});

/** Instantiates the deployer's account */
export const DEPLOYER_ACCOUNT = privateKeyToAccount(`0x${process.env.DEPLOYER_PRIVATE_KEY!}`);
/** Instantiates a user's account given their `privateKey` */
export const USER_ACCOUNT = (privateKey: string) => privateKeyToAccount(`0x${privateKey}`);