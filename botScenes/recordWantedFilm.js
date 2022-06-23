const { Telegraf, Scenes } = require("telegraf");
const Profiles = require("../db/models/Profiles");
const { checkCtxType } = require('../botHelpers/helpers');

const recordWantedFilm = () => {
    
    const movieNameHandler = Telegraf.on('message', async (ctx) => {
        try {
            const profile_id = ctx.scene.state.profile_id;
            const profile = await Profiles.findById(profile_id).populate('user');

            switch (checkCtxType(ctx)) {
                case 'number':
                case 'notExistNumber':
                case 'text':
                    profile.user.wantedMovies.push({
                        message_id: ctx.message.message_id,
                        name: ctx.message.text,
                        timeAdd: ctx.message.date
                    });
                    await profile.user.save();
                    await ctx.reply('Фільм успішно доданий в список бажаних');
                    await ctx.scene.leave();
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

    const currentScene = new Scenes.WizardScene('recordWantedFilm', movieNameHandler);
    currentScene.enter((ctx) => ctx.reply("Вкажіть назву фільму який бажає в список бажаних?"));

    return currentScene;
}

module.exports = recordWantedFilm();
