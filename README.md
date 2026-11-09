# yiannibuilds.dev

My personal site, live at [www.yiannibuilds.dev](https://www.yiannibuilds.dev). Three parts I'm proudest of:

- **The colour palette.** The site is pure black and white (`#000` / `#FFF`), with one orange marker colour for everything hand-drawn. Light mode flips to dark and back with `Shift+Y`, and even the logo has its own dark-mode version.
- **The name that changes.** My name in the hero keeps cycling through display typefaces, and hovering over it turns it into Greek.
- **The banner at the bottom.** A giant `@YIANNI`, stretched to fill the banner from edge to edge, sits behind a collage of the people and art that inspire me. You can select, drag, resize and rotate each piece, like in Figma.

## Process journal

I built this site from scratch with Next.js 15 (App Router) and React 19, using plain CSS and no UI framework. The goal was a site that feels hand-made, like a sketchbook, and stays fast and easy to edit: all content lives in one file (`content/site.js`) and the pages render from it.

**Design decisions**
- **Hand-drawn feel.** One orange line wanders down the page behind everything (`SwirlLine`). Its route is random on each visit, it loops around every section title and it draws itself in as you scroll. Pencil circles around the sidebar links and photos (`PencilCircle`) and a squiggly arrow beside the hero tagline use the same idea: wobbly SVG paths with `pathLength="1"`, animated with `stroke-dashoffset` so they look drawn.
- **Palettes as data.** Every colour is a CSS variable, and whole palettes (`cream`, `sky`, `punk`, `jet`) swap with one setting. Settling on `jet`, pure black and white, let the orange drawings and the photos carry all the colour. A tiny inline script applies your saved theme before the page first paints, so there's no flash of the wrong theme.
- **A name that never sits still.** The hero name cycles through four typefaces (`NameCycle`): Playfair Display, Space Grotesk, DM Serif Display and Instrument Serif italic. All four are stacked in one shared box sized to the widest, on one baseline, with their sizes tuned so the capitals match. That way the name never jumps or shrinks when the font changes. Hovering pauses it and swaps in my name in Greek, and the logo (Michelangelo's *Creation of Adam* hands) slides up into the Greek flag.
- **The banner.** The `@YIANNI` letters are measured with canvas to get their exact ink bounds, then stretched in an SVG so they touch the banner's top and bottom edges (`BannerCollage`). The collage on top works like Figma: click or shift-click to select, drag to move, use the handles to resize and rotate, and drag on empty space to box-select. Each piece is clamped so even its rotated outline stays inside the banner. The same items also feed the Inspirations carousel and gallery (`Collection`).
- **Cartoon highlighter.** In essays, each `<mark>` gets a marker stroke swiped across it, line by line, as it scrolls past (`ScrollHighlight`). Every stroke is an SVG sized to its text, with rough ends, an ink outline and an offset shadow.
- **Playful sections.**
  - A "Uses" bubble with app icons orbiting it opens into a grid (`UsesBubble`).
  - A tilted photo pile expands into a grid using FLIP animations (`RecentlyStack`).
  - A vinyl record in the sidebar spins while it plays Spotify through the iFrame API (`VinylPlayer`).
  - An optional field of floating particles drifts away from your cursor (`ParticleBackground`).
- **Accessibility.** Every animation respects `prefers-reduced-motion`, and the shortcuts are ignored while you're typing in a field.

**Technical side**
- **Live data from server components.** They fetch my Duolingo streak, what I'm currently reading on Fable and my GitHub contribution calendar. None of these has a public API, so `lib/live.js` calls the same endpoints their own sites use and parses GitHub's calendar HTML. Results are cached and the page rebuilds every 6 hours (ISR). Every call fails gracefully to a plain link.
- **Group chat with live likes.** Chat messages are stored in Upstash Redis through its REST API. Each like is a Redis set member, so likes can't be double counted and the count stays live. Locally it falls back to a JSON file.
- **Contact form without a backend service.** `app/api/contact` sends email through Resend's API using plain `fetch`, with no extra dependencies, and sets reply-to to the sender.
- **Bot and spam protection on every endpoint:**
  - a hidden honeypot field
  - a too-fast-to-be-human timing check (bots get a fake success)
  - per-IP and global rate limits built on Redis `INCR` and `EXPIRE`
  - server-side email validation
- **Media.** Project demos are compressed with ffmpeg (H.264, CRF 30, faststart) and loop silently like moving images. YouTube demos are cropped to chosen segments and hidden behind a poster frame until they play. Logos were cleaned up in Python (PIL), keying out white backgrounds while keeping enclosed white areas.
- **Layout.** Stacking-context bugs on mobile (videos bleeding over the top bar) were fixed with `isolation: isolate`. A scroll-spy sidebar highlights the section you're reading. The site is deployed on Vercel with Vercel Analytics.
