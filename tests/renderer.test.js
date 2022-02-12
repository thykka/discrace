import test from 'ava';
import Renderer from "../modules/renderer.js";
import { statSync, rmSync } from 'fs';

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
    height: 32,
    filename
  });
  renderer.ctx.fillRect(
    renderer.width/2, 0,
    renderer.width/2, renderer.height
  );
  renderer.save();
  t.pass()
});
//*/