const mongoose = require('mongoose');
require('dotenv');

const connectDB = () => {
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true })
        .then( () => {
            console.log('MongoDB Connected');
        })
        .catch( (err) => {
            console.log(err);
        })
}

module.exports = connectDB;