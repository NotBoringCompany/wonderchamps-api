import { ItemBonusStats } from '../models/item';

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
        ((BigInt(fragmentsUsed) << 144n) & FRAGMENTS_MASK) |
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