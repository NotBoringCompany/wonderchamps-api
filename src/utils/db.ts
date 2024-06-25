import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { UserSchema } from '../schema/User';

dotenv.config({ path: __dirname + './../../.env' });

const wonderbitsMongoURI = process.env.WONDERBITS_MONGODB_URI!;
const wonderchampsMongoURI = process.env.WONDERCHAMPS_MONGODB_URI!;

export const WONDERBITS_CONNECTION = mongoose.createConnection(wonderbitsMongoURI);
export const WONDERCHAMPS_CONNECTION = mongoose.createConnection(wonderchampsMongoURI);

WONDERBITS_CONNECTION.on('connected', () => {
    console.log('Connected to Wonderbits database');
});

WONDERBITS_CONNECTION.on('error', (err) => {
    console.error(`Error connecting to Wonderbits database: ${err}`);
});

WONDERCHAMPS_CONNECTION.on('connected', () => {
    console.log('Connected to Wonderchamps database');
});

WONDERCHAMPS_CONNECTION.on('error', (err) => {
    console.error(`Error connecting to Wonderchamps database: ${err}`);
});

export const WonderchampsUserModel = WONDERCHAMPS_CONNECTION.model('Users', UserSchema, 'Users');