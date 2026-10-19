/* ==========================================================================
   Type Station - Auth UI Manager
   Integrates Express Session & PostgreSQL Auth
   A Product of PluralTech LTD
   ========================================================================== */

export class AuthManager {
  /**
   * @param {{ onToast: (msg: string) => void }} options
   */
  constructor({ onToast } = {}) {
    this.currentUser = null;
    this.onToast = onToast || (() => {});

    this._initDOM();
    this._bindEvents();
    this._checkCurrentSession();
  }

  _initDOM() {
    this.dom = {
      // Modal wrapper
      modal: document.getElementById('auth-modal'),
      modalClose: document.getElementById('auth-modal-close'),

      // Tabs
      tabSignIn: document.getElementById('auth-tab-signin'),
      tabRegister: document.getElementById('auth-tab-register'),

      // Sign-in form
      formSignIn: document.getElementById('auth-form-signin'),
      signinEmail: document.getElementById('signin-email'),
      signinPassword: document.getElementById('signin-password'),
      signinError: document.getElementById('signin-error'),
      btnSignIn: document.getElementById('btn-do-signin'),

      // Register form
      formRegister: document.getElementById('auth-form-register'),
      regUsername: document.getElementById('reg-username'),
      regEmail: document.getElementById('reg-email'),
      regPassword: document.getElementById('reg-password'),
      regError: document.getElementById('reg-error'),
      btnRegister: document.getElementById('btn-do-register'),

      // Header auth controls
      btnAuth: document.getElementById('btn-auth'),
      userBadge: document.getElementById('user-badge'),
      userInitial: document.getElementById('user-initial'),
      userEmailText: document.getElementById('user-email-text'),
      userDropdown: document.getElementById('user-dropdown'),
      userDropdownEmail: document.getElementById('user-dropdown-email'),
      btnSignOut: document.getElementById('btn-signout'),

      // Mobile drawer auth triggers
      mobileBtnAuth: document.getElementById('mobile-btn-auth')
    };
  }

  _bindEvents() {
    // Header & Mobile triggers: open modal on sign-in
    this.dom.btnAuth?.addEventListener('click', () => this.openModal('signin'));
    this.dom.mobileBtnAuth?.addEventListener('click', () => {
      // Close mobile drawer if open
      document.getElementById('mobile-menu-drawer')?.classList.remove('open');
      document.getElementById('mobile-menu-backdrop')?.classList.remove('open');
      document.getElementById('mobile-menu-btn')?.classList.remove('open');
      this.openModal('signin');
    });

    // Modal: close on backdrop click or X button
    this.dom.modalClose?.addEventListener('click', () => this.closeModal());
    this.dom.modal?.addEventListener('click', (e) => {
      if (e.target === this.dom.modal) this.closeModal();
    });

    // Tab switching
    this.dom.tabSignIn?.addEventListener('click', () => this._switchTab('signin'));
    this.dom.tabRegister?.addEventListener('click', () => this._switchTab('register'));

    // Sign-in form submission
    this.dom.btnSignIn?.addEventListener('click', () => this._handleSignIn());
    this.dom.formSignIn?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleSignIn();
    });

    // Register form submission
    this.dom.btnRegister?.addEventListener('click', () => this._handleRegister());
    this.dom.formRegister?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleRegister();
    });

    // User badge dropdown toggle
    this.dom.userBadge?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dom.userDropdown?.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      this.dom.userDropdown?.classList.remove('open');
    });

    // Sign out
    this.dom.btnSignOut?.addEventListener('click', () => this._handleSignOut());
  }

  async _checkCurrentSession() {
    try {
      const res = await fetch('/auth/me');
      if (res.ok) {
        const data = await res.json();
        this.currentUser = data.user || null;
        this._updateHeaderUI();
      }
    } catch (e) {
      // Offline / guest
      this.currentUser = null;
      this._updateHeaderUI();
    }
  }

  _getDisplayName() {
    if (!this.currentUser) return 'Guest';
    return (
      this.currentUser.username ||
      this.currentUser.email?.split('@')[0] ||
      'Developer'
    );
  }

  _updateHeaderUI() {
    const isLoggedIn = !!this.currentUser;

    if (this.dom.btnAuth) this.dom.btnAuth.style.display = isLoggedIn ? 'none' : 'inline-flex';
    if (this.dom.userBadge) this.dom.userBadge.style.display = isLoggedIn ? 'flex' : 'none';

    if (this.dom.mobileBtnAuth) {
      this.dom.mobileBtnAuth.textContent = isLoggedIn ? `Account (${this._getDisplayName()})` : 'Sign In / Account';
    }

    if (isLoggedIn) {
      const name = this._getDisplayName();
      if (this.dom.userInitial) this.dom.userInitial.textContent = name.charAt(0).toUpperCase();
      if (this.dom.userEmailText) this.dom.userEmailText.textContent = name;
      if (this.dom.userDropdownEmail) this.dom.userDropdownEmail.textContent = this.currentUser.email || '';
    }
  }

  _switchTab(tab) {
    const isSignIn = tab === 'signin';

    this.dom.tabSignIn?.classList.toggle('active', isSignIn);
    this.dom.tabRegister?.classList.toggle('active', !isSignIn);

    if (this.dom.formSignIn) this.dom.formSignIn.style.display = isSignIn ? 'flex' : 'none';
    if (this.dom.formRegister) this.dom.formRegister.style.display = !isSignIn ? 'flex' : 'none';

    if (this.dom.signinError) { this.dom.signinError.textContent = ''; this.dom.signinError.style.color = ''; }
    if (this.dom.regError) { this.dom.regError.textContent = ''; this.dom.regError.style.color = ''; }
  }

  _setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    if (loading) {
      btn.dataset.origText = btn.textContent;
      btn.textContent = 'Please wait…';
    } else {
      btn.textContent = btn.dataset.origText || btn.textContent;
    }
  }

  async _handleSignIn() {
    const email = this.dom.signinEmail?.value.trim();
    const password = this.dom.signinPassword?.value;

    if (!email || !password) {
      if (this.dom.signinError) this.dom.signinError.textContent = 'Please enter both email and password.';
      return;
    }

    this._setLoading(this.dom.btnSignIn, true);
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      this._setLoading(this.dom.btnSignIn, false);

      if (data.success && data.user) {
        this.currentUser = data.user;
        this._updateHeaderUI();
        this.closeModal();
        this.onToast(`⚡ Welcome back, ${this._getDisplayName()}!`);
      } else {
        if (this.dom.signinError) this.dom.signinError.textContent = data.error || 'Invalid email or password.';
      }
    } catch (err) {
      this._setLoading(this.dom.btnSignIn, false);
      if (this.dom.signinError) this.dom.signinError.textContent = 'Sign-in server connection error.';
    }
  }

  async _handleRegister() {
    const username = this.dom.regUsername?.value.trim();
    const email = this.dom.regEmail?.value.trim();
    const password = this.dom.regPassword?.value;

    if (!email || !password) {
      if (this.dom.regError) this.dom.regError.textContent = 'Email and password are required.';
      return;
    }
    if (password.length < 6) {
      if (this.dom.regError) this.dom.regError.textContent = 'Password must be at least 6 characters.';
      return;
    }

    this._setLoading(this.dom.btnRegister, true);
    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username || email.split('@')[0], email, password })
      });
      const data = await res.json();
      this._setLoading(this.dom.btnRegister, false);

      if (data.success && data.user) {
        this.currentUser = data.user;
        this._updateHeaderUI();
        this.closeModal();
        this.onToast(`✓ Account created! Welcome to Type Station, ${this._getDisplayName()}.`);
      } else {
        if (this.dom.regError) this.dom.regError.textContent = data.error || 'Registration failed.';
      }
    } catch (err) {
      this._setLoading(this.dom.btnRegister, false);
      if (this.dom.regError) this.dom.regError.textContent = 'Registration server connection error.';
    }
  }

  async _handleSignOut() {
    this.dom.userDropdown?.classList.remove('open');
    try {
      await fetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    this.currentUser = null;
    this._updateHeaderUI();
    this.onToast('Signed out — guest mode active');
  }

  openModal(tab = 'signin') {
    this.dom.modal?.classList.add('open');
    this._switchTab(tab);
    setTimeout(() => this.dom.signinEmail?.focus(), 80);
  }

  closeModal() {
    this.dom.modal?.classList.remove('open');
  }

  getCurrentUser() {
    return this.currentUser;
  }
}
