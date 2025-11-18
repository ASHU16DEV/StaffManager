const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelset')
        .setDescription('Set channels for various actions')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('promote')
                .setDescription('Set promote log channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel for promote logs')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('demote')
                .setDescription('Set demote log channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel for demote logs')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('resign')
                .setDescription('Set resign log channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel for resign logs')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('fire')
                .setDescription('Set fire log channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel for fire logs')
                        .setRequired(true))),

    async execute(interaction, client, db, errorHandler) {
        try {
            const subcommand = interaction.options.getSubcommand();
            const channel = interaction.options.getChannel('channel');

            db.setChannel(interaction.guild.id, subcommand, channel.id);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`${emojis.success} Channel Set`)
                .setDescription(`${channel} has been set as the ${subcommand} log channel.`)
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'channelset',
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
