const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('linkserver')
        .setDescription('Link main server and staff server for role synchronization')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('mainserver')
                .setDescription('Main server ID')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('staffserver')
                .setDescription('Staff server ID')
                .setRequired(true)),

    async execute(interaction, client, db, errorHandler) {
        try {
            const mainServerId = interaction.options.getString('mainserver');
            const staffServerId = interaction.options.getString('staffserver');

            try {
                await client.guilds.fetch(mainServerId);
                await client.guilds.fetch(staffServerId);
            } catch (fetchError) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription(`${emojis.error} Bot is not in one or both of the specified servers.`)
                    .setFooter({ text: client.config.settings.footerText });
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            db.setServerLink(mainServerId, staffServerId);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`${emojis.link} Servers Linked`)
                .setDescription('Main server and staff server have been successfully linked.')
                .addFields(
                    { name: 'Main Server ID', value: mainServerId, inline: true },
                    { name: 'Staff Server ID', value: staffServerId, inline: true }
                )
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'linkserver',
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
