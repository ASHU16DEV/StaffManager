const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasManagerPermission, isStaffMember } = require('../utils/permissions');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fire')
        .setDescription('Fire a staff member')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to fire')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for firing')
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
            const reason = interaction.options.getString('reason') || 'No reason provided';

            const member = await interaction.guild.members.fetch(user.id);
            
            if (!isStaffMember(member, db)) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription(`${emojis.error} This user is not a staff member.`)
                    .setFooter({ text: client.config.settings.footerText });
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const staffRoles = db.getStaffRoles(interaction.guild.id);
            const memberStaffRoles = member.roles.cache.filter(role => staffRoles.includes(role.id));
            
            for (const role of memberStaffRoles.values()) {
                await member.roles.remove(role);
            }

            const record = {
                userId: user.id,
                action: 'fire',
                roles: Array.from(memberStaffRoles.keys()),
                reason: reason,
                executor: interaction.user.id,
                timestamp: Date.now()
            };
            db.addStaffRecord(record);

            const fireEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(`${emojis.fire} Staff Member Fired`)
                .setDescription(`${user} has been fired from the staff team`)
                .addFields(
                    { name: 'Fired By', value: `${interaction.user}`, inline: true },
                    { name: 'Reason', value: reason, inline: true }
                )
                .setFooter({ text: client.config.settings.footerText })
                .setTimestamp();

            const fireChannelId = db.getChannel(interaction.guild.id, 'fire');
            if (fireChannelId) {
                const fireChannel = await client.channels.fetch(fireChannelId).catch(() => null);
                if (fireChannel) {
                    await fireChannel.send({ embeds: [fireEmbed] });
                }
            }

            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle(`${emojis.fire} You've Been Fired`)
                    .setDescription(`You have been fired from the staff team in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Fired By', value: `${interaction.user}`, inline: true },
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
                .setDescription(`${emojis.success} Successfully fired ${user} from the staff team`)
                .setFooter({ text: client.config.settings.footerText });

            await interaction.reply({ embeds: [replyEmbed], ephemeral: true });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'fire',
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
