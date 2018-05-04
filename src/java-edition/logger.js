const path = require('path');
const fs = require('fs-extra');
require('colors');

class Logger {
	constructor(root) {
		this.root = root;
	}

	success(input) {
		const time = new Date();
		input = `[${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}] [SUCCESS]: ${input}`;
		fs.appendFileSync(path.join(this.root, 'logs', 'latest.log'), input + '\n');

		console.log(`${input}`.green.bold);
	}

	error(input) {
		const time = new Date();
		input = `[${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}] [ERROR]: ${input}`;
		fs.appendFileSync(path.join(this.root, 'logs', 'latest.log'), input + '\n');

		console.log(`${input}`.red.bold);
	}

	warn(input) {
		const time = new Date();
		input = `[${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}] [WARN]: ${input}`;
		fs.appendFileSync(path.join(this.root, 'logs', 'latest.log'), input + '\n');

		console.log(`${input}`.yellow.bold);
	}

	info(input) {
		const time = new Date();
		input = `[${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}] [INFO]: ${input}`;
		fs.appendFileSync(path.join(this.root, 'logs', 'latest.log'), input + '\n');

		console.log(`${input}`.cyan.bold);
	}
}

module.exports = Logger;