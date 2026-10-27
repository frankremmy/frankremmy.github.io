// What the laptop shows: the email from the case, its download, and at the end the visitor's own
// machine as an enrolled endpoint. Redraws only when what's on screen actually changes.

import { drawMail, drawAgent } from '../screens.js';
import { ss } from './util.js';

export default function screenChapter(world) {
  const { laptop, visitor } = world;
  const time = '14:36';
  let key = '';
  world.screenState = { hover: false };
  return {
    update(p) {
      const agent = p > 0.86;
      const click = Math.round(ss(0.13, 0.17, p) * 40) / 40;
      const k = Math.round(ss(0.865, 0.9, p) * 30) / 30;
      const next = agent ? `a${k}` : `m${click}${world.screenState.hover ? 'h' : ''}`;
      if (next === key) return;
      key = next;
      laptop.draw(ctx => agent ? drawAgent(ctx, visitor, k) : drawMail(ctx, { click, hover: world.screenState.hover, time }));
    }
  };
}
