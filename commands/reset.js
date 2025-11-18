const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EmbedFactory = require('../utils/embedFactory');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Reset all bot data (Owner only - DANGEROUS)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client, db, errorHandler) {
        try {
            const embedFactory = new EmbedFactory(client.config);

            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                const embed = embedFactory.error('Permission Denied', 'Only server administrators can use this command.');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const confirmEmbed = embedFactory.createBase()
                .setColor('#EF4444')
                .setTitle(`${emojis.warning} ⚠️ CRITICAL WARNING ⚠️`)
                .setDescription(`**You are about to PERMANENTLY DELETE all bot data!**\n\n**This will remove:**\n━━━━━━━━━━━━━━━━━━━━\n${emojis.role} All staff roles configuration\n${emojis.manager} All manager roles configuration\n${emojis.link} Server link settings\n${emojis.list} Role mapping data\n${emojis.log} Complete staff history & records\n${emojis.inactive} All inactive member records\n${emojis.channel} All channel configurations\n${emojis.shield} All strike records & statistics\n━━━━━━━━━━━━━━━━━━━━\n\n🔴 **THIS ACTION CANNOT BE UNDONE!** 🔴\n\n**Are you absolutely sure you want to continue?**`);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('reset_confirm')
                        .setLabel('Yes, Reset Everything')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji(emojis.warning),
                    new ButtonBuilder()
                        .setCustomId('reset_cancel')
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji(emojis.deny)
                );

            const message = await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true, fetchReply: true });

            const collector = message.createMessageComponentCollector({
                time: 30000
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    await i.reply({ content: 'Only the person who used this command can confirm.', ephemeral: true });
                    return;
                }

                if (i.customId === 'reset_confirm') {
                    db.resetData();
                    
                    if (client.staffListMessages) {
                        client.staffListMessages.clear();
                    }

                    const successEmbed = embedFactory.success(
                        'Database Reset Completed',
                        '**All bot data has been permanently deleted.**\n\n**Next Steps:**\n1️⃣ Use `/linkserver` to connect your servers\n2️⃣ Use `/staffrole` to configure staff roles\n3️⃣ Use `/manager` to set manager roles\n4️⃣ Configure channels with their respective commands\n\nThe bot is now ready for fresh configuration!'
                    );

                    await i.update({ embeds: [successEmbed], components: [] });
                } else {
                    const cancelEmbed = embedFactory.info(
                        'Reset Cancelled',
                        '**No data was deleted.**\n\nAll your bot configuration and data remains intact.'
                    );

                    await i.update({ embeds: [cancelEmbed], components: [] });
                }

                collector.stop();
            });

            collector.on('end', async (collected) => {
                if (collected.size === 0) {
                    const timeoutEmbed = embedFactory.warning(
                        'Reset Timed Out',
                        '**Confirmation window expired (30 seconds)**\n\nNo data was deleted. Your bot configuration and data remains intact.\n\nRun the command again if you still want to reset the database.'
                    );

                    await interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
                }
            });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'reset',
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
