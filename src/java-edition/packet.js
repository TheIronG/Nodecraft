const DATA_TYPES = require('./data_types');

class Packet {
	constructor(buffer, struct) {
		this.buffer = buffer;

		this.length = DATA_TYPES.varint.read(this.buffer);
		this.id = DATA_TYPES.varint.read(this.buffer, DATA_TYPES.varint.size(this.length));
		this.payload = buffer.subarray(DATA_TYPES.varint.size(this.length) + DATA_TYPES.varint.size(this.id));

		if (struct) {
			let offset = 0;
			for (const definition of struct) {
				const buffer_section = this.payload.subarray(offset);
				this[definition.name] = DATA_TYPES[definition.type].read(buffer_section);
				
				offset += DATA_TYPES[definition.type].size(this[definition.name], definition.options);
			}
		}
	}
}

module.exports = Packet;