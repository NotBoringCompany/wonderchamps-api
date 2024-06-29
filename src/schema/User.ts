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
        }],
        claimableItemFragments: [{
            itemFragmentId: Number,
            name: String,
            description: String,
            amount: Number,
        }],
        claimableIGC: {
            marble: Number,
            gold: Number,
        }
    }
});