const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chat'
    }
});


module.exports = Profile = mongoose.model('profile', ProfileSchema);