// =====================================================================
//  YOUR WEBSITE CONTENT — edit this file to change what the site says.
//  Images go in /public/images and are referenced as "/images/file.jpg".
//  Essays live in /content/writing as Markdown files (one per essay).
//  Leave a field as "" or [] to hide it.
// =====================================================================

const site = {
  // ---------- Basics ----------
  // Colour palette: "cream" (original warm look), "sky" (blue / cloudy white / lime)
  // "punk" (red-orange / snowy white / mint) or "jet" (black #000000 / white #FFFFFF).
  // Palettes live at the top of app/globals.css.
  palette: "jet",
  particles: false, // floating-particle animated background (true to turn back on)
  name: "Yianni Karakoulas",
  greekName: "Γιάννη", // shown when you hover over your name
  initials: "YK", // header logo
  greekInitials: "ΓΚ", // header logo on hover
  greeting: "Hi, I'm",
  tagline: "Creating human-first software projects, exploring agentic AI, and giving everything one hundred percent.",
  photo: "", // headshot hidden (file kept at /images/portrait.jpg — set it back to show it)
  email: "j.karal2008@gmail.com",
  siteTitle: "Yianni Karakoulas",
  siteDescription: "Yianni Karakoulas — creating human-first software projects and exploring agentic AI.",

  // ---------- Live status (shown in the top bar and hero) ----------
  status: {
    available: true, // true = green dot, false = amber dot
    updated: "2026-11", // when you last updated this
    items: [
      "Currently: Quantitative research & ML engineering @ UofT",
      "Seeking: Spring/Summer 2027 internships",
    ],
  },

  // ---------- Social links (icons: github, linkedin, x, email, website) ----------
  social: [
    { label: "GitHub", icon: "github", url: "https://github.com/jkaral" },
    { label: "LinkedIn", icon: "linkedin", url: "https://www.linkedin.com/in/john-karakoulas" },
    { label: "X", icon: "x", url: "https://x.com/yiannibuilds" },
  ],

  // ---------- About ----------
  about: {
    // Opening quote (set to null to hide)
    quote: {
      text: "Τα αγαθά κόποις κτώνται",
      translation: "Good things are acquired through toil.",
      source: "Socrates",
    },
    // Each paragraph is either a plain string, or a list of pieces where a piece
    // can be a link with a logo: { text, url, logo }.
    bio: [
      "My grandma instilled this principle in me, and I have always strived to embody it. I apply it to everything, from building my own products and projects to athletic pursuits and building meaningful relationships. I always strive to do what I can, while I can.",
      [
        "I study Computer Science at the University of Toronto and work as a Quantitative Researcher at ",
        {
          text: "The Quantitative Finance Club",
          url: "https://www.linkedin.com/company/the-quantitative-finance-club-university-of-toronto/posts/?feedView=all",
          logo: "/images/logos/qfc.png",
        },
        ", and at ",
        { text: "UTMIST", url: "https://www.utmist.ca/", logo: "/images/logos/utmist.png" },
        " and ",
        { text: "UTBIOME", url: "https://utbiome.skule.ca/", logo: "/images/logos/utbiome.png" },
        " as a Machine Learning Engineer. Outside of work: rugby, lifting, and reading.",
      ],
    ],
    exploring: ["Agent swarms", "ML for markets & healthcare", "Building human-focused products"],
    // "Recently" photo gallery
    recently: [
      // A video item: autoplays muted on top of the pile, with a sound toggle
      { src: "/videos/recent-camp-poster.jpg", video: "/videos/recent-camp.mp4", caption: "favella baller academy graduates from ucc summer camps '26" },
      { src: "/images/recent-1.jpg", full: "/images/recent-1-full.jpg", caption: "Rugby team photo, senior season" },
      { src: "/images/recent-2.jpg", full: "/images/recent-2-full.jpg", caption: "Sunset view w/ friends" },
      { src: "/images/recent-3.jpg", full: "/images/recent-3-full.jpg", caption: "Eye-opening speech about the future of global geopolitics" },
      { src: "/images/recent-4.jpg", full: "/images/recent-4-full.jpg", caption: "Geeked vs. locked in" },
      { src: "/images/recent-5.jpg", full: "/images/recent-5-full.jpg", caption: "Locked in @ Hack the Valley" },
    ],
  },

  // ---------- Work ----------
  work: [
    {
      role: "Quantitative Researcher",
      company: "The Quantitative Finance Club",
      url: "https://www.linkedin.com/company/the-quantitative-finance-club-university-of-toronto/posts/?feedView=all",
      logo: "/images/logos/qfc.png",
      description: "Project focus TBD",
      stack: ["pandas", "NumPy", "statsmodels", "SciPy"],
      dates: "Oct 2026 — Present",
    },
    {
      role: "Machine Learning Engineer",
      // More than one organization: list them here (shown as "A and B").
      orgs: [
        { company: "UTMIST", url: "https://www.utmist.ca/", logo: "/images/logos/utmist.png" },
        { company: "UTBIOME", url: "https://utbiome.skule.ca/", logo: "/images/logos/utbiome.png" },
      ],
      description: "Evaluating MEG decoders to isolate neural truth from language bias.",
      stack: ["PyTorch", "scikit-learn", "LLMs & Fine-Tuning", "Experiment Tracking"],
      dates: "Oct 2026 — Present",
    },
    {
      role: "Director of Programs and Events",
      company: "World Affairs Conference",
      url: "https://worldaffairscon.org/",
      logo: "/images/logos/wac.png",
      description:
        "Led program and event operations for North America's largest current-affairs conference, serving 1,000+ delegates from 50+ schools, and launched its Service Fair for student-led philanthropy.",
      stack: ["Operations", "Leadership", "Event Planning", "Interviewing"],
      dates: "June 2025 — Mar 2026",
    },
    {
      role: "Mathematics Tutor",
      company: "Spirit of Math Schools",
      url: "https://spiritofmath.com/",
      logo: "/images/logos/spiritofmath.png",
      description:
        "Taught linear algebra and calculus to classes of 20 high-school students twice a week, diagnosing errors and giving targeted feedback.",
      stack: ["Teaching", "Linear Algebra", "Calculus", "Communication"],
      dates: "Aug 2023 — June 2026",
    },
  ],

  // ---------- Projects ----------
  // links: [{ label: "GitHub", url: "..." }, { label: "Demo", url: "..." }]
  // image: "/images/project.png" (a screenshot), award: "1st place, Some Hackathon"
  projects: [
    {
      title: "Pathology Foundation-Model Fusion",
      year: "2026",
      description:
        "A weakly supervised pathology pipeline that runs 368,250 tiles from 203 whole-slide images through three foundation models (UNI2-h, Virchow2, Phikon-v2) and classifies seven lung adenocarcinoma growth patterns with attention-based multiple-instance learning. Agent-selected fusion strategies reached 0.874 macro-AUROC on a one-time test set of 41 patients.",
      stack: ["Python", "PyTorch", "Hugging Face", "scikit-learn", "W&B"],
      award: "",
      image: "/images/project-pathology.jpg",
      links: [{ label: "GitHub", url: "https://github.com/jkaral/pathology-fusion-AI" }],
      writeup: "https://drive.google.com/file/d/1foNjjot6dfQ7pVC8Ln-FAHIOEeQ0KkZY/view?usp=sharing",
    },
    {
      title: "Your Trusted Circle",
      year: "2026",
      description:
        "A group-safety platform whose Hono/MongoDB API runs check-in deadlines and alert escalation server-side, so incidents keep progressing even when phones disconnect. 12 merged PRs in 36 hours: consent-checked location sharing, hash-chained incident timelines, and voice-agent APIs, backed by a 169-test suite.",
      stack: ["TypeScript", "Node.js", "Hono", "MongoDB", "Railway"],
      award: "",
      image: "",
      // Self-hosted demo clip (silent, loops). Cut from the HTV11 demo video:
      // 0:47-0:57, 1:10-1:15, 2:53-3:07, 3:32-3:37 joined into one 34s clip.
      videoFile: "/videos/ytc-demo.mp4",
      videoPoster: "/videos/ytc-demo-poster.jpg",
      // (Alternatively `video: "<YouTube ID>"` + `videoSegments` plays from YouTube instead.)
      links: [
        { label: "GitHub", url: "https://github.com/MightyTMZ/your_trusted_circle" },
        { label: "Devpost", url: "https://devpost.com/software/ytc" },
      ],
    },
    {
      title: "Memory Influence Debugger",
      year: "2026",
      description:
        "A Next.js tool that compares an agent's plans with and without memory, surfaces field-level differences, and flags likely memory influence before anything executes. After a 40-scenario benchmark exposed retrieval failures, a redesign raised regression correctness from 2.5% to 95%.",
      stack: ["Next.js", "TypeScript", "React", "Backboard API", "Vitest"],
      award: "",
      image: "",
      // Self-hosted demo clip (silent, loops). Cut from the CUTC submission demo:
      // 0:52-0:57, 1:07-1:44 joined into one 42s clip.
      videoFile: "/videos/memory-debugger-demo.mp4",
      videoPoster: "/videos/memory-debugger-demo-poster.jpg",
      links: [{ label: "GitHub", url: "https://github.com/jkaral/shadowrecall" }],
    },
  ],

  // ---------- Hobbies ----------
  hobbies: [
    // link: { label: "Profile", url: "https://..." } (optional)
    {
      title: "Rugby",
      description:
        "During my short career on the Varsity Rugby team I played as a right winger, and, on occasion, blindside flanker (scrum in the photo). As my first contact sport, it taught me resilience and endurance.",
      image: "/images/hobby-rugby.jpg",
      // hand-drawn circle around me (percent of the photo frame; see components/PencilCircle.js)
      circle: { x: 34, y: 57.5, w: 47, h: 45, r: -48, aspect: 0.5625 }, // whole body, along the diagonal (widened on the right)
      link: null,
    },
    {
      title: "Kickboxing + BJJ",
      // Shown after the title as "@ The Academy", linked
      titleLink: { text: "The Academy", url: "https://www.google.com/maps/place/The+Academy+Toronto/data=!4m2!3m1!1s0x0:0x2d3e94d392d94ea1?sa=X&ved=1t:2428&ictx=111" },
      description:
        "I started both kickboxing and BJJ in June 2026 after years of being a dedicated UFC fan (Volk is my GOAT). It's been an important part of my discipline and athletic growth.",
      image: "/images/hobby-combat.jpg",
      circle: { x: 56, y: 71, w: 16, h: 49, r: -5, aspect: 0.547 },
      link: null,
    },
    // Live rows: "fable" shows your Currently Reading shelf, "duolingo" your streak.
    {
      title: "Reading",
      description: "",
      live: "fable",
    },
    {
      title: "Learning Languages",
      description: "",
      // speaking proficiency (CEFR levels), shown above the Duolingo courses
      speaking: [
        { lang: "Spanish", level: "A2" },
        { lang: "French", level: "B2" },
        { lang: "Greek", level: "Native" },
      ],
      live: "duolingo",
    },
  ],

  // ---------- Music (vinyl player in the sidebar) ----------
  // Plays through Spotify's official player. spotifyId = the ID in the song's Spotify link
  // (open.spotify.com/track/<ID>). Add more songs and the ⏮ ⏭ buttons move between them.
  music: [
    {
      title: "Shimmer",
      artist: "Fuel",
      spotifyId: "7vVYqVFAdEFbiAMh8aPFaJ",
      cover: "https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e026319840ce04b2aeff345324e",
    },
  ],

  // ---------- Live accounts (used by the live hobby rows) ----------
  live: {
    githubUsername: "jkaral", // contribution graph under the hero buttons
    // Show the graph only from this date onward, until `githubTrimUntil`; after that it
    // goes back to the full last year automatically.
    githubShowFrom: "2026-08-01",
    githubTrimUntil: "2027-01-01",
    duolingoUsername: "Yianni868569",
    hideLanguages: ["el"], // language codes to leave out (el = Greek)
    // Greetings floating around the streak, keyed by Duolingo language code
    greetings: { es: "¡Hola!", it: "Ciao!", fr: "Bonjour!", el: "Γεια σου!" },
    fableProfile: "https://fable.co/fabler/yianni-256745595137",
  },

  // ---------- Uses (/uses page) ----------
  uses: {
    intro: "The hardware and software I use day to day.",
    // Optional per item: note (shown under the name), url, icon (a file in /public/images/icons),
    // glyph (a built-in line icon: laptop, tablet, headphones)
    // and color (icon tint; leave out to follow the text color in light/dark mode).
    // fullColor: true shows the icon file as-is (a coloured app icon) instead of tinting it.
    groups: [
      {
        title: "Hardware",
        items: [
          { name: "Dell 15 (DC15250)", note: "Laptop", glyph: "laptop" },
          { name: "iPad (13th generation)", note: "Tablet", glyph: "tablet" },
          { name: "Sony WH-1000XM5", note: "Headphones", glyph: "headphones" },
          { name: "GoPro HERO7", note: "Action camera", glyph: "camera" },
        ],
      },
      {
        title: "Software",
        items: [
          { name: "Notion", url: "https://www.notion.so", icon: "/images/icons/notion.svg" },
          { name: "Obsidian", url: "https://obsidian.md", icon: "/images/icons/obsidian.svg", color: "#7C3AED" },
          { name: "Claude", url: "https://claude.ai", icon: "/images/icons/claude.svg", color: "#D97757" },
          { name: "ChatGPT", url: "https://chatgpt.com", icon: "/images/icons/openai.svg" },
          { name: "Google Calendar", url: "https://calendar.google.com", icon: "/images/icons/googlecalendar.svg", color: "#4285F4" },
          { name: "Git", url: "https://git-scm.com", icon: "/images/icons/git.svg", color: "#F05032" },
          { name: "VS Code", url: "https://code.visualstudio.com", icon: "/images/icons/vscode.svg", color: "#007ACC" },
          { name: "YPT", icon: "/images/icons/ypt.png", fullColor: true },
        ],
      },
    ],
  },

  // ---------- Contact ----------
  contact: {
    blurb: "You're more than welcome to reach out if you'd like to discuss opportunities, have a quick chat, or just to say hi! I'm always looking forward to meeting new people.",
    // Free form backend: create a form at https://formspree.io and paste its ID (e.g. "xyzabcd").
    // Leave "" and the form will open the visitor's email app instead.
    formspreeId: "",
  },

  // ---------- Bottom banner: interactive collage (above the footer) ----------
  // Visitors can click, drag, resize and rotate each item, like a Figma canvas.
  // x / y = starting position of the item's top-left corner (% of banner width / height)
  // w     = width (% of banner width); ratio = height / width of the image
  // r     = starting tilt in degrees. Cut-out PNG/WebP images look best.
  // glow  = true adds a faint light rim (for dark items that blend into the black)
  banner: {
    handle: "@YIANNI", // giant text behind the collage
    // The same items also fill the carousel + gallery section above the banner
    collectionTitle: "Inspirations",
    collectionIntro: "The people, art and things that shape how I think.",
    items: [
      {
        src: "/images/banner/kendrick.webp",
        ratio: 1,
        x: 14, y: 30, w: 19, r: -5,
        title: "the blacker the berry the sweeter the juice",
        caption: "the epitome of counter culture from one of my favourite (and arguably the best) rapper OAT",
      },
      {
        src: "/images/banner/mishima.webp",
        ratio: 1.284,
        x: 62, y: 16, w: 20, r: 3,
        title: "Yukio Mishima",
        caption: "a closeted gay man that led the nationalists of post-wwii japan; one of the most interesting people i've read about",
      },
      {
        src: "/images/banner/chicken-joe.webp",
        ratio: 2.632,
        x: 44, y: 46, w: 5.79, r: -4, // 1.25x the height of the Man United crest
        title: "chicken joe",
        caption: "the epitome of \"chill\"; my reminder to, sometimes, take things slow",
      },
      {
        src: "/images/banner/cloud-runners.webp",
        ratio: 0.46,
        x: 78, y: 70, w: 20, r: -8,
        title: "cloud runners",
        caption: "hands down the most comfortable sneakers ive ever worn (not sponsored)",
      },
      {
        src: "/images/banner/mma-gloves.webp",
        ratio: 0.939,
        x: 34, y: 3, w: 14, r: 10,
        title: "mma gloves",
        caption: "my #1 instrument of stress-relief and discipline building",
      },
      {
        src: "/images/banner/backgammon.webp",
        ratio: 0.908,
        x: 1, y: 50, w: 15, r: 7,
        title: "backgammon board",
        caption: "a game I played as a kid with my grandpa (παππού)",
      },
      {
        src: "/images/banner/hoodie.webp",
        ratio: 0.9,
        x: 48, y: 4, w: 14, r: -6,
        title: "uniqlo blank hoodie",
        caption: "my go-to sweatshirt",
      },
      {
        src: "/images/banner/man-united-crest.webp",
        ratio: 1.016,
        x: 84, y: 6, w: 12, r: 6,
        title: "man united",
        caption: "this club is an emotional rollercoaster #glazersout",
      },
      {
        src: "/images/banner/olympiacos.webp",
        ratio: 1,
        x: 29, y: 62, w: 11, r: -8,
        title: "olympiacos",
        caption: "είσαι στο μυαλοοοοοοοοο κάτι μαγικοοοοοοοοο...",
      },
      {
        src: "/images/banner/ucl-ball.png",
        ratio: 1,
        x: 52, y: 64, w: 10, r: 0,
        title: "ucl ball",
        caption: "some of my best soccer memories was playing with the prime favela baller",
      },
      {
        src: "/images/banner/hasty-market.png",
        ratio: 0.749,
        x: 2, y: 5, w: 13, r: -6,
        title: "hasty market",
        caption: "the best one's @ davisville station",
      },
      {
        src: "/images/banner/giouvarlakia.webp",
        ratio: 0.8,
        x: 33, y: 70, w: 14, r: -3,
        title: "γιουβαρλάκια",
        caption: "my favourite homecooked meal",
      },
      {
        src: "/images/banner/tobias.png",
        ratio: 2.022,
        x: 88, y: 34, w: 7, r: 0,
        title: "Tobias Fünke",
        caption: "character from arrested development, top 3 david cross performances",
      },
      {
        src: "/images/banner/loux.png",
        ratio: 2.65,
        x: 71, y: 44, w: 5.5, r: 5,
        title: "λουξ",
        caption: "greek version of fanta",
      },
      {
        src: "/images/banner/mandem.webp",
        ratio: 0.75,
        x: 15, y: 74, w: 14, r: 4,
        title: "the mandem",
        caption: "or at least two of them",
      },
      {
        src: "/images/banner/diet-coke.png",
        ratio: 1.946,
        x: 36.5, y: 38, w: 5.5, r: -6,
        title: "can of dc",
        caption: "best grey loot refreshment",
      },
      {
        src: "/images/banner/curtis.png",
        ratio: 0.703,
        x: 63, y: 64, w: 13, r: 4,
        title: "curtis blue vinyl",
        caption: "first vinyl i ever bought on my first trip to san francisco",
      },
      {
        src: "/images/banner/slugterra.webp",
        ratio: 0.5625,
        x: 64.5, y: 1, w: 12, r: 3,
        title: "slugterra",
        caption: "my favourite childhood show",
      },
      {
        src: "/images/banner/pink-polo.png",
        ratio: 1.087,
        x: 19.5, y: 2, w: 9.5, r: -6,
        title: "pink polo",
        caption: "my favourite colour on my favourite shirt",
      },
      {
        src: "/images/banner/skis.png",
        ratio: 4.569,
        x: 47.5, y: 23, w: 5, r: 4, // centred on the banner
        title: "skis",
        caption: "been skiing since i was 3 yrs",
      },
    ],
  },

  footer: "Designed and built by Yianni Karakoulas.",
};

export default site;
