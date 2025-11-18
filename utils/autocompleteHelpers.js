async function handleRoleAutocomplete(interaction, db) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const commandName = interaction.commandName;
    
    let roles = [];
    
    if (commandName === 'promote' || commandName === 'demote') {
        const staffRoleIds = db.getStaffRoles(interaction.guild.id);
        const guildRoles = await interaction.guild.roles.fetch();
        
        roles = guildRoles
            .filter(role => staffRoleIds.includes(role.id) && !role.managed && role.name.toLowerCase().includes(focusedValue))
            .map(role => ({
                name: role.name,
                value: role.id
            }))
            .slice(0, 25);
    }
    
    if (roles.length === 0) {
        roles = [{
            name: 'No matching roles found',
            value: 'none'
        }];
    }
    
    await interaction.respond(roles);
}

async function handleServerAutocomplete(interaction, client) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    
    const guilds = client.guilds.cache
        .filter(guild => guild.name.toLowerCase().includes(focusedValue))
        .map(guild => ({
            name: `${guild.name} (${guild.id})`,
            value: guild.id
        }))
        .slice(0, 25);
    
    if (guilds.length === 0) {
        await interaction.respond([{
            name: 'No matching servers found',
            value: 'none'
        }]);
    } else {
        await interaction.respond(guilds);
    }
}

module.exports = {
    handleRoleAutocomplete,
    handleServerAutocomplete
};
