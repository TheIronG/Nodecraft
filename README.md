# Nodecraft

Nodecraft is a custom Mincraft server written from the ground up in NodeJS.

**THIS IS NOT MEANT TO BE USED AS A PRACTICAL ALTERNATIVE TO EXISTING SERVERS** (yet). I started this for fun to see if I could. Many things do not work.

I would eventually like to make this server feature-complete and have it be a viable replacement for servers like Spigot

## Currently only supports offline mode! Logins are NOT authenticated yet!

## Implemented (Java Protocol):
- [x] Server list handshake
- [x] Server list info
- [x] Server list ping/pong
- [x] Login/join handshake
- [ ] Authentication
- [x] Server Joining
- [ ] World rendering
- [ ] World generating
- [ ] World saving
- [ ] World interactions
- [ ] Player/entity rendering
- [ ] Player/entity saving
- [x] Chat
- [x] Command handling
- [ ] Implement all vanilla commands
- [ ] Entity spawning
- [ ] Movement
- [ ] Entity interactions
- [x] Basic plugin system

## Implemented (Bedrock Protocol):
Not started

# Setup
## Easy
You can clone/download this repo as-is, and start the server via `node server.js` in the root folder. This will start the server on port `25565` with the default Minecraft server settings

## Custom
You can customize the server by passing in several settings into the server object.
> ## new NodecraftServer(version, root[, settings]);
## Params:
> - version: Minecraft version (IE, `1.12.2`)
> - root: Server root. Nodecraft will use this directory to save and load to and from (the logs, plugins folder, world folder, ect)
> - settings: Minecraft server settings. Supports all vanilla settings, using underscores (_) instead of hyphens (-) (`allow-flight` becomes `allow_flight`)

## Example
```javascript
// Creates a 1.12.2 server with custom MOTD and 100 max players
const NodecraftServer = require('./src/java/server');
new NodecraftServer('1.12.2', __dirname, {
	motd: '§bWelcome to §eNodecraft',
	max_players: 100
});
```

# Plugins
Nodecraft comes with a very basic plugin API. Not much is possible yet with it, it currently is only being used internally by `server_logic` to add all the server functionality. Nodecraft will try to load plugins from the `plugins` folder in the `root` defined when creating the server.

## Example
```javascript
const NodecraftPlugin = require('../../src/java/NodecraftPlugin');

class Plugin extends NodecraftPlugin {
	constructor(server) {
		super(server);
	}

	onInitilized() {
		console.log('This message is from a plugin. I have hooked the `initilized` event handle! I run AFTER the base plugin');
	}
}

module.exports = Plugin;
```

## API
The API is very simple. Every event emitted by a client is in `snake_case`, and has a corresponding `camelCase` API method.

For example, when the client requests the server info for the multiplayer list, it emits `server_info_ping` which calls `onServerInfoPing` in the plugin API

(Almost) Every API method that has a `sender` argument will also have a `packet` argument. However not all events utilize this packet if it exists

> ## **NOTE: Each plugin will hook it's own instance of each event! Meaning, for example, a `onChat` event hooked by 2 different plugins ("plugin1" and "plugin2") will be 2 seperate, isolated, events! Changing the packet data in "plugin1" will NOT be reflected in the packet data of "plugin2". Because of this, you can NOT overwrite events (cannot change the functionality of the "server_logic" plugins, for example), cancel events, etc! I do not know how to properly implement that type of functionality!**

## API Methods (incomplete)
> ### onPacket(sender, packet)
### Packet data:
> - Depends on packet type and sender state
Emitted for any and all packets, even if the server does not have a proper event for them. Can be used to implement protcol features in plugins that the core does not provide


> ### onInitilized()
Emitted when the server finishes initilizing. May not be listening yet


> ### onListening()
Emitted when server is listening

> ### onExit(sender)
Emitted when a client connection exits

> ### onSetProtocol(sender, packet)
### Packet data:
> - protocolVersion: Protocol version for the server (1.12.2 = 340)
> - serverHost: The server host
> - serverPort: The server port
> - nextState: Clients next state (1 for status, 2 for play)

Emitted when a client sends a handshake packet, either for the server list ping or for the server join ping

> ### onLegacyPing(sender, packet)
### Packet data:
> - Not implemented yet

Emitted when the client sends a legacy server list ping

> ### onServerInfoPing(sender)
Emitted when the client sends a server list ping

> ### onPing(sender, packet)
### Packet data:
> - time: ping time

> ### onLoginStart(sender, packet)
### Packet data:
> - username: the senders username

Emitted when the client trys to log into the server

> ### onLogin(sender)

Emitted when the client logs into the server

> ### onChat(sender, packet)
### Packet data:
> - message: the chat message

Emitted when the client sends a chat message

> ### onCommand(sender, command)

Emitted when the client sends a chat command