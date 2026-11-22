(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const settings = window.EVC_SETTINGS || {};
  const auth = window.evcFirebase?.auth || null;
  const db = window.evcFirebase?.db || null;
  let busy = false, deferredInstallPrompt = null, toastTimer;

  function toast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 4500);
  }
  function mobile(value) { return String(value || '').replace(/\D/g, '').slice(-10); }
  function validMobile(value) { return /^[6-9]\d{9}$/.test(value); }
  function loginEmail(value) { return `91${value}@login.ezeevisionchampua.com`; }
  function errorText(error) {
    const code = error?.code || '';
    const map = {
      'auth/invalid-credential': 'Mobile number ya password galat hai.',
      'auth/user-not-found': 'Is mobile number ka account nahi mila.',
      'auth/wrong-password': 'Password galat hai.',
      'auth/email-already-in-use': 'Ye mobile number pehle se registered hai. Login karein.',
      'auth/weak-password': 'Kam se kam 8 characters ka password rakhein.',
      'auth/too-many-requests': 'Bahut attempts hue. Thodi der baad try karein.',
      'auth/network-request-failed': 'Internet connection check karein.',
      'permission-denied': 'Firestore Rules ne request reject ki. Correct project ke Rules tab mein supplied rules Publish karein.',
      'firestore/permission-denied': 'Firestore permission denied. Rules aur project ID verify karein.'
    };
    if (map[code]) return map[code];
    if (/permission-denied/i.test(error?.message || '')) return map['permission-denied'];
    return 'Request complete nahi hui. Firebase Console mein Auth/Firestore error verify karein.';
  }
  function switchMode(signup) {
    $('loginForm').classList.toggle('hidden', signup);
    $('signupForm').classList.toggle('hidden', !signup);
    $('formTitle').textContent = signup ? 'Create your student account' : 'Sign in to your account';
    $('formDescription').textContent = signup ? 'Register once. Your details will be saved securely.' : 'Enter your registered mobile number and password.';
    $('switchText').textContent = signup ? 'Already registered?' : 'New to EZEE VISION?';
    $('switchBtn').textContent = signup ? 'Login' : 'Create account';
    document.querySelector('.hero-title h1').innerHTML = signup ? 'Create Your Account<span>.</span>' : 'Welcome Back<span>!</span>';
  }
  $('switchBtn').addEventListener('click', () => switchMode($('signupForm').classList.contains('hidden')));
  document.querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const input = $(btn.dataset.toggle); input.type = input.type === 'password' ? 'text' : 'password';
  }));
  document.querySelectorAll('input[inputmode="numeric"]').forEach(input => input.addEventListener('input', () => input.value = input.value.replace(/\D/g, '').slice(0,10)));

  async function showProfile(user) {
    const snap = await db.collection('users').doc(user.uid).get();
    if (!snap.exists) throw new Error('PROFILE_NOT_FOUND');
    const profile = snap.data();
    $('authViews').classList.add('hidden'); $('accountPanel').classList.remove('hidden');
    $('profileName').textContent = profile.name || user.displayName || 'Member';
    $('profileRole').textContent = profile.role || 'Unknown'; $('profileStatus').textContent = profile.status || 'Unknown';
    if (profile.status === 'pending') {
      $('stateKicker').textContent = 'REGISTRATION RECEIVED'; $('stateTitle').textContent = 'Waiting for teacher approval';
      $('stateMessage').textContent = 'Your account is saved. A teacher must approve the student profile before you can access learning records.';
    } else if (profile.status === 'approved' && ['student','teacher'].includes(profile.role)) {
      $('stateKicker').textContent = `${profile.role.toUpperCase()} ACCESS VERIFIED`; $('stateTitle').textContent = `Welcome, ${(profile.name || 'Member').split(' ')[0]}!`;
      $('stateMessage').textContent = 'Account verified. Teacher and Student dashboards will be connected in the next phase.';
    } else {
      $('stateKicker').textContent = 'ACCESS NOT ACTIVE'; $('stateTitle').textContent = 'Please contact institute support';
      $('stateMessage').textContent = 'This profile is not approved for portal access.';
    }
  }
  async function handleSignup(event) {
    event.preventDefault(); if (busy) return;
    const name = $('signupName').value.trim().replace(/\s+/g,' '), number = mobile($('signupMobile').value);
    const password = $('signupPassword').value, confirm = $('signupConfirm').value;
    if (name.length < 2) return toast('Full name enter karein.');
    if (!validMobile(number)) return toast('Valid 10-digit Indian mobile number enter karein.');
    if (password.length < 8) return toast('Password kam se kam 8 characters ka hona chahiye.');
    if (password !== confirm) return toast('Dono passwords match nahi kar rahe.');
    if (!auth || !db) return toast('Firebase SDK initialize nahi hua. Project configuration check karein.');
    busy = true;
    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      const cred = await auth.createUserWithEmailAndPassword(loginEmail(number), password);
      const profile = {name, mobile:number, role:'student', status:'pending', createdAt:firebase.firestore.FieldValue.serverTimestamp(), updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
      await db.collection('users').doc(cred.user.uid).set(profile);
      try { await cred.user.updateProfile({displayName:name}); } catch (_) {}
      $('signupForm').reset();
      await showProfile(cred.user);
      toast('Student account successfully saved. Teacher approval pending.');
    } catch (error) {
      console.error('Student signup failed', error);
      if (error.message === 'PROFILE_NOT_FOUND') toast('Authentication account bana, lekin users/{UID} profile save nahi hua. Firebase Firestore Rules aur collection path check karein.');
      else if (error.code === 'auth/email-already-in-use') toast('Is mobile ka Authentication account already hai. Signup repeat na karein; existing account login karein.');
      else toast(errorText(error));
      if (auth.currentUser) { try { await auth.signOut(); } catch (_) {} }
    } finally { busy = false; }
  }
  async function handleLogin(event) {
    event.preventDefault(); if (busy) return;
    const number = mobile($('loginMobile').value), password = $('loginPassword').value;
    if (!validMobile(number)) return toast('Valid 10-digit mobile number enter karein.');
    if (!password) return toast('Password enter karein.');
    if (!auth || !db) return toast('Firebase connection ready nahi hai.');
    busy = true;
    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      const cred = await auth.signInWithEmailAndPassword(loginEmail(number), password);
      await showProfile(cred.user);
      $('loginForm').reset(); toast('Login successful.');
    } catch(error) {
      console.error('Login/profile check failed', error);
      if (error.message === 'PROFILE_NOT_FOUND') {
        try { await auth.signOut(); } catch (_) {}
        toast('Authentication account exists, but users/{UID} profile is missing. Check exact root collection users and exact Auth UID.');
      } else toast(errorText(error));
    } finally { busy = false; }
  }
  $('loginForm').addEventListener('submit', handleLogin); $('signupForm').addEventListener('submit', handleSignup);
  $('logoutBtn').addEventListener('click', async () => { if (auth) await auth.signOut(); $('accountPanel').classList.add('hidden'); $('authViews').classList.remove('hidden'); switchMode(false); toast('Signed out.'); });
  $('refreshBtn').addEventListener('click', async () => { if (auth?.currentUser) { try { await showProfile(auth.currentUser); toast('Account status refreshed.'); } catch(e) { toast(errorText(e)); } } });

  const waNumber = String(settings.whatsappSupportNumber || '919124478453').replace(/\D/g,'');
  function wa(message) { if (!/^\d{10,15}$/.test(waNumber)) return toast('WhatsApp support number configure karein.'); window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`,'_blank','noopener'); }
  $('forgotBtn').addEventListener('click', () => { $('recoveryMobile').value = mobile($('loginMobile').value); $('recovery').classList.remove('hidden'); });
  $('closeRecovery').addEventListener('click', () => $('recovery').classList.add('hidden'));
  $('sendRecovery').addEventListener('click', () => { const n = mobile($('recoveryMobile').value); if (!validMobile(n)) return toast('Registered 10-digit mobile number enter karein.'); wa(`Assalamu Alaikum EZEE VISION CHAMPUA Support, I need help recovering my app password. Registered mobile: +91 ${n}. Please verify my identity and guide me through a secure reset. I will not share my old password or OTP.`); $('recovery').classList.add('hidden'); });

  if (auth && db) auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => auth.onAuthStateChanged(async user => {
    if (!user) return;
    try { await showProfile(user); } catch (e) { console.warn('Session profile not available', e); }
  }));

  // PWA install prompt (browser decides when the install prompt is eligible).
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); deferredInstallPrompt = event; $('installBtn').classList.remove('hidden');
  });
  $('installBtn').addEventListener('click', async () => {
    if (!deferredInstallPrompt) { toast('Chrome menu ⋮ > Install app ya Add to Home screen select karein.'); return; }
    deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; $('installBtn').classList.add('hidden');
  });
  window.addEventListener('appinstalled', () => { $('installBtn').classList.add('hidden'); toast('EZEE VISION CHAMPUA installed.'); });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js', {scope:'/'}).then(reg => {
      reg.addEventListener('updatefound', () => console.info('EVC PWA update is downloading.'));
      console.info('EVC Service Worker registered:', reg.scope);
    }).catch(err => console.error('EVC Service Worker registration failed:', err)));
  }
})();
