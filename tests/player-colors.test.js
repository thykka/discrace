import test from 'ava';

test('Creates a list of colors', async t => {
  const { PlayerColors } = await import('../modules/player-colors.js');
  console.table(PlayerColors);
  t.assert(
    Array.isArray(PlayerColors),
    'Imports an array'
  );
  t.assert(
    PlayerColors.length > 0,
    'There is at least one item'
  );
  t.assert(
    PlayerColors.every(color => typeof color === 'string'),
    'The items are strings'
  );
  // Rough color format test, doesn't pass html color keywords
  // explanation: https://regexr.com/6fjdl
  const colorFormatTest =
    /^(#[0-9a-f]{3,8}|((hsla?|rgba?)\s*\(\s*(\d*\.?\d*%?\s*,?\s*){3,4})\))/i;
  t.assert(
    PlayerColors.every(color => colorFormatTest.test(color))
  );
})