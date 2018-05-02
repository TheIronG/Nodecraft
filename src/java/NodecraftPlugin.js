/*
	The only thing this class does is create the `onEventName` plugin API
*/

class NodecraftPlugin {
	constructor(server) {
		this.server = server;

		this.server.onAny((event, ...values) => {
			// /console.log(snake2Camel('on_' + event));
			const func = this[snake2Camel('on_' + event)];
			if (func) {
				func.call(this, ...values);
			}
		});
	}
}

module.exports = NodecraftPlugin;

function snake2Camel(string) {
	return string.replace(/(_\w)/g, matches => matches[1].toUpperCase());
}