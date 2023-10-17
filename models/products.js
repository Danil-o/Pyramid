const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['sofa', 'desk', 'lamp']
    },
    img: {
        url: String,
        filename: String
    },
    salesQty: {
        type: Number
    }
});

const model = mongoose.model('Product', productSchema);

module.exports = model;