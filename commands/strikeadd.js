const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const EmbedFactory = require('../utils/embedFactory');
const DurationParser = require('../utils/durationParser');
const emojis = require('../emojis');

// Helper function to create embeds
function createEmbed(title, description, type, config) {
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    
    return new EmbedBuilder()
        .setColor(colors[type] || colors.info)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: config?.settings?.footerText || 'Staff Management Bot | Made by ASHU16' })
        .setTimestamp();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('strikeadd')
        .setDescription('Add a strike to a staff member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The staff member to strike')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the strike')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Strike duration (e.g., 7d, 30d, 3month)')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction, client, db, errorHandler) {
        try {
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            const durationStr = interaction.options.getString('duration');

            // Parse duration
            let duration;
            try {
                duration = DurationParser.parse(durationStr);
            } catch (parseError) {
                return await interaction.reply({
                    embeds: [createEmbed(
                        `${emojis.error} Invalid Duration`,
                        `${parseError.message}\n\n**Examples:** \`7d\`, \`30d\`, \`3month\`, \`1h\`, \`30m\``,
                        'error',
                        client.config
                    )],
                    ephemeral: true
                });
            }

            // Add strike to database
            const strike = db.addStrike(interaction.guild.id, user.id, reason, duration, interaction.user.id);

            // Get current strikes for this user
            const userStrikes = db.getUserStrikes(interaction.guild.id, user.id);
            const strikeLimit = db.getStrikeLimit(interaction.guild.id);

            // Create embed for confirmation
            const embed = createEmbed(
                `${emojis.warning} Strike Added`,
                `Strike has been added to ${user}`,
                'warning',
                client.config
            );

            embed.addFields(
                { name: 'User', value: `${user} (${user.tag})`, inline: true },
                { name: 'Added By', value: `${interaction.user}`, inline: true },
                { name: 'Current Strikes', value: `${userStrikes.length}/${strikeLimit}`, inline: true },
                { name: 'Reason', value: reason, inline: false },
                { name: 'Duration', value: durationStr, inline: true },
                { name: 'Expires', value: `<t:${Math.floor(strike.endTime / 1000)}:R>`, inline: true },
                { name: 'Strike ID', value: `\`${strike.id}\``, inline: true }
            );

            await interaction.reply({ embeds: [embed] });

            // Log to strike channel
            const strikeChannelId = db.getStrikeChannel(interaction.guild.id);
            if (strikeChannelId) {
                const strikeChannel = await interaction.guild.channels.fetch(strikeChannelId).catch(() => null);
                if (strikeChannel) {
                    await strikeChannel.send({ embeds: [embed] });
                }
            }

            // Send DM to user
            try {
                const dmEmbed = createEmbed(
                    `${emojis.warning} Strike Received`,
                    `You have received a strike in **${interaction.guild.name}**`,
                    'warning',
                    client.config
                );
                dmEmbed.addFields(
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Duration', value: durationStr, inline: true },
                    { name: 'Expires', value: `<t:${Math.floor(strike.endTime / 1000)}:R>`, inline: true },
                    { name: 'Current Strikes', value: `${userStrikes.length}/${strikeLimit}`, inline: true }
                );

                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                // User has DMs disabled
            }

            // Check if strike limit reached
            if (userStrikes.length >= strikeLimit) {
                await handleStrikeLimitReached(user, interaction, client, db, errorHandler, userStrikes.length, strikeLimit);
            }

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'strikeadd',
                user: interaction.user.tag,
                guild: interaction.guild?.name
            });
        }
    }
};

async function handleStrikeLimitReached(user, interaction, client, db, errorHandler, strikeCount, strikeLimit) {
    try {
        // Get server link
        const serverLink = db.getServerLink();
        if (!serverLink) {
            return;
        }

        const mainGuildId = serverLink.mainServerId;
        const staffGuildId = serverLink.staffServerId;
        
        // Send DM before kicking
        try {
            const dmEmbed = createEmbed(
                `${emojis.error} Strike Limit Reached`,
                `You have reached the strike limit (${strikeCount}/${strikeLimit}) in **${interaction.guild.name}**`,
                'error',
                client.config
            );
            dmEmbed.addFields(
                { name: 'Action Taken', value: 'You have been kicked from the staff server and your staff roles have been removed.', inline: false },
                { name: 'Reason', value: 'Excessive strikes', inline: false }
            );
            await user.send({ embeds: [dmEmbed] });
        } catch (error) {
            // User has DMs disabled
        }

        // Kick from staff server
        const staffGuild = await client.guilds.fetch(staffGuildId).catch(() => null);
        if (staffGuild) {
            const staffMember = await staffGuild.members.fetch(user.id).catch(() => null);
            if (staffMember) {
                await staffMember.kick(`Strike limit reached: ${strikeCount}/${strikeLimit} strikes`);
                
                // Log kick
                const kickEmbed = createEmbed(
                    `${emojis.error} Auto-Kick: Strike Limit`,
                    `${user} has been kicked from staff server`,
                    'error',
                    client.config
                );
                kickEmbed.addFields(
                    { name: 'Reason', value: `Strike limit reached (${strikeCount}/${strikeLimit})`, inline: false },
                    { name: 'Server', value: staffGuild.name, inline: true }
                );

                const strikeChannelId = db.getStrikeChannel(interaction.guild.id);
                if (strikeChannelId) {
                    const strikeChannel = await interaction.guild.channels.fetch(strikeChannelId).catch(() => null);
                    if (strikeChannel) {
                        await strikeChannel.send({ embeds: [kickEmbed] });
                    }
                }
            }
        }

        // Remove staff roles from main server
        const mainGuild = await client.guilds.fetch(mainGuildId).catch(() => null);
        if (mainGuild) {
            const mainMember = await mainGuild.members.fetch(user.id).catch(() => null);
            if (mainMember) {
                const mainServerData = db.getServerData(mainGuildId);
                const staffRolesToRemove = mainServerData.staffRoles.filter(roleId => 
                    mainMember.roles.cache.has(roleId)
                );

                for (const roleId of staffRolesToRemove) {
                    await mainMember.roles.remove(roleId).catch(() => {});
                }

                // Log role removal
                if (staffRolesToRemove.length > 0) {
                    const roleRemovalEmbed = createEmbed(
                        `${emojis.error} Auto Role Removal: Strike Limit`,
                        `Staff roles removed from ${user} in main server`,
                        'error',
                        client.config
                    );
                    roleRemovalEmbed.addFields(
                        { name: 'Reason', value: `Strike limit reached (${strikeCount}/${strikeLimit})`, inline: false },
                        { name: 'Roles Removed', value: staffRolesToRemove.length.toString(), inline: true }
                    );

                    const strikeChannelId = db.getStrikeChannel(interaction.guild.id);
                    if (strikeChannelId) {
                        const strikeChannel = await interaction.guild.channels.fetch(strikeChannelId).catch(() => null);
                        if (strikeChannel) {
                            await strikeChannel.send({ embeds: [roleRemovalEmbed] });
                        }
                    }
                }
            }
        }

    } catch (error) {
        await errorHandler.handleError(error, {
            function: 'handleStrikeLimitReached',
            user: user.tag,
            guild: interaction.guild?.name
        });
    }
}
