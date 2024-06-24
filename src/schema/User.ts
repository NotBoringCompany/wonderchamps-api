import mongoose, { Schema } from 'mongoose';

/**
 * User schema for Wonderverse. Schema representation of the `User` interface in `models/user.ts`.
 */
export const UserSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    wonderbitsUserId: String
});