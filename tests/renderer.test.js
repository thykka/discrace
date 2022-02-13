import test from 'ava';
import Renderer from "../modules/renderer.js";
import { unlink } from 'fs/promises';

test('tests run normally', t => t.assert(true));

//*
test('It allows making a drawing context', async t => {
  const renderer = new Renderer();
  t.assert(typeof renderer.ctx.fillRect === 'function');
});
//*/
//*
test('It saves an image', async t => {
  const filename = 'test2.png';
  const renderer = new Renderer({
    width: 32,
    height: 48,
    filename
  });
  renderer.ctx.fillRect(
    renderer.width/2, 0,
    renderer.width/2, renderer.height
  );
  await renderer.save();
  await unlink('./'+filename);
  t.pass();
});

test('It updates the image', async t => {
  const filename = 'test3.png';
  const renderer = new Renderer({
    width: 320, height: 320, filename
  });
  for(let i = 1; i < 20; i++) {
    renderer.ctx.clearRect(0,0,renderer.width,renderer.height)
    renderer.ctx.fillStyle = `hsl(${ Math.floor(Math.random()*360) }, 50%, 50%)`;
    renderer.ctx.beginPath();
    renderer.ctx.arc(160,160,160-i,0,Math.PI*2);
    renderer.ctx.fill();
    await renderer.save();
  }
  await unlink('./'+filename);
  t.pass();
})
//*/