const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const EmbedFactory = require('../utils/embedFactory');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolemap')
        .setDescription('Manage role mappings between servers')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role mapping')
                .addStringOption(option =>
                    option.setName('mainrole')
                        .setDescription('Main server role ID')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('staffrole')
                        .setDescription('Staff server role ID')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role mapping')
                .addStringOption(option =>
                    option.setName('mainrole')
                        .setDescription('Main server role ID')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('staffrole')
                        .setDescription('Staff server role ID')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all role mappings')),

    async execute(interaction, client, db, errorHandler) {
        try {
            const embedFactory = new EmbedFactory(client.config);
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'add') {
                const mainRoleId = interaction.options.getString('mainrole');
                const staffRoleId = interaction.options.getString('staffrole');
                
                const success = db.addRoleMap(mainRoleId, staffRoleId);
                
                const embed = success
                    ? embedFactory.success('Role Mapping Added', `Role mapping has been added:\nMain: <@&${mainRoleId}>\nStaff: <@&${staffRoleId}>`)
                    : embedFactory.warning('Mapping Already Exists', 'A mapping with these roles already exists.');

                await interaction.reply({ embeds: [embed], ephemeral: true });

            } else if (subcommand === 'remove') {
                const mainRoleId = interaction.options.getString('mainrole');
                const staffRoleId = interaction.options.getString('staffrole');
                
                const success = db.removeRoleMap(mainRoleId, staffRoleId);
                
                const embed = success
                    ? embedFactory.success('Role Mapping Removed', 'Role mapping has been removed.')
                    : embedFactory.error('Mapping Not Found', 'This mapping does not exist.');

                await interaction.reply({ embeds: [embed], ephemeral: true });

            } else if (subcommand === 'list') {
                const roleMaps = db.getRoleMaps();
                const serverLink = db.getServerLink();
                
                if (!serverLink) {
                    const embed = embedFactory.warning('No Server Link', 'Server link is not configured. Use `/linkserver` command first.');
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }

                const mainGuild = await client.guilds.fetch(serverLink.mainServerId).catch(() => null);
                const staffGuild = await client.guilds.fetch(serverLink.staffServerId).catch(() => null);

                if (!mainGuild || !staffGuild) {
                    const embed = embedFactory.error('Server Error', 'Could not fetch linked servers.');
                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }
                
                let description = '';
                if (roleMaps.length === 0) {
                    description = '*No role mappings configured.*';
                } else {
                    for (const map of roleMaps) {
                        const mainRole = await mainGuild.roles.fetch(map.mainRoleId).catch(() => null);
                        const staffRole = await staffGuild.roles.fetch(map.staffRoleId).catch(() => null);
                        
                        const mainRoleName = mainRole ? `${mainRole.name}` : `[Unknown Role - ${map.mainRoleId}]`;
                        const staffRoleName = staffRole ? `${staffRole.name}` : `[Unknown Role - ${map.staffRoleId}]`;
                        
                        description += `${emojis.server} **Main:** ${mainRoleName}\n${emojis.server} **Staff:** ${staffRoleName}\n${emojis.link} Synced\n\n`;
                    }
                }

                const embed = embedFactory.list('Role Mappings', description);
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'rolemap',
                user: interaction.user.tag,
                guild: interaction.guild?.name
            });
            
            const embedFactory = new EmbedFactory(client.config);
            const errorEmbed = embedFactory.error('Command Error', 'An error occurred while executing this command.');

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    },
};
