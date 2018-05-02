/*
	Base Nodecraft plugin
	Handles all default server functionality
*/

const util = require('./util');

const STATES = require('./states');
const VERSIONS = require('./versions');
const NodecraftPlugin = require('./NodecraftPlugin');

class BasePlugin extends NodecraftPlugin {
	constructor(server) {
		super(server);
	}

	onPacket(sender, packet) {
		console.log(packet); // debug
	}

	onInitilized() {
		this.server.logger.info('Base plugin loaded');
	}

	onExit(sender) {
		if (this.server.connected_clients[sender.id]) delete this.server.connected_clients[sender.id];
		if (this.server.players[sender.id]) delete this.server.players[sender.id];
	}

	onSetProtocol(sender, packet) {
		sender.state = packet.nextState;
		if (sender.state == STATES.STATUS) {
			sender.emit('server_info_ping', packet);
		}
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
			for (let i = this.server.players.length - 1; i >= 10; i++) {
				const player = this.server.players[i];
				if (player) {
					sample.push({
						name: player.name,
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

	onLoginStart(sender, packet) {
		sender.username = packet.username;
		if (!this.server.online_mode) {
			login.call(this, sender);
			return;
		}
		// authenticate
	}

	onLogin(sender) {
		sender.write('login', {
			entityId: sender.id,
			levelType: 'default',
			gameMode: 0,
			dimension: 0,
			difficulty: 2,
			maxPlayers: this.server.max_players,
			reducedDebugInfo: false
		});
		sender.write('position', {
			x: 0,
			y: 50,
			z: 0,
			yaw: 0,
			pitch: 0,
			flags: 0x00,
			teleportId: 0
		});
		sender.write('spawn_position', {
			location: {
				x: 0,
				y: 50,
				z: 0
			}
		});
		
		this.server.keepAlive(sender);
	}

	onChat(sender, packet) {
		const message = packet.message;
		if (message.startsWith('/')) {
			// handle command
			if (message.startsWith('/chest')) { // test command
				sender.write('open_window', {
					windowId: 1,
					inventoryType: 'minecraft:chest',
					windowTitle: JSON.stringify('§bChest'),
					slotCount: 9 // one row of 9
				});
			}
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

module.exports = BasePlugin;

function login(client) {
	if (!this.server.online_mode) {
		client.uuid = util.offlineUUID(client.username);
	} else {
		client.uuid = util.offlineUUID(client.username);
	}

	client.write('success', {
		uuid: client.uuid,
		username: client.username
	});
	client.state = STATES.PLAY;
	this.server.players.push(client);

	client.emit('login');
}