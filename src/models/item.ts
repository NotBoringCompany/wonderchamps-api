import { Widen } from 'viem';

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
    /** the item's type */
    itemType: ItemType;
    /** the item's level. */
    level: number;
    /** the fragments used so far. used primarily to level up `level`. */
    fragmentsUsed: number;
    /** vehicle stats (such as base speed and speed limit). only applicable to vehicles. */
    vehicleStats?: VehicleStats;
    /** optional: if this item has bonus stats, they will be added here. */
    bonusStats?: ItemBonusStats;
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
 * Represents the different types of items.
 */
export enum ItemType {
    CHARACTER = 'Character',
    VEHICLE = 'Vehicle',
    WHEEL = 'Wheel',
    GADGET = 'Gadget'
}

/**
 * Represents the item struct used in the Wonderchamps contract.
 */
export interface Web3UserItem {
    /** if the user owns the item */
    owned: boolean;
    /** the numData of the item */
    numData: bigint;
    /** any additional data of the item */
    additionalData: `0x${string}`[] | string[] | Uint8Array[];
}

/**
 * Represents the item fragment struct used in the Wonderchamps contract.
 */
export interface Web3UserItemFragment {
    /** if the user owns the item fragment */
    owned: boolean;
    /** the numData of the item fragment */
    numData: bigint;
}