import express from 'express';
import { checkWeb3AccountExists, createWeb3Account } from '../api/user';
import { validateRequestAuth } from '../utils/auth';
import { APIResponseStatus } from '../models/api';
import { addShopItems, buyItem, getShopItems } from '../api/shop';
import { authMiddleware } from '../middlewares/auth';
import { ShopType } from '../models/shop';
import { claimClaimableItemFragments, claimClaimableItems } from '../api/item';
import { addIGC } from '../api/igc';

const router = express.Router();

router.post('/add_igc', authMiddleware(3), async (req, res) => {
    const { xId, marbleToAdd, goldToAdd } = req.body;

    try {
        const { status, message, data } = await addIGC(xId, marbleToAdd, goldToAdd);

        return res.status(status).json({
            status,
            message,
            data
        });
    } catch (err: any) {
        return res.status(APIResponseStatus.INTERNAL_SERVER_ERROR).json({
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(add_igc) Error: ${err.message}`
        });
    }
})

export default router;