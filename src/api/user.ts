import axios from 'axios';
import { APIResponse, APIResponseStatus } from '../models/api';
import { WonderchampsUserModel } from '../utils/constants/db';
import { WONDERBITS_API_BASE_URL } from '../utils/constants/endpoints';
import * as dotenv from 'dotenv';
import { BASE_SEPOLIA_CLIENT, DEPLOYER_ACCOUNT, USER_ACCOUNT, WALLET_CLIENT, WONDERCHAMPS_ABI, WONDERCHAMPS_CONTRACT } from '../utils/constants/web3';
import { generateSalt, generateSignature } from '../utils/crypto';
import { formatUnits } from 'viem';

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
        const userDataResponseError: {
            status: number | null;
            message: string | null;
        } = {
            status: null,
            message: null
        };

        const userDataResponse = await axios.get(
            `${WONDERBITS_API_BASE_URL}/user/get_user_data/${xId}/${process.env.ADMIN_KEY!}`
        ).catch(err => {
            userDataResponseError.status = err?.response?.data?.status;
            userDataResponseError.message = err?.response?.data?.message;
        })

        if (userDataResponseError.status !== null || userDataResponseError.message !== null) {
            return {
                status: userDataResponseError.status!,
                message: `(checkWeb3AccountExists) Error from get_user_data: ${userDataResponseError.message}`
            }
        }

        const userData = userDataResponse?.data?.data?.user;

        if (!userData) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(checkWeb3AccountExists) User not found.`
            }
        }

        // get the user's wallet address
        const { privateKey, address } = userData?.wallet;

        const userAccount = USER_ACCOUNT(privateKey);

        // check if the user has a Wonderchamps Web3 account
        const exists = await WONDERCHAMPS_CONTRACT(userAccount).read.playerExists([address]);

        // if the user doesn't have a wonderchamps account, estimate the gas to create one and require
        // the user to create one.
        if (!exists) {
            const salt = generateSalt(
                address,
                Math.floor(Date.now() / 1000)
            );
            console.log(`Salt: ${salt}`);

            const dataHash = await WONDERCHAMPS_CONTRACT(userAccount).read.dataHash([address, salt]);
            console.log(`Data Hash: ${dataHash}`);

            const signature = await generateSignature(dataHash as `0x${string}`, DEPLOYER_ACCOUNT);
            console.log(`Signature: ${signature}`);

            const estimatedGasUnits = await BASE_SEPOLIA_CLIENT.estimateContractGas({
                address: WONDERCHAMPS_CONTRACT(userAccount).address,
                abi: WONDERCHAMPS_ABI,
                functionName: 'createPlayer',
                args: [address, [salt, signature]]
            });

            const { maxFeePerGas, maxPriorityFeePerGas } = await BASE_SEPOLIA_CLIENT.estimateFeesPerGas();
            
            const estimatedGasETH = parseFloat(formatUnits(estimatedGasUnits, 0)) * parseFloat((formatUnits(maxFeePerGas ?? BigInt(1000000), 18) + formatUnits(maxPriorityFeePerGas ?? BigInt(1000000), 18)));
            
            const userOwnedETH = await BASE_SEPOLIA_CLIENT.getBalance({
                address: userAccount.address
            }).then(balance => parseFloat(formatUnits(balance, 18)));

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
        console.log('err: ', err);
        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(checkWeb3AccountExists) Error: ${err.message}`
        }
    }
}