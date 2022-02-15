import GameClient from './modules/client.js';

new GameClient({
  token: process.env.TOKEN,
  allowedChannels: [process.env.CHANNEL],
  commands: {
    '!race': 'newGame',
    '!help': 'showHelp',
    '!move': 'movePlayer',
  }
});
