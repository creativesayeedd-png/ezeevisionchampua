/* EZEE VISION CHAMPUA — Firebase bootstrap
 * Add Firebase compat SDK scripts before this file in your HTML.
 * This file contains public web-app configuration, never Admin SDK secrets.
 */
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyCXz7ObHzAok1eH_RDzudkWclisBrsNMl8",
    authDomain: "ezee-vision-champua-6638d.firebaseapp.com",
    projectId: "ezee-vision-champua-6638d",
    storageBucket: "ezee-vision-champua-6638d.firebasestorage.app",
    messagingSenderId: "82869465984",
    appId: "1:82869465984:web:ca631f955365de7dabc765"
  };

  if (!window.firebase) {
    console.error("Firebase SDK is missing. Load app-compat, auth-compat and firestore-compat first.");
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  window.evcFirebase = {
    app: firebase.app(),
    auth: firebase.auth(),
    db: firebase.firestore()
  };

  console.info("EZEE VISION CHAMPUA: Firebase initialized", {
    projectId: firebase.app().options.projectId,
    authReady: !!window.evcFirebase.auth,
    firestoreReady: !!window.evcFirebase.db
  });
  window.dispatchEvent(new Event("evc-firebase-ready"));
})();
