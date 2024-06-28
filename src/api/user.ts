import axios from 'axios';
import { APIResponse, APIResponseStatus } from '../models/api';
import { WonderchampsUserModel } from '../utils/constants/db';
import { WONDERBITS_API_BASE_URL } from '../utils/constants/endpoints';
import * as dotenv from 'dotenv';
import { DEPLOYER_ACCOUNT, WONDERCHAMPS_CONTRACT } from '../utils/constants/web3';

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
        const { address } = userData?.wallet;

        // check if the user has a Wonderchamps Web3 account
        const exists = await WONDERCHAMPS_CONTRACT(DEPLOYER_ACCOUNT).read.playerExists([address]);

        // if the user doesn't have a wonderchamps account, send a response to create one.
        if (!exists) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(checkWeb3AccountExists) User does not have a Wonderchamps account. Please request to create one.`
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

checkWeb3AccountExists('1465263138643791874');