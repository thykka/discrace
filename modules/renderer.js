import { createWriteStream } from 'fs';
import Canvas from 'canvas'

class Renderer {
  constructor(options) {
    const defaults = {
      width: 420,
      height: 420,
      filename: '.discrace.png'
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
}

export default Renderer;
export { Renderer };