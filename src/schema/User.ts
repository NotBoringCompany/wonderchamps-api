import mongoose, { Schema } from 'mongoose';

/**
 * User schema for Wonderchamps. Schema representation of the `User` interface in `models/user.ts`.
 */
export const UserSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    inGameData: {
        ownedItemIDs: [Number],
        ownedItemFragmentIDs: [Number],
        claimableItems: [{
            itemId: Number,
            name: String,
            description: String,
            level: Number,
            fragmentsUsed: Number,
            additionalData: String,
            __v: false
        }],
        claimableItemFragments: [{
            itemFragmentId: Number,
            name: String,
            description: String,
            amount: Number,
            __v: false
        }],
        claimableIGC: {
            marble: Number,
            gold: Number,
            __v: false
        }
    }
});