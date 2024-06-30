import CryptoJS from 'crypto-js';
import { PrivateKeyAccount, encodePacked, keccak256 } from 'viem';
import { BASE_SEPOLIA_CLIENT, WALLET_CLIENT } from './constants/web3';

/**
 * Generates a random Object ID for MongoDB collections.
 */
export const generateObjectId = (): string => {
    const randomBytes = CryptoJS.lib.WordArray.random(16); // Generate 16 random bytes
    const id = CryptoJS.enc.Hex.stringify(randomBytes); // Convert random bytes to hex string

    return id;
}

/** Generates a WordArray of random bytes with length `length`. */
export const randomBytes = (length: number): string => CryptoJS.lib.WordArray.random(length).toString(CryptoJS.enc.Hex);

/**
 * Mocks a 65-byte signature.
 * 
 * Used primarily to estimate gas fees that would require a signature to be generated.
 */
export const MOCK_SIGNATURE = () => {
    const r = randomBytes(32);
    const s = randomBytes(32);
    const v = randomBytes(1);

    return `0x${r}${s}${v}`;
}

/**
 * Mocks a 32-byte salt.
 * 
 * Used primarily to estimate gas fees that would require a salt to be generated.
 */
export const MOCK_SALT = () => {
    const salt = randomBytes(32);

    return `0x${salt}`;
}

/**
 * Generates a salt for a user given the `address` and `timestamp`.
 */
export const generateSalt = (address: `0x${string}`, timestamp: number): `0x${string}` => {
    const salt = CryptoJS.SHA256(`${address}${timestamp}`).toString();

    return `0x${salt}`;
}

/**
 * Generates a data hash for a user given the `address` and `salt`.
 */
export const generateDataHash = (address: `0x${string}`, salt: `0x${string}`): `0x${string}` => {
    return keccak256(encodePacked(['address', 'bytes'], [address, salt]));
}

/**
 * Generates a signature for a user given the `dataHash` and `account`.
 */
export const generateSignature = async (dataHash: `0x${string}`, account: PrivateKeyAccount): Promise<`0x${string}`> => {
    const signature = await WALLET_CLIENT(account).signMessage({
        account,
        message: {
            raw: dataHash
        }
    });

    return signature;
}

/**
 * Verifies a signature for a user given the `dataHash`, `signature`, and `account`.
 */
export const verifySignature = async (dataHash: `0x${string}`, signature: `0x${string}`, account: PrivateKeyAccount): Promise<boolean> => {
    return await BASE_SEPOLIA_CLIENT.verifyMessage({
        address: account.address,
        message: {
            raw: dataHash,
        },
        signature
    });
}