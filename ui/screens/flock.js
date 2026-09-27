// Flock: the full-page feed opened from the phone on the CEO desk (owner 2026-09-26: "an actual twitter copy that covers
// the entire page"; mockup docs/design/mockups/K2-feed-fullpage.html). Owner pick B + C for controls with no job: likes,
// bookmarks, follows and the tabs work for show; every other control answers with a one-line joke from comms.
import { el } from '../components/eventBits.js';
import { openWarnings, queueLookInto } from '../logic/events.js';
import { money } from '../logic/format.js';
import { PEOPLE } from '../../sim/data/feedPeople.js';
import { ERAS } from '../../sim/data/eras.js';
import { labText } from '../../sim/feedLive.js';

const THEMES = ['light', 'dim', 'dark'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const AVATARS = 8;

const JOKES = {
  post: ["Jules: 'The CEO does not post. The CEO is posted about.'", "Jules: 'Every draft you write, legal reads first. Please don't.'"],
  reply: ["Jules: 'Replying is how we end up in the news. Let it go.'", "Jules: 'If you reply to them, they win. That's the whole game.'"],
  rt: ["Jules: 'A repost counts as a statement. We don't have a statement.'"],
  views: ['These view counts come from Flock. Nobody knows how Flock counts.'],
  share: ["Jules: 'Please don't forward that to the board.'"],
  dots: ['Mute, block, report: comms handles all three. They have a spreadsheet.'],
  msg: ["Comms reads your messages. There are 3,412 unread. Most say 'quick question'."],
  explore: ["Margot: 'Explore is where afternoons go to die.'"],
  search: ["Margot: 'Stop searching your own name. It is not a metric.'"],
  lists: ["Your lists: 'Critics', 'Critics (2)', 'Do not reply'."],
  profile: ["Your profile is run by comms. Last post: 'We're hiring!'"],
  trend: ["Jules: 'You're not reading the trends. The trends are reading you.'"],
  me: ['You are signed in as the lab. Comms has the password. Comms will keep the password.'],
  side: ["Jules: 'There is always more. That's the problem.'"],
  settings: ['Settings are managed by comms. Comms has settings about settings.'],
  open: ["Jules: 'Reading the replies is how burnout starts.'"],
};

const hash = (text) => [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
const keyOf = (post) => `${post.day ?? post.turn}|${post.handle}|${post.text}`;
const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function person(handle) {
  const known = PEOPLE[handle];
  if (known) return known;
  const words = handle.replace('@', '').split('_').filter(Boolean);
  const name = words.length && words[0] === 'your'
    ? `Your ${words.slice(1).join(' ')} team`
    : words.map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
  return { name, reach: 2, news: true };
}

const initials = (name) => name.replace(/^(Dr|Prof|Col|Pastor|Senator|Mayor)\.?\s+(\(ret\.\)\s+)?/, '').split(/\s+/)
  .filter((w) => /^[A-Za-zÀ-ÿ]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

function compact(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '')}K`;
  return `${n}`;
}

// Made-up but steady engagement: bigger accounts get bigger numbers.
function counts(post, who) {
  const h = hash(keyOf(post));
  const base = [0, 700, 12000, 700000][who.reach ?? 1] * (1 + (h % 40));
  const views = Math.round(base);
  const likes = Math.round(views * (0.006 + ((h >>> 6) % 30) / 1000));
  return { views, likes, reposts: Math.round(likes * (0.08 + ((h >>> 11) % 20) / 100)), replies: Math.round(likes * (0.03 + ((h >>> 16) % 10) / 100)) };
}

function storyDay(day) {
  const y = Math.floor(day / 365) + 1;
  let rest = day - (y - 1) * 365;
  let m = 0;
  while (rest >= MONTH_DAYS[m]) { rest -= MONTH_DAYS[m]; m += 1; }
  return { y, m, d: rest + 1 };
}

function when(post, today) {
  if (post.day == null) return '';
  const ago = today - post.day;
  if (ago <= 0) return 'today';
  if (ago < 7) return `${ago}d`;
  const then = storyDay(post.day);
  const now = storyDay(today);
  return `${MONTHS[then.m]} ${then.d}${then.y === now.y ? '' : `, Y${then.y}`}`;
}

const ICON = {
  home: '<path d="M3 10.2 12 3l9 7.2V21h-6.2v-6.4H9.2V21H3z"/>',
  search: '<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
  bell: '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.8 1.8H4.2z"/><path d="M9.8 20.5a2.3 2.3 0 0 0 4.4 0"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  book: '<path d="M6 3.5h12v17.5l-6-4.2-6 4.2z"/>',
  user: '<circle cx="12" cy="8" r="4.2"/><path d="M4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5"/>',
  list: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  more: '<circle cx="12" cy="12" r="9"/><circle cx="7.5" cy="12" r=".7" fill="currentColor"/><circle cx="12" cy="12" r=".7" fill="currentColor"/><circle cx="16.5" cy="12" r=".7" fill="currentColor"/>',
  dots: '<circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  reply: '<path d="M9 5h6a6.5 6.5 0 0 1 0 13h-1.5L9 21v-3.2A6.5 6.5 0 0 1 9 5z"/>',
  rt: '<path d="m4.5 7.5 3-3 3 3M7.5 4.5V15a3 3 0 0 0 3 3H14M19.5 16.5l-3 3-3-3M16.5 19.5V9a3 3 0 0 0-3-3H10"/>',
  like: '<path d="M12 20.3s-7.8-4.6-9-10A4.7 4.7 0 0 1 12 7.6a4.7 4.7 0 0 1 9 2.7c-1.2 5.4-9 10-9 10z"/>',
  views: '<path d="M5 20v-8M10 20V5M15 20v-6M20 20V9"/>',
  share: '<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8M4.5 14v6.5h15V14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  brush: '<path d="M14.5 4.5 19.5 9.5 11 18l-5-5z"/><path d="M6 13c-2 0-3 1.5-3 3.5V20h3.5c2 0 3.5-1 3.5-3"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
};
const icon = (name, cls = '') => `<svg class="fk-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;
const LOGO = '<svg class="fk-logo" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M1.5 12.5C6 6.5 12.5 7 16 14.5 19.5 7 26 6.5 30.5 12.5 25.5 10.5 20 12.5 16 20.5 12 12.5 6.5 10.5 1.5 12.5Z"/></svg>';
let rosette = '';
for (let i = 0; i <= 120; i += 1) {
  const t = (i / 120) * 2 * Math.PI;
  const r = 10.2 + 1.25 * Math.cos(12 * t);
  rosette += `${i ? 'L' : 'M'}${(12 + r * Math.sin(t)).toFixed(2)},${(12 - r * Math.cos(t)).toFixed(2)}`;
}
const badgeSvg = (kind) => kind
  ? `<svg class="fk-chk ${kind}" viewBox="0 0 24 24" aria-label="${kind === 'gov' ? 'Government account' : kind === 'org' ? 'Verified organisation' : 'Verified'}"><path d="${rosette}Z" fill="currentColor"/><path d="m8 12.3 2.8 2.8 5.4-5.8" fill="none" stroke="var(--fk-on-accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  : '';

function readTheme() {
  try {
    const saved = localStorage.getItem('flock-theme');
    if (THEMES.includes(saved)) return saved;
  } catch { /* storage may be blocked */ }
  return matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// UI-only memory for the session: what the player liked, saved and follows, and what they have already seen.
const memory = {
  liked: new Set(),
  saved: new Set(),
  following: new Set(Object.entries(PEOPLE).filter(([, p]) => p.reach === 3).slice(0, 12).map(([h]) => h)),
  seen: new Set(),
  expanded: new Set(),
  joke: {},
};

export function openFlock(game, { overlay, events, onClose }) {
  const state = game.state;
  const today = state.day ?? 0;
  const lab = state.labName || 'Your lab';
  const labHandle = `@${lab.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'your_lab'}`;
  let theme = readTheme();
  let tab = 'home';
  let feedTab = 'forYou';

  const root = el(`<section class="dialog-layer dialog-open flock" role="dialog" aria-modal="true" aria-label="Flock" data-fk-theme="${theme}"></section>`);
  const toast = el('<div class="fk-toast" role="status" aria-live="polite"></div>');
  let toastTimer = 0;
  const say = (text) => {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  };
  const joke = (kind) => {
    const lines = JOKES[kind] ?? JOKES.open;
    memory.joke[kind] = ((memory.joke[kind] ?? -1) + 1) % lines.length;
    say(lines[memory.joke[kind]]);
  };

  const posts = () => [...(game.state.feed ?? [])].reverse();
  const unseen = posts().filter((p) => !memory.seen.has(keyOf(p)));
  const waiting = () => events.waiting();
  const warnings = () => openWarnings(game.state, game.queue.addressWarnings ?? []);
  const notifCount = () => waiting().length + warnings().length;

  function postNode(post, { parent = false } = {}) {
    const who = person(post.handle);
    const c = counts(post, who);
    const k = keyOf(post);
    const liked = memory.liked.has(k);
    const saved = memory.saved.has(k);
    const tone = hash(post.handle) % AVATARS;
    const node = el(`<article class="fk-post${parent ? ' parent' : ''}">
      <div class="fk-gut"><div class="fk-av ${who.news || who.badge === 'org' ? 'sq' : ''}" style="background:var(--fk-av${tone})">${esc(initials(who.name))}</div>${parent ? '<div class="fk-line"></div>' : ''}</div>
      <div class="fk-body">
        <div class="fk-who"><span class="fk-nm">${esc(who.name)}</span>${badgeSvg(who.badge)}<span class="fk-hd">${esc(post.handle)}</span>${post.day != null ? `<span class="fk-sep">·</span><span class="fk-t">${esc(when(post, today))}</span>` : ''}<button type="button" class="fk-mo" data-joke="dots" aria-label="More">${icon('dots')}</button></div>
        ${post.replyTo ? `<div class="fk-rep">Replying to <span class="fk-link">${esc(post.replyTo)}</span></div>` : ''}
        <div class="fk-txt"></div>
        <div class="fk-acts">
          <button type="button" class="fk-act" data-joke="reply" aria-label="Reply">${icon('reply')}<span>${compact(c.replies)}</span></button>
          <button type="button" class="fk-act rt" data-joke="rt" aria-label="Repost">${icon('rt')}<span>${compact(c.reposts)}</span></button>
          <button type="button" class="fk-act like${liked ? ' on' : ''}" data-live="like" aria-pressed="${liked}" aria-label="Like">${icon('like')}<span>${compact(c.likes + (liked ? 1 : 0))}</span></button>
          <button type="button" class="fk-act" data-joke="views" aria-label="Views">${icon('views')}<span>${compact(c.views)}</span></button>
          <span class="fk-sv"><button type="button" class="fk-act${saved ? ' saved' : ''}" data-live="save" aria-pressed="${saved}" aria-label="Bookmark">${icon('book')}</button><button type="button" class="fk-act" data-joke="share" aria-label="Share">${icon('share')}</button></span>
        </div>
      </div></article>`);
    const body = node.querySelector('.fk-txt');
    body.textContent = labText(post.text, game.state.labName);
    if (body.textContent.length > 280 && !memory.expanded.has(k)) { // long posts open cut short, as on the real site
      body.classList.add('clamp');
      body.after(el('<button type="button" class="fk-showmore" data-live="more">Show more</button>'));
    }
    node.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return joke('open');
      if (button.dataset.joke) return joke(button.dataset.joke);
      if (button.dataset.live === 'more') {
        memory.expanded.add(k);
        node.replaceWith(postNode(post, { parent }));
      } else if (button.dataset.live === 'like') {
        if (liked) memory.liked.delete(k); else memory.liked.add(k);
        node.replaceWith(postNode(post, { parent }));
      } else if (button.dataset.live === 'save') {
        if (saved) memory.saved.delete(k); else memory.saved.add(k);
        say(saved ? 'Removed from your Bookmarks' : 'Added to your Bookmarks');
        node.replaceWith(postNode(post, { parent }));
      }
    });
    return node;
  }

  function timeline(main) {
    const list = feedTab === 'following' ? posts().filter((p) => memory.following.has(p.handle)) : posts();
    const head = el(`<div class="fk-head"><div class="fk-tabs"><button type="button" class="fk-tab${feedTab === 'forYou' ? ' on' : ''}" data-tab="forYou">For you</button><button type="button" class="fk-tab${feedTab === 'following' ? ' on' : ''}" data-tab="following">Following</button></div></div>`);
    head.addEventListener('click', (event) => {
      const button = event.target.closest('[data-tab]');
      if (!button) return;
      feedTab = button.dataset.tab;
      draw();
    });
    main.append(head);
    const compose = el(`<div class="fk-compose" role="button" tabindex="0"><div class="fk-av sq" style="background:var(--fk-av3)">${esc(initials(lab))}</div><div class="fk-ph">What is happening?!</div><span class="fk-go">Post</span></div>`);
    compose.addEventListener('click', () => joke('post'));
    compose.addEventListener('keydown', (event) => { if (event.key === 'Enter') joke('post'); });
    main.append(compose);
    if (!list.length) {
      main.append(el(`<div class="fk-empty"><b>${feedTab === 'following' ? 'Nothing from the accounts you follow yet' : 'Nothing here yet'}</b><span>${feedTab === 'following' ? 'Follow people from the right-hand column, or check For you.' : 'Posts arrive as things happen in your run.'}</span></div>`));
      return;
    }
    const fresh = feedTab === 'forYou' ? unseen.length : 0;
    const all = posts();
    const shown = new Set();
    list.forEach((post, index) => {
      if (fresh && index === fresh) main.append(el('<div class="fk-divider">Posts you have already seen</div>'));
      if (shown.has(keyOf(post))) return; // already shown inside a thread
      // A reply shows the conversation above it, oldest first, joined by a thread line, as on the real site.
      const chain = [];
      for (let at = post; at?.replyTo && chain.length < 6;) {
        at = all.find((p) => p.handle === at.replyTo && p.text === at.replyToText);
        if (at && !shown.has(keyOf(at))) chain.unshift(at);
      }
      for (const earlier of chain) {
        main.append(postNode(earlier, { parent: true }));
        shown.add(keyOf(earlier));
      }
      main.append(postNode(post));
      shown.add(keyOf(post));
    });
  }

  function notifications(main) {
    main.append(el('<div class="fk-head"><div class="fk-title">Notifications</div></div>'));
    const cards = waiting();
    const warned = warnings();
    for (const card of cards) {
      const row = el('<div class="fk-note"><div class="fk-note-ic">!</div><div class="fk-note-body"><b></b><span></span></div><button type="button" class="fk-btn">Open</button></div>');
      row.querySelector('b').textContent = card.title;
      row.querySelector('span').textContent = card.due ?? 'Waiting for your answer';
      row.querySelector('button').addEventListener('click', () => {
        close();
        events.openCard(card.id);
      });
      main.append(row);
    }
    for (const warning of warned) {
      const row = el('<div class="fk-note warn"><div class="fk-note-ic">?</div><div class="fk-note-body"><b></b><span></span></div><button type="button" class="fk-btn ghost"></button></div>');
      row.querySelector('b').textContent = `${person(warning.handle).name} ${warning.handle}`;
      row.querySelector('span').textContent = warning.response.explanation;
      const act = row.querySelector('button');
      act.textContent = `${warning.response.label} (${money(warning.response.cost)})`;
      act.disabled = game.state.cash < warning.response.cost;
      if (act.disabled) act.title = 'Not enough cash for this response';
      act.addEventListener('click', () => {
        queueLookInto(game, warning.id);
        overlay.dispatchEvent(new CustomEvent('events-changed'));
        draw();
      });
      main.append(row);
    }
    const mentions = posts().filter((p) => p.text.includes('{lab}') || (state.labName && p.text.includes(state.labName)));
    if (mentions.length) {
      main.append(el('<div class="fk-sub">Mentions of your lab</div>'));
      for (const post of mentions.slice(0, 40)) main.append(postNode(post));
    }
    if (!cards.length && !warned.length && !mentions.length) {
      main.append(el('<div class="fk-empty"><b>Nothing to see here yet</b><span>Cards that need your answer and early warnings show up here.</span></div>'));
    }
  }

  function trends() {
    const recent = posts().slice(0, 120);
    const rows = [];
    const newest = [...game.state.models].reverse().find((m) => m.activated);
    if (newest) rows.push({ k: 'Technology · Trending', v: newest.name });
    for (const rival of game.state.rivals) {
      const n = recent.filter((p) => p.text.toLowerCase().includes(rival.name.toLowerCase())).length;
      if (n) rows.push({ k: 'Business · Trending', v: rival.name, n });
    }
    const card = waiting()[0];
    if (card) rows.push({ k: 'Trending', v: card.title });
    rows.push({ k: 'Trending in Technology', v: ERAS[game.state.era - 1].name });
    return rows.slice(0, 5).map((row) => ({ ...row, count: `${compact(1200 + (hash(row.v) % 90) * 700 + (row.n ?? 0) * 900)} posts` }));
  }

  function side() {
    const aside = el('<aside class="fk-side"></aside>');
    aside.append(el(`<button type="button" class="fk-search" data-joke="search">${icon('search')}Search</button>`));
    const box = el("<div class=\"fk-box\"><h3>What's happening</h3></div>");
    for (const t of trends()) {
      const row = el(`<button type="button" class="fk-trend" data-joke="trend"><span class="k">${esc(t.k)}</span><span class="v">${esc(t.v)}</span><span class="n">${esc(t.count)}</span></button>`);
      box.append(row);
    }
    box.append(el('<button type="button" class="fk-more" data-joke="side">Show more</button>'));
    aside.append(box);
    const suggest = Object.entries(PEOPLE).filter(([h, p]) => p.reach >= 2 && !memory.following.has(h))
      .sort(([a], [b]) => (hash(a) + today) % 97 - (hash(b) + today) % 97).slice(0, 3);
    const follow = el('<div class="fk-box"><h3>Who to follow</h3></div>');
    for (const [handle, p] of suggest) {
      const row = el(`<div class="fk-follow"><div class="fk-av" style="background:var(--fk-av${hash(handle) % AVATARS})">${esc(initials(p.name))}</div><div class="t"><div class="nm">${esc(p.name)}${badgeSvg(p.badge)}</div><div class="hd">${esc(handle)}</div></div><button type="button" class="fk-fb">Follow</button></div>`);
      const button = row.querySelector('.fk-fb');
      button.addEventListener('click', () => {
        const on = !memory.following.has(handle);
        if (on) memory.following.add(handle); else memory.following.delete(handle);
        button.classList.toggle('on', on);
        button.textContent = on ? 'Following' : 'Follow';
        if (feedTab === 'following') draw();
      });
      follow.append(row);
    }
    follow.append(el('<button type="button" class="fk-more" data-joke="side">Show more</button>'));
    aside.append(follow);
    aside.append(el('<div class="fk-foot"><span>Terms of Service</span><span>Privacy Policy</span><span>Cookie Policy</span><span>Accessibility</span><span>© Flock Corp.</span></div>'));
    aside.addEventListener('click', (event) => {
      const button = event.target.closest('[data-joke]');
      if (button) joke(button.dataset.joke);
    });
    return aside;
  }

  function nav() {
    const n = notifCount();
    const item = (id, name, label, extra = '') => `<button type="button" class="fk-nav${tab === id ? ' on' : ''}" data-nav="${id}">${icon(name, tab === id ? 'fill' : '')}${extra}<span>${label}</span></button>`;
    const node = el(`<nav class="fk-navcol">
      <div class="fk-brand" title="Flock">${LOGO}</div>
      ${item('home', 'home', 'Home')}
      ${item('explore', 'search', 'Explore')}
      ${item('notifications', 'bell', 'Notifications', n ? `<span class="fk-dot">${n}</span>` : '')}
      ${item('msg', 'mail', 'Messages')}
      ${item('lists', 'list', 'Lists')}
      ${item('bookmarks', 'book', 'Bookmarks')}
      ${item('profile', 'user', 'Profile')}
      <div class="fk-morewrap">${item('more', 'more', 'More')}
        <div class="fk-pop" hidden><button type="button" data-pop="display">${icon('brush')}Display</button><button type="button" data-pop="settings">${icon('gear')}Settings and privacy</button></div></div>
      <button type="button" class="fk-postbtn">Post</button>
      <button type="button" class="fk-me"><div class="fk-av sq" style="background:var(--fk-av3)">${esc(initials(lab))}</div><div><div class="nm">${esc(lab)}</div><div class="hd">${esc(labHandle)}</div></div>${icon('dots')}</button>
    </nav>`);
    const pop = node.querySelector('.fk-pop');
    node.addEventListener('click', (event) => {
      const popItem = event.target.closest('[data-pop]');
      if (popItem) {
        pop.hidden = true;
        if (popItem.dataset.pop === 'display') openDisplay(); else joke('settings');
        return;
      }
      const button = event.target.closest('button');
      if (!button) return;
      if (button.classList.contains('fk-postbtn')) return joke('post');
      if (button.classList.contains('fk-me')) return joke('me');
      const id = button.dataset.nav;
      if (id === 'more') { pop.hidden = !pop.hidden; return; }
      if (id === 'home' || id === 'notifications' || id === 'bookmarks') { tab = id; draw(); return; }
      joke({ explore: 'explore', msg: 'msg', lists: 'lists', profile: 'profile' }[id]);
    });
    return node;
  }

  function bookmarks(main) {
    main.append(el('<div class="fk-head"><div class="fk-title">Bookmarks</div></div>'));
    const list = posts().filter((p) => memory.saved.has(keyOf(p)));
    if (!list.length) main.append(el('<div class="fk-empty"><b>Save posts for later</b><span>Bookmark a post and it shows up here.</span></div>'));
    for (const post of list) main.append(postNode(post));
  }

  let displayLayer = null;
  function openDisplay() {
    displayLayer?.remove();
    displayLayer = el(`<div class="fk-modal"><div class="fk-dlg" role="dialog" aria-modal="true" aria-labelledby="fk-dtitle">
      <h2 id="fk-dtitle">Customize your view</h2><p>These settings change how Flock looks in this game.</p>
      <div class="fk-sample"><div class="fk-av sq" style="background:var(--fk-text);color:var(--fk-bg)">${LOGO}</div><div><div class="fk-who"><span class="fk-nm">Flock</span>${badgeSvg('org')}<span class="fk-hd">@flock</span></div><div class="fk-txt">At the heart of Flock are short posts. Words starting with @ are mentions, like <span class="fk-link">${esc(labHandle)}</span>.</div></div></div>
      <h4>Background</h4>
      <div class="fk-bgs">${THEMES.map((t) => `<label class="b-${t}"><input type="radio" name="fk-bg" value="${t}"${t === theme ? ' checked' : ''}>${{ light: 'Default', dim: 'Dim', dark: 'Lights out' }[t]}</label>`).join('')}</div>
      <button type="button" class="fk-done">Done</button></div></div>`);
    displayLayer.addEventListener('change', (event) => {
      theme = event.target.value;
      root.dataset.fkTheme = theme;
      try { localStorage.setItem('flock-theme', theme); } catch { /* storage may be blocked */ }
    });
    displayLayer.addEventListener('click', (event) => {
      if (event.target === displayLayer || event.target.closest('.fk-done')) {
        displayLayer.remove();
        displayLayer = null;
      }
    });
    root.append(displayLayer);
    displayLayer.querySelector('input:checked')?.focus();
  }

  let mainScroll = 0;
  let drawnView = null;
  function draw() {
    const oldMain = root.querySelector('.fk-main');
    const view = `${tab}/${feedTab}`; // a new tab opens at its top; a redraw of the same one keeps its place
    mainScroll = oldMain && view === drawnView ? oldMain.scrollTop : 0;
    drawnView = view;
    root.replaceChildren();
    const page = el('<div class="fk-page"></div>');
    const main = el('<main class="fk-main"></main>');
    if (tab === 'notifications') notifications(main);
    else if (tab === 'bookmarks') bookmarks(main);
    else timeline(main);
    page.append(nav(), main, side());
    root.append(page, el(`<button type="button" class="fk-close" aria-label="Back to the office (Esc)"><span>${icon('x')}</span>Esc</button>`), toast);
    root.querySelector('.fk-close').addEventListener('click', close);
    main.scrollTop = mainScroll;
  }

  function close() {
    for (const post of game.state.feed ?? []) memory.seen.add(keyOf(post));
    document.removeEventListener('keydown', onKey, true);
    root.remove();
    onClose?.();
    overlay.dispatchEvent(new CustomEvent('gdt-dialog-closed')); // work that waited for the dialog layer can go on
  }

  // Esc works wherever focus is; Tab stays inside Flock (and inside the Display window while it is open).
  function onKey(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (displayLayer) {
        displayLayer.remove();
        displayLayer = null;
        root.querySelector('.fk-nav.on')?.focus();
      } else close();
      return;
    }
    if (event.key !== 'Tab') return;
    const scope = displayLayer ?? root;
    const focusable = [...scope.querySelectorAll('button, input, [tabindex="0"]')].filter((node) => !node.closest('[hidden]'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!scope.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  document.addEventListener('keydown', onKey, true);

  draw();
  overlay.append(root);
  root.querySelector('.fk-nav.on')?.focus();
  return { close, redraw: draw, node: root };
}

export const unseenCount = (state) => (state.feed ?? []).filter((post) => !memory.seen.has(keyOf(post))).length;
