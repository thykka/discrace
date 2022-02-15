import Tiles from './game-tiles.js';
import Levels from './game-levels.js';

export class RacingGame {
  constructor(options) {
    const defaults = {
      client: null,
      commands: {
        'newGame': this.handleNewMatch,
        'movePlayer': this.handleMovePlayer
      }
    };
    Object.assign(this, defaults, options);
    this.levels = this.loadLevels(Levels);
  }

  loadLevels(maps) {
    return Object.fromEntries(
      Object.entries(maps)
        .map(([mapName, map]) => {
          return [mapName, this.readMap(map)];
        })
    );
  }

  readMap({mapString}) {
    if(typeof mapString !== 'string')
      throw Error('Expected mapString, got ' + typeof mapString);
    const rows = mapString.trim().split('\n');
    const mapWidth = rows[0].length;
    return rows.flatMap((row, y) => {
      const chars = row.split('');
      if(chars.length !== mapWidth)
        throw Error(`Row ${y+1} is ${ chars.length } characters long, expected ${ mapWidth }`);
      return chars.map((char, x) => {
          const tile = Tiles[char];
          if(!tile) throw Error('Unknown tile character: ' + char);
          return { ...tile, x, y, char };
        });
    });
  }

  command(commandName, { username, userId, args }) {
    const command = this.commands[commandName];
    if(typeof command !== 'function') return;
    return command.call(this, {
      username,
      userId,
      args
    });
  }

  handleNewMatch({ args, username, userId }) {
    // check if match is already running (on this channel?)
    if(this.matchState) {
      return;
    }

    const players = [
      this.createPlayer({ userId, username })
    ];
    
    // Let players load levels by name
    const level = this.levels[args];

    //TODO: Allow loading player maps

    return {
      success: true,
      reaction: '🏁',
      matchState: this.createMatch(players, level)
    };
  }

  createMatch(
    players,
    level = Object.values(this.levels)[0]
  ) {
    this.matchState = { level, players };
    return this.matchState;
  }

  createPlayer({ userId, username }) {
    return { userId, username };
  }

  handleMovePlayer({ username, userId, args }) {
    return {
      success: true,
    }
  }
}

export default RacingGame;
