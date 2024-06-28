"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WonderchampsUserModel = exports.WONDERCHAMPS_CONNECTION = exports.WONDERBITS_CONNECTION = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../schema/User");
const wonderbitsMongoURI = process.env.WONDERBITS_MONGODB_URI;
const wonderchampsMongoURI = process.env.WONDERCHAMPS_MONGODB_URI;
exports.WONDERBITS_CONNECTION = mongoose_1.default.createConnection(wonderbitsMongoURI);
exports.WONDERCHAMPS_CONNECTION = mongoose_1.default.createConnection(wonderchampsMongoURI);
exports.WONDERBITS_CONNECTION.on('connected', () => {
    console.log('Connected to Wonderbits database');
});
exports.WONDERBITS_CONNECTION.on('error', (err) => {
    console.error(`Error connecting to Wonderbits database: ${err}`);
});
exports.WONDERCHAMPS_CONNECTION.on('connected', () => {
    console.log('Connected to Wonderchamps database');
});
exports.WONDERCHAMPS_CONNECTION.on('error', (err) => {
    console.error(`Error connecting to Wonderchamps database: ${err}`);
});
exports.WonderchampsUserModel = exports.WONDERCHAMPS_CONNECTION.model('Users', User_1.UserSchema, 'Users');
