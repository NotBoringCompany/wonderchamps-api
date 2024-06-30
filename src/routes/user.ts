import express from 'express';
import { checkWeb3AccountExists, createWeb3Account } from '../api/user';
import { validateRequestAuth } from '../utils/auth';
import { APIResponseStatus } from '../models/api';

const router = express.Router();

router.get('/check_web3_account_exists/:xId', async (req, res) => {
    const { xId } = req.params;

    try {
        const { status, message, data } = await checkWeb3AccountExists(xId);

        return res.status(status).json({
            status,
            message,
            data
        });
    } catch (err: any) {
        return res.status(500).json({
            status: 500,
            message: `(check_web3_account_exists) Error: ${err.message}`
        });
    }
});

router.post('/create_web3_account', async (req, res) => {
    try {
        const { status: validateStatus, message: validateMessage, data: validateData } = await validateRequestAuth(req, res, 'create_web3_account');

        if (validateStatus !== APIResponseStatus.SUCCESS) {
            return res.status(validateStatus).json({
                status: validateStatus,
                message: validateMessage
            });
        }

        const { status, message, data } = await createWeb3Account(validateData?.xId);

        console.log('status: ', status);
        console.log('message: ', message);
        console.log('data: ', data);

        return res.status(status).json({
            status,
            message,
            data
        });
    } catch (err: any) {
        return res.status(500).json({
            status: 500,
            message: `(check_web3_account_exists) Error: ${err.message}`
        });
    }
})

export default router;