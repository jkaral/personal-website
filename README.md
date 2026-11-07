# My website

Personal site built with Next.js.

## Run it locally

```
npm install
npm run dev
```

Then open http://localhost:3000.

## Edit your content

| What | Where |
| --- | --- |
| Name, tagline, status, bio, work, projects, hobbies, uses, contact | `content/site.js` |
| Essays | `content/writing/*.md` (one file per essay) |
| Photos / screenshots | `public/images/` → reference as `/images/name.jpg` |
| Colors / fonts | `app/globals.css` (top of file) |

## Deploy (free)

Push this folder to a GitHub repo, then import it at https://vercel.com/new. Every push redeploys automatically.
