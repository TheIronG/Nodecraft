// Not implemented yet

const net = require('net');
const RCONError = require('../errors/rcon.error');

class RconProtocol {
	constructor(properties) {
		this.properties = properties;

		if (!this.properties.password) {
			throw new RCONError('RCON enabled but no password set. Please set an RCON password.');
		}

		this.connected_clients = [];
		this.server = net.createServer(socket => {
			// handle rcon connections/requests
			console.log(socket);
		}).listen(this.properties.port || 25575);
	}
}

module.exports = RconProtocol;