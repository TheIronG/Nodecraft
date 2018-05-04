const STATES = require('../states');
const VERSIONS = require('../versions');
const NodecraftPlugin = require('../NodecraftPlugin');

class PingPlugin extends NodecraftPlugin {
	constructor(server) {
		super(server);
	}

	onLegacyPing(sender) {
		const string = '\xa7' + [
			1,
			VERSIONS[this.server.version],
			this.server.version,
			this.server.motd,
			this.server.players.length.toString(),
			this.server.max_players.toString()
		].join('\0');
		const payload = Buffer.from(string, 'utf16le').swap16();
		const length = Buffer.alloc(2);
		length.writeUInt16BE(string.length);

		const response = Buffer.concat([
			Buffer.from('ff', 'hex'),
			length,
			payload
		]);

		sender.socket.write(response);
	}

	onServerInfoPing(sender) {
		sender.state = STATES.STATUS;

		const payload = {
			version: {
				name: this.server.version,
				protocol: VERSIONS[this.server.version]
			},
			players: {
				max: this.server.max_players,
				online: this.server.players.length,
				sample: []
			},
			description: {
				text: this.server.motd
			}
		};

		if (payload.players.online > 0) {
			const sample = [];
			// size 10 sample size
			for (let i = this.server.players.length - 1; i >= 0; i--) {
				const player = this.server.players[i];
				if (player) {
					sample.push({
						name: player.username,
						id: player.uuid
					});
				}
				
			}
			payload.players.sample = sample;
		}

		sender.write('server_info', {
			response: JSON.stringify(payload)
		});
	}

	onPing(sender, packet) {
		sender.write('ping', {
			time: packet.time
		});
		sender.socket.destroy();
	}
}

module.exports = PingPlugin;