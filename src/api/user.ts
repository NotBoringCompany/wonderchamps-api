import axios from 'axios';
import { APIResponse, APIResponseStatus } from '../models/api';
import { WonderbitsUserModel, WonderchampsUserModel } from '../utils/constants/db';
import { WONDERBITS_API_BASE_URL } from '../utils/constants/endpoints';
import * as dotenv from 'dotenv';
import { BASE_SEPOLIA_CLIENT, DEPLOYER_ACCOUNT, USER_ACCOUNT, WALLET_CLIENT, WONDERCHAMPS_ABI, WONDERCHAMPS_CONTRACT } from '../utils/constants/web3';
import { generateDataHash, generateSalt, generateSignature } from '../utils/crypto';
import { formatUnits } from 'viem';
import { UserWallet } from '../models/wonderbits/user';

dotenv.config();

/**
 * Checks if a user has a Wonderchamps account registered/created in the smart contract already.
 * 
 * This should be called after the user has been authenticated via X.
 * 
 * If the user doesn't have a Wnderchamps Web3 account, 
 * another request should be made to `createWeb3Account` to create an account for the user.
 */
export const checkWeb3AccountExists = async (xId: string): Promise<APIResponse> => {
    try {
        console.log('xId: ', xId);
        
        const wonderbitsUserData = await WonderbitsUserModel.findOne({ twitterId: xId }).lean();

        console.log('wonderbitsUserData: ', wonderbitsUserData);

        if (!wonderbitsUserData) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(checkWeb3AccountExists) User not found in Wonderbits database.`
            }
        }

        // get the user's wallet
        const { privateKey, address } = wonderbitsUserData?.wallet as UserWallet;

        const userAccount = USER_ACCOUNT(privateKey);

        // check if the user has a Wonderchamps Web3 account
        const exists = await WONDERCHAMPS_CONTRACT(userAccount).read.playerExists([address]);

        // if the user doesn't have a wonderchamps account, estimate the gas to create one and require
        // the user to create one.
        if (!exists) {
            const salt = generateSalt(
                address as `0x${string}`,
                Math.floor(Date.now() / 1000)
            );
            const dataHash = generateDataHash(address as `0x${string}`, salt);
            const adminSig = await generateSignature(dataHash as `0x${string}`, DEPLOYER_ACCOUNT);

            const estimatedGasUnits = await BASE_SEPOLIA_CLIENT.estimateContractGas({
                address: WONDERCHAMPS_CONTRACT(userAccount).address,
                abi: WONDERCHAMPS_ABI,
                functionName: 'createPlayer',
                args: [address, [salt, adminSig]]
            });

            const { maxFeePerGas, maxPriorityFeePerGas } = await BASE_SEPOLIA_CLIENT.estimateFeesPerGas();

            const estimatedGasETH = parseFloat(formatUnits(estimatedGasUnits, 0)) * parseFloat((formatUnits(maxFeePerGas ?? BigInt(1000000), 18) + formatUnits(maxPriorityFeePerGas ?? BigInt(1000000), 18)));

            const userOwnedETH = await BASE_SEPOLIA_CLIENT.getBalance({
                address: userAccount.address
            }).then(balance => parseFloat(formatUnits(balance, 18)));

            console.log('Estimated Gas (ETH):', estimatedGasETH);
            console.log('User Owned ETH:', userOwnedETH);

            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(checkWeb3AccountExists) User does not have a Wonderchamps account. Please request to create one. Estimated gas to create one is available in the data section.`,
                data: {
                    estimatedGasETH,
                    userOwnedETH: userOwnedETH,
                    userHasEnoughETH: userOwnedETH >= estimatedGasETH
                }
            }
        }

        return {
            status: APIResponseStatus.SUCCESS,
            message: `(checkWeb3AccountExists) User has a Wonderchamps account. Login successful.`
        }
    } catch (err: any) {
        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(checkWeb3AccountExists) Error: ${err.message}`
        }
    }
}

/**
 * Creates a Wonderchamps Web3 account for a user.
 * 
 * Should be called after `checkWeb3AccountExists`.
 */
export const createWeb3Account = async (xId: string): Promise<APIResponse> => {
    try {
        const wonderbitsUserData = await WonderbitsUserModel.findOne({ twitterId: xId }).lean();

        if (!wonderbitsUserData) {
            console.log('User not found in Wonderbits database.')
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(createWeb3Account) User not found in Wonderbits database.`
            }
        }

        // get the user's wallet
        const { privateKey, address } = wonderbitsUserData?.wallet as UserWallet;

        const userAccount = USER_ACCOUNT(privateKey);

        // call `createPlayer` to create a Wonderchamps account for the user
        const salt = generateSalt(
            address as `0x${string}`,
            Math.floor(Date.now() / 1000)
        );
        const dataHash = generateDataHash(address as `0x${string}`, salt);
        const adminSig = await generateSignature(dataHash as `0x${string}`, DEPLOYER_ACCOUNT);

        const txHash = await WONDERCHAMPS_CONTRACT(userAccount).write.createPlayer([address, [salt, adminSig]]);
        console.log('Transaction Hash:', txHash);

        // if this line runs, then the transaction was successful.
        return {
            status: APIResponseStatus.SUCCESS,
            message: `(createWeb3Account) Wonderchamps Web3 account created successfully.`,
            data: {
                txHash 
            }
        }

    } catch (err: any) {
        // most likely due to the Web3 account already existing or lack of funds to pay for gas.
        if (err.message.includes('Execution reverted')) {
            return {
                status: APIResponseStatus.FORBIDDEN,
                message: `(createWeb3Account) User either already exists or does not have enough funds to create an account. Detailed error: ${err.message}`
            }
        }

        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(createWeb3Account) Error: ${err.message}`
        }
    }
}