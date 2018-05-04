const util = require('../util');

const STATES = require('../states');
const NodecraftPlugin = require('../NodecraftPlugin');

class LoginPlugin extends NodecraftPlugin {
	constructor(server) {
		super(server);
	}

	onExit(sender) {
		if (this.server.connected_clients[sender.id]) delete this.server.connected_clients[sender.id];
		for (let i = this.server.players.length-1; i >= 0; i--) {
			const player = this.server.players[i];
			if (sender.id == player.id) {
				this.server.players.splice(i, 1);
				break;
			}
		}
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
			gameMode: 1,
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

		for (const player of this.server.players) {
			player.write('chat', {
				message: JSON.stringify({
					translate: 'multiplayer.player.joined',
					'with': [
						sender.username
					],
					color: 'yellow'
				}),
				position: 0
			});
		}
	}
}

module.exports = LoginPlugin;

function login(client) {
	if (!this.server.online_mode) {
		client.uuid = util.offlineUUID(client.username);
	} else {
		// Have not implemented online mode stuff
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