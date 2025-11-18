const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../emojis');
const helpCommands = require('../helpCommands');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display help information about the bot'),

    async execute(interaction, client, db, errorHandler) {
        try {
            const helpConfig = helpCommands;
            
            const embed = new EmbedBuilder()
                .setColor(client.config.settings.embedColor)
                .setTitle(`${emojis.info} ${helpConfig.title}`)
                .setDescription(helpConfig.description)
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'help',
                user: interaction.user.tag,
                guild: interaction.guild?.name
            });
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`${emojis.error} An error occurred while executing this command.`)
                .setFooter({ text: client.config.settings.footerText });

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
};
