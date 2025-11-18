const { SlashCommandBuilder } = require('discord.js');
const { hasManagerPermission } = require('../utils/permissions');
const EmbedFactory = require('../utils/embedFactory');
const emojis = require('../emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staffhistory')
        .setDescription('View staff action history (Manager/Owner only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('View specific user history')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of records to show (default: 10)')
                .setMinValue(1)
                .setMaxValue(25)
                .setRequired(false)),

    async execute(interaction, client, db, errorHandler) {
        try {
            const embedFactory = new EmbedFactory(client.config);

            if (!hasManagerPermission(interaction.member, db)) {
                const embed = embedFactory.error('Permission Denied', 'Only managers and owners can use this command.');
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const targetUser = interaction.options.getUser('user');
            const limit = interaction.options.getInteger('limit') || 10;

            let records = targetUser 
                ? db.getStaffRecords(targetUser.id)
                : db.getAllStaffRecords();

            records = records
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, limit);

            if (records.length === 0) {
                const embed = embedFactory.info(
                    'No Records Found',
                    targetUser 
                        ? `No staff action records found for ${targetUser}.`
                        : 'No staff action records found.'
                );
                return await interaction.reply({ embeds: [embed], ephemeral: true });
            }

            const embed = embedFactory.createBase()
                .setColor(embedFactory.colors.info)
                .setTitle(`${emojis.log} Staff Action History`)
                .setDescription(targetUser 
                    ? `Showing last ${records.length} action(s) for ${targetUser}`
                    : `Showing last ${records.length} action(s)`);

            let history = '';
            for (const record of records) {
                const actionEmoji = record.action === 'promote' ? emojis.promote 
                    : record.action === 'demote' ? emojis.demote 
                    : record.action === 'fire' ? emojis.fire 
                    : emojis.resign;

                const user = await client.users.fetch(record.userId).catch(() => null);
                const executor = await client.users.fetch(record.executor).catch(() => null);
                const userName = user ? user.tag : `Unknown (${record.userId})`;
                const executorName = executor ? executor.tag : `Unknown (${record.executor})`;
                const timestamp = `<t:${Math.floor(record.timestamp / 1000)}:R>`;

                history += `${actionEmoji} **${record.action.toUpperCase()}** - ${userName}\n`;
                history += `${emojis.manager} By: ${executorName} | ${emojis.time} ${timestamp}\n`;
                history += `${emojis.info} Reason: ${record.reason}\n\n`;
            }

            embed.addFields({
                name: `${emojis.list} Records`,
                value: history || 'No records',
                inline: false
            });

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            await errorHandler.handleError(error, {
                command: 'staffhistory',
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
