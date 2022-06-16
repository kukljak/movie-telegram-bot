const Users = require('../db/models/Users');
const Profiles = require('../db/models/Profiles');

const getProfile = async (context) => {
    const userInfo = await Users.findOne({id: context.update.callback_query.from.id});
    const profile = await Profiles.findOne({user: userInfo._id});
    return profile;
}

const getVoteToString = (vote) => {
    let rating = '';
    for(let i = 0; i < vote; i++) {
        rating = rating + '⭐️';
    }
    return rating;
}

module.exports = {
    getProfile,
    getVoteToString
}