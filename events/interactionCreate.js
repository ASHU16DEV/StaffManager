const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { hasManagerPermission, hasCommandPermission, getPermissionErrorMessage, getUserPermissionLevel } = require('../utils/permissions');
const { handleRoleAutocomplete } = require('../utils/autocompleteHelpers');
const emojis = require('../emojis');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client, db, errorHandler) {
        try {
            if (interaction.isAutocomplete()) {
                const commandName = interaction.commandName;
                
                if (commandName === 'promote' || commandName === 'demote') {
                    const focusedOption = interaction.options.getFocused(true);
                    
                    if (focusedOption.name === 'role') {
                        await handleRoleAutocomplete(interaction, db);
                    }
                }
                return;
            }
            
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);

                if (!command) return;

                const hasPermission = hasCommandPermission(
                    interaction.commandName,
                    interaction.user.id,
                    interaction.member,
                    db,
                    client.config
                );

                if (!hasPermission) {
                    const errorMessage = getPermissionErrorMessage(interaction.commandName, client.config);
                    const userLevel = getUserPermissionLevel(interaction.user.id, interaction.member, db, client.config);
                    
                    const embed = new EmbedBuilder()
                        .setColor('#EF4444')
                        .setTitle(`${emojis.error} Permission Denied`)
                        .setDescription(errorMessage)
                        .addFields(
                            { name: '━━━━━━━━━━━━━━━━━━━━', value: '\u200B', inline: false },
                            { name: `${emojis.info} Your Permission Level`, value: userLevel ? `\`${userLevel.toUpperCase()}\`` : '`NONE`', inline: true },
                            { name: `${emojis.shield} Command`, value: `\`/${interaction.commandName}\``, inline: true }
                        )
                        .setFooter({ text: client.config.settings.footerText })
                        .setTimestamp();

                    return await interaction.reply({ embeds: [embed], ephemeral: true });
                }

                await command.execute(interaction, client, db, errorHandler);

            } else if (interaction.isButton()) {
                const customId = interaction.customId;

                if (customId.startsWith('inactive_accept_')) {
                    await handleInactiveAccept(interaction, client, db, errorHandler);
                } else if (customId.startsWith('inactive_deny_')) {
                    await handleInactiveDeny(interaction, client, db, errorHandler);
                }
            } else if (interaction.isModalSubmit()) {
                if (interaction.customId.startsWith('deny_reason_modal_')) {
                    await handleDenyReasonModal(interaction, client, db, errorHandler);
                }
            }
        } catch (error) {
            await errorHandler.handleError(error, {
                interactionType: interaction.type,
                user: interaction.user?.tag,
                guild: interaction.guild?.name
            });
        }
    },
};

async function handleInactiveAccept(interaction, client, db, errorHandler) {
    try {
        if (!hasManagerPermission(interaction.member, db)) {
            const embed = new EmbedBuilder()
                .setColor('#EF4444')
                .setTitle(`${emojis.error} Permission Denied`)
                .setDescription(`You don't have permission to accept inactive requests.\n\n**Required:** Manager Role or Administrator`)
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const parts = interaction.customId.split('_');
        const userId = parts[2];
        const durationMs = parseInt(parts[3]);

        const request = db.getInactiveRequest(interaction.message.id);
        if (!request) {
            const embed = new EmbedBuilder()
                .setColor('#EF4444')
                .setTitle(`${emojis.error} Request Not Found`)
                .setDescription(`This inactive request could not be found in the database.\n\n**Possible reasons:**\n• The request was already processed\n• The request has expired\n• Database was reset`)
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const guild = interaction.guild;
        const member = await guild.members.fetch(userId).catch(() => null);

        if (!member) {
            const embed = new EmbedBuilder()
                .setColor('#EF4444')
                .setTitle(`${emojis.error} Member Not Found`)
                .setDescription(`The member <@${userId}> could not be found in this server.\n\n**Possible reasons:**\n• Member left the server\n• Member was kicked/banned`)
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();
            db.removeInactiveRequest(interaction.message.id);
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const inactiveRoleId = db.getInactiveRole(guild.id);
        if (inactiveRoleId) {
            const inactiveRole = await guild.roles.fetch(inactiveRoleId).catch(() => null);
            if (inactiveRole) {
                await member.roles.add(inactiveRole);
            }
        }

        const endTime = Date.now() + durationMs;
        db.addInactiveMember({
            userId: userId,
            guildId: guild.id,
            endTime: endTime,
            reason: request.reason,
            approvedBy: interaction.user.id,
            timestamp: Date.now()
        });

        db.removeInactiveRequest(interaction.message.id);

        const DurationParser = require('../utils/durationParser');
        const formattedDuration = DurationParser.format(durationMs);

        const acceptedEmbed = new EmbedBuilder()
            .setColor('#10B981')
            .setTitle(`${emojis.accept} Inactive Request Accepted`)
            .setDescription(`**Member:** <@${userId}>\n**Duration:** ${formattedDuration}\n**Approved by:** ${interaction.user}\n**Expires:** <t:${Math.floor(endTime / 1000)}:F> (<t:${Math.floor(endTime / 1000)}:R>)\n\n**Status:** ✅ Approved`)
            .addFields(
                { name: '━━━━━━━━━━━━━━━━━━━━', value: '\u200B', inline: false },
                { name: `${emojis.info} Reason`, value: `\`\`\`${request.reason}\`\`\``, inline: false }
            )
            .setFooter({ text: client.config.settings.footerText })
            .setTimestamp();

        await interaction.message.edit({ embeds: [acceptedEmbed], components: [] });

        try {
            const user = await client.users.fetch(userId);
            const dmEmbed = new EmbedBuilder()
                .setColor('#10B981')
                .setTitle(`${emojis.accept} Inactive Request Approved`)
                .setDescription(`Your inactive request in **${guild.name}** has been approved!\n\n**Duration:** ${formattedDuration}\n**Approved by:** ${interaction.user.tag}\n**Expires:** <t:${Math.floor(endTime / 1000)}:F>\n\n**Note:** Your inactive role will be automatically removed when the time expires.`)
                .addFields(
                    { name: '━━━━━━━━━━━━━━━━━━━━', value: '\u200B', inline: false },
                    { name: `${emojis.time} Time Remaining`, value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: false }
                )
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();

            await user.send({ embeds: [dmEmbed] });
        } catch (dmError) {
            console.log(`Could not send DM to user ${userId}`);
        }

        const replyEmbed = new EmbedBuilder()
            .setColor('#10B981')
            .setTitle(`${emojis.success} Request Approved`)
            .setDescription(`Successfully approved inactive request for <@${userId}>.\n\n**Duration:** ${formattedDuration}\n**Expires:** <t:${Math.floor(endTime / 1000)}:R>\n\nThe inactive role will be automatically removed when the duration expires.`)
            .setFooter({ text: client.config.settings.footerText })
            .setTimestamp();

        await interaction.reply({ embeds: [replyEmbed], ephemeral: true });

    } catch (error) {
        await errorHandler.handleError(error, {
            action: 'handleInactiveAccept',
            user: interaction.user.tag
        });
    }
}

async function handleInactiveDeny(interaction, client, db, errorHandler) {
    try {
        if (!hasManagerPermission(interaction.member, db)) {
            const embed = new EmbedBuilder()
                .setColor('#EF4444')
                .setTitle(`${emojis.error} Permission Denied`)
                .setDescription(`You don't have permission to deny inactive requests.\n\n**Required:** Manager Role or Administrator`)
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const userId = interaction.customId.split('_')[2];

        const modal = new ModalBuilder()
            .setCustomId(`deny_reason_modal_${userId}_${interaction.message.id}`)
            .setTitle('Deny Inactive Request');

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Reason (Optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
            .setPlaceholder('Enter reason for denial...');

        const actionRow = new ActionRowBuilder().addComponents(reasonInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);

    } catch (error) {
        await errorHandler.handleError(error, {
            action: 'handleInactiveDeny',
            user: interaction.user.tag
        });
    }
}

async function handleDenyReasonModal(interaction, client, db, errorHandler) {
    try {
        const parts = interaction.customId.split('_');
        const userId = parts[3];
        const messageId = parts[4];

        const reason = interaction.fields.getTextInputValue('reason') || 'No reason provided';

        const request = db.getInactiveRequest(messageId);
        if (!request) {
            const embed = new EmbedBuilder()
                .setColor('#EF4444')
                .setTitle(`${emojis.error} Request Not Found`)
                .setDescription(`This inactive request could not be found in the database.\n\n**Possible reasons:**\n• The request was already processed\n• The request has expired\n• Database was reset`)
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        db.removeInactiveRequest(messageId);

        const deniedEmbed = new EmbedBuilder()
            .setColor('#EF4444')
            .setTitle(`${emojis.deny} Inactive Request Denied`)
            .setDescription(`**Member:** <@${userId}>\n**Denied by:** ${interaction.user}\n\n**Status:** ❌ Denied`)
            .addFields(
                { name: '━━━━━━━━━━━━━━━━━━━━', value: '\u200B', inline: false },
                { name: `${emojis.info} Original Request`, value: `\`\`\`${request.reason}\`\`\``, inline: false },
                { name: `${emojis.deny} Denial Reason`, value: `\`\`\`${reason}\`\`\``, inline: false }
            )
            .setFooter({ text: client.config.settings.footerText })
            .setTimestamp();

        const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
        if (message) {
            await message.edit({ embeds: [deniedEmbed], components: [] });
        }

        try {
            const user = await client.users.fetch(userId);
            const dmEmbed = new EmbedBuilder()
                .setColor('#EF4444')
                .setTitle(`${emojis.deny} Inactive Request Denied`)
                .setDescription(`Your inactive request in **${interaction.guild.name}** has been denied by ${interaction.user.tag}`)
                .addFields(
                    { name: '━━━━━━━━━━━━━━━━━━━━', value: '\u200B', inline: false },
                    { name: `${emojis.info} Your Request`, value: `\`\`\`${request.reason}\`\`\``, inline: false },
                    { name: `${emojis.deny} Denial Reason`, value: `\`\`\`${reason}\`\`\``, inline: false }
                )
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();

            await user.send({ embeds: [dmEmbed] });
        } catch (dmError) {
            console.log(`Could not send DM to user ${userId}`);
        }

        const replyEmbed = new EmbedBuilder()
            .setColor('#10B981')
            .setTitle(`${emojis.success} Request Denied`)
            .setDescription(`Successfully denied inactive request for <@${userId}>.`)
            .setFooter({ text: client.config.settings.footerText })
            .setTimestamp();

        await interaction.reply({ embeds: [replyEmbed], ephemeral: true });

    } catch (error) {
        await errorHandler.handleError(error, {
            action: 'handleDenyReasonModal',
            user: interaction.user.tag
        });
    }
}
