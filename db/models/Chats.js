const mongoose = require('mongoose');

const ChatsSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    first_name: {
        type: String
    },
    last_name: {
        type: String
    },
    username: {
        type: String
    },
    type: {
        type: String
    }
});


module.exports = Chat = mongoose.model('chat', ChatsSchema);