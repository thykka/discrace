import test from 'ava';
import { rnd } from '../modules/utils.js';

const SAMPLE_CONFIG = {
  length: Math.pow(128, 3)
}

test('`rnd()` Returns values 0<n<1', t => {
  const samples = Array.from(SAMPLE_CONFIG, () => rnd());

  t.assert(
    samples.every(n => typeof n === 'number' && !isNaN(n)),
    'All samples are valid numbers'
  );
  
  t.assert(
    samples.every(n => n > 0 && n < 1),
    'No out of range samples'
  );
});

test('`rnd()` Returns values 0<n<X', t => {
  const X = 8;
  const samples = Array.from(SAMPLE_CONFIG, () => rnd(X));
  t.assert(
    samples.every(n => n > 0 && n < X),
    'No out of range samples'
  );
  const X2 = 0;
  const samples2 = Array.from(SAMPLE_CONFIG, () => rnd(X2));
  t.assert(
    samples2.every(n => n === 0),
    'Everything is zero when X is'
  );
});

test('`rnd()` Returns values Y<n<X', t => {
  const X = 5;
  const Y = -5;
  const samples = Array.from(SAMPLE_CONFIG, () => rnd(X, Y));
  t.assert(
    samples.every(n => Y < n && n < X),
    'Limited by both X and Y arguments'
  );
  const X2 = -1;
  const Y2 = -2;
  const samples2 = Array.from(SAMPLE_CONFIG, () => rnd(X2, Y2));
  t.assert(
    samples2.every(n => Y2 < n && n < X2),
    'Works when both args are negative'
  );
});

test('`rnd()` Argument order doesn\'t matter', t => {
  const X = 100;
  const Y = 50;
  const samples = Array.from(SAMPLE_CONFIG, () => rnd(Y, X));
  t.assert(
    samples.every(n => Y < n && n < X),
    'Can pass the smaller argument first'
  );
});
