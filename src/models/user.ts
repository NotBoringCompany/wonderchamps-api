/**
 * Represents a user.
 * 
 * Connected to the User instance in Wonderbits.
 */
export interface User {
    /** the unique database ID of the user */
    userId: string;
    /** the unique database ID of the user in the Wonderbits database */
    wonderbitsUserId: string;
}