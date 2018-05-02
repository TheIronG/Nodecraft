const dgram = require('dgram');
const net = require('net');
const exec = require('child_process').execSync;
const path = require('path');
const fs = require('fs-extra');
const ini = require('ini');
const RSA = require('node-rsa');
const MCData = require('minecraft-data');
const bignum = require('bignum');

const udp_socket = dgram.createSocket('udp4');
const tcp_server = net.createServer();

const EventEmitter = require('eventemitter2').EventEmitter2;

const Logger = require('./logger');

const Client = require('./client');

const RCON = require('./rcon');
const Query = require('./query');

const MCServerError = require('./errors/mcserver.error');


class MCServer extends EventEmitter {
	constructor(version, root, properties = {}) {
		super();

		if (!root) {
			throw new MCServerError('No server root specified. Please specify a server root');
		}

		this.data = MCData(version);

		this.key = new RSA({
			b: 1024
		});

		this.initilized = false;

		this.root = root;
		this.logger = new Logger(this.root);

		this.plugins = [];

		this.version = version;
		this.properties = properties;
		this.udp_socket = udp_socket;
		this.tcp_server = tcp_server;

		this.query = {};
		this.rcon = {};

		this.properties.query = (this.properties.query == null ? {} : this.properties.query);
		this.properties.rcon  = (this.properties.rcon  == null ? {} : this.properties.query);

		this.allow_flight                  = (this.properties.allow_flight                  == null ?  false                           : this.properties.allow_flight);
		this.allow_nether                  = (this.properties.allow_nether                  == null ?  true                            : this.properties.allow_nether);
		this.difficulty                    = (this.properties.difficulty                    == null ?  1                               : this.properties.difficulty);
		this.enable_query                  = (this.properties.enable_query                  == null ?  false                           : this.properties.enable_query);
		this.enable_rcon                   = (this.properties.enable_rcon                   == null ?  false                           : this.properties.enable_rcon);
		this.enable_command_block          = (this.properties.enable_command_block          == null ?  false                           : this.properties.enable_command_block);
		this.force_gamemode                = (this.properties.force_gamemode                == null ?  false                           : this.properties.force_gamemode);
		this.gamemode                      = (this.properties.gamemode                      == null ?  0                               : this.properties.gamemode);
		this.generate_structures           = (this.properties.generate_structures           == null ?  true                            : this.properties.generate_structures);
		this.generator_settings            = (this.properties.generator_settings            == null ?  null                            : this.properties.generator_settings);
		this.hardcore                      = (this.properties.hardcore                      == null ?  false                           : this.properties.hardcore);
		this.level_name                    = (this.properties.level_name                    == null ?  'world'                         : this.properties.level_name);
		this.level_seed                    = (this.properties.level_seed                    == null ?  this.constructor.generateSeed() : this.properties.level_seed);
		this.level_type                    = (this.properties.level_type                    == null ?  'DEFAULT'                       : this.properties.level_type);
		this.max_build_height              = (this.properties.max_build_height              == null ?  256                             : this.properties.max_build_height);
		this.max_players                   = (this.properties.max_players                   == null ?  20                              : this.properties.max_players);
		this.max_tick_time                 = (this.properties.max_tick_time                 == null ?  60000                           : this.properties.max_tick_time);
		this.max_world_size                = (this.properties.max_world_size                == null ?  29999984                        : this.properties.max_world_size);
		this.motd                          = (this.properties.motd                          == null ?  'A Minceraft Server'            : this.properties.motd);
		this.network_compression_threshold = (this.properties.network_compression_threshold == null ?  256                             : this.properties.network_compression_threshold);
		this.online_mode                   = (this.properties.online_mode                   == null ?  true                            : this.properties.online_mode);
		this.op_permission_level           = (this.properties.op_permission_level           == null ?  4                               : this.properties.op_permission_level);
		this.player_idle_timeout           = (this.properties.player_idle_timeout           == null ?  0                               : this.properties.player_idle_timeout);
		this.prevent_proxy_connections     = (this.properties.prevent_proxy_connections     == null ?  false                           : this.properties.prevent_proxy_connections);
		this.pvp                           = (this.properties.pvp                           == null ?  true                            : this.properties.pvp);
		this.query.port                    = (this.properties.query.port                    == null ?  25565                           : this.properties.query.port);
		this.rcon.password                 = (this.properties.rcon.password                 == null ?  null                            : this.properties.rcon.password);
		this.rcon.port                     = (this.properties.rcon.port                     == null ?  25575                           : this.properties.rcon.port);
		this.resource_pack                 = (this.properties.resource_pack                 == null ?  null                            : this.properties.resource_pack);
		this.resource_pack_sha1            = (this.properties.resource_pack_sha1            == null ?  null                            : this.properties.resource_pack_sha1);
		this.server_ip                     = (this.properties.server_ip                     == null ?  null                            : this.properties.server_ip);
		this.server_port                   = (this.properties.server_port                   == null ?  25565                           : this.properties.server_port);
		this.snooper_enabled               = (this.properties.snooper_enabled               == null ?  true                            : this.properties.snooper_enabled);
		this.spawn_animals                 = (this.properties.spawn_animals                 == null ?  true                            : this.properties.spawn_animals);
		this.spawn_monsters                = (this.properties.spawn_monsters                == null ?  true                            : this.properties.spawn_monsters);
		this.spawn_npcs                    = (this.properties.spawn_npcs                    == null ?  true                            : this.properties.spawn_npcs);
		this.spawn_protection              = (this.properties.spawn_protection              == null ?  16                              : this.properties.spawn_protection);
		this.use_native_transport          = (this.properties.use_native_transport          == null ?  true                            : this.properties.use_native_transport);
		this.view_distance                 = (this.properties.view_distance                 == null ?  10                              : this.properties.view_distance);
		this.white_list                    = (this.properties.white_list                    == null ?  false                           : this.properties.white_list);

		this.udp_socket.on('message', this.constructor.handleUDPPacket.bind(this));
		this.tcp_server.on('connection', this.constructor.handleTCPConnection.bind(this));

		this.connected_clients = [];
		this.players = [];
		this.current_client_id = 0;
		
		if (this.properties.enable_rcon) {
			this.RCON = new RCON(this.properties.rcon);
		}

		if (this.properties.enable_query) {
			this.QueryProtocol = new Query(this);
		}

		this.startServer();
	}

	startServer() {
		fs.ensureFileSync(path.join(this.root, 'logs', 'latest.log'));

		this.logger.info(`Starting minecraft server version ${this.version}`);

		if (!fs.pathExistsSync(path.join(this.root, 'eula.txt'))) {
			this.logger.warn('Failed to load eula.txt');

			fs.ensureFileSync(path.join(this.root, 'eula.txt'));
			fs.appendFileSync(path.join(this.root, 'eula.txt'), '#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://account.mojang.com/documents/minecraft_eula).\n');
			fs.appendFileSync(path.join(this.root, 'eula.txt'), 'eula=false');
		}

		const EULA = ini.parse(fs.readFileSync(path.join(this.root, 'eula.txt')).toString());
		if (!EULA.eula) {
			this.logger.warn('You need to agree to the EULA in order to run the server. Go to eula.txt for more info.');
			this.killServer();
		}

		if (fs.pathExistsSync(path.join(this.root, 'plugins'))) {
			// load plugins
			const plugins = fs.readdirSync(path.join(this.root, 'plugins')).filter(plugin => {
				plugin = path.join(this.root, 'plugins', plugin);

				return (
					fs.statSync(plugin).isDirectory() &&
					fs.pathExistsSync(path.join(plugin, 'package.json'))
				);
			});

			for (let i = plugins.length-1; i >= 0; i--) {
				const plugin_name = plugins[i];
				const plugin_path = path.join(this.root, 'plugins', plugin_name);

				this.logger.info(`Loading plugin ${plugin_name}`);

				// There has to be a better way of doing this
				// This installs all the depends for the plugin, but is SUPER slow
				exec('npm i', {
					cwd: plugin_path
				});

				this.logger.info(`All ${plugin_name} plugin dependencies met`);

				const plugin_data = {};
				let plugin;
				plugin_data.metadata = require(path.join(plugin_path, 'package.json'));

				try {
					plugin = require(path.join(plugin_path));
				} catch (error) {
					this.logger.error(`Failed to load plugin ${plugin_name}! ${error.message}`);
					continue;
				}

				plugin_data.plugin = new plugin(this);
				plugin_data.plugin.enabled = true;
				this.plugins.push(plugin_data);

				this.logger.success(`Successfully loaded ${plugin_name}!`);
			}
		}

		const base_plugin_data = {};
		const base_plugin = require('./base_plugin');
		base_plugin_data.plugin = new base_plugin(this);
		base_plugin_data.plugin.enabled = true;
		this.plugins.push(base_plugin_data);

		this.initilized = true;
		this.emit('initilized');

		this.listen();
	}

	killServer() {
		this.logger.info('Stopping server');

		this.udp_socket.close();
		this.tcp_server.close();
	}

	static generateSeed() {
		// generate a seed
		return 'seed';
	}

	static handleUDPPacket(packet, client) {
		console.log(packet, client);
	}

	static handleTCPConnection(socket) {
		const client = new Client(socket, this);

		client.id = this.current_client_id++;

		this.connected_clients[client.id] = client;

		client.onAny((name, ...data) => {
			this.emit(name, client, ...data);
		});
	}

	listen() {
		this.udp_socket.bind(this.server_port);
		this.tcp_server.listen(this.server_port);

		this.logger.info('Server listening');

		this.emit('listening');

		this.startTicking(20); // 20 ticks per second
	}

	startTicking(TPS) {
		function stopTicking() {
			if (this.ticker) {
				clearInterval(this.ticker);
			}
			this.ticker = null;
		}

		this.ticks = 0;
		this.last_tick = 0;

		stopTicking.call(this);

		this.ticker = setInterval(() => {
			this.ticks++;

			const current_time = Date.now();

			let time = (current_time - this.last_tick) / 1000;
			if (time > 100) {
				time = 0;
			}
			
			this.emit('tick', time, this.ticks);
			
			this.last_tick = current_time;
		}, 1000 / TPS);
	}

	keepAlive(client) {
		setInterval(() => {
			client.write('keep_alive', {
				keepAliveId: bignum(9223372036854775807).rand().toNumber()
			});
		}, 20000); // wiki.vg states to send this every 30 seconds, lets send it every 29 just to be safe
	}
}

module.exports = MCServer;