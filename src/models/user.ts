import { Inventory } from './inventory';

/**
 * Represents a user.
 * 
 * Connected to the User instance in Wonderbits, thus only requiring the `userId`.
 */
export interface User {
    /** the unique database ID of the user */
    userId: string;
    /** the user's inventory */
    Inventory: Inventory;
}

/**
 * Represents the user's X account profile data connected to the user's account.
 */
export interface XProfile {
    /** the user's X ID */
    xId: string;
    /** the user's X username */
    xUsername: string;
    /** the user's X display name */
    xDisplayName: string;
    /** the user's X picture URL */
    xProfilePicture: string;
}
