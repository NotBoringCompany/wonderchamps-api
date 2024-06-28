"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIResponseStatus = void 0;
/**
 * A list of possible (used) API response statuses.
 */
var APIResponseStatus;
(function (APIResponseStatus) {
    APIResponseStatus[APIResponseStatus["SUCCESS"] = 200] = "SUCCESS";
    APIResponseStatus[APIResponseStatus["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    APIResponseStatus[APIResponseStatus["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    APIResponseStatus[APIResponseStatus["FORBIDDEN"] = 403] = "FORBIDDEN";
    APIResponseStatus[APIResponseStatus["NOT_FOUND"] = 404] = "NOT_FOUND";
    APIResponseStatus[APIResponseStatus["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
})(APIResponseStatus || (exports.APIResponseStatus = APIResponseStatus = {}));
