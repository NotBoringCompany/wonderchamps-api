import express from 'express';
import { checkWeb3AccountExists, createWeb3Account } from '../api/user';
import { validateRequestAuth } from '../utils/auth';
import { APIResponseStatus } from '../models/api';
import { addShopItems, buyItem, getShopItems } from '../api/shop';
import { authMiddleware } from '../middlewares/auth';
import { ShopType } from '../models/shop';
import { claimClaimableItems } from '../api/item';

const router = express.Router();

router.post('/claim_claimable_items', async (req, res) => {
    try {
        const { status: validateStatus, message: validateMessage, data: validateData } = await validateRequestAuth(req, res, 'claim_claimable_items');

        if (validateStatus !== APIResponseStatus.SUCCESS) {
            return res.status(validateStatus).json({
                status: validateStatus,
                message: validateMessage
            });
        }

        const { status, message, data } = await claimClaimableItems(validateData?.xId);

        return res.status(status).json({
            status,
            message,
            data
        });
    } catch (err: any) {
        return res.status(500).json({
            status: 500,
            message: `(claim_claimable_items) Error: ${err.message}`
        });
    }
})