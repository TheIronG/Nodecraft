const crypto = require('crypto');
const UUID1345 = require('uuid-1345');
const DATA_TYPES = require('./data_types');

function offlineUUID(username) {
	const md5 = crypto.createHash('md5');
	md5.update('OfflinePlayer:' + username, 'utf8');
	const uuid = md5.digest();

	uuid[0x06] &= 0x0F;
	uuid[0x06] |= 0x30;

	uuid[0x08] &= 0x3F;
	uuid[0x08] |= 0x80;
	
	return new UUID1345(uuid).toString();
}

function protocolIDToName(set, id) {
	const mapper = set.types.packet[1][0].type[1].mappings;

	return mapper[intToHexStr(id)];
}

function protocolIDToPrefixedName(set, id) {
	const name = protocolIDToName(set, id);
	const switcher = set.types.packet[1][1].type[1].fields;

	return switcher[name];
}

function getProtocolIDStruct(set, id) {
	const prefixed_name = protocolIDToPrefixedName(set, id);

	return set.types[prefixed_name][1];
}

function packetNameToProtocolID(set, name) {
	const mapper = set.types.packet[1][0].type[1].mappings;
	for (const id in mapper) {
		if (mapper.hasOwnProperty(id)) {
			if (mapper[id] == name) {
				return Number(id);
			}
		}
	}
}

function splitPacketStream(buffer) {
	const output = [];
	let offset = 0;
	while (offset < buffer.length) {
		const section_length = DATA_TYPES.varint.read(buffer, offset);
		const section_length_size = DATA_TYPES.varint.size(section_length);
		output.push(buffer.slice(offset, offset + section_length_size + section_length));

		offset += (section_length_size + section_length);
	}
	
	return output;
}

module.exports = {
	offlineUUID,
	protocolIDToName, protocolIDToPrefixedName,
	getProtocolIDStruct,
	packetNameToProtocolID,
	splitPacketStream
};

function intToHexStr(int) {
	let str = (+int).toString(16);

	if (str.length < 2) {
		str = '0' + str;
	}

	return '0x' + str;
}