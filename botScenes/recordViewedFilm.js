const { Scenes, Markup, Telegraf } = require('telegraf');
const Profiles = require('../db/models/Profiles');
const Users = require('../db/models/Users');
const User = require('../db/models/Users');
const { enter, leave } = Scenes.Stage;

const recordViewedFilm = () => {

    let profile;
    let profile_id;
    let film;
    
    const movieNameHandler = Telegraf.on('text', async (ctx) => {
        profile_id = ctx.scene.state.profile_id;
        profile = await Profiles.findById(profile_id).populate('user');

        film = {
            message_id: ctx.message.message_id,
            name: ctx.message.text,
            timeAdd: ctx.message.date
        }
        
        await ctx.reply('Оцініть даний фільм від 1 до 10');
        return ctx.wizard.next();
    });

    const movieVoteHandler = Telegraf.on('text', async (ctx) => {

        if (/^([1-9]|10)$/.test(ctx.message.text)) {
            film.vote = ctx.message.text;
            profile.user.movies.push(film);
            await profile.user.save();
            ctx.reply('Фільм успішно додано у ваш список!');
    
            ctx.scene.leave();
        } else {
            await ctx.reply('Оцініть даний фільм цифрами від 1 до 10')
            
        }
        await ctx.wizard.selectStep(1);
    });

    const currentScene = new Scenes.WizardScene('recordViewedFilm', movieNameHandler, movieVoteHandler);
    currentScene.enter((ctx) => ctx.reply("Вкажіть назву переглянутого фільму ?"));

    return currentScene;
}

module.exports = recordViewedFilm();