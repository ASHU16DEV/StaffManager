const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasManagerPermission } = require('../utils/permissions');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staff')
        .setDescription('Manage staff command roles (Manager only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a staff command role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to add for staff commands access')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a staff command role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove from staff commands access')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all staff command roles')),

    async execute(interaction, client, db, errorHandler) {
        try {
            if (!hasManagerPermission(interaction.member, db)) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription(`${emojis.error} You don't have permission to use this command.`)
                    .setFooter({ text: client.config.settings.footerText });
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'add') {
                const role = interaction.options.getRole('role');
                
                const success = db.addStaffCommandRole(interaction.guild.id, role.id);
                
                const embed = new EmbedBuilder()
                    .setColor(success ? '#00FF00' : '#FFA500')
                    .setTitle(success ? `${emojis.success} Staff Command Role Added` : `${emojis.warning} Role Already Exists`)
                    .setDescription(success ? `${role} has been added for staff commands access.` : `${role} already has staff commands access.`)
                    .setFooter({ text: client.config.settings.footerText })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });

            } else if (subcommand === 'remove') {
                const role = interaction.options.getRole('role');
                
                const success = db.removeStaffCommandRole(interaction.guild.id, role.id);
                
                const embed = new EmbedBuilder()
                    .setColor(success ? '#00FF00' : '#FF0000')
                    .setTitle(success ? `${emojis.success} Staff Command Role Removed` : `${emojis.error} Role Not Found`)
                    .setDescription(success ? `${role} has been removed from staff commands access.` : `${role} doesn't have staff commands access.`)
                    .setFooter({ text: client.config.settings.footerText })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });

            } else if (subcommand === 'list') {
                const staffCommandRoles = db.getStaffCommandRoles(interaction.guild.id);
                
                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle(`${emojis.staff} Staff Command Roles`)
                    .setDescription(staffCommandRoles.length > 0 
                        ? staffCommandRoles.map(roleId => `<@&${roleId}>`).join('\n')
                        : 'No staff command roles configured.')
                    .setFooter({ text: client.config.settings.footerText })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'staff',
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
