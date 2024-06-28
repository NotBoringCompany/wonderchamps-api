"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJWT = exports.generateJWT = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const api_1 = require("../models/api");
/**
 * Generates a JWT token. Parameters are only X login-related for now.
 */
const generateJWT = (xId, xAccessToken, xRefreshToken) => {
    // JWT token expires in 1 day.
    return (0, jsonwebtoken_1.sign)({ xId, xAccessToken, xRefreshToken, xExpiresIn: 86400 }, process.env.JWT_SECRET, { expiresIn: '1d' });
};
exports.generateJWT = generateJWT;
/**
 * Checks for JWT validity.
 */
const validateJWT = (token) => {
    if (!token) {
        return {
            status: api_1.APIResponseStatus.UNAUTHORIZED,
            message: `(validateJWT) No token provided.`
        };
    }
    try {
        const decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET);
        // check for token expiration
        if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
            return {
                status: api_1.APIResponseStatus.UNAUTHORIZED,
                message: `(validateJWT) Token expired.`
            };
        }
        if (typeof decoded !== 'string'
            && 'xId' in decoded
            && 'xAccessToken' in decoded
            && 'xRefreshToken' in decoded
            && 'xExpiresIn' in decoded) {
            return {
                status: api_1.APIResponseStatus.SUCCESS,
                message: `(validateJWT) Token is valid.`,
                data: {
                    xId: decoded.xId,
                    xAccessToken: decoded.xAccessToken,
                    xRefreshToken: decoded.xRefreshToken,
                    xExpiresIn: decoded.exp - Math.floor(Date.now() / 1000),
                    jwtExpiry: decoded.exp
                }
            };
        }
        else {
            return {
                status: api_1.APIResponseStatus.UNAUTHORIZED,
                message: `(validateJWT) Invalid token.`
            };
        }
    }
    catch (err) {
        {
            return {
                status: api_1.APIResponseStatus.UNAUTHORIZED,
                message: `(validateJWT) ${err.message}`
            };
        }
    }
};
exports.validateJWT = validateJWT;
