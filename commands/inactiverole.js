const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inactiverole')
        .setDescription('Set the inactive/absent role')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to assign to inactive members')
                .setRequired(true)),

    async execute(interaction, client, db, errorHandler) {
        try {
            const role = interaction.options.getRole('role');

            db.setInactiveRole(interaction.guild.id, role.id);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`${emojis.success} Inactive Role Set`)
                .setDescription(`${role} has been set as the inactive role.`)
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'inactiverole',
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
