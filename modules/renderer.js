import { createWriteStream } from 'fs';
import Canvas from 'canvas'

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
      const stream = new Canvas.PNGStream(this.canvas);
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
    ctx.fillStyle = '#111';
    ctx.fillRect(x, y, w, w);

    if(['<','>'].includes(cell.char)) {
      const glyph = cell.char === '<' ? '↩' : '↪';
      ctx.fillStyle = '#AAA';
      ctx.fillText(glyph, x + w/4, y + w/4*3);
    }
  }

  _drawRoad(x, y, w) {
  }

  _drawGrid(levelWidth, cellWidth) {
    const { ctx, width } = this;
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#111';
    for(let v = 0; v < levelWidth; v+=1) {
      const pos = v * cellWidth;
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
    ctx.font = `${Math.floor(cellWidth)}px monospace`;

    state.level.forEach((cell, index) => {
      const x = cell.x * cellWidth;
      const y = cell.y * cellWidth;
      if(cell.collide) {
        this._drawWall(x, y, cellWidth, cell);
      } else {
        this._drawRoad(x, y, cellWidth, cell);
      }
    });

    state.players.forEach((player, playerIndex) => {
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
      if(state.turn !== playerIndex) {
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