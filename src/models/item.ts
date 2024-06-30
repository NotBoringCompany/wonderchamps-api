/**
 * Represents the base model of an item.
 */
export interface Item {
    /** the unique ID of the item. */
    itemId: number;
    /** the name of the item. */
    name: string;
    /** the item's description. */
    description: string;
}

/**
 * Represents the base model of an item fragment.
 */
export interface ItemFragment {
    /** the unique ID of the item fragment. */
    itemFragmentId: number;
    /** the item fragment's name. */
    name: string;
    /** the item fragment's description. */
    description: string;
}

/**
 * Represents an item owned by a user.
 */
export interface UserItem extends Item {
    /** the item's level. */
    level: number;
    /** the fragments used so far. used primarily to level up `level`. */
    fragmentsUsed: number;
    /** 
     * any additional data for the item. 
     * 
     * NOTE: this is in the form of a string such that it's intercompatible with the smart contract to add additional data of type `bytes`.
     * Depending on specific requirements, `additionalData` will be decoded accordingly.
     */
    additionalData: string;
}

/**
 * Represents an item fragment owned by a user.
 */
export interface UserItemFragment extends ItemFragment {
    /** the amount of this fragment owned by the user. */
    amount: number;
}

/**
 * Represents an item in the shop.
 */
export interface ShopItem extends Item {
    /** the item's level. useful if the item being sold is sold at a higher level. else, default to 1. */
    level: number;
    /** how much of this item is still in stock. if not purchasable, set to 0. */
    stock: number;
    /** the price of the item in marble. */
    marblePrice: number;
    /** the price of the item in gold. */
    goldPrice: number;
    /** vehicle stats (such as base speed and speed limit). only applicable to vehicles. */
    vehicleStats?: VehicleStats;
    /** optional: if this item has bonus stats, they will be added here. */
    bonusStats?: ItemBonusStats;
}

/**
 * Represents the stats of a vehicle item.
 */
export interface VehicleStats {
    /** the base speed of the vehicle */
    baseSpeed: number;
    /** the speed limit of the vehicle */
    speedLimit: number;
}

/**
 * Represents an item's bonus stats.
 * 
 * Specifics of each of the bonuses are TBD, thus no comment helpers are added yet.
 */
export interface ItemBonusStats {
    landBonus?: number;
    airBonus?: number;
    waterBonus?: number;
    wallBonus?: number;
    lineShapeBonus?: number;
    roundShapeBonus?: number;
    squareShapeBonus?: number;
    triangleShapeBonus?: number;
}

/**
 * Represents the user model used in the Wonderchamps contract.
 */
export interface Web3UserItem {
    /** if the user owns the item */
    owned: boolean;
    /** the numData of the item */
    numData: number;
    /** any additional data of the item */
    additionalData: string[];
}