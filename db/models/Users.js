const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    is_bot: {
        type: Boolean,
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
    language_code: {
        type: String
    },
    movies: [
        {
            message_id: {
                type: Number
            },
            name: {
                type: String
            },
            vote: {
                type: Number
            },
            timeAdd: {
                type: Date
            }
        }
    ],
    wantedMovies: [
        {
            message_id: {
                type: Number
            },
            name: {
                type: String
            },
            timeAdd: {
                type: Date
            }
        }
    ]
});

module.exports = User = mongoose.model('user', UserSchema);