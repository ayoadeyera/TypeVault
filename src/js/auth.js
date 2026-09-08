/* ==========================================================================
   TypeVault - Auth UI Manager
   Manages the authentication modal, header badge, and auth state reactivity.
   ========================================================================== */

import {
  supabase,
  signUpUser,
  loginUser,
  loginWithGoogle,
  logoutUser
} from './supabase.js';

export class AuthManager {
  /**
   * @param {{ onToast: (msg: string) => void }} options
   */
  constructor({ onToast } = {}) {
    this.currentUser = null;
    this.onToast = onToast || (() => {});

    this._initDOM();
    this._bindEvents();
    this._subscribeToAuthChanges();
  }

  // ─── DOM References ──────────────────────────────────────────────────────

  _initDOM() {
    this.dom = {
      // Modal wrapper
      modal:           document.getElementById('auth-modal'),
      modalClose:      document.getElementById('auth-modal-close'),

      // Tabs
      tabSignIn:       document.getElementById('auth-tab-signin'),
      tabRegister:     document.getElementById('auth-tab-register'),

      // Sign-in form
      formSignIn:      document.getElementById('auth-form-signin'),
      signinEmail:     document.getElementById('signin-email'),
      signinPassword:  document.getElementById('signin-password'),
      signinError:     document.getElementById('signin-error'),
      btnSignIn:       document.getElementById('btn-do-signin'),
      btnGoogleSignIn: document.getElementById('btn-google-signin'),

      // Register form
      formRegister:    document.getElementById('auth-form-register'),
      regUsername:     document.getElementById('reg-username'),
      regEmail:        document.getElementById('reg-email'),
      regPassword:     document.getElementById('reg-password'),
      regError:        document.getElementById('reg-error'),
      btnRegister:     document.getElementById('btn-do-register'),
      btnGoogleReg:    document.getElementById('btn-google-register'),

      // Header auth controls
      btnAuth:             document.getElementById('btn-auth'),
      userBadge:           document.getElementById('user-badge'),
      userInitial:         document.getElementById('user-initial'),
      userEmailText:       document.getElementById('user-email-text'),
      userDropdown:        document.getElementById('user-dropdown'),
      userDropdownEmail:   document.getElementById('user-dropdown-email'),
      btnSignOut:          document.getElementById('btn-signout'),
    };
  }

  // ─── Event Binding ───────────────────────────────────────────────────────

  _bindEvents() {
    // Header: open modal on sign-in button
    this.dom.btnAuth?.addEventListener('click', () => this.openModal('signin'));

    // Modal: close on backdrop click or X button
    this.dom.modalClose?.addEventListener('click', () => this.closeModal());
    this.dom.modal?.addEventListener('click', (e) => {
      if (e.target === this.dom.modal) this.closeModal();
    });

    // Tab switching
    this.dom.tabSignIn?.addEventListener('click',    () => this._switchTab('signin'));
    this.dom.tabRegister?.addEventListener('click',  () => this._switchTab('register'));

    // Sign-in form
    this.dom.btnSignIn?.addEventListener('click', () => this._handleSignIn());
    this.dom.formSignIn?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleSignIn();
    });

    // Register form
    this.dom.btnRegister?.addEventListener('click', () => this._handleRegister());
    this.dom.formRegister?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleRegister();
    });

    // Google OAuth buttons
    this.dom.btnGoogleSignIn?.addEventListener('click', () => this._handleGoogle());
    this.dom.btnGoogleReg?.addEventListener('click',    () => this._handleGoogle());

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

  // ─── Supabase Auth State Listener ────────────────────────────────────────

  _subscribeToAuthChanges() {
    // Bootstrap from existing session (e.g. after Google OAuth redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentUser = session?.user ?? null;
      this._updateHeaderUI();
    });

    // Reactively update on every auth event
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user ?? null;
      this._updateHeaderUI();

      if (event === 'SIGNED_IN') {
        this.closeModal();
        this.onToast(`☁ Signed in as ${this._getDisplayName()}`);
      } else if (event === 'SIGNED_OUT') {
        this.onToast('Signed out — guest mode active');
      }
    });
  }

  // ─── Header UI ───────────────────────────────────────────────────────────

  _getDisplayName() {
    if (!this.currentUser) return 'Guest';
    return (
      this.currentUser.user_metadata?.username  ||
      this.currentUser.user_metadata?.full_name ||
      this.currentUser.email?.split('@')[0]     ||
      'User'
    );
  }

  _updateHeaderUI() {
    const isLoggedIn = !!this.currentUser;

    // Toggle between sign-in button and user badge
    if (this.dom.btnAuth)    this.dom.btnAuth.style.display    = isLoggedIn ? 'none' : 'flex';
    if (this.dom.userBadge)  this.dom.userBadge.style.display  = isLoggedIn ? 'flex' : 'none';

    if (isLoggedIn) {
      const name = this._getDisplayName();
      if (this.dom.userInitial)       this.dom.userInitial.textContent       = name.charAt(0).toUpperCase();
      if (this.dom.userEmailText)     this.dom.userEmailText.textContent     = name;
      if (this.dom.userDropdownEmail) this.dom.userDropdownEmail.textContent = this.currentUser.email || '';
    }
  }

  // ─── Tab Switching ───────────────────────────────────────────────────────

  _switchTab(tab) {
    const isSignIn = tab === 'signin';

    this.dom.tabSignIn?.classList.toggle('active',  isSignIn);
    this.dom.tabRegister?.classList.toggle('active', !isSignIn);

    if (this.dom.formSignIn)   this.dom.formSignIn.style.display   = isSignIn  ? 'flex' : 'none';
    if (this.dom.formRegister) this.dom.formRegister.style.display = !isSignIn ? 'flex' : 'none';

    // Clear stale errors
    if (this.dom.signinError) { this.dom.signinError.textContent = ''; this.dom.signinError.style.color = ''; }
    if (this.dom.regError)    { this.dom.regError.textContent    = ''; this.dom.regError.style.color    = ''; }
  }

  // ─── Loading State ───────────────────────────────────────────────────────

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

  // ─── Auth Actions ────────────────────────────────────────────────────────

  async _handleSignIn() {
    const email    = this.dom.signinEmail?.value.trim();
    const password = this.dom.signinPassword?.value;

    if (!email || !password) {
      if (this.dom.signinError) this.dom.signinError.textContent = 'Please fill in all fields.';
      return;
    }

    this._setLoading(this.dom.btnSignIn, true);
    const { error } = await loginUser(email, password);
    this._setLoading(this.dom.btnSignIn, false);

    if (error && this.dom.signinError) {
      this.dom.signinError.textContent = error.message;
    }
    // Success handled by onAuthStateChange → SIGNED_IN
  }

  async _handleRegister() {
    const username = this.dom.regUsername?.value.trim();
    const email    = this.dom.regEmail?.value.trim();
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
    const { data, error } = await signUpUser(email, password, username);
    this._setLoading(this.dom.btnRegister, false);

    if (error) {
      if (this.dom.regError) this.dom.regError.textContent = error.message;
    } else if (data?.user && !data.session) {
      // Email confirmation enabled — no session yet
      if (this.dom.regError) {
        this.dom.regError.style.color = 'var(--color-correct)';
        this.dom.regError.textContent = '✓ Check your email to confirm your account!';
      }
    }
    // Auto-confirm → session created → onAuthStateChange handles the rest
  }

  async _handleGoogle() {
    const { error } = await loginWithGoogle();
    if (error) {
      this.onToast('Google sign-in failed. Enable it in Supabase Dashboard → Auth → Providers.');
    }
  }

  async _handleSignOut() {
    this.dom.userDropdown?.classList.remove('open');
    await logoutUser();
    // onAuthStateChange → SIGNED_OUT handles UI update
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  openModal(tab = 'signin') {
    this.dom.modal?.classList.add('open');
    this._switchTab(tab);
    setTimeout(() => this.dom.signinEmail?.focus(), 80);
  }

  closeModal() {
    this.dom.modal?.classList.remove('open');
  }

  /** Returns the current user synchronously (from cached state). */
  getCurrentUser() {
    return this.currentUser;
  }
}
