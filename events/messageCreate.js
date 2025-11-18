const emojis = require('../emojis');

module.exports = {
    name: 'messageCreate',
    async execute(message, client, db, errorHandler) {
        try {
            if (message.author.bot) return;

            const serverLink = db.getServerLink();
            if (!serverLink) return;

            if (message.guild.id === serverLink.mainServerId) {
                const member = message.member;
                if (!member) return;

                const mainGuild = message.guild;
                const staffGuild = await client.guilds.fetch(serverLink.staffServerId).catch(() => null);
                if (!staffGuild) return;
                
                const staffRoles = db.getStaffRoles(staffGuild.id);
                const memberRoles = member.roles.cache;
                
                const isStaff = staffRoles.some(staffRoleId => {
                    const mainRoleId = db.getMainRoleFromStaffRole(staffRoleId);
                    return mainRoleId && memberRoles.has(mainRoleId);
                });

                if (isStaff) {
                    db.trackMessage(message.author.id, message.guild.id);
                }
            }

        } catch (error) {
            console.error('[Message Create] Error:', error);
        }
    },
};
