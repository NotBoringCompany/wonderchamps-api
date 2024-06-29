import { ShopItem } from './item';

/**
 * Represents a shop for a specific item type.
 */
export interface Shop {
    /** the type of shop */
    shopType: ShopType;
    /** the items of `shopType` that are purchasable from the shop. */
    items: ShopItem[];
}

/**
 * Lists the different types of shops.
 */
export enum ShopType {
    CHARACTERS = 'Characters',
    VEHICLES = 'Vehicles',
    WHEELS = 'Wheels',
    GADGETS = 'Gadgets'
}