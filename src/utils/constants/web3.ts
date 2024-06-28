import { createPublicClient, http, defineChain, createWalletClient, getContract, PrivateKeyAccount } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import path from 'path';

import * as dotenv from 'dotenv';
dotenv.config();

/** Base Sepolia details */
const BASE_SEPOLIA = defineChain({
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

/** Instantiates a wallet client given an `account` for Base Sepolia */
export const WALLET_CLIENT = (account: PrivateKeyAccount) => createWalletClient({
    chain: BASE_SEPOLIA,
    transport: http(),
    account
});

/** Instantiates the deployer's account */
export const DEPLOYER_ACCOUNT = privateKeyToAccount(`0x${process.env.DEPLOYER_PRIVATE_KEY!}`);
/** Instantiates a user's account given their `privateKey` */
export const USER_ACCOUNT = (privateKey: string) => privateKeyToAccount(`0x${privateKey}`);

/** Fetches the Wonderchamps contract's ABI */
export const WONDERCHAMPS_ABI = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, '../../abi/Wonderchamps.json')
    ).toString()
);


/** Instantiates the Wonderchamps contract instance */
export const WONDERCHAMPS_CONTRACT = (account: PrivateKeyAccount) => getContract({
    address: `0x${process.env.WONDERCHAMPS_CONTRACT_ADDRESS_NO_0x!}`,
    abi: WONDERCHAMPS_ABI,
    client: {
        public: BASE_SEPOLIA_CLIENT,
        wallet: WALLET_CLIENT(account)
    }
});