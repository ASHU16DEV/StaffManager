const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('errorlogchannel')
        .setDescription('Set the error log channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel for error logs')
                .setRequired(true)),

    async execute(interaction, client, db, errorHandler) {
        try {
            const channel = interaction.options.getChannel('channel');

            db.setChannel(interaction.guild.id, 'errorLog', channel.id);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`${emojis.success} Channel Set`)
                .setDescription(`${channel} has been set as the error log channel.`)
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'errorlogchannel',
                user: interaction.user.tag,
                guild: interaction.guild.name
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
