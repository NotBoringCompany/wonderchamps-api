import { Request, Response } from 'express';
import { APIResponse, APIResponseStatus } from '../models/api';
import { validateJWT } from './jwt';

/**
 * Checks JWT token validity obtained from request headers in required routes.
 */
export const validateRequestAuth = async (
    req: Request,
    res: Response,
    // used for error message logging
    routeName: string | null
): Promise<APIResponse> => {
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // bearer JWT token

        if (!token) {
            return {
                status: APIResponseStatus.UNAUTHORIZED,
                message: `(${routeName ?? 'validateRequestAuth'}) No token provided.`
            }
        }

        const { status, message, data } = validateJWT(token);
        if (status !== APIResponseStatus.SUCCESS) {
            return {
                status,
                message: `(${routeName ?? 'validateRequestAuth'}) Error from validateJWT: ${message}`
            }
        }

        const { xId } = data;

        if (!xId) {
            return {
                status: APIResponseStatus.BAD_REQUEST,
                message: `(${routeName ?? 'validateRequestAuth'}) You denied the app or the token is invalid/expired.`
            }
        }

        // at this point, the token is deemed valid and we return the xId.
        return {
            status: APIResponseStatus.SUCCESS,
            message: `(${routeName ?? 'validateRequestAuth'}) Token is valid.`,
            data: {
                xId
            }
        }
    } catch (err: any) {
        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(${routeName ?? 'validateRequestAuth'}) Error: ${err.message}`
        }
    }
}