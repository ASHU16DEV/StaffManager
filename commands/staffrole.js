const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staffrole')
        .setDescription('Manage staff roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a staff role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to add as staff role')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a staff role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove from staff roles')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all staff roles')),

    async execute(interaction, client, db, errorHandler) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'add') {
                const role = interaction.options.getRole('role');
                
                const success = db.addStaffRole(interaction.guild.id, role.id);
                
                const embed = new EmbedBuilder()
                    .setColor(success ? '#00FF00' : '#FFA500')
                    .setTitle(success ? `${emojis.success} Staff Role Added` : `${emojis.warning} Role Already Exists`)
                    .setDescription(success ? `${role} has been added as a staff role.` : `${role} is already a staff role.`)
                    .setFooter({ text: client.config.settings.footerText })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });

            } else if (subcommand === 'remove') {
                const role = interaction.options.getRole('role');
                
                const success = db.removeStaffRole(interaction.guild.id, role.id);
                
                const embed = new EmbedBuilder()
                    .setColor(success ? '#00FF00' : '#FF0000')
                    .setTitle(success ? `${emojis.success} Staff Role Removed` : `${emojis.error} Role Not Found`)
                    .setDescription(success ? `${role} has been removed from staff roles.` : `${role} is not a staff role.`)
                    .setFooter({ text: client.config.settings.footerText })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });

            } else if (subcommand === 'list') {
                const staffRoles = db.getStaffRoles(interaction.guild.id);
                
                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle(`${emojis.list} Staff Roles`)
                    .setDescription(staffRoles.length > 0 
                        ? staffRoles.map(roleId => `<@&${roleId}>`).join('\n')
                        : 'No staff roles configured.')
                    .setFooter({ text: client.config.settings.footerText })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'staffrole',
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
