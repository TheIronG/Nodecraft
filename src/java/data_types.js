
const _void = {
	read: () => null,
	write: (value, buffer, offset=0) => offset,
	size: () => 0
};

const varint = {
	read(buffer, position=0) {
		let pos = 0;
		let output = 0;
		let read = 0;
	
		do {
			read = buffer.subarray(position).readUInt8(pos);
			const int = (read & 0b01111111);
			output |= (int << (7 * pos));
			pos++;
		} while ((read & 0b10000000) != 0);
	
		return output;
	},
	write(int, buffer, position=0) {
		let offset = 0;
		do {
			let temp = int & 0b01111111;
			int >>>= 7;
	
			if (int != 0) {
				temp |= 0b10000000;
			}
	
			buffer.subarray(position).writeUInt8(temp, offset);
			offset++;
		} while (int != 0);
	
		return position + offset;
	},
	size(int) {
		let size = 0;
		while (int & -0b10000000) {
			int >>>= 7;
			size++;
		}
		
		return size + 1;
	}
};

const i8 = {
	read: (buffer, offset=0) => buffer.readInt8(offset),
	write(int, buffer, offset=0) {
		buffer.writeInt8(int, offset);
		return offset + 1;
	},
	size: () => 1
};

const u8 = {
	read: (buffer, offset=0) => buffer.readUInt8(offset),
	write(int, buffer, offset=0) {
		buffer.writeUInt8(int, offset);
		return offset + 1;
	},
	size: () => 1
};

const i16 = {
	read: (buffer, offset=0) => buffer.readInt16BE(offset),
	write(int, buffer, offset=0) {
		buffer.writeInt16BE(int, offset);
		return offset + 2;
	},
	size: () => 2
};

const u16 = {
	read: (buffer, offset=0) => buffer.readUInt16BE(offset),
	write(int, buffer, offset=0) {
		buffer.writeUInt16BE(int, offset);
		return offset + 2;
	},
	size: () => 2
};

const i32 = {
	read: (buffer, offset=0) => buffer.readInt32BE(offset),
	write(int, buffer, offset=0) {
		buffer.writeInt32BE(int, offset);
		return offset + 4;
	},
	size: () => 4
};

const u32 = {
	read: (buffer, offset=0) => buffer.readUInt32BE(offset),
	write(int, buffer, offset=0) {
		buffer.writeUInt32BE(int, offset);
		return offset + 4;
	},
	size: () => 4
};

const f32 = {
	read: (buffer, offset=0) => buffer.readFloatBE(offset),
	write(float, buffer, offset=0) {
		buffer.writeFloatBE(float, offset);
		return offset + 4;
	},
	size: () => 4
};

const i64 = {
	read: (buffer, offset=0) => (buffer.readInt32BE(offset) << 8) + buffer.readInt32BE(offset + 4),
	write(int, buffer, offset=0) {
		buffer.writeInt32BE(int >> 8, offset);
		buffer.writeInt32BE(int & 0xFF, offset + 4);
		return offset + 8;
	},
	size: () => 8
};

const f64 = {
	read: (buffer, offset=0) => buffer.readDoubleBE(offset),
	write(float, buffer, offset=0) {
		buffer.writeDoubleBE(float, offset);
		return offset + 8;
	},
	size: () => 8
};

const bool = {
	read: (buffer, offset=0) => !!(buffer.readUInt8(offset)),
	write(bool, buffer, offset=0) {
		buffer.writeUInt8(bool ? 1 : 0, offset);
		return offset + 1;
	},
	size: () => 1
};

const string = {
	read(buffer, offset=0) {
		const length = varint.read(buffer);
		return buffer.subarray(offset + 1, (offset + 1) + length).toString();
	},
	write(str, buffer, offset=0) {
		const length = Buffer.byteLength(str);
		const cursor = varint.write(length, buffer, offset);
		buffer.write(str, cursor, cursor + length);
		return cursor + length;
	},
	size(str) {
		const length = Buffer.byteLength(str);
		return varint.size(length) + length;
	}
};

const bytearray = {
	read(buffer, offset=0, options) {
		const length = module.exports[options.countType].read(buffer, offset);
		const output = Buffer.alloc(length);
		
		for (let i = 0; i < length.value; i++) {
			u8.write(u8.read(buffer, offset + length.size + i), output, i);
		}
		
		return output;
	},
	write(value, buffer, offset=0, options) {
		const cursor = module.exports[options.countType].write(value.length, buffer, offset);

		for (let i = 0; i < value.length; i++) {
			u8.write(u8.read(value, i), buffer, cursor + i);
		}

		return cursor + value.length;
	},
	size(value, options) {
		return module.exports[options.countType].size(value.length) + value.length;
	}
};

const restBuffer = {
	read: (buffer, offset=0) => buffer.subarray(offset),
	write(value, buffer, offset=0) {
		for (let i = 0; i < value.length; i++) {
			u8.write(u8.read(value, i), buffer, offset + i);
		}

		return offset + value.length;
	},
	size: value => value.length
};

const position = {
	read(buffer, offset=0) {
		return {
			x: i32.read(buffer, offset) >>> 6,
			y: (i16.read(buffer, offset + 3) >>> 2) & 0xFFF,
			z: i32.read(buffer, offset + 4) & 0x3FFFFFF
		};
	},
	write(data, buffer, offset=0) {
		i32.write((data.x & 0x3FFFFFF) << 6 | (data.y >>> 6), buffer, offset);
		i32.write(((data.y & 0b111111) << 26) | (data.z & 0x3FFFFFF), buffer, offset + 4);
		
		return offset + 8;
	},
	size: () => 8
};

module.exports = {
	void: _void,
	varint,
	i8, u8,
	i16, u16,
	i32, u32, f32,
	i64, f64,
	bool,
	string,
	bytearray,
	restBuffer,
	position,
};