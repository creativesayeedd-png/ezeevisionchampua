(() => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const switchBtn = document.getElementById('switchBtn');
  const switchLine = document.getElementById('switchLine');
  const formTitle = document.getElementById('formTitle');
  const formDescription = document.getElementById('formDescription');
  const heroTitle = document.getElementById('heroTitle');
  const toast = document.getElementById('toast');
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3600);
  }

  function setMode(mode) {
    const isSignup = mode === 'signup';
    loginForm.classList.toggle('is-hidden', isSignup);
    signupForm.classList.toggle('is-hidden', !isSignup);
    formTitle.textContent = isSignup ? 'Create your student account' : 'Sign in to your account';
    formDescription.textContent = isSignup
      ? 'Send an access request to your coaching institute.'
      : 'Enter your registered mobile number and password.';
    heroTitle.innerHTML = isSignup ? 'Create Your Account<span>.</span>' : 'Welcome Back<span>!</span>';
    switchLine.querySelector('span').textContent = isSignup ? 'Already registered?' : 'New to EZEE VISION?';
    switchBtn.textContent = isSignup ? 'Login' : 'Create account';
  }

  switchBtn.addEventListener('click', () => {
    setMode(signupForm.classList.contains('is-hidden') ? 'signup' : 'login');
  });

  document.querySelectorAll('[data-toggle-password]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.togglePassword);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.classList.toggle('is-visible', show);
      button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });

  document.querySelectorAll('input[inputmode="numeric"]').forEach((input) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 10);
    });
  });

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const mobile = document.getElementById('loginMobile').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      showToast('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!password) {
      showToast('Please enter your password.');
      return;
    }
    showToast('Login screen is ready. Secure Firebase sign-in will be connected in the next build step.');
  });

  signupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const mobile = document.getElementById('signupMobile').value.trim();
    const password = document.getElementById('signupPassword').value;
    if (name.length < 2) {
      showToast('Please enter your full name.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      showToast('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (password.length < 6) {
      showToast('Password must contain at least 6 characters.');
      return;
    }
    showToast('Registration screen is ready. Firebase account creation and teacher approval will be connected next.');
  });

  document.getElementById('forgotBtn').addEventListener('click', () => {
    showToast('For password reset, please contact one of your authorised EZEE VISION teachers.');
  });
})();
