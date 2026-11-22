/* Firebase browser configuration. Never place Admin SDK private keys here. */
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyCXz7ObHzAok1eH_RDzudkWclisBrsNM8",
    authDomain: "ezee-vision-champua-6638d.firebaseapp.com",
    projectId: "ezee-vision-champua-6638d",
    storageBucket: "ezee-vision-champua-6638d.firebasestorage.app",
    messagingSenderId: "82869465984",
    appId: "1:82869465984:web:ca631f955365de7dabc765"
  };
  if (!window.firebase) {
    console.error('Firebase SDK failed to load. Check connectivity.');
    window.evcFirebaseError = 'sdk-not-loaded';
    return;
  }
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    window.evcFirebase = { app: firebase.app(), auth: firebase.auth(), db: firebase.firestore() };
    window.dispatchEvent(new Event('evc-firebase-ready'));
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    window.evcFirebaseError = error.code || 'initialization-failed';
  }
})();
