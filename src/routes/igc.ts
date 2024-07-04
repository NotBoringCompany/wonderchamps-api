import express from 'express';
import { checkWeb3AccountExists, createWeb3Account } from '../api/user';
import { validateRequestAuth } from '../utils/auth';
import { APIResponseStatus } from '../models/api';
import { addShopItems, buyItem, getShopItems } from '../api/shop';
import { authMiddleware } from '../middlewares/auth';
import { ShopType } from '../models/shop';
import { claimClaimableItemFragments, claimClaimableItems } from '../api/item';
import { addClaimableIGC, claimClaimableIGC } from '../api/igc';

const router = express.Router();

router.post('/add_claimable_igc', authMiddleware(3), async (req, res) => {
    const { xId, marbleToAdd, goldToAdd } = req.body;

    try {
        const { status, message, data } = await addClaimableIGC(xId, marbleToAdd, goldToAdd);

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
});

router.post('/claim_claimable_igc', async (req, res) => {
    try {
        const { status: validateStatus, message: validateMessage, data: validateData } = await validateRequestAuth(req, res, 'claim_igc');

        if (validateStatus !== APIResponseStatus.SUCCESS) {
            return res.status(validateStatus).json({
                status: validateStatus,
                message: validateMessage
            });
        }

        const { status, message, data } = await claimClaimableIGC(validateData?.xId);

        return res.status(status).json({
            status,
            message,
            data
        });
    } catch (err: any) {
        return res.status(APIResponseStatus.INTERNAL_SERVER_ERROR).json({
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(claim_igc) Error: ${err.message}`
        });
    }
})

export default router;