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
            itemType: String,
            level: Number,
            fragmentsUsed: Number,
            vehicleStats: {
                baseSpeed: Number,
                speedLimit: Number
            },
            bonusStats: {
                landBonus: Number,
                airBonus: Number,
                waterBonus: Number,
                wallBonus: Number,
                lineShapeBonus: Number,
                roundShapeBonus: Number,
                squareShapeBonus: Number,
                triangleShapeBonus: Number,
            },
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