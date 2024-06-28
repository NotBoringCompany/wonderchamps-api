import express from 'express';
import { generateJWT, validateJWT } from '../../utils/jwt';
import { APIResponseStatus } from '../../models/api';
import passport from '../../configs/passport';
import { ExtendedXProfile } from '../../utils/customProfiles';
import { handleXAuth } from '../../api/auth';

const router = express.Router();

router.get('/login', async (req, res, next) => {
    // get the jwt token (if it exists) from the request headers
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        console.log('token is valid');

        // check for validation
        const { status } = validateJWT(token);
        if (status === APIResponseStatus.SUCCESS) {
            // custom redirect to be intercepted by unity
            return res.redirect(`https://wonderchamps-api.up.railway.app/auth/x/success?jwt=${token}`);
        } else {
            console.log('token is invalid');

            // token is invalid, redirect to X for authentication
            passport.authenticate('twitter', {
                scope: ['tweet.read', 'users.read', 'offline.access'],
                session: true,
                keepSessionInfo: true
            })(req, res, next);
        }
    } else {
        console.log('token doesnt exist. redirecting to callback');

        // token doesn't exist, redirect to X for authentication
        passport.authenticate('twitter', {
            scope: ['tweet.read', 'users.read', 'offline.access'],
            session: true,
            keepSessionInfo: true
        })(req, res, next);
    }
});

router.get('/callback', passport.authenticate('twitter', { failureRedirect: 'https://wonderchamps-api.up.railway.app/auth/x/failure', session: true, keepSessionInfo: true }), async (req, res) => {
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
            console.log('status is not success');

            return res.status(status).json({
                status,
                message
            });
        } else {
            const token = generateJWT(xId, xAccessToken, xRefreshToken);

            console.log('status success. token generated from callback: ', token);
            console.log('redirecting to: ', `https://wonderchamps-api.up.railway.app/auth/x/success?jwt=${token}`);
            
            // custom redirect to be intercepted by unity
            return res.redirect(`https://wonderchamps-api.up.railway.app/auth/x/success?jwt=${token}`);
        }
    } catch (err: any) {
        return res.status(500).json({
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(auth_x_callback) Error: ${err.message}`
        })
    }
});

export default router;