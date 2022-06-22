const { Telegraf, Scenes } = require("telegraf");
const { checkCtxType } = require("../botHelpers/helpers");
const Profiles = require("../db/models/Profiles");


const deleteViewedFilm = () => {

    const deleteFilm = Telegraf.on('message', async (ctx) => {

        const profile_id = ctx.scene.state?.profile_id;
        try {
            const profile = await Profiles.findById(profile_id).populate('user');
            let films = await profile.user.movies;

            switch (checkCtxType(ctx, films)) {
                case 'number':
                    const deletedFilm = films.find( (film, id) => id == ctx.message.text - 1);
                    films = films.filter( (film, id) => id !== ctx.message.text - 1 );
                    profile.user.movies = films;
                    await profile.user.save(); 

                    ctx.replyWithHTML(`Фільм <b>'${deletedFilm.name}'</b> успішно видалено з вашого списку`)
                    ctx.scene.leave();
                    break;
                case 'notExistNumber':
                    ctx.reply('Такого номеру фільму немає, введіть будь ласка номер фільму згідно вашого списку');
                    await ctx.wizard.selectStep(0);
                    break;
                case 'command':
                    ctx.reply('Введіть номер фільму а не команду.');
                    await ctx.wizard.selectStep(0);
                    break;
                case 'text':
                case 'Other':
                    ctx.reply('Це не номер фільму, прохання ввести номер фільму');
                    await ctx.wizard.selectStep(0);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error(error);
        }
    })

    const currentScene = new Scenes.WizardScene('deleteViewedFilm', deleteFilm);
    currentScene.enter( ctx => ctx.reply('Введіть номер фільму який бажаєте видалити'));

    return currentScene;
}

module.exports = deleteViewedFilm();