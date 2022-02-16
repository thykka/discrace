import {
  Client as DiscordClient,
  Intents as DiscordIntents
} from 'discord.js';

import Renderer from './renderer.js';
import { RacingGame as Game } from './game.js';

class GameClient {
  constructor(options = {}) {
    const { token } = options;
    delete options.token;
    Object.assign(this, options);
    this.init()
      .then(() => this.discordClient.login(token));
  }

  async init() {
    this.game = new Game({ client: this });
    this.renderer = new Renderer({ client: this });
    this.discordClient = this.initClient();
  }

  initClient() {
    const client = new DiscordClient({
      intents: [
        DiscordIntents.FLAGS.GUILDS,
        DiscordIntents.FLAGS.GUILD_MESSAGES
      ]
    });
    client.on('ready', this.handleReady.bind(this));
    client.on('messageCreate', this.handleMessage.bind(this));
    return client;
  }

  handleReady(client) {
    console.info('Connected to Discord');
    
    /*
    const channel = client.channels.cache.get(
      process.env.CHANNEL
    );
    channel.send({
      files: ['./' + this.renderer.filename]
    });
    */
  }

  handleMessage(message) {
    const { channelId, content, author } = message;
    if(!this.allowedChannels.includes(channelId)) return;
    const { id, username } = author;
    const [firstWord, ...restWords] = content.split(/\s+/g);
    const commandName = this.commands[
      firstWord.trim().toLowerCase()
    ];
    if(!commandName) {
      console.log(`MSG:${username}> "${content}"`);
      return;
    } else {
      console.log(`CMD:${username}/${commandName}${
        restWords.length ? ' arguments: ' + restWords.join(' ') : ''
      }`);
      const result = this.game.command(commandName, {
        username,
        userId: id,
        args: restWords
      });
      console.log({ result });
      this.handleResult({ message }, result);
      return;
    }
  }

  handleResult(
    { message },
    { success, reaction, matchState } = {}
  ) {
    if(reaction) {
      message.react(reaction);
    }
    if(!success) return;
    if(matchState) {
      this.renderer.draw(matchState);
      this.renderer.save();
      message.channel.send({
        files: ['./' + this.renderer.filename]
      });
    }
  }
}

export default GameClient;