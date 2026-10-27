// A phishing-awareness drill for the terminal. It renders the "URGENT!" email from Frank's case,
// lets the visitor click, report or delete it, and debriefs the red flags either way. Everything is
// simulated: no real link opens, no input is collected, nothing is sent. It's the same idea Frank
// teaches in the Send-PhishingEmail command, built as security training.

const wait = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const RED_FLAGS = [
  'The sender shows as samflynn@cabal.local, but the real return path is agi@yppilc.com. Spell yppilc backwards: it is a scramble of clippy. The attacker signed their own work.',
  'The whole mail skipped the internal relay every other message used, and arrived straight from 34.30.110.62.',
  'URGENT and "end of day" are there to rush you past the parts that do not add up.',
  'The button points at an outside site. Hover it and read the address before you ever click.'
];
const HOW_I_STOP = [
  'Links get rewritten and scanned before they open, so a bad one is caught on the click, not after.',
  'One Report button sends it to the security team and warns everyone else in one move.',
  'Even if the password is already gone, MFA and Conditional Access stand between it and the account.'
];

// print: async (html) => void, from the terminal. reduced: skip the typing pauses.
export async function runPhishDrill(print, reduced = false) {
  const pause = reduced ? () => Promise.resolve() : wait;
  await print('<span class="dim">Delivering a message to your inbox. This is a drill. Nothing here is real.</span>');
  await pause(500);

  const card = await print(`<div class="phish" role="group" aria-label="Simulated phishing email, part of a training drill">
    <div class="ph-head"><span class="ph-av">SF</span><div><b>Sam Flynn</b> <span class="ph-from">&lt;samflynn@cabal.local&gt;</span><br><span class="ph-to">To: you · Today, 14:36</span></div></div>
    <div class="ph-subj">URGENT!</div>
    <div class="ph-body">Hi,<br><br>Please review the attached document before end of day. It is time sensitive.<br><br><button class="ph-cta" data-act="click" type="button">Download the document</button><br><br>Password: SaveItRightMeow!<br><br>Thanks,<br>Sam</div>
    <div class="ph-actions"><button data-act="report" type="button">Report phishing</button><button data-act="delete" type="button">Delete</button></div>
    <div class="ph-url" aria-hidden="true">http://yppilc.com/redactedforsecurity.zip</div>
  </div>`);
  await print('<span class="dim">Your call: open it, report it or delete it.</span>');

  const mail = card.querySelector('.phish'), cta = card.querySelector('.ph-cta'), url = card.querySelector('.ph-url');
  const show = () => url.classList.add('show'), hide = () => url.classList.remove('show');
  ['mouseenter', 'focus'].forEach(e => cta.addEventListener(e, show));
  ['mouseleave', 'blur'].forEach(e => cta.addEventListener(e, hide));

  return new Promise(resolve => {
    let done = false;
    mail.addEventListener('click', async e => {
      const act = e.target.closest('[data-act]'); if (!act || done) return;
      done = true; mail.classList.add('done');
      const a = act.dataset.act;
      mail.dataset.stamp = { click: 'SIMULATION', report: 'REPORTED', delete: 'DELETED' }[a];
      mail.style.setProperty('--stamp', { click: '#ff5a47', report: '#3ddc97', delete: '#ffb020' }[a]);
      const flags = RED_FLAGS.map((f, i) => `  ${i + 1}. ${esc(f)}`);
      if (a === 'click') {
        await print('<span class="bad">You clicked it.</span> On a real one the next page is a fake sign-in that takes your password. This was a drill, so nothing happened.');
        await print('<span class="hd">What the email was telling you</span>');
      } else if (a === 'report') {
        await print('<span class="good">Good catch.</span> Reported to the security team, which also warns the people who got the same mail.');
        await print('<span class="hd">What gave it away</span>');
      } else {
        await print('<span class="warn">Deleted.</span> Safe for you. Reporting it would have covered everyone else too.');
        await print('<span class="hd">What gave it away</span>');
      }
      for (const f of flags) { await print(f); await pause(120); }
      await print('<span class="hd">How this gets stopped for real</span>');
      for (const l of HOW_I_STOP) { await print('  • ' + esc(l)); await pause(120); }
      await print('');
      resolve(a);
    });
  });
}
