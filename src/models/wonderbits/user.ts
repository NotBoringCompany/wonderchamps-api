/**
 * Represents a user instance from the Wonderbits database.
 * 
 * Because the rest of the user data are stored in the Wonderbits database, 
 * this is used to prevent external HTTP requests constantly when needing user data.
 */
export interface User {
    /** the unique database ID of the user. This should be the exact same as the one stored in Wonderchamps. */
    userId: string;
    /** although Wonderchamps uses `xId`, Wonderbits still uses `twitterId`. */
    twitterId: string;
    /** the created wallet data for the user. */
    wallet: UserWallet;
    /** added when linking secondary wallets to the user's account. */
    secondaryWallets: UserSecondaryWallet[];
}

/**
 * Represents a user's Web3 wallet.
 */
export interface UserWallet {
    /** the wallet's address */
    address: string;
    /** the wallet's private key used to export the wallet */
    privateKey: string;
}

/**
 * Represents a user's secondary wallet that they can link to their account.
 */
export interface UserSecondaryWallet {
    /** the message used to generate the signature for verification */
    signatureMessage: string;
    /** the signature of the user from the secondary wallet, showing ownership of the wallet */
    signature: string;
    /** the secondary wallet's address */
    address: string;
}