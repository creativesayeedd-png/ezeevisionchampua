EZEE VISION CHAMPUA — LOGIN / SIGN-UP APP INTERFACE
==================================================

WHAT IS INCLUDED
- index.html: mobile-first app-style login and student sign-up screen
- assets/css/app.css: responsive navy, white and gold interface
- assets/js/app.js: login/sign-up screen switch, password visibility, input validation and honest prototype messages
- assets/images/ezee-vision-logo.png: the logo supplied for this project
- firebase-config.js: your existing Firebase web configuration bootstrap

DEPLOY ON NETLIFY (GITHUB METHOD)
1. Extract this ZIP on your phone/computer.
2. Open your GitHub repository used by Netlify.
3. Upload the CONTENTS of this folder to the repository root (not the outer folder itself).
4. Make sure index.html is directly in the repository root.
5. Commit the changes. Netlify should redeploy automatically.

IMPORTANT STATUS
This delivery is the front-end interface prototype, not the completed authentication system.
The buttons validate the input and show clear prototype messages; they do NOT create accounts or sign users in yet.
Firebase configuration is included but is not connected to the form handlers in this build.
Next implementation step: Firebase Authentication using mobile-number-derived internal email + password,
Firestore user profiles, pending student approval, and five pre-approved teacher accounts.

SECURITY
- Never put Firebase Admin SDK service-account credentials in this front-end project.
- Do not let a public sign-up form assign the teacher role.
- Enforce teacher/student permissions in Firestore Security Rules.
