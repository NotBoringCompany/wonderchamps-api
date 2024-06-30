import { APIResponse, APIResponseStatus } from '../models/api';
import axios from 'axios';
import { WONDERBITS_API_BASE_URL, WONDERVERSE_API_BASE_URL } from '../utils/constants/endpoints';
import { ExtendedXProfile } from '../utils/customProfiles';
import { WonderchampsUserModel } from '../utils/constants/db';
import { Creds } from '../models/user';

/**
 * Authenticates a user via X (Twitter).
 * 
 * Because Wonderchamps is linked with Wonderbits w.r.t user data, a check to see if the user has a Wonderbits account will be done.
 * If the user doesn't have one, we will call the Wonderbits API to create an account for them.
 */
export const handleXAuth = async (
    xId: string,
    xProfile?: ExtendedXProfile | null
): Promise<APIResponse> => {
    try {
        console.log('x profile handleXAuth: ', xProfile);
        
        let wonderbitsUserData: {
            userId: string | null;
        } = {
            userId: null
        }

        const wonderbitsUserDataResponse = await axios.get(
            `${WONDERBITS_API_BASE_URL}/user/get_user_data/${xId}/${process.env.ADMIN_KEY!}`
        ).catch(async err => {
            // if an error is thrown because the user is not found, call the Wonderbits API to create a Wonderbits account for them.
            // then, upon success, create the wonderchamps account.
            if (
                err?.response?.data?.status as number === APIResponseStatus.INTERNAL_SERVER_ERROR &&
                (err?.response?.data?.message as string).includes('User not found')
            ) {
                const requestBody = {
                    twitterId: xId,
                    adminCall: true,
                    profile: xProfile,
                    adminKey: process.env.ADMIN_KEY!
                }

                console.log('running this here');

                // no need to catch any errors here. if there is an error, the main `catch` block will handle it.
                const wonderbitsAccountCreationResponse = await axios.post(
                    `${WONDERBITS_API_BASE_URL}/auth/twitter/wonderbits_admin_registration`,
                    requestBody
                ).catch(err => {
                    console.log(`(handleXAuth) Error: ${err.message}`);
                });
                
                // if this line runs, then we assume no errors were thrown from `wonderbitsAccountCreationResponse`.
                wonderbitsUserData.userId = wonderbitsAccountCreationResponse?.data?.data?.userId;
            }
        });

        if (wonderbitsUserData.userId === null) {
            // at this point, if `userId` is still null, then the user has a Wonderbits account.
            // get the user's database ID from the Wonderbits User collection.
            // this is a different syntax from the one above because of the data return for creating a new user.
            wonderbitsUserData.userId = wonderbitsUserDataResponse?.data?.data?.user?._id;
        }

        // check if the user has a wonderchamps account.
        const user = await WonderchampsUserModel.findOne({ _id: wonderbitsUserData.userId }).lean();

        // if user doesn't exist, create a new user instance.
        if (!user) {
            const newUser = new WonderchampsUserModel({
                _id: wonderbitsUserData.userId,
                inGameData: {
                    ownedItemIDs: [],
                    ownedItemFragmentIDs: [],
                    claimableItems: [],
                    claimableItemFragments: [],
                    claimableIGC: {
                        marble: 0,
                        gold: 0
                    }
                }
            });

            await newUser.save();

            return {
                status: APIResponseStatus.SUCCESS,
                message: `(handleXAuth) Wonderchamps account created successfully.`,
                data: {
                    userId: wonderbitsUserData.userId
                }
            }
        }

        return {
            status: APIResponseStatus.SUCCESS,
            message: `(handleXAuth) User authenticated successfully.`
        }
    } catch (err: any) {
        console.log(`(handleXAuth) Error: ${err.message}`);

        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(handleXAuth) Error: ${err.message}`
        }
    }
}

/**
 * This function is used to verify a token from the Wonderverse backend.
 *
 * @param token Token obtained from the Wonderverse backend.
 * @returns Promise<ReturnValue> The result of the token verification.
 */
export const verifyToken = async (token: string): Promise<APIResponse<Creds>> => {
    try {
        const res = await axios.get(`${WONDERVERSE_API_BASE_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return res.data;
    } catch (err: any) {
        return {
            status: err.response?.data?.status ?? APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(verifyToken) ${err.response?.data?.message ?? 'Authorization failed'}`,
            data: undefined,
        };
    }
};
