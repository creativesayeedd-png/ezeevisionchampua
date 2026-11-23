EZEE VISION CHAMPUA — VERCEL + GITHUB PAGES COMPATIBLE PWA BUILD
================================================================

WHAT THIS UPDATE FIXES
- Restores the approved Welcome Back / blue hero / white rounded card layout.
- Uses the supplied EV gold logo asset (same source image as the accepted reference).
- Replaces Unicode phone, lock, eye and WhatsApp symbols with clean inline SVG icons.
- Keeps the animated WhatsApp support button at the bottom-right, above toast messages.
- Uses relative paths for CSS, images, manifest, Firebase scripts and Service Worker.
- Service Worker scope and cache URLs adapt to both a domain root (Vercel) and a GitHub Pages subpath.
- Bumps the PWA cache name so the older cached interface is replaced.
- Displays the specific Firebase error code instead of a generic message.
- Recovers a student Auth account left over when an earlier signup did not save its Firestore profile,
  provided the same original password is entered and the mobile is not one of the 4 teacher numbers.

FILES
- index.html
- assets/css/app.css
- assets/js/app.js
- assets/js/settings.js
- assets/images/ (original logo and PWA icons)
- firebase-config.js
- firestore.rules
- manifest.webmanifest
- sw.js
- offline.html
- vercel.json
- FIREBASE-PROFILE-FIX-HINGLISH.txt

UPLOAD TO VERCEL
1. Download and extract this ZIP.
2. Upload the CONTENTS of this folder to the ROOT of the GitHub repository connected to Vercel.
3. Check that index.html is directly at the root (not inside a nested project folder).
4. Commit the upload. Vercel should create a new deployment.
5. In Vercel Project Settings > Build & Deployment:
   - Framework Preset: Other
   - Root Directory: ./ (repository root)
   - Build Command: leave blank
   - Output Directory: . (repository root)
6. Wait for the deployment to become Ready.

FIREBASE HOST DOMAIN
Firebase Console > Authentication > Settings > Authorized domains.
Add the exact Vercel hostname (for example, evc-project.vercel.app), without https:// and without a path.
Keep ezeevisionchampua.netlify.app only if you still use that old domain too.

IMPORTANT ACCOUNT DATA FIX
The app reads profiles only from users/{Firebase Auth UID}.
Earlier screenshots showed separate collections users, users2, users3, users4, users5.
Do not create new separate collections. Copy each teacher/student profile into the SAME root-level
users collection, using that account's exact Firebase Authentication UID as the document ID.
Follow FIREBASE-PROFILE-FIX-HINGLISH.txt carefully. Do not delete the old collections until all logins work.

TEST LOGIN
- Teacher login: use one of the 4 pre-created teacher mobile numbers and that account's existing password.
- Student login: use the registered mobile and the same password used when the Auth account was created.
- New public signups are always student + pending. Public signup cannot create a teacher.
- Passwords are handled only by Firebase Authentication, never saved in Firestore.

PWA INSTALL
- Open the Vercel deployment URL in Android Chrome.
- Refresh once after deployment; allow the new Service Worker to install.
- Chrome menu > Install app (or Add to Home Screen).
- If an older screen remains cached, clear this site's stored data once in Chrome Site settings, then reopen.
- The app shell can load offline after caching. Firebase data/login still needs internet.

SECURITY
- Firestore rules are included; publish them in Firebase project ezee-vision-champua-6638d.
- Never use public Firestore rules.
- Never upload Firebase Admin private keys or service-account JSON.
- The current build is still the authentication foundation; Teacher and Student dashboards will be developed next.
