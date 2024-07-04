/**
 * Represents an update operations instance for MongoDB updates.
 */
export interface UpdateOperations {
    $pull: { [key: string]: any };
    $inc: { [key: string]: any };
    $set: { [key: string]: any };
    $push: {
        [key: string]: {
            $each: any[];
        };
    };
}