/**
 * Packs the given gold and marble amounts into a single bigint instance via bitshifting.
 * 
 * In the Wonderchamps contract, `gold` is the lower 128 bits of the owned IGC, while `marble` is the higher 128 bits.
 */
export const packOwnedIGC = (gold: bigint, marble: bigint): bigint => {
    return (marble << 128n) | gold;
}

/**
 * Unpacks the given owned IGC into its gold and marble amounts.
 * 
 * In the Wonderchamps contract, `gold` is the lower 128 bits of the owned IGC, while `marble` is the higher 128 bits.
 */
export const unpackOwnedIGC = (ownedIGC: bigint): { gold: bigint, marble: bigint } => {
    const gold = ownedIGC & ((1n << 128n) - 1n);
    const marble = ownedIGC >> 128n;

    return { gold, marble };
}