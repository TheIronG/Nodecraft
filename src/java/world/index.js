const Chunk = require('./chunk');
const fs = require('fs-extra');
const crypto = require('crypto');

class World {
	constructor(init=crypto.randomBytes(24).toString('hex')) { // if nothing passed, assume wanting to generate and make a seed
		this.chunks = {};
		this.seed = null;

		if (fs.pathExistsSync(init)) { // if path exists, assume its a path to a world
			// load world
		} else {
			this.seed = init;
			// generate world, treating "init" as the seed
		}
	}

	setChunk(x, z, chunk) { // set a chunk
		this.chunks[[x, z]] = chunk;
	}

	getChunk(x, z) { // get a chunk
		if (!([x, z] in this.chunks)) {
			const chunk = new Chunk();
			chunk.generate(x, z);
			
			this.setChunk(x, z, chunk);
		}

		return this.chunks[[x, z]];
	}
}

module.exports = World;