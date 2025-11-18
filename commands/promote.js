const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasManagerPermission } = require('../utils/permissions');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('promote')
        .setDescription('Promote a user to a staff role')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to promote')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('role')
                .setDescription('The role to promote to')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for promotion')
                .setRequired(false)),

    async execute(interaction, client, db, errorHandler) {
        try {
            if (!hasManagerPermission(interaction.member, db)) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription(`${emojis.error} You don't have permission to use this command.`)
                    .setFooter({ text: client.config.settings.footerText });
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            const roleId = interaction.options.getString('role');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            if (!roleId || roleId === 'none') {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription(`${emojis.error} Please select a valid role.`)
                    .setFooter({ text: client.config.settings.footerText });
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
            if (!role) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription(`${emojis.error} Role not found. Please try again.`)
                    .setFooter({ text: client.config.settings.footerText });
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const member = await interaction.guild.members.fetch(user.id);
            
            await member.roles.add(role);

            const record = {
                userId: user.id,
                action: 'promote',
                role: role.id,
                reason: reason,
                executor: interaction.user.id,
                timestamp: Date.now()
            };
            db.addStaffRecord(record);

            const promoteEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`${emojis.promote} Staff Member Promoted`)
                .setDescription(`${user} has been promoted to ${role}`)
                .addFields(
                    { name: 'Promoted By', value: `${interaction.user}`, inline: true },
                    { name: 'Reason', value: reason, inline: true }
                )
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();

            const promoteChannelId = db.getChannel(interaction.guild.id, 'promote');
            if (promoteChannelId) {
                const promoteChannel = await client.channels.fetch(promoteChannelId).catch(() => null);
                if (promoteChannel) {
                    await promoteChannel.send({ embeds: [promoteEmbed] });
                }
            }

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(`${emojis.promote} You've Been Promoted!`)
                    .setDescription(`You have been promoted in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'New Role', value: `${role}`, inline: true },
                        { name: 'Promoted By', value: `${interaction.user}`, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setFooter({ text: client.config.settings.footerText })
                    .setTimestamp();

                await user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log(`Could not send DM to ${user.tag}`);
            }

            const replyEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(`${emojis.success} Successfully promoted ${user} to ${role}`)
                .setFooter({ text: client.config.settings.footerText });

            await interaction.reply({ embeds: [replyEmbed], ephemeral: true });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'promote',
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
