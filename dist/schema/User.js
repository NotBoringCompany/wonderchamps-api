"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * User schema for Wonderverse. Schema representation of the `User` interface in `models/user.ts`.
 */
exports.UserSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        required: true
    },
});
