/**
 * Represents a user.
 * 
 * Connected to the User instance in Wonderbits.
 * 
 * Therefore, the remaining user-related data will exist in the Wonderbits database.
 * 
 * NOTE: This is only temporary. In the future, the 'User' collection will be merged into one under a new database - Wonderverse.
 */
export interface User {
    /** 
     * the unique database ID of the user.
     * 
     * corresponds to the database ID of the user in the Wonderbits database.
     */
    userId: string;
}