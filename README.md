# Aapna Kahoot — Shree Balaji Rajasthi Mandal

A live, colourful team quiz you can run from any laptop (host) while
players join and answer from their own phones — hosted for free on
GitHub Pages.

## What's in this folder

| File | What it's for |
|---|---|
| `index.html` | The whole app (all screens) |
| `style.css` | Colours, fonts, layout |
| `app.js` | Game logic — PIN generation, timer, scoring, sync |
| `questions.js` | The 40 quiz questions — edit freely to add/change questions |
| `firebase-config.js` | **You must edit this before the game works** |
| `assets/logo-placeholder.svg` | Shown until you add your real logo |

## 1. One-time setup: connect Firebase (2 minutes, free)

GitHub Pages only serves files — it can't make one player's phone talk
to another's. To get a live shared PIN, timer and leaderboard across
every device, this app uses **Firebase Realtime Database**, a free
Google service made for exactly this.

1. Go to <https://console.firebase.google.com/> and sign in with any
   Google account.
2. Click **Add project** → give it any name, e.g. `aapna-kahoot` → you
   can turn off Google Analytics → **Create project**.
3. On the project home page, click the **`</>`** (Web) icon to
   register a web app → give it a nickname → **Register app**.
4. Firebase shows you a code block with a `firebaseConfig` object.
   Copy those 6-7 values into `firebase-config.js` in this folder,
   replacing the `PASTE_YOUR_...` placeholders.
5. In the left menu, go to **Build → Realtime Database → Create
   Database** → pick a location → start in **Test mode**.
6. Save `firebase-config.js`.

**Security note:** Test mode means anyone who has your site's link can
read and write the database directly (not just through the app UI). For
a one-evening community quiz this is normal and fine — just don't reuse
this same Firebase project for anything sensitive. If you want tighter
rules, in the Realtime Database → Rules tab you can restrict writes to
only the `games/` path and add an expiry date; Firebase's own docs walk
through this under "Realtime Database security rules."

Likewise, the host password ("Sharad") only gates the host screen in
the browser — it's a friendly speed bump for your event, not real
authentication, since anyone can view the page's source. Don't reuse
this password anywhere sensitive.

## 2. Add your logo

Drop your logo image into the `assets` folder as **`assets/logo.png`**
(any image works — square looks best). The page automatically uses it;
until it's there, a placeholder badge is shown instead.

## 3. Put it on GitHub Pages

1. Create a new **public** repository on GitHub (e.g. `aapna-kahoot`).
2. Upload every file in this folder to that repository, keeping the
   `assets` folder intact (via the GitHub web UI's "Add file → Upload
   files", or `git add . && git commit -m "Aapna Kahoot" && git push`
   if you use git from a terminal).
3. In the repository, go to **Settings → Pages**.
4. Under "Build and deployment", set **Source** to "Deploy from a
   branch", branch **main**, folder **/(root)** → **Save**.
5. GitHub gives you a live link after a minute or two, usually:
   `https://<your-username>.github.io/<repo-name>/`

That link is your game's home page — bookmark it. It's also the base
of the link the host's **Copy player link** button generates.

## 4. Running a game night

1. Host opens the site → **I'm the Host** → enters password `Sharad`.
2. Host taps **Generate PIN** — a big 4-digit PIN appears, and it's
   different every time you tap it.
3. Host taps **Copy player link** and shares it (WhatsApp, etc.).
   Players open it, then enter their **team number**, **player name**,
   and the **PIN**, and tap **Join Game**.
4. Once teams show up in the lobby, the host taps **Start Game**.
5. Each of the 40 questions (order shuffled fresh every game) shows on
   every player's own phone with a 20-second timer. A question moves
   to results as soon as every joined team has answered, or when the
   20 seconds run out — whichever comes first.
6. Scoring: a correct answer earns "seconds saved" = `20 − (seconds
   taken to answer)`; a wrong or missed answer earns 0. These add up
   across all 40 questions. After every question, the host and every
   player see the running **top 6 teams by total seconds saved**,
   styled in a distinct gold/brass colour so it stands out from the
   game screens.
7. After question 40, the host's button reads **Show Final Results**
   for the final leaderboard.

## Customising

- **Questions:** edit `questions.js` — each entry is
  `{ category, q, options: [4 strings], correct: 0-3 }`.
- **Timer length:** change `QUESTION_DURATION_MS` at the top of
  `app.js` (in milliseconds; `20000` = 20 seconds).
- **Host password:** change `HOST_PASSWORD` at the top of `app.js`.
- **Colours/fonts:** all in `style.css` under the `:root {}` block at
  the top.
