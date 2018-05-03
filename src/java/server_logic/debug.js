const NodecraftPlugin = require('../NodecraftPlugin');

class DebugPlugin extends NodecraftPlugin {
	constructor(server) {
		super(server);
	}

	onPacket(sender, packet) {
		console.log(packet);
	}
}

module.exports = DebugPlugin;