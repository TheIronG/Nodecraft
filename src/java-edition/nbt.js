// currently unused

const zlib = require('zlib');
const PassThrough = require('stream').PassThrough;

const GZIP_HEADER = Buffer.from('1F8B', 'hex');
const TAG_TYPES = {
	END: 0x00,
	BYTE: 0x01,
	SHORT: 0x02,
	INT: 0x03,
	LONG: 0x04,
	FLOAT: 0x05,
	DOUBLE: 0x06,
	BYTE_ARRAY: 0x07,
	STRING: 0x08,
	LIST: 0x09,
	COMPOUND: 0x0A,
	INT_ARRAY: 0x0B,
	LONG_ARRAY: 0x0C
};

class NBT {
	/*
		NBT PARSING
	*/
	parse(nbt) {
		if (isGZipped(nbt)) {
			nbt = zlib.gunzipSync(nbt);
		}

		this.nbt = new PassThrough();
		this.nbt.end(nbt);

		const root = {};

		this.toTree(root);
		
		return root[''];
	}

	toTree(tree) {
		const type = this.readByte();

		if (type === TAG_TYPES.END) return false;

		const name = this.readString();

		tree[name] = this.read(type);

		return true;
	}

	read(type) {
		switch (type) {
			case TAG_TYPES.END:
				return false;
			case TAG_TYPES.BYTE:
				return this.readByte();
			case TAG_TYPES.SHORT:
				return this.readShort();
			case TAG_TYPES.INT:
				return this.readInt();
			case TAG_TYPES.LONG:
				return this.readLong();
			case TAG_TYPES.FLOAT:
				return this.readFloat();
			case TAG_TYPES.DOUBLE:
				return this.readDouble();
			case TAG_TYPES.BYTE_ARRAY:
				return this.readByteArray();
			case TAG_TYPES.STRING:
				return this.readString();
			case TAG_TYPES.LIST:
				return this.readList();
			case TAG_TYPES.COMPOUND:
				return this.readCompound();
			case TAG_TYPES.INT_ARRAY:
				return this.readIntArray();
			case TAG_TYPES.LONG_ARRAY:
				return this.readLongArray();
			default:
				throw new Error(`Encounted unknown tag type ${type}`);
		}
	}

	readByte() {
		return this.nbt.read(1).readInt8();
	}

	readShort() {
		return this.nbt.read(2).readInt16BE();
	}

	readInt() {
		return this.nbt.read(4).readInt32BE();
	}
	readLong() {
		return readInt64BE(this.nbt.read(8));
	}

	readFloat() {
		return this.nbt.read(4).readFloatBE();
	}

	readDouble() {
		return this.nbt.read(8).readDoubleBE();
	}

	readByteArray() {
		return this.list(TAG_TYPES.BYTE, this.readInt());
	}

	readString() {
		const string_length = this.readShort();
		const string = this.nbt.read(string_length);

		return (string ? string.toString() : '');
	}

	readList() {
		return this.list(this.readByte(), this.readInt());
	}

	readCompound() {
		const branch = {};

		while(this.toTree(branch)) {}

		return branch;
	}

	readIntArray() {
		return this.list(TAG_TYPES.INT, this.readInt());
	}

	readLongArray() {
		return this.list(TAG_TYPES.LONG, this.readInt());
	}

	list(type, length) {
		const list = [];

		for (let i = 0; i < length; i++) {
			list.push(this.read(type));
		}

		return list;
	}

	/*
		NBT SAVING
	*/

	save(json) {
		// Save this to NBT
		console.log(json);
	}
}

function isGZipped(buffer) {
	return buffer.subarray(0x00, 0x02).equals(GZIP_HEADER);
}

function readInt64BE(buffer) {
	return (buffer.readInt32BE() << 8) + buffer.readInt32BE(4);
}

module.exports = NBT;