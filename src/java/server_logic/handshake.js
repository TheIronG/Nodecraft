const STATES = require('../states');
const NodecraftPlugin = require('../NodecraftPlugin');

class HandshakePlugin extends NodecraftPlugin {
	constructor(server) {
		super(server);
	}

	onSetProtocol(sender, packet) {
		sender.state = packet.nextState;
		if (sender.state == STATES.STATUS) {
			sender.emit('server_info_ping', packet);
		}
	}
}

module.exports = HandshakePlugin;