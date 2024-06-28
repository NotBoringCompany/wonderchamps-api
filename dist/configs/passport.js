"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_twitter_oauth2_1 = require("@superfaceai/passport-twitter-oauth2");
passport_1.default.use(new passport_twitter_oauth2_1.Strategy({
    clientType: 'confidential',
    clientID: process.env.X_CLIENT_ID,
    clientSecret: process.env.X_CLIENT_SECRET,
    callbackURL: process.env.X_CALLBACK_URL,
    authorizationURL: 'https://x.com/i/oauth2/authorize',
    scope: ['tweet.read', 'users.read', 'offline.access'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const user = {
            ...profile,
            xAccessToken: accessToken,
            xRefreshToken: refreshToken,
            // get the current unix timestamp, add 7200 seconds (2 hours) to it
            xExpiryDate: Math.floor(Date.now() / 1000) + 7200,
        };
        return done(null, user);
    }
    catch (err) {
        done(err, undefined);
    }
}));
// minimal serialization; our extension uses JWT token for session management and passport only as a requirement for twitter's oauth2 from superfaceai
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
// minimal deserialization; same reasoning as serializeUser
passport_1.default.deserializeUser(async (id, done) => {
    // only pass the ID; the rest of the user object is not needed
    const user = {
        id,
        username: '',
        profileUrl: '',
        provider: '',
        displayName: '',
        xAccessToken: '',
        xRefreshToken: '',
        xExpiryDate: 0
    };
    done(null, user);
});
exports.default = passport_1.default;
