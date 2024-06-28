import mongoose from 'mongoose';
import { UserSchema } from '../../schema/User';

const WONDERBITS_MONGODB_URI = process.env.WONDERBITS_MONGODB_URI!;
const WONDERCHAMPS_MONGODB_URI = process.env.WONDERCHAMPS_MONGODB_URI!;

export const WONDERBITS_CONNECTION = mongoose.createConnection(WONDERBITS_MONGODB_URI);
export const WONDERCHAMPS_CONNECTION = mongoose.createConnection(WONDERCHAMPS_MONGODB_URI);

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