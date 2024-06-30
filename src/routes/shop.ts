import express from 'express';
import { checkWeb3AccountExists, createWeb3Account } from '../api/user';
import { validateRequestAuth } from '../utils/auth';
import { APIResponseStatus } from '../models/api';
import { addShopItems, buyItem, getShopItems } from '../api/shop';
import { authMiddleware } from '../middlewares/auth';
import { ShopType } from '../models/shop';

const router = express.Router();

router.post('/add_shop_items', authMiddleware(3), async (req, res) => {
    const { shopType, items } = req.body;

    try {
        const { status, message, data } = await addShopItems(shopType, items);

        return res.status(status).json({
            status,
            message,
            data
        });
    } catch (err: any) {
        return res.status(APIResponseStatus.INTERNAL_SERVER_ERROR).json({
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(add_shop_items) Error: ${err.message}`
        });
    }
});

router.get('/get_shop_items', authMiddleware(3), async (req, res) => {
    const { shopType } = req.query;

    try {
        const { status, message, data } = await getShopItems(shopType as ShopType | undefined);

        return res.status(status).json({
            status,
            message,
            data
        });
    } catch (err: any) {
        return res.status(APIResponseStatus.INTERNAL_SERVER_ERROR).json({
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(add_shop_items) Error: ${err.message}`
        });
    }
});

router.post('/buy_item', async (req, res) => {
    const { shopType, itemId, paymentType } = req.body;

    try {
        if (paymentType !== 'gold' && paymentType !== 'marble') {
            return res.status(APIResponseStatus.BAD_REQUEST).json({
                status: APIResponseStatus.BAD_REQUEST,
                message: `(buy_item) Invalid payment type.`
            });
        }

        const { status: validateStatus, message: validateMessage, data: validateData } = await validateRequestAuth(req, res, 'buy_item');

        if (validateStatus !== APIResponseStatus.SUCCESS) {
            return res.status(validateStatus).json({
                status: validateStatus,
                message: validateMessage
            });
        }

        const { status, message, data } = await buyItem(validateData?.xId, shopType, itemId, paymentType);

        return res.status(status).json({
            status,
            message,
            data
        });
    } catch (err: any) {
        return res.status(APIResponseStatus.BAD_REQUEST).json({
            status: APIResponseStatus.BAD_REQUEST,
            message: `(buy_item) Error: ${err.message}`
        });
    }
})

export default router;