import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import session from 'express-session';
import passport from './configs/passport';

dotenv.config({ path: __dirname + '/../.env' });

const app = express();
const port = process.env.PORT!;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors()); // temporarily allowing all cors requests

// memory store for session management
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

import xAuth from './routes/auth/x';
import user from './routes/user';
import shop from './routes/shop';
import item from './routes/item';

app.use('/auth/x', xAuth);
app.use('/user', user);
app.use('/shop', shop);
app.use('/item', item);

app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
});