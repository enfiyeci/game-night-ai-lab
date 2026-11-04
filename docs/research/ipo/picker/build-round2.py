# Builds ipo-picker.html (round 2: the IPO as a full subsystem storyboard) from the screen list below.
# Run: python3 docs/research/ipo/picker/build-round2.py  (writes next to this file; images in img/r2/)
import html, pathlib

HERE = pathlib.Path(__file__).parent

# (id, title, when, era, opens, what, decide, ties, ref, variants)
# ref: (img, caption) or None; variants: [(value, img, label, tag, alt)] with the recommended one first.
SCREENS = [
    ('1', 'The road to the bell', 'Oct 2024 to listing', 'Eras 2–4',
     'A new IPO button beside Money, with a dot when something waits, and a chip under the board countdown.',
     'The hub. Every stage of the road with its date, the rival labs on the same road, investor mood, and the items from your own record that the SEC, investors and short sellers will ask about.',
     'Nothing on its own: it is the map. Each station opens that stage’s screen.',
     'Rivals’ positions on the road; your incident log, customers, compute bills and Comms claims.',
     None,
     [('A', 'H1a', 'A · A game screen', 'Recommended · safe', 'The road to the bell as a game screen: ten stations, rival labs on the same road, and what the market will ask about.'),
      ('B', 'H1b', 'B · The office whiteboard', 'Experimental', 'The same road hand-written on the office whiteboard, with sticky notes and rival magnets.')]),
    ('2', 'Three banks want to take you public', 'Oct 2024', 'Era 2',
     'The first station on the road, once you choose to get ready.',
     'Three pitch books. Each bank values you differently, charges a different fee, and comes with a catch: one wants a softer story, two are tied to Lodestar.',
     'Pick two lead banks.',
     'The valuation range on pricing night; which S-1 lines the banks push on; a rival link that leaks into your book.',
     None, [('', 'S2', '', '', 'Three pitch books from three banks, each with a valuation, a fee, a promise and a catch.')]),
    ('3', 'Who controls the lab after it lists', 'Dec 2024', 'Era 2',
     'The second station. Must be done before the S-1 draft.',
     'The charter. Four locks, each shown as the ten-block register of who votes: no lock, a founders’ share, a benefit trust, a nonprofit parent.',
     'Pick the lock, now or never: exchange rules stop new super-votes after listing.',
     'Board seats; which attacks can work later (a takeover routes to the acquihire ending, activist seats to the board removal vote); the price.',
     None, [('', 'S3', '', '', 'Four charter locks side by side, each with a ten-block vote register, what it stops and what it costs.')]),
    ('4', 'The S-1, draft 3', 'Jan 2025', 'Era 3',
     'The third station; also reopens whenever an SEC letter asks for an amendment.',
     'A document you write line by line, like the Model Spec screen. Each risk factor from your own record gets a choice: as it happened, as a risk, or left out. Advisors and bankers comment in the margin.',
     'What to disclose, and what the money is for.',
     'Hidden alignment debt and incidents. Whatever stays hidden feeds the SEC letters, the roadshow, the short seller and the end-of-run reveal row (what you told the market next to what was true).',
     None, [('', 'S4', '', '', 'The S-1 draft as a document: five risk-factor lines with three-way choices, use of proceeds, margin comments and two meters.')]),
    ('5', 'Letters from the SEC', 'Feb–Mar 2025', 'Era 3',
     'Letters arrive about once a month; the IPO chip counts the reply deadline.',
     'An inbox of comment letters. Each comment quotes your draft and is written from what your lab actually did. A review clock compares your pace with rival labs.',
     'Answer each open comment.',
     'Your incident log, customers, Comms claims and investors. A sovereign investor can stall review for months.',
     None, [('', 'S5', '', '', 'An inbox of SEC letters, one comment open with three replies, and a review clock against rivals.')]),
    ('6', 'Get the number up before the window closes', 'Apr 2025', 'End of era 3',
     'When the banks name their target, about a month before the public filing, with a countdown chip.',
     'The push. Your valuation against the rival labs’ IPO valuations and the banks’ target, a countdown to the filing, four levers that raise the number, and a culture panel: morale, what staff say, the Model Spec line under strain.',
     'Which levers to pull, or list as you are.',
     'Every lever leaves a mark that later screens read: a skipped eval run feeds the short report, crunch feeds the lockup departures, a cut safety share feeds the trust seats and the earnings call.',
     None, [('', 'S6p', '', '', 'The valuation push: rival valuations to beat, a 26-day countdown, four levers with gains and costs, and a culture panel with morale and staff quotes.')]),
    ('7', 'Who is going public, and when', 'Apr 2025', 'End of era 3',
     'Opens when the SEC clears your draft; the rival board also lives on the hub.',
     'The listing window as an airport departures board: every rival lab’s listing, its status and its first day, plus an investor-mood dial.',
     'Go now, wait for a rival’s debut, or pause the IPO and stay private.',
     'Rival labs list on their own schedules. A big first day heats the window; a flop or an incident shuts it for everyone.',
     ('ref-scaling-laws', '<b>Borrowed from Scaling Laws</b> (HCK Labs): valuation follows a market-mood cycle. <a href="https://hcklab.itch.io/scaling-laws" target="_blank" rel="noopener">itch.io page</a>'),
     [('', 'S6', '', '', 'A departures board of rival AI listings with a mood gauge and three choices.')]),
    ('8', 'The quiet period', 'Jan 2026', 'Era 4',
     'Starts by itself when the filing goes public; the office itself changes.',
     'The office goes quiet: a blue edge around the room, a countdown banner, the Comms desk taped up, and launch or hype buttons marked with their risk. Good news arrives as a temptation card.',
     'Stay quiet, post anyway, or put it in an amended filing.',
     'A hype post or a launch can delay pricing (a “gun-jumping” review).',
     None, [('', 'S7', '', '', 'The office in the quiet period: blue edge, countdown banner, taped-up Comms desk and a temptation card.')]),
    ('9', 'The roadshow', 'Jan 2026', 'Era 4',
     'Eight days, one city a day, after the quiet period starts.',
     'A route of eight cities. Each stop is one investor meeting with one question drawn from your record, answered in the President meeting’s answer styles. The order book builds beside it.',
     'Answer each investor.',
     'The book by investor type; Qilin roadshows in the same week; your answers are quoted back on the first earnings call.',
     None, [('', 'S8', '', '', 'The roadshow: a route of eight cities, a San Francisco fund’s question, three answers and the book so far.')]),
    ('10', 'Set the price', 'Feb 9, 2026', 'Era 4',
     'The night before listing, in the board meeting’s dark call-room look.',
     'Pricing night. The bankers and your advisors each pin a price on the demand curve. Drag the price and see the raise, the expected first day, the chance it breaks below the offer, and the money left on the table.',
     'The offer price.',
     'Cash for the rest of the run; how the first day goes; the mood for every lab still on the road.',
     None, [('', 'S9', '', '', 'Pricing night: bankers’ faces, a demand curve with the range and a $44 pin, and four outcome tiles.')]),
    ('11', 'Listing day', 'Feb 10, 2026', 'Era 4',
     'Plays by itself the morning after pricing night.',
     'The bell, the opening auction, the first print around noon, and the close. Little to decide; this is the run’s hero moment.',
     'Watch, or go back to work.',
     'The close sets the investor mood for rivals; the feed and staff react.',
     None,
     [('A', 'S10a', 'A · Full-screen hero', 'Recommended · loud', 'Listing day as a full-screen hero: giant LAB ticker, $58.40, the day’s chart and four moments.'),
      ('B', 'S10b', 'B · In the office', 'Safe', 'Listing day in the office: a ticker tape along the bottom, staff bubbles and a first-print card.')]),
    ('12', 'Your stock', 'From listing on', 'Eras 4–5',
     'A new screen beside Money once you are listed, plus the price chip under the board countdown.',
     'The price since listing with event markers, who owns the lab as ten blocks, analyst ratings and short interest.',
     'Nothing directly: you move the price only through results, guidance and disclosure, so there is no buyback loop to exploit.',
     'Holders are the board’s money seats; an activist’s block shows here first; rival incidents move your price.',
     ('ref-offworld', '<b>Borrowed from Offworld Trading Company</b> (Mohawk Games): your own shares as hit points rivals buy, made slow and readable. <a href="https://store.steampowered.com/app/271240/" target="_blank" rel="noopener">Steam page</a>'),
     [('', 'S11', '', '', 'The stock screen: price chart since listing with markers, a ten-block ownership register, analysts and short interest.')]),
    ('13', 'The earnings call', 'Each quarter of story time', 'Eras 4–5',
     'A video call like the board meeting, once each quarter of story time.',
     'Guidance against the street against the result, then the analysts’ queue. Each question checks something you promised on the roadshow or the last call. After-hours price moves live.',
     'Answer each question; set the next quarter’s guidance.',
     'Guidance works like a board deal: a promise with a date. The safety share meets the stock price here.',
     ('ref-rt2', '<b>Borrowed from Railroad Tycoon II</b> (PopTop): investors judge the chairman on the stock and can fire him. <a href="https://store.steampowered.com/app/7620/" target="_blank" rel="noopener">Steam page</a>'),
     [('', 'S12', '', '', 'The earnings call: guidance, street and result tiles, an analyst’s question with three answers, after-hours price and the queue.')]),
    ('14', 'The lockup ends', 'Jan 2027', 'Era 5',
     'Nine days before staff may sell, on the IPO chip and as a screen.',
     'Your people and what each can sell, who plans to sell, and which rival labs are poaching them; what unlocks when.',
     'Refresh grants, stagger the release, or let it run.',
     'Rivals time offers to this day; selling moves the stock; leavers slow Research.',
     None, [('', 'S13', '', '', 'Lockup screen: six people cards with what they can sell and who is poaching them, three choices and the unlock schedule.')]),
    ('15', 'The market attacks', 'Jan 2027', 'Era 5',
     'A short seller’s report lands at 7 am; an activist’s stake appears on the stock screen.',
     'The short report as a web page built from your own hidden debt and S-1 wording, beside your responses. The activist’s demand for seats opens as a board vote in the existing meeting.',
     'Respond before the open.',
     'Hidden alignment debt; your S-1 lines; the board meeting and its removal vote. No new endings.',
     None, [('', 'S14', '', '', 'A short seller’s report on LAB with exhibits from the lab’s own record, beside three responses and an activist note.')]),
]

STRIP = [('Era 2 · 2024', ['2', '3']), ('Era 3 · Jan–Apr 2025', ['1', '4', '5', '6', '7']), ('Era 4 · Jan–Apr 2026', ['8', '9', '10', '11', '12', '13']), ('Era 5 · Jan 2027', ['14', '15'])]
THUMB = {s[0]: s[9][0][1] for s in SCREENS}
NAME = {s[0]: s[1] for s in SCREENS}
e = html.escape

def section(s):
    sid, title, when, era, opens, what, decide, ties, ref, variants = s
    imgs = []
    for i, (val, img, label, tag, alt) in enumerate(variants):
        head = ''
        if val:
            tagcls = 'rec' if tag.startswith('Recommended') else ('exp' if tag == 'Experimental' else 'safe')
            head = f'<label class="vhead"><input type="radio" name="v{sid}" value="{val}" {"checked" if i == 0 else ""}><b>{e(label)}</b><span class="tag {tagcls}">{e(tag)}</span></label>'
        imgs.append(f'<figure>{head}<img src="img/r2/{img}.jpg" alt="{e(alt)}" loading="lazy"></figure>')
    refhtml = (f'<figure class="ref"><img src="img/{ref[0]}.jpg" alt="Reference screenshot" loading="lazy"><figcaption>{ref[1]}</figcaption></figure>'
               if ref else '<p class="noref">None of the games surveyed stages this step; it is open ground.</p>' if 2 <= int(sid) <= 11 else '')
    return f'''
<section class="scr" id="s{sid}">
  <div class="s-top"><span class="num">{sid}</span><div><h2>{e(title)}</h2><div class="when">{e(when)} · {e(era)}</div></div>
    <div class="kcc" role="radiogroup" aria-label="Keep, change or cut screen {sid}">
      <label><input type="radio" name="k{sid}" value="keep" checked><span>Keep</span></label>
      <label><input type="radio" name="k{sid}" value="change"><span>Change</span></label>
      <label><input type="radio" name="k{sid}" value="cut"><span>Cut</span></label></div></div>
  <div class="s-body"><div class="shots">{''.join(imgs)}</div>
    <div class="plan">
      <dl>
        <dt>Opens</dt><dd>{e(opens)}</dd>
        <dt>What it is</dt><dd>{e(what)}</dd>
        <dt>You decide</dt><dd class="dec">{e(decide)}</dd>
        <dt>Ties into</dt><dd>{e(ties)}</dd>
      </dl>
      {refhtml}
      <input class="chg" type="text" name="c{sid}" placeholder="What to change (optional)">
    </div></div>
</section>'''

strip = ''.join(
    f'<div class="era"><div class="eh">{e(name)}</div><div class="thumbs">' +
    ''.join(f'<a href="#s{i}"><img src="img/r2/{THUMB[i]}.jpg" alt="" loading="lazy"><span><b>{i}</b> {e(NAME[i])}</span></a>' for i in ids) +
    '</div></div>' for name, ids in STRIP)

page = (HERE / 'round2-template.html').read_text().replace('<!--STRIP-->', strip).replace('<!--SCREENS-->', ''.join(section(s) for s in SCREENS))
(HERE / 'ipo-picker.html').write_text(page)
print('wrote', HERE / 'ipo-picker.html', len(page))
