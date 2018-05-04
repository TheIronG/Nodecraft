const NodecraftPlugin = require('../NodecraftPlugin');

class CommandPlugin extends NodecraftPlugin {
	constructor(server) {
		super(server);
	}

	onCommand(sender, command) {
		// handle commands
		if (command.startsWith('/chest')) { // test command
			sender.write('open_window', {
				windowId: 1,
				inventoryType: 'minecraft:chest',
				windowTitle: JSON.stringify('§bChest'),
				slotCount: 9 // one row of 9
			});
		}
	}
}

module.exports = CommandPlugin;