require('dotenv').config();
const { Scenes, session, Telegraf, Markup } = require('telegraf');
const introduceScene = require('./botScenes/introduceScene');
const connectDB = require('./db/index');
const Users = require('./db/models/Users');
const Chats = require('./db/models/Chats');
const Profiles = require('./db/models/Profiles');
const { getProfile } = require('./botHelpers/helpers');


connectDB();

const bot = new Telegraf(process.env.BOT_TOKEN);

const stage = new Scenes.Stage([introduceScene]);
let profile_id ;
let profileExist;
let profileInfo;
let userInfo;
let chatInfo;
bot.use(session());
bot.use(stage.middleware());

bot.start( async (ctx) => {
    ctx.reply(`Привіт ${ctx.from.first_name}! Це твій персональний менеджер для фільмів. \n Обери одну з наступних дій`, Markup.inlineKeyboard([
        Markup.button.callback('Переглянуті фільми','showMovies'),
        Markup.button.callback('Додати переглянутий фільм', 'writeMovie')
    ]));

    userInfo = await Users.findOne({id: ctx.message.from.id});
    chatInfo = await Chats.findOne({id: ctx.message.chat.id});

    profileInfo = await Profiles.findOne({user: userInfo?._id});
    profileExist = !!profileInfo;
    

    if (profileExist) {
        await Users.findOneAndUpdate({id: ctx.message.from.id}, {$set: ctx.message.from});
        await Chats.findOneAndUpdate({id: ctx.message.chat.id}, {$set: ctx.message.chat});
        profile_id = profileInfo._id;
    } else {
        const newUser = await Users.create(ctx.message.from);
        const newChat = await Chats.create(ctx.message.chat);
        profileInfo = await Profiles.create({user: newUser, chat: newChat});
        profile_id = profileInfo._id;
    }
    profileExist = false;
})

bot.action('writeMovie', async (ctx) => {
    const profile = await getProfile(ctx);
    profile_id = profile._id;
    
    await ctx.scene.enter('introduceScene', {profile_id: profile_id});
});

bot.action('showMovies', async (ctx) => {
    const profile = await getProfile(ctx);
    profile_id = profile._id;
    
    const { user } = await Profiles.findById(profile_id).populate('user');
    let moviesList = '';
    user.movies.map( (film,index) => moviesList = moviesList.concat('\n',`${index+1}. `,film.name));

    ctx.reply(moviesList);
});




bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))