import { APIResponse, APIResponseStatus } from '../models/api';
import axios from 'axios';
import { WONDERBITS_API_BASE_URL } from '../utils/endpoints';
import * as dotenv from 'dotenv';

dotenv.config({ path: __dirname + './../../.env' });

// /**
//  * Authenticates a user via X (Twitter).
//  * 
//  * Because Wonderchamps is linked with Wonderbits w.r.t user data, a check to see if the user has a Wonderbits account will be done.
//  * If the user doesn't have one, we will call the Wonderbits API to create an account for them.
//  */
// export const handleXAuth = async (xId: string): Promise<APIResponse> => {
//     try {
//         await axios.get(
//             `${WONDERBITS_API_BASE_URL}/user/get_user_data/${xId}/${process.env.ADMIN_KEY}`
//         ).then(data => {
//             console.log(data);
//         }).catch(err => {
//             // if an error is thrown because the user is not found, call the Wonderbits API to create a Wonderbits account for them.
//             // then, upon success, create the wonderchamps account.
//             if (
//                 err?.response?.data?.status as number === APIResponseStatus.INTERNAL_SERVER_ERROR &&
//                 (err?.response?.data?.message as string).includes('User not found')
//             ) {

//             }
//         })

//         return {
//             status: APIResponseStatus.SUCCESS,
//             message: 'User authenticated successfully',
//         }
//     } catch (err: any) {
//         return {
//             status: APIResponseStatus.INTERNAL_SERVER_ERROR,
//             message: `(handleXAuth) Error: ${err.message}`
//         }
//     }
// }

// handleXAuth('146526313864379187');