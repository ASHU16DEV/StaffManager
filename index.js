const { Client, Collection, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const fs = require('fs');
const cron = require('node-cron');
const config = require('./config');
const Database = require('./utils/database');
const ErrorHandler = require('./utils/errorHandler');
const EmbedFactory = require('./utils/embedFactory');
const { createStaffListEmbed } = require('./commands/stafflist');
const { processExpiredInactiveMembers } = require('./utils/taskProcessor');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.GuildMember],
});

client.config = config;
client.commands = new Collection();
client.staffListMessages = new Map();

const db = new Database();
const errorHandler = new ErrorHandler(client, db);

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        if (event.needsParams) {
            client.once(event.name, async () => {
                await event.execute(client, db, errorHandler);
            });
        } else {
            client.once(event.name, async (...args) => {
                await event.execute(...args, client, db, errorHandler);
            });
        }
    } else {
        client.on(event.name, async (...args) => {
            await event.execute(...args, client, db, errorHandler);
        });
    }
}

cron.schedule('*/30 * * * * *', async () => {
    try {
        if (!client.isReady()) return;

        for (const [messageId, data] of client.staffListMessages) {
            try {
                const channel = await client.channels.fetch(data.channelId).catch(() => null);
                if (!channel) {
                    client.staffListMessages.delete(messageId);
                    continue;
                }

                const message = await channel.messages.fetch(messageId).catch(() => null);
                if (!message) {
                    client.staffListMessages.delete(messageId);
                    continue;
                }

                const guild = await client.guilds.fetch(data.guildId).catch(() => null);
                if (!guild) {
                    client.staffListMessages.delete(messageId);
                    continue;
                }

                const embedFactory = new EmbedFactory(client.config);
                const embed = await createStaffListEmbed(client, db, embedFactory);
                await message.edit({ embeds: [embed] });
            } catch (error) {
                console.error('[Cron] Error updating staff list:', error);
            }
        }
    } catch (error) {
        console.error('[Cron] Error in staff list update job:', error);
    }
});

cron.schedule('*/10 * * * * *', async () => {
    try {
        if (!client.isReady()) return;
        await processExpiredInactiveMembers(client, db, errorHandler);
    } catch (error) {
        console.error('[Cron] Error in inactive member check job:', error);
    }
});

cron.schedule('*/30 * * * * *', async () => {
    try {
        if (!client.isReady()) return;
        const clearedCount = db.clearAllExpiredStrikes();
        if (clearedCount > 0) {
            console.log(`[Cron] Cleared ${clearedCount} expired strike(s)`);
        }
    } catch (error) {
        console.error('[Cron] Error in strike expiration check job:', error);
    }
});

process.on('unhandledRejection', async (error) => {
    console.error('[Unhandled Rejection]', error);
    await errorHandler.handleError(error, { type: 'unhandledRejection' });
});

process.on('uncaughtException', async (error) => {
    console.error('[Uncaught Exception]', error);
    await errorHandler.handleError(error, { type: 'uncaughtException' });
});

async function registerCommands() {
    try {
        console.log('[Commands] Started refreshing application (/) commands.');

        const commands = [];
        for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            commands.push(command.data.toJSON());
        }

        const rest = new REST({ version: '10' }).setToken(config.bot.token);

        await rest.put(
            Routes.applicationCommands(config.bot.clientId),
            { body: commands },
        );

        console.log(`[Commands] Successfully reloaded ${commands.length} application (/) commands.`);
    } catch (error) {
        console.error('[Commands] Error registering commands:', error);
    }
}

// Validate credentials before attempting to login
if (!config.bot.token || config.bot.token === '' || config.bot.token.includes('${')) {
    console.error('\n❌ [Error] Discord Bot Token is missing!');
    console.error('\n📝 Please add your Discord credentials:');
    console.error('   1. Go to Secrets tab in Replit');
    console.error('   2. Add DISCORD_BOT_TOKEN (your bot token)');
    console.error('   3. Add DISCORD_CLIENT_ID (your application client ID)');
    console.error('\n🔗 Get your credentials from: https://discord.com/developers/applications\n');
    process.exit(1);
}

if (!config.bot.clientId || config.bot.clientId === '' || config.bot.clientId.includes('${')) {
    console.error('\n❌ [Error] Discord Client ID is missing!');
    console.error('\n📝 Please add DISCORD_CLIENT_ID in the Secrets tab\n');
    process.exit(1);
}

console.log('[Startup] Credentials validated, attempting to login...');

client.login(config.bot.token).then(() => {
    registerCommands();
}).catch(error => {
    console.error('[Login] Failed to login:', error);
    console.error('\n💡 Tip: Make sure your DISCORD_BOT_TOKEN is valid and the bot is not already running elsewhere.\n');
    process.exit(1);
});
