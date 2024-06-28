import CryptoJS from 'crypto-js';
import { ethers } from 'ethers';
import { solidityKeccak256 } from 'ethers/lib/utils';

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
 * Generates a salt for a user given their `address` and `timestamp`.
 */
export const generateSalt = (address: string, timestamp: number): string => {
    const salt = CryptoJS.SHA256(`${address}${timestamp}`).toString();

    return `0x${salt}`;
}

/**
 * Generates a data hash for a user given their `address` and `salt`.
 */
export const generateDataHash = (address: string, salt: string): string => {
    return solidityKeccak256(['address', 'bytes'], [address, salt]);
}

/**
 * Generates a signature for a user given their `dataHash` and `wallet`.
 */
export const generateSignature = async (dataHash: string, wallet: ethers.Wallet): Promise<string> => {
    return await wallet.signMessage(ethers.utils.arrayify(dataHash));
}

/**
 * Recovers a signature given a `dataHash` and `signature`.
 */
export const recoverSignature = async (dataHash: string, signature: string): Promise<string> => {
    console.log('address: ', ethers.utils.verifyMessage(ethers.utils.arrayify(dataHash), signature));
    return ethers.utils.verifyMessage(ethers.utils.arrayify(dataHash), signature);
}

recoverSignature(
    '0x8e6990ffb239b5fd43dd716952603191f4da690913d20c6b2cf0a4af4d1cb9f5',
    '0x417081fc287a257942bb7f1318c2bcad6e44e7d89466dd7ad38dd04eaf3d48a43bb394a3129ebfc8f2dbaebf295ec4f3b584d03bd46d7c363b356bf155390c251c'
);