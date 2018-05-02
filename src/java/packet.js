const DATA_TYPES = require('./data_types');

class Packet {
	constructor(buffer, struct) {
		this.buffer = buffer;
		this.cursor = 0;

		this.length = this.readVarInt();
		this.id = this.readVarInt();
		this.payload = buffer.subarray(0x02);

		if (struct) {
			let offset = 0;
			for (const definition of struct) {
				const buffer_section = this.payload.subarray(offset);
				this[definition.name] = DATA_TYPES[definition.type].read(buffer_section);
				
				offset += DATA_TYPES[definition.type].size(this[definition.name], definition.options);
			}
		}
	}

	readVarInt() {
		let pos = 0;
		let result = 0;
		let read = 0;
	
		do {
			read = this.buffer.subarray(this.cursor).readUInt8(pos);
			const int = (read & 0b01111111);
			result |= (int << (7 * pos));
			pos++;
		} while ((read & 0b10000000) != 0);
	
		this.cursor += pos;
		return result;
	}
}

module.exports = Packet;