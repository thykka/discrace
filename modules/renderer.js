import { createWriteStream } from 'fs';
import Canvas from 'canvas'

class Renderer {
  constructor(options) {
    const defaults = {
      width: 300,
      height: 300,
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

  draw(state) {
    const levelWidth = state.level.reduce(
      (max, cell) => Math.max(max, cell.x),
      0
    );
    const cellWidth = this.width / (levelWidth);
    this.ctx.translate(-cellWidth/2, -cellWidth/2);
    this.ctx.font = `${Math.floor(cellWidth)}px monospace`;

    state.level.forEach((cell, index) => {
      const x = cell.x * cellWidth;
      const y = cell.y * cellWidth;
      const rect = cell.collide ? 'fillRect' : 'strokeRect';
      this.ctx.fillStyle = '#222';
      this.ctx[rect](x, y, cellWidth, cellWidth);
      if(['<','>'].includes(cell.char)) {
        const glyph = cell.char === '<' ? '↩' : '↪';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(glyph, x+cellWidth/4, y + cellWidth/4*3);
      }
    });
    state.players.forEach((player) => {
      console.log({player});
      const x = player.x * cellWidth;
      const y = player.y * cellWidth;
      this.ctx.fillStyle = player.color || '#F0F';
      this.ctx.fillRect(x, y, cellWidth, cellWidth);
    });
  }
}

export default Renderer;
export { Renderer };