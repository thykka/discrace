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
        'movePlayer': this.handleMovePlayer,
        'showGame': this.handleShowGame
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

  handleShowGame({ args, user }) {
    if(!this.matchState) {
      return {
        success: false,
        reaction: '⁉'
      };
    }
    const currentPlayer = this.getCurrentPlayer();
    return {
      success: true,
      messageText: `It's <@${currentPlayer.id}>'s turn to !move`,
      matchState: this.matchState
    }
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
        this.createPlayer(user, this.matchState.players.length, this.matchState.level)
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
    let level = Object.values(this.levels)[0]; // use default
    let loadError = false;

    const foundPresetLevel = this.levels[args];
    if(foundPresetLevel) {
      level = foundPresetLevel;
    } else if(args.length) {
      try {
        const customMap = this.readMap({ mapString: args });
        if(customMap.error) {
          loadError = level.error;
        } else {
          level = customMap;
        }
      } catch(e) {
        loadError = e.message;
      }
    }

    this.matchState = this.createMatch(user, level);
    this.assignSpawns();

    return {
      success: true, reaction: '🏁',
      messageText: `${ user.name } started a new race! Type \`!race\` to join. ${
        loadError ? `(Failed to load map: ${ loadError })` : ''
      }`,
      matchState: this.matchState
    };
  }

  createMatch(user, level) {
    const players = [
      this.createPlayer(user, 0, level)
    ];
    const matchState = { level, players, turn: 0, won: false };
    return matchState;
  }

  createPlayer(user, index = 0, level) {
    const passedCheckpoints = Object.fromEntries(
      level
        .filter(cell => cell.checkpoint)
        .map(cell => ([cell.checkpointNumber, false]))
    );
    return {
      index,
      passedCheckpoints,
      ...user,
      color: PlayerColors[index % PlayerColors.length] || '#F0F',
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
      // TODO: should not hit walls along the path
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

    // Did player cross the finish line?
    // TODO: player must have passed all checkpoints first
    const finishTiles = state.level.filter(cell => cell.spawn);
    const player = this.getCurrentPlayer(state);
    const minX = Math.min(player.x, player.x - player.dx);
    const maxX = Math.max(player.x, player.x - player.dx);
    const minY = Math.min(player.y, player.y - player.dy);
    const maxY = Math.max(player.y, player.y - player.dy);
    const passedCells = state.level.filter(cell => (
      // this is not right, needs bresenham?
      cell.x >= minX && cell.x <= maxX &&
      cell.y >= minY && cell.y <= maxY
    ));
    // const hitCollideCells = passedCells.filter(cell => cell.collide);
    const hitCheckpointCells = passedCells.filter(cell => cell.checkpoint);
    hitCheckpointCells.forEach(cell => {
      player.passedCheckpoints[cell.checkpointNumber] = true;
    });
    const allCheckpointsVisited = Object.values(player.passedCheckpoints).every(checkpoint => checkpoint);
    if(allCheckpointsVisited) {
      const hitSpawnCells = passedCells.filter(cell => cell.spawn);
      if(hitSpawnCells.length) {
        this.matchState.won = true;
        setImmediate(() => delete this.matchState);
        return {
          success: true,
          messageText: ' won the game!',
          mention: player.id,
          matchState: this.matchState
        };
      }
    }

    // Have all players crashed?
    const activePlayers = state.players.filter(({ dead }) => !dead);
    if(activePlayers.length === 0) {
      setImmediate(() => delete this.matchState);
      return {
        success: true,
        reaction: '☠',
        messageText: 'Everyone crashed, game over.',
        matchState: this.matchState
      };
    }
    const sortedActive = rotateArray(
      activePlayers,
      ({ index }) => index === state.turn
    );
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
