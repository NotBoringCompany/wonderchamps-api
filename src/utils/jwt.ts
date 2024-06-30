import { JwtPayload, sign, verify } from 'jsonwebtoken'
import { APIResponse, APIResponseStatus } from '../models/api';

/**
 * Generates a JWT token. Parameters are only X login-related for now.
 */
export const generateJWT = (
    xId: string, 
    xAccessToken: string, 
    xRefreshToken: string, 
) => {
    // JWT token expires in 1 day.
    return sign({ xId, xAccessToken, xRefreshToken, xExpiresIn: 86400 }, process.env.JWT_SECRET!, { expiresIn: '1d' });
}

/**
 * Checks for JWT validity.
 */
export const validateJWT = (token: string): APIResponse => {
    if (!token) {
        return {
            status: APIResponseStatus.UNAUTHORIZED,
            message: `(validateJWT) No token provided.`
        }
    }

    try {
        const decoded = verify(token, process.env.JWT_SECRET!) as JwtPayload;

        console.log('decoded: ', decoded);

        // check for token expiration
        if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
            return {
                status: APIResponseStatus.UNAUTHORIZED,
                message: `(validateJWT) Token expired.`
            }
        }

        if (
            typeof decoded !== 'string' 
            && 'xId' in decoded
            && 'xAccessToken' in decoded
            && 'xRefreshToken' in decoded
            && 'xExpiresIn' in decoded
        ) {
            return {
                status: APIResponseStatus.SUCCESS,
                message: `(validateJWT) Token is valid.`,
                data: {
                    xId: decoded.xId,
                    xAccessToken: decoded.xAccessToken ?? '',
                    xRefreshToken: decoded.xRefreshToken ?? '',
                    xExpiresIn: decoded.exp - Math.floor(Date.now() / 1000),
                    jwtExpiry: decoded.exp
                }
            }
        } else {
            return {
                status: APIResponseStatus.UNAUTHORIZED,
                message: `(validateJWT) Invalid token.`
            }
        
        }
    } catch (err: any) {
        {
            return {
                status: APIResponseStatus.UNAUTHORIZED,
                message: `(validateJWT) ${err.message}`
            }
        }
    }
}

validateJWT('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ4SWQiOiJhZG1feGlkXzEiLCJ4RXhwaXJlc0luIjo4NjQwMCwiaWF0IjoxNzE5Nzg3MjYzLCJleHAiOjE3MTk4NzM2NjN9.ITeNjYx9gSM7Y3dzA3Pk5WA6d9FDqWHZTlU8K-nwhFc');