require('dotenv').config();
const { Scenes, session, Telegraf, Markup } = require('telegraf');
const recordViewedFilm = require('./botScenes/recordViewedFilm');
const deleteViewedFilm = require('./botScenes/deleteViewedFilm');
const editViewedFilm = require('./botScenes/editViewedFilm');
const connectDB = require('./db/index');
const Users = require('./db/models/Users');
const Chats = require('./db/models/Chats');
const Profiles = require('./db/models/Profiles');
const { getProfile, getVoteToString } = require('./botHelpers/helpers');


connectDB();

const bot = new Telegraf(process.env.BOT_TOKEN);

const stage = new Scenes.Stage([recordViewedFilm, deleteViewedFilm, editViewedFilm]);
let profile_id ;
let profileExist;
let profileInfo;
let userInfo;
let chatInfo;
bot.use(session());
bot.use(stage.middleware());

bot.start( async (ctx) => {
    try {
        ctx.reply(`Привіт ${ctx.from.first_name}! Це твій персональний менеджер для фільмів. \nРазом з ним, ти можеш створити список переглянутих фільмів, оцінити його та вивести список в чат \n\nОбери одну з наступних дій`, Markup.inlineKeyboard([
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
    } catch (error) {
        console.error(error);
    }
})

bot.action('writeMovie', async (ctx) => {
    try {
        const profile = await getProfile(ctx);
        profile_id = profile._id;
        
        await ctx.scene.enter('recordViewedFilm', {profile_id: profile_id});
    } catch (error) {
        console.error(error);
    }
});

bot.action('showMovies', async (ctx) => {
    try {
        const profile = await getProfile(ctx);
        profile_id = profile._id;
        
        const { user } = await Profiles.findById(profile_id).populate('user');
        let moviesList = '';
        user.movies.map( (film,index) => {
            let rating = getVoteToString(film.vote);
            moviesList = moviesList.concat('\n',`${index+1}. `,film.name, '\n', rating, `(${film.vote}/10)`);
        });
    
        await ctx.reply(moviesList);
    } catch (error) {
        console.error(error);
    }
});

bot.command('delete', async (ctx) => {
    userInfo = await Users.findOne({id: ctx.message.from.id});
    profileInfo = await Profiles.findOne({user: userInfo?._id});
    profile_id = profileInfo._id;

    await ctx.scene.enter('deleteViewedFilm', {profile_id: profile_id});
});

bot.command('edit', async (ctx) => {
    userInfo = await Users.findOne({id: ctx.message.from.id});
    profileInfo = await Profiles.findOne({user: userInfo?._id});
    profile_id = profileInfo._id;

    await ctx.scene.enter('editViewedFilm', {profile_id: profile_id});
});

bot.command('restart', async (ctx) => {
    await ctx.scene.leave();
})

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
