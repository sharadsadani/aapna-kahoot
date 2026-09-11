# Aapna Kahoot — Shree Balaji Rajasthanii Mandal

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
| `firebase-config.js` | Your Firebase connection settings |
| `test.html` | Connection diagnostic page (open it if anything misbehaves) |

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
5. In the left sidebar, go to **Databases & Storage → Realtime
   Database → Create Database** → pick a location → start in
   **Test mode**.
6. Save `firebase-config.js`.

**Important — test mode expires after 30 days**, which would silently
break the game. Go to Realtime Database → **Rules** and publish this
instead; it never expires and limits access to just the game data:

```json
{
  "rules": {
    "games": {
      ".read": true,
      ".write": true
    }
  }
}
```

Anyone with your site link can still read and write that area, which is
fine for a community quiz night — just don't reuse this Firebase project
for anything sensitive.

Likewise, the host password ("Sharad") only gates the host screen in
the browser — it's a friendly speed bump for your event, not real
authentication, since anyone can view the page's source. Don't reuse
this password anywhere sensitive.

## 2. Put it on GitHub Pages

1. Create a new **public** repository on GitHub (e.g. `aapna-kahoot`).
2. Upload every file in this folder to that repository (via the GitHub
   web UI's "Add file → Upload files", or `git add . && git commit -m
   "Aapna Kahoot" && git push` if you use git from a terminal).
3. In the repository, go to **Settings → Pages**.
4. Under "Build and deployment", set **Source** to "Deploy from a
   branch", branch **main**, folder **/(root)** → **Save**.
5. GitHub gives you a live link after a minute or two, usually:
   `https://<your-username>.github.io/<repo-name>/`

That link is your game's home page — bookmark it. It's also the base
of the link the host's **Copy player link** button generates.

## 3. Running a game night

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
6. On reveal, the host screen shows all four options with the correct
   one highlighted and a count of how many teams picked each, followed
   by the standings. **The next question starts automatically after 3
   seconds** — or press **Next Question** to move on immediately.
7. Scoring, shown as columns on the standings table:
   - **Correct** — running count of correct answers.
   - **Secs Saved** — `20 − (seconds taken)` for a correct answer, 0 for
     a wrong or missed one.
   - **Score** — seconds saved × 10.
   - **Bonus** — streak reward for a run of consecutive correct answers:

     | In a row | Bonus |
     |---|---|
     | 3 | 50 |
     | 4 | 75 |
     | 5 | 100 |
     | 6 | 150 |
     | 7 | 250 |
     | 8 or more | 400 |

     The bonus does **not** stack within a run — a run is worth the grid
     value for the length it reaches, so 5 in a row is worth 100 in
     total, not 50 + 75 + 100. As the run grows the larger value replaces
     the smaller one. One wrong *or missed* answer ends the run; a later
     run earns its own bonus on top of what is already banked (a run of 5
     followed by a run of 3 banks 100 + 50 = 150).
   - **Grand Total** — Score + Bonus. **Teams are ranked on Grand Total.**

   The running **top 6 teams** appear after every question in a distinct
   gold/brass panel, which scales itself down so all columns stay on
   screen even on a phone.
8. **Pause** freezes the clock for everyone (and the 3-second
   auto-advance) so you can discuss an answer; press **Resume** and the
   timer picks up exactly where it left off. **Exit Game** ends the
   quiz immediately and jumps everyone to the final results.
9. After question 40, the host's button reads **Show Final Results**.
10. When a game ends — whether it finishes normally or the host presses
    **Exit Game** — every player's session ends with it. Their phone
    forgets that game, so the next time they open the link they land on
    the join screen ready for a fresh PIN, rather than being pulled back
    into the old results. There's also a **Join Another Game** button on
    the final screen.

## Customising

- **Questions:** edit `questions.js` — each entry is
  `{ category, q, options: [4 strings], correct: 0-3 }`.
- **Timer length:** change `QUESTION_DURATION_MS` at the top of
  `app.js` (in milliseconds; `20000` = 20 seconds).
- **Host password:** change `HOST_PASSWORD` at the top of `app.js`.
- **Gap between questions:** change `AUTO_ADVANCE_SECONDS` in `app.js`.
- **Score multiplier:** change `SCORE_PER_SECOND` in `app.js` (default 10).
- **Streak bonuses:** edit the `STREAK_BONUS` table in `app.js`
  (`{3:50, 4:75, 5:100, 6:150, 7:250, 8:400}`); `STREAK_MAX` sets the
  length at which the top bonus applies to everything above it.
- **Colours/fonts:** all in `style.css` under the `:root {}` block at
  the top.
