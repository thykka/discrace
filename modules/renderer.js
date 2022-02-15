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
    const cellWidth = this.width / (1 + levelWidth);
    state.level.forEach((cell, index, cells) => {
      const x = cell.x * cellWidth;
      const y = cell.y * cellWidth;
      this.ctx.strokeRect(x, y, cellWidth, cellWidth);
      this.ctx.fillText(cell.char, x, y + cellWidth);
    });
  }
}

export default Renderer;
export { Renderer };