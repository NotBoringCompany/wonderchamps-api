import mongoose, { Schema } from 'mongoose';

/**
 * Shop schema for Wonderchamps. Schema representation of the `Shop` interface in `models/shop.ts`.
 */
export const ShopSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    characters: [{
        itemId: Number,
        name: String,
        description: String,
        stock: Number,
        marblePrice: Number,
        goldPrice: Number,
        bonusStats: {
            landBonus: Number,
            airBonus: Number,
            waterBonus: Number,
            wallBonus: Number,
            lineShapeBonus: Number,
            roundShapeBonus: Number,
            squareShapeBonus: Number,
            triangleShapeBonus: Number,
            __v: false
        },
        __v: false
    }],
    vehicles: [{
        itemId: Number,
        name: String,
        description: String,
        stock: Number,
        marblePrice: Number,
        goldPrice: Number,
        bonusStats: {
            landBonus: Number,
            airBonus: Number,
            waterBonus: Number,
            wallBonus: Number,
            lineShapeBonus: Number,
            roundShapeBonus: Number,
            squareShapeBonus: Number,
            triangleShapeBonus: Number,
            __v: false
        },
        __v: false
    }],
    wheels: [{
        itemId: Number,
        name: String,
        description: String,
        stock: Number,
        marblePrice: Number,
        goldPrice: Number,
        bonusStats: {
            landBonus: Number,
            airBonus: Number,
            waterBonus: Number,
            wallBonus: Number,
            lineShapeBonus: Number,
            roundShapeBonus: Number,
            squareShapeBonus: Number,
            triangleShapeBonus: Number,
            __v: false
        },
        __v: false
    }],
    gadgets: [{
        itemId: Number,
        name: String,
        description: String,
        stock: Number,
        marblePrice: Number,
        goldPrice: Number,
        bonusStats: {
            landBonus: Number,
            airBonus: Number,
            waterBonus: Number,
            wallBonus: Number,
            lineShapeBonus: Number,
            roundShapeBonus: Number,
            squareShapeBonus: Number,
            triangleShapeBonus: Number,
            __v: false
        },
        __v: false
    }]
});