class ChunkSection {
	// "chunks" are 16×256×16 collection of blocks, made of 16 chunk sections stacked
}

class Chunk {
	constructor() {
		this.sections = [];
		this.block_entities = [];

		for (let i = 0; i < 16; i++) {
			this.sections[i] = new ChunkSection();
		}
	}

	generate(x, y) {
		// generate a chunk
	}

	setBlock(x, y, z, block) {
		// set block within the chunk
	}

	getBlock(x, y, z) {
		// return a block at given coordinates of the chunk
	}
	
}

module.exports = Chunk;