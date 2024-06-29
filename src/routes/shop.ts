import express from 'express';
import { checkWeb3AccountExists, createWeb3Account } from '../api/user';
import { validateRequestAuth } from '../utils/auth';
import { APIResponseStatus } from '../models/api';
import { addShopItems } from '../api/shop';

const router = express.Router();

router.post('/add_shop_items', async (req, res) => {
    const { shopType, items, adminKey } = req.body;

    try {
        const { status, message, data } = await addShopItems(shopType, items, adminKey);

        return res.status(status).json({
            status,
            message,
            data
        });
    } catch (err: any) {
        return res.status(500).json({
            status: 500,
            message: `(add_shop_items) Error: ${err.message}`
        });
    }
})