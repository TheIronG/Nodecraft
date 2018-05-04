const NodecraftPlugin = require('../../src/java-edition/NodecraftPlugin');

class Plugin extends NodecraftPlugin {
	constructor(server) {
		super(server);
	}

	onInitilized() {
		console.log('This message is from a plugin. I have hooked the `initilized` event handle! I run BEFORE the base plugin');
	}
}

module.exports = Plugin;