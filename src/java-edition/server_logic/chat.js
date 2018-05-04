const NodecraftPlugin = require('../NodecraftPlugin');

class ChatPlugin extends NodecraftPlugin {
	constructor(server) {
		super(server);
	}

	onChat(sender, packet) {
		const message = packet.message;
		if (message.startsWith('/')) {
			sender.emit('command', message);
			return;
		}

		for (const player of this.server.players) {
			player.write('chat', {
				message: JSON.stringify({
					translate: 'chat.type.text',
					'with': [
						sender.username,
						message
					]
				}),
				position: 0
			});
		}
	}
}

module.exports = ChatPlugin;