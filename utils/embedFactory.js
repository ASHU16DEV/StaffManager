const { EmbedBuilder } = require('discord.js');
const emojis = require('../emojis');

class EmbedFactory {
    constructor(config) {
        this.config = config;
        this.colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6',
            primary: '#5865F2',
            secondary: '#8B5CF6',
            purple: '#9333EA',
            blurple: '#5865F2'
        };
    }

    createBase(options = {}) {
        const embed = new EmbedBuilder()
            .setFooter({ 
                text: this.config.settings.footerText,
                iconURL: this.config.settings.footerIcon || undefined
            })
            .setTimestamp();
        
        if (options.author) {
            embed.setAuthor(options.author);
        }
        
        if (options.thumbnail) {
            embed.setThumbnail(options.thumbnail);
        }
        
        return embed;
    }

    success(title, description, fields = [], options = {}) {
        const embed = this.createBase(options)
            .setColor(this.colors.success)
            .setTitle(`${emojis.success} ${title}`)
            .setDescription(description ? `${description}` : null);
        
        if (fields.length > 0) {
            embed.addFields(fields);
        }
        return embed;
    }

    error(title, description, fields = [], options = {}) {
        const embed = this.createBase(options)
            .setColor(this.colors.error)
            .setTitle(`${emojis.error} ${title}`)
            .setDescription(description ? `${description}` : null);
        
        if (fields.length > 0) {
            embed.addFields(fields);
        }
        return embed;
    }

    warning(title, description, fields = [], options = {}) {
        const embed = this.createBase(options)
            .setColor(this.colors.warning)
            .setTitle(`${emojis.warning} ${title}`)
            .setDescription(description ? `${description}` : null);
        
        if (fields.length > 0) {
            embed.addFields(fields);
        }
        return embed;
    }

    info(title, description, fields = [], options = {}) {
        const embed = this.createBase(options)
            .setColor(this.colors.info)
            .setTitle(`${emojis.info} ${title}`)
            .setDescription(description ? `${description}` : null);
        
        if (fields.length > 0) {
            embed.addFields(fields);
        }
        return embed;
    }

    custom(color, title, description, fields = []) {
        const emoji = this.getEmojiForType(title);
        const embed = this.createBase()
            .setColor(color)
            .setTitle(emoji ? `${emoji} ${title}` : title)
            .setDescription(description);
        
        if (fields.length > 0) {
            embed.addFields(fields);
        }
        return embed;
    }

    promote(user, role, executor, reason) {
        return this.createBase()
            .setColor(this.colors.success)
            .setTitle(`${emojis.promote} Staff Member Promoted`)
            .setDescription(`**Member:** ${user}\n**New Role:** ${role}\n\n**Promoted by:** ${executor}`)
            .addFields(
                { name: '━━━━━━━━━━━━━━━━━━━━', value: '\u200B', inline: false },
                { name: `${emojis.info} Reason`, value: `\`\`\`${reason}\`\`\``, inline: false }
            );
    }

    demote(user, role, executor, reason) {
        return this.createBase()
            .setColor(this.colors.warning)
            .setTitle(`${emojis.demote} Staff Member Demoted`)
            .setDescription(`**Member:** ${user}\n**Removed Role:** ${role}\n\n**Demoted by:** ${executor}`)
            .addFields(
                { name: '━━━━━━━━━━━━━━━━━━━━', value: '\u200B', inline: false },
                { name: `${emojis.info} Reason`, value: `\`\`\`${reason}\`\`\``, inline: false }
            );
    }

    fire(user, executor, reason) {
        return this.createBase()
            .setColor(this.colors.error)
            .setTitle(`${emojis.fire} Staff Member Terminated`)
            .setDescription(`**Member:** ${user}\n**Status:** Removed from staff team\n\n**Terminated by:** ${executor}`)
            .addFields(
                { name: '━━━━━━━━━━━━━━━━━━━━', value: '\u200B', inline: false },
                { name: `${emojis.info} Reason`, value: `\`\`\`${reason}\`\`\``, inline: false }
            );
    }

    resign(user, reason) {
        return this.createBase()
            .setColor(this.colors.blurple)
            .setTitle(`${emojis.resign} Staff Resignation`)
            .setDescription(`**Member:** ${user}\n**Action:** Voluntarily resigned from staff team`)
            .addFields(
                { name: '━━━━━━━━━━━━━━━━━━━━', value: '\u200B', inline: false },
                { name: `${emojis.info} Reason`, value: `\`\`\`${reason}\`\`\``, inline: false }
            );
    }

    inactiveRequest(user, duration, reason) {
        return this.createBase()
            .setColor(this.colors.blurple)
            .setTitle(`${emojis.inactive} New Inactive Request`)
            .setDescription(`**Requested by:** ${user}\n**Duration:** ${duration}\n\n**Status:** ⏳ Pending Manager Approval`)
            .addFields(
                { name: '━━━━━━━━━━━━━━━━━━━━', value: '\u200B', inline: false },
                { name: `${emojis.info} Reason`, value: `\`\`\`${reason}\`\`\``, inline: false }
            );
    }

    roleSync(action, user, staffRole, mainRole) {
        const isAdd = action === 'add';
        return this.createBase()
            .setColor(isAdd ? this.colors.success : this.colors.warning)
            .setTitle(`${emojis.sync} Role Synchronization`)
            .setDescription(`Role ${isAdd ? 'added to' : 'removed from'} ${user}`)
            .addFields(
                { name: `${emojis.server} Staff Server`, value: staffRole, inline: true },
                { name: `${emojis.server} Main Server`, value: mainRole, inline: true }
            );
    }

    list(title, description, items, emoji = emojis.list) {
        return this.createBase()
            .setColor(this.colors.primary)
            .setTitle(`${emoji} ${title}`)
            .setDescription(description || items);
    }

    getEmojiForType(title) {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('promote')) return emojis.promote;
        if (lowerTitle.includes('demote')) return emojis.demote;
        if (lowerTitle.includes('fire') || lowerTitle.includes('terminated')) return emojis.fire;
        if (lowerTitle.includes('resign')) return emojis.resign;
        if (lowerTitle.includes('inactive')) return emojis.inactive;
        if (lowerTitle.includes('staff')) return emojis.staff;
        if (lowerTitle.includes('manager')) return emojis.manager;
        if (lowerTitle.includes('sync')) return emojis.sync;
        if (lowerTitle.includes('settings')) return emojis.settings;
        if (lowerTitle.includes('channel')) return emojis.channel;
        if (lowerTitle.includes('role')) return emojis.role;
        return null;
    }
}

module.exports = EmbedFactory;
