(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const loginForm = $('loginForm');
  const signupForm = $('signupForm');
  const authViews = $('authViews');
  const accountPanel = $('accountPanel');
  const switchBtn = $('switchBtn');
  const switchLine = $('switchLine');
  const formTitle = $('formTitle');
  const formDescription = $('formDescription');
  const heroTitle = $('heroTitle');
  const toast = $('toast');
  const recoveryModal = $('recoveryModal');
  const settings = window.EVC_SETTINGS || {};
  const firebaseReady = Boolean(window.evcFirebase && window.evcFirebase.auth && window.evcFirebase.db);
  const auth = firebaseReady ? window.evcFirebase.auth : null;
  const db = firebaseReady ? window.evcFirebase.db : null;
  let toastTimer;
  let busy = false;
  let currentUser = null;
  let currentProfile = null;

  function showToast(message, duration = 4200) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function setBusy(form, isBusy, buttonText) {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = isBusy;
    button.classList.toggle('is-loading', isBusy);
    if (isBusy) {
      button.dataset.originalText = button.querySelector('span').textContent;
      button.querySelector('span').textContent = buttonText || 'Please wait…';
    } else {
      button.querySelector('span').textContent = button.dataset.originalText || buttonText || 'Continue';
    }
  }

  function setMode(mode) {
    const isSignup = mode === 'signup';
    loginForm.classList.toggle('is-hidden', isSignup);
    signupForm.classList.toggle('is-hidden', !isSignup);
    formTitle.textContent = isSignup ? 'Create your student account' : 'Sign in to your account';
    formDescription.textContent = isSignup
      ? 'Register once. Your details will be saved securely.'
      : 'Enter your registered mobile number and password.';
    heroTitle.innerHTML = isSignup ? 'Create Your Account<span>.</span>' : 'Welcome Back<span>!</span>';
    switchLine.querySelector('span').textContent = isSignup ? 'Already registered?' : 'New to EZEE VISION?';
    switchBtn.textContent = isSignup ? 'Login' : 'Create account';
  }

  function cleanMobile(value) {
    return String(value || '').replace(/\D/g, '').slice(-10);
  }

  function validMobile(mobile) {
    return /^[6-9]\d{9}$/.test(mobile);
  }

  // Firebase Email/Password is used behind the scenes; students only see their mobile number.
  function mobileLoginEmail(mobile) {
    return `91${mobile}@login.ezeevisionchampua.com`;
  }

  function firebaseErrorMessage(error) {
    const code = error && error.code ? error.code : '';
    const messages = {
      'auth/invalid-email': 'Account login ID is not valid. Please contact institute support.',
      'auth/user-not-found': 'No account found for this mobile number. Please create an account first.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Mobile number or password is incorrect.',
      'auth/email-already-in-use': 'This mobile number is already registered. Please login.',
      'auth/weak-password': 'Please choose a stronger password with at least 8 characters.',
      'auth/too-many-requests': 'Too many attempts. Please wait and try again later.',
      'auth/network-request-failed': 'Network error. Check your internet connection.',
      'permission-denied': 'Database permission denied. The institute administrator must publish the Firestore security rules.',
      'firestore/permission-denied': 'Database permission denied. Please contact institute support.'
    };
    if (messages[code]) return messages[code];
    if (error && /permission-denied/i.test(error.message || '')) return messages['permission-denied'];
    return 'Something went wrong. Please try again or contact support.';
  }

  function openAuthViews() {
    authViews.classList.remove('is-hidden');
    accountPanel.classList.add('is-hidden');
    currentUser = null;
    currentProfile = null;
  }

  function showAccountPanel(user, profile) {
    currentUser = user;
    currentProfile = profile;
    authViews.classList.add('is-hidden');
    accountPanel.classList.remove('is-hidden');

    const role = profile.role === 'teacher' ? 'Teacher' : 'Student';
    $('accountName').textContent = profile.name || user.displayName || 'EVC Member';
    $('accountRole').textContent = role;
    $('accountStatus').textContent = profile.status === 'approved' ? 'Approved' : (profile.status || 'Pending');

    if (profile.status === 'approved' && (profile.role === 'teacher' || profile.role === 'student')) {
      $('accountIcon').textContent = '✓';
      $('accountIcon').className = 'account-success-icon';
      $('accountKicker').textContent = `${role.toUpperCase()} ACCESS VERIFIED`;
      $('accountHeading').textContent = `Welcome, ${(profile.name || user.displayName || 'Member').split(' ')[0]}!`;
      $('accountMessage').textContent = 'Your Firebase account and profile are active. The role-based portal dashboard will open here in the next application module.';
      $('refreshStatusBtn').classList.remove('is-hidden');
    } else if (profile.role === 'student' && profile.status === 'pending') {
      $('accountIcon').textContent = '…';
      $('accountIcon').className = 'account-pending-icon';
      $('accountKicker').textContent = 'REGISTRATION RECEIVED';
      $('accountHeading').textContent = 'Waiting for teacher approval';
      $('accountMessage').textContent = 'Your account details are saved. A teacher must approve your student account before study materials and other portal features become available.';
      $('refreshStatusBtn').classList.remove('is-hidden');
    } else {
      $('accountIcon').textContent = '!';
      $('accountIcon').className = 'account-pending-icon';
      $('accountKicker').textContent = 'ACCOUNT ACCESS';
      $('accountHeading').textContent = 'Please contact the institute';
      $('accountMessage').textContent = 'This account is not currently approved for portal access. Contact EZEE VISION CHAMPUA support for help.';
      $('refreshStatusBtn').classList.add('is-hidden');
    }
  }

  async function readOwnProfile(user) {
    const snap = await db.collection('users').doc(user.uid).get();
    if (!snap.exists) {
      throw new Error('PROFILE_NOT_FOUND');
    }
    return snap.data();
  }

  async function refreshCurrentStatus() {
    if (!auth || !auth.currentUser) return;
    try {
      const profile = await readOwnProfile(auth.currentUser);
      showAccountPanel(auth.currentUser, profile);
      showToast(profile.status === 'approved' ? 'Your account is approved.' : 'Your account is still waiting for teacher approval.');
    } catch (error) {
      showToast(error.message === 'PROFILE_NOT_FOUND' ? 'Account profile is missing. Please contact support.' : firebaseErrorMessage(error));
    }
  }

  async function createStudentProfile(user, name, mobile) {
    const ref = db.collection('users').doc(user.uid);
    const existing = await ref.get();
    if (existing.exists) {
      throw new Error('PROFILE_EXISTS');
    }
    await ref.set({
      name,
      mobile,
      role: 'student',
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    try {
      await user.updateProfile({ displayName: name });
    } catch (_) {
      // Firestore remains the source of truth for the profile name.
    }
    return { name, mobile, role: 'student', status: 'pending' };
  }

  async function handleSignup(event) {
    event.preventDefault();
    if (busy) return;
    const name = $('signupName').value.trim().replace(/\s+/g, ' ');
    const mobile = cleanMobile($('signupMobile').value);
    const password = $('signupPassword').value;
    const confirmPassword = $('signupConfirmPassword').value;

    if (name.length < 2) return showToast('Please enter your full name.');
    if (!validMobile(mobile)) return showToast('Please enter a valid 10-digit Indian mobile number.');
    if (password.length < 8) return showToast('Password must contain at least 8 characters.');
    if (password !== confirmPassword) return showToast('Password and confirm password do not match.');
    if (!firebaseReady) return showToast('Firebase is not connected. Please check the Firebase setup files.');

    busy = true;
    setBusy(signupForm, true, 'Creating account…');
    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      const email = mobileLoginEmail(mobile);
      let credential;
      try {
        credential = await auth.createUserWithEmailAndPassword(email, password);
      } catch (createError) {
        // Recover an interrupted first signup (Auth account exists but its Firestore profile
        // was not saved). A normal existing account is sent back to the Login screen.
        if (createError.code !== 'auth/email-already-in-use') throw createError;
        credential = await auth.signInWithEmailAndPassword(email, password);
        const existingProfile = await db.collection('users').doc(credential.user.uid).get();
        if (existingProfile.exists) {
          await auth.signOut();
          throw new Error('PROFILE_EXISTS');
        }
      }
      const profile = await createStudentProfile(credential.user, name, mobile);
      showAccountPanel(credential.user, profile);
      signupForm.reset();
      showToast('Account created and saved. Teacher approval is pending.', 5200);
    } catch (error) {
      if (error.message === 'PROFILE_EXISTS') {
        showToast('This mobile number already has an account. Please login instead.');
      } else {
        showToast(firebaseErrorMessage(error), 5200);
      }
      // Do not leave an unprofiled Auth session active after a failed registration.
      if (auth.currentUser && !currentProfile && (!currentUser || currentUser.uid !== auth.currentUser.uid)) {
        try { await auth.signOut(); } catch (_) {}
      }
    } finally {
      busy = false;
      setBusy(signupForm, false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (busy) return;
    const mobile = cleanMobile($('loginMobile').value);
    const password = $('loginPassword').value;
    if (!validMobile(mobile)) return showToast('Please enter a valid 10-digit Indian mobile number.');
    if (!password) return showToast('Please enter your password.');
    if (!firebaseReady) return showToast('Firebase is not connected. Please check the Firebase setup files.');

    busy = true;
    setBusy(loginForm, true, 'Signing in…');
    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      const credential = await auth.signInWithEmailAndPassword(mobileLoginEmail(mobile), password);
      const profile = await readOwnProfile(credential.user);
      if (!['student', 'teacher'].includes(profile.role)) {
        await auth.signOut();
        throw new Error('ACCOUNT_ROLE_INVALID');
      }
      showAccountPanel(credential.user, profile);
      loginForm.reset();
      showToast(profile.status === 'approved' ? 'Login successful.' : 'Login successful. Your approval is pending.');
    } catch (error) {
      if (error.message === 'PROFILE_NOT_FOUND') {
        try { await auth.signOut(); } catch (_) {}
        showToast('Account profile not found. Please contact institute support.');
      } else if (error.message === 'ACCOUNT_ROLE_INVALID') {
        showToast('This account is not configured for portal access. Contact support.');
      } else {
        showToast(firebaseErrorMessage(error), 5200);
      }
    } finally {
      busy = false;
      setBusy(loginForm, false);
    }
  }

  function supportNumber() {
    return String(settings.whatsappSupportNumber || '').replace(/\D/g, '');
  }

  function openWhatsApp(message) {
    const number = supportNumber();
    if (!/^\d{10,15}$/.test(number) || /X/i.test(String(settings.whatsappSupportNumber || ''))) {
      showToast('WhatsApp support number is not configured yet. Add it in assets/js/settings.js.');
      return;
    }
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function openRecovery() {
    $('recoveryMobile').value = cleanMobile($('loginMobile').value);
    recoveryModal.classList.remove('is-hidden');
    document.body.classList.add('modal-open');
    $('recoveryMobile').focus();
  }

  function closeRecovery() {
    recoveryModal.classList.add('is-hidden');
    document.body.classList.remove('modal-open');
  }

  loginForm.addEventListener('submit', handleLogin);
  signupForm.addEventListener('submit', handleSignup);

  switchBtn.addEventListener('click', () => {
    setMode(signupForm.classList.contains('is-hidden') ? 'signup' : 'login');
  });

  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = $(button.dataset.togglePassword);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.classList.toggle('is-visible', show);
      button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });

  document.querySelectorAll('input[inputmode="numeric"]').forEach((input) => {
    input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(0, 10); });
  });

  $('forgotBtn').addEventListener('click', openRecovery);
  $('closeRecoveryBtn').addEventListener('click', closeRecovery);
  recoveryModal.addEventListener('click', (event) => { if (event.target === recoveryModal) closeRecovery(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeRecovery(); });

  $('sendRecoveryBtn').addEventListener('click', () => {
    const mobile = cleanMobile($('recoveryMobile').value);
    if (!validMobile(mobile)) return showToast('Please enter the registered 10-digit mobile number.');
    const message = `Assalamu Alaikum EZEE VISION CHAMPUA Support,\nI need help recovering my portal password.\nRegistered mobile number: +91 ${mobile}\nPlease verify my identity and guide me with a password reset. I will not share my old password or any OTP.`;
    openWhatsApp(message);
    closeRecovery();
  });

  $('whatsappFloat').addEventListener('click', (event) => {
    event.preventDefault();
    openWhatsApp('Assalamu Alaikum EZEE VISION CHAMPUA Support, I need assistance with the learning portal.');
  });

  $('refreshStatusBtn').addEventListener('click', refreshCurrentStatus);
  $('logoutBtn').addEventListener('click', async () => {
    try {
      await auth.signOut();
      openAuthViews();
      setMode('login');
      showToast('You have been signed out securely.');
    } catch (error) {
      showToast(firebaseErrorMessage(error));
    }
  });

  if (!firebaseReady) {
    console.error('Firebase setup is missing. Check firebase-config.js and the Firebase CDN scripts.');
    showToast('Firebase connection not ready. Check the setup files.', 7000);
  } else {
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((error) => {
      console.warn('Could not set local auth persistence:', error);
    });
    auth.onAuthStateChanged(async (user) => {
      if (busy) return;
      if (!user) {
        openAuthViews();
        return;
      }
      try {
        const profile = await readOwnProfile(user);
        showAccountPanel(user, profile);
      } catch (error) {
        console.error(error);
        try { await auth.signOut(); } catch (_) {}
        openAuthViews();
        if (error.message === 'PROFILE_NOT_FOUND') showToast('Account profile missing. Contact institute support.');
        else showToast(firebaseErrorMessage(error));
      }
    });
  }

  const waNumber = supportNumber();
  if (/^\d{10,15}$/.test(waNumber) && !/X/i.test(String(settings.whatsappSupportNumber || ''))) {
    $('whatsappFloat').setAttribute('data-configured', 'true');
  }
})();
