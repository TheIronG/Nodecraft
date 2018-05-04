const EventEmitter = require('eventemitter2').EventEmitter2;

const STATES = require('./states');
const DATA_TYPES = require('./data_types');

const util = require('./util');

const Packet = require('./packet');

class Client extends EventEmitter {
	constructor(socket, server) {
		super();

		this.server = server;

		this.id = -1;

		this.socket = socket;
		this.socket.setNoDelay(true);

		this.state = STATES.HANDSHAKE;

		this.socket.on('data', data => {
			this.constructor.handlePacket.call(this, data);
		});
		this.socket.on('close', () => {
			this.emit('exit');
		});
		this.socket.on('error', error => {
			console.log(error);
		});

		this.server.on('tick', () => {
			if (this.state == STATES.PLAY) {
				this.write('entity', {
					entityId: this.id
				});
			}
		});
	}

	write(name, data) {
		if (this.socket.destroyed) {
			return;
		}

		let protocol_set;

		switch (this.state) {
			case STATES.HANDSHAKE:
				protocol_set = this.server.data.protocol.handshaking.toClient;
				break;
			case STATES.STATUS:
				protocol_set = this.server.data.protocol.status.toClient;
				break;
			case STATES.LOGIN:
				protocol_set = this.server.data.protocol.login.toClient;
				break;
			case STATES.PLAY:
				protocol_set = this.server.data.protocol.play.toClient;
				break;
			default:
				throw new Error(`Unknown client state '${this.state}'`);
		}

		const packetID = util.packetNameToProtocolID(protocol_set, name);
		const struct = util.getProtocolIDStruct(protocol_set, packetID);
		const ordered = [];
		let length = DATA_TYPES.varint.size(packetID);

		for (let definition of struct) {
			for (const key in data) {
				if (key == definition.name) {
					if (definition.type instanceof Array) {
						definition = {
							type: definition.type[0],
							options: definition.type[1],
						};
					}

					ordered.push({
						name: key,
						type: definition.type,
						value: data[key],
						options: definition.options
					});

					if (!DATA_TYPES[definition.type]) {
						console.log('DATA TYPE MISSING', definition.type);
					}

					length += DATA_TYPES[definition.type].size(data[key], definition.options);
				}
			}
		}

		let packet = Buffer.alloc(length);
		let offset = 0;
		offset = DATA_TYPES.varint.write(packetID, packet, offset);

		for (const definition of ordered) {
			offset = DATA_TYPES[definition.type].write(definition.value, packet, offset, definition.options);
		}
		
		packet = Buffer.concat([
			Buffer.alloc(DATA_TYPES.varint.size(length)),
			packet
		]);
		DATA_TYPES.varint.write(length, packet);

		this.socket.write(packet);
	}

	static handlePacket(stream) {
		if (stream[0x00] == 0xFE) {
			this.emit('legacy_ping', this, stream);
			return;
		}
		
		const packets = util.splitPacketStream(stream); // TCP is a streaming protocol. Assume all packets are merged
		
		for (let packet of packets) {
			if (packet[0x00] == 0x01) { // ignore packets with no payload
				continue;
			}

			let protocol_set;
			packet = new Packet(packet);
	
			switch (this.state) {
				case STATES.HANDSHAKE:
					protocol_set = this.server.data.protocol.handshaking.toServer;
					break;
				case STATES.STATUS:
					protocol_set = this.server.data.protocol.status.toServer;
					break;
				case STATES.LOGIN:
					protocol_set = this.server.data.protocol.login.toServer;
					break;
				case STATES.PLAY:
					protocol_set = this.server.data.protocol.play.toServer;
					break;
				default:
					throw new Error(`Unknown client state '${this.state}'`);
			}
	
			const packet_name = util.protocolIDToName(protocol_set, packet.id);
			packet = new Packet(packet.buffer, util.getProtocolIDStruct(protocol_set, packet.id));
			packet.state = this.state;
			packet.name = packet_name;
	
			this.emit('packet', packet);
			this.emit(packet_name, packet);
		}
	}
}

module.exports = Client;