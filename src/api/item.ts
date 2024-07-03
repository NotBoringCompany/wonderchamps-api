import { encodeFunctionData, formatUnits, fromBytes, getAbiItem, stringToBytes } from 'viem';
import { APIResponse, APIResponseStatus } from '../models/api';
import { ItemBonusStats, ItemType, UserItem, UserItemFragment, Web3UserItem, Web3UserItemFragment } from '../models/item';
import { UserWallet } from '../models/wonderbits/user';
import { WonderbitsUserModel, WonderchampsUserModel } from '../utils/constants/db';
import { BASE_SEPOLIA_CLIENT, DEPLOYER_ACCOUNT, USER_ACCOUNT, WONDERCHAMPS_ABI, WONDERCHAMPS_CONTRACT } from '../utils/constants/web3';
import { generateDataHash, generateSalt, generateSignature } from '../utils/crypto';
import { ADDITIONAL_NUMERICAL_DATA_MASK, ITEM_FRAGMENTS_MASK, ITEM_FRAGMENT_ADDITIONAL_NUMERICAL_DATA_MASK, ITEM_FRAGMENT_ID_MASK, ITEM_FRAGMENT_QUANTITY_MASK, ITEM_ID_MASK, ITEM_LEVEL_MASK } from '../utils/constants/item';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Attempts to claim either a specific set of items or all of a user's `claimableItems` from the database.
 * 
 * If an item is already owned in the user's Web3 account, this item is removed from the database and will NOT be claimed.
 */
export const claimClaimableItems = async (xId: string, itemsToClaim: UserItem[] | 'all'): Promise<APIResponse> => {
    try {
        const wonderbitsUserData = await WonderbitsUserModel.findOne({ twitterId: xId }).lean();

        if (!wonderbitsUserData) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(claimClaimableItems) User not found in Wonderbits database.`
            }
        }

        const user = await WonderchampsUserModel.findOne({ _id: wonderbitsUserData._id }).lean();

        if (!user) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(claimClaimableItems) User not found in Wonderchamps database.`
            }
        }

        const claimableItems = itemsToClaim === 'all' ? (user?.inGameData?.claimableItems as UserItem[]) : itemsToClaim;

        if (claimableItems.length === 0) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(claimClaimableItems) No claimable items found.`
            }
        }

        // separate into items that are actually claimable and ones that are unclaimable (e.g. already owned in the user's Web3 account)
        const actualClaimableItems: UserItem[] = [];
        const unclaimableItems: UserItem[] = [];

        // get the user's wallet
        const { privateKey, address } = wonderbitsUserData?.wallet as UserWallet;

        const userAccount = USER_ACCOUNT(privateKey);

        // the contract has a method called `getItems`. this allows an input of item IDs which will fetch the item data from the contract.
        // we will call this, and then, for each item data, check if `owned` is true. if it is, we will not claim that specific item and push it to `unclaimableItemIDs`.
        const itemData = (await BASE_SEPOLIA_CLIENT.readContract({
            account: userAccount,
            address: WONDERCHAMPS_CONTRACT(userAccount).address,
            abi: WONDERCHAMPS_ABI,
            functionName: 'getItems',
            args: [
                address, 
                claimableItems.map(item => item.itemId)
            ]
        })) as Web3UserItem[];

        // instead of unpacking the item ID from the item data instead, because each item is returned exactly how `claimableItems` is structured,
        // we can just use the current index and query `claimableItems` to fetch the item ID.
        // for example, if `claimableItems` is [ { itemId: 1, ...}, { itemId: 2, ...}, { itemId: 3, ...} ],
        // the data returned will be for item ID 1, 2, 3 in that order, so we can just use the current index to fetch the item ID from `claimableItems` again.
        for (let i = 0; i < itemData.length; i++) {
            if (itemData[i].owned) {
                unclaimableItems.push(claimableItems[i]);
            } else {
                actualClaimableItems.push(claimableItems[i]);
            }
        }

        // to estimate the gas required to claim all items, we will need to convert and pack the stats of each item anyway.
        // there is currently an `unknown` type issue if we assert a type here; therefore, we will manually convert the data to the required format.
        const formattedClaimableItems = [];

        if (actualClaimableItems.length === 0) {
            // delete the unclaimable items from the database.
            await WonderchampsUserModel.updateOne({ _id: user._id }, {
                $pull: {
                    'inGameData.claimableItems': {
                        itemId: { $in: unclaimableItems.map(item => item.itemId) }
                    }
                }
            });
            
            return {
                status: APIResponseStatus.SUCCESS,
                message: `(claimClaimableItems) No claimable items found. User may already have the items that are claimable.`
            }
        }

        for (let i = 0; i < actualClaimableItems.length; i++) {
            const item = actualClaimableItems[i];

            // now, convert the bonus stats of the item into a string.
            const bonusStatsString = item.bonusStats ? formatBonusStats(item.bonusStats) : '';
            // convert the string into a bytes array.
            const bonusStatsBytes = stringToBytes(bonusStatsString);
            // extra conversion from bytes to bytes in string format (instead of Uint8Array) to prevent `unknown type` error.
            const bonusStatsBytesAsString = fromBytes(
                bonusStatsBytes,
                'hex'
            );

            // additional numerical data within the item's `numData`.
            // NOT to be confused with `additionalData`, which is used for buffs and so on.
            const additionalNumericalData = 
                item.itemType === ItemType.VEHICLE ?
                    packVehicleAdditionalNumericalData(item.vehicleStats?.baseSpeed ?? 0, item.vehicleStats?.speedLimit ?? 0) :
                    0n;

            const formattedItemData = {
                owned: true,
                numData: packNumData(
                    item.itemId,
                    item.level,
                    item.fragmentsUsed,
                    additionalNumericalData
                ),
                additionalData: [bonusStatsBytesAsString]
            }

            formattedClaimableItems.push(formattedItemData);
        }

        const salt = generateSalt(
            address as `0x${string}`,
            Math.floor(Date.now() / 1000)
        );
        const dataHash = generateDataHash(address as `0x${string}`, salt);
        const adminSig = await generateSignature(dataHash as `0x${string}`, DEPLOYER_ACCOUNT);

        // estimate the gas required to claim all items.
        const addItemsEstimatedGasUnits = await BASE_SEPOLIA_CLIENT.estimateContractGas({
            address: WONDERCHAMPS_CONTRACT(userAccount).address,
            abi: WONDERCHAMPS_ABI,
            functionName: 'addItemsToInventory',
            args: [
                address,
                formattedClaimableItems,
                [salt, adminSig]
            ]
        });

        const userOwnedETH = await BASE_SEPOLIA_CLIENT.getBalance({
            address: userAccount.address
        }).then(balance => parseFloat(formatUnits(balance, 18)));

        const { maxFeePerGas, maxPriorityFeePerGas } = await BASE_SEPOLIA_CLIENT.estimateFeesPerGas();

        const addItemsEstimatedGasETH = parseFloat(formatUnits(addItemsEstimatedGasUnits, 0)) * parseFloat((formatUnits(maxFeePerGas ?? BigInt(1000000), 18) + formatUnits(maxPriorityFeePerGas ?? BigInt(1000000), 18)));

        if (userOwnedETH < addItemsEstimatedGasETH) {
            return {
                status: APIResponseStatus.BAD_REQUEST,
                message: `(claimClaimableItems) User does not have enough ETH to claim the items.`,
                data: {
                    estimatedGasETH: addItemsEstimatedGasETH,
                    userOwnedETH
                }
            }
        }

        // do the following things:
        // 1. claim the items by calling `addItemsToInventory` with the formatted items.
        // 2. remove the claimed items and unclaimable items from the database.
        const claimItemsTxHash = await WONDERCHAMPS_CONTRACT(userAccount).write.addItemsToInventory(
            [
                address,
                formattedClaimableItems,
                [salt, adminSig]
            ]
        );

        console.log('(claimClaimableItems) Successfully claimed the claimable items. Transaction hash:', claimItemsTxHash);

        // delete the claimed and unclaimable items from the database.
        await WonderchampsUserModel.updateOne({ _id: user._id }, {
            $pull: {
                'inGameData.claimableItems': {
                    itemId: { $in: actualClaimableItems.map(item => item.itemId) }
                }
            }
        });

        await WonderchampsUserModel.updateOne({ _id: user._id }, {
            $pull: {
                'inGameData.claimableItems': {
                    itemId: { $in: unclaimableItems.map(item => item.itemId) }
                }
            }
        });

        return {
            status: APIResponseStatus.SUCCESS,
            message: `(claimClaimableItems) Successfully claimed the claimable items.`,
            data: {
                itemsClaimed: actualClaimableItems,
                claimItemsTxHash
            }
        }
    } catch (err: any) {
        console.log('(claimClaimableItems) Error:', err.message)
        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(claimClaimableItems) Error: ${err.message}`
        }
    }
}

/**
 * Attempts to claim either a specific set of item fragments or all of a user's `claimableItemFragments` from the database.
 * 
 * Unlike items, item fragments can only exist in one instance, BUT the amount of that item fragment can increase. Therefore, for any item fragments
 * that are already owned in the user's Web3 account, the amount of that item fragment will be increased by the amount in the database.
 */
export const claimClaimableItemFragments = async (xId: string, itemFragmentsToClaim: UserItemFragment[] | 'all'): Promise<APIResponse> => {
    try {
        const wonderbitsUserData = await WonderbitsUserModel.findOne({ twitterId: xId }).lean();

        if (!wonderbitsUserData) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(claimClaimableItemFragments) User not found in Wonderbits database.`
            }
        }

        const user = await WonderchampsUserModel.findOne({ _id: wonderbitsUserData._id }).lean();

        if (!user) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(claimClaimableItemFragments) User not found in Wonderchamps database.`
            }
        }

        const claimableItemFragments = itemFragmentsToClaim === 'all' ? (user?.inGameData?.claimableItemFragments as UserItemFragment[]) : itemFragmentsToClaim;

        // if (claimableItemFragments.length === 0) {
        //     return {
        //         status: APIResponseStatus.NOT_FOUND,
        //         message: `(claimClaimableItemFragments) No claimable item fragments found.`
        //     }
        // }

        // separate into:
        // 1. fragments to increment (will call `updateItemFragmentNumData`) -> item fragments that are already owned by the user
        // 2. fragments to claim (will call `addItemFragmentToInventory`) -> item fragments that are not yet owned by the user
        const fragmentsToIncrement: UserItemFragment[] = [];
        const fragmentsToClaim: UserItemFragment[] = [];

        // get the user's wallet
        const { privateKey, address } = wonderbitsUserData?.wallet as UserWallet;

        const userAccount = USER_ACCOUNT(privateKey);

        // the contract has a method called `getItemFragments`. this allows an input of item fragment IDs which will fetch the item fragment data from the contract.
        // we will call this, and then, for each item fragment data, check if `owned` is true. if it is, we will add that item fragment to `fragmentsToIncrement`.
        // otherwise, we will add that item fragment to `fragmentsToClaim`.
        const itemFragmentData = (await BASE_SEPOLIA_CLIENT.readContract({
            account: userAccount,
            address: WONDERCHAMPS_CONTRACT(userAccount).address,
            abi: WONDERCHAMPS_ABI,
            functionName: 'getItemFragments',
            args: [
                address, 
                // claimableItemFragments.map(itemFragment => itemFragment.itemFragmentId)
                [1, 2, 3]
            ]
        })) as Web3UserItemFragment[];

        // instead of unpacking the item fragment ID from the item fragment data instead, because each item fragment is returned exactly how `claimableItemFragments` is structured,
        // we can just use the current index and query `claimableItemFragments` to fetch the item fragment ID.
        // for example, if `claimableItemFragments` is [ { itemFragmentId: 1, ...}, { itemFragmentId: 2, ...}, { itemFragmentId: 3, ...} ],
        // the data returned will be for item fragment ID 1, 2, 3 in that order, so we can just use the current index to fetch the item fragment ID from `claimableItemFragments` again.
        for (let i = 0; i < itemFragmentData.length; i++) {
            if (itemFragmentData[i].owned) {
                fragmentsToIncrement.push(claimableItemFragments[i]);
            } else {
                fragmentsToClaim.push(claimableItemFragments[i]);
            }
        }

        // to estimate the gas required to claim all item fragments, we will need to convert and pack the stats of each item fragment anyway.
        // there is currently an `unknown` type issue if we assert a type here; therefore, we will manually convert the data to the required format.
        const formattedFragmentsToIncrement = [];
        const formattedFragmentsToClaim = [];

        // for fragments to increment, we will call `updateItemFragmentNumData` to increment the amount of that item fragment.
        // to do this, we firstly need to get the `amount` of that item fragment, which is the 32 bits stored in the fragment's `numData` in bit pos 128 - 159.
        for (let i = 0; i < fragmentsToIncrement.length; i++) {
            const itemFragment = fragmentsToIncrement[i];

            const { quantity } = unpackItemFragmentNumData(itemFragmentData[i].numData);

            // pack the new num data with the incremented quantity.
            const newNumData = packItemFragmentNumData(
                itemFragment.itemFragmentId,
                Number(quantity) + itemFragment.amount,
                0n
            );

            formattedFragmentsToIncrement.push({
                itemFragmentId: itemFragment.itemFragmentId,
                numData: newNumData
            });
        }

        // for each item fragment to claim, we will need to pack the item fragment's data into the required format.
        for (let i = 0; i < fragmentsToClaim.length; i++) {
            const itemFragment = fragmentsToClaim[i];

            // additional numerical data within the item fragment's `numData`.
            // NOT to be confused with `additionalData`, which is used for buffs and so on.
            const additionalNumericalData = 0n;

            const formattedItemFragmentData = {
                owned: true,
                numData: packItemFragmentNumData(
                    itemFragment.itemFragmentId,
                    itemFragment.amount,
                    additionalNumericalData
                )
            }

            formattedFragmentsToClaim.push(formattedItemFragmentData);
        }

        // if both item fragments to claim and increment are empty, return.
        if (formattedFragmentsToIncrement.length === 0 && formattedFragmentsToClaim.length === 0) {
            return {
                status: APIResponseStatus.SUCCESS,
                message: `(claimClaimableItemFragments) No claimable item fragments found.`
            }
        }

        const salt = generateSalt(
            address as `0x${string}`,
            Math.floor(Date.now() / 1000)
        );
        const dataHash = generateDataHash(address as `0x${string}`, salt);
        const adminSig = await generateSignature(dataHash as `0x${string}`, DEPLOYER_ACCOUNT);

        // estimate the gas required to claim all item fragments.
        const claimFragmentsEstimatedGasUnits = 
            formattedFragmentsToClaim.length > 0 ? 
                await BASE_SEPOLIA_CLIENT.estimateContractGas({
                    address: WONDERCHAMPS_CONTRACT(userAccount).address,
                    abi: WONDERCHAMPS_ABI,
                    functionName: 'addItemFragmentsToInventory',
                    args: [
                        address,
                        formattedFragmentsToClaim,
                        [salt, adminSig]
                    ]
                }) :
            0n;
        
        // estimate the gas required to increment all item fragments.
        const updateFragmentsEstimatedGasUnits =
            formattedFragmentsToIncrement.length > 0 ?
                await BASE_SEPOLIA_CLIENT.estimateContractGas({
                    address: WONDERCHAMPS_CONTRACT(userAccount).address,
                    abi: WONDERCHAMPS_ABI,
                    functionName: 'updateItemFragmentNumData',
                    args: [
                        address,
                        formattedFragmentsToIncrement,
                        [salt, adminSig]
                    ]
                }) :
            0n;
    
        const userOwnedETH = await BASE_SEPOLIA_CLIENT.getBalance({
            address: userAccount.address
        }).then(balance => parseFloat(formatUnits(balance, 18)));

        const { maxFeePerGas, maxPriorityFeePerGas } = await BASE_SEPOLIA_CLIENT.estimateFeesPerGas();

        const claimFragmentsEstimatedGasETH = parseFloat(formatUnits(claimFragmentsEstimatedGasUnits, 0)) * parseFloat((formatUnits(maxFeePerGas ?? BigInt(1000000), 18) + formatUnits(maxPriorityFeePerGas ?? BigInt(1000000), 18)));
        const updateFragmentsEstimatedGasETH = parseFloat(formatUnits(updateFragmentsEstimatedGasUnits, 0)) * parseFloat((formatUnits(maxFeePerGas ?? BigInt(1000000), 18) + formatUnits(maxPriorityFeePerGas ?? BigInt(1000000), 18)));

        if (userOwnedETH < claimFragmentsEstimatedGasETH + updateFragmentsEstimatedGasETH) {
            return {
                status: APIResponseStatus.BAD_REQUEST,
                message: `(claimClaimableItemFragments) User does not have enough ETH to claim the item fragments.`,
                data: {
                    estimatedGasETH: claimFragmentsEstimatedGasETH + updateFragmentsEstimatedGasETH,
                    userOwnedETH
                }
            }
        }

        // do the following things:
        // 1. claim the item fragments by calling `addItemFragmentsToInventory` with the formatted item fragments to claim.
        // 2. increment the item fragments by calling `updateItemFragmentNumData` with the formatted item fragments to increment.
        // 3. remove the claimed item fragments from the database.
        const claimItemsTxHash = await WONDERCHAMPS_CONTRACT(userAccount).write.addItemFragmentsToInventory(
            [
                address,
                formattedFragmentsToClaim,
                [salt, adminSig]
            ]
        );

        const incrementItemsTxHash = await WONDERCHAMPS_CONTRACT(userAccount).write.updateItemFragmentNumData(
            [
                address,
                formattedFragmentsToIncrement,
                [salt, adminSig]
            ]
        );

        console.log('(claimClaimableItemFragments) Successfully claimed the claimable item fragments. Transaction hash:', claimItemsTxHash);

        // delete the claimed and incremented item fragments from the database.
        await WonderchampsUserModel.updateOne({ _id: user._id }, {
            $pull: {
                'inGameData.claimableItemFragments': {
                    itemFragmentId: { $in: fragmentsToClaim.map(itemFragment => itemFragment.itemFragmentId) }
                }
            }
        });

        await WonderchampsUserModel.updateOne({ _id: user._id }, {
            $pull: {
                'inGameData.claimableItemFragments': {
                    itemFragmentId: { $in: fragmentsToIncrement.map(itemFragment => itemFragment.itemFragmentId) }
                }
            }
        });

        return {
            status: APIResponseStatus.SUCCESS,
            message: `(claimClaimableItemFragments) Successfully claimed the claimable item fragments.`,
            data: {
                itemFragmentsClaimed: fragmentsToClaim,
                itemFragmentsIncremented: fragmentsToIncrement,
                claimItemsTxHash,
                incrementItemsTxHash
            }
        }
    } catch (err: any) {
        console.log('(claimClaimableItemFragments) Error:', err.message)
        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(claimClaimableItemFragments) Error: ${err.message}`
        }
    }
}

claimClaimableItemFragments('65519', 'all');

/**
 * Formats the bonus stats of an item into a concatenated string.
 * 
 * Primarily used to convert the bonus stats eventually into a `bytes` type to be stored in the smart contract's
 * `additionalData` field.
 */
export const formatBonusStats = (stats: ItemBonusStats): string => {
    return Object.entries(stats)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
}

/**
 * Packs the required numerical values of an item into a single bigint instance to be stored 
 * in the contract's `numData` field of the item via bitshifting.
 */
export const packNumData = (
    itemId: number,
    itemLevel: number,
    fragmentsUsed: number,
    /**
     * NOT to be confused with the item's `additionalData` field.
     * this is the additional NUMERICAL data to be stored within `numData`.
     */
    additionalNumericalData: bigint
): bigint => {
    return (BigInt(itemId) & ITEM_ID_MASK) |
        ((BigInt(itemLevel) << 128n) & ITEM_LEVEL_MASK) |
        ((BigInt(fragmentsUsed) << 144n) & ITEM_FRAGMENTS_MASK) |
        ((additionalNumericalData << 160n) & ADDITIONAL_NUMERICAL_DATA_MASK);
}

/**
 * Used to pack the base speed and speed limit of a vehicle within the item's `numData`'s `additionalNumericalData` bit positions.
 * 
 * Both base speed and speed limit have a maximum size of 16 bits each, making it 32 bits combined within the `additionalNumericalData`'s 96 bits.
 */
export const packVehicleAdditionalNumericalData = (baseSpeed: number, speedLimit: number): bigint => {
    // store base speed within the first 16 bits, and speed limit within the next 16 bits.
    return (BigInt(baseSpeed) & ((1n << 16n) - 1n)) |
        ((BigInt(speedLimit) & ((1n << 16n) - 1n)) << 16n);
}

/**
 * Packs the required numerical values of an item fragment into a single bigint instance to be stored
 * in the contract's `numData` field of the item fragment via bitshifting.
 */
export const packItemFragmentNumData = (
    itemFragmentId: number,
    quantity: number,
    /**
     * NOT to be confused with the item fragment's `additionalData` field.
     * this is the additional NUMERICAL data to be stored within `numData`.
     */
    additionalNumericalData: bigint
): bigint => {
    return (BigInt(itemFragmentId) & ITEM_FRAGMENT_ID_MASK) |
        ((BigInt(quantity) << 128n) & ITEM_FRAGMENT_QUANTITY_MASK) |
        ((additionalNumericalData << 160n) & ITEM_FRAGMENT_ADDITIONAL_NUMERICAL_DATA_MASK);
}

/**
 * Unpacks the item fragment's `numData` field to extract the item fragment ID, level, fragments used, and additional numerical data.
 */
export const unpackItemFragmentNumData = (numData: bigint): {
    itemFragmentId: bigint;
    quantity: bigint;
    additionalNumericalData: bigint;
} => {
    return {
        itemFragmentId: numData & ITEM_FRAGMENT_ID_MASK,
        quantity: (numData & ITEM_FRAGMENT_QUANTITY_MASK) >> 128n,
        additionalNumericalData: (numData & ITEM_FRAGMENT_ADDITIONAL_NUMERICAL_DATA_MASK) >> 160n
    }
}