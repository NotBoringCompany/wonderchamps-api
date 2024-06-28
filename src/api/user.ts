import axios from 'axios';
import { APIResponse, APIResponseStatus } from '../models/api';
import { WonderchampsUserModel } from '../utils/constants/db';
import { WONDERBITS_API_BASE_URL } from '../utils/constants/endpoints';
import * as dotenv from 'dotenv';

// dotenv.config();

// /**
//  * Checks if a user has a Wonderchamps account registered/created in the smart contract already.
//  * 
//  * If not, another request should be made to `createWeb3Account` to create an account for the user.
//  */
// export const checkWeb3AccountExists = async (xId: string): Promise<APIResponse> => {
//     try {
//         const wonderbitsUserDataResponse = await axios.get(
//             `${WONDERBITS_API_BASE_URL}/user/get_user_data/${xId}/${process.env.ADMIN_KEY!}`
//         ).then(async data => {
//             console.log('data: ', data);
//         }).catch(err => {
//             console.log('error: ', err);
//         })
//     } catch (err: any) {
//         return {
//             status: APIResponseStatus.INTERNAL_SERVER_ERROR,
//             message: `(checkWeb3AccountExists) Error: ${err.message}`
//         }
//     }
// }

// checkWeb3AccountExists('123123');