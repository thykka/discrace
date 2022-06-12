import GameClient from './modules/client.js';

new GameClient({
  token: process.env.TOKEN,
  allowedChannels: process.env.CHANNEL.includes(',') ? process.env.CHANNEL.split(',') : [process.env.CHANNEL],
  commands: {
    '!race': 'newGame',
    '!?': 'showGame',
    '!help': 'showHelp',
    '!move': 'movePlayer',
    '1': 'movePlayer',
    '2': 'movePlayer',
    '3': 'movePlayer',
    '4': 'movePlayer',
    '5': 'movePlayer',
    '6': 'movePlayer',
    '7': 'movePlayer',
    '8': 'movePlayer',
    '9': 'movePlayer',
  }
});
