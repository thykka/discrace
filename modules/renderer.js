import { createWriteStream } from 'fs';
import Canvas from 'canvas'
import { rotateArray, rnd } from './utils.js';

Canvas.registerFont('assets/SpaceMono-Regular.ttf', { family: 'monospace' });

class Renderer {
  constructor(options) {
    const defaults = {
      width: 600,
      height: 600,
      filename: '.discrace.png',
      client: null,
    };
    Object.assign(this, defaults, options);
    this.canvas = Canvas.createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');
  }

  async save() {
    return await new Promise((resolve, reject) => {
      const out = createWriteStream(this.filename);
      //const stream = new Canvas.PNGStream(this.canvas);
      const stream = this.canvas.createPNGStream({
        compressionLevel: 9
      });
      stream.pipe(out);
      out.on('finish', () => {
        stream.destroy();
        resolve();
      });
      out.on('error', error => {
        reject(error);
      });
    });
  }

  _drawWall(x, y, w, cell) {
    const { ctx } = this;
    const step = 1/8;
    ctx.fillStyle = '#0003';
    ctx.fillRect(x, y, w, w);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2.25;

    const r = () => rnd(-step*w/2, step*w/2);

    for(let i = step; i < 1; i += step) {
      const lx = Math.max(0, i * 2 - 1) * w;
      const ly = Math.min(1, i * 2) * w;
      ctx.beginPath();
      ctx.moveTo(x + lx + r(), y + ly + r());
      ctx.lineTo(x + ly + r(), y + lx + r());
      ctx.stroke();
    }
    

    if(['<','>'].includes(cell.char)) {
      const glyph = cell.char === '<' ? '↩' : '↪';
      ctx.fillStyle = '#F82';
      ctx.fillText(glyph, x + w/4, y + w/4*3);
    }
  }

  _drawSpawn(x, y, w, cell) {
    const { ctx } = this;
    const gridWidth = Math.ceil(w / 4);
    ctx.fillStyle = 'hsla(0, 0%, 0%, 0.3)';
    //ctx.fillRect(x, y, w, w);
    for(let yo = 0; yo < w; yo += gridWidth * 2) {
      for(let xo = 0; xo < w; xo += gridWidth) {
        const ys = Math.round(xo/2) % gridWidth === 0 ? 0 : gridWidth;
        ctx.fillRect(x + xo, y + yo + ys, gridWidth, gridWidth);
      }
    }
  }

  _drawCheckpoint(x, y, w, cell) {
    const { ctx } = this;
    const gridWidth = Math.ceil(w / 4);
    ctx.fillStyle = `hsla(${ (cell.checkpointNumber * 137.5) % 360 }, 80%, 40%, 0.3)`;
    for(let yo = 0; yo < w; yo += gridWidth * 2) {
      for(let xo = 0; xo < w; xo += gridWidth) {
        const ys = Math.round(xo/2) % gridWidth === 0 ? 0 : gridWidth;
        ctx.fillRect(x + xo, y + yo + ys, gridWidth, gridWidth);
      }
    }
  }

  _drawRoad(x, y, w) {
  }

  _drawGrid(levelWidth, cellWidth) {
    const { ctx, width } = this;
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#111';
    for(let v = 0; v < levelWidth; v+=1) {
      const pos = v * cellWidth + cellWidth/2;
      ctx.beginPath();
      ctx.moveTo(0, pos)
      ctx.lineTo(width, pos);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, width);
      ctx.stroke();
    }
  }

  draw(state) {
    const { ctx } = this;
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, this.width, this.height);
    const levelWidth = state.level.reduce(
      (max, cell) => Math.max(max, cell.x),
      0
    );
    const cellWidth = this.width / (levelWidth);
    const halfWidth = cellWidth / 2;
    this._drawGrid(levelWidth, cellWidth);
    ctx.save();
    ctx.translate(-halfWidth, -halfWidth);
    ctx.font = `${Math.floor(cellWidth * 0.7)}px monospace`;

    state.level.forEach((cell, index) => {
      const x = cell.x * cellWidth;
      const y = cell.y * cellWidth;
      if(cell.collide) {
        this._drawWall(x, y, cellWidth, cell);
      } else if(cell.spawn) {
        this._drawSpawn(x, y, cellWidth, cell);
      } else if(cell.checkpoint) {
        this._drawCheckpoint(x, y, cellWidth, cell);
      } else {
        this._drawRoad(x, y, cellWidth, cell);
      }
    });

    rotateArray(
      state.players,
      (player, index) => index === state.turn
    ).forEach((player, playerIndex) => {
      ctx.fillStyle = player.color || '#F0F';
      ctx.strokeStyle = player.color || '#F0F';
      ctx.lineWidth = Math.max(1, halfWidth/6);

      // draw player path
      ctx.beginPath();
      player.path.forEach(([x, y], i) => {
        const px = x * cellWidth + halfWidth;
        const py = y * cellWidth + halfWidth;
        ctx[i===0 ? 'moveTo' : 'lineTo'](px, py);
      });
      ctx.stroke();
      player.path.forEach(([x, y]) => {
        const pmx = x * cellWidth + halfWidth;
        const pmy = y * cellWidth + halfWidth;
        ctx.beginPath();
        ctx.arc(pmx, pmy, halfWidth/3, 0, Math.PI*2);
        ctx.stroke();
      });

      // draw player marker
      const plx = player.x * cellWidth + halfWidth;
      const ply = player.y * cellWidth + halfWidth;
      ctx.beginPath();
      ctx.arc(plx, ply, halfWidth, 0, Math.PI*2);
      if(state.turn !== playerIndex || state.won) {
        // idle player
        ctx.stroke();
      } else {
        // current player
        ctx.fill();

        // draw move choices
        ctx.fillStyle = '#000';
        player.moves.forEach(move => {
          const mx = (player.x + player.dx + move.x) * cellWidth + cellWidth/4;
          const my = (player.y + player.dy + move.y) * cellWidth + cellWidth/6*5;
          ctx.fillText(`${ move.index + 1 }`, mx, my);
        }); 
      }

    });
    ctx.restore();
  }
}

export default Renderer;
export { Renderer };