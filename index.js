require('dotenv').config();
const { Scenes, session, Telegraf, Markup } = require('telegraf');
const recordViewedFilm = require('./botScenes/recordViewedFilm');
const deleteViewedFilm = require('./botScenes/deleteViewedFilm');
const editViewedFilm = require('./botScenes/editViewedFilm');
const recordWantedFilm = require('./botScenes/recordWantedFilm');
const deleteWantedFilm = require('./botScenes/deleteWantedFilm');
const editWantedFilm = require('./botScenes/editWantedFilm');
const connectDB = require('./db/index');
const Users = require('./db/models/Users');
const Chats = require('./db/models/Chats');
const Profiles = require('./db/models/Profiles');
const { getProfile, getVoteToString } = require('./botHelpers/helpers');


connectDB();

const bot = new Telegraf(process.env.BOT_TOKEN);

const stage = new Scenes.Stage([recordViewedFilm, deleteViewedFilm, editViewedFilm, recordWantedFilm, deleteWantedFilm, editWantedFilm]);
let profile_id ;
let profileExist;
let profileInfo;
let userInfo;
let chatInfo;
bot.use(session());
bot.use(stage.middleware());

bot.start( async (ctx) => {
    try {
        await ctx.reply(`Привіт ${ctx.from.first_name}! Це твій персональний менеджер для фільмів. \nРазом з ним, ти можеш створити список переглянутих фільмів, оцінити його та вивести список в чат\nЯкщо виникають питання, введи /help \n\nДля цього потрібно обрати одну з наступних дій`, Markup.inlineKeyboard([
            [
                Markup.button.callback('Переглянуті фільми','showViewedMovies'),
                Markup.button.callback('Додати переглянутий фільм', 'addViewedMovie')
            ],
            [
                Markup.button.callback('Список бажаних фільмів','showWantedMovies'),
                Markup.button.callback('Додати фільм до бажаних', 'addWantedMovie')
            ]
            
        ]
        ));
    
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

bot.action('addViewedMovie', async (ctx) => {
    try {
        const profile = await getProfile(ctx);
        profile_id = profile._id;
        
        await ctx.scene.enter('recordViewedFilm', {profile_id: profile_id});
    } catch (error) {
        console.error(error);
    }
});

bot.action('showViewedMovies', async (ctx) => {
    try {
        const profile = await getProfile(ctx);
        profile_id = profile._id;
        
        const { user } = await Profiles.findById(profile_id).populate('user');
        let moviesList = '';
        if (user.movies.length === 0) {
            return ctx.reply('Ви ще не додали жодного фільму в переглянуті');
        }
        user.movies.map( (film,index) => {
            let rating = getVoteToString(film.vote);
            moviesList = moviesList.concat('\n',`${index+1}. `,film.name, '\n', rating, `(${film.vote}/10)`);
        });
    
        await ctx.reply(moviesList);
    } catch (error) {
        console.error(error);
    }
});

bot.action('addWantedMovie', async (ctx) => {
    try {
        const profile = await getProfile(ctx);
        profile_id = profile._id;
        
        await ctx.scene.enter('recordWantedFilm', {profile_id: profile_id});
    } catch (error) {
        console.error(error);
    }
});

bot.action('showWantedMovies', async (ctx) => {
    try {
        const profile = await getProfile(ctx);
        profile_id = profile._id;
        
        const { user } = await Profiles.findById(profile_id).populate('user');
        let moviesList = '';
        if (user.wantedMovies.length === 0) {
            return ctx.reply('Ви ще не додали жодного фільму в обрані');
        }
        user.wantedMovies.map( (film,index) => {
            moviesList = moviesList.concat('\n',`${index+1}. `,film.name);
        });
    
        await ctx.reply(moviesList);
    } catch (error) {
        console.error(error);
    }
});

bot.command('delete', async (ctx) => {
    ctx.reply('Оберіть з якого списку ви бажаєте видалити фільм',Markup.inlineKeyboard([
        Markup.button.callback('Переглянуті фільми', 'deleteViewed'),
        Markup.button.callback('Обрані фільми', 'deleteWanted')
    ]));    
});

bot.action('deleteViewed', async (ctx) => {
    try {
    const profile = await getProfile(ctx);
    profile_id = profile._id;
    await ctx.scene.enter('deleteViewedFilm', {profile_id: profile_id});
    } catch (error) {
        console.error(error);
    }
});

bot.action('deleteWanted', async (ctx) => {
    try {
        const profile = await getProfile(ctx);
        profile_id = profile._id;
        await ctx.scene.enter('deleteWantedFilm', {profile_id: profile_id});
    } catch (error) {
        console.error(error);
    }
});

bot.command('edit', async (ctx) => {
    ctx.reply('Оберіть з якого списку ви бажаєте редагувати фільм',Markup.inlineKeyboard([
        Markup.button.callback('Переглянуті фільми', 'editViewed'),
        Markup.button.callback('Обрані фільми', 'editWanted')
    ]));
});

bot.action('editViewed', async (ctx) => {
    try {
    const profile = await getProfile(ctx);
    profile_id = profile._id;
    await ctx.scene.enter('editViewedFilm', {profile_id: profile_id});
    } catch (error) {
        console.error(error);
    }
});

bot.action('editWanted', async (ctx) => {
    try {
        const profile = await getProfile(ctx);
        profile_id = profile._id;
        await ctx.scene.enter('editWantedFilm', {profile_id: profile_id});
    } catch (error) {
        console.error(error);
    }
});

bot.command('help', async (ctx) => {
    ctx.reply("With this bot you can do a lot! \n\n start - Start bot\nedit - Edit movie from choosed list\ndelete - Delete movie from choosed list\ngo0ut - Go out from action\nhelp - Show all bot's opportunities");
})

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
