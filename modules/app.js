import {
  Client as DiscordClient,
  Intents as DiscordIntents
} from 'discord.js';

import Renderer from './renderer.js';

const CHANNEL = '813884640926105620';

class App {
  constructor(options) {
    this.init().then(
      () => this.discordClient.login(options.token)
    );
  }

  async init() {
    this.renderer = new Renderer();
    this.discordClient = this.initClient();
  }

  initClient() {
    const client = new DiscordClient({
      intents: [DiscordIntents.FLAGS.GUILDS]
    });
    client.on(
      'ready', async client => {
        // client
        const channel = client.channels.cache.get(CHANNEL);
        await this.renderer.save();
        channel.send({
          files: ['./' + this.renderer.filename]
        });
      });
    client.on(
      'message', (...args) => console.log({ message: args }));
    
    return client;
  }
}

export default App;