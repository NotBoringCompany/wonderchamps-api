import { ShopItem } from './item';

/**
 * Represents the shop.
 */
export interface Shop {
    /** the characters that are on sale on the shop. */
    characters: ShopItem[];
    /** the vehicles that are on sale on the shop. */
    vehicles: ShopItem[];
    /** the wheels that are on sale on the shop. */
    wheels: ShopItem[];
    /** the gadgets that are on sale on the shop. */
    gadgets: ShopItem[];
}