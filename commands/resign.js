const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasStaffCommandPermission, isStaffMember } = require('../utils/permissions');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resign')
        .setDescription('Resign from your staff position')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for resignation')
                .setRequired(false)),

    async execute(interaction, client, db, errorHandler) {
        try {
            if (!hasStaffCommandPermission(interaction.member, db)) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription(`${emojis.error} You don't have permission to use this command.`)
                    .setFooter({ text: client.config.settings.footerText });
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            if (!isStaffMember(interaction.member, db)) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription(`${emojis.error} You are not a staff member.`)
                    .setFooter({ text: client.config.settings.footerText });
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const reason = interaction.options.getString('reason') || 'No reason provided';

            const staffRoles = db.getStaffRoles(interaction.guild.id);
            const memberStaffRoles = interaction.member.roles.cache.filter(role => staffRoles.includes(role.id));
            
            for (const role of memberStaffRoles.values()) {
                await interaction.member.roles.remove(role);
            }

            const record = {
                userId: interaction.user.id,
                action: 'resign',
                roles: Array.from(memberStaffRoles.keys()),
                reason: reason,
                timestamp: Date.now()
            };
            db.addStaffRecord(record);

            const resignEmbed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle(`${emojis.resign} Staff Member Resigned`)
                .setDescription(`${interaction.user} has resigned from the staff team`)
                .addFields(
                    { name: 'Reason', value: reason, inline: false }
                )
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();

            const resignChannelId = db.getChannel(interaction.guild.id, 'resign');
            if (resignChannelId) {
                const resignChannel = await client.channels.fetch(resignChannelId).catch(() => null);
                if (resignChannel) {
                    await resignChannel.send({ embeds: [resignEmbed] });
                }
            }

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle(`${emojis.resign} Resignation Confirmed`)
                    .setDescription(`Your resignation from **${interaction.guild.name}** has been processed`)
                    .addFields(
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setFooter({ text: client.config.settings.footerText })
                    .setTimestamp();

                await interaction.user.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log(`Could not send DM to ${interaction.user.tag}`);
            }

            const replyEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setDescription(`${emojis.success} Your resignation has been processed. Thank you for your service!`)
                .setFooter({ text: client.config.settings.footerText });

            await interaction.reply({ embeds: [replyEmbed], ephemeral: true });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'resign',
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
