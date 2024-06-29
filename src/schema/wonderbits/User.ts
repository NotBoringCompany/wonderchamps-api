import mongoose from 'mongoose';

/**
 * User schema for Wonderbits. Schema representation of the `User` interface in `models/wonderbits/user.ts`.
 * 
 * Contains only data that's required from the Wonderbits database.
 */
export const UserSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    twitterId: String,
    wallet: {
        address: String,
        privateKey: String
    },
    secondaryWallets: [{
        signatureMessage: String,
        signature: String,
        address: String,
    }]
})