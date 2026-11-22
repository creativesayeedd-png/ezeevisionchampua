/*
 * Firebase web configuration for EZEE VISION CHAMPUA.
 * This browser config is not a service-account secret.
 * Keep Firestore/Storage secured with Firebase Security Rules.
 */
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
    console.error("EZEE VISION CHAMPUA: Firebase SDK did not load. Check internet/CDN scripts.");
    return;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

    window.evcFirebase = {
      app: firebase.app(),
      auth: firebase.auth(),
      db: firebase.firestore()
    };

    console.info("EZEE VISION CHAMPUA: Firebase SDK initialized", {
      projectId: firebase.app().options.projectId
    });
    window.dispatchEvent(new Event("evc-firebase-ready"));
  } catch (error) {
    console.error("EZEE VISION CHAMPUA: Firebase initialization failed", error);
  }
})();
