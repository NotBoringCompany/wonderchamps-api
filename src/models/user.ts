import { UserIGC } from './igc';
import { UserItem, UserItemFragment } from './item';

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
    /**
     * the user's in-game data.
     */
    inGameData: InGameData;
}

/**
 * Represents the in-game data of a user.
 */
export interface InGameData {
    // the user's owned item IDs
    ownedItemIDs: number[];
    // the user's owned item fragment IDs
    ownedItemFragmentIDs: number[];
    /** all claimable items the user can claim to be added to their Web3 account. */
    claimableItems: UserItem[];
    /** all claimable item fragments the user can claim to be added to their Web3 account. */
    claimableItemFragments: UserItemFragment[];
    /** the claimable marble and gold (in-game currencies) the user can claim to be added to their Web3 account. */
    claimableIGC: UserIGC;
}

export type Creds = {
    id: string;
    name: string;
    username: string;
    method: string;
    role: number;
};

export type Authenticated = {
    creds: Creds;
    token: string;
};

