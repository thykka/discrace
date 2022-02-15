const TileAsphalt = Object.freeze({
  name: 'asphalt'
});
const TileWall = Object.freeze({
  name: 'wall',
  collide: true
});
const TileStart = Object.freeze({
  name: 'start',
  spawn: true
});
const TileCheckpoint = checkpointNumber => Object.freeze({
  name: 'checkpoint',
  checkpoint: true,
  checkpointNumber
});

const Tiles = {
  ' ': TileAsphalt,
  '#': TileWall,
  '0': TileStart,
  '1': TileStart,
  '2': TileStart,
  '3': TileStart,
  '4': TileStart,
  '5': TileStart,
  '6': TileStart,
  '7': TileStart,
  '8': TileStart,
  '9': TileStart,
  'A': TileCheckpoint(1),
  'B': TileCheckpoint(2),
  'C': TileCheckpoint(3),
  'D': TileCheckpoint(4),
  'E': TileCheckpoint(4),
  'F': TileCheckpoint(4),
  'G': TileCheckpoint(4),
  'H': TileCheckpoint(4),
};

export default Tiles;
export { Tiles, TileAsphalt, TileWall, TileStart, TileCheckpoint };