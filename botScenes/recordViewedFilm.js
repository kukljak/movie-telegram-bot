const { Scenes, Markup, Telegraf } = require('telegraf');
const { checkCtxType } = require('../botHelpers/helpers');
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
            profile_id = ctx.scene.state.profile_id;
            profile = await Profiles.findById(profile_id).populate('user');

            switch (checkCtxType(ctx)) {
                case 'number':
                case 'notExistNumber':
                case 'text':
                    film = {
                        message_id: ctx.message.message_id,
                        name: ctx.message.text,
                        timeAdd: ctx.message.date
                    }
                    await ctx.reply('Оцініть даний фільм від 1 до 10');
                    ctx.wizard.next();
                    break;
                case 'goOutScene':
                    await ctx.scene.leave();
                    await ctx.reply('Ви вийшли з додавання фільму');
                    break;
                case 'command':
                    await ctx.reply('Введіть назва фільму а не команду.');
                    await ctx.wizard.selectStep(0);
                    break;
                case 'Other':
                    ctx.reply('Це не назва фільму. Прохання ввести назву фільму');
                    await ctx.wizard.selectStep(0);
                    break;
                default:
                    break;
            }
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
                await ctx.wizard.selectStep(1);
            }            
        } catch (error) {
            console.error(error);
        }
    });

    const currentScene = new Scenes.WizardScene('recordViewedFilm', movieNameHandler, movieVoteHandler);
    currentScene.enter((ctx) => ctx.reply("Вкажіть назву переглянутого фільму ?"));

    return currentScene;
}

module.exports = recordViewedFilm();