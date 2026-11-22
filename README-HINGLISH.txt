EZEE VISION CHAMPUA — FRESH STARTER PROJECT
============================================

Is ZIP mein purani HTML file ki zaroorat nahi hai. Fresh project files already included hain.

ZIP KE ANDAR:
1. index.html              — website ka starting page
2. firebase-config.js      — aapke Firebase project ki web configuration
3. assets/css/style.css   — blue + orange responsive design
4. assets/js/app.js       — Firebase initialization status screen par dikhata hai

AB KYA KARNA HAI:
1. ZIP ko extract karein.
2. Extract hue folder ke andar ki saari files GitHub repository ke ROOT mein upload karein.
   Dhyan rahe: index.html root mein hona chahiye, kisi extra nested folder ke andar nahi.
3. Netlify mein isi repository ko connect karein.
4. Publish directory ko root/default (.) rakhein. Build command ki zaroorat nahi hai.
5. Website open karein. Firebase status mein "Firebase SDK initialized" dikhna chahiye.

FIREBASE PROJECT:
Project ID: ezee-vision-champua-6638d
Web app: EZEE VISION CHAMPUA WEB

IMPORTANT:
- Yeh starter Firebase SDK ko initialize karta hai; abhi login, registration, teacher accounts,
  student approval, attendance, fees ya dashboard features implement nahi kiye gaye hain.
- Agle development steps mein mobile number + password login banega. SMS OTP use nahi karenge.
- Sirf 2 portals honge: Teacher aur Student. 5 approved teachers ko same full permissions milengi.
- Firestore Security Rules zaroori hain. Sirf front-end hide/show se data secure nahi hota.
- firebase-config.js mein web app config hota hai. Kabhi bhi Firebase service-account private key,
  admin SDK key, password ya private credential website/GitHub mein upload mat karein.
- Firebase Auth mein apni deployed Netlify domain ko Authorized domains mein add karna hoga,
  jab actual domain mil jaaye aur login implement ho.

Firebase SDK CDN version: 13.4.0
Reference: https://firebase.google.com/docs/web/setup
