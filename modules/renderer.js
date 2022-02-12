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

  save() {
    const out = createWriteStream(this.filename);
    const stream = Canvas.createPNGStream();
    //stream.pipe(out);
    out.on('finish', () => {
      console.log('saved');
    })
  }
}

export default Renderer;
export { Renderer };