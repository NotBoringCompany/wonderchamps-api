import { APIResponse, APIResponseStatus } from '../models/api';
import axios from 'axios';
import { WONDERBITS_API_BASE_URL } from '../utils/constants/endpoints';
import { ExtendedXProfile } from '../utils/customProfiles';
import { WonderchampsShopModel, WonderchampsUserModel } from '../utils/constants/db';
import { ShopItem } from '../models/item';
import { ShopType } from '../models/shop';

/**
 * Adds one or more set of items to a specific shop selling items of `shopType`.
 * 
 * Example: if `shopType` is `CHARACTERS`, then all `items` will be added to the `CHARACTERS` shop.
 * 
 * NOTE: If one or more of the items already exist, they will be skipped.
 */
export const addShopItem = async (
    shopType: ShopType,
    items: ShopItem[]
): Promise<APIResponse> => {
    try {
        const shop = await WonderchampsShopModel.findOne({ shopType }).lean();

        // if the shop doesn't exist yet, we can safely add all the items.
        if (!shop) {
            const newShop = new WonderchampsShopModel({
                shopType,
                items
            });

            await newShop.save();

            return {
                status: APIResponseStatus.SUCCESS,
                message: `(addShopItem) Shop items added successfully to the ${shopType} shop.`,
            }
        }

        // if the shop exists, check if one or more items already exist in the shop.
        // if they do, skip them.
        const finalItems = items.filter(item => !shop.items.find(shopItem => shopItem.itemId === item.itemId));

        // if all items already exist, return early.
        if (finalItems.length === 0) {
            return {
                status: APIResponseStatus.BAD_REQUEST,
                message: `(addShopItem) All items already exist in the ${shopType} shop.`,
            }
        }

        // add the new items to the shop.
        await WonderchampsShopModel.updateOne({ shopType }, {
            $push: {
                items: {
                    $each: finalItems
                }
            }
        });

        return {
            status: APIResponseStatus.SUCCESS,
            message: `(addShopItem) Shop items added successfully to the ${shopType} shop.`,
            data: {
                finalItemsAdded: finalItems
            }
        };
    } catch (err: any) {
        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(addShopItem) Error: ${err.message}`
        }
    }
}