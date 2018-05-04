const NodecraftServer = require('./src/java-edition/server');
new NodecraftServer('1.12.2', __dirname, {
	motd: '§bWelcome to §eNodecraft',
	max_players: 100,
	online_mode: false
});