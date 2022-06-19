const { Scenes, Telegraf } = require("telegraf");
const Profiles = require("../db/models/Profiles");

const editViewedFilm = () => {
    let profile;
    let filmToEdit;
    let filmNumber;

    const takeMovieNumber = Telegraf.on('message', async (ctx) => {
        const profile_id = ctx.scene.state?.profile_id;
        try {
            profile = await Profiles.findById(profile_id).populate('user');

            let films = await profile.user.movies;
            if (/^[0-9]+$/.test(ctx.message.text) && ctx.message.text !== '0' && ctx.message.text < films.length) {
                filmNumber = Number(ctx.message.text);
                filmToEdit = films.find( (film, id) => id == ctx.message.text - 1);

                ctx.reply(`Вкажіть на яку назву бажаєте змінити фільм - '${filmToEdit.name}'`)
                await ctx.wizard.next();
            } else if (Number(ctx.message.text) > films.length || ctx.message.text === '0') {
                ctx.reply('Такого номеру фільму немає, введіть будь ласка номер фільму згідно вашого списку');
                await ctx.wizard.selectStep(0);
            } else {
                ctx.reply('Це не номер фільму, прохання ввести номер фільму');
                await ctx.wizard.selectStep(0);
            }
        } catch (error) {
            console.error(error);
        }

    });
    
    const changeToNewName = Telegraf.on('message', async (ctx) => {
        if (/[^A-Za-z0-9]+/.test(ctx.message.text)) {
            profile.user.movies[filmNumber].name = ctx.message.text;
            await ctx.reply('Оцініть даний фільм від 1 до 10');
            await ctx.wizard.next();
        } else {
            ctx.reply('Це не назва фільму, введіть будь ласка назву фільму');
            await ctx.wizard.selectStep(1);
        }
    });

    const changeToNewVote = Telegraf.on('message', async (ctx) => {
        try {
            if (/^([1-9]|10)$/.test(ctx.message.text)) {
                profile.user.movies[filmNumber].vote = ctx.message.text;
                
                await profile.user.save();
                ctx.reply('Фільм успішно оновлено у вашому списку!');
    
                ctx.scene.leave();
            } else {
                await ctx.reply('Оцініть даний фільм цифрами від 1 до 10');
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