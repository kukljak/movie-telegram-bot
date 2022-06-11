const { Scenes, Markup } = require('telegraf');
const Profiles = require('../db/models/Profiles');
const Users = require('../db/models/Users');
const User = require('../db/models/Users');
const { enter, leave } = Scenes.Stage;

const introduceScene = () => {
    const currentScene = new Scenes.BaseScene('introduceScene');
    currentScene.enter((ctx) => ctx.reply("Вкажіть назву переглянутого фільму ?"));
    currentScene.on('text', async (ctx) => {
        const profile_id = ctx.session.__scenes.state.profile_id;
        await ctx.reply('Дякую!');
        await ctx.reply('Що ще бажаєте зробити?',  Markup.inlineKeyboard([
            Markup.button.callback('Переглянуті фільми','showMovies'),
            Markup.button.callback('Додати переглянутий фільм', 'writeMovie')
        ]));

        const profile = await Profiles.findById(profile_id).populate('user');

        const film = {
            message_id: ctx.message.message_id,
            name: ctx.message.text,
            timeAdd: ctx.message.date
        }

        profile.user.movies.push(film);
        await profile.user.save();

        ctx.scene.leave();
    })

    return currentScene;
}

module.exports = introduceScene();