EZEE VISION CHAMPUA — PHASE 0 FOUNDATION + PWA
================================================

WHAT THIS BUILD INCLUDES
- Mobile-first login and student sign-up interface.
- Firebase Auth using mobile-derived internal email + password (no SMS OTP).
- Student profile is written at users/{Firebase Auth UID} with role=student and status=pending.
- Four trusted teacher accounts use the same login pattern and must have users/{UID} profiles.
- Root manifest.webmanifest, sw.js, app icons (192/512), Apple touch icon.
- Local app-shell offline cache. Firebase Authentication/Firestore/network requests are NOT cached.
- Floating WhatsApp support number +91 91244 78453.

PWA INSTALLATION
1. Upload all ZIP contents to the ROOT of the GitHub repository connected to Netlify.
2. Keep index.html, manifest.webmanifest, sw.js, firebase-config.js at repository root.
3. Commit; wait for Netlify deployment.
4. Open https://ezeevisionchampua.netlify.app in Chrome Android.
5. Open Chrome menu (⋮) > Install app. If not visible, choose Add to Home screen.
6. PWA installability needs HTTPS and the manifest/icons. Chrome may apply user engagement and browser/device eligibility checks.
7. First visit must be online so app shell can be cached. Offline mode shows cached app shell/offline message only; Firebase login, database and WhatsApp still require internet.

FIRESTORE DATA STRUCTURE — VERY IMPORTANT
All account profiles must be documents inside ONE root collection named exactly:
users

Path examples:
users/{teacher1-auth-uid}
users/{teacher2-auth-uid}
users/{teacher3-auth-uid}
users/{teacher4-auth-uid}
users/{student-auth-uid}

Do NOT create users2, users3, users4 or users5. Those are separate, incorrect collection names for this app. Do not delete them yet; verify/copy any needed records into root users first.

Each teacher document must have:
name (string), mobile (string: ten digits without +91), role (string: teacher),
status (string: approved), createdAt (timestamp), updatedAt (timestamp).
Document ID MUST exactly equal the matching Firebase Authentication UID.
The four known teacher phone numbers are listed in TEACHERS.txt.

STUDENT PROFILE
The current bootstrap signup creates users/{auth.uid} automatically with:
name, mobile, role=student, status=pending, createdAt, updatedAt.
The final admission/unique Student ID linking will be added in the Smart Student Management phase.

PUBLISH RULES
Firebase Console > project ezee-vision-champua-6638d > Firestore Database > Rules.
Paste firestore.rules from this ZIP and Publish. Do not use open/public rules.
Add ezeevisionchampua.netlify.app under Firebase Authentication > Settings > Authorized domains.
Enable Email/Password provider.

IMPORTANT RECOVERY OF EXISTING AUTH ACCOUNT
If Auth account exists but profile was mistakenly created under users5 (or users2 etc.), login will say profile not found. Firestore Console cannot move a document. Create/copy a document in root users with document ID exactly equal to the Auth UID, the correct name/mobile/role/status/timestamps. Teacher profile: role=teacher, status=approved. Student profile: role=student, status=pending (until approved). Do not create another Authentication user for the same mobile. Keep the incorrect old collection temporarily; delete it only after confirming no required data remains.

PWA LIMITATION
This is an installable web app/PWA, not an APK. It can be installed from Chrome while hosted over HTTPS. Later, this same web app can be packaged as an Android app and prepared for Play Store release after full testing and policy compliance.
