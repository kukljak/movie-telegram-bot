const { Scenes, Telegraf } = require("telegraf");
const { checkCtxType } = require("../botHelpers/helpers");
const Profiles = require("../db/models/Profiles");

const editViewedFilm = () => {
    let profile;
    let films;
    const takeMovieNumber = Telegraf.on('message', async (ctx) => {
        const profile_id = ctx.scene.state?.profile_id;
        let sceneState = ctx.scene.state;
        try {
            profile = await Profiles.findById(profile_id).populate('user');
            films = await profile.user.movies;

            switch (checkCtxType(ctx, films)) {
                case 'number':
                    sceneState.filmNumber = Number(ctx.message.text) - 1;
                    sceneState.filmToEdit = films.find( (film, id) => id == ctx.message.text - 1);

                    ctx.reply(`Вкажіть на яку назву бажаєте змінити фільм - '${sceneState.filmToEdit.name}'`)
                    await ctx.wizard.next();
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

    });
    
    const changeToNewName = Telegraf.on('message', async (ctx) => {

        switch (checkCtxType(ctx, films)) {
            case 'number':
            case 'notExistNumber':
            case 'text':
                profile.user.movies[ctx.scene.state.filmNumber].name = ctx.message.text;
                await ctx.reply('Оцініть даний фільм від 1 до 10');
                await ctx.wizard.next();
                break;
            case 'command':
                ctx.reply('Введіть назва фільму а не команду.');
                await ctx.wizard.selectStep(1);
                break;
            case 'Other':
                ctx.reply('Це не назва фільму, введіть будь ласка назву фільму');
                await ctx.wizard.selectStep(1);
            default:
                break;
        }
    });

    const changeToNewVote = Telegraf.on('message', async (ctx) => {
        try {
            if (/^([1-9]|10)$/.test(ctx.message.text)) {
                profile.user.movies[ctx.scene.state.filmNumber].vote = ctx.message.text;
                
                await profile.user.save();
                ctx.reply('Фільм успішно оновлено у вашому списку!');
                return ctx.scene.leave();
            } else {
                await ctx.reply('Потрібно оцінити фільм цифрами від 1 до 10!');
                await ctx.wizard.selectStep(2);
            }
          
        } catch (error) {
            console.error(error);
        }
    })


    const currentScene = new Scenes.WizardScene('editViewedFilm', takeMovieNumber, changeToNewName, changeToNewVote);
    currentScene.enter( ctx => ctx.reply('Введіть номер фільму який бажаєте відредагувати'));

    return currentScene;
}

module.exports = editViewedFilm();