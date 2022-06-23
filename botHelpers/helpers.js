const Users = require('../db/models/Users');
const Profiles = require('../db/models/Profiles');
const { regexOnlyEmoji } = require('../constants');

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

const checkCtxType = (ctx, films = undefined ) => {
    if (/^[0-9]+$/.test(ctx.message.text) && ctx.message.text !== '0' && films && ctx.message.text - 1 < films.length) {
        return 'number';
    } else if (films && Number(ctx.message.text) > films.length || ctx.message.text === '0') {
        return 'notExistNumber';
    } else if (ctx.message.text && ctx.message.text === '/go0ut') {
        return 'goOutScene';
    } else if (ctx.message.text && ctx.message.text[0] === '/') {
        return 'command';
    } else if (ctx.message.text && !regexOnlyEmoji.test(ctx.message.text)) {
        return 'text';
    } else {
        return 'Other';
    }
}

module.exports = {
    getProfile,
    getVoteToString,
    checkCtxType
}