/*
  Aapna Kahoot — Firebase connection settings
  ============================================
  This is the ONLY file you need to edit before the game will work.
  Every phone that joins a game talks to each other through this
  Firebase project, so it needs to be set up once. It takes about
  2 minutes and costs nothing for a group this size.

  HOW TO GET THESE VALUES
  1. Go to https://console.firebase.google.com/ and sign in with any
     Google account.
  2. Click "Add project" → give it any name (e.g. "aapna-kahoot") →
     you can skip Google Analytics → click "Create project".
  3. On the project's home screen, click the "</>" (Web) icon to
     register a web app. Give it a nickname and click "Register app".
  4. Firebase shows you a `firebaseConfig` object — copy those values
     into the object below, replacing the PASTE_... placeholders.
  5. In the left-hand menu, go to Build → Realtime Database →
     "Create Database" → choose any location close to India →
     start in "Test mode" (lets the app read/write; see the security
     note at the bottom of the README before using this for anything
     beyond a private event).
  6. Save this file and push it to GitHub along with the rest of the
     site — see README.md for the GitHub Pages steps.
*/
const firebaseConfig = {
  apiKey: "AIzaSyCdpcbwv7asKSZcdE154Ik6Bwlp8KIofJ4",
  authDomain: "aapna-kahoot.firebaseapp.com",
  databaseURL: "https://PASTE_YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "aapna-kahoot",
  storageBucket: "aapna-kahoot.firebasestorage.app",
  messagingSenderId: "677225599615",
  appId: "1:677225599615:web:050395306e0c5000b5a54a",
};
