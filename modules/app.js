import {
  Client as DiscordClient,
  Intents as DiscordIntents
} from 'discord.js';

class App {
  constructor(options) {
    this.init().then(() => {
      this.connect(options.token);
    });
  }

  async init() {
    this.discordClient = this.initDiscordClient();
  }

  initDiscordClient() {
    const client = new DiscordClient({
      intents: [DiscordIntents.FLAGS.GUILDS]
    });
    client.on(
      'ready', (...args) => console.log({ ready: args }));
    client.on(
      'message', (...args) => console.log({ message: args }));
    return client;
  }

  async connect(token) {
    await this.discordClient.login(token);
  }
}

export default App;