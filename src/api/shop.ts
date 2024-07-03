import { APIResponse, APIResponseStatus } from '../models/api';
import axios from 'axios';
import { WONDERBITS_API_BASE_URL } from '../utils/constants/endpoints';
import { ExtendedXProfile } from '../utils/customProfiles';
import { WonderbitsUserModel, WonderchampsShopModel, WonderchampsUserModel } from '../utils/constants/db';
import { ShopItem, Web3UserItem } from '../models/item';
import { ShopType } from '../models/shop';
import { UserWallet } from '../models/wonderbits/user';
import { BASE_SEPOLIA_CLIENT, DEPLOYER_ACCOUNT, USER_ACCOUNT, WONDERCHAMPS_ABI, WONDERCHAMPS_CONTRACT } from '../utils/constants/web3';
import { packOwnedIGC, unpackOwnedIGC } from './igc';
import { generateDataHash, generateObjectId, generateSalt, generateSignature } from '../utils/crypto';
import { formatUnits, stringToBytes } from 'viem';
import { formatBonusStats, packNumData, packVehicleAdditionalNumericalData } from './item';

/**
 * Adds one or more set of items to a specific shop selling items of `shopType`.
 * 
 * Example: if `shopType` is `CHARACTERS`, then all `items` will be added to the `CHARACTERS` shop.
 * 
 * NOTE: If one or more of the items already exist, they will be skipped.
 */
export const addShopItems = async (
    shopType: ShopType,
    items: ShopItem[]
): Promise<APIResponse> => {
    try {
        const shop = await WonderchampsShopModel.findOne({ shopType }).lean();

        // if the shop doesn't exist yet, we can safely add all the items.
        if (!shop) {
            const newShop = new WonderchampsShopModel({
                _id: generateObjectId(),
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
        const shop = await WonderchampsShopModel.findOne({ shopType }).lean();

        if (!shop) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(buyItem) Shop not found.`
            }
        }

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
        const ownedIGC = await BASE_SEPOLIA_CLIENT.readContract({
            account: userAccount,
            address: WONDERCHAMPS_CONTRACT(userAccount).address,
            abi: WONDERCHAMPS_ABI,
            functionName: 'getOwnedIGC',
            args: [address]
        });
    
        // convert the ownedIGC to gold and marble respectively.
        // gold is the lower 128 bits of the ownedIGC, while marble is the higher 128 bits.
        const { gold, marble } = unpackOwnedIGC(ownedIGC as bigint);

        console.log('(buyItem) Gold:', gold);
        console.log('(buyItem) Marble:', marble);

        const item = (shop.items.find(shopItem => shopItem.itemId === itemId)) as ShopItem;

        if (!item) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(buyItem) Item not found in the shop.`
            }
        }

        if (paymentType === 'gold') {
            // firstly, check if the item can be bought with gold.
            if (item.goldPrice === 0) {
                return {
                    status: APIResponseStatus.BAD_REQUEST,
                    message: `(buyItem) Item cannot be bought with gold.`
                }
            }

            // check if the user has enough gold to buy the item.
            if (gold < BigInt(item.goldPrice)) {
                return {
                    status: APIResponseStatus.BAD_REQUEST,
                    message: `(buyItem) User does not have enough gold to buy the item.`
                }
            }
        } else {
            // firstly, check if the item can be bought with marble.
            if (item.marblePrice === 0) {
                return {
                    status: APIResponseStatus.BAD_REQUEST,
                    message: `(buyItem) Item cannot be bought with marble.`
                }
            }

            // check if the user has enough marble to buy the item.
            if (marble < BigInt(item.marblePrice)) {
                return {
                    status: APIResponseStatus.BAD_REQUEST,
                    message: `(buyItem) User does not have enough marble to buy the item.`
                }
            }
        }

        // check if the user already owns the item.
        const rawItemData = await BASE_SEPOLIA_CLIENT.readContract({
            account: userAccount,
            address: WONDERCHAMPS_CONTRACT(userAccount).address,
            abi: WONDERCHAMPS_ABI,
            functionName: 'getItems',
            args: [address, [itemId]]
        });

        const itemData = rawItemData as Web3UserItem[];

        // because we only want to fetch one item, we can safely get the first element.
        if (itemData[0].owned) {
            return {
                status: APIResponseStatus.BAD_REQUEST,
                message: `(buyItem) User already owns the item.`
            }
        }

        // check if the user has enough gas to both pay for:
        // 1. updating IGC to a new value (after deducting the user's IGC for the item)
        // 2. adding the item to their inventory (in the contract)
        // if they don't, throw an error.
        const salt = generateSalt(
            address as `0x${string}`,
            Math.floor(Date.now() / 1000)
        );
        const dataHash = generateDataHash(address as `0x${string}`, salt);
        const adminSig = await generateSignature(dataHash as `0x${string}`, DEPLOYER_ACCOUNT);

        const updateIGCEstimatedGasUnits = await BASE_SEPOLIA_CLIENT.estimateContractGas({
            address: WONDERCHAMPS_CONTRACT(userAccount).address,
            abi: WONDERCHAMPS_ABI,
            functionName: 'updateOwnedIGC',
            // inputting `ownedIGC` without precalculating the IGC first won't really impact the gas units, especially
            // as the value will decrease anyway, which should decrease the gas units. thus it's safe.
            args: [address, ownedIGC, [salt, adminSig]]
        });

        const addItemEstimatedGasUnits = await BASE_SEPOLIA_CLIENT.estimateContractGas({
            address: WONDERCHAMPS_CONTRACT(userAccount).address,
            abi: WONDERCHAMPS_ABI,
            functionName: 'addItemsToInventory',
            args: [
                address, 
                [
                    {
                        owned: true,
                        // ownedIGC should be reliable enough to represent `numData`, although it's not the same.
                        numData: ownedIGC,
                        // `additionalData` is an array of bytes. adminSig is 65 bytes, so it should be more than enough for a good estimation.
                        additionalData: [adminSig, adminSig, adminSig, adminSig]
                    }
                ],
                [salt, adminSig]
            ]
        });

        const { maxFeePerGas, maxPriorityFeePerGas } = await BASE_SEPOLIA_CLIENT.estimateFeesPerGas();

        const updateIGCEstimatedGasETH = parseFloat(formatUnits(updateIGCEstimatedGasUnits, 0)) * parseFloat((formatUnits(maxFeePerGas ?? BigInt(1000000), 18) + formatUnits(maxPriorityFeePerGas ?? BigInt(1000000), 18)));
        const addItemEstimatedGasETH = parseFloat(formatUnits(addItemEstimatedGasUnits, 0)) * parseFloat((formatUnits(maxFeePerGas ?? BigInt(1000000), 18) + formatUnits(maxPriorityFeePerGas ?? BigInt(1000000), 18)));

        const userOwnedETH = await BASE_SEPOLIA_CLIENT.getBalance({
            address: userAccount.address
        }).then(balance => parseFloat(formatUnits(balance, 18)));

        console.log('(buyItem) Update IGC Estimated Gas (ETH):', updateIGCEstimatedGasETH);
        console.log('(buyItem) Add Item Estimated Gas (ETH):', addItemEstimatedGasETH);
        console.log('(buyItem) User Owned ETH:', userOwnedETH);

        if (userOwnedETH < updateIGCEstimatedGasETH + addItemEstimatedGasETH) {
            return {
                status: APIResponseStatus.BAD_REQUEST,
                message: `(buyItem) User does not have enough ETH to buy the item.`,
                data: {
                    updateIGCEstimatedGasETH,
                    addItemEstimatedGasETH,
                    userOwnedETH
                }
            }
        }

        let newIGC: bigint = 0n;

        // based on the payment type, deduct the user's IGC.
        // if the user is paying with gold, deduct the gold amount in the IGC.
        // if the user is paying with marble, deduct the marble amount in the IGC.
        if (paymentType === 'gold') {
            const newGold = gold - BigInt(item.goldPrice);
            newIGC = packOwnedIGC(newGold, marble);
        } else {
            const newMarble = marble - BigInt(item.marblePrice);
            newIGC = packOwnedIGC(gold, newMarble);
        }

        // call `updateOwnedIGC` in the contract to update the user's IGC.
        const igcTxHash = await WONDERCHAMPS_CONTRACT(userAccount).write.updateOwnedIGC([address, newIGC, [salt, adminSig]]);
        console.log('(buyItem) Update IGC Tx Hash:', igcTxHash);

        // at this point, the user's IGC has been updated without issues.
        // now, convert the bonus stats of the item into a string.
        const bonusStatsString = item.bonusStats ? formatBonusStats(item.bonusStats) : '';
        // convert the string into a bytes array.
        const bonusStatsBytes = stringToBytes(bonusStatsString);

        // additional numerical data within the item's `numData`.
        // NOT to be confused with `additionalData`, which is used for buffs and so on.
        const additionalNumericalData = 
            shopType === ShopType.VEHICLES ?
                packVehicleAdditionalNumericalData(item.vehicleStats?.baseSpeed ?? 0, item.vehicleStats?.speedLimit ?? 0) :
                0n;

        // call `addItemsToInventory` in the contract to add the item to the user's inventory.
        const addItemsTxHash = await WONDERCHAMPS_CONTRACT(userAccount).write.addItemsToInventory(
            [
                address,
                [
                    {
                        owned: true,
                        numData: packNumData(
                            item.itemId,
                            item.level,
                            0,
                            additionalNumericalData                            
                        ),
                        additionalData: [bonusStatsBytes]
                    }
                ],
                [salt, adminSig]
            ]
        );

        console.log('(buyItem) Add Item Tx Hash:', addItemsTxHash);

        // at this point, the user has successfully bought the item.
        // do two things:
        // 1. reduce the item's stock by 1.
        // 2. add the itemId to the user's `inGameData.ownedItemIDs` array.
        const itemIndex = shop.items.findIndex(shopItem => shopItem.itemId === itemId);

        await WonderchampsShopModel.updateOne({ shopType }, {
            $set: {
                [`items.${itemIndex}.stock`]: item.stock - 1
            }
        });   
        
        await WonderchampsUserModel.updateOne({ _id: user._id }, {
            $push: {
                'inGameData.ownedItemIDs': itemId
            }
        });

        return {
            status: APIResponseStatus.SUCCESS,
            message: `(buyItem) Item bought successfully.`,
            data: {
                updatedIGCTxHash: igcTxHash,
                addItemTxHash: addItemsTxHash,
                itemBought: item
            }
        }
    } catch (err: any) {
        console.log('(buyItem) Error:', err.message);
        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(buyItem) Error: ${err.message}`
        }
    }
}

/**
 * Get all items from a specific shop.
 */
export const getShopItems = async (shopType?: ShopType): Promise<APIResponse> => {
    try {
        if (!shopType) {
            return {
                status: APIResponseStatus.BAD_REQUEST,
                message: `(getAllShopItems) Shop type not provided.`
            }
        }

        const shop = await WonderchampsShopModel.findOne({ shopType }).lean();

        return {
            status: APIResponseStatus.SUCCESS,
            message: `(getAllShopItems) Shop items fetched successfully.`,
            data: {
                items: shop?.items
            }
        };
    } catch (err: any) {
        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(getAllShopItems) Error: ${err.message}`
        };
    }
}