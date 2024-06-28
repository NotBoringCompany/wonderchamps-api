"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jwt_1 = require("../../utils/jwt");
const api_1 = require("../../models/api");
const passport_1 = __importDefault(require("../../configs/passport"));
const auth_1 = require("../../api/auth");
const router = express_1.default.Router();
router.get('/login', async (req, res, next) => {
    // get the jwt token (if it exists) from the request headers
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        console.log('token is valid');
        // check for validation
        const { status } = (0, jwt_1.validateJWT)(token);
        if (status === api_1.APIResponseStatus.SUCCESS) {
            // custom redirect to be intercepted by unity
            return res.redirect(`wonderchamps://x-auth?jwt=${token}`);
        }
        else {
            console.log('token is invalid');
            // token is invalid, redirect to X for authentication
            passport_1.default.authenticate('twitter', {
                scope: ['tweet.read', 'users.read', 'offline.access'],
                session: true,
                keepSessionInfo: true
            })(req, res, next);
        }
    }
    else {
        console.log('token doesnt exist. redirecting to callback');
        // token doesn't exist, redirect to X for authentication
        passport_1.default.authenticate('twitter', {
            scope: ['tweet.read', 'users.read', 'offline.access'],
            session: true,
            keepSessionInfo: true
        })(req, res, next);
    }
});
router.get('/callback', passport_1.default.authenticate('twitter', { failureRedirect: 'wonderchamps://x-auth-fail', session: true, keepSessionInfo: true }), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            status: api_1.APIResponseStatus.UNAUTHORIZED,
            message: `(auth_x_callback) You denied the app or your session has expired. Please try again.`
        });
    }
    try {
        const { id: xId, xAccessToken, xRefreshToken, xExpiryDate, username, photos, profileUrl, provider, displayName } = req.user;
        // call `handleXAuth`
        const { status, message, data } = await (0, auth_1.handleXAuth)(xId, {
            id: xId,
            xAccessToken,
            xRefreshToken,
            xExpiryDate,
            username,
            photos,
            profileUrl,
            provider,
            displayName
        });
        if (status !== api_1.APIResponseStatus.SUCCESS) {
            console.log('status is not success');
            return res.status(status).json({
                status,
                message
            });
        }
        else {
            const token = (0, jwt_1.generateJWT)(xId, xAccessToken, xRefreshToken);
            console.log('status success. token generated from callback: ', token);
            // custom redirect to be intercepted by unity
            return res.redirect(`wonderchamps://x-auth?jwt=${token}`);
        }
    }
    catch (err) {
        return res.status(500).json({
            status: api_1.APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(auth_x_callback) Error: ${err.message}`
        });
    }
});
exports.default = router;
