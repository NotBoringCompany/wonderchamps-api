/** mask for the lower 128 bits to store the item ID */
export const ITEM_ID_MASK = (1n << 128n) - 1n;
/** mask for the next 16 bits (bit pos 128-143) to store the item level */
export const ITEM_LEVEL_MASK = ((1n << 16n) - 1n) << 128n;
/** mask for the next 16 bits (bit pos 144-159) to store the fragments used */
export const ITEM_FRAGMENTS_MASK = ((1n << 16n) - 1n) << 144n;
/** mask for the next 96 bits at position 160-255 to store additional numerical data */
export const ADDITIONAL_NUMERICAL_DATA_MASK = ((1n << 96n) - 1n) << 160n;
