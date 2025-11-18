const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manager')
        .setDescription('Manage manager roles (Owner only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a manager role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to add as manager role')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a manager role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove from manager roles')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all manager roles')),

    async execute(interaction, client, db, errorHandler) {
        try {
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'add') {
                const role = interaction.options.getRole('role');
                
                const success = db.addManagerRole(interaction.guild.id, role.id);
                
                const embed = new EmbedBuilder()
                    .setColor(success ? '#00FF00' : '#FFA500')
                    .setTitle(success ? `${emojis.success} Manager Role Added` : `${emojis.warning} Role Already Exists`)
                    .setDescription(success ? `${role} has been added as a manager role.` : `${role} is already a manager role.`)
                    .setFooter({ text: client.config.settings.footerText })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });

            } else if (subcommand === 'remove') {
                const role = interaction.options.getRole('role');
                
                const success = db.removeManagerRole(interaction.guild.id, role.id);
                
                const embed = new EmbedBuilder()
                    .setColor(success ? '#00FF00' : '#FF0000')
                    .setTitle(success ? `${emojis.success} Manager Role Removed` : `${emojis.error} Role Not Found`)
                    .setDescription(success ? `${role} has been removed from manager roles.` : `${role} is not a manager role.`)
                    .setFooter({ text: client.config.settings.footerText })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });

            } else if (subcommand === 'list') {
                const managerRoles = db.getManagerRoles(interaction.guild.id);
                
                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle(`${emojis.manager} Manager Roles`)
                    .setDescription(managerRoles.length > 0 
                        ? managerRoles.map(roleId => `<@&${roleId}>`).join('\n')
                        : 'No manager roles configured.')
                    .setFooter({ text: client.config.settings.footerText })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'manager',
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
