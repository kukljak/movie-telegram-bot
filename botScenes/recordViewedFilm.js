const { Scenes, Markup, Telegraf } = require('telegraf');
const Profiles = require('../db/models/Profiles');
const Users = require('../db/models/Users');
const User = require('../db/models/Users');
const { enter, leave } = Scenes.Stage;

const recordViewedFilm = () => {

    let profile;
    let profile_id;
    let film;
    
    const movieNameHandler = Telegraf.on('message', async (ctx) => {
        try {
            if (!/[^A-Za-z0-9]+/.test(ctx.message.text)) {
                ctx.reply('Це не назва фільму. Прохання ввести назву фільму')
                
                return await ctx.wizard.selectStep(0);
            } else if (ctx.message.text && ctx.message.text.includes('/')) {
                return await ctx.reply('Введіть назва фільму а не команду.')
            }
            profile_id = ctx.scene.state.profile_id;
            profile = await Profiles.findById(profile_id).populate('user');

            film = {
                message_id: ctx.message.message_id,
                name: ctx.message.text,
                timeAdd: ctx.message.date
            }
        
            await ctx.reply('Оцініть даний фільм від 1 до 10');
            return ctx.wizard.next();
        } catch (error) {
            console.error(error);
        }
    });

    const movieVoteHandler = Telegraf.on('message', async (ctx) => {
        try {
            if (/^([1-9]|10)$/.test(ctx.message.text)) {
                film.vote = ctx.message.text;
                profile.user.movies.push(film);
                await profile.user.save();
                ctx.reply('Фільм успішно додано у ваш список!');
    
                ctx.scene.leave();
            } else {
                await ctx.reply('Потрібно оцінити фільм цифрами від 1 до 10');
            }

            await ctx.wizard.selectStep(1);
        } catch (error) {
            console.error(error);
        }
    });

    const currentScene = new Scenes.WizardScene('recordViewedFilm', movieNameHandler, movieVoteHandler);
    currentScene.enter((ctx) => ctx.reply("Вкажіть назву переглянутого фільму ?"));

    return currentScene;
}

module.exports = recordViewedFilm();