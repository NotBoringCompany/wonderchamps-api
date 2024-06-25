import passport from 'passport';
import { ProfileWithMetaData, Strategy as XStrategy } from '@superfaceai/passport-twitter-oauth2';
import { ExtendedXProfile } from '../utils/customProfiles';

passport.use(new XStrategy(
    {
        clientType: 'confidential',
        clientID: process.env.X_CLIENT_ID!,
        clientSecret: process.env.X_CLIENT_SECRET!,
        callbackURL: process.env.X_CALLBACK_URL!,
        authorizationURL: 'https://x.com/i/oauth2/authorize',
        scope: ['tweet.read', 'users.read', 'offline.access'],
    },
    async (
        accessToken: string,
        refreshToken: string,
        profile: ProfileWithMetaData, 
        done: (error: Error | null, user?: Express.User) => void
    ) => {
        try {
            const user: Express.User = {
                ...profile,
                xAccessToken: accessToken,
                xRefreshToken: refreshToken,
                // get the current unix timestamp, add 7200 seconds (2 hours) to it
                xExpiryDate: Math.floor(Date.now() / 1000) + 7200,
            }

            return done(null, user);
        } catch (err: any) {
            done(err, undefined);
        }
    }
));

// minimal serialization; our extension uses JWT token for session management and passport only as a requirement for twitter's oauth2 from superfaceai
passport.serializeUser((user, done) => {
    done(null, (user as ExtendedXProfile).id);
});

// minimal deserialization; same reasoning as serializeUser
passport.deserializeUser(async (id: string, done) => {
    // only pass the ID; the rest of the user object is not needed
    const user: Express.User = {
        id,
        username: '',
        profileUrl: '',
        provider: '',
        displayName: '',
        xAccessToken: '',
        xRefreshToken: '',
        xExpiryDate: 0
    }

    done(null, user);
});

export default passport;

