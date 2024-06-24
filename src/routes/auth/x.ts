import express from 'express';

const router = express.Router();

// router.get('/login', async (req, res, next) => {
//     // get the jwt token (if it exists) from the request headers
//     const token = req.headers.authorization?.split(' ')[1];

//     const host = req.query.host || 'https://x.com';
//     (req.session as any).redirectHost = host;
//     (req.session as any).version = req.query.version || '-';

//     if (token) {
//         // check for validation
//     }
// })