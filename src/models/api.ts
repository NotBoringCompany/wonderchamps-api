/**
 * Represents a response result/return value from an API endpoint or inheriting functions.
 */
export interface APIResponse {
    /** the response status */
    status: APIResponseStatus,
    /** any additional message to support the status reason */
    message: string,
    /** any additional data if needed */
    data?: any
}

/**
 * A list of possible (used) API response statuses.
 */
export enum APIResponseStatus {
    SUCCESS = 200,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500
}