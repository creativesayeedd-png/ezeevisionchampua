EZEE VISION CHAMPUA — PHASE 2: FIREBASE AUTH + SUPPORT
======================================================

IS BUILD ME KYA ACTIVE HAI
- Real Firebase Email/Password Authentication.
- Student sign-up: Name + Indian mobile + password + confirm password.
- Mobile number ke peeche internal login email generate hota hai:
  10-digit mobile 9876543210 -> 919876543210@login.ezeevisionchampua.com
  Student ko ye internal email kabhi enter nahi karna hai.
- Firebase Auth session LOCAL persistence par set hai. Logout ke baad same mobile/password se login.
- Student profile Firestore ke users/{uid} me save hota hai.
- New student status = pending; teacher approval ke baad hi portal access.
- Teacher role public sign-up se create nahi ho sakta.
- Login ke baad approved/pending status screen.
- Forgot Password WhatsApp recovery request open karta hai (manual verification; SMS OTP nahi).
- Bottom-right animated WhatsApp support button.

IMPORTANT: PASSWORD SECURITY
- Password Firestore me store nahi hota. Firebase Authentication password ko securely manage karta hai.
- Internal login email fake/inbox-less identifier hai. Isliye Firebase ka email reset link deliver nahi ho sakta.
- Forgot Password button WhatsApp support request bhejta hai. Teacher pehle student identity verify karega.
- Is current build me automated self-service password reset nahi hai. SMS OTP ya verified real email ke bina secure automatic recovery available nahi hoti.
- WhatsApp par kabhi password ya OTP mat bhejna.

STEP 1 — WHATSAPP SUPPORT NUMBER SET KARO
1. GitHub me assets/js/settings.js open karo.
2. whatsappSupportNumber me 91XXXXXXXXXX ko institute ke WhatsApp number se replace karo.
3. Sirf digits likho: India country code + 10-digit number. +, spaces ya dash mat lagao.
   Example format: 919876543210 (ye sirf format example hai, actual support number nahi).
4. Commit changes.

STEP 2 — FIREBASE AUTHENTICATION ON KARO
1. Firebase Console > Authentication > Sign-in method.
2. Email/Password provider enable karo (Email link/passwordless ki zaroorat nahi).
3. Authentication > Settings > Authorized domains me ezeevisionchampua.netlify.app add karo.
4. Save karo.

STEP 3 — FIRESTORE SECURITY RULES PUBLISH KARO
1. Firebase Console > Firestore Database > Rules.
2. Is ZIP ke firestore.rules file ka poora content copy karo.
3. Firebase Rules editor me existing content replace karke Publish dabao.
4. Student signup test karne se pehle rules publish hona zaroori hai.
5. Production rules ko kabhi allow read, write: if true mat banana.

STEP 4 — FIVE TEACHER ACCOUNTS PRE-CREATE KARO
Teacher accounts public Sign Up se nahi banenge.
Har teacher ke liye:
A. Firebase Console > Authentication > Users > Add user.
B. Email field me is format ka internal ID use karo:
   91 + teacher ke 10 digit mobile + @login.ezeevisionchampua.com
   Example format: 919876543210@login.ezeevisionchampua.com
C. Teacher ka initial password set karo aur securely teacher ko privately do.
D. Created user ka UID copy karo.
E. Firestore Data me users collection > Add document. Document ID = copied UID.
F. Ye fields add karo:
   name       string     (teacher ka naam)
   mobile     string     (10 digit mobile, +91 ke bina)
   role       string     teacher
   status     string     approved
   createdAt  timestamp  current date/time
   updatedAt  timestamp  current date/time
G. Ye process sabhi 5 teachers ke liye repeat karo. Sabhi 5 teachers ko equal teacher permissions milengi.

STEP 5 — NETLIFY / GITHUB DEPLOY
1. ZIP extract karo.
2. ZIP ke andar ki files/folders ko GitHub repository ke ROOT me upload karo.
3. index.html root me hona chahiye. Folder ke andar extra folder me index.html mat rakho.
4. Commit changes. Netlify automatic redeploy karega.
5. Browser me site refresh karke sign-up test karo.

LOGIN / SIGN-UP FLOW
- Student apne naam, mobile aur password se account banata hai.
- Firebase Authentication account create karta hai; Firestore profile pending status me save hoti hai.
- Sign up karne ke baad user pending approval screen dekhega.
- Teacher Firebase Console me student profile status ko approved karega (ya future Teacher Portal se approve karega).
- Student logout ho kar same mobile + same password se login kar sakta hai.
- Approved account ko abhi access-verified screen milegi. Actual Teacher/Student dashboards next module me banenge.

SECURITY NOTES
- Firebase web config public client configuration hai; Admin SDK private key/service account JSON is ZIP me kabhi mat daalna.
- Teacher accounts sirf trusted admin manually pre-create kare.
- Firestore Rules hi actual permissions enforce karti hain; UI hide karna security nahi hota.
- Current rules teacher ko full access deti hain. Student-specific collection rules agle data modules ke saath add karni hongi.
- Five teacher accounts aur real WhatsApp support number configure kiye bina production launch complete nahi hai.
