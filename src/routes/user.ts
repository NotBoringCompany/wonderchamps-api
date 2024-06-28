import express from 'express';
import { checkWeb3AccountExists } from '../api/user';

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
})