const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasManagerPermission } = require('../utils/permissions');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demote')
        .setDescription('Demote a user from a staff role')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to demote')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('role')
                .setDescription('The role to remove')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for demotion')
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
            
            await member.roles.remove(role);

            const record = {
                userId: user.id,
                action: 'demote',
                role: role.id,
                reason: reason,
                executor: interaction.user.id,
                timestamp: Date.now()
            };
            db.addStaffRecord(record);

            const demoteEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle(`${emojis.demote} Staff Member Demoted`)
                .setDescription(`${user} has been demoted from ${role}`)
                .addFields(
                    { name: 'Demoted By', value: `${interaction.user}`, inline: true },
                    { name: 'Reason', value: reason, inline: true }
                )
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();

            const demoteChannelId = db.getChannel(interaction.guild.id, 'demote');
            if (demoteChannelId) {
                const demoteChannel = await client.channels.fetch(demoteChannelId).catch(() => null);
                if (demoteChannel) {
                    await demoteChannel.send({ embeds: [demoteEmbed] });
                }
            }

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle(`${emojis.demote} You've Been Demoted`)
                    .setDescription(`You have been demoted in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Role Removed', value: `${role}`, inline: true },
                        { name: 'Demoted By', value: `${interaction.user}`, inline: true },
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
                .setDescription(`${emojis.success} Successfully demoted ${user} from ${role}`)
                .setFooter({ text: client.config.settings.footerText });

            await interaction.reply({ embeds: [replyEmbed], ephemeral: true });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'demote',
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
