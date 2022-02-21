import Tiles, { TileStart } from './game-tiles.js';
import Levels from './game-levels.js';
import PlayerColors from './player-colors.js';
import { rotateArray } from './utils.js';
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

  command(commandName, { user, prefix, args }) {
    const command = this.commands[commandName];
    if(typeof command !== 'function') return;
    return command.call(this, { prefix, user, args });
  }
  
  handleNewMatch({ args, user }) {
    // check if match is already running (on this channel?)
    if(this.matchState) {
      // check if player already joined
      const playerAlreadyJoined = this.matchState.players.some(
        player => player.id === user.id
      );
      if(playerAlreadyJoined) {
        return {
          success: false, reaction: '🚫',
          reply: `you've already joined`
        };
      }
      // check if existing players have already moved
      const playersHaveMoved = this.matchState.players.some(
        player => player.path.length > 1
      );
      if(playersHaveMoved) {
        return {
          success: false, reaction: '🚫',
          reply: `race already started`
        };
      }

      // add player to match
      this.matchState.players.push(
        this.createPlayer(user, this.matchState.players.length)
      );
      this.assignSpawns();
      return {
        success: true, reaction: '🏁',
        messageText: `${ user.name } joined the race!`,
        matchState: this.matchState
      };
    }
    
    //TODO: Allow loading player maps
    // Let players load levels by name
    const foundPresetLevel = this.levels[args];
    let level = foundPresetLevel;
    let loadError = false;
    try {
      if(!level && args.length) {
        level = this.readMap({ mapString: args });
        if(level.error) {
          level = Object.values(this.levels)[0];
          loadError = level.error;
        }
      }
    } catch(e) {
      level = Object.values(this.levels)[0]; // use default
      loadError = e.message;
    }

    this.matchState = this.createMatch(user, level);
    this.assignSpawns();

    return {
      success: true, reaction: '🏁',
      messageText: `${ user.name } started a new race! ${
        loadError ? `(Failed to load map: ${ loadError })` : ''
      }`,
      matchState: this.matchState
    };
  }

  createMatch(user, level) {
    const players = [
      this.createPlayer(user, 0)
    ];
    const matchState = { level, players, turn: 0 };
    return matchState;
  }

  createPlayer(user, index = 0) {
    return {
      ...user,
      color: PlayerColors[index % PlayerColors.length] || '#F0F',
      index,
      path: [],
      x: 0, y: 0,
      dx: 0, dy: 0
    };
  }

  assignSpawns(state = this.matchState) {
    const spawnCells = state.level.filter(cell => cell.spawn);
    if(!spawnCells.length) throw Error('No way hombre');
    state.players.forEach((player, index) => {
      const cell = spawnCells[index % spawnCells.length];
      player.x = cell.x;
      player.y = cell.y;
      player.path = [[cell.x, cell.y]];
      player.moves = this.getMoves(player);
    });
  }

  handleMovePlayer({ prefix, args, user }) {
    // ensure there is an existing match
    if(!this.matchState) {
      return {
        success: false,
        //reaction: '🛑',
        reply: 'no ongoing race'
      };
    }
    // ensure player has joined the match
    const playerIndex = this.matchState.players.findIndex(
      ({id}) => id === user.id
    );
    if(playerIndex < 0) {
      return {
        success: false,
        //reaction: '',
        reply: 'you have not joined this race'
      };
    }
    // player should only move on their own turn
    if(this.matchState.turn !== playerIndex) {
      return {
        success: false,
        //reaction: '',
        reply: 'it\'s not your turn yet'
      };
    }
    // if no moves available, the player loses
    // TODO: remove player, check if players remain, end match...
    const player = this.matchState.players[playerIndex];
    if(player.moves?.length === 0) {
      this.movePlayer({ x: 0, y: 0 });
      return {
        success: true,
        matchState: this.matchState,
        reaction: '☠'
      };
    }
    // prefix or arg should be a number
    let moveIndex = parseInt(prefix);
    if(isNaN(moveIndex)) moveIndex = parseInt(args);
    moveIndex -= 1;
    if(isNaN(moveIndex) || moveIndex < 0 || moveIndex > 8) {
      return {
        success: false,
        //reaction: '',
        reply: 'use !move 1-9 to move, example: `!move 6`'
      };
    }
    // arg should be within allowed moves
    const move = player.moves.find(move => move.index === moveIndex);
    if(!move) {
      return {
        success: false,
        //reaction: '',
        reply: 'allowed moves: ' + player.moves.map(
          ({index}) => index + 1
        ).join(', ')
      };
    }

    return this.movePlayer(move);
  }

  // return a list of cells the player may move into
  getMoves(player, level = this.matchState?.level) {
    const nextX = player.x + player.dx;
    const nextY = player.y + player.dy;
    return [
      { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
      { x: -1, y:  0 }, { x: 0, y:  0 }, { x: 1, y:  0 },
      { x: -1, y:  1 }, { x: 0, y:  1 }, { x: 1, y:  1 },
    ]
      // TODO: should not hit walls
      .map(
        (move, index) => {
          const cellIndex = level.findIndex(cell => (
            cell.x === nextX + move.x &&
            cell.y === nextY + move.y
          ))
          return { ...move, index, cellIndex };
        }
      ).filter(
        move => {
          const cell = level[move.cellIndex];
          const collides = typeof cell === 'undefined' || cell?.collide;
          return !collides;
        }
      );
  }

  getCurrentPlayer(matchState = this.matchState) {
    if(!matchState) return null;
    return matchState.players[matchState.turn];
  }

  movePlayer(
    move,
    player = this.getCurrentPlayer()
  ) {
    player.dx += move.x;
    player.dy += move.y;
    player.x += player.dx;
    player.y += player.dy;
    player.path.push([player.x, player.y]);

    return this.incrementTurn();
  }

  incrementTurn() {
    if(!this.matchState) {
      return {
        success: false,
        reply: 'No match running, weird...'
      };
    }
    const state = this.matchState;
    const activePlayers = state.players.filter(({ dead }) => !dead);
    if(activePlayers.length === 0) {
      setImmediate(() => delete this.matchState);
      return {
        success: true,
        messageText: 'Everyone crashed, game over.',
        matchState: this.matchState
      };
    }
    const sortedActive = rotateArray(
      activePlayers,
      ({ index }) => index === state.turn
    );
    console.log({ sortedActive });
    state.turn = sortedActive[sortedActive.length === 1 ? 0 : 1].index;

    // save next player's moves
    const nextPlayer = this.getCurrentPlayer();
    nextPlayer.moves = this.getMoves(nextPlayer);
    if(!nextPlayer.moves.length) {
      nextPlayer.dead = true;
      return this.movePlayer({ x: 0, y: 0 }, nextPlayer);
    }
    return {
      success: true,
      messageText: ', it\'s your turn',
      mention: nextPlayer.id,
      matchState: state
    };
  }

  loadLevels(maps) {
    return Object.fromEntries(
      Object.entries(maps)
        .map(([mapName, map]) => {
          const cells = this.readMap(map);
          return [mapName, cells];
        })
    );
  }

  readMap({ mapString }) {
    if(typeof mapString !== 'string' || mapString.length < 5) {
      return { error: 'Expected mapString, got ' + typeof mapString };
    }
    const rows = mapString.replaceAll('```','').trim().split('\n');
    const rowWidth = rows[0].length;
    if(rowWidth !== rows.length) {
      console.log(mapString, rowWidth, rows.length);
      return { error: 'Map is not square' };
    }
    return rows.flatMap((row, y) => {
      const chars = row.split('');
      if(chars.length !== rowWidth)
        throw Error(`Row ${y+1} is ${ chars.length } characters long, expected ${ rowWidth }`);
      return chars.map((char, x) => {
          const tile = Tiles[char];
          if(!tile) throw Error('Unknown tile character: ' + char);
          return { ...tile, x, y, char };
        });
    });
  }

}

export default RacingGame;
