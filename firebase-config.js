/*
  Aapna Kahoot — Firebase connection settings
  ============================================
  These values connect the game to your Firebase Realtime Database
  (project: aapna-kahoot), which is what lets the host's screen and
  every player's phone stay in sync.

  These are client-side Firebase config values. They are meant to be
  visible in a web page's source — they identify your project, they
  are not passwords. What actually protects your data is the database
  Rules tab in the Firebase console (see README.md).

  If you ever need to find these again: Firebase console → Settings →
  General → scroll to "Your apps" → your web app.
*/
const firebaseConfig = {
  apiKey: "AIzaSyCdpcbwv7asKSZcdE154Ik6Bwlp8KIofJ4",
  authDomain: "aapna-kahoot.firebaseapp.com",
  databaseURL: "https://aapna-kahoot-default-rtdb.firebaseio.com",
  projectId: "aapna-kahoot",
  storageBucket: "aapna-kahoot.firebasestorage.app",
  messagingSenderId: "677225599615",
  appId: "1:677225599615:web:050395306e0c5000b5a54a",
};
