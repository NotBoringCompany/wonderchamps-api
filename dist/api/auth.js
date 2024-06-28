"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleXAuth = void 0;
const api_1 = require("../models/api");
const axios_1 = __importDefault(require("axios"));
const endpoints_1 = require("../utils/endpoints");
const db_1 = require("../utils/constants/db");
/**
 * Authenticates a user via X (Twitter).
 *
 * Because Wonderchamps is linked with Wonderbits w.r.t user data, a check to see if the user has a Wonderbits account will be done.
 * If the user doesn't have one, we will call the Wonderbits API to create an account for them.
 */
const handleXAuth = async (xId, xProfile) => {
    try {
        let wonderbitsUserData = {
            userId: null
        };
        const wonderbitsUserDataResponse = await axios_1.default.get(`${endpoints_1.WONDERBITS_API_BASE_URL}/user/get_user_data/${xId}/${process.env.ADMIN_KEY}`).catch(async (err) => {
            // if an error is thrown because the user is not found, call the Wonderbits API to create a Wonderbits account for them.
            // then, upon success, create the wonderchamps account.
            if (err?.response?.data?.status === api_1.APIResponseStatus.INTERNAL_SERVER_ERROR &&
                (err?.response?.data?.message).includes('User not found')) {
                const requestBody = {
                    twitterId: xId,
                    adminCall: true,
                    profile: xProfile,
                    adminKey: process.env.ADMIN_KEY
                };
                console.log('running this here');
                // no need to catch any errors here. if there is an error, the main `catch` block will handle it.
                const wonderbitsAccountCreationResponse = await axios_1.default.post(`${endpoints_1.WONDERBITS_API_BASE_URL}/auth/twitter/wonderbits_admin_registration`, requestBody).catch(err => {
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
        const user = await db_1.WonderchampsUserModel.findOne({ _id: wonderbitsUserData.userId }).lean();
        // if user doesn't exist, create a new user instance.
        if (!user) {
            const newUser = new db_1.WonderchampsUserModel({
                _id: wonderbitsUserData.userId
            });
            await newUser.save();
            return {
                status: api_1.APIResponseStatus.SUCCESS,
                message: `(handleXAuth) Wonderchamps account created successfully.`,
                data: {
                    userId: wonderbitsUserData.userId
                }
            };
        }
        return {
            status: api_1.APIResponseStatus.SUCCESS,
            message: `(handleXAuth) User authenticated successfully.`
        };
    }
    catch (err) {
        console.log(`(handleXAuth) Error: ${err.message}`);
        return {
            status: api_1.APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(handleXAuth) Error: ${err.message}`
        };
    }
};
exports.handleXAuth = handleXAuth;
