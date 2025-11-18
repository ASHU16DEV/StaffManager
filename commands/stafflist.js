const { SlashCommandBuilder } = require('discord.js');
const { hasStaffCommandPermission } = require('../utils/permissions');
const EmbedFactory = require('../utils/embedFactory');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stafflist')
        .setDescription('View all staff members (auto-updates every 30 seconds)'),

    async execute(interaction, client, db, errorHandler) {
        try {
            const embedFactory = new EmbedFactory(client.config);

            if (!hasStaffCommandPermission(interaction.member, db)) {
                const embed = embedFactory.error('Permission Denied', 'You don\'t have permission to use this command.');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const embed = await createStaffListEmbed(client, db, embedFactory);
            const message = await interaction.reply({ embeds: [embed], fetchReply: true });

            if (!client.staffListMessages) {
                client.staffListMessages = new Map();
            }
            
            client.staffListMessages.set(message.id, {
                channelId: message.channel.id,
                guildId: interaction.guild.id,
                lastUpdate: Date.now()
            });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'stafflist',
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

async function createStaffListEmbed(client, db, embedFactory) {
    const serverLink = db.getServerLink();
    
    if (!serverLink) {
        return embedFactory.warning('No Server Link', 'Server link is not configured. Please use `/linkserver` command first.');
    }

    const mainGuild = await client.guilds.fetch(serverLink.mainServerId).catch(() => null);
    const staffGuild = await client.guilds.fetch(serverLink.staffServerId).catch(() => null);

    if (!mainGuild || !staffGuild) {
        return embedFactory.error('Server Error', 'Could not fetch linked servers.');
    }

    const staffRoles = db.getStaffRoles(staffGuild.id);
    const inactiveMembers = db.getAllInactiveMembers().filter(m => m.guildId === mainGuild.id);
    
    const embed = embedFactory.createBase()
        .setColor(embedFactory.colors.primary)
        .setTitle(`${emojis.staff} Staff List`)
        .setDescription(`**Main Server:** ${mainGuild.name}\n**Staff Server:** ${staffGuild.name}\n\n*Auto-updates every 30 seconds*`);

    const roleMap = new Map();
    
    for (const roleId of staffRoles) {
        const role = await staffGuild.roles.fetch(roleId).catch(() => null);
        if (!role) continue;
        
        const members = role.members
            .filter(member => !member.user.bot)
            .map(member => member);
        
        roleMap.set(role, members);
    }

    const sortedRoles = Array.from(roleMap.entries()).sort((a, b) => b[0].position - a[0].position);

    if (sortedRoles.length === 0) {
        embed.addFields({
            name: `${emojis.warning} No Staff Roles`,
            value: 'No staff roles configured. Use `/staffrole add` to add roles.',
            inline: false
        });
    }

    for (const [role, members] of sortedRoles) {
        const memberList = members.length > 0 
            ? members.map(m => `${m}`).join(', ')
            : '*No members*';
        
        embed.addFields({
            name: `${emojis.role} ${role.name} (${members.length})`,
            value: memberList,
            inline: false
        });
    }

    if (inactiveMembers.length > 0) {
        let inactiveList = '';
        for (const inactiveMember of inactiveMembers) {
            const member = await mainGuild.members.fetch(inactiveMember.userId).catch(() => null);
            if (member) {
                const endTime = Math.floor((inactiveMember.endTime || Date.now()) / 1000);
                inactiveList += `${member} - Ends <t:${endTime}:R>\n`;
            }
        }
        
        if (inactiveList) {
            embed.addFields({
                name: `${emojis.inactive} Inactive/Absent Members`,
                value: inactiveList,
                inline: false
            });
        }
    }

    return embed;
}

module.exports.createStaffListEmbed = createStaffListEmbed;
