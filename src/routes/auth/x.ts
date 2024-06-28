import express from 'express';
import { generateJWT, validateJWT } from '../../utils/jwt';
import { APIResponseStatus } from '../../models/api';
import passport from '../../configs/passport';
import { ExtendedXProfile } from '../../utils/customProfiles';
import { handleXAuth } from '../../api/auth';

const router = express.Router();

router.get('/test', async (req, res) => {
    console.log('test is working');
    return res.status(200).json({
        status: APIResponseStatus.SUCCESS,
        message: 'X Auth route is working.'
    });
})

router.get('/login', async (req, res, next) => {
    // get the jwt token (if it exists) from the request headers
    const token = req.headers.authorization?.split(' ')[1];

    console.log('token: ', token);

    if (token) {
        // check for validation
        const { status } = validateJWT(token);
        if (status === APIResponseStatus.SUCCESS) {
            // custom redirect to be intercepted by unity
            return res.redirect(`wonderchamps://x-auth?jwt=${token}`);
        } else {
            console.log('token is invalid. redirecting to X for auth');

            // token is invalid, redirect to X for authentication
            passport.authenticate('twitter', {
                scope: ['tweet.read', 'users.read', 'offline.access'],
                session: true,
                keepSessionInfo: true
            })(req, res, next);
        }
    } else {
        // token doesn't exist, redirect to X for authentication
        passport.authenticate('twitter', {
            scope: ['tweet.read', 'users.read', 'offline.access'],
            session: true,
            keepSessionInfo: true
        })(req, res, next);
    }
});

router.get('/callback', passport.authenticate('twitter', { failureRedirect: 'wonderchamps://x-auth-fail', session: true, keepSessionInfo: true }), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            status: APIResponseStatus.UNAUTHORIZED,
            message: `(auth_x_callback) You denied the app or your session has expired. Please try again.`
        });
    }

    try {
        const { 
            id: xId, 
            xAccessToken, 
            xRefreshToken, 
            xExpiryDate, 
            username, 
            photos, 
            profileUrl, 
            provider,  
            displayName
        } = req.user as ExtendedXProfile;

        // call `handleXAuth`
        const { status, message, data } = await handleXAuth(
            xId,
            {
                id: xId,
                xAccessToken,
                xRefreshToken,
                xExpiryDate,
                username,
                photos,
                profileUrl,
                provider,
                displayName
            }
        );

        if (status !== APIResponseStatus.SUCCESS) {
            return res.status(status).json({
                status,
                message
            });
        } else {
            const token = generateJWT(xId, xAccessToken, xRefreshToken);
            
            // custom redirect to be intercepted by unity
            return res.redirect(`wonderchamps://x-auth?jwt=${token}`);
        }
    } catch (err: any) {
        return res.status(500).json({
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(auth_x_callback) Error: ${err.message}`
        })
    }
});

export default router;