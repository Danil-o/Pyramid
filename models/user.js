const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String
    },
    checkout: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Checkout'
        }
    ]
});

const model = mongoose.model('User', userSchema);

module.exports = model;