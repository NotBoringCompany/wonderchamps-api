import { APIResponse, APIResponseStatus } from '../models/api';
import axios from 'axios';
import { WONDERBITS_API_BASE_URL } from '../utils/constants/endpoints';
import { ExtendedXProfile } from '../utils/customProfiles';
import { WonderbitsUserModel, WonderchampsShopModel, WonderchampsUserModel } from '../utils/constants/db';
import { ShopItem } from '../models/item';
import { ShopType } from '../models/shop';
import { UserWallet } from '../models/wonderbits/user';
import { USER_ACCOUNT, WONDERCHAMPS_CONTRACT } from '../utils/constants/web3';

/**
 * Adds one or more set of items to a specific shop selling items of `shopType`.
 * 
 * Example: if `shopType` is `CHARACTERS`, then all `items` will be added to the `CHARACTERS` shop.
 * 
 * NOTE: If one or more of the items already exist, they will be skipped.
 */
export const addShopItems = async (
    shopType: ShopType,
    items: ShopItem[],
    adminKey: string
): Promise<APIResponse> => {
    try {
        // check if the admin key is valid.
        if (adminKey !== process.env.ADMIN_KEY) {
            return {
                status: APIResponseStatus.UNAUTHORIZED,
                message: `(addShopItem) Unauthorized. Invalid admin key.`
            }
        }

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

/**
 * (User) Buys an item from a specific shop.
 * 
 * If the user already owns the item, the purchase will be rejected.
 */
export const buyItem = async (xId: string, shopType: ShopType, itemId: number, paymentType: 'gold' | 'marble'): Promise<APIResponse> => {
    try {
        // const shop = await WonderchampsShopModel.findOne({ shopType }).lean();

        // if (!shop) {
        //     return {
        //         status: APIResponseStatus.NOT_FOUND,
        //         message: `(buyItem) Shop not found.`
        //     }
        // }

        const wonderbitsUserData = await WonderbitsUserModel.findOne({ twitterId: xId }).lean();

        if (!wonderbitsUserData) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(buyItem) User not found in Wonderbits database.`
            }
        }

        const user = await WonderchampsUserModel.findOne({ _id: wonderbitsUserData._id }).lean();

        if (!user) {
            console.log('(buyItem) User not found in Wonderchamps database.');

            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(buyItem) User not found in Wonderchamps database.`
            }
        }

        // get the user's wallet
        const { privateKey, address } = wonderbitsUserData?.wallet as UserWallet;

        const userAccount = USER_ACCOUNT(privateKey);

        // call `getOwnedIGC` to get the owned IGC of the user.
        const ownedIGC = await WONDERCHAMPS_CONTRACT(userAccount).read.getOwnedIGC([address]);
        console.log('Owned IGC:', ownedIGC);

        return {
            status: APIResponseStatus.SUCCESS,
            message: `(buyItem) Item bought successfully.`,
        }
    } catch (err: any) {
        console.log('(buyItem) Error:', err.message);
        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(buyItem) Error: ${err.message}`
        }
    }
}

// buyItem('1465263138643791874', ShopType.CHARACTERS, 1, 'gold');