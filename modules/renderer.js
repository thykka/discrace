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
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.width, this.height);
    const levelWidth = state.level.reduce(
      (max, cell) => Math.max(max, cell.x),
      0
    );
    const cellWidth = this.width / (levelWidth);
    this.ctx.save();
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
    state.players.forEach(player => {
      const x = player.x * cellWidth + cellWidth/2;
      const y = player.y * cellWidth + cellWidth/2;
      this.ctx.fillStyle = player.color || '#F0F';
      this.ctx.beginPath();
      this.ctx.arc(x, y, cellWidth/2, 0, Math.PI*2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }
}

export default Renderer;
export { Renderer };