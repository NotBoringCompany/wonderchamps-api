import mongoose from 'mongoose';
import { UserSchema as WonderchampsUserSchema } from '../../schema/User';
import { UserSchema as WonderbitsUserSchema } from '../../schema/wonderbits/User';
import { ShopSchema } from '../../schema/Shop';
import * as dotenv from 'dotenv';

dotenv.config();

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

export const WonderbitsUserModel = WONDERBITS_CONNECTION.model('Users', WonderbitsUserSchema, 'Users');

export const WonderchampsUserModel = WONDERCHAMPS_CONNECTION.model('Users', WonderchampsUserSchema, 'Users');
export const WonderchampsShopModel = WONDERCHAMPS_CONNECTION.model('Shop', ShopSchema, 'Shop');