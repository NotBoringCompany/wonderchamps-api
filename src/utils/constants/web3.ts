import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

import * as dotenv from 'dotenv';
dotenv.config();

/** Base Sepolia Provider instance */
export const BASE_SEPOLIA_PROVIDER = new ethers.providers.JsonRpcProvider('https://public.stackup.sh/api/v1/node/base-sepolia');

/** Deployer wallet instance */
export const DEPLOYER_WALLET = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, BASE_SEPOLIA_PROVIDER);

export const WONDERCHAMPS_CONTRACT_ADDRESS = process.env.WONDERCHAMPS_CONTRACT_ADDRESS!;

/** Fetches the Wonderchamps contract's ABI */
export const WONDERCHAMPS_ABI = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, '../../abi/Wonderchamps.json')
    ).toString()
);

/** Instantiates the Wonderchamps contract with the deployer wallet */
export const WONDERCHAMPS_CONTRACT = new ethers.Contract(
    WONDERCHAMPS_CONTRACT_ADDRESS,
    WONDERCHAMPS_ABI,
    DEPLOYER_WALLET
);

/** Instantiates the Wonderchamps contract with a user wallet */
export const WONDERCHAMPS_CONTRACT_USER = (privateKey: string) => {
    const wallet = new ethers.Wallet(privateKey, BASE_SEPOLIA_PROVIDER);

    return new ethers.Contract(
        WONDERCHAMPS_CONTRACT_ADDRESS,
        WONDERCHAMPS_ABI,
        wallet
    );
}