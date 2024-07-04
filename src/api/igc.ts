import { formatUnits } from 'viem';
import { APIResponse, APIResponseStatus } from '../models/api';
import { UserWallet } from '../models/wonderbits/user';
import { WonderbitsUserModel, WonderchampsUserModel } from '../utils/constants/db';
import { BASE_SEPOLIA_CLIENT, DEPLOYER_ACCOUNT, USER_ACCOUNT, WONDERCHAMPS_ABI, WONDERCHAMPS_CONTRACT } from '../utils/constants/web3';
import { generateDataHash, generateSalt, generateSignature } from '../utils/crypto';
import { UserIGC } from '../models/igc';

// /**
//  * Adds IGC to a user's Web3 account. Usually called when the user earns IGC in-game (e.g. via quests, finishing a game, etc.).
//  * 
//  * This function will firstly check if the user has enough ETH to pay for gas fees to update the IGC in the Web3 account. If not,
//  * this function will add the IGC to the user's claimable IGC in the database to be claimed manually later once the user has enough ETH.
//  */
// export const addIGC = async (xId: string, marbleToAdd?: number, goldToAdd?: number): Promise<APIResponse> => {
//     try {
//         const wonderbitsUserData = await WonderbitsUserModel.findOne({ twitterId: xId }).lean();

//         if (!wonderbitsUserData) {
//             return {
//                 status: APIResponseStatus.NOT_FOUND,
//                 message: `(addIGC) User not found in Wonderbits database.`
//             }
//         }

//         const user = await WonderchampsUserModel.findOne({ _id: wonderbitsUserData._id }).lean();

//         if (!user) {
//             return {
//                 status: APIResponseStatus.NOT_FOUND,
//                 message: `(addIGC) User not found in Wonderchamps database.`
//             }
//         }

//         // check if at least marble or gold is provided.
//         if ((!marbleToAdd && !goldToAdd) || (marbleToAdd === 0 && goldToAdd === 0)) {
//             return {
//                 status: APIResponseStatus.BAD_REQUEST,
//                 message: `(addIGC) Invalid IGC values.`
//             }
//         }

//         const { privateKey, address } = wonderbitsUserData?.wallet as UserWallet;

//         const userAccount = USER_ACCOUNT(privateKey);

//         // get the user's current IGC by calling `getOwnedIGC` from the contract.
//         const ownedIGC = (await BASE_SEPOLIA_CLIENT.readContract({
//             account: userAccount,
//             address: WONDERCHAMPS_CONTRACT(userAccount).address,
//             abi: WONDERCHAMPS_ABI,
//             functionName: 'getOwnedIGC',
//             args: [address]
//         })) as bigint;

//         // unpack into gold and marble
//         const { gold, marble } = unpackOwnedIGC(ownedIGC);

//         // add the new IGC to the existing IGC
//         const newIGC = packOwnedIGC(gold + BigInt(goldToAdd!), marble + BigInt(marbleToAdd!));

//         // if the new IGC is the same as the old IGC, then no IGC was added. return an error.
//         if (newIGC === ownedIGC) {
//             return {
//                 status: APIResponseStatus.BAD_REQUEST,
//                 message: `(addIGC) No IGC added.`
//             }
//         }

        // const salt = generateSalt(
        //     address as `0x${string}`,
        //     Math.floor(Date.now() / 1000)
        // );
        // const dataHash = generateDataHash(address as `0x${string}`, salt);
        // const adminSig = await generateSignature(dataHash as `0x${string}`, DEPLOYER_ACCOUNT);

        // // check if the user has enough ETH to pay for gas fees
        // const updateIGCEstimatedGasUnits = await BASE_SEPOLIA_CLIENT.estimateContractGas({
        //     address: WONDERCHAMPS_CONTRACT(userAccount).address,
        //     abi: WONDERCHAMPS_ABI,
        //     functionName: 'updateOwnedIGC',
        //     args: [
        //         address,
        //         newIGC,
        //         [salt, adminSig]
        //     ]
        // });

        // const { maxFeePerGas, maxPriorityFeePerGas } = await BASE_SEPOLIA_CLIENT.estimateFeesPerGas();

        // const updateIGCEstimatedGasETH = parseFloat(formatUnits(updateIGCEstimatedGasUnits, 0)) * parseFloat((formatUnits(maxFeePerGas ?? BigInt(1000000), 18) + formatUnits(maxPriorityFeePerGas ?? BigInt(1000000), 18)));

        // const userOwnedETH = await BASE_SEPOLIA_CLIENT.getBalance({
        //     address: userAccount.address
        // }).then(balance => parseFloat(formatUnits(balance, 18)));

//         if (userOwnedETH < updateIGCEstimatedGasETH) {
//             const { status, message, data } = await addClaimableIGC(xId, marbleToAdd, goldToAdd);

//             if (status !== APIResponseStatus.SUCCESS) {
//                 return {
//                     status,
//                     message: `(addIGC) Error from addClaimableIGC: ${message}`
//                 }
//             }

//             return {
//                 status: APIResponseStatus.SUCCESS,
//                 message: `(addIGC) User does not have enough ETH to pay for gas fees. IGC added to claimable IGC in the database for manual claiming.`,
//                 data: {
//                     marbleAdded: marbleToAdd,
//                     goldAdded: goldToAdd
//                 }
//             }
//         }

//         // update the user's IGC in the contract
//         const updateIGCTxHash = await WONDERCHAMPS_CONTRACT(userAccount).write.updateOwnedIGC([address, newIGC, [salt, adminSig]]);
//         console.log(`(addIGC) IGC updated. Tx hash: ${updateIGCTxHash}`);

//         return {
//             status: APIResponseStatus.SUCCESS,
//             message: `(addIGC) IGC added successfully.`,
//             data: {
//                 marbleAdded: marbleToAdd,
//                 goldAdded: goldToAdd
//             }
//         }
//     } catch (err: any) {
//         console.log(`(addIGC) Error: ${err.message}`);
//         return {
//             status: APIResponseStatus.INTERNAL_SERVER_ERROR,
//             message: `(addIGC) Error: ${err.message}`
//         }
//     }
// }

/**
 * Adds claimable IGC to a user's account in the database (not Web3). Usually called after the user earns IGC in-game.
 * 
 * IGC is added to the database instead of directly to the user's Web3 account to prevent excessive transaction fees for continuously updating the Web3 account's IGC.
 * 
 * Claimable IGC in the database can be manually claimed by the user later if they have enough ETH to pay for gas fees.
 */
export const addClaimableIGC = async (xId: string, marbleToAdd?: number, goldToAdd?: number): Promise<APIResponse> => {
    try {
        const wonderbitsUserData = await WonderbitsUserModel.findOne({ twitterId: xId }).lean();

        if (!wonderbitsUserData) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(addClaimableIGC) User not found in Wonderbits database.`
            }
        }

        const user = await WonderchampsUserModel.findOne({ _id: wonderbitsUserData._id }).lean();

        if (!user) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(addClaimableIGC) User not found in Wonderchamps database.`
            }
        }

        // check if at least marble or gold is provided.
        if ((!marbleToAdd && !goldToAdd) || (marbleToAdd === 0 && goldToAdd === 0)) {
            return {
                status: APIResponseStatus.BAD_REQUEST,
                message: `(addClaimableIGC) Invalid IGC values.`
            }
        }

        // add the new IGC to the existing claimable IGC
        const { marble, gold } = user?.inGameData?.claimableIGC as UserIGC;

        await WonderchampsUserModel.updateOne({ _id: wonderbitsUserData._id }, {
            $set: {
                'inGameData.claimableIGC': {
                    marble: marble + marbleToAdd!,
                    gold: gold + goldToAdd!
                }
            }
        });

        return {
            status: APIResponseStatus.SUCCESS,
            message: `(addClaimableIGC) Claimable IGC added successfully to database.`,
            data: {
                marbleAdded: marbleToAdd,
                goldAdded: goldToAdd,
                previousIGC: { marble, gold },
                newIGC: { marble: marble + marbleToAdd!, gold: gold + goldToAdd! }
            }
        }
    } catch (err: any) {
        console.log(`(addClaimableIGC) Error: ${err.message}`);
        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(addClaimableIGC) Error: ${err.message}`
        }
    }
}

/**
 * Claims the claimable IGC of a user from the database and adds it to the user's Web3 account.
 * 
 * Will revert if the user does not have enough ETH to pay for gas fees.
 */
export const claimClaimableIGC = async (xId: string): Promise<APIResponse> => {
    try {
        const wonderbitsUserData = await WonderbitsUserModel.findOne({ twitterId: xId }).lean();

        if (!wonderbitsUserData) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(claimClaimableIGC) User not found in Wonderbits database.`
            }
        }

        const user = await WonderchampsUserModel.findOne({ _id: wonderbitsUserData._id }).lean();

        if (!user) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(claimClaimableIGC) User not found in Wonderchamps database.`
            }
        }

        const { marble: claimableMarble, gold: claimableGold } = user?.inGameData?.claimableIGC as UserIGC;

        // if the user has no claimable IGC, return an error.
        if (claimableMarble === 0 && claimableGold === 0) {
            return {
                status: APIResponseStatus.BAD_REQUEST,
                message: `(claimClaimableIGC) No claimable IGC to claim.`
            }
        }

        const { privateKey, address } = wonderbitsUserData?.wallet as UserWallet;

        const userAccount = USER_ACCOUNT(privateKey);

        // get the user's current IGC by calling `getOwnedIGC` from the contract.
        const ownedIGC = (await BASE_SEPOLIA_CLIENT.readContract({
            account: userAccount,
            address: WONDERCHAMPS_CONTRACT(userAccount).address,
            abi: WONDERCHAMPS_ABI,
            functionName: 'getOwnedIGC',
            args: [address]
        })) as bigint;

        // unpack into gold and marble
        const { gold, marble } = unpackOwnedIGC(ownedIGC);

        // add the claimable IGC to the existing IGC
        const newIGC = packOwnedIGC(gold + BigInt(claimableGold), marble + BigInt(claimableMarble));

        // if the new IGC is the same as the old IGC, then no IGC was added. return an error.
        // this shouldn't happen, but just in case.
        if (newIGC === ownedIGC) {
            return {
                status: APIResponseStatus.BAD_REQUEST,
                message: `(claimClaimableIGC) No IGC claimed.`
            }
        }

        const salt = generateSalt(
            address as `0x${string}`,
            Math.floor(Date.now() / 1000)
        );
        const dataHash = generateDataHash(address as `0x${string}`, salt);
        const adminSig = await generateSignature(dataHash as `0x${string}`, DEPLOYER_ACCOUNT);

        // check if the user has enough ETH to pay for gas fees
        const updateIGCEstimatedGasUnits = await BASE_SEPOLIA_CLIENT.estimateContractGas({
            address: WONDERCHAMPS_CONTRACT(userAccount).address,
            abi: WONDERCHAMPS_ABI,
            functionName: 'updateOwnedIGC',
            args: [
                address,
                newIGC,
                [salt, adminSig]
            ]
        });

        const { maxFeePerGas, maxPriorityFeePerGas } = await BASE_SEPOLIA_CLIENT.estimateFeesPerGas();

        const updateIGCEstimatedGasETH = parseFloat(formatUnits(updateIGCEstimatedGasUnits, 0)) * parseFloat((formatUnits(maxFeePerGas ?? BigInt(1000000), 18) + formatUnits(maxPriorityFeePerGas ?? BigInt(1000000), 18)));

        const userOwnedETH = await BASE_SEPOLIA_CLIENT.getBalance({
            address: userAccount.address
        }).then(balance => parseFloat(formatUnits(balance, 18)));

        if (userOwnedETH < updateIGCEstimatedGasETH) {
            return {
                status: APIResponseStatus.BAD_REQUEST,
                message: `(claimClaimableIGC) User does not have enough ETH to pay for gas fees.`
            }
        }

        // update the user's IGC in the contract
        const updateIGCTxHash = await WONDERCHAMPS_CONTRACT(userAccount).write.updateOwnedIGC([address, newIGC, [salt, adminSig]]);
        console.log(`(claimClaimableIGC) IGC claimed. Tx hash: ${updateIGCTxHash}`);

        // reset the user's claimable IGC in the database
        await WonderchampsUserModel.updateOne({ _id: wonderbitsUserData._id }, {
            $set: {
                'inGameData.claimableIGC': {
                    marble: 0,
                    gold: 0
                }
            }
        });

        return {
            status: APIResponseStatus.SUCCESS,
            message: `(claimClaimableIGC) IGC claimed successfully.`,
            data: {
                marbleClaimed: claimableMarble,
                goldClaimed: claimableGold,
                previousIGC: { marble, gold },
                newIGC: { marble: marble + BigInt(claimableMarble), gold: gold + BigInt(claimableGold) }
            }
        }
    } catch (err: any) {
        console.log(`(claimClaimableIGC) Error: ${err.message}`);
        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(claimClaimableIGC) Error: ${err.message}`
        }
    }
}

/**
 * Get the user's owned IGC from their Web3 account. 
 */
export const getOwnedIGC = async (xId: string): Promise<APIResponse> => {
    try {
        const wonderbitsUserData = await WonderbitsUserModel.findOne({ twitterId: xId }).lean();

        if (!wonderbitsUserData) {
            return {
                status: APIResponseStatus.NOT_FOUND,
                message: `(getOwnedIGC) User not found in Wonderbits database.`
            }
        }

        const { privateKey, address } = wonderbitsUserData?.wallet as UserWallet;

        const userAccount = USER_ACCOUNT(privateKey);

        // get the user's current IGC by calling `getOwnedIGC` from the contract.
        const ownedIGC = (await BASE_SEPOLIA_CLIENT.readContract({
            account: userAccount,
            address: WONDERCHAMPS_CONTRACT(userAccount).address,
            abi: WONDERCHAMPS_ABI,
            functionName: 'getOwnedIGC',
            args: [address]
        })) as bigint;

        // unpack into gold and marble
        const { gold, marble } = unpackOwnedIGC(ownedIGC);

        return {
            status: APIResponseStatus.SUCCESS,
            message: `(getOwnedIGC) IGC retrieved successfully.`,
            data: {
                gold,
                marble
            }
        }
    } catch (err: any) {
        console.log(`(getOwnedIGC) Error: ${err.message}`);
        return {
            status: APIResponseStatus.INTERNAL_SERVER_ERROR,
            message: `(getOwnedIGC) Error: ${err.message}`
        }
    }
}

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