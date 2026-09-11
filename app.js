/* ============================================================
   Aapna Kahoot — game logic
   Talks to a Firebase Realtime Database (see firebase-config.js)
   so a host's laptop/projector and every player's phone stay in
   sync, all from a static site hosted on GitHub Pages.
   ============================================================ */

const HOST_PASSWORD = "Sharad";
const QUESTION_DURATION_MS = 20000;
const RING_CIRCUMFERENCE = 2 * Math.PI * 34;

// ---------------- runtime state ----------------
let db = null;
let serverOffset = 0;

let currentPin = null;
let myTeamNumber = null;
let myPlayerName = null;

let hostGameData = null;
let playerGameData = null;

let timerInterval = null;
let activeTimerKey = null;
let revealTriggeredForQ = -1;
let currentRenderedQIndexForPlayer = -1;

// ---------------- small utilities ----------------

function serverNow() {
  return Date.now() + serverOffset;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function setBusy(btn, busy) {
  if (!btn) return;
  btn.disabled = busy;
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("is-active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("is-active");
}

/* keeps "Shree Balaji Rajasthi Mandal" on one line at any width by
   shrinking its font-size until it fits, instead of wrapping */
function fitTitleLine() {
  const el = document.getElementById("mastTitle");
  if (!el) return;
  const container = el.parentElement;
  const maxWidth = container.clientWidth;
  if (!maxWidth) return;
  let fontSize = Math.min(64, Math.max(16, Math.floor(maxWidth / 7)));
  el.style.fontSize = fontSize + "px";
  let guard = 0;
  while (el.scrollWidth > maxWidth && fontSize > 12 && guard < 100) {
    fontSize -= 1;
    el.style.fontSize = fontSize + "px";
    guard++;
  }
}

/* shrinks a results panel with a CSS transform so it always fits its
   available space, per the "shrink automatically" requirement */
function fitToContainer(el) {
  requestAnimationFrame(() => {
    el.style.transform = "scale(1)";
    const parent = el.parentElement;
    if (!parent) return;
    const availW = parent.clientWidth || window.innerWidth;
    const availH = window.innerHeight * 0.6;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const scale = Math.min(1, availW / rect.width, availH / rect.height);
    el.style.transform = scale < 1 ? `scale(${scale})` : "scale(1)";
  });
}

// ---------------- Firebase setup ----------------

function initFirebase() {
  const isPlaceholder =
    typeof firebaseConfig === "undefined" ||
    !firebaseConfig ||
    firebaseConfig.apiKey === "PASTE_YOUR_API_KEY_HERE";
  if (isPlaceholder) {
    showConfigWarning();
    return false;
  }
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    db.ref(".info/serverTimeOffset").on("value", (snap) => {
      serverOffset = snap.val() || 0;
    });
    return true;
  } catch (err) {
    showConfigWarning(err.message);
    return false;
  }
}

function showConfigWarning(detail) {
  document.querySelector(".app-shell").innerHTML = `
    <div class="stage">
      <div class="card center-text">
        <div class="eyebrow">Setup needed</div>
        <h2>Connect Firebase first</h2>
        <p>This game needs a free Firebase Realtime Database so every
        phone can stay in sync. Open <code>firebase-config.js</code> in
        this project and paste in your project's config values — the
        file has step-by-step instructions, and README.md has the full
        walkthrough.</p>
        ${detail ? `<p class="error-text">${escapeHtml(detail)}</p>` : ""}
      </div>
    </div>`;
}

// ---------------- PIN generation ----------------

async function generateUniquePin() {
  for (let i = 0; i < 15; i++) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const snap = await db.ref("games/" + pin).once("value");
    if (!snap.exists()) return pin;
  }
  return String(Math.floor(1000 + Math.random() * 9000));
}

function describeFirebaseError(err) {
  return (err && err.message) || "Please check your internet connection and try again.";
}

// ---------------- timer ring ----------------

function startTimerDisplay(getStartedAt, duration, barEl, numEl, onExpire) {
  clearInterval(timerInterval);
  barEl.style.strokeDasharray = RING_CIRCUMFERENCE;
  let expired = false;
  function tick() {
    const startedAt = getStartedAt();
    if (!startedAt) return;
    const elapsed = serverNow() - startedAt;
    const remainingMs = Math.max(0, duration - elapsed);
    const remainingSec = Math.ceil(remainingMs / 1000);
    numEl.textContent = remainingSec;
    const frac = remainingMs / duration;
    barEl.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - frac);
    barEl.style.stroke = remainingSec <= 5 ? "var(--magenta)" : "var(--teal)";
    if (remainingMs <= 0 && !expired) {
      expired = true;
      onExpire && onExpire();
    }
  }
  tick();
  timerInterval = setInterval(tick, 200);
}

function ensureTimer(key, getStartedAt, duration, barEl, numEl, onExpire) {
  if (activeTimerKey === key) return;
  activeTimerKey = key;
  startTimerDisplay(getStartedAt, duration, barEl, numEl, onExpire);
}

function stopTimer() {
  activeTimerKey = null;
  clearInterval(timerInterval);
}

// ---------------- leaderboard rendering ----------------

function renderLeaderboard(container, teamsObj, opts = {}) {
  const list = Object.values(teamsObj || {}).sort(
    (a, b) => (b.cumulativeScore || 0) - (a.cumulativeScore || 0)
  );
  const top = list.slice(0, 6);
  const medals = ["🥇", "🥈", "🥉"];
  let rows = top
    .map((t, i) => {
      const isYou =
        opts.myTeamNumber != null && String(t.teamNumber) === String(opts.myTeamNumber);
      return `<tr class="${isYou ? "you" : ""}">
        <td class="rank">${medals[i] || i + 1}</td>
        <td>#${escapeHtml(t.teamNumber)}</td>
        <td>${escapeHtml(t.name || "Team " + t.teamNumber)}</td>
        <td class="secs">${(t.cumulativeScore || 0).toFixed(1)}s</td>
      </tr>`;
    })
    .join("");
  if (!rows) {
    rows = `<tr><td colspan="4" class="center-text" style="color:#d9b877">No teams have scored yet</td></tr>`;
  }
  container.innerHTML = `
    <div class="leaderboard__title">${opts.title || "🏆 Leaderboard"}</div>
    <table>
      <thead><tr><th></th><th>Team</th><th>Team Name</th><th style="text-align:right">Seconds Saved</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  fitToContainer(container);
}

// ==================================================================
// HOST
// ==================================================================

function subscribeHostToGame(pin) {
  db.ref("games/" + pin).on("value", (snap) => {
    hostGameData = snap.val();
    if (hostGameData) renderHostFromState();
  });
}

async function hostGeneratePin() {
  const btn = document.getElementById("btnGeneratePin");
  setBusy(btn, true);
  try {
    const pin = await generateUniquePin();
    const order = shuffle(QUESTIONS.map((_, i) => i));
    await db.ref("games/" + pin).set({
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      state: "lobby",
      order,
      qIndex: -1,
      qDuration: QUESTION_DURATION_MS,
      qStartedAt: null,
      teams: {},
    });
    currentPin = pin;
    revealTriggeredForQ = -1;
    localStorage.setItem("ak_host_pin", pin);
    document.getElementById("pinDigits").textContent = pin;
    document.getElementById("pinDigits").classList.remove("is-empty");
    document.getElementById("btnCopyLink").classList.remove("hidden");
    document.getElementById("lobbyTeamsCard").classList.remove("hidden");
    document.getElementById("copyLinkFeedback").innerHTML = "&nbsp;";
    subscribeHostToGame(pin);
  } catch (err) {
    alert("Could not create a game right now. " + describeFirebaseError(err));
  } finally {
    setBusy(btn, false);
  }
}

function copyPlayerLink() {
  const url = `${location.origin}${location.pathname}?play=1&pin=${currentPin}`;
  const feedback = document.getElementById("copyLinkFeedback");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        feedback.textContent = "Link copied! Share it with your players.";
      })
      .catch(() => {
        window.prompt("Copy this link and send it to your players:", url);
      });
  } else {
    window.prompt("Copy this link and send it to your players:", url);
  }
}

function renderLobbyTeams(g) {
  const teams = Object.values(g.teams || {}).sort(
    (a, b) => Number(a.teamNumber) - Number(b.teamNumber)
  );
  const countEl = document.getElementById("lobbyTeamCount");
  const chipsEl = document.getElementById("lobbyTeamChips");
  if (!countEl || !chipsEl) return;
  countEl.textContent = `${teams.length} joined`;
  chipsEl.innerHTML = teams.length
    ? teams
        .map(
          (t) =>
            `<span class="team-chip"><span class="team-chip__no">${escapeHtml(
              t.teamNumber
            )}</span>${escapeHtml(t.name || "")}</span>`
        )
        .join("")
    : '<div class="empty-note">Waiting for teams to join with the PIN above…</div>';
  const startBtn = document.getElementById("btnStartGame");
  startBtn.disabled = teams.length === 0 || g.state !== "lobby";
}

function renderHostFromState() {
  const g = hostGameData;
  if (!g) return;
  renderLobbyTeams(g);

  if (g.state === "lobby") {
    showScreen("screen-host-lobby");
    stopTimer();
  } else if (g.state === "question") {
    showScreen("screen-host-live");
    document.getElementById("hostQuestionPanel").classList.remove("hidden");
    document.getElementById("hostRevealPanel").classList.add("hidden");
    const qMeta = QUESTIONS[g.order[g.qIndex]];
    document.getElementById("hostCategory").textContent = qMeta.category;
    document.getElementById("hostProgress").textContent = `Question ${g.qIndex + 1} / ${g.order.length}`;
    document.getElementById("hostQuestionText").textContent = qMeta.q;

    const teams = g.teams || {};
    const teamCount = Object.keys(teams).length;
    const answers = (g.answers && g.answers[g.qIndex]) || {};
    const answeredCount = Object.keys(answers).length;
    document.getElementById("hostAnsweredCount").textContent = answeredCount;
    document.getElementById("hostTeamTotal").textContent = teamCount;

    ensureTimer(
      "h:" + g.qIndex,
      () => hostGameData.qStartedAt,
      g.qDuration || QUESTION_DURATION_MS,
      document.getElementById("hostTimerBar"),
      document.getElementById("hostTimerNum"),
      maybeAutoReveal
    );
    if (teamCount > 0 && answeredCount >= teamCount) {
      maybeAutoReveal();
    }
  } else if (g.state === "reveal") {
    showScreen("screen-host-live");
    document.getElementById("hostQuestionPanel").classList.add("hidden");
    document.getElementById("hostRevealPanel").classList.remove("hidden");
    stopTimer();
    renderLeaderboard(document.getElementById("hostLeaderboard"), g.teams, {
      title: `🏆 Standings after Question ${g.qIndex + 1}`,
    });
    const isLast = g.qIndex >= g.order.length - 1;
    document.getElementById("btnNextQuestion").textContent = isLast
      ? "Show Final Results 🏁"
      : "Next Question ▶";
  } else if (g.state === "ended") {
    stopTimer();
    renderLeaderboard(document.getElementById("finalLeaderboard"), g.teams, {
      title: "🏆 Final Results",
    });
    document.getElementById("finalHostActions").classList.remove("hidden");
    showScreen("screen-final");
  }
}

function maybeAutoReveal() {
  const g = hostGameData;
  if (!g || g.state !== "question") return;
  if (revealTriggeredForQ === g.qIndex) return;
  revealTriggeredForQ = g.qIndex;
  triggerReveal();
}

async function triggerReveal() {
  const g = hostGameData;
  if (!g || g.state !== "question") return;
  const qIdx = g.qIndex;
  const realQ = QUESTIONS[g.order[qIdx]];
  const answers = (g.answers && g.answers[qIdx]) || {};
  const teams = g.teams || {};
  const qStartedAt = g.qStartedAt;
  const duration = g.qDuration || QUESTION_DURATION_MS;

  const updates = {};
  Object.keys(answers).forEach((teamNo) => {
    const a = answers[teamNo];
    let points = 0;
    let correct = false;
    if (typeof a.choice === "number" && a.choice === realQ.correct) {
      correct = true;
      const submittedAt = typeof a.tSubmitted === "number" ? a.tSubmitted : qStartedAt + duration;
      const elapsedMs = Math.max(0, Math.min(duration, submittedAt - qStartedAt));
      const elapsedSec = elapsedMs / 1000;
      points = Math.max(0, round1(duration / 1000 - elapsedSec));
    }
    updates[`games/${currentPin}/answers/${qIdx}/${teamNo}/correct`] = correct;
    updates[`games/${currentPin}/answers/${qIdx}/${teamNo}/points`] = points;
    const prevScore = (teams[teamNo] && teams[teamNo].cumulativeScore) || 0;
    updates[`games/${currentPin}/teams/${teamNo}/cumulativeScore`] = round1(prevScore + points);
  });
  updates[`games/${currentPin}/state`] = "reveal";

  try {
    await db.ref().update(updates);
  } catch (err) {
    alert("Could not reveal results — check your connection. " + describeFirebaseError(err));
    revealTriggeredForQ = -1;
  }
}

function hostNextQuestion() {
  const g = hostGameData;
  if (!g) return;
  revealTriggeredForQ = -1;
  const nextIdx = g.qIndex + 1;
  if (nextIdx >= g.order.length) {
    db.ref("games/" + currentPin).update({ state: "ended" });
  } else {
    db.ref("games/" + currentPin).update({
      state: "question",
      qIndex: nextIdx,
      qStartedAt: firebase.database.ServerValue.TIMESTAMP,
    });
  }
}

// ==================================================================
// PLAYER
// ==================================================================

async function playerJoin(pin, teamNumber, playerName) {
  const gameRef = db.ref("games/" + pin);
  const snap = await gameRef.once("value");
  if (!snap.exists()) {
    throw new Error("No game found with that PIN. Double-check it with your host.");
  }
  const game = snap.val();
  if (game.state === "ended") {
    throw new Error("This game has already finished.");
  }
  const teamRef = gameRef.child("teams/" + teamNumber);
  const tSnap = await teamRef.once("value");
  if (!tSnap.exists()) {
    await teamRef.set({
      teamNumber: teamNumber,
      name: playerName,
      joinedAt: firebase.database.ServerValue.TIMESTAMP,
      cumulativeScore: 0,
    });
  } else {
    await teamRef.update({ name: playerName });
  }
  currentPin = pin;
  myTeamNumber = String(teamNumber);
  myPlayerName = playerName;
  currentRenderedQIndexForPlayer = -1;
  localStorage.setItem("ak_player", JSON.stringify({ pin, teamNumber, playerName }));
  subscribePlayerToGame(pin);
}

function subscribePlayerToGame(pin) {
  db.ref("games/" + pin).on("value", (snap) => {
    if (!snap.exists()) {
      handleGameGoneForPlayer();
      return;
    }
    playerGameData = snap.val();
    renderPlayerFromState();
  });
}

function handleGameGoneForPlayer() {
  stopTimer();
  localStorage.removeItem("ak_player");
  const card = document.querySelector("#screen-player-wait .card");
  if (card) {
    document.getElementById("playerWaitTitle").textContent = "Game not found";
    document.getElementById("playerWaitSub").textContent =
      "This game may have ended or the PIN changed. Ask your host for the new link.";
  }
  showScreen("screen-player-wait");
}

function renderPlayerFromState() {
  const g = playerGameData;
  if (!g) return;
  if (g.state === "lobby") {
    stopTimer();
    document.getElementById("playerWaitTitle").textContent = "You're in!";
    document.getElementById("playerWaitSub").textContent =
      "Hang tight — the host will start the game shortly.";
    document.getElementById("playerWaitChip").textContent = `Team #${myTeamNumber} · ${myPlayerName}`;
    showScreen("screen-player-wait");
  } else if (g.state === "question") {
    renderPlayerQuestion(g);
  } else if (g.state === "reveal") {
    renderPlayerReveal(g);
  } else if (g.state === "ended") {
    stopTimer();
    renderLeaderboard(document.getElementById("finalLeaderboard"), g.teams, {
      myTeamNumber,
      title: "🏆 Final Results",
    });
    document.getElementById("finalHostActions").classList.add("hidden");
    showScreen("screen-final");
  }
}

function renderPlayerQuestion(g) {
  const qMeta = QUESTIONS[g.order[g.qIndex]];
  const myAnswer = g.answers && g.answers[g.qIndex] && g.answers[g.qIndex][myTeamNumber];
  showScreen("screen-player-question");
  document.getElementById("pCategory").textContent = qMeta.category;
  document.getElementById("pProgress").textContent = `Question ${g.qIndex + 1} / ${g.order.length}`;
  document.getElementById("pQuestionText").textContent = qMeta.q;

  const grid = document.getElementById("pAnswersGrid");
  const shapes = ["▲", "◆", "●", "★"];
  if (currentRenderedQIndexForPlayer !== g.qIndex) {
    currentRenderedQIndexForPlayer = g.qIndex;
    grid.innerHTML = qMeta.options
      .map(
        (opt, i) => `
      <button class="answer-tile answer-tile--${i}" data-i="${i}" type="button">
        <span class="answer-tile__shape">${shapes[i]}</span><span>${escapeHtml(opt)}</span>
      </button>`
      )
      .join("");
    grid.querySelectorAll(".answer-tile").forEach((btn) => {
      btn.addEventListener("click", () => submitAnswer(Number(btn.dataset.i)));
    });
    document.getElementById("pWaitingNote").classList.add("hidden");
  }

  const waitingNote = document.getElementById("pWaitingNote");
  if (myAnswer) {
    waitingNote.classList.remove("hidden");
    grid.querySelectorAll(".answer-tile").forEach((btn) => {
      btn.disabled = true;
      if (Number(btn.dataset.i) === myAnswer.choice) btn.classList.add("is-selected");
    });
  }

  ensureTimer(
    "p:" + g.qIndex,
    () => playerGameData.qStartedAt,
    g.qDuration || QUESTION_DURATION_MS,
    document.getElementById("pTimerBar"),
    document.getElementById("pTimerNum"),
    () => {}
  );
}

async function submitAnswer(choiceIdx) {
  if (!playerGameData || playerGameData.state !== "question") return;
  const qIdx = playerGameData.qIndex;
  const existing =
    playerGameData.answers && playerGameData.answers[qIdx] && playerGameData.answers[qIdx][myTeamNumber];
  if (existing) return;

  document.querySelectorAll("#pAnswersGrid .answer-tile").forEach((btn) => (btn.disabled = true));
  document.getElementById("pWaitingNote").classList.remove("hidden");

  try {
    await db.ref(`games/${currentPin}/answers/${qIdx}/${myTeamNumber}`).set({
      choice: choiceIdx,
      tSubmitted: firebase.database.ServerValue.TIMESTAMP,
      playerName: myPlayerName,
    });
  } catch (err) {
    alert("Could not submit your answer — check your connection and try again.");
    document.querySelectorAll("#pAnswersGrid .answer-tile").forEach((btn) => (btn.disabled = false));
    document.getElementById("pWaitingNote").classList.add("hidden");
  }
}

function renderPlayerReveal(g) {
  showScreen("screen-player-reveal");
  stopTimer();
  const qIdx = g.qIndex;
  const qMeta = QUESTIONS[g.order[qIdx]];
  const mine = g.answers && g.answers[qIdx] && g.answers[qIdx][myTeamNumber];
  const banner = document.getElementById("pRevealBanner");

  if (mine && mine.correct) {
    banner.textContent = `✅ Correct! +${(mine.points || 0).toFixed(1)}s saved`;
    banner.className = "reveal-banner good";
  } else if (mine) {
    banner.textContent = `❌ Not quite — correct answer: ${qMeta.options[qMeta.correct]}`;
    banner.className = "reveal-banner bad";
  } else {
    banner.textContent = `⌛ Time's up — correct answer: ${qMeta.options[qMeta.correct]}`;
    banner.className = "reveal-banner bad";
  }
  renderLeaderboard(document.getElementById("pLeaderboard"), g.teams, { myTeamNumber });
}

// ==================================================================
// wiring + boot
// ==================================================================

function handleDeepLink() {
  const params = new URLSearchParams(location.search);
  if (params.get("play") === "1") {
    showScreen("screen-join");
    const pin = params.get("pin");
    if (pin) document.getElementById("joinPin").value = pin.replace(/\D/g, "").slice(0, 4);
  }
}

function tryRestorePlayerSession() {
  const saved = localStorage.getItem("ak_player");
  if (!saved) return false;
  try {
    const { pin, teamNumber, playerName } = JSON.parse(saved);
    if (!pin || teamNumber == null || !playerName) return false;
    currentPin = pin;
    myTeamNumber = String(teamNumber);
    myPlayerName = playerName;
    showScreen("screen-player-wait");
    subscribePlayerToGame(pin);
    return true;
  } catch (e) {
    return false;
  }
}

function tryRestoreHostSession() {
  const pin = localStorage.getItem("ak_host_pin");
  if (!pin) return false;
  currentPin = pin;
  document.getElementById("pinDigits").textContent = pin;
  document.getElementById("pinDigits").classList.remove("is-empty");
  document.getElementById("btnCopyLink").classList.remove("hidden");
  document.getElementById("lobbyTeamsCard").classList.remove("hidden");
  subscribeHostToGame(pin);
  return true;
}

function wireButtons() {
  document.getElementById("btnGoHost").addEventListener("click", () => showScreen("screen-host-login"));
  document.getElementById("btnGoPlayer").addEventListener("click", () => showScreen("screen-join"));
  document.getElementById("btnBackFromHostLogin").addEventListener("click", () => showScreen("screen-home"));
  document.getElementById("btnBackFromJoin").addEventListener("click", () => showScreen("screen-home"));

  document.getElementById("formHostLogin").addEventListener("submit", (e) => {
    e.preventDefault();
    const val = document.getElementById("hostPassword").value;
    const errEl = document.getElementById("hostLoginError");
    if (val === HOST_PASSWORD) {
      errEl.textContent = "";
      document.getElementById("hostPassword").value = "";
      showScreen("screen-host-lobby");
    } else {
      errEl.textContent = "Incorrect password.";
    }
  });

  document.getElementById("btnGeneratePin").addEventListener("click", hostGeneratePin);
  document.getElementById("btnCopyLink").addEventListener("click", copyPlayerLink);
  document.getElementById("btnStartGame").addEventListener("click", () => {
    db.ref("games/" + currentPin).update({
      state: "question",
      qIndex: 0,
      qStartedAt: firebase.database.ServerValue.TIMESTAMP,
    });
  });
  document.getElementById("btnRevealNow").addEventListener("click", () => {
    if (hostGameData && revealTriggeredForQ !== hostGameData.qIndex) {
      revealTriggeredForQ = hostGameData.qIndex;
      triggerReveal();
    }
  });
  document.getElementById("btnNextQuestion").addEventListener("click", hostNextQuestion);
  document.getElementById("btnNewGame").addEventListener("click", () => {
    localStorage.removeItem("ak_host_pin");
    localStorage.removeItem("ak_player");
    location.href = location.pathname;
  });

  document.getElementById("joinPin").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
  });
  document.getElementById("joinTeamNumber").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  document.getElementById("formJoin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const teamNumber = document.getElementById("joinTeamNumber").value.trim();
    const playerName = document.getElementById("joinPlayerName").value.trim();
    const pin = document.getElementById("joinPin").value.trim();
    const errEl = document.getElementById("joinError");
    errEl.textContent = "";
    if (!teamNumber || !playerName || pin.length !== 4) {
      errEl.textContent = "Please fill in team number, player name, and a 4-digit PIN.";
      return;
    }
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setBusy(submitBtn, true);
    try {
      await playerJoin(pin, teamNumber, playerName);
      showScreen("screen-player-wait");
      document.getElementById("playerWaitTitle").textContent = "You're in!";
      document.getElementById("playerWaitSub").textContent =
        "Hang tight — the host will start the game shortly.";
      document.getElementById("playerWaitChip").textContent = `Team #${teamNumber} · ${playerName}`;
    } catch (err) {
      errEl.textContent = err.message || "Could not join. Please try again.";
    } finally {
      setBusy(submitBtn, false);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fitTitleLine();
  window.addEventListener("resize", () => requestAnimationFrame(fitTitleLine));
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitTitleLine).catch(() => {});
  }

  wireButtons();

  if (!initFirebase()) return;

  handleDeepLink();

  const params = new URLSearchParams(location.search);
  const isPlayLink = params.get("play") === "1";

  if (!isPlayLink) {
    if (tryRestorePlayerSession()) {
      // resumed as a player
    } else if (tryRestoreHostSession()) {
      // resumed as host
    } else {
      showScreen("screen-home");
    }
  }
});
