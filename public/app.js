/**
 * CGpedia — Complete Multi-Exam Competitive Examination & Online Test Series Platform
 * Coordinates Student Portal, Onboarding, Test Series Library, Practice & Mistake Notebook,
 * Analytics, Leaderboard, UPI QR + WhatsApp Checkout, and Role-Protected Admin Console.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'cgpedia_platform_state_v4';
  const ACCOUNT_REGISTRY_KEY = 'cgpedia_student_accounts_v4';
  const USER_WORKSPACE_PREFIX = 'cgpedia_user_workspace_v4_';
  const OWNER_ADMIN_EMAIL = 'usahu0304@gmail.com';

  const BLOCKED_FAKE_EMAIL_DOMAINS = new Set([
    'test.com', 'fake.com', 'example.com', 'example.org', 'example.net',
    'abc.com', 'xyz.com', 'temp.com', 'tempmail.com', 'temp-mail.org',
    'mailinator.com', 'yopmail.com', '10minutemail.com', 'guerrillamail.com',
    'trashmail.com', 'fakeinbox.com', 'sharklasers.com', 'maildrop.cc',
    'dispostable.com', 'getnada.com', 'throwawaymail.com', 'demo.com',
    'sample.com', 'dummy.com', 'invalid.com', 'localhost', 'none.com', 'null.com'
  ]);

  function isValidRealEmailAddress(rawEmail) {
    const email = String(rawEmail || '').trim().toLowerCase();
    if (!email || email.length < 6 || email.length > 120) return false;
    const emailRegex = /^[a-z0-9._%+-]+@([a-z0-9-]+\.)+[a-z]{2,12}$/;
    if (!emailRegex.test(email)) return false;
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const localPart = parts[0];
    const domain = parts[1];
    if (localPart.length < 2) return false;
    if (BLOCKED_FAKE_EMAIL_DOMAINS.has(domain)) return false;
    const domainLabels = domain.split('.');
    if (domainLabels.some((lbl) => !lbl || lbl.length < 2)) return false;
    return true;
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function computeCredentialDigest(email, password) {
    const raw = `cgpedia_salt_v4::${String(email || '').trim().toLowerCase()}::${String(password || '')}`;
    let h1 = 0xdeadbeef ^ raw.length;
    let h2 = 0x41c6ce57 ^ raw.length;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  function loadAccountRegistry() {
    try {
      const raw = localStorage.getItem(ACCOUNT_REGISTRY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveAccountRegistry(list) {
    try {
      localStorage.setItem(ACCOUNT_REGISTRY_KEY, JSON.stringify(Array.isArray(list) ? list : []));
    } catch (_) {}
  }

  function upsertAccountInRegistry(studentObj, extraMeta) {
    if (!studentObj || !studentObj.uid) return;
    const email = String(studentObj.email || '').trim().toLowerCase();
    const uid = String(studentObj.uid).trim();
    const list = loadAccountRegistry();
    const existingIdx = list.findIndex((a) => a.uid === uid || (email && String(a.email || '').toLowerCase() === email));
    const prev = existingIdx >= 0 ? list[existingIdx] : {};
    const record = Object.assign({}, prev, {
      uid: prev.uid || uid,
      name: studentObj.name || prev.name || 'Aspirant',
      email: email || prev.email || '',
      phone: studentObj.phone !== undefined ? studentObj.phone : (prev.phone || ''),
      targetExams: Array.isArray(studentObj.targetExams) ? studentObj.targetExams : (prev.targetExams || ['CGPSC']),
      preferredLang: studentObj.preferredLang || prev.preferredLang || 'bilingual',
      leaderboardPublic: studentObj.leaderboardPublic !== undefined ? studentObj.leaderboardPublic : true,
      lastLoginIso: new Date().toISOString()
    }, extraMeta || {});
    if (existingIdx >= 0) {
      list[existingIdx] = record;
    } else {
      list.unshift(record);
    }
    saveAccountRegistry(list);
    return record;
  }

  function saveStudentWorkspaceSnapshot(uid) {
    const cleanUid = String(uid || (state && state.student && state.student.uid) || '').trim();
    if (!cleanUid) return;
    try {
      const myAttempts = (state.attempts || [])
        .filter((a) => !a.userId || a.userId === cleanUid)
        .map((a) => Object.assign({}, a, { userId: cleanUid }));
      const myBookmarks = (state.bookmarks || [])
        .filter((b) => !b.userId || b.userId === cleanUid)
        .map((b) => Object.assign({}, b, { userId: cleanUid }));
      const myMistakes = (state.mistakes || [])
        .filter((m) => !m.userId || m.userId === cleanUid)
        .map((m) => Object.assign({}, m, { userId: cleanUid }));

      const snapshot = {
        uid: cleanUid,
        student: Object.assign({}, state.student, { uid: cleanUid }),
        attempts: myAttempts,
        bookmarks: myBookmarks,
        mistakes: myMistakes,
        updatedAtIso: new Date().toISOString()
      };
      localStorage.setItem(USER_WORKSPACE_PREFIX + cleanUid, JSON.stringify(snapshot));
    } catch (_) {}
  }

  function loadStudentWorkspaceSnapshot(uid) {
    const cleanUid = String(uid || '').trim();
    if (!cleanUid) return null;
    try {
      const raw = localStorage.getItem(USER_WORKSPACE_PREFIX + cleanUid);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function createDefaultState() {
    return {
      activeTab: 'dashboard',
      adminSection: 'overview',
      adminUnlocked: false,
      selectedExamFilter: 'ALL',
      testSeriesFilter: 'ALL',
      testSeriesSort: 'latest',
      searchQuery: '',
      selectedFolderId: null,
      activeResultId: null,
      solutionFilter: 'ALL',
      theme: 'light',
      lang: 'bilingual',
      onboarded: false,
      authSession: {
        isAuthenticated: false,
        intentionalLogout: false,
        authMode: 'login',
        prefillEmail: ''
      },
      config: {
        appTitle: 'CGpedia',
        appSubtitle: 'Competitive Exam & CBT Test Portal',
        logoImage: 'assets/cgpedia-logo-clean.png',
        upiId: '',
        upiQrImage: '',
        whatsappNumber: '',
        paymentInstructionsHi: 'QR कोड स्कैन करके या UPI ID पर पेमेंट करें, पेमेंट का स्क्रीनशॉट लें और एक्टिवेशन के लिए नीचे दिए गए WhatsApp बटन पर क्लिक करके या पेमेंट रिकॉर्ड सबमिट करके विवरण भेजें।',
        paymentInstructionsEn: 'Scan the QR Code or pay via the configured UPI ID, take a payment screenshot, and click the WhatsApp button below or submit your payment verification details for package activation.',
        anthemEnabled: false,
        anthemData: {
          title: '',
          description: '',
          downloadUrl: '',
          storagePath: '',
          fileName: '',
          mimeType: '',
          formatLabel: '',
          sizeBytes: 0,
          sizeMbText: '',
          published: false,
          updatedAtIso: ''
        },
        screenshotRestriction: true
      },
      student: {
        uid: '',
        name: '',
        email: '',
        phone: '',
        targetExams: ['CGPSC', 'UPSC', 'SSC'],
        preferredLang: 'bilingual',
        caLangMode: 'hi',
        seenStoryIds: [],
        leaderboardPublic: true
      },
      // Clean Slate: ZERO hardcoded dummy test series or sample tests
      folders: [],
      tests: [],
      questionBank: [],
      stories: [],
      notifications: [],
      upcomingTests: [],
      coupons: [],
      activations: [],
      orders: [],
      attempts: [],
      bookmarks: [],
      mistakes: [],
      leaderboard: [],
      queries: [],
      questionReports: [],
      adminStaff: [],
      registeredStudents: [],
      customTaxonomy: {
        customCategories: [],
        customSubjects: []
      },
      examMaster: [],
      subjectMaster: [],
      topicMaster: [],
      subtopicMaster: [],
      migrationState: {
        version: 0,
        lastRunIso: '',
        migratedCount: 0,
        alreadyCategorisedCount: 0,
        needsCategorisationCount: 0,
        errors: []
      }
    };
  }

  let state = loadState();
  let deferredPwaPrompt = null;
  let studentAnthemAudioEl = null;
  let studentAnthemPlayerOpen = false;
  let studentAnthemVolume = 0.85;
  let studentAnthemMuted = false;
  let synthAnthemCtx = null;
  let synthAnthemTimer = null;
  let synthAnthemPlaying = false;
  let settingsDrawerOpen = false;
  let settingsProfileEditExpanded = false;
  let authStateCheckComplete = isStudentAuthenticated();

  function loadState() {
    const def = createDefaultState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return def;
      const parsed = JSON.parse(raw);
      const merged = Object.assign({}, def, parsed, {
        authSession: Object.assign({}, def.authSession, parsed.authSession || {}),
        config: Object.assign({}, def.config, parsed.config || {}),
        student: Object.assign({}, def.student, parsed.student || {})
      });

      const hasValidAccount = Boolean(
        merged.authSession &&
        merged.authSession.isAuthenticated === true &&
        merged.authSession.intentionalLogout !== true &&
        merged.student &&
        String(merged.student.uid || '').trim() &&
        String(merged.student.email || '').trim().includes('@')
      );

      if (!hasValidAccount) {
        merged.authSession.isAuthenticated = false;
        merged.student = Object.assign({}, def.student);
        merged.attempts = [];
        merged.bookmarks = [];
        merged.mistakes = [];
        merged.activeResultId = null;
        merged.adminUnlocked = false;
      } else {
        const uid = String(merged.student.uid).trim();
        merged.attempts = (merged.attempts || [])
          .filter((a) => !a.userId || a.userId === uid)
          .map((a) => Object.assign({}, a, { userId: uid }));
        merged.bookmarks = (merged.bookmarks || [])
          .filter((b) => !b.userId || b.userId === uid)
          .map((b) => Object.assign({}, b, { userId: uid }));
        merged.mistakes = (merged.mistakes || [])
          .filter((m) => !m.userId || m.userId === uid)
          .map((m) => Object.assign({}, m, { userId: uid }));
      }
      return merged;
    } catch (_) {
      return def;
    }
  }

  function isStudentAuthenticated() {
    if (!state || !state.authSession) return false;
    if (state.authSession.intentionalLogout === true) return false;
    if (state.authSession.isAuthenticated !== true) return false;
    const uid = String((state.student && state.student.uid) || '').trim();
    const email = String((state.student && state.student.email) || '').trim();
    if (!uid) return false;
    return isValidRealEmailAddress(email);
  }

  function isLoggedOut() {
    return !isStudentAuthenticated();
  }

  function getCurrentStudentUid() {
    if (!isStudentAuthenticated()) return '';
    return String((state && state.student && state.student.uid) || '').trim();
  }

  let saveStateTimerId = null;

  function flushSaveStateNow() {
    if (saveStateTimerId) {
      clearTimeout(saveStateTimerId);
      saveStateTimerId = null;
    }
    try {
      if (!isLoggedOut() && state.student && state.student.uid) {
        saveStudentWorkspaceSnapshot(state.student.uid);
        if (state.student.email) {
          upsertAccountInRegistry(state.student);
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function saveState(immediate) {
    if (immediate === true) {
      flushSaveStateNow();
      return;
    }
    if (saveStateTimerId) {
      clearTimeout(saveStateTimerId);
    }
    saveStateTimerId = setTimeout(() => {
      flushSaveStateNow();
    }, 120);
  }

  window.addEventListener('pagehide', flushSaveStateNow);
  window.addEventListener('beforeunload', flushSaveStateNow);

  const READ_NOTIF_STORAGE_KEY = 'cgpedia_read_notif_ids_v1';

  function getReadNotificationIdsSet() {
    const set = new Set();
    try {
      const raw = localStorage.getItem(READ_NOTIF_STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.forEach((id) => {
            if (id) set.add(String(id));
          });
        }
      }
    } catch (_) {}
    if (state && Array.isArray(state.readNotificationIds)) {
      state.readNotificationIds.forEach((id) => {
        if (id) set.add(String(id));
      });
    }
    return set;
  }

  function markAllCurrentNotificationsAsRead() {
    const notifs = (state && Array.isArray(state.notifications)) ? state.notifications : [];
    if (notifs.length === 0) return;
    const set = getReadNotificationIdsSet();
    let changed = false;
    notifs.forEach((n) => {
      if (n && n.id && !set.has(String(n.id))) {
        set.add(String(n.id));
        changed = true;
      }
    });
    if (changed) {
      const arr = Array.from(set).slice(-500);
      state.readNotificationIds = arr;
      try {
        localStorage.setItem(READ_NOTIF_STORAGE_KEY, JSON.stringify(arr));
      } catch (_) {}
    }
    const notifBadge = document.getElementById('notifBadgeCount');
    if (notifBadge) {
      notifBadge.textContent = '0';
      notifBadge.style.display = 'none';
    }
  }

  function getUnreadNotificationCount() {
    const notifs = (state && Array.isArray(state.notifications)) ? state.notifications : [];
    if (notifs.length === 0) return 0;
    const readSet = getReadNotificationIdsSet();
    return notifs.filter((n) => n && n.id && !readSet.has(String(n.id))).length;
  }

  function confirmUserAction(options, onConfirmCallback) {
    if (window.CGpediaAdmin && typeof window.CGpediaAdmin.openConfirmationDialog === 'function') {
      window.CGpediaAdmin.openConfirmationDialog(options, onConfirmCallback);
      return;
    }
    const opts = options || {};
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) {
      if (typeof onConfirmCallback === 'function') onConfirmCallback();
      return;
    }
    const title = opts.title || 'Confirm Action / पुष्टि करें';
    const message = opts.message || 'क्या आप वाकई यह कार्रवाई करना चाहते हैं? (Are you sure you want to proceed?)';
    const confirmLabel = opts.confirmText || 'Yes, Confirm';
    const cancelLabel = opts.cancelText || 'Cancel';
    const icon = opts.icon || '⚠️';
    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="appUserConfirmBackdrop" role="dialog" aria-modal="true" style="z-index:9999;">
        <div class="modal-card" style="max-width:420px;width:100%;text-align:center;padding:24px 22px;margin:auto;">
          <div style="width:52px;height:52px;border-radius:50%;background:var(--danger-soft);color:var(--danger);display:flex;align-items:center;justify-content:center;font-size:1.45rem;margin:0 auto 12px;">
            ${icon}
          </div>
          <h2 style="font-size:1.12rem;font-weight:800;color:var(--text);margin-bottom:8px;">${esc(title)}</h2>
          <p style="font-size:0.88rem;color:var(--text-secondary);line-height:1.55;margin-bottom:20px;">${esc(message)}</p>
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;">
            <button type="button" class="btn btn-outline" id="appUserConfirmCancelBtn" style="flex:1;min-width:120px;">${esc(cancelLabel)}</button>
            <button type="button" class="btn btn-danger" id="appUserConfirmOkBtn" style="flex:1;min-width:130px;">${esc(confirmLabel)}</button>
          </div>
        </div>
      </div>
    `;
    const cancelBtn = document.getElementById('appUserConfirmCancelBtn');
    const okBtn = document.getElementById('appUserConfirmOkBtn');
    if (cancelBtn) {
      cancelBtn.onclick = () => { modalRoot.innerHTML = ''; };
    }
    if (okBtn) {
      okBtn.onclick = async () => {
        okBtn.disabled = true;
        modalRoot.innerHTML = '';
        if (typeof onConfirmCallback === 'function') {
          await onConfirmCallback();
        }
      };
    }
  }

  function toast(msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      try { container.removeChild(el); } catch (_) {}
    }, 3600);
  }

  function isCurrentUserAdmin() {
    if (isLoggedOut()) return false;
    const email = String(state.student.email || '').trim().toLowerCase();
    if (!email) return false;
    if (email === OWNER_ADMIN_EMAIL) return true;
    return (state.adminStaff || []).some((s) => String(s.email || '').toLowerCase() === email);
  }

  function getActiveActivation(targetId) {
    if (isLoggedOut()) return null;
    const email = String(state.student.email || '').trim().toLowerCase();
    const uid = String(state.student.uid || '').trim().toLowerCase();
    if (!email && !uid) return null;
    const now = Date.now();
    return (state.activations || []).find((a) => {
      const idMatch = String(a.studentIdentifier || '').trim().toLowerCase();
      if (!idMatch) return false;
      const matchesUser = (email && idMatch === email) || (uid && idMatch === uid) || (uid && String(a.userId || '').toLowerCase() === uid);
      return matchesUser && a.targetId === targetId && Number(a.expiresAtMs || 0) > now;
    }) || null;
  }

  function isTestUnlocked(testObj) {
    if (!testObj.isPaid) return true;
    if (isCurrentUserAdmin()) return true;
    if (getActiveActivation(testObj.id)) return true;
    if (testObj.folderId && getActiveActivation(testObj.folderId)) return true;
    return false;
  }

  function applyBrandingAndSecurity() {
    document.documentElement.setAttribute('data-theme', state.theme || 'light');
    const titleEl = document.getElementById('headerBrandTitle');
    const subEl = document.getElementById('headerBrandSubtitle');
    if (titleEl) titleEl.textContent = state.config.appTitle || 'CGpedia';
    if (subEl) subEl.textContent = state.config.appSubtitle || 'Competitive Exam & CBT Test Portal';

    // Hide or show Hero + Main Navigation wrapper and Settings Gear button when student is unauthenticated
    const heroNavWrapper = document.getElementById('topHeroNavWrapper');
    const mobileBottomNav = document.getElementById('mobileBottomNav');
    const settingsGearBtn = document.getElementById('settingsDrawerTriggerBtn');
    const authenticated = isStudentAuthenticated();
    if (heroNavWrapper) {
      heroNavWrapper.style.display = authenticated ? 'block' : 'none';
    }
    if (mobileBottomNav) {
      mobileBottomNav.style.display = authenticated ? '' : 'none';
    }
    if (settingsGearBtn) {
      settingsGearBtn.style.display = authenticated ? 'inline-flex' : 'none';
    }
    if (!authenticated && settingsDrawerOpen) {
      closeSettingsDrawer();
    }

    // Update Hero Card greeting badge and Admin badge
    const greetingBadge = document.getElementById('heroStudentGreetingBadge');
    if (greetingBadge) {
      greetingBadge.textContent = `नमस्ते, ${(state.student && state.student.name) || 'Aspirant'} 👋`;
    }
    const ownerAdminBadge = document.getElementById('heroOwnerAdminBadge');
    if (ownerAdminBadge) {
      ownerAdminBadge.style.display = isCurrentUserAdmin() ? 'inline-flex' : 'none';
      ownerAdminBadge.onclick = () => {
        if (isCurrentUserAdmin()) {
          navigateToTab('admin');
        }
      };
    }
    const heroSearchInput = document.getElementById('globalHomeSearchInput');
    if (heroSearchInput && document.activeElement !== heroSearchInput) {
      heroSearchInput.value = state.searchQuery || '';
    }

    const adminTabBtn = document.getElementById('adminNavTabBtn');
    if (adminTabBtn) {
      adminTabBtn.style.display = isCurrentUserAdmin() ? 'inline-flex' : 'none';
    }
    const mobileAdminBtn = document.getElementById('mobileAdminNavBtn');
    if (mobileAdminBtn) {
      mobileAdminBtn.style.display = isCurrentUserAdmin() ? 'flex' : 'none';
    }

    const anthemBtn = document.getElementById('anthemToggleBtn');
    const canShowStudentAnthem = Boolean(authenticated && isAnthemPublishedForStudents());
    if (anthemBtn) {
      anthemBtn.style.display = canShowStudentAnthem ? 'inline-flex' : 'none';
      if (canShowStudentAnthem && state.config && state.config.anthemData && state.config.anthemData.title) {
        anthemBtn.title = state.config.anthemData.title;
      } else {
        anthemBtn.title = 'Play CGpedia Anthem';
      }
    }
    if (!canShowStudentAnthem) {
      closeAndStopStudentAnthemPlayer();
    } else if (studentAnthemPlayerOpen) {
      syncStudentAnthemPlayerMeta();
    }

    if (state.activeTab === 'notifications') {
      markAllCurrentNotificationsAsRead();
    }
    const notifBadge = document.getElementById('notifBadgeCount');
    if (notifBadge) {
      const unreadCount = getUnreadNotificationCount();
      notifBadge.textContent = String(unreadCount);
      notifBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }

    if (settingsDrawerOpen && authenticated) {
      renderSettingsDrawerContent();
    }

    if (state.config.screenshotRestriction) {
      document.body.classList.add('screenshot-restricted');
    } else {
      document.body.classList.remove('screenshot-restricted');
    }

    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.setSecureScreen === 'function') {
        window.AndroidBridge.setSecureScreen(Boolean(state.config.screenshotRestriction));
      }
    } catch (_) {}
  }

  function syncNavHighlight() {
    document.querySelectorAll('#mainNavTabs .nav-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === state.activeTab);
    });
    document.querySelectorAll('#mobileBottomNav .bottom-nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === state.activeTab);
    });
  }

  const PROTECTED_TABS = [
    'dashboard',
    'test-series',
    'practice',
    'analytics',
    'leaderboard',
    'current-affairs',
    'payments',
    'notifications',
    'profile',
    'admin'
  ];

  let initialHashSynced = false;
  let suppressNextHashChange = false;

  function syncUrlHashWithActiveTab(tabId, usePushState) {
    const cleanTab = PROTECTED_TABS.includes(tabId) ? tabId : 'dashboard';
    const desiredHash = '#' + cleanTab;
    if (window.location.hash === desiredHash) return;
    suppressNextHashChange = true;
    try {
      if (usePushState && typeof window.history.pushState === 'function') {
        window.history.pushState({ tab: cleanTab, authenticated: true }, '', desiredHash);
      } else if (typeof window.history.replaceState === 'function') {
        window.history.replaceState({ tab: cleanTab, authenticated: true }, '', desiredHash);
      } else {
        window.location.hash = desiredHash;
      }
    } catch (_) {
      try {
        window.location.hash = desiredHash;
      } catch (_e) {}
    }
    setTimeout(() => {
      suppressNextHashChange = false;
    }, 50);
  }

  function navigateToTab(targetTab, adminSectionOverride) {
    if (!isStudentAuthenticated()) {
      renderApp();
      return false;
    }
    const cleanTab = String(targetTab || 'dashboard').trim().toLowerCase();
    if (cleanTab === 'admin' && !isCurrentUserAdmin()) {
      toast('🔒 Access Denied: Admin Panel is restricted to authorized administrators.');
      return false;
    }
    state.activeTab = PROTECTED_TABS.includes(cleanTab) ? cleanTab : 'dashboard';
    if (cleanTab === 'admin' && adminSectionOverride) {
      state.adminSection = adminSectionOverride;
    }
    initialHashSynced = true;
    syncUrlHashWithActiveTab(state.activeTab, true);
    saveState();
    renderApp();
    return true;
  }

  function enforceRouteUrlProtection() {
    const rawHash = String(window.location.hash || '').replace(/^#\/?/, '').trim().toLowerCase();
    if (!isStudentAuthenticated()) {
      if (rawHash === 'register' || rawHash === 'reset' || rawHash === 'login') {
        state.authSession = Object.assign({}, state.authSession || {}, {
          authMode: rawHash
        });
      }
      if (window.location.hash !== '#login' && rawHash !== 'register' && rawHash !== 'reset') {
        try {
          window.history.replaceState({ authGate: 'login' }, '', '#login');
        } catch (_) {}
      }
      return false;
    }

    // Only adopt the URL hash on initial boot before any in-app navigation occurs
    if (!initialHashSynced) {
      initialHashSynced = true;
      if (rawHash === 'admin' && !isCurrentUserAdmin()) {
        state.activeTab = 'dashboard';
        syncUrlHashWithActiveTab('dashboard', false);
        toast('🔒 Access Denied: Admin Panel is restricted to authorized administrators.');
        return true;
      }
      if (PROTECTED_TABS.includes(rawHash)) {
        state.activeTab = rawHash;
      }
    }

    // Ensure state.activeTab is always valid and role-checked, and sync URL hash TO state.activeTab
    const targetTab = PROTECTED_TABS.includes(state.activeTab) ? state.activeTab : 'dashboard';
    if (targetTab === 'admin' && !isCurrentUserAdmin()) {
      state.activeTab = 'dashboard';
      toast('🔒 Access Denied: Admin Panel is restricted to authorized administrators.');
    } else {
      state.activeTab = targetTab;
    }
    syncUrlHashWithActiveTab(state.activeTab, false);
    return true;
  }

  function renderAuthVerificationLoading(root) {
    root.innerHTML = `
      <div class="card" style="max-width:460px;margin:48px auto;text-align:center;padding:32px 24px;">
        <img src="assets/cgpedia-logo-clean.png" alt="CGpedia" style="width:68px;height:68px;border-radius:50%;object-fit:cover;margin-bottom:12px;border:2px solid var(--secondary);" />
        <h2 style="font-size:1.1rem;font-weight:800;margin-bottom:6px;">Verifying Authentication Session...</h2>
        <p style="font-size:0.84rem;color:var(--text-secondary);">Please wait while CGpedia checks your account credentials.</p>
      </div>
    `;
  }

  // =========================================================================
  // Main View Router (Mandatory Authentication Entry Point & Route Guard)
  // =========================================================================
  function renderApp() {
    applyBrandingAndSecurity();

    const root = document.getElementById('appRoot');
    if (!root) return;

    // Show loading screen while Firebase Authentication status is being determined
    if (!authStateCheckComplete && !isStudentAuthenticated()) {
      syncNavHighlight();
      renderAuthVerificationLoading(root);
      return;
    }

    // Mandatory Authentication Gate: Unauthenticated users always see the Login / Welcome Page
    if (!isStudentAuthenticated()) {
      enforceRouteUrlProtection();
      syncNavHighlight();
      const cbtRoot = document.getElementById('cbtExamContainer');
      if (cbtRoot) cbtRoot.innerHTML = '';
      renderStudentAuthPortal(root, false);
      return;
    }

    enforceRouteUrlProtection();
    syncNavHighlight();

    // Check if there is an unsubmitted CBT session for the current student UID
    const savedSession = window.CGpediaCBT && window.CGpediaCBT.getSavedActiveSession();

    if (state.activeTab === 'dashboard') {
      renderHomeDashboard(root, savedSession);
    } else if (state.activeTab === 'test-series') {
      renderTestSeriesCatalog(root);
    } else if (state.activeTab === 'practice') {
      renderPracticeAndMistakes(root);
    } else if (state.activeTab === 'analytics') {
      renderResultsAndAnalytics(root);
    } else if (state.activeTab === 'leaderboard') {
      renderLeaderboardView(root);
    } else if (state.activeTab === 'current-affairs') {
      renderCurrentAffairsView(root);
    } else if (state.activeTab === 'payments') {
      renderStudentPaymentView(root);
    } else if (state.activeTab === 'notifications') {
      renderNotificationsAndSupport(root);
    } else if (state.activeTab === 'profile') {
      renderProfileAndSettings(root);
    } else if (state.activeTab === 'admin') {
      if (!isCurrentUserAdmin()) {
        state.activeTab = 'dashboard';
        syncNavHighlight();
        saveState();
        renderHomeDashboard(root, savedSession);
      } else if (window.CGpediaAdmin && typeof window.CGpediaAdmin.renderAdminConsole === 'function') {
        window.CGpediaAdmin.renderAdminConsole(root, state, publicApi);
      }
    }
  }

  // =========================================================================
  // 1. Student Home Dashboard
  // =========================================================================
  function renderHomeDashboard(root, savedCbtSession) {
    const exams = window.CGpediaCloud ? window.CGpediaCloud.EXAM_CATEGORIES : [];
    const liveTests = (state.tests || []).filter((t) => t.status === 'published' && (state.selectedExamFilter === 'ALL' || t.examCode === state.selectedExamFilter));
    const activeStories = getActiveDailyDoseStories();
    const pinnedNotifs = (state.notifications || []).filter((n) => n.isPinned);

    root.innerHTML = `
      <!-- Resume Interrupted CBT Banner (If Any) -->
      ${savedCbtSession ? `
        <div class="card" style="border-left:5px solid #EA580C;background:var(--warning-soft);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <span class="badge badge-paid">⏸️ IN-PROGRESS EXAM DETECTED</span>
            <div style="font-weight:800;font-size:0.98rem;margin-top:3px;">${esc(savedCbtSession.testTitleHi)}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);">Auto-saved with ${Math.floor(savedCbtSession.remainingSeconds / 60)}m remaining. Resume from where you left off.</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-outline btn-sm" id="discardSavedSessionBtn">Discard</button>
            <button class="btn btn-primary btn-sm" id="resumeSavedSessionBtn">▶️ Resume Exam</button>
          </div>
        </div>
      ` : ''}

      <!-- Pinned Official Announcements -->
      ${pinnedNotifs.length > 0 ? `
        <div class="card" style="border-left:4px solid var(--secondary);padding:12px 16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
            <div>
              <span class="badge badge-exam">📌 PINNED ANNOUNCEMENT</span>
              <strong style="margin-left:6px;font-size:0.9rem;">${esc(pinnedNotifs[0].titleHi)}</strong>
              <span style="font-size:0.82rem;color:var(--text-secondary);margin-left:6px;">— ${esc(pinnedNotifs[0].messageHi)}</span>
            </div>
            <button class="btn btn-outline btn-sm" data-goto-tab="notifications">View All</button>
          </div>
        </div>
      ` : ''}

      <!-- Daily Dose Strip (WhatsApp-Style Category Story Circles, Seen/Unseen Rings & Language Switch) -->
      ${renderDailyDoseStoryStripHtml(activeStories, 'home')}

      <!-- Multi-Exam Category Selector Chips -->
      <div style="margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;">
        <h2 style="font-size:1.02rem;font-weight:800;">🏛️ Competitive Exam Categories / परीक्षा श्रेणियां</h2>
        <span style="font-size:0.76rem;color:var(--text-muted);">Select category to filter series</span>
      </div>
      <div class="chip-row">
        <button class="filter-chip ${state.selectedExamFilter === 'ALL' ? 'active' : ''}" data-exam-chip="ALL">🌟 All Exams</button>
        ${exams.map((ex) => `
          <button class="filter-chip ${state.selectedExamFilter === ex.code ? 'active' : ''}" data-exam-chip="${esc(ex.code)}">
            ${esc(ex.icon)} ${esc(ex.nameEn)}
          </button>
        `).join('')}
      </div>

      <!-- Published Live Test Series & Mock Tests -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
          <div>
            <h2 style="font-size:1.05rem;font-weight:800;">📚 Live Test Series &amp; Mock Exams (${liveTests.length})</h2>
            <p style="font-size:0.78rem;color:var(--text-muted);">Bilingual (Hindi &amp; English) CBT Tests with Negative Marking &amp; Analytics</p>
          </div>
          <button class="btn btn-outline btn-sm" data-goto-tab="test-series">Explore Full Catalog ➡️</button>
        </div>

        ${liveTests.length === 0 && (state.folders || []).length === 0 ? `
          <div style="text-align:center;padding:34px 16px;background:var(--surface-alt);border-radius:12px;border:1px dashed var(--border-strong);">
            <img src="assets/cgpedia-logo-clean.png" alt="CGpedia" style="width:68px;height:68px;border-radius:50%;object-fit:cover;margin-bottom:10px;opacity:0.9;" />
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:4px;">No Test Series Available Yet</h3>
            <p style="font-size:0.84rem;color:var(--text-secondary);max-width:460px;margin:0 auto 14px;">
              अभी कोई लाइव टेस्ट सीरीज़ प्रकाशित नहीं की गई है। जैसे ही एडमिन नया टेस्ट पब्लिश करेंगे, वह तुरंत यहाँ दिखाई देगा।
            </p>
            <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" id="emptyStateTryPracticeBtn">🎯 Practice Topic Quiz</button>
              ${isCurrentUserAdmin() ? `<button class="btn btn-navy btn-sm" id="emptyStateGoAdminBtn">🛡️ Create &amp; Publish Test in Admin</button>` : ''}
            </div>
          </div>
        ` : `
          <div class="grid-2">
            ${liveTests.slice(0, 6).map((t) => renderTestCardHtml(t)).join('')}
          </div>
        `}
      </div>

      <!-- Student Preparation Snapshot & Quick Modules -->
      <div class="grid-3">
        <div class="card" style="cursor:pointer;" data-goto-tab="practice">
          <div style="font-size:1.6rem;margin-bottom:6px;">🎯</div>
          <h3 style="font-size:0.95rem;font-weight:800;">Topic Practice &amp; Mistake Notebook</h3>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;">
            Practice subject-wise MCQs, PYQs, Bookmarked questions (${(state.bookmarks || []).length}), and your Mistake Notebook (${(state.mistakes || []).length}).
          </p>
        </div>
        <div class="card" style="cursor:pointer;" data-goto-tab="analytics">
          <div style="font-size:1.6rem;margin-bottom:6px;">📊</div>
          <h3 style="font-size:0.95rem;font-weight:800;">Performance Analytics &amp; Solutions</h3>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;">
            Completed Attempts: <strong>${(state.attempts || []).length}</strong> • Track accuracy, speed, negative marks &amp; weak topics.
          </p>
        </div>
        <div class="card" style="cursor:pointer;" data-goto-tab="leaderboard">
          <div style="font-size:1.6rem;margin-bottom:6px;">🏆</div>
          <h3 style="font-size:0.95rem;font-weight:800;">All-India &amp; State Leaderboard</h3>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;">
            Compare your rank and percentile with top aspirants across CGPSC, UPSC, SSC &amp; Banking.
          </p>
        </div>
      </div>
    `;

    bindHomeEvents(savedCbtSession, activeStories);
    bindTestCardButtons(root);
  }

  function renderTestCardHtml(t) {
    const unlocked = isTestUnlocked(t);
    const activeAct = getActiveActivation(t.id) || (t.folderId ? getActiveActivation(t.folderId) : null);
    const remDays = activeAct ? Math.max(1, Math.ceil((activeAct.expiresAtMs - Date.now()) / 86400000)) : null;
    const attemptedCount = (state.attempts || []).filter((a) => a.testId === t.id).length;

    return `
      <div class="card" style="margin-bottom:0;display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span class="badge badge-exam">${esc(t.examCode || 'CGPSC')}</span>
              <span class="badge ${t.isPaid ? (unlocked ? 'badge-free' : 'badge-paid') : 'badge-free'}">
                ${t.isPaid ? (unlocked ? '🔓 UNLOCKED' : '🔒 PREMIUM ₹' + t.priceInr) : '🟢 FREE'}
              </span>
              ${remDays ? `<span class="badge badge-review">⏳ ${remDays}d left</span>` : ''}
            </div>
            <span style="font-size:0.74rem;color:var(--text-muted);font-weight:700;">${(t.questions || []).length} Qs • ${t.durationMinutes || 60}m</span>
          </div>
          <h3 style="font-size:0.98rem;font-weight:800;line-height:1.35;">${esc(t.titleHi)}</h3>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px;">${esc(t.titleEn)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">
            📌 Topic: ${esc(t.topic || 'Full Syllabus')} • Marking: +${t.marksPerQuestion || 2} / -${t.negativeMarking !== undefined ? t.negativeMarking : 0.66}
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding-top:10px;border-top:1px solid var(--border);">
          <span style="font-size:0.74rem;color:var(--text-muted);">
            ${attemptedCount > 0 ? `✅ Attempted (${attemptedCount}x)` : 'Not Attempted'}
          </span>
          <div style="display:flex;gap:6px;">
            ${attemptedCount > 0 ? `
              <button class="btn btn-outline btn-sm" data-view-test-result="${esc(t.id)}">📊 Result</button>
            ` : ''}
            ${unlocked ? `
              <button class="btn btn-primary btn-sm" data-start-test="${esc(t.id)}">
                ${attemptedCount > 0 ? '🔄 Re-Attempt' : '▶️ Start CBT'}
              </button>
            ` : `
              <button class="btn btn-warning btn-sm" data-unlock-paid-item="${esc(t.id)}" data-unlock-type="test">
                🔓 Unlock ₹${t.priceInr}
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function bindHomeEvents(savedCbtSession, activeStories) {
    const goAdmin = document.getElementById('homeGoAdminBtn');
    if (goAdmin) {
      goAdmin.onclick = () => {
        navigateToTab('admin');
      };
    }
    const emptyGoAdmin = document.getElementById('emptyStateGoAdminBtn');
    if (emptyGoAdmin) {
      emptyGoAdmin.onclick = () => {
        navigateToTab('admin', 'tests');
      };
    }
    const emptyTryPractice = document.getElementById('emptyStateTryPracticeBtn');
    if (emptyTryPractice) {
      emptyTryPractice.onclick = () => {
        navigateToTab('practice');
      };
    }
    const editOnboard = document.getElementById('homeEditOnboardingBtn');
    if (editOnboard) {
      editOnboard.onclick = () => openOnboardingModal();
    }

    const searchBtn = document.getElementById('globalHomeSearchBtn');
    const searchInput = document.getElementById('globalHomeSearchInput');
    if (searchBtn && searchInput) {
      searchBtn.onclick = () => {
        state.searchQuery = searchInput.value.trim();
        navigateToTab('test-series');
      };
    }

    if (savedCbtSession) {
      const resumeBtn = document.getElementById('resumeSavedSessionBtn');
      const discardBtn = document.getElementById('discardSavedSessionBtn');
      if (resumeBtn) {
        resumeBtn.onclick = () => {
          window.CGpediaCBT.launchLiveCbtSession({}, savedCbtSession.questions, savedCbtSession.langMode, cbtCallbacks, savedCbtSession);
        };
      }
      if (discardBtn) {
        discardBtn.onclick = () => {
          confirmUserAction({
            title: 'Discard Saved Exam Session?',
            message: `क्या आप वाकई "${savedCbtSession.testTitleHi || 'In-Progress Exam'}" के सेव किए गए सेशन को हटाना चाहते हैं? (Your saved progress for this incomplete attempt will be discarded.)`,
            confirmText: '🗑️ Yes, Discard',
            cancelText: 'Keep Session'
          }, () => {
            window.CGpediaCBT.clearSavedSession();
            renderApp();
            toast('🗑️ In-progress exam session discarded.');
          });
        };
      }
    }

    const adminPostStoryBtn = document.getElementById('homeAdminPostStoryBtn');
    if (adminPostStoryBtn) {
      adminPostStoryBtn.onclick = () => {
        openQuickAdminPostStoryModal();
      };
    }

    document.querySelectorAll('[data-exam-chip]').forEach((chip) => {
      chip.onclick = () => {
        state.selectedExamFilter = chip.getAttribute('data-exam-chip');
        saveState();
        renderApp();
      };
    });

    document.querySelectorAll('[data-goto-tab]').forEach((el) => {
      el.onclick = () => {
        navigateToTab(el.getAttribute('data-goto-tab'));
      };
    });

    bindDailyDoseStoryStripEvents(document, activeStories, 'home');
  }

  // =========================================================================
  // 2. Test Series Catalog & Folder Detail View
  // =========================================================================
  function renderTestSeriesCatalog(root) {
    const exams = window.CGpediaCloud ? window.CGpediaCloud.EXAM_CATEGORIES : [];
    const q = (state.searchQuery || '').toLowerCase();

    const filteredFolders = (state.folders || []).filter((f) => {
      if (state.selectedExamFilter !== 'ALL' && f.examCode !== state.selectedExamFilter) return false;
      if (q && !(String(f.titleHi).toLowerCase().includes(q) || String(f.titleEn).toLowerCase().includes(q))) return false;
      return true;
    });

    let publishedTests = (state.tests || []).filter((t) => {
      if (t.status !== 'published') return false;
      if (state.selectedFolderId && t.folderId !== state.selectedFolderId) return false;
      if (state.selectedExamFilter !== 'ALL' && t.examCode !== state.selectedExamFilter) return false;
      if (state.testSeriesFilter === 'FREE' && t.isPaid) return false;
      if (state.testSeriesFilter === 'PAID' && !t.isPaid) return false;
      if (state.testSeriesFilter === 'ATTEMPTED' && !(state.attempts || []).some((a) => a.testId === t.id)) return false;
      if (q && !(String(t.titleHi).toLowerCase().includes(q) || String(t.titleEn).toLowerCase().includes(q) || String(t.topic).toLowerCase().includes(q))) return false;
      return true;
    });

    if (state.testSeriesSort === 'price') {
      publishedTests.sort((a, b) => Number(a.priceInr || 0) - Number(b.priceInr || 0));
    }

    root.innerHTML = `
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
          <div>
            <h1 style="font-size:1.2rem;font-weight:800;">📚 Competitive Exam Test Series Catalog</h1>
            <p style="font-size:0.8rem;color:var(--text-secondary);">Filter by Exam Category, Free/Premium Access, or Search Syllabus Topics</p>
          </div>
          ${state.selectedFolderId ? `
            <button class="btn btn-outline btn-sm" id="clearFolderFilterBtn">⬅️ Back to All Series Folders</button>
          ` : ''}
        </div>

        <div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;margin-bottom:12px;">
          <input class="form-input" id="catalogSearchInput" value="${esc(state.searchQuery)}" placeholder="🔍 Search test series, exam name, or subject..." />
          <select class="form-select" id="catalogAccessFilter" style="width:auto;">
            <option value="ALL" ${state.testSeriesFilter === 'ALL' ? 'selected' : ''}>All Tests</option>
            <option value="FREE" ${state.testSeriesFilter === 'FREE' ? 'selected' : ''}>Free Only</option>
            <option value="PAID" ${state.testSeriesFilter === 'PAID' ? 'selected' : ''}>Premium Only</option>
            <option value="ATTEMPTED" ${state.testSeriesFilter === 'ATTEMPTED' ? 'selected' : ''}>Attempted</option>
          </select>
          <select class="form-select" id="catalogSortSelect" style="width:auto;">
            <option value="latest" ${state.testSeriesSort === 'latest' ? 'selected' : ''}>Sort: Latest</option>
            <option value="price" ${state.testSeriesSort === 'price' ? 'selected' : ''}>Sort: Price</option>
          </select>
        </div>

        <div class="chip-row" style="margin-bottom:0;">
          <button class="filter-chip ${state.selectedExamFilter === 'ALL' ? 'active' : ''}" data-cat-exam="ALL">All Exams</button>
          ${exams.map((ex) => `
            <button class="filter-chip ${state.selectedExamFilter === ex.code ? 'active' : ''}" data-cat-exam="${esc(ex.code)}">
              ${esc(ex.icon)} ${esc(ex.nameEn)}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Test Series Folders -->
      ${!state.selectedFolderId && filteredFolders.length > 0 ? `
        <div style="margin-bottom:18px;">
          <h2 style="font-size:1rem;font-weight:800;margin-bottom:10px;">🗂️ Structured Test Series Packages (${filteredFolders.length})</h2>
          <div class="grid-2">
            ${filteredFolders.map((f) => {
              const folderUnlocked = !f.isPaid || isCurrentUserAdmin() || Boolean(getActiveActivation(f.id));
              const testsInFolder = (state.tests || []).filter((t) => t.status === 'published' && t.folderId === f.id).length;
              return `
                <div class="card" style="margin-bottom:0;display:flex;flex-direction:column;justify-content:space-between;gap:10px;">
                  <div>
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                      <span class="badge badge-exam">${esc(f.examCode || 'CGPSC')}</span>
                      <span class="badge ${f.isPaid ? (folderUnlocked ? 'badge-free' : 'badge-paid') : 'badge-free'}">
                        ${f.isPaid ? (folderUnlocked ? '🔓 UNLOCKED SERIES' : '🔒 PREMIUM ₹' + f.priceInr + ' • ' + (f.validityDays || 180) + 'd') : '🟢 FREE SERIES'}
                      </span>
                    </div>
                    <h3 style="font-size:1rem;font-weight:800;margin-top:6px;">${esc(f.titleHi)}</h3>
                    <div style="font-size:0.8rem;color:var(--text-secondary);">${esc(f.titleEn)}</div>
                    <p style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">${esc(f.descriptionHi)}</p>
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border);">
                    <span style="font-size:0.76rem;font-weight:700;color:var(--text-secondary);">📄 ${testsInFolder} Published Tests</span>
                    <div style="display:flex;gap:6px;">
                      ${!folderUnlocked ? `
                        <button class="btn btn-warning btn-sm" data-unlock-paid-item="${esc(f.id)}" data-unlock-type="folder">🔓 Buy Series ₹${f.priceInr}</button>
                      ` : ''}
                      <button class="btn btn-primary btn-sm" data-open-folder="${esc(f.id)}">Open Series ➡️</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Individual Published Tests -->
      <div class="card">
        <h2 style="font-size:1rem;font-weight:800;margin-bottom:12px;">📝 Available Mock Tests (${publishedTests.length})</h2>
        ${publishedTests.length === 0 ? `
          <div style="text-align:center;padding:28px 16px;color:var(--text-muted);">
            <p style="font-weight:700;">No published tests match your current filter.</p>
            <p style="font-size:0.8rem;margin-top:4px;">Try switching the Exam Category chip to "All Exams" or check back after the Admin publishes new tests.</p>
          </div>
        ` : `
          <div class="grid-2">
            ${publishedTests.map((t) => renderTestCardHtml(t)).join('')}
          </div>
        `}
      </div>
    `;

    const searchInp = document.getElementById('catalogSearchInput');
    if (searchInp) {
      searchInp.oninput = () => {
        state.searchQuery = searchInp.value;
        saveState();
        renderTestSeriesCatalog(root);
      };
    }

    const accessSel = document.getElementById('catalogAccessFilter');
    if (accessSel) {
      accessSel.onchange = () => {
        state.testSeriesFilter = accessSel.value;
        saveState();
        renderTestSeriesCatalog(root);
      };
    }

    const sortSel = document.getElementById('catalogSortSelect');
    if (sortSel) {
      sortSel.onchange = () => {
        state.testSeriesSort = sortSel.value;
        saveState();
        renderTestSeriesCatalog(root);
      };
    }

    const clearFld = document.getElementById('clearFolderFilterBtn');
    if (clearFld) {
      clearFld.onclick = () => {
        state.selectedFolderId = null;
        saveState();
        renderTestSeriesCatalog(root);
      };
    }

    root.querySelectorAll('[data-cat-exam]').forEach((btn) => {
      btn.onclick = () => {
        state.selectedExamFilter = btn.getAttribute('data-cat-exam');
        saveState();
        renderTestSeriesCatalog(root);
      };
    });

    root.querySelectorAll('[data-open-folder]').forEach((btn) => {
      btn.onclick = () => {
        state.selectedFolderId = btn.getAttribute('data-open-folder');
        saveState();
        renderTestSeriesCatalog(root);
      };
    });

    bindTestCardButtons(root);
  }

  // =========================================================================
  // 3. Practice, PYQs, Bookmarks & Mistake Notebook Module
  // =========================================================================
  function renderPracticeAndMistakes(root) {
    const subjects = window.CGpediaCloud ? window.CGpediaCloud.DEFAULT_SUBJECTS : [];

    root.innerHTML = `
      <div class="grid-2">
        <!-- Custom Practice Session Builder -->
        <div class="card">
          <span class="badge badge-exam">SELF-PACED &amp; TIMED PRACTICE</span>
          <h2 style="font-size:1.1rem;font-weight:800;margin-top:4px;margin-bottom:8px;">🎯 Custom Subject &amp; Topic Practice Builder</h2>
          <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">
            Choose any subject, topic, question count, and timer to launch a customized bilingual CBT practice test.
          </p>
          <div class="form-group">
            <label class="form-label">Select Subject / विषय चुनें</label>
            <select class="form-select" id="pracSubjectSelect">
              ${subjects.map((s) => `<option value="${esc(s.titleEn)}">${esc(s.titleHi)} (${esc(s.titleEn)})</option>`).join('')}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
            <div>
              <label class="form-label">Question Count</label>
              <select class="form-select" id="pracQuestionCount">
                <option value="5">5 Questions (Quick Drill)</option>
                <option value="10" selected>10 Questions</option>
                <option value="20">20 Questions</option>
                <option value="50">50 Questions</option>
              </select>
            </div>
            <div>
              <label class="form-label">Time Limit (Minutes)</label>
              <select class="form-select" id="pracDurationMin">
                <option value="10">10 Minutes</option>
                <option value="15" selected>15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary" id="launchCustomPracticeBtn">🚀 Start Custom Practice Session</button>
        </div>

        <!-- Mistake Notebook & Bookmarks Quick Re-Practice -->
        <div class="card">
          <span class="badge badge-review">SMART REVISION</span>
          <h2 style="font-size:1.1rem;font-weight:800;margin-top:4px;margin-bottom:8px;">📓 Mistake Notebook &amp; Saved Bookmarks</h2>
          <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:14px;">
            Every incorrect question from your CBT attempts is automatically saved to your Mistake Notebook so you can master weak areas.
          </p>
          <div class="kpi-grid" style="grid-template-columns:1fr 1fr;margin-bottom:14px;">
            <div class="kpi-card">
              <div class="kpi-value" style="color:var(--danger);">${(state.mistakes || []).length}</div>
              <div class="kpi-label">Mistake Notebook Qs</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value" style="color:var(--secondary);">${(state.bookmarks || []).length}</div>
              <div class="kpi-label">Bookmarked Qs</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-danger btn-sm" id="practiceMistakesBtn" ${(state.mistakes || []).length === 0 ? 'disabled' : ''}>
              🔄 Re-Attempt Wrong Questions (${(state.mistakes || []).length})
            </button>
            <button class="btn btn-navy btn-sm" id="practiceBookmarksBtn" ${(state.bookmarks || []).length === 0 ? 'disabled' : ''}>
              🔖 Practice Bookmarked Qs (${(state.bookmarks || []).length})
            </button>
          </div>
        </div>
      </div>

      <!-- Subject & Chapter Wise Drill Grid -->
      <div class="card">
        <h3 style="font-size:1rem;font-weight:800;margin-bottom:12px;">📖 Subject &amp; Topic-Wise Practice Modules</h3>
        <div class="grid-2">
          ${subjects.map((s) => `
            <div style="padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--surface-alt);">
              <div style="font-weight:800;font-size:0.95rem;">${esc(s.titleHi)}</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:8px;">${esc(s.titleEn)}</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
                ${(s.topics || []).map((top) => `
                  <button class="filter-chip" data-drill-topic="${esc(top)}" style="font-size:0.72rem;padding:4px 10px;">
                    ▶️ ${esc(top)}
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Bookmarked Questions List -->
      ${(state.bookmarks || []).length > 0 ? `
        <div class="card">
          <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">🔖 Saved Bookmarked Questions (${state.bookmarks.length})</h3>
          <div style="display:grid;gap:10px;">
            ${state.bookmarks.map((bm, i) => `
              <div style="padding:12px;border:1px solid var(--border);border-radius:10px;">
                <div style="font-weight:700;font-size:0.9rem;">Q${i + 1}. ${esc(bm.questionHi)}</div>
                <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:6px;">${esc(bm.questionEn)}</div>
                <div style="font-size:0.8rem;color:var(--success);font-weight:700;">
                  ✓ Correct Answer: ${esc((bm.optionsHi && bm.optionsHi[bm.correctOptionIndex]) || '')} (${esc((bm.optionsEn && bm.optionsEn[bm.correctOptionIndex]) || '')})
                </div>
                <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">💡 ${esc(bm.explanationHi)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    document.getElementById('launchCustomPracticeBtn').onclick = () => {
      const subj = document.getElementById('pracSubjectSelect').value;
      const count = Number(document.getElementById('pracQuestionCount').value || 10);
      const dur = Number(document.getElementById('pracDurationMin').value || 15);
      const qs = generateHighYieldBilingualQuestions('prac_' + Date.now(), subj, count, '');
      window.CGpediaCBT.openPreTestInstructions({
        id: 'practice_' + Date.now(),
        examCode: state.selectedExamFilter === 'ALL' ? 'CGPSC' : state.selectedExamFilter,
        titleHi: `अभ्यास सत्र: ${subj}`,
        titleEn: `Practice Session: ${subj}`,
        topic: subj,
        durationMinutes: dur,
        marksPerQuestion: 2,
        negativeMarking: 0.66
      }, qs, cbtCallbacks);
    };

    root.querySelectorAll('[data-drill-topic]').forEach((btn) => {
      btn.onclick = () => {
        const topic = btn.getAttribute('data-drill-topic');
        const qs = generateHighYieldBilingualQuestions('drill_' + Date.now(), topic, 10, '');
        window.CGpediaCBT.openPreTestInstructions({
          id: 'drill_' + Date.now(),
          examCode: 'CGPSC',
          titleHi: `टॉपिक अभ्यास: ${topic}`,
          titleEn: `Topic Drill: ${topic}`,
          topic,
          durationMinutes: 15,
          marksPerQuestion: 2,
          negativeMarking: 0.66
        }, qs, cbtCallbacks);
      };
    });

    const pracMistakes = document.getElementById('practiceMistakesBtn');
    if (pracMistakes) {
      pracMistakes.onclick = () => {
        window.CGpediaCBT.openPreTestInstructions({
          id: 'mistakes_' + Date.now(),
          examCode: 'REVISION',
          titleHi: 'मिस्टेक नोटबुक रिवीजन टेस्ट',
          titleEn: 'Mistake Notebook Revision Test',
          topic: 'Previously Incorrect Questions',
          durationMinutes: Math.max(10, state.mistakes.length * 2),
          marksPerQuestion: 2,
          negativeMarking: 0.66
        }, state.mistakes, cbtCallbacks);
      };
    }

    const pracBm = document.getElementById('practiceBookmarksBtn');
    if (pracBm) {
      pracBm.onclick = () => {
        window.CGpediaCBT.openPreTestInstructions({
          id: 'bookmarks_' + Date.now(),
          examCode: 'REVISION',
          titleHi: 'बुकमार्क प्रश्न रिवीजन टेस्ट',
          titleEn: 'Bookmarked Questions Revision Test',
          topic: 'Saved Bookmarks',
          durationMinutes: Math.max(10, state.bookmarks.length * 2),
          marksPerQuestion: 2,
          negativeMarking: 0.66
        }, state.bookmarks, cbtCallbacks);
      };
    }
  }

  // =========================================================================
  // 4. Post-Test Results, Bilingual Solutions & Performance Analytics
  // =========================================================================
  function renderResultsAndAnalytics(root) {
    const attempts = state.attempts || [];
    if (attempts.length === 0) {
      root.innerHTML = `
        <div class="card" style="text-align:center;padding:36px 20px;">
          <div style="font-size:2.5rem;margin-bottom:8px;">📊</div>
          <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:6px;">No Exam Attempts Recorded Yet</h2>
          <p style="font-size:0.85rem;color:var(--text-secondary);max-width:440px;margin:0 auto 16px;">
            जब आप कोई मॉक टेस्ट, प्रैक्टिस सेट या डेली क्विज़ सबमिट करेंगे, तो आपका स्कोरकार्ड, विषय-वार सटीकता (Subject Accuracy), समय विश्लेषण और विस्तृत द्विभाषी समाधान यहाँ दिखाई देंगे।
          </p>
          <button class="btn btn-primary" id="analyticsStartPracticeBtn">🎯 Take a Quick Practice Test</button>
        </div>
      `;
      document.getElementById('analyticsStartPracticeBtn').onclick = () => {
        state.activeTab = 'practice';
        saveState();
        renderApp();
      };
      return;
    }

    const activeAttempt = attempts.find((a) => a.id === state.activeResultId) || attempts[0];
    const avgAccuracy = Math.round(attempts.reduce((s, a) => s + Number(a.accuracyPercent || 0), 0) / attempts.length);
    const totalQsSolved = attempts.reduce((s, a) => s + Number(a.attemptedCount || 0), 0);

    // Aggregate subject-wise accuracy across all attempts for Strengths & Weaknesses
    const aggSubj = {};
    attempts.forEach((att) => {
      Object.entries(att.subjectStats || {}).forEach(([subj, st]) => {
        if (!aggSubj[subj]) aggSubj[subj] = { total: 0, attempted: 0, correct: 0 };
        aggSubj[subj].total += Number(st.total || 0);
        aggSubj[subj].attempted += Number(st.attempted || 0);
        aggSubj[subj].correct += Number(st.correct || 0);
      });
    });

    const questions = activeAttempt.questionsSnapshot || [];
    const answers = activeAttempt.selectedAnswers || {};

    root.innerHTML = `
      <!-- Overall Cumulative Analytics KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-value">${attempts.length}</div>
          <div class="kpi-label">Tests Completed</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value" style="color:var(--success);">${avgAccuracy}%</div>
          <div class="kpi-label">Overall Accuracy</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${totalQsSolved}</div>
          <div class="kpi-label">Questions Attempted</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value" style="color:var(--secondary);">Top ${Math.max(1, 100 - avgAccuracy)}%</div>
          <div class="kpi-label">Estimated Percentile</div>
        </div>
      </div>

      <!-- Attempt Switcher -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
          <div>
            <span class="badge badge-exam">${esc(activeAttempt.examCode || 'CBT RESULT')}</span>
            <h2 style="font-size:1.15rem;font-weight:800;margin-top:4px;">${esc(activeAttempt.testTitleHi)}</h2>
            <div style="font-size:0.78rem;color:var(--text-muted);">Submitted on ${new Date(activeAttempt.submittedAtIso).toLocaleString()}</div>
          </div>
          <select class="form-select" id="analyticsSelectAttempt" style="width:auto;min-width:240px;">
            ${attempts.map((a) => `
              <option value="${esc(a.id)}" ${a.id === activeAttempt.id ? 'selected' : ''}>
                ${esc(a.testTitleHi)} — Score: ${a.score}/${a.maxScore} (${a.accuracyPercent}%)
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Detailed Scorecard Grid -->
        <div class="kpi-grid" style="margin-bottom:14px;">
          <div class="kpi-card" style="border-color:var(--secondary);">
            <div class="kpi-value" style="color:var(--secondary);">${activeAttempt.score} <span style="font-size:0.9rem;color:var(--text-muted);">/ ${activeAttempt.maxScore}</span></div>
            <div class="kpi-label">Net Score (After Neg)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value" style="color:var(--success);">${activeAttempt.correctCount}</div>
            <div class="kpi-label">Correct (+${activeAttempt.positiveMarks || 0})</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value" style="color:var(--danger);">${activeAttempt.incorrectCount}</div>
            <div class="kpi-label">Incorrect (-${activeAttempt.negativeDeduction || 0})</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${activeAttempt.unattemptedCount}</div>
            <div class="kpi-label">Unattempted</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${activeAttempt.accuracyPercent}%</div>
            <div class="kpi-label">Test Accuracy</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${Math.floor((activeAttempt.timeTakenSeconds || 0) / 60)}m ${(activeAttempt.timeTakenSeconds || 0) % 60}s</div>
            <div class="kpi-label">Time Taken</div>
          </div>
        </div>

        <!-- Subject-Wise Performance Breakdown Chart -->
        <h3 style="font-size:0.94rem;font-weight:800;margin-bottom:10px;">📈 Subject &amp; Topic-Wise Accuracy Diagnostic</h3>
        <div style="display:grid;gap:10px;">
          ${Object.entries(aggSubj).map(([subj, st]) => {
            const acc = st.attempted > 0 ? Math.round((st.correct / st.attempted) * 100) : 0;
            const barColor = acc >= 70 ? '#16A34A' : acc >= 45 ? '#D97706' : '#DC2626';
            const statusTag = acc >= 70 ? 'Strong Area 💪' : acc >= 45 ? 'Moderate ⚡' : 'Needs Revision 🎯';
            return `
              <div>
                <div style="display:flex;justify-content:space-between;font-size:0.8rem;font-weight:700;margin-bottom:4px;">
                  <span>${esc(subj)} (${st.correct}/${st.attempted} correct)</span>
                  <span style="color:${barColor};">${acc}% — ${statusTag}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width:${acc}%;background:${barColor};"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Detailed Bilingual Solutions & Explanations -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
          <h3 style="font-size:1.02rem;font-weight:800;">📖 Detailed Bilingual Answer Key &amp; Explanations</h3>
          <div class="chip-row" style="margin-bottom:0;">
            ${['ALL', 'CORRECT', 'INCORRECT', 'UNATTEMPTED'].map((flt) => `
              <button class="filter-chip ${state.solutionFilter === flt ? 'active' : ''}" data-sol-filter="${flt}" style="padding:4px 11px;font-size:0.74rem;">
                ${flt}
              </button>
            `).join('')}
          </div>
        </div>

        <div style="display:grid;gap:12px;">
          ${questions.map((q, idx) => {
            const chosen = answers[idx];
            const isAttempted = chosen !== undefined && chosen !== null;
            const isCorrect = isAttempted && Number(chosen) === Number(q.correctOptionIndex);
            if (state.solutionFilter === 'CORRECT' && !isCorrect) return '';
            if (state.solutionFilter === 'INCORRECT' && (!isAttempted || isCorrect)) return '';
            if (state.solutionFilter === 'UNATTEMPTED' && isAttempted) return '';

            const statusBadge = !isAttempted
              ? `<span class="badge badge-draft">⚪ Unattempted</span>`
              : isCorrect
                ? `<span class="badge badge-free">✅ Correct</span>`
                : `<span class="badge badge-live">❌ Incorrect</span>`;

            return `
              <div style="padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--surface-alt);">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span class="badge badge-exam">Q${idx + 1}</span>
                    ${statusBadge}
                    <span class="badge badge-draft">${esc(q.subjectTag || 'GS')}</span>
                  </div>
                  <div style="font-size:0.75rem;color:var(--text-muted);">
                    ⏱️ Time Spent: <strong>${(activeAttempt.questionTimeSec && activeAttempt.questionTimeSec[idx]) || 0}s</strong>
                  </div>
                </div>

                <div style="font-weight:700;font-size:0.94rem;margin-bottom:4px;">${esc(q.questionHi)}</div>
                <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:10px;">${esc(q.questionEn)}</div>

                <div style="display:grid;gap:6px;margin-bottom:10px;">
                  ${[0, 1, 2, 3].map((oIdx) => {
                    const isRight = Number(q.correctOptionIndex) === oIdx;
                    const isUserPick = isAttempted && Number(chosen) === oIdx;
                    const bg = isRight ? 'var(--success-soft)' : isUserPick ? 'var(--danger-soft)' : 'var(--surface)';
                    const border = isRight ? 'var(--success)' : isUserPick ? 'var(--danger)' : 'var(--border)';
                    return `
                      <div style="padding:8px 12px;border-radius:8px;border:1.5px solid ${border};background:${bg};font-size:0.84rem;display:flex;justify-content:space-between;gap:8px;">
                        <span><strong>${['A', 'B', 'C', 'D'][oIdx]}.</strong> ${esc((q.optionsHi && q.optionsHi[oIdx]) || '')} / ${esc((q.optionsEn && q.optionsEn[oIdx]) || '')}</span>
                        <span>${isRight ? '✅ Correct Answer' : isUserPick ? '❌ Your Answer' : ''}</span>
                      </div>
                    `;
                  }).join('')}
                </div>

                <div style="padding:10px 12px;border-radius:8px;background:var(--secondary-soft);font-size:0.82rem;">
                  <strong>💡 विस्तृत व्याख्या / Explanation:</strong>
                  <div style="margin-top:3px;">${esc(q.explanationHi || '')}</div>
                  ${q.explanationEn && q.explanationEn !== q.explanationHi ? `<div style="margin-top:3px;color:var(--text-secondary);">${esc(q.explanationEn)}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    const selAtt = document.getElementById('analyticsSelectAttempt');
    if (selAtt) {
      selAtt.onchange = () => {
        state.activeResultId = selAtt.value;
        saveState();
        renderResultsAndAnalytics(root);
      };
    }

    root.querySelectorAll('[data-sol-filter]').forEach((btn) => {
      btn.onclick = () => {
        state.solutionFilter = btn.getAttribute('data-sol-filter');
        saveState();
        renderResultsAndAnalytics(root);
      };
    });
  }

  // =========================================================================
  // 5. Leaderboard View
  // =========================================================================
  function renderLeaderboardView(root) {
    const entries = [...(state.leaderboard || [])].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

    root.innerHTML = `
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
          <div>
            <h1 style="font-size:1.15rem;font-weight:800;">🏆 All-India &amp; State Merit Leaderboard</h1>
            <p style="font-size:0.8rem;color:var(--text-secondary);">Live rankings based on verified CBT test submissions</p>
          </div>
          <label style="display:flex;align-items:center;gap:6px;font-size:0.8rem;cursor:pointer;">
            <input type="checkbox" id="leaderboardPrivacyToggle" ${state.student.leaderboardPublic !== false ? 'checked' : ''} />
            Show my name publicly on Leaderboard
          </label>
        </div>

        ${entries.length === 0 ? `
          <div style="text-align:center;padding:30px 16px;color:var(--text-muted);">
            No leaderboard rankings recorded yet. Complete your first CBT test to appear on the Merit List!
          </div>
        ` : `
          <div style="display:grid;gap:8px;">
            ${entries.slice(0, 50).map((e, idx) => {
              const rank = idx + 1;
              const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
              return `
                <div style="padding:12px 14px;border-radius:10px;border:1px solid var(--border);background:${rank <= 3 ? 'var(--secondary-soft)' : 'var(--surface-alt)'};display:flex;align-items:center;justify-content:space-between;gap:10px;">
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div style="font-size:1.1rem;font-weight:800;min-width:34px;">${medal}</div>
                    <div>
                      <div style="font-weight:800;font-size:0.92rem;">${esc(e.studentName)}</div>
                      <div style="font-size:0.75rem;color:var(--text-muted);">${esc(e.testTitle)} • Accuracy: ${e.accuracyPercent}%</div>
                    </div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-weight:800;font-size:1rem;color:var(--secondary);">${e.score} / ${e.maxScore}</div>
                    <div style="font-size:0.72rem;color:var(--text-muted);">${Math.floor((e.timeTakenSeconds || 0) / 60)}m ${(e.timeTakenSeconds || 0) % 60}s</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    const privToggle = document.getElementById('leaderboardPrivacyToggle');
    if (privToggle) {
      privToggle.onchange = () => {
        state.student.leaderboardPublic = privToggle.checked;
        saveState();
        toast('🔒 Leaderboard privacy preference updated.');
      };
    }
  }

  // =========================================================================
  // 6. Current Affairs View (Monthly Digest + Month Jumper + Custom Quiz Maker)
  // =========================================================================
  function getStoryMonthKey(st) {
    if (st && st.monthKey && /^\d{4}-\d{2}$/.test(st.monthKey)) return st.monthKey;
    const ms = Number((st && (st.createdAtMs || (st.createdAtIso ? Date.parse(st.createdAtIso) : 0))) || Date.now());
    const d = new Date(ms > 0 ? ms : Date.now());
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  function getStoryYearKey(st) {
    if (st && st.yearKey && /^\d{4}$/.test(st.yearKey)) return st.yearKey;
    return getStoryMonthKey(st).slice(0, 4);
  }

  function formatMonthKeyDisplay(monthKey) {
    const namesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const namesHi = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
    const parts = String(monthKey || '').split('-');
    const yr = parts[0] || new Date().getFullYear();
    const mIdx = Math.max(0, Math.min(11, ( parseInt(parts[1], 10) || (new Date().getMonth() + 1) ) - 1));
    return `${namesHi[mIdx]} ${yr} (${namesEn[mIdx]} ${yr})`;
  }

  function renderCurrentAffairsView(root) {
    const allStories = getCanonicalCurrentAffairsList();
    const lang = getCaLangMode();
    const isHi = lang === 'hi';

    const nowDate = new Date();
    const currentMonthKey = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
    const currentYearKey = String(nowDate.getFullYear());

    // Build list of available months (always include current month + past 11 months)
    const monthSet = new Set([currentMonthKey]);
    for (let i = 1; i <= 11; i++) {
      const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
      monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    allStories.forEach((st) => monthSet.add(getStoryMonthKey(st)));
    const sortedMonths = Array.from(monthSet).sort().reverse();

    const yearSet = new Set([currentYearKey, String(nowDate.getFullYear() - 1)]);
    allStories.forEach((st) => yearSet.add(getStoryYearKey(st)));
    const sortedYears = Array.from(yearSet).sort().reverse();

    const activeMonthKey = state.selectedCaMonthKey && monthSet.has(state.selectedCaMonthKey)
      ? state.selectedCaMonthKey
      : currentMonthKey;

    const selectedCaCategory = state.caCategoryFilter || 'ALL';
    const allMonthlyStories = sortStoriesLatestFirst(
      allStories.filter((st) => getStoryMonthKey(st) === activeMonthKey)
    );
    // Keep Daily Dose and Current Affairs synchronized from the exact same database
    const dailyDoseStories = activeMonthKey === currentMonthKey
      ? allMonthlyStories
      : getActiveDailyDoseStories();

    const cgCount = allMonthlyStories.filter((s) => normalizeStoryCategory(s.category) === 'chhattisgarh').length;
    const natCount = allMonthlyStories.filter((s) => normalizeStoryCategory(s.category) === 'national').length;
    const intCount = allMonthlyStories.filter((s) => normalizeStoryCategory(s.category) === 'international').length;

    const monthlyStories = selectedCaCategory === 'ALL'
      ? allMonthlyStories
      : allMonthlyStories.filter((s) => normalizeStoryCategory(s.category) === selectedCaCategory);

    const quizScope = state.caQuizScope || 'recent';
    const quizMonth = state.caQuizMonth || activeMonthKey;
    const quizYear = state.caQuizYear || currentYearKey;
    const quizCount = Number(state.caQuizQuestionCount || 10);
    const quizDuration = Number(state.caQuizDurationMinutes || 12);

    root.innerHTML = `
      <!-- Top Story Strip for Daily Dose (Synchronized with Current Affairs Database) -->
      ${renderDailyDoseStoryStripHtml(dailyDoseStories, 'ca')}

      <!-- Customizable Current Affairs Quiz Maker -->
      <div class="card" style="border-left:5px solid var(--primary);margin-bottom:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
          <div>
            <span class="badge badge-exam">🎯 CUSTOM CURRENT AFFAIRS QUIZ MAKER</span>
            <h2 style="font-size:1.1rem;font-weight:800;margin-top:4px;">${isHi ? 'समसामयिकी टेस्ट एवं क्विज़ मेकर' : 'Current Affairs Quiz Maker'}</h2>
            <p style="font-size:0.8rem;color:var(--text-secondary);">
              ${isHi
                ? 'अपनी पसंद के अनुसार हालिया (Recent), मासिक (Monthly) या वार्षिक (Yearly) करंट अफेयर्स चुनें तथा प्रश्नों की संख्या और समय निर्धारित करें।'
                : 'Select Recent, Monthly, or Yearly Current Affairs and customize question count and duration.'}
            </p>
          </div>
        </div>

        <div class="grid-3" style="gap:10px;align-items:end;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">${isHi ? '1. करंट अफेयर्स अवधि' : '1. Quiz Period'}</label>
            <select class="form-select" id="caQuizScopeSelect">
              <option value="recent" ${quizScope === 'recent' ? 'selected' : ''}>⚡ ${isHi ? 'हालिया समसामयिकी (Recent)' : 'Recent Current Affairs'}</option>
              <option value="monthly" ${quizScope === 'monthly' ? 'selected' : ''}>📅 ${isHi ? 'मासिक समसामयिकी (Monthly)' : 'Monthly Current Affairs'}</option>
              <option value="yearly" ${quizScope === 'yearly' ? 'selected' : ''}>🗓️ ${isHi ? 'वार्षिक समसामयिकी (Yearly)' : 'Yearly Current Affairs'}</option>
            </select>
          </div>

          <div class="form-group" id="caQuizMonthSelectWrap" style="margin-bottom:0;display:${quizScope === 'monthly' ? 'block' : 'none'};">
            <label class="form-label">${isHi ? 'महीना चुनें' : 'Select Month'}</label>
            <select class="form-select" id="caQuizMonthSelect">
              ${sortedMonths.map((m) => `<option value="${esc(m)}" ${quizMonth === m ? 'selected' : ''}>${esc(formatMonthKeyDisplay(m))}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" id="caQuizYearSelectWrap" style="margin-bottom:0;display:${quizScope === 'yearly' ? 'block' : 'none'};">
            <label class="form-label">${isHi ? 'वर्ष चुनें' : 'Select Year'}</label>
            <select class="form-select" id="caQuizYearSelect">
              ${sortedYears.map((y) => `<option value="${esc(y)}" ${quizYear === y ? 'selected' : ''}>${isHi ? `वर्ष ${esc(y)}` : `Year ${esc(y)} Complete`}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">${isHi ? '2. कुल प्रश्न' : '2. Number of Questions'}</label>
            <input type="number" min="5" max="100" step="1" class="form-input" id="caQuizQuestionCountInput" value="${quizCount}" placeholder="e.g. 10, 20, 50" />
          </div>

          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">${isHi ? '3. समय (मिनट में)' : '3. Duration (Minutes)'}</label>
            <input type="number" min="3" max="180" step="1" class="form-input" id="caQuizDurationInput" value="${quizDuration}" placeholder="e.g. 10, 15, 30" />
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
            <span style="font-size:0.75rem;color:var(--text-secondary);font-weight:700;">Quick Presets:</span>
            <button type="button" class="btn btn-outline btn-sm" data-ca-preset="10-10">10 Q • 10 Min</button>
            <button type="button" class="btn btn-outline btn-sm" data-ca-preset="20-20">20 Q • 20 Min</button>
            <button type="button" class="btn btn-outline btn-sm" data-ca-preset="30-30">30 Q • 30 Min</button>
            <button type="button" class="btn btn-outline btn-sm" data-ca-preset="50-45">50 Q • 45 Min</button>
          </div>
          <button class="btn btn-primary" id="caPageLaunchCustomQuizBtn">🎯 ${isHi ? 'कस्टम करंट अफेयर्स क्विज़ प्रारंभ करें' : 'Start Custom Current Affairs Quiz'}</button>
        </div>
      </div>

      <!-- Current Affairs Digest Section with 3 Category Tabs & Language Switch -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
          <div>
            <span class="badge badge-free">📅 ${isHi ? 'समसामयिकी संग्रह' : 'CURRENT AFFAIRS ARCHIVE'}</span>
            <h1 style="font-size:1.15rem;font-weight:800;margin-top:4px;">
              ⚡ ${isHi ? `समसामयिकी: ${esc(formatMonthKeyDisplay(activeMonthKey))}` : `Current Affairs: ${esc(formatMonthKeyDisplay(activeMonthKey))}`}
            </h1>
            <p style="font-size:0.8rem;color:var(--text-secondary);">
              ${isHi
                ? `कुल अपडेट्स: ${allMonthlyStories.length} (Daily Dose: ${dailyDoseStories.length} के साथ पूर्णतः सिंक)`
                : `Total Updates: ${allMonthlyStories.length} (Synced with Daily Dose: ${dailyDoseStories.length})`}
            </p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <div style="display:inline-flex;border-radius:99px;border:1px solid var(--border-strong);overflow:hidden;background:var(--surface-alt);">
              <button type="button" data-set-ca-lang="hi" style="padding:5px 12px;font-size:0.76rem;font-weight:800;border:none;cursor:pointer;background:${isHi ? 'var(--secondary)' : 'transparent'};color:${isHi ? '#fff' : 'var(--text)'};">हिंदी</button>
              <button type="button" data-set-ca-lang="en" style="padding:5px 12px;font-size:0.76rem;font-weight:800;border:none;cursor:pointer;background:${!isHi ? 'var(--secondary)' : 'transparent'};color:${!isHi ? '#fff' : 'var(--text)'};">English</button>
            </div>
            ${activeMonthKey !== sortedMonths[0] ? `
              <button class="btn btn-outline btn-sm" id="caBackToLatestMonthBtn">⬆️ ${isHi ? 'नवीनतम महीना' : 'Latest Month'}</button>
            ` : ''}
            <button class="btn btn-primary btn-sm" id="caMonthQuickQuizBtn">🎯 ${isHi ? `${esc(activeMonthKey)} क्विज़` : `Practice ${esc(activeMonthKey)} Quiz`}</button>
          </div>
        </div>

        <!-- Three Clearly Separated Category Filter Tabs -->
        <div class="chip-row" style="margin-bottom:14px;">
          <button type="button" class="filter-chip ${selectedCaCategory === 'ALL' ? 'active' : ''}" data-ca-cat-filter="ALL">
            🌟 ${isHi ? 'सभी श्रेणियां' : 'All Categories'} (${allMonthlyStories.length})
          </button>
          <button type="button" class="filter-chip ${selectedCaCategory === 'chhattisgarh' ? 'active' : ''}" data-ca-cat-filter="chhattisgarh">
            🌾 ${isHi ? '1. छत्तीसगढ़' : '1. Chhattisgarh'} (${cgCount})
          </button>
          <button type="button" class="filter-chip ${selectedCaCategory === 'national' ? 'active' : ''}" data-ca-cat-filter="national">
            🇮🇳 ${isHi ? '2. राष्ट्रीय' : '2. National'} (${natCount})
          </button>
          <button type="button" class="filter-chip ${selectedCaCategory === 'international' ? 'active' : ''}" data-ca-cat-filter="international">
            🌍 ${isHi ? '3. अंतर्राष्ट्रीय' : '3. International'} (${intCount})
          </button>
        </div>

        ${monthlyStories.length === 0 ? `
          <div style="padding:20px;border:1px dashed var(--border-strong);border-radius:12px;text-align:center;background:var(--surface-alt);margin-bottom:14px;">
            <div style="font-weight:800;font-size:0.95rem;margin-bottom:6px;">
              ${isHi ? 'इस श्रेणी/महीने में अभी कोई करंट अफेयर्स उपलब्ध नहीं है।' : 'No Current Affairs updates found in this category/month.'}
            </div>
            <button class="btn btn-primary btn-sm" id="caEmptyMonthQuizBtn">🎯 ${isHi ? 'समसामयिकी क्विज़ प्रारंभ करें' : 'Start Current Affairs Quiz Now'}</button>
          </div>
        ` : `
          <div class="grid-2" style="margin-bottom:18px;">
            ${monthlyStories.map((st, idx) => {
              const normCat = normalizeStoryCategory(st.category);
              const catLabel = getStoryCategoryLabel(normCat, lang);
              const headlineText = getStoryLocalizedHeadline(st, lang);
              const summaryText = getStoryLocalizedSummary(st, lang);
              const imgUrl = getStoryImageUrl(st);
              const isAiImg = isStoryImageAiGenerated(st);
              const isSeen = isStorySeenByStudent(st.id);
              const dateDisplay = st.createdAtIso
                ? new Date(st.createdAtIso).toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : activeMonthKey;
              return `
                <div class="card" style="margin-bottom:0;background:var(--surface-alt);display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;">
                  <div>
                    ${imgUrl ? `
                      <div style="position:relative;width:100%;height:175px;border-radius:12px;overflow:hidden;margin-bottom:10px;border:1px solid var(--border);background:#091534;">
                        <img src="${esc(imgUrl)}" alt="${esc(headlineText)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" />
                        ${isAiImg ? `
                          <span style="position:absolute;top:8px;right:8px;background:rgba(15,23,42,0.86);color:#FDE68A;border:1px solid rgba(253,230,138,0.45);font-size:0.68rem;font-weight:800;padding:3px 9px;border-radius:99px;backdrop-filter:blur(4px);">
                            ✨ AI Generated Image
                          </span>
                        ` : ''}
                        <span style="position:absolute;bottom:8px;left:8px;background:${isSeen ? 'rgba(15,23,42,0.78)' : 'rgba(16,185,129,0.92)'};color:#fff;font-size:0.66rem;font-weight:800;padding:2px 8px;border-radius:99px;">
                          ${isSeen ? (isHi ? '✓ देखा गया' : '✓ Seen') : (isHi ? '● नया (अनदेखा)' : '● Unseen')}
                        </span>
                      </div>
                    ` : ''}
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span class="badge badge-exam">${esc(catLabel)}</span>
                      <span style="font-size:0.72rem;color:var(--text-muted);">${esc(dateDisplay)} • ${esc(formatStoryUploadTimeShort(st))}</span>
                    </div>
                    <h3 style="font-size:1rem;font-weight:800;margin-top:8px;line-height:1.42;color:var(--text);">${esc(headlineText)}</h3>
                    <p style="font-size:0.85rem;line-height:1.62;color:var(--text-secondary);margin-top:6px;">${esc(summaryText)}</p>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:8px;border-top:1px solid var(--border);gap:8px;flex-wrap:wrap;">
                    <span style="font-size:0.72rem;color:var(--text-muted);">
                      ${isHi ? 'स्रोत' : 'Source'}: ${st.sourceUrl ? `<a href="${esc(st.sourceUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--secondary);font-weight:700;text-decoration:none;">${esc(st.sourceName || 'Official Portal')} ↗</a>` : esc(st.sourceName || 'Official PIB / DPR')}
                    </span>
                    <button class="btn btn-outline btn-sm" data-open-monthly-story="${idx}" style="padding:4px 10px;font-size:0.74rem;">
                      📖 ${isHi ? 'स्टोरी देखें' : 'View Story'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}

        <!-- Bottom Month Jumper to View Older Months' Current Affairs -->
        <div style="padding:14px;border-radius:12px;border:1px solid var(--border-strong);background:var(--surface-alt);margin-top:8px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
            <div>
              <h3 style="font-size:0.95rem;font-weight:800;">📅 ${isHi ? 'पुराने महीनों के करंट अफेयर्स देखें' : 'Jump to Another Month'}</h3>
              <p style="font-size:0.78rem;color:var(--text-secondary);">${isHi ? 'नीचे किसी भी महीने पर क्लिक करें या महीना चुनकर पुराने करंट अफेयर्स पढ़ें:' : 'Select any month below to browse archived Current Affairs:'}</p>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <select class="form-select" id="caBottomMonthJumpSelect" style="width:auto;min-width:210px;">
                ${sortedMonths.map((m) => `<option value="${esc(m)}" ${activeMonthKey === m ? 'selected' : ''}>📅 ${esc(formatMonthKeyDisplay(m))}</option>`).join('')}
              </select>
              <button class="btn btn-primary btn-sm" id="caBottomMonthJumpBtn">📂 ${isHi ? 'चयनित महीना खोलें' : 'Open Selected Month'}</button>
            </div>
          </div>
          <div class="chip-row" style="margin-bottom:0;">
            ${sortedMonths.slice(0, 8).map((m) => `
              <button class="filter-chip ${activeMonthKey === m ? 'active' : ''}" data-ca-jump-month="${esc(m)}">
                📅 ${esc(formatMonthKeyDisplay(m))}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Bind Story strip on Current Affairs page
    bindDailyDoseStoryStripEvents(root, dailyDoseStories, 'ca');

    // Bind Language Switch buttons
    root.querySelectorAll('[data-set-ca-lang]').forEach((btn) => {
      btn.onclick = () => {
        const nextLang = btn.getAttribute('data-set-ca-lang');
        setCaLangMode(nextLang);
        renderCurrentAffairsView(root);
      };
    });

    // Bind Category Filter chips
    root.querySelectorAll('[data-ca-cat-filter]').forEach((chip) => {
      chip.onclick = () => {
        state.caCategoryFilter = chip.getAttribute('data-ca-cat-filter') || 'ALL';
        saveState();
        renderCurrentAffairsView(root);
      };
    });

    // Bind Monthly Story Card reader (opens in chronological order starting at clicked item)
    root.querySelectorAll('[data-open-monthly-story]').forEach((el) => {
      el.onclick = () => {
        const idx = Number(el.getAttribute('data-open-monthly-story'));
        const clickedStory = monthlyStories[idx];
        if (clickedStory) {
          const catStories = sortStoriesOldestToNewest(
            monthlyStories.filter((s) => normalizeStoryCategory(s.category) === normalizeStoryCategory(clickedStory.category))
          );
          openStoryViewerModal(clickedStory, catStories.length > 0 ? catStories : [clickedStory], { autoStartUnseen: false });
        }
      };
    });

    // Scope selector toggle
    const scopeSel = document.getElementById('caQuizScopeSelect');
    if (scopeSel) {
      scopeSel.onchange = () => {
        state.caQuizScope = scopeSel.value;
        const mWrap = document.getElementById('caQuizMonthSelectWrap');
        const yWrap = document.getElementById('caQuizYearSelectWrap');
        if (mWrap) mWrap.style.display = scopeSel.value === 'monthly' ? 'block' : 'none';
        if (yWrap) yWrap.style.display = scopeSel.value === 'yearly' ? 'block' : 'none';
      };
    }

    // Presets
    root.querySelectorAll('[data-ca-preset]').forEach((btn) => {
      btn.onclick = () => {
        const parts = String(btn.getAttribute('data-ca-preset') || '10-10').split('-');
        const qInp = document.getElementById('caQuizQuestionCountInput');
        const dInp = document.getElementById('caQuizDurationInput');
        if (qInp) qInp.value = Number(parts[0] || 10);
        if (dInp) dInp.value = Number(parts[1] || 10);
      };
    });

    // Launch custom quiz button
    const launchCustomBtn = document.getElementById('caPageLaunchCustomQuizBtn');
    if (launchCustomBtn) {
      launchCustomBtn.onclick = () => {
        const scope = (document.getElementById('caQuizScopeSelect') && document.getElementById('caQuizScopeSelect').value) || 'recent';
        const mKey = (document.getElementById('caQuizMonthSelect') && document.getElementById('caQuizMonthSelect').value) || activeMonthKey;
        const yKey = (document.getElementById('caQuizYearSelect') && document.getElementById('caQuizYearSelect').value) || currentYearKey;
        const qCount = Math.max(5, Math.min(100, Number((document.getElementById('caQuizQuestionCountInput') && document.getElementById('caQuizQuestionCountInput').value) || 10)));
        const durMin = Math.max(3, Math.min(180, Number((document.getElementById('caQuizDurationInput') && document.getElementById('caQuizDurationInput').value) || 12)));
        state.caQuizScope = scope;
        state.caQuizMonth = mKey;
        state.caQuizYear = yKey;
        state.caQuizQuestionCount = qCount;
        state.caQuizDurationMinutes = durMin;
        saveState();
        launchCustomCurrentAffairsQuiz({
          scopeType: scope,
          monthKey: mKey,
          yearKey: yKey,
          questionCount: qCount,
          durationMinutes: durMin,
          buttonEl: launchCustomBtn
        });
      };
    }

    const monthQuickQuizBtn = document.getElementById('caMonthQuickQuizBtn');
    if (monthQuickQuizBtn) {
      monthQuickQuizBtn.onclick = () => {
        launchCustomCurrentAffairsQuiz({
          scopeType: 'monthly',
          monthKey: activeMonthKey,
          yearKey: activeMonthKey.slice(0, 4),
          questionCount: Number(state.caQuizQuestionCount || 10),
          durationMinutes: Number(state.caQuizDurationMinutes || 12),
          buttonEl: monthQuickQuizBtn
        });
      };
    }

    const emptyMonthQuizBtn = document.getElementById('caEmptyMonthQuizBtn');
    if (emptyMonthQuizBtn) {
      emptyMonthQuizBtn.onclick = () => {
        launchCustomCurrentAffairsQuiz({
          scopeType: 'monthly',
          monthKey: activeMonthKey,
          yearKey: activeMonthKey.slice(0, 4),
          questionCount: Number(state.caQuizQuestionCount || 10),
          durationMinutes: Number(state.caQuizDurationMinutes || 12),
          buttonEl: emptyMonthQuizBtn
        });
      };
    }

    // Bottom Month Jump controls
    const backLatestBtn = document.getElementById('caBackToLatestMonthBtn');
    if (backLatestBtn) {
      backLatestBtn.onclick = () => {
        state.selectedCaMonthKey = sortedMonths[0];
        saveState();
        renderCurrentAffairsView(root);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }

    const bottomJumpBtn = document.getElementById('caBottomMonthJumpBtn');
    if (bottomJumpBtn) {
      bottomJumpBtn.onclick = () => {
        const sel = document.getElementById('caBottomMonthJumpSelect');
        if (sel && sel.value) {
          state.selectedCaMonthKey = sel.value;
          saveState();
          renderCurrentAffairsView(root);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };
    }

    root.querySelectorAll('[data-ca-jump-month]').forEach((chip) => {
      chip.onclick = () => {
        const targetMonth = chip.getAttribute('data-ca-jump-month');
        if (targetMonth) {
          state.selectedCaMonthKey = targetMonth;
          saveState();
          renderCurrentAffairsView(root);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };
    });
  }

  // =========================================================================
  // 7. Notifications & Private Student Doubt/Support Desk
  // =========================================================================
  function renderNotificationsAndSupport(root) {
    markAllCurrentNotificationsAsRead();
    const myQueries = (state.queries || []).filter((q) => q.studentEmail === state.student.email || q.userId === state.student.uid);

    root.innerHTML = `
      <div class="grid-2">
        <div class="card">
          <h2 style="font-size:1.05rem;font-weight:800;margin-bottom:12px;">📢 Official Announcements &amp; Exam Alerts</h2>
          ${(state.notifications || []).length === 0 ? `
            <p style="font-size:0.84rem;color:var(--text-muted);">No announcements posted yet.</p>
          ` : `
            <div style="display:grid;gap:10px;">
              ${(state.notifications || []).slice().sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map((n) => `
                <div style="padding:12px;border:1px solid ${n.isPinned ? 'var(--secondary)' : 'var(--border)'};border-radius:10px;background:var(--surface-alt);">
                  ${n.isPinned ? `<span class="badge badge-exam">📌 PINNED</span>` : ''}
                  <div style="font-weight:800;font-size:0.94rem;margin-top:4px;">${esc(n.titleHi)}</div>
                  ${n.titleEn && n.titleEn !== n.titleHi ? `<div style="font-size:0.78rem;color:var(--text-secondary);margin-top:2px;">${esc(n.titleEn)}</div>` : ''}
                  <div style="font-size:0.83rem;color:var(--text-secondary);margin-top:4px;">${esc(n.messageHi)}</div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="card">
          <h2 style="font-size:1.05rem;font-weight:800;margin-bottom:10px;">💬 Ask Doubt / Payment Support Desk</h2>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-select" id="stuQueryCategory">
              <option value="doubt">Academic / Question Doubt</option>
              <option value="payment">UPI Payment / Package Activation</option>
              <option value="technical">Technical Support</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Subject</label>
            <input class="form-input" id="stuQuerySubject" placeholder="Brief subject..." />
          </div>
          <div class="form-group">
            <label class="form-label">Message Details</label>
            <textarea class="form-textarea" id="stuQueryMessage" rows="3" placeholder="Write your question or payment reference..."></textarea>
          </div>
          <button class="btn btn-primary" id="stuSubmitQueryBtn">📨 Send Private Query to Admin</button>

          ${myQueries.length > 0 ? `
            <div style="margin-top:16px;">
              <h3 style="font-size:0.88rem;font-weight:800;margin-bottom:8px;">Your Previous Queries:</h3>
              <div style="display:grid;gap:8px;">
                ${myQueries.map((q) => `
                  <div style="padding:10px;border-radius:8px;background:var(--surface-alt);font-size:0.82rem;">
                    <div><strong>${esc(q.subject)}</strong> — <span class="badge ${q.status === 'resolved' ? 'badge-free' : 'badge-paid'}">${esc(q.status)}</span></div>
                    <div style="margin-top:3px;">${esc(q.message)}</div>
                    ${q.adminReply ? `<div style="margin-top:6px;padding:6px 8px;border-radius:6px;background:var(--secondary-soft);"><strong>🛡️ Admin Reply:</strong> ${esc(q.adminReply)}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    document.getElementById('stuSubmitQueryBtn').onclick = () => {
      const subj = document.getElementById('stuQuerySubject').value.trim();
      const msg = document.getElementById('stuQueryMessage').value.trim();
      if (!subj || !msg) {
        toast('कृपया विषय और संदेश दर्ज करें।');
        return;
      }
      const qObj = {
        id: 'qry_' + Date.now(),
        userId: state.student.uid,
        studentName: state.student.name,
        studentEmail: state.student.email || 'student@cgpedia.in',
        category: document.getElementById('stuQueryCategory').value,
        subject: subj,
        message: msg,
        adminReply: '',
        status: 'open',
        createdAtIso: new Date().toISOString()
      };
      state.queries.unshift(qObj);
      saveState();
      if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('student_queries', qObj.id, qObj);
      toast('✅ Your query has been submitted to the Admin Desk!');
      renderNotificationsAndSupport(root);
    };
  }

  // =========================================================================
  // 8. Student Authentication, Multi-Account Switcher, Logout & Profile
  // =========================================================================
  async function activateStudentAccountSession(accountInput, extraMeta) {
    const incomingEmail = String(accountInput.email || '').trim().toLowerCase();
    const list = loadAccountRegistry();
    const matchedReg = list.find((a) =>
      (accountInput.uid && a.uid === accountInput.uid) ||
      (incomingEmail && String(a.email || '').toLowerCase() === incomingEmail)
    );

    const targetUid = String(
      accountInput.uid ||
      (matchedReg && matchedReg.uid) ||
      ('STU-' + Math.floor(100000 + Math.random() * 900000))
    ).trim();

    // Snapshot previous active student's workspace before switching accounts
    if (!isLoggedOut() && state.student && state.student.uid && state.student.uid !== targetUid) {
      saveStudentWorkspaceSnapshot(state.student.uid);
    }

    const savedWorkspace = loadStudentWorkspaceSnapshot(targetUid);
    const isBrandNewAccount = Boolean(extraMeta && extraMeta.isNewRegistration);

    const nextStudent = {
      uid: targetUid,
      name: String(
        accountInput.name ||
        (savedWorkspace && savedWorkspace.student && savedWorkspace.student.name) ||
        (matchedReg && matchedReg.name) ||
        'Aspirant'
      ).trim(),
      email: incomingEmail || (savedWorkspace && savedWorkspace.student && savedWorkspace.student.email) || (matchedReg && matchedReg.email) || '',
      phone: String(
        accountInput.phone !== undefined && accountInput.phone !== ''
          ? accountInput.phone
          : ((savedWorkspace && savedWorkspace.student && savedWorkspace.student.phone) || (matchedReg && matchedReg.phone) || '')
      ).trim(),
      targetExams: Array.isArray(accountInput.targetExams) && accountInput.targetExams.length > 0
        ? accountInput.targetExams
        : ((savedWorkspace && savedWorkspace.student && savedWorkspace.student.targetExams) || (matchedReg && matchedReg.targetExams) || ['CGPSC', 'UPSC', 'SSC']),
      preferredLang: accountInput.preferredLang || (savedWorkspace && savedWorkspace.student && savedWorkspace.student.preferredLang) || 'bilingual',
      leaderboardPublic: accountInput.leaderboardPublic !== undefined
        ? accountInput.leaderboardPublic
        : ((savedWorkspace && savedWorkspace.student && savedWorkspace.student.leaderboardPublic !== undefined) ? savedWorkspace.student.leaderboardPublic : true)
    };

    state.authSession = {
      isAuthenticated: true,
      intentionalLogout: false,
      authMode: 'login',
      prefillEmail: ''
    };
    authStateCheckComplete = true;
    state.student = nextStudent;
    state.onboarded = true;
    // Redirect to the CGpedia Home Page upon successful Login or Registration
    state.activeTab = 'dashboard';

    if (isBrandNewAccount || !savedWorkspace) {
      state.attempts = [];
      state.bookmarks = [];
      state.mistakes = [];
      state.activeResultId = null;
    } else {
      state.attempts = Array.isArray(savedWorkspace.attempts)
        ? savedWorkspace.attempts.filter((a) => !a.userId || a.userId === targetUid)
        : [];
      state.bookmarks = Array.isArray(savedWorkspace.bookmarks)
        ? savedWorkspace.bookmarks.filter((b) => !b.userId || b.userId === targetUid)
        : [];
      state.mistakes = Array.isArray(savedWorkspace.mistakes)
        ? savedWorkspace.mistakes.filter((m) => !m.userId || m.mUserId === targetUid || m.userId === targetUid)
        : [];
      state.activeResultId = state.attempts[0] ? state.attempts[0].id : null;
    }

    upsertAccountInRegistry(nextStudent, extraMeta || {});
    saveState();

    // Fetch and merge cloud data specific to this student's UID
    if (window.CGpediaCloud) {
      try {
        const cloudData = await window.CGpediaCloud.fetchStudentCloudData(targetUid);
        if (cloudData) {
          if (cloudData.profile) {
            if (cloudData.profile.displayName && (!accountInput.name || accountInput.name === 'Aspirant')) {
              state.student.name = cloudData.profile.displayName;
            }
            if (cloudData.profile.phoneNumber && !state.student.phone) {
              state.student.phone = cloudData.profile.phoneNumber;
            }
            if (Array.isArray(cloudData.profile.targetExams) && cloudData.profile.targetExams.length > 0) {
              state.student.targetExams = cloudData.profile.targetExams;
            }
            if (Array.isArray(cloudData.profile.bookmarks) && state.bookmarks.length === 0) {
              state.bookmarks = cloudData.profile.bookmarks;
            }
            if (Array.isArray(cloudData.profile.mistakes) && state.mistakes.length === 0) {
              state.mistakes = cloudData.profile.mistakes;
            }
            if (Array.isArray(cloudData.profile.seenStoryIds)) {
              const mergedSeen = new Set([
                ...(Array.isArray(state.student.seenStoryIds) ? state.student.seenStoryIds : []),
                ...cloudData.profile.seenStoryIds.map((id) => String(id))
              ]);
              state.student.seenStoryIds = Array.from(mergedSeen);
              saveSeenStoriesToLocal(targetUid, state.student.seenStoryIds);
            }
            if (cloudData.profile.caLangMode === 'hi' || cloudData.profile.caLangMode === 'en') {
              state.student.caLangMode = cloudData.profile.caLangMode;
              state.caLangMode = cloudData.profile.caLangMode;
            }
          }
          if (Array.isArray(cloudData.attempts) && cloudData.attempts.length > 0) {
            const existingIds = new Set((state.attempts || []).map((a) => a.id));
            cloudData.attempts.forEach((ca) => {
              if (ca.userId === targetUid && !existingIds.has(ca.id)) {
                state.attempts.push(ca);
              }
            });
            state.attempts.sort((a, b) => String(b.submittedAtIso || '').localeCompare(String(a.submittedAtIso || '')));
            if (!state.activeResultId && state.attempts[0]) {
              state.activeResultId = state.attempts[0].id;
            }
          }
        }
        await window.CGpediaCloud.saveCloudDoc('users', targetUid, {
          userId: targetUid,
          displayName: state.student.name,
          email: state.student.email,
          phoneNumber: state.student.phone,
          targetExams: state.student.targetExams,
          leaderboardPublic: state.student.leaderboardPublic,
          bookmarks: state.bookmarks,
          mistakes: state.mistakes,
          seenStoryIds: Array.isArray(state.student.seenStoryIds) ? state.student.seenStoryIds : [],
          caLangMode: getCaLangMode(),
          role: isCurrentUserAdmin() ? 'admin' : 'student'
        });
      } catch (_) {}
    }

    saveState();
    try {
      window.history.replaceState({ tab: 'dashboard', authenticated: true }, '', '#dashboard');
    } catch (_) {}
    const modalRoot = document.getElementById('genericModalContainer');
    if (modalRoot) modalRoot.innerHTML = '';
    renderApp();
    // Immediately request notification permission upon login so alerts are active
    setTimeout(() => {
      requestStudentNotificationPermissionImmediate();
    }, 350);
  }

  function openLogoutConfirmationDialog() {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="logoutConfirmModalBackdrop" role="dialog" aria-modal="true" aria-labelledby="logoutConfirmModalTitle" aria-describedby="logoutConfirmModalDesc">
        <div class="modal-card" style="max-width:420px;width:100%;text-align:center;padding:24px 22px;margin:auto;">
          <div style="width:52px;height:52px;border-radius:50%;background:var(--danger-soft);color:var(--danger);display:flex;align-items:center;justify-content:center;font-size:1.45rem;margin:0 auto 12px;">
            🚪
          </div>
          <h2 id="logoutConfirmModalTitle" style="font-size:1.15rem;font-weight:800;color:var(--text);margin-bottom:8px;">
            Confirm Logout
          </h2>
          <p id="logoutConfirmModalDesc" style="font-size:0.9rem;color:var(--text-secondary);line-height:1.5;margin-bottom:20px;">
            Are you sure you want to log out of your account?
          </p>
          <div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;">
            <button type="button" class="btn btn-outline" id="cancelLogoutConfirmBtn" style="flex:1;min-width:120px;">
              Cancel
            </button>
            <button type="button" class="btn btn-danger" id="confirmYesLogoutBtn" style="flex:1;min-width:130px;">
              Yes, Logout
            </button>
          </div>
        </div>
      </div>
    `;

    const cancelBtn = document.getElementById('cancelLogoutConfirmBtn');
    const confirmBtn = document.getElementById('confirmYesLogoutBtn');
    const backdrop = document.getElementById('logoutConfirmModalBackdrop');

    if (cancelBtn) {
      cancelBtn.focus();
      cancelBtn.onclick = () => {
        // Close confirmation dialog, keep student logged in, and preserve current page & session
        modalRoot.innerHTML = '';
      };
    }

    if (confirmBtn) {
      confirmBtn.onclick = async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Logging out...';
        if (cancelBtn) cancelBtn.disabled = true;
        await executeStudentLogout();
      };
    }

    if (backdrop) {
      // Prevent accidental logout or accidental dismissal when clicking outside the dialog card
      backdrop.onclick = (e) => {
        if (e.target === backdrop) {
          e.stopPropagation();
        }
      };
    }
  }

  async function executeStudentLogout() {
    if (isStudentAuthenticated() && state.student && state.student.uid) {
      saveStudentWorkspaceSnapshot(state.student.uid);
      if (window.CGpediaCloud && state.student.email) {
        try {
          await window.CGpediaCloud.saveCloudDoc('users', state.student.uid, {
            userId: state.student.uid,
            displayName: state.student.name,
            email: state.student.email,
            phoneNumber: state.student.phone,
            targetExams: state.student.targetExams,
            bookmarks: state.bookmarks || [],
            mistakes: state.mistakes || [],
            role: isCurrentUserAdmin() ? 'admin' : 'student'
          });
        } catch (_) {}
      }
    }

    // Set intentionalLogout BEFORE calling signOutFirebase so auth listeners never auto-login
    state.authSession = {
      isAuthenticated: false,
      intentionalLogout: true,
      authMode: 'login',
      prefillEmail: ''
    };
    authStateCheckComplete = true;

    if (window.CGpediaCloud && typeof window.CGpediaCloud.signOutFirebase === 'function') {
      try {
        await window.CGpediaCloud.signOutFirebase();
      } catch (_) {}
    }

    // Clear active in-memory student data so no next user can see previous student's private info
    state.student = {
      uid: '',
      name: '',
      email: '',
      phone: '',
      targetExams: ['CGPSC', 'UPSC', 'SSC'],
      preferredLang: 'bilingual',
      leaderboardPublic: true
    };
    state.attempts = [];
    state.bookmarks = [];
    state.mistakes = [];
    state.activeResultId = null;
    state.adminUnlocked = false;
    state.activeTab = 'dashboard';

    closeSettingsDrawer();
    closeAndStopStudentAnthemPlayer();
    const cbtRoot = document.getElementById('cbtExamContainer');
    if (cbtRoot) cbtRoot.innerHTML = '';

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}

    // Replace and push #login history barrier so browser Back button cannot return to protected Home Page
    try {
      window.history.replaceState({ authGate: 'login' }, '', '#login');
      window.history.pushState({ authGate: 'login' }, '', '#login');
    } catch (_) {}

    const modalRoot = document.getElementById('genericModalContainer');
    if (modalRoot) modalRoot.innerHTML = '';

    renderApp();
    toast('👋 You have been logged out securely. Please sign in to continue.');
  }

  function performStudentLogout(forceImmediate) {
    if (forceImmediate === true) {
      return executeStudentLogout();
    }
    openLogoutConfirmationDialog();
  }

  function openStudentAuthModal(initialMode, prefillEmail) {
    state.authSession = Object.assign({}, state.authSession || {}, {
      authMode: initialMode || 'login',
      prefillEmail: prefillEmail !== undefined ? prefillEmail : ((state.authSession && state.authSession.prefillEmail) || '')
    });
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;
    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="studentAuthModalBackdrop">
        <div class="modal-card" style="max-width:680px;padding:18px;" id="studentAuthModalInner"></div>
      </div>
    `;
    const inner = document.getElementById('studentAuthModalInner');
    if (inner) {
      renderStudentAuthPortal(inner, true);
    }
  }

  function renderStudentAuthPortal(containerEl, isModalOverlay) {
    const mode = (state.authSession && state.authSession.authMode) || 'login';
    const prefillEmail = (state.authSession && state.authSession.prefillEmail) || '';
    const savedAccounts = loadAccountRegistry().filter((a) => a.email);
    const exams = window.CGpediaCloud ? window.CGpediaCloud.EXAM_CATEGORIES : [];

    containerEl.innerHTML = `
      <div class="${isModalOverlay ? '' : 'card'}" style="${isModalOverlay ? '' : 'max-width:720px;margin:8px auto;'}">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="assets/cgpedia-logo-clean.png" alt="CGpedia" style="width:54px;height:54px;border-radius:50%;object-fit:cover;border:2px solid var(--secondary);" />
            <div>
              <span class="badge badge-exam">🔐 STUDENT ACCOUNT PORTAL</span>
              <h2 style="font-size:1.18rem;font-weight:800;margin-top:2px;">
                ${mode === 'register'
                  ? 'Create New Student Account / नया छात्र खाता बनाएं'
                  : mode === 'reset'
                    ? 'Forgot & Reset Password / पासवर्ड रीसेट करें'
                    : 'Student Login & Account Switcher / छात्र लॉगिन'}
              </h2>
              <p style="font-size:0.8rem;color:var(--text-secondary);">
                Every student account keeps its own separate Test Attempts, Results, Bookmarks, Mistakes &amp; Purchased Test Series.
              </p>
            </div>
          </div>
          ${isModalOverlay ? `<button class="btn btn-outline btn-sm" id="closeStudentAuthModalBtn">✕ Close</button>` : ''}
        </div>

        <!-- Mode Switcher Tabs -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--border);">
          <button class="btn ${mode === 'login' ? 'btn-primary' : 'btn-outline'} btn-sm" data-auth-tab="login">
            🔐 Login to Account
          </button>
          <button class="btn ${mode === 'register' ? 'btn-primary' : 'btn-outline'} btn-sm" data-auth-tab="register">
            ✨ Create Account (Register)
          </button>
          <button class="btn ${mode === 'reset' ? 'btn-primary' : 'btn-outline'} btn-sm" data-auth-tab="reset">
            🔑 Forgot / Reset Password
          </button>
        </div>

        ${mode === 'login' ? `
          <div class="grid-2" style="align-items:start;">
            <div>
              <h3 style="font-size:0.96rem;font-weight:800;margin-bottom:10px;">📧 Sign In with Email &amp; Password</h3>
              <div class="form-group">
                <label class="form-label">Registered Email ID / ईमेल आईडी</label>
                <input type="email" class="form-input" id="authLoginEmailInput" value="${esc(prefillEmail)}" placeholder="student@gmail.com" autocomplete="username" />
              </div>
              <div class="form-group">
                <label class="form-label">Password / पासवर्ड</label>
                <div style="display:flex;gap:6px;">
                  <input type="password" class="form-input" id="authLoginPasswordInput" placeholder="Enter your password" autocomplete="current-password" />
                  <button type="button" class="btn btn-outline btn-sm" id="authToggleLoginPassBtn" title="Show/Hide Password">👁️</button>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <button type="button" class="btn btn-outline btn-sm" data-auth-tab="reset" style="font-size:0.75rem;padding:4px 9px;">
                  Forgot Password?
                </button>
                <button type="button" class="btn btn-outline btn-sm" data-auth-tab="register" style="font-size:0.75rem;padding:4px 9px;">
                  ➕ New Student? Register
                </button>
              </div>
              <button class="btn btn-primary" style="width:100%;margin-bottom:10px;" id="authLoginSubmitBtn">
                🔓 Sign In to Student Account
              </button>
              <button class="btn btn-navy" style="width:100%;" id="authGoogleLoginBtn">
                🌐 Continue with Google (Firebase Auth)
              </button>
            </div>

            <!-- Saved Accounts on This Device (Multi-Account Switcher) -->
            <div style="padding:14px;border-radius:12px;border:1px solid var(--border);background:var(--surface-alt);">
              <h3 style="font-size:0.92rem;font-weight:800;margin-bottom:6px;">👥 Switch Student Account on This Device (${savedAccounts.length})</h3>
              <p style="font-size:0.76rem;color:var(--text-secondary);margin-bottom:10px;">
                Multiple students can use separate accounts on this device. Select an account below to sign in with its isolated test history and packages:
              </p>
              ${savedAccounts.length === 0 ? `
                <div style="padding:14px;border-radius:8px;border:1px dashed var(--border-strong);font-size:0.8rem;color:var(--text-muted);text-align:center;">
                  No saved student accounts on this device yet. Click <strong>Create Account (Register)</strong> to create your first student profile.
                </div>
              ` : `
                <div style="display:grid;gap:8px;max-height:260px;overflow-y:auto;">
                  ${savedAccounts.map((acc) => {
                    const isCurrent = !isLoggedOut() && state.student.uid === acc.uid;
                    return `
                      <div style="padding:10px;border-radius:10px;border:1px solid ${isCurrent ? 'var(--secondary)' : 'var(--border)'};background:var(--surface);display:flex;align-items:center;justify-content:space-between;gap:8px;">
                        <div style="min-width:0;">
                          <div style="font-weight:800;font-size:0.86rem;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                            <span>${esc(acc.name || 'Student')}</span>
                            ${isCurrent ? `<span class="badge badge-free" style="font-size:0.65rem;">ACTIVE</span>` : ''}
                          </div>
                          <div style="font-size:0.75rem;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;">${esc(acc.email)}</div>
                          <div style="font-size:0.68rem;color:var(--text-muted);">UID: ${esc(acc.uid)}</div>
                        </div>
                        <div style="display:flex;gap:5px;flex-shrink:0;">
                          <button class="btn btn-primary btn-sm" data-select-saved-acc="${esc(acc.email)}" style="padding:5px 9px;font-size:0.74rem;">
                            ${isCurrent ? 'Active' : '🔄 Use'}
                          </button>
                          <button class="btn btn-outline btn-sm" data-remove-saved-acc="${esc(acc.uid)}" title="Remove from device list" style="padding:5px 7px;font-size:0.72rem;">✕</button>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
          </div>
        ` : ''}

        ${mode === 'register' ? `
          <div>
            <h3 style="font-size:0.98rem;font-weight:800;margin-bottom:10px;">✨ Register a New Individual Student Account</h3>
            <div class="grid-2" style="gap:10px;">
              <div class="form-group" style="margin-bottom:6px;">
                <label class="form-label">Full Name / पूरा नाम *</label>
                <input class="form-input" id="authRegNameInput" placeholder="e.g. Rahul Verma" autocomplete="name" />
              </div>
              <div class="form-group" style="margin-bottom:6px;">
                <label class="form-label">Email Address / ईमेल आईडी *</label>
                <input type="email" class="form-input" id="authRegEmailInput" value="${esc(prefillEmail)}" placeholder="student@gmail.com" autocomplete="email" />
              </div>
              <div class="form-group" style="margin-bottom:6px;">
                <label class="form-label">Mobile / WhatsApp Number (Used for Password Recovery &amp; Unlocks) *</label>
                <input type="tel" class="form-input" id="authRegPhoneInput" placeholder="98XXXXXXXX" autocomplete="tel" />
              </div>
              <div class="form-group" style="margin-bottom:6px;">
                <label class="form-label">Create Password (Min 6 characters) *</label>
                <input type="password" class="form-input" id="authRegPasswordInput" placeholder="Min 6 characters" autocomplete="new-password" />
              </div>
              <div class="form-group" style="margin-bottom:6px;">
                <label class="form-label">Confirm Password / पासवर्ड की पुष्टि करें *</label>
                <input type="password" class="form-input" id="authRegConfirmInput" placeholder="Re-enter password" autocomplete="new-password" />
              </div>
            </div>

            <div class="form-group" style="margin-top:8px;">
              <label class="form-label">Select Target Competitive Exams:</label>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:6px;margin-top:4px;">
                ${exams.map((ex, i) => `
                  <label style="display:flex;align-items:center;gap:6px;padding:6px 8px;border:1px solid var(--border-strong);border-radius:8px;cursor:pointer;font-size:0.76rem;font-weight:700;">
                    <input type="checkbox" class="auth-reg-exam-chk" value="${esc(ex.code)}" ${i < 3 ? 'checked' : ''} />
                    <span>${esc(ex.icon)} ${esc(ex.nameEn)}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px;">
              <button class="btn btn-outline btn-sm" data-auth-tab="login">⬅️ Already have an account? Login</button>
              <button class="btn btn-success" id="authRegisterSubmitBtn">✅ Create Student Account &amp; Sign In</button>
            </div>
          </div>
        ` : ''}

        ${mode === 'reset' ? `
          <div class="grid-2" style="align-items:start;">
            <div style="padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--surface-alt);">
              <h3 style="font-size:0.94rem;font-weight:800;margin-bottom:6px;">📨 Option 1: Send Password Reset Email (Firebase)</h3>
              <p style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:10px;">
                Enter your registered Email ID to receive an official password reset link via Firebase Authentication.
              </p>
              <div class="form-group">
                <label class="form-label">Registered Email ID</label>
                <input type="email" class="form-input" id="authResetEmailLinkInput" value="${esc(prefillEmail || state.student.email || '')}" placeholder="student@gmail.com" />
              </div>
              <button class="btn btn-primary" style="width:100%;" id="authSendResetLinkBtn">📧 Send Password Reset Email</button>
            </div>

            <div style="padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--surface-alt);">
              <h3 style="font-size:0.94rem;font-weight:800;margin-bottom:6px;">🔑 Option 2: Instant In-App Password Reset</h3>
              <p style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:10px;">
                Verify your registered Email ID and registered Mobile Number to set a new password immediately.
              </p>
              <div class="form-group">
                <label class="form-label">Registered Email ID</label>
                <input type="email" class="form-input" id="authDirectResetEmail" value="${esc(prefillEmail || state.student.email || '')}" placeholder="student@gmail.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Registered Mobile / WhatsApp Number</label>
                <input type="tel" class="form-input" id="authDirectResetPhone" placeholder="Enter registered mobile number" />
              </div>
              <div class="form-group">
                <label class="form-label">New Password (Min 6 characters)</label>
                <input type="password" class="form-input" id="authDirectResetNewPass" placeholder="New password" />
              </div>
              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" class="form-input" id="authDirectResetConfirmPass" placeholder="Confirm new password" />
              </div>
              <button class="btn btn-success" style="width:100%;" id="authDirectResetSubmitBtn">🔄 Reset Password Now</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Close Modal Button
    const closeBtn = containerEl.querySelector('#closeStudentAuthModalBtn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        const modalRoot = document.getElementById('genericModalContainer');
        if (modalRoot) modalRoot.innerHTML = '';
      };
    }

    // Tab switching inside Auth Portal
    containerEl.querySelectorAll('[data-auth-tab]').forEach((btn) => {
      btn.onclick = () => {
        state.authSession = Object.assign({}, state.authSession || {}, {
          authMode: btn.getAttribute('data-auth-tab')
        });
        renderStudentAuthPortal(containerEl, isModalOverlay);
      };
    });

    // Show/Hide Password Toggle
    const togglePassBtn = containerEl.querySelector('#authToggleLoginPassBtn');
    const loginPassInput = containerEl.querySelector('#authLoginPasswordInput');
    if (togglePassBtn && loginPassInput) {
      togglePassBtn.onclick = () => {
        loginPassInput.type = loginPassInput.type === 'password' ? 'text' : 'password';
      };
    }

    // Saved Account Quick Switcher
    containerEl.querySelectorAll('[data-select-saved-acc]').forEach((btn) => {
      btn.onclick = () => {
        const targetEmail = btn.getAttribute('data-select-saved-acc');
        state.authSession = Object.assign({}, state.authSession || {}, {
          authMode: 'login',
          prefillEmail: targetEmail
        });
        renderStudentAuthPortal(containerEl, isModalOverlay);
        const passEl = containerEl.querySelector('#authLoginPasswordInput');
        if (passEl) passEl.focus();
        toast(`ℹ️ Enter password for ${targetEmail} (or click Continue with Google) to sign in.`);
      };
    });

    containerEl.querySelectorAll('[data-remove-saved-acc]').forEach((btn) => {
      btn.onclick = () => {
        const rmUid = btn.getAttribute('data-remove-saved-acc');
        const targetAcc = loadAccountRegistry().find((a) => a.uid === rmUid);
        confirmUserAction({
          title: 'Remove Saved Account Shortcut?',
          message: `क्या आप इस डिवाइस की त्वरित लॉगिन सूची से "${(targetAcc && (targetAcc.email || targetAcc.name)) || 'this account'}" को हटाना चाहते हैं?`,
          confirmText: '🗑️ Yes, Remove',
          cancelText: 'Cancel'
        }, () => {
          const nextList = loadAccountRegistry().filter((a) => a.uid !== rmUid);
          saveAccountRegistry(nextList);
          renderStudentAuthPortal(containerEl, isModalOverlay);
          toast('🗑️ Removed account shortcut from device list.');
        });
      };
    });

    // 1. Handle Student Login (Strict Online Real Account Verification)
    const loginSubmitBtn = containerEl.querySelector('#authLoginSubmitBtn');
    if (loginSubmitBtn) {
      loginSubmitBtn.onclick = async () => {
        const email = String(containerEl.querySelector('#authLoginEmailInput').value || '').trim().toLowerCase();
        const password = String(containerEl.querySelector('#authLoginPasswordInput').value || '');
        if (!isValidRealEmailAddress(email)) {
          toast('⚠️ कृपया मान्य एवं वास्तविक ईमेल आईडी दर्ज करें (Please enter a valid real Email ID).');
          return;
        }
        if (!password || password.length < 6) {
          toast('⚠️ कृपया अपना सही पासवर्ड दर्ज करें (Minimum 6 characters).');
          return;
        }
        if (navigator.onLine === false) {
          toast('🚫 ऑफ़लाइन लॉगिन बंद है। कृपया इंटरनेट चालू करें और अपने वास्तविक अकाउंट से लॉगिन करें।');
          return;
        }
        if (!window.CGpediaCloud || typeof window.CGpediaCloud.signInWithEmailPassword !== 'function') {
          toast('🚫 सर्वर से कनेक्शन उपलब्ध नहीं है। कृपया इंटरनेट कनेक्शन जांचें।');
          return;
        }

        loginSubmitBtn.disabled = true;
        loginSubmitBtn.textContent = '⏳ Verifying Online Account...';

        const digest = computeCredentialDigest(email, password);
        const regList = loadAccountRegistry();
        const localAcc = regList.find((a) => String(a.email || '').toLowerCase() === email);

        try {
          const fbUser = await window.CGpediaCloud.signInWithEmailPassword(email, password);
          if (fbUser && fbUser.uid) {
            await activateStudentAccountSession({
              uid: fbUser.uid,
              name: fbUser.displayName || (localAcc && localAcc.name) || email.split('@')[0],
              email: String(fbUser.email || email).toLowerCase(),
              phone: (localAcc && localAcc.phone) || ''
            }, { credDigest: digest, authProvider: 'password' });
            toast(`✅ Welcome back, ${state.student.name}!`);
            return;
          }
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.textContent = '🔓 Sign In to Student Account';
          toast('❌ ऑनलाइन सत्यापन विफल रहा। कृपया सही ईमेल एवं पासवर्ड दर्ज करें।');
        } catch (fbErr) {
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.textContent = '🔓 Sign In to Student Account';
          const errCode = String((fbErr && fbErr.code) || '');
          if (errCode.includes('network-request-failed')) {
            toast('🚫 इंटरनेट कनेक्शन आवश्यक है। ऑफ़लाइन लॉगिन की अनुमति नहीं है।');
          } else if (errCode.includes('wrong-password') || errCode.includes('invalid-credential')) {
            toast('❌ गलत पासवर्ड या ईमेल। कृपया सही पासवर्ड दर्ज करें या Forgot Password चुनें।');
          } else if (errCode.includes('user-not-found')) {
            toast('ℹ️ इस ईमेल से कोई पंजीकृत खाता नहीं मिला। पहले "Create Account (Register)" करें।');
          } else {
            toast('⚠️ Sign-in failed: ' + (fbErr.message || 'Check your email and password.'));
          }
        }
      };
    }

    // 2. Handle Google Sign-In
    const googleBtn = containerEl.querySelector('#authGoogleLoginBtn');
    if (googleBtn) {
      googleBtn.onclick = async () => {
        if (navigator.onLine === false) {
          toast('🚫 ऑफ़लाइन लॉगिन बंद है। कृपया इंटरनेट चालू करें।');
          return;
        }
        try {
          if (window.CGpediaCloud && typeof window.CGpediaCloud.signInWithGooglePopup === 'function') {
            state.authSession.intentionalLogout = false;
            const fbUser = await window.CGpediaCloud.signInWithGooglePopup();
            if (fbUser && fbUser.uid && isValidRealEmailAddress(fbUser.email)) {
              await activateStudentAccountSession({
                uid: fbUser.uid,
                name: fbUser.displayName || 'Aspirant',
                email: String(fbUser.email || '').toLowerCase(),
                phone: fbUser.phoneNumber || ''
              }, { authProvider: 'google' });
              toast(`✅ Signed in with Google as ${state.student.name}!`);
            }
          }
        } catch (err) {
          toast('ℹ️ Google Sign-In popup closed or unavailable. You can sign in or register with Email & Password.');
        }
      };
    }

    // 3. Handle Student Registration (Strict Online Real Account Creation)
    const regSubmitBtn = containerEl.querySelector('#authRegisterSubmitBtn');
    if (regSubmitBtn) {
      regSubmitBtn.onclick = async () => {
        const name = String(containerEl.querySelector('#authRegNameInput').value || '').trim();
        const email = String(containerEl.querySelector('#authRegEmailInput').value || '').trim().toLowerCase();
        const phone = String(containerEl.querySelector('#authRegPhoneInput').value || '').trim();
        const pass = String(containerEl.querySelector('#authRegPasswordInput').value || '');
        const confirmPass = String(containerEl.querySelector('#authRegConfirmInput').value || '');

        if (!name || name.length < 2) {
          toast('⚠️ कृपया अपना पूरा वास्तविक नाम दर्ज करें (Please enter your Full Name).');
          return;
        }
        if (!isValidRealEmailAddress(email)) {
          toast('⚠️ कृपया वास्तविक एवं मान्य ईमेल आईडी दर्ज करें (Fake/Temporary emails are not allowed).');
          return;
        }
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          toast('⚠️ कृपया अपना 10 अंकों का वैध मोबाइल नंबर दर्ज करें।');
          return;
        }
        if (pass.length < 6) {
          toast('⚠️ Password must be at least 6 characters long.');
          return;
        }
        if (pass !== confirmPass) {
          toast('⚠️ Password and Confirm Password do not match.');
          return;
        }
        if (navigator.onLine === false) {
          toast('🚫 ऑफ़लाइन अकाउंट बनाना बंद है। कृपया इंटरनेट चालू करें और वास्तविक ईमेल से रजिस्टर करें।');
          return;
        }
        if (!window.CGpediaCloud || typeof window.CGpediaCloud.registerWithEmailPassword !== 'function') {
          toast('🚫 सर्वर से कनेक्शन उपलब्ध नहीं है। कृपया इंटरनेट कनेक्शन जांचें।');
          return;
        }

        const pickedExams = [];
        containerEl.querySelectorAll('.auth-reg-exam-chk:checked').forEach((chk) => pickedExams.push(chk.value));
        const targetExams = pickedExams.length > 0 ? pickedExams : ['CGPSC'];

        regSubmitBtn.disabled = true;
        regSubmitBtn.textContent = '⏳ Creating Verified Online Account...';
        const digest = computeCredentialDigest(email, pass);

        try {
          const fbUser = await window.CGpediaCloud.registerWithEmailPassword(name, email, pass, phone, targetExams);
          if (!fbUser || !fbUser.uid) {
            regSubmitBtn.disabled = false;
            regSubmitBtn.textContent = '✅ Create Student Account & Sign In';
            toast('❌ ऑनलाइन खाता पंजीकरण पूरा नहीं हो सका। कृपया पुनः प्रयास करें।');
            return;
          }

          await activateStudentAccountSession({
            uid: fbUser.uid,
            name,
            email,
            phone,
            targetExams,
            preferredLang: state.lang || 'bilingual',
            leaderboardPublic: true
          }, {
            credDigest: digest,
            authProvider: 'password',
            createdAtIso: new Date().toISOString(),
            isNewRegistration: true
          });

          state.activeTab = 'dashboard';
          saveState();
          renderApp();
          toast(`🎉 Account created for ${name}! Welcome to CGpedia.`);
        } catch (fbErr) {
          regSubmitBtn.disabled = false;
          regSubmitBtn.textContent = '✅ Create Student Account & Sign In';
          const code = String((fbErr && fbErr.code) || '');
          if (code.includes('email-already-in-use')) {
            toast('⚠️ यह ईमेल पहले से पंजीकृत है। कृपया Login टैब पर जाएं या पासवर्ड रीसेट करें।');
          } else if (code.includes('invalid-email')) {
            toast('⚠️ यह ईमेल आईडी अमान्य है। कृपया अपनी वास्तविक ईमेल आईडी दर्ज करें।');
          } else if (code.includes('network-request-failed')) {
            toast('🚫 ऑफ़लाइन रजिस्ट्रेशन की अनुमति नहीं है। कृपया इंटरनेट कनेक्शन चालू करें।');
          } else {
            toast('⚠️ Account creation failed: ' + (fbErr.message || 'Please check your internet and email.'));
          }
        }
      };
    }

    // 4. Handle Forgot Password (Firebase Email Link)
    const sendResetLinkBtn = containerEl.querySelector('#authSendResetLinkBtn');
    if (sendResetLinkBtn) {
      sendResetLinkBtn.onclick = async () => {
        const email = String(containerEl.querySelector('#authResetEmailLinkInput').value || '').trim().toLowerCase();
        if (!email || !email.includes('@')) {
          toast('⚠️ Please enter your registered Email ID.');
          return;
        }
        try {
          if (window.CGpediaCloud && typeof window.CGpediaCloud.sendPasswordReset === 'function') {
            await window.CGpediaCloud.sendPasswordReset(email);
            toast(`📧 Password reset link sent to ${email}! Please check your inbox/spam folder.`);
            return;
          }
        } catch (err) {
          toast('ℹ️ Could not send reset email (' + (err.code || 'use Instant In-App Password Reset on the right') + ').');
          return;
        }
        toast('ℹ️ Use Instant In-App Password Reset on the right to set a new password.');
      };
    }

    // 5. Handle Direct In-App Password Reset
    const directResetBtn = containerEl.querySelector('#authDirectResetSubmitBtn');
    if (directResetBtn) {
      directResetBtn.onclick = async () => {
        const email = String(containerEl.querySelector('#authDirectResetEmail').value || '').trim().toLowerCase();
        const phone = String(containerEl.querySelector('#authDirectResetPhone').value || '').trim();
        const newPass = String(containerEl.querySelector('#authDirectResetNewPass').value || '');
        const confirmPass = String(containerEl.querySelector('#authDirectResetConfirmPass').value || '');

        if (!email || !email.includes('@')) {
          toast('⚠️ Please enter your registered Email ID.');
          return;
        }
        if (newPass.length < 6) {
          toast('⚠️ New password must be at least 6 characters.');
          return;
        }
        if (newPass !== confirmPass) {
          toast('⚠️ New password and confirmation do not match.');
          return;
        }

        const list = loadAccountRegistry();
        const idx = list.findIndex((a) => String(a.email || '').toLowerCase() === email);
        if (idx < 0) {
          toast('⚠️ No local account found with that email. You can also use Option 1 (Firebase Reset Email) or Create Account.');
          return;
        }

        const acc = list[idx];
        const cleanSavedPhone = String(acc.phone || '').replace(/\D/g, '');
        const cleanEnteredPhone = phone.replace(/\D/g, '');
        if (cleanSavedPhone && cleanSavedPhone !== cleanEnteredPhone) {
          toast('❌ Registered mobile number does not match this account.');
          return;
        }

        const newDigest = computeCredentialDigest(email, newPass);
        list[idx] = Object.assign({}, acc, { credDigest: newDigest, updatedAtIso: new Date().toISOString() });
        saveAccountRegistry(list);

        if (window.CGpediaCloud && typeof window.CGpediaCloud.updateCurrentFirebasePassword === 'function') {
          try {
            await window.CGpediaCloud.updateCurrentFirebasePassword(newPass);
          } catch (_) {}
        }

        state.authSession = Object.assign({}, state.authSession || {}, {
          authMode: 'login',
          prefillEmail: email
        });
        renderStudentAuthPortal(containerEl, isModalOverlay);
        toast('✅ Password reset successfully! You can now sign in with your new password.');
      };
    }
  }

  function renderProfileAndSettings(root) {
    if (isLoggedOut()) {
      renderStudentAuthPortal(root, false);
      return;
    }

    const email = String(state.student.email || '').trim().toLowerCase();
    const uid = String(state.student.uid || '').trim();
    const uidLower = uid.toLowerCase();
    const myActivations = (state.activations || []).filter((a) => {
      const idm = String(a.studentIdentifier || '').trim().toLowerCase();
      if (!idm) return false;
      return (email && idm === email) || (uidLower && idm === uidLower) || (uidLower && String(a.userId || '').toLowerCase() === uidLower);
    });
    const myOrders = (state.orders || []).filter((o) => {
      const oEmail = String(o.studentEmail || '').trim().toLowerCase();
      return (o.userId && o.userId === uid) || (email && oEmail === email);
    });
    const savedAccounts = loadAccountRegistry().filter((a) => a.email);

    root.innerHTML = `
      <!-- Top Account Session & Multi-Account Action Bar -->
      <div class="card" style="border-left:5px solid var(--secondary);">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:14px;">
            <img src="assets/cgpedia-logo-clean.png" alt="CGpedia" style="width:62px;height:62px;border-radius:50%;object-fit:cover;border:2.5px solid var(--secondary);" />
            <div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span class="badge badge-free">🟢 ACTIVE STUDENT ACCOUNT</span>
                ${isCurrentUserAdmin() ? `<span class="badge badge-paid">🛡️ OWNER ADMIN</span>` : ''}
              </div>
              <h2 style="font-size:1.18rem;font-weight:800;margin-top:3px;">${esc(state.student.name)}</h2>
              <div style="font-size:0.82rem;color:var(--text-secondary);">
                Email: <strong>${esc(state.student.email || 'Not linked yet — Sign in or Register')}</strong> • UID: <code>${esc(state.student.uid)}</code>
              </div>
            </div>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${isCurrentUserAdmin() ? `<button class="btn btn-warning btn-sm" id="profOpenAdminPanelBtn">🛡️ Open Admin Panel</button>` : ''}
            <button class="btn btn-primary btn-sm" id="profSwitchAccountBtn">🔄 Switch / Login Account</button>
            <button class="btn btn-navy btn-sm" id="profCreateNewAccBtn">➕ Create New Account</button>
            <button class="btn btn-outline btn-sm" id="profResetPasswordBtn">🔑 Reset Password</button>
            <button class="btn btn-danger btn-sm" id="profLogoutBtn">🚪 Logout</button>
          </div>
        </div>

        <!-- Account-Specific Isolated Data Summary -->
        <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-top:14px;margin-bottom:0;">
          <div class="kpi-card" style="padding:10px;">
            <div class="kpi-value">${(state.attempts || []).length}</div>
            <div class="kpi-label">My Test Attempts</div>
          </div>
          <div class="kpi-card" style="padding:10px;">
            <div class="kpi-value" style="color:var(--secondary);">${(state.bookmarks || []).length}</div>
            <div class="kpi-label">My Bookmarks</div>
          </div>
          <div class="kpi-card" style="padding:10px;">
            <div class="kpi-value" style="color:var(--danger);">${(state.mistakes || []).length}</div>
            <div class="kpi-label">My Mistake Notebook</div>
          </div>
          <div class="kpi-card" style="padding:10px;">
            <div class="kpi-value" style="color:var(--success);">${myActivations.length}</div>
            <div class="kpi-label">My Unlocked Packages</div>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 style="font-size:1rem;font-weight:800;margin-bottom:12px;">👤 Edit Student Profile Details</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
            <button class="btn btn-primary btn-sm" id="profGoogleSignInBtn">🌐 Connect / Switch with Google</button>
            <button class="btn btn-outline btn-sm" id="profTargetExamsBtn">🎯 Change Target Exams (${(state.student.targetExams || []).join(', ')})</button>
          </div>

          <div class="form-group">
            <label class="form-label">Full Name / पूरा नाम</label>
            <input class="form-input" id="profNameInput" value="${esc(state.student.name)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Registered Email ID (Used for Paid Package Activation &amp; Login)</label>
            <input class="form-input" id="profEmailInput" value="${esc(state.student.email)}" placeholder="yourname@gmail.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Mobile / WhatsApp Number</label>
            <input class="form-input" id="profPhoneInput" value="${esc(state.student.phone)}" placeholder="98XXXXXXXX" />
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-success" id="profSaveProfileBtn">💾 Save Profile</button>
            <button class="btn btn-danger" id="profSecondaryLogoutBtn">🚪 Logout from Account</button>
          </div>
        </div>

        <div style="display:grid;gap:16px;">
          <div class="card" style="margin-bottom:0;">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:12px;">🔓 My Activated Premium Packages &amp; Validity Countdown</h3>
            ${myActivations.length === 0 ? `
              <p style="font-size:0.84rem;color:var(--text-muted);margin-bottom:8px;">
                You have no active paid subscriptions on this account (${esc(state.student.email || state.student.uid)}) yet. When you unlock any Paid Test Series via UPI QR + WhatsApp Verification, your live validity countdown will appear here.
              </p>
            ` : `
              <div style="display:grid;gap:10px;">
                ${myActivations.map((act) => {
                  const remMs = Number(act.expiresAtMs || 0) - Date.now();
                  const remDays = Math.max(0, Math.ceil(remMs / 86400000));
                  const expired = remMs <= 0;
                  return `
                    <div style="padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--surface-alt);">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <strong>${esc(act.targetTitle)}</strong>
                        <span class="badge ${expired ? 'badge-live' : 'badge-free'}">${expired ? 'Expired' : remDays + ' Days Remaining'}</span>
                      </div>
                      <div style="font-size:0.76rem;color:var(--text-muted);margin-top:4px;">
                        Activated: ${new Date(act.activatedAtMs).toLocaleDateString()} • Valid Until: ${new Date(act.expiresAtMs).toLocaleDateString()}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}

            ${myOrders.length > 0 ? `
              <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);">
                <div style="font-size:0.82rem;font-weight:800;margin-bottom:6px;">🧾 My Payment &amp; Order History (${myOrders.length})</div>
                <div style="display:grid;gap:6px;">
                  ${myOrders.slice(0, 5).map((ord) => `
                    <div style="font-size:0.76rem;display:flex;justify-content:space-between;padding:6px 8px;border-radius:6px;background:var(--surface-alt);">
                      <span>${esc(ord.targetTitle || ord.packageTitle || 'Test Series')}</span>
                      <strong>₹${esc(ord.amountInr || ord.priceInr || 0)} • ${esc(ord.status || 'verified')}</strong>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Quick Account Switcher Card -->
          <div class="card" style="margin-bottom:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <h3 style="font-size:0.95rem;font-weight:800;">👥 Saved Accounts on This Device (${savedAccounts.length})</h3>
              <button class="btn btn-outline btn-sm" id="profOpenSwitcherModalBtn">🔄 Switch Account</button>
            </div>
            <p style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:10px;">
              Switch to another student account or log out so another student can sign in with their own isolated progress:
            </p>
            ${savedAccounts.length === 0 ? `
              <div style="font-size:0.8rem;color:var(--text-muted);">Save your profile with an email or register an account to enable quick account switching.</div>
            ` : `
              <div style="display:grid;gap:8px;">
                ${savedAccounts.slice(0, 5).map((acc) => {
                  const isMe = acc.uid === state.student.uid;
                  return `
                    <div style="padding:8px 10px;border-radius:8px;border:1px solid ${isMe ? 'var(--secondary)' : 'var(--border)'};background:var(--surface-alt);display:flex;align-items:center;justify-content:space-between;gap:8px;">
                      <div>
                        <strong style="font-size:0.84rem;">${esc(acc.name)}</strong>
                        ${isMe ? `<span class="badge badge-free" style="margin-left:6px;font-size:0.65rem;">CURRENT</span>` : ''}
                        <div style="font-size:0.74rem;color:var(--text-secondary);">${esc(acc.email)}</div>
                      </div>
                      ${isMe ? `
                        <button class="btn btn-danger btn-sm" data-quick-logout-acc="${esc(acc.uid)}" style="padding:4px 9px;font-size:0.74rem;">Logout</button>
                      ` : `
                        <button class="btn btn-primary btn-sm" data-quick-switch-acc="${esc(acc.email)}" style="padding:4px 9px;font-size:0.74rem;">Switch</button>
                      `}
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    document.getElementById('profSaveProfileBtn').onclick = () => {
      state.student.name = document.getElementById('profNameInput').value.trim() || 'Aspirant';
      state.student.email = document.getElementById('profEmailInput').value.trim().toLowerCase();
      state.student.phone = document.getElementById('profPhoneInput').value.trim();
      saveState();
      if (window.CGpediaCloud) {
        window.CGpediaCloud.saveCloudDoc('users', state.student.uid, {
          userId: state.student.uid,
          displayName: state.student.name,
          email: state.student.email,
          phoneNumber: state.student.phone,
          targetExams: state.student.targetExams,
          bookmarks: state.bookmarks || [],
          mistakes: state.mistakes || [],
          role: isCurrentUserAdmin() ? 'admin' : 'student'
        });
      }
      toast('✅ Profile updated & synced!');
      renderApp();
    };

    const gSignInBtn = document.getElementById('profGoogleSignInBtn');
    if (gSignInBtn) {
      gSignInBtn.onclick = async () => {
        try {
          if (window.CGpediaCloud) {
            state.authSession.intentionalLogout = false;
            const fbUser = await window.CGpediaCloud.signInWithGooglePopup();
            if (fbUser) {
              await activateStudentAccountSession({
                uid: fbUser.uid,
                name: fbUser.displayName || 'Aspirant',
                email: String(fbUser.email || '').toLowerCase(),
                phone: fbUser.phoneNumber || ''
              }, { authProvider: 'google' });
              toast(`✅ Signed in as ${state.student.name}!`);
            }
          }
        } catch (err) {
          openStudentAuthModal('login', '');
        }
      };
    }

    const targBtn = document.getElementById('profTargetExamsBtn');
    if (targBtn) targBtn.onclick = () => openOnboardingModal();

    const profAdminBtn = document.getElementById('profOpenAdminPanelBtn');
    if (profAdminBtn) {
      profAdminBtn.onclick = () => navigateToTab('admin');
    }

    const logoutBtn1 = document.getElementById('profLogoutBtn');
    if (logoutBtn1) logoutBtn1.onclick = () => performStudentLogout();

    const logoutBtn2 = document.getElementById('profSecondaryLogoutBtn');
    if (logoutBtn2) logoutBtn2.onclick = () => performStudentLogout();

    const switchBtn = document.getElementById('profSwitchAccountBtn');
    if (switchBtn) switchBtn.onclick = () => openStudentAuthModal('login', '');

    const switchModalBtn = document.getElementById('profOpenSwitcherModalBtn');
    if (switchModalBtn) switchModalBtn.onclick = () => openStudentAuthModal('login', '');

    const createAccBtn = document.getElementById('profCreateNewAccBtn');
    if (createAccBtn) createAccBtn.onclick = () => openStudentAuthModal('register', '');

    const resetPassBtn = document.getElementById('profResetPasswordBtn');
    if (resetPassBtn) resetPassBtn.onclick = () => openStudentAuthModal('reset', state.student.email || '');

    root.querySelectorAll('[data-quick-logout-acc]').forEach((btn) => {
      btn.onclick = () => performStudentLogout();
    });

    root.querySelectorAll('[data-quick-switch-acc]').forEach((btn) => {
      btn.onclick = () => {
        const targetEmail = btn.getAttribute('data-quick-switch-acc');
        openStudentAuthModal('login', targetEmail);
      };
    });
  }

  function renderAdminGatePrompt(root) {
    root.innerHTML = `
      <div class="card" style="max-width:500px;margin:24px auto;text-align:center;">
        <img src="assets/cgpedia-logo-clean.png" alt="CGpedia" style="width:68px;height:68px;border-radius:50%;object-fit:cover;margin-bottom:10px;" />
        <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:6px;">🛡️ Owner Admin Verification</h2>
        <p style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:14px;">
          Admin Panel is strictly restricted to the verified Owner Admin (<strong>${OWNER_ADMIN_EMAIL}</strong>) and authorized staff.
        </p>
        <div class="form-group" style="text-align:left;">
          <label class="form-label">Verify Owner Email ID</label>
          <input class="form-input" id="gateAdminEmailInput" value="${esc(state.student.email)}" placeholder="usahu0304@gmail.com" />
        </div>
        <button class="btn btn-primary" style="width:100%;" id="gateVerifyAdminBtn">🔓 Verify &amp; Open Admin Panel</button>
      </div>
    `;
    document.getElementById('gateVerifyAdminBtn').onclick = () => {
      const entered = document.getElementById('gateAdminEmailInput').value.trim().toLowerCase();
      state.student.email = entered;
      saveState();
      if (isCurrentUserAdmin()) {
        toast('🛡️ Welcome to CGpedia Master Admin Console!');
        renderApp();
      } else {
        toast('⛔ Access Denied: Only usahu0304@gmail.com or delegated staff can access Admin Panel.');
      }
    };
  }

  // =========================================================================
  // Student Payment Popup (UPI QR + Coupon + WhatsApp Verification)
  // =========================================================================
  function openStudentPaymentModal(targetId, targetType) {
    const item = targetType === 'folder'
      ? (state.folders || []).find((f) => f.id === targetId)
      : (state.tests || []).find((t) => t.id === targetId);
    if (!item) return;

    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;

    let basePrice = Number(item.priceInr || 99);
    let finalPrice = basePrice;
    let appliedCouponCode = '';
    const validityDays = Number(item.validityDays || 180);
    const upiId = String(state.config.upiId || '').trim();
    const rawWa = String(state.config.whatsappNumber || state.config.whatsappSupportNumber || '').trim();
    const waNum = rawWa.replace(/\D/g, '');
    const waPhone = waNum.length === 10 ? '91' + waNum : waNum;
    const instructionsHi = String(state.config.paymentInstructionsHi || 'QR कोड स्कैन करके या UPI ID पर पेमेंट करें, पेमेंट का स्क्रीनशॉट लें और एक्टिवेशन के लिए नीचे दिए गए WhatsApp बटन पर क्लिक करके या पेमेंट रिकॉर्ड सबमिट करके विवरण भेजें।').trim();
    const instructionsEn = String(state.config.paymentInstructionsEn || 'Scan the QR Code or pay via the configured UPI ID, take a payment screenshot, and click the WhatsApp button below or submit your payment verification details for package activation.').trim();

    function renderModalContent() {
      const waText = encodeURIComponent(
        `नमस्ते CGpedia Admin,\nमैंने पेमेंट कर दिया है। कृपया मेरा पैकेज एक्टिवेट करें:\n` +
        `• Package: ${item.titleHi} (${item.titleEn})\n` +
        `• Amount: ₹${finalPrice}${appliedCouponCode ? ' (Coupon: ' + appliedCouponCode + ')' : ''}\n` +
        `• Validity: ${validityDays} Days\n` +
        `• Student Name: ${state.student.name}\n` +
        `• Registered Email: ${state.student.email || 'Not set'}\n` +
        `• User ID: ${state.student.uid}\n` +
        `(पेमेंट स्क्रीनशॉट संलग्न है / Screenshot Attached)`
      );

      modalRoot.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-card" style="max-width:540px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <div>
                <span class="badge badge-paid">PREMIUM PACKAGE UNLOCK</span>
                <h2 style="font-size:1.12rem;font-weight:800;margin-top:3px;">${esc(item.titleHi)}</h2>
              </div>
              <button class="btn btn-outline btn-sm" id="closePayModalBtn">✕</button>
            </div>

            <div class="kpi-grid" style="grid-template-columns:1fr 1fr;margin-bottom:12px;">
              <div class="kpi-card" style="padding:10px;text-align:center;">
                <div class="kpi-value" style="color:var(--secondary);">₹${finalPrice} ${appliedCouponCode ? `<span style="font-size:0.8rem;text-decoration:line-through;color:var(--text-muted);">₹${basePrice}</span>` : ''}</div>
                <div class="kpi-label">Payable Amount</div>
              </div>
              <div class="kpi-card" style="padding:10px;text-align:center;">
                <div class="kpi-value">${validityDays} Days</div>
                <div class="kpi-label">Validity (From Activation)</div>
              </div>
            </div>

            <!-- Coupon Input -->
            <div style="display:flex;gap:8px;margin-bottom:14px;">
              <input class="form-input" id="payCouponInput" value="${esc(appliedCouponCode)}" placeholder="Have a Coupon Code? (e.g. CGPSC50)" style="padding:7px 11px;" />
              <button class="btn btn-outline btn-sm" id="applyPayCouponBtn">🎟️ Apply</button>
            </div>

            <!-- UPI QR Code Box -->
            <div style="text-align:center;padding:14px;border:1.5px dashed var(--border-strong);border-radius:12px;background:var(--surface-alt);margin-bottom:14px;">
              ${state.config.upiQrImage ? `
                <img src="${esc(state.config.upiQrImage)}" alt="Admin UPI QR Code" style="max-width:210px;max-height:210px;border-radius:10px;border:2px solid #fff;box-shadow:var(--shadow-sm);margin:0 auto 10px;display:block;" />
                <a href="${esc(state.config.upiQrImage)}" download="CGpedia-UPI-QR.png" class="btn btn-outline btn-sm" style="margin-bottom:8px;">⬇️ Download QR Image</a>
              ` : `
                <div style="padding:14px;font-size:0.82rem;color:var(--text-secondary);">
                  📲 Pay via any UPI App (GPay / PhonePe / Paytm) using the configured UPI details below:
                </div>
              `}
              ${upiId ? `
                <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;flex-wrap:wrap;">
                  <code style="padding:6px 12px;border-radius:6px;background:var(--surface);border:1px solid var(--border);font-weight:800;font-size:0.9rem;">${esc(upiId)}</code>
                  <button class="btn btn-primary btn-sm" id="copyUpiIdBtn">📋 Copy UPI ID</button>
                </div>
              ` : `
                <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">UPI ID not configured by Admin yet.</div>
              `}
            </div>

            <!-- Dynamic Bilingual Payment Instructions Configured by Admin -->
            <div style="padding:10px 12px;border-radius:8px;background:var(--secondary-soft);font-size:0.8rem;margin-bottom:14px;line-height:1.5;">
              ${instructionsHi ? `<div><strong>🇮🇳 निर्देश:</strong> ${esc(instructionsHi)}</div>` : ''}
              ${instructionsEn ? `<div style="margin-top:4px;color:var(--text-secondary);"><strong>🇬🇧 Instructions:</strong> ${esc(instructionsEn)}</div>` : ''}
            </div>

            <!-- Submit Payment Verification Record (UTR / Transaction Ref) -->
            <div style="padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--surface);margin-bottom:12px;">
              <div style="font-size:0.78rem;font-weight:800;margin-bottom:6px;">🧾 Submit Payment Verification Record (Optional UTR / Ref No.)</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <input class="form-input" id="payModalUtrInput" placeholder="Enter 12-digit UPI UTR / Transaction Ref" style="flex:1;min-width:180px;padding:7px 10px;font-size:0.8rem;" />
                <button class="btn btn-navy btn-sm" id="submitPayOrderModalBtn">📤 Submit Payment Record</button>
              </div>
            </div>

            ${waPhone ? `
              <a href="https://wa.me/${waPhone}?text=${waText}" target="_blank" rel="noopener" class="btn btn-success btn-lg" style="width:100%;">
                💬 Send Payment Screenshot on WhatsApp (${esc(rawWa)})
              </a>
            ` : `
              <button class="btn btn-outline btn-lg" style="width:100%;" id="openPaymentCenterFromModalBtn">
                💳 Open Student Payment Center
              </button>
            `}
          </div>
        </div>
      `;

      document.getElementById('closePayModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
      const copyBtn = document.getElementById('copyUpiIdBtn');
      if (copyBtn) {
        copyBtn.onclick = () => {
          try { navigator.clipboard.writeText(upiId); } catch (_) {}
          toast('📋 UPI ID copied: ' + upiId);
        };
      }
      const openPayCenterBtn = document.getElementById('openPaymentCenterFromModalBtn');
      if (openPayCenterBtn) {
        openPayCenterBtn.onclick = () => {
          modalRoot.innerHTML = '';
          navigateToTab('payments');
        };
      }
      const submitOrderBtn = document.getElementById('submitPayOrderModalBtn');
      if (submitOrderBtn) {
        submitOrderBtn.onclick = () => {
          const utr = (document.getElementById('payModalUtrInput').value || '').trim();
          if (!utr) {
            toast('⚠️ कृपया अपना UPI Transaction ID / UTR नंबर दर्ज करें।');
            return;
          }
          const nowMs = Date.now();
          const orderObj = {
            id: 'ord_' + nowMs,
            uid: state.student.uid || '',
            studentName: state.student.name || 'Aspirant',
            studentEmail: (state.student.email || '').toLowerCase(),
            studentPhone: state.student.phone || '',
            studentIdentifier: (state.student.email || state.student.uid || '').toLowerCase(),
            targetId: item.id,
            targetType: targetType === 'folder' ? 'folder' : 'test',
            targetTitle: item.titleHi || item.titleEn || 'Paid Package',
            amountPaid: finalPrice,
            validityDays,
            couponCode: appliedCouponCode || '',
            transactionRef: utr,
            status: 'pending',
            createdAtMs: nowMs,
            createdAtIso: new Date(nowMs).toISOString()
          };
          state.orders = state.orders || [];
          state.orders.unshift(orderObj);
          saveState();
          if (window.CGpediaCloud) {
            window.CGpediaCloud.saveCloudDoc('orders', orderObj.id, orderObj);
          }
          toast('✅ Payment verification record submitted! Admin will verify and unlock your package.');
          modalRoot.innerHTML = '';
          navigateToTab('payments');
        };
      }
      document.getElementById('applyPayCouponBtn').onclick = () => {
        const code = document.getElementById('payCouponInput').value.trim().toUpperCase();
        const found = (state.coupons || []).find((c) => String(c.code).toUpperCase() === code);
        if (!found) {
          toast('⚠️ Invalid or expired coupon code.');
          return;
        }
        appliedCouponCode = found.code;
        finalPrice = Math.max(1, Math.round(basePrice * (1 - Number(found.discountPercent || 0) / 100)));
        toast(`🎉 Coupon ${found.code} applied! (${found.discountPercent}% OFF)`);
        renderModalContent();
      };
    }

    renderModalContent();
  }

  // =========================================================================
  // Restored Student Panel Payment Center (Dynamic Firebase Config & Orders)
  // =========================================================================
  function renderStudentPaymentView(root) {
    const upiId = String(state.config.upiId || '').trim();
    const qrImg = String(state.config.upiQrImage || '').trim();
    const rawWa = String(state.config.whatsappNumber || state.config.whatsappSupportNumber || '').trim();
    const waNum = rawWa.replace(/\D/g, '');
    const waPhone = waNum.length === 10 ? '91' + waNum : waNum;
    const instructionsHi = String(state.config.paymentInstructionsHi || 'QR कोड स्कैन करके या UPI ID पर पेमेंट करें, पेमेंट का स्क्रीनशॉट लें और एक्टिवेशन के लिए नीचे दिए गए WhatsApp बटन पर क्लिक करके या पेमेंट रिकॉर्ड सबमिट करके विवरण भेजें।').trim();
    const instructionsEn = String(state.config.paymentInstructionsEn || 'Scan the QR Code or pay via the configured UPI ID, take a payment screenshot, and click the WhatsApp button below or submit your payment verification details for package activation.').trim();

    const paidPackages = [
      ...(state.folders || []).filter((f) => f.isPaid).map((f) => ({
        id: f.id,
        type: 'folder',
        titleHi: f.titleHi,
        titleEn: f.titleEn,
        examCode: f.examCode || 'CGPSC',
        priceInr: Number(f.priceInr || 99),
        validityDays: Number(f.validityDays || 180)
      })),
      ...(state.tests || []).filter((t) => t.status === 'published' && t.isPaid).map((t) => ({
        id: t.id,
        type: 'test',
        titleHi: t.titleHi,
        titleEn: t.titleEn,
        examCode: t.examCode || 'CGPSC',
        priceInr: Number(t.priceInr || 49),
        validityDays: Number(t.validityDays || 180)
      }))
    ];

    const myEmail = String(state.student.email || '').trim().toLowerCase();
    const myUid = String(state.student.uid || '').trim().toLowerCase();

    const myOrders = (state.orders || []).filter((o) => {
      const oEmail = String(o.studentEmail || o.studentIdentifier || '').trim().toLowerCase();
      const oUid = String(o.uid || o.studentIdentifier || '').trim().toLowerCase();
      return (myEmail && oEmail === myEmail) || (myUid && oUid === myUid);
    });

    const myActivations = (state.activations || []).filter((a) => {
      const ident = String(a.studentIdentifier || '').trim().toLowerCase();
      return (myEmail && ident === myEmail) || (myUid && ident === myUid);
    });

    const waTextDefault = encodeURIComponent(
      `नमस्ते CGpedia Admin,\nमैं पेमेंट/पैकेज एक्टिवेशन के संबंध में संपर्क कर रहा हूँ:\n` +
      `• Student Name: ${state.student.name}\n` +
      `• Registered Email: ${state.student.email || 'Not set'}\n` +
      `• User ID: ${state.student.uid}`
    );

    root.innerHTML = `
      <div class="section-header">
        <div>
          <h2 class="section-title">💳 पेमेंट एवं पैकेज एक्टिवेशन (Student Payment Center)</h2>
          <p class="section-subtitle">Scan Official UPI QR Code, Copy UPI ID, Contact Admin on WhatsApp &amp; Track Package Unlock Status</p>
        </div>
        <button class="btn btn-outline btn-sm" id="studentPayBrowseSeriesBtn">📚 Browse Paid Test Series</button>
      </div>

      <div class="grid-2">
        <!-- 1. Official Admin UPI QR Code, UPI ID & WhatsApp Verification Card -->
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
            <h3 style="font-size:1.02rem;font-weight:800;">📲 Official UPI QR Code &amp; Payment Details</h3>
            <span class="badge badge-cloud">Live Firebase Sync</span>
          </div>

          <div style="text-align:center;padding:18px;border:1.5px dashed var(--border-strong);border-radius:12px;background:var(--surface-alt);margin-bottom:14px;">
            ${qrImg ? `
              <img src="${esc(qrImg)}" alt="CGpedia Official UPI QR Code" style="max-width:220px;max-height:220px;border-radius:12px;border:3px solid #fff;box-shadow:var(--shadow-md);margin:0 auto 12px;display:block;object-fit:contain;" />
              <div style="margin-bottom:10px;">
                <a href="${esc(qrImg)}" download="CGpedia-Official-UPI-QR.png" class="btn btn-outline btn-sm">⬇️ Download QR Code</a>
              </div>
            ` : `
              <div style="padding:22px 12px;color:var(--text-secondary);font-size:0.85rem;">
                📷 Official UPI QR Code has not been uploaded by Admin yet.<br/>
                Please use the configured UPI ID or WhatsApp contact below.
              </div>
            `}

            <div style="margin-top:8px;">
              <div style="font-size:0.75rem;font-weight:700;color:var(--text-secondary);margin-bottom:4px;">Configured Official UPI ID</div>
              ${upiId ? `
                <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;">
                  <code style="padding:7px 14px;border-radius:8px;background:var(--surface);border:1px solid var(--border);font-weight:800;font-size:0.95rem;color:var(--primary);">${esc(upiId)}</code>
                  <button class="btn btn-primary btn-sm" id="studentCopyUpiIdBtn">📋 Copy UPI ID</button>
                </div>
              ` : `
                <div style="font-size:0.82rem;color:var(--text-muted);font-weight:600;">Not configured by Admin yet</div>
              `}
            </div>
          </div>

          <!-- Dynamic Payment Instructions from Admin -->
          <div style="padding:12px 14px;border-radius:10px;background:var(--secondary-soft);font-size:0.82rem;line-height:1.55;margin-bottom:14px;">
            <div style="font-weight:800;color:var(--secondary);margin-bottom:4px;">📌 Payment Instructions / पेमेंट निर्देश</div>
            ${instructionsHi ? `<div style="margin-bottom:4px;"><strong>🇮🇳 हिन्दी:</strong> ${esc(instructionsHi)}</div>` : ''}
            ${instructionsEn ? `<div style="color:var(--text-secondary);"><strong>🇬🇧 English:</strong> ${esc(instructionsEn)}</div>` : ''}
          </div>

          <!-- WhatsApp Contact Button -->
          ${waPhone ? `
            <a href="https://wa.me/${waPhone}?text=${waTextDefault}" target="_blank" rel="noopener" class="btn btn-success btn-lg" style="width:100%;">
              💬 Contact Admin / Send Payment Screenshot on WhatsApp (${esc(rawWa)})
            </a>
          ` : `
            <div style="padding:10px 12px;border-radius:8px;background:var(--surface-alt);font-size:0.8rem;color:var(--text-muted);text-align:center;">
              WhatsApp support number will appear here once configured by Admin.
            </div>
          `}
        </div>

        <!-- 2. Submit Payment Verification Request & Package Selection Card -->
        <div class="card">
          <h3 style="font-size:1.02rem;font-weight:800;margin-bottom:8px;">🧾 Submit Payment Verification Details</h3>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:12px;">
            After completing your UPI payment, submit your transaction reference / UTR number below so the Admin can verify and approve your package unlock.
          </p>

          <div class="form-group">
            <label class="form-label">Select Test Series Package or Test</label>
            <select class="form-select" id="stuPayPackageSelect">
              ${paidPackages.length === 0 ? `
                <option value="custom_package" data-price="99" data-validity="180" data-type="folder" data-title="CGpedia Premium Test Series">CGpedia Premium Test Series — ₹99 (180 Days)</option>
              ` : paidPackages.map((p) => `
                <option value="${esc(p.id)}" data-price="${p.priceInr}" data-validity="${p.validityDays}" data-type="${esc(p.type)}" data-title="${esc(p.titleHi)}">
                  [${esc(p.examCode)}] ${esc(p.titleHi)} — ₹${p.priceInr} (${p.validityDays} Days)
                </option>
              `).join('')}
            </select>
          </div>

          <div class="grid-2" style="gap:10px;">
            <div class="form-group">
              <label class="form-label">Amount Paid (₹)</label>
              <input type="number" class="form-input" id="stuPayAmountInput" value="${paidPackages[0] ? paidPackages[0].priceInr : 99}" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Your WhatsApp / Mobile Number</label>
              <input class="form-input" id="stuPayPhoneInput" value="${esc(state.student.phone || '')}" placeholder="10-digit mobile number" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">UPI Transaction ID / 12-Digit UTR Number *</label>
            <input class="form-input" id="stuPayUtrInput" placeholder="e.g., 412345678901" />
          </div>

          <div class="form-group">
            <label class="form-label">Additional Note / Coupon Code Used (Optional)</label>
            <input class="form-input" id="stuPayNoteInput" placeholder="e.g., Paid via PhonePe / Coupon CGPSC50" />
          </div>

          <button class="btn btn-primary btn-lg" style="width:100%;" id="stuSubmitPaymentRecordBtn">
            📤 Submit Payment for Admin Approval
          </button>
        </div>
      </div>

      <!-- 3. Student's Active Unlocked Packages -->
      <div class="card">
        <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">🔓 My Unlocked Packages (${myActivations.length})</h3>
        ${myActivations.length === 0 ? `
          <p style="font-size:0.84rem;color:var(--text-muted);">No active paid package unlocks yet. Once Admin approves your payment, your unlocked packages and validity countdown will appear here.</p>
        ` : `
          <div style="display:grid;gap:8px;">
            ${myActivations.map((act) => {
              const remMs = Number(act.expiresAtMs || 0) - Date.now();
              const remDays = Math.max(0, Math.ceil(remMs / 86400000));
              const expired = remMs <= 0;
              return `
                <div style="padding:10px 12px;border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;background:var(--surface-alt);">
                  <div>
                    <span class="badge ${expired ? 'badge-live' : 'badge-free'}">${expired ? 'EXPIRED' : 'ACTIVE • ' + remDays + ' Days Left'}</span>
                    <strong style="margin-left:6px;">${esc(act.targetTitle || 'Premium Package')}</strong>
                    <div style="font-size:0.76rem;color:var(--text-secondary);margin-top:2px;">
                      Amount: ₹${Number(act.amountPaid || 0)} • Activated: ${act.activatedAtMs ? new Date(act.activatedAtMs).toLocaleDateString() : '-'} • Valid till: ${act.expiresAtMs ? new Date(act.expiresAtMs).toLocaleDateString() : '-'}
                    </div>
                  </div>
                  <button class="btn btn-primary btn-sm" data-open-unlocked-series="${esc(act.targetId)}">📚 Open Tests</button>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- 4. Student's Submitted Payment Records History -->
      <div class="card">
        <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">📋 My Payment Verification Records (${myOrders.length})</h3>
        ${myOrders.length === 0 ? `
          <p style="font-size:0.84rem;color:var(--text-muted);">You have not submitted any payment verification records yet.</p>
        ` : `
          <div style="display:grid;gap:8px;">
            ${myOrders.map((ord) => {
              const st = String(ord.status || 'pending').toLowerCase();
              const badgeCls = st === 'approved' ? 'badge-free' : (st === 'rejected' ? 'badge-live' : 'badge-paid');
              const statusLabel = st === 'approved' ? 'APPROVED ✅' : (st === 'rejected' ? 'REJECTED ❌' : 'PENDING VERIFICATION ⏳');
              return `
                <div style="padding:10px 12px;border:1px solid var(--border);border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                  <div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span class="badge ${badgeCls}">${statusLabel}</span>
                      <strong>${esc(ord.targetTitle || 'Paid Package')}</strong>
                      <span style="font-weight:800;color:var(--secondary);">₹${Number(ord.amountPaid || 0)}</span>
                    </div>
                    <div style="font-size:0.76rem;color:var(--text-secondary);margin-top:3px;">
                      UTR / Ref: <code>${esc(ord.transactionRef || '-')}</code> • Submitted: ${ord.createdAtMs ? new Date(ord.createdAtMs).toLocaleString() : '-'}
                      ${ord.note ? ` • Note: ${esc(ord.note)}` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    const browseBtn = document.getElementById('studentPayBrowseSeriesBtn');
    if (browseBtn) {
      browseBtn.onclick = () => navigateToTab('test-series');
    }

    const copyBtn = document.getElementById('studentCopyUpiIdBtn');
    if (copyBtn && upiId) {
      copyBtn.onclick = () => {
        try { navigator.clipboard.writeText(upiId); } catch (_) {}
        toast('📋 UPI ID copied: ' + upiId);
      };
    }

    const pkgSelect = document.getElementById('stuPayPackageSelect');
    const amtInput = document.getElementById('stuPayAmountInput');
    if (pkgSelect && amtInput) {
      pkgSelect.onchange = () => {
        const opt = pkgSelect.options[pkgSelect.selectedIndex];
        if (opt && opt.getAttribute('data-price')) {
          amtInput.value = opt.getAttribute('data-price');
        }
      };
    }

    const submitBtn = document.getElementById('stuSubmitPaymentRecordBtn');
    if (submitBtn) {
      submitBtn.onclick = () => {
        const utr = (document.getElementById('stuPayUtrInput').value || '').trim();
        if (!utr) {
          toast('⚠️ कृपया अपना 12-अंकीय UPI Transaction ID / UTR नंबर दर्ज करें।');
          return;
        }
        const opt = pkgSelect ? pkgSelect.options[pkgSelect.selectedIndex] : null;
        const targetId = pkgSelect ? pkgSelect.value : 'custom_package';
        const targetTitle = opt ? (opt.getAttribute('data-title') || opt.textContent.trim()) : 'Paid Package';
        const targetType = opt ? (opt.getAttribute('data-type') || 'folder') : 'folder';
        const validityDays = opt ? Number(opt.getAttribute('data-validity') || 180) : 180;
        const amountPaid = Math.max(1, Number((amtInput && amtInput.value) || 99));
        const phoneVal = (document.getElementById('stuPayPhoneInput').value || '').trim();
        const noteVal = (document.getElementById('stuPayNoteInput').value || '').trim();
        if (phoneVal) state.student.phone = phoneVal;

        const nowMs = Date.now();
        const orderObj = {
          id: 'ord_' + nowMs,
          uid: state.student.uid || '',
          studentName: state.student.name || 'Aspirant',
          studentEmail: (state.student.email || '').toLowerCase(),
          studentPhone: phoneVal,
          studentIdentifier: (state.student.email || state.student.uid || '').toLowerCase(),
          targetId,
          targetType,
          targetTitle,
          amountPaid,
          validityDays,
          transactionRef: utr,
          note: noteVal,
          status: 'pending',
          createdAtMs: nowMs,
          createdAtIso: new Date(nowMs).toISOString()
        };
        state.orders = state.orders || [];
        state.orders.unshift(orderObj);
        saveState();
        if (window.CGpediaCloud) {
          window.CGpediaCloud.saveCloudDoc('orders', orderObj.id, orderObj);
        }
        toast('✅ Payment verification record submitted! Admin will review & unlock your package.');
        renderApp();
      };
    }

    root.querySelectorAll('[data-open-unlocked-series]').forEach((btn) => {
      btn.onclick = () => {
        const tid = btn.getAttribute('data-open-unlocked-series');
        const matchingFolder = (state.folders || []).find((f) => f.id === tid);
        if (matchingFolder) {
          state.selectedFolderId = matchingFolder.id;
        }
        navigateToTab('test-series');
      };
    });
  }

  // =========================================================================
  // Onboarding & Exam Category Selection Modal
  // =========================================================================
  function openOnboardingModal() {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;
    const exams = window.CGpediaCloud ? window.CGpediaCloud.EXAM_CATEGORIES : [];
    const selectedSet = new Set(state.student.targetExams || ['CGPSC']);

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:600px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
            <img src="assets/cgpedia-logo-clean.png" alt="CGpedia" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid var(--secondary);" />
            <div>
              <h2 style="font-size:1.15rem;font-weight:800;">Welcome to CGpedia — Personalize Your Prep</h2>
              <p style="font-size:0.8rem;color:var(--text-secondary);">Select your Target Competitive Examinations &amp; Preferred Language</p>
            </div>
          </div>

          <div class="grid-2" style="gap:10px;margin-bottom:12px;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Your Name / आपका नाम</label>
              <input class="form-input" id="onbNameInput" value="${esc(state.student.name)}" placeholder="Enter your full name" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Email ID (For Cloud Sync &amp; Unlocks)</label>
              <input class="form-input" id="onbEmailInput" value="${esc(state.student.email)}" placeholder="yourname@gmail.com" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Select Target Examinations (Choose one or more):</label>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;margin-top:6px;">
              ${exams.map((ex) => `
                <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1.5px solid var(--border-strong);border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:700;">
                  <input type="checkbox" class="onb-exam-check" value="${esc(ex.code)}" ${selectedSet.has(ex.code) ? 'checked' : ''} />
                  <span>${esc(ex.icon)} ${esc(ex.nameEn)}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
            <button class="btn btn-primary btn-lg" id="saveOnboardingBtn">✅ Save &amp; Continue</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('saveOnboardingBtn').onclick = () => {
      const name = document.getElementById('onbNameInput').value.trim() || 'Aspirant';
      const email = document.getElementById('onbEmailInput').value.trim().toLowerCase();
      const picks = [];
      modalRoot.querySelectorAll('.onb-exam-check:checked').forEach((chk) => picks.push(chk.value));
      state.student.name = name;
      if (email) state.student.email = email;
      state.student.targetExams = picks.length > 0 ? picks : ['CGPSC'];
      state.onboarded = true;
      saveState();
      modalRoot.innerHTML = '';
      renderApp();
    };
  }

  // =========================================================================
  // Admin Question Editor & Bulk Parser Helpers
  // =========================================================================
  function openQuestionEditorModal(testId, onDone) {
    const testObj = (state.tests || []).find((t) => t.id === testId);
    if (!testObj) return;
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;

    function renderEditor() {
      const qs = testObj.questions || [];
      modalRoot.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-card" style="max-width:740px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px;flex-wrap:wrap;">
              <div>
                <span class="badge ${testObj.status === 'published' ? 'badge-free' : 'badge-draft'}">${testObj.status.toUpperCase()}</span>
                <h2 style="font-size:1.1rem;font-weight:800;margin-top:2px;">✏️ Question Editor: ${esc(testObj.titleHi)} (${qs.length} Qs)</h2>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                ${(state.questionBank || []).length > 0 ? `<button class="btn btn-navy btn-sm" id="qePickFromCentralBtn">📚 Add from Central Question Bank (${(state.questionBank || []).length})</button>` : ''}
                <button class="btn btn-outline btn-sm" id="closeQEditorBtn">Done</button>
              </div>
            </div>

            <div class="card" style="background:var(--surface-alt);padding:12px;margin-bottom:12px;">
              <h3 style="font-size:0.88rem;font-weight:800;margin-bottom:8px;">➕ Add New Bilingual Question</h3>
              <textarea class="form-textarea" id="qeQuestionHi" rows="2" placeholder="प्रश्न (हिन्दी में)..." style="margin-bottom:6px;"></textarea>
              <textarea class="form-textarea" id="qeQuestionEn" rows="2" placeholder="Question (in English)..." style="margin-bottom:6px;"></textarea>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
                <input class="form-input" id="qeOpt0Hi" placeholder="विकल्प A (Hi)" />
                <input class="form-input" id="qeOpt0En" placeholder="Option A (En)" />
                <input class="form-input" id="qeOpt1Hi" placeholder="विकल्प B (Hi)" />
                <input class="form-input" id="qeOpt1En" placeholder="Option B (En)" />
                <input class="form-input" id="qeOpt2Hi" placeholder="विकल्प C (Hi)" />
                <input class="form-input" id="qeOpt2En" placeholder="Option C (En)" />
                <input class="form-input" id="qeOpt3Hi" placeholder="विकल्प D (Hi)" />
                <input class="form-input" id="qeOpt3En" placeholder="Option D (En)" />
              </div>
              <div style="display:grid;grid-template-columns:140px 1fr auto;gap:6px;">
                <select class="form-select" id="qeCorrectIdx">
                  <option value="0">Correct: A</option>
                  <option value="1">Correct: B</option>
                  <option value="2">Correct: C</option>
                  <option value="3">Correct: D</option>
                </select>
                <input class="form-input" id="qeExpHi" placeholder="व्याख्या / Explanation..." />
                <button class="btn btn-primary" id="qeAddQuestionBtn">➕ Add</button>
              </div>
            </div>

            <div style="max-height:300px;overflow-y:auto;display:grid;gap:8px;">
              ${qs.map((q, idx) => `
                <div style="padding:10px;border:1px solid var(--border);border-radius:8px;display:flex;justify-content:space-between;gap:8px;">
                  <div style="font-size:0.84rem;">
                    <strong>Q${idx + 1}.</strong> ${esc(q.questionHi)}
                    <div style="color:var(--text-secondary);font-size:0.78rem;">${esc(q.questionEn)}</div>
                    <div style="color:var(--success);font-size:0.76rem;font-weight:700;">Ans: Option ${['A', 'B', 'C', 'D'][q.correctOptionIndex || 0]}</div>
                  </div>
                  <button class="btn btn-danger btn-sm" data-del-test-q="${idx}">🗑️</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      document.getElementById('closeQEditorBtn').onclick = () => {
        modalRoot.innerHTML = '';
        if (onDone) onDone();
      };

      const pickCentralBtn = document.getElementById('qePickFromCentralBtn');
      if (pickCentralBtn) {
        pickCentralBtn.onclick = () => {
          const existingRefIds = new Set((testObj.questions || []).map((q) => q.centralQuestionId || q.id));
          const availableCentral = (state.questionBank || []).filter((cq) => !existingRefIds.has(cq.id) && isQuestionEligibleForAutoSelection(cq));
          if (availableCentral.length === 0) {
            toast('All eligible Central Question Bank questions are already linked to this test.');
            return;
          }
          let toLink = availableCentral.filter((cq) => {
            if (!testObj.examCode || testObj.examCode === 'ALL') return true;
            const targetEx = String(testObj.examCode || '').trim().toUpperCase();
            const qExamIds = Array.isArray(cq.examIds) ? cq.examIds.map((x) => String(x || '').trim().toUpperCase()) : [];
            const qExamCodes = Array.isArray(cq.examCodes) ? cq.examCodes.map((x) => String(x || '').trim().toUpperCase()) : [];
            const qExam = String(cq.examCode || '').trim().toUpperCase();
            return !qExam || qExam === targetEx || qExam === 'ALL' || qExamIds.includes(targetEx) || qExamIds.includes('ALL') || qExamCodes.includes(targetEx);
          });
          if (toLink.length === 0) toLink = availableCentral;
          const addedCount = toLink.length;
          testObj.questions = testObj.questions || [];
          toLink.forEach((cq) => {
            testObj.questions.push(Object.assign({}, cq, {
              id: `${testObj.id}_ref_${cq.id}`,
              centralQuestionId: cq.id
            }));
            cq.linkedTestIds = Array.from(new Set([...(cq.linkedTestIds || []), testObj.id]));
            if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('question_bank', cq.id, cq);
          });
          saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('tests', testObj.id, testObj);
          toast(`✅ Linked ${addedCount} reusable questions from Central Question Bank!`);
          renderEditor();
        };
      }

      document.getElementById('qeAddQuestionBtn').onclick = () => {
        const qHi = document.getElementById('qeQuestionHi').value.trim();
        const qEn = document.getElementById('qeQuestionEn').value.trim() || qHi;
        if (!qHi) return;
        const exp = document.getElementById('qeExpHi').value.trim();
        testObj.questions = testObj.questions || [];
        testObj.questions.push({
          id: `${testObj.id}_q_${Date.now()}`,
          questionHi: qHi,
          questionEn: qEn,
          optionsHi: [
            document.getElementById('qeOpt0Hi').value.trim() || 'विकल्प A',
            document.getElementById('qeOpt1Hi').value.trim() || 'विकल्प B',
            document.getElementById('qeOpt2Hi').value.trim() || 'विकल्प C',
            document.getElementById('qeOpt3Hi').value.trim() || 'विकल्प D'
          ],
          optionsEn: [
            document.getElementById('qeOpt0En').value.trim() || 'Option A',
            document.getElementById('qeOpt1En').value.trim() || 'Option B',
            document.getElementById('qeOpt2En').value.trim() || 'Option C',
            document.getElementById('qeOpt3En').value.trim() || 'Option D'
          ],
          correctOptionIndex: Number(document.getElementById('qeCorrectIdx').value || 0),
          explanationHi: exp || 'विस्तृत व्याख्या उपलब्ध है।',
          explanationEn: exp || 'Detailed explanation available.',
          subjectTag: testObj.topic || 'General Studies'
        });
        saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('tests', testObj.id, testObj);
        renderEditor();
      };

      modalRoot.querySelectorAll('[data-del-test-q]').forEach((btn) => {
        btn.onclick = () => {
          const idx = Number(btn.getAttribute('data-del-test-q'));
          testObj.questions.splice(idx, 1);
          saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('tests', testObj.id, testObj);
          renderEditor();
        };
      });
    }

    renderEditor();
  }

  function normalizeStemTextForSelection(str) {
    return String(str == null ? '' : str)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function computeStemSimilarityForSelection(strA, strB) {
    const a = normalizeStemTextForSelection(strA);
    const b = normalizeStemTextForSelection(strB);
    if (!a || !b) return 0;
    if (a === b) return 1;
    const tokA = new Set(a.split(' ').filter(Boolean));
    const tokB = new Set(b.split(' ').filter(Boolean));
    let inter = 0;
    tokA.forEach((t) => { if (tokB.has(t)) inter += 1; });
    const union = tokA.size + tokB.size - inter;
    return union > 0 ? inter / union : 0;
  }

  function isQuestionEligibleForAutoSelection(q) {
    if (!q || typeof q !== 'object') return false;
    if (q.isDeleted === true || q.deleted === true) return false;
    if (q.verified === false || q.adminVerified === false) return false;
    if (q.needsCategorisation === true) return false;
    const status = String(q.status || 'verified').trim().toLowerCase();
    const verStatus = String(q.verificationStatus || status || 'verified').trim().toLowerCase();
    const disallowed = ['unverified', 'needs_categorisation', 'needs categorisation', 'deleted', 'draft', 'flagged', 'rejected', 'pending', 'pending_verification'];
    if (disallowed.includes(status) || disallowed.includes(verStatus)) {
      return false;
    }
    const qHi = String(q.questionHi || '').trim();
    const qEn = String(q.questionEn || '').trim();
    if (!qHi && !qEn) return false;

    const optsHi = Array.isArray(q.optionsHi) && q.optionsHi.length >= 4
      ? q.optionsHi.map((o) => String(o || '').trim()).filter(Boolean)
      : [q.optA_Hi, q.optB_Hi, q.optC_Hi, q.optD_Hi].map((o) => String(o || '').trim()).filter(Boolean);
    const optsEn = Array.isArray(q.optionsEn) && q.optionsEn.length >= 4
      ? q.optionsEn.map((o) => String(o || '').trim()).filter(Boolean)
      : [q.optA_En, q.optB_En, q.optC_En, q.optD_En].map((o) => String(o || '').trim()).filter(Boolean);
    if (optsHi.length < 4 && optsEn.length < 4) return false;

    const corrIdx = Number(q.correctOptionIndex !== undefined ? q.correctOptionIndex : q.correctIndex);
    if (!Number.isInteger(corrIdx) || corrIdx < 0 || corrIdx > 3) return false;

    return true;
  }

  function normalizeDifficultyValueForMatch(val) {
    const low = String(val || 'Moderate').trim().toLowerCase();
    if (low === 'easy' || low === 'सरल') return 'easy';
    if (low === 'hard' || low === 'difficult' || low === 'कठिन') return 'hard';
    return 'moderate';
  }

  function selectEligibleQuestionsForTest(criteria) {
    const opts = criteria || {};
    const testPrefix = String(opts.testId || opts.prefix || ('test_' + Date.now())).trim();
    const requestedCount = Math.max(0, Number(opts.count != null ? opts.count : 0));
    const examFilter = String(opts.examId || opts.examCode || '').trim().toUpperCase();
    const subjectFilter = String(opts.subjectId || opts.subject || '').trim();
    const strictTopicFilter = String(opts.topicId || opts.topicFilter || '').trim();
    const strictSubtopicFilter = String(opts.subtopicId || opts.subtopicFilter || opts.subtopic || '').trim();
    const rawTopicInput = String(opts.topic || '').trim();
    const difficultyFilter = String(opts.difficultyLevel || opts.difficulty || '').trim();
    const languageFilter = String(opts.language || '').trim();

    const sourceBank = Array.isArray(opts.sourceQuestionBank)
      ? opts.sourceQuestionBank
      : (state.questionBank || []);

    // Step 1: Strictly exclude unverified, needs_categorisation, deleted, draft, flagged, or invalid questions
    let eligiblePool = sourceBank.filter(isQuestionEligibleForAutoSelection);

    // Step 2: Filter by Exam Category (supports examIds array, examCodes array, and single examCode)
    if (examFilter && examFilter !== 'ALL' && examFilter !== 'DAILY QUIZ') {
      const normEx = examFilter.replace(/[\s-]+/g, '_');
      eligiblePool = eligiblePool.filter((q) => {
        const qExam = String(q.examCode || '').trim().toUpperCase();
        const qExamNorm = qExam.replace(/[\s-]+/g, '_');
        const qExamIds = Array.isArray(q.examIds)
          ? q.examIds.map((e) => String(e || '').trim().toUpperCase().replace(/[\s-]+/g, '_'))
          : [];
        const qExamCodes = Array.isArray(q.examCodes)
          ? q.examCodes.map((e) => String(e || '').trim().toUpperCase().replace(/[\s-]+/g, '_'))
          : [];
        return (
          qExam === 'ALL' ||
          qExam === examFilter ||
          qExamNorm === normEx ||
          qExamIds.includes('ALL') ||
          qExamIds.includes(examFilter) ||
          qExamIds.includes(normEx) ||
          qExamCodes.includes('ALL') ||
          qExamCodes.includes(examFilter) ||
          qExamCodes.includes(normEx)
        );
      });
    }

    // Step 3: Filter by explicit Subject filter (supports subjectId or subjectTag/title)
    if (subjectFilter && subjectFilter.toUpperCase() !== 'ALL') {
      const subLow = subjectFilter.toLowerCase();
      eligiblePool = eligiblePool.filter((q) => {
        const qSubId = String(q.subjectId || '').trim().toLowerCase();
        const qSub = String(q.subjectTag || q.subject || '').trim().toLowerCase();
        if (qSubId && qSubId === subLow) return true;
        if (qSub && (qSub === subLow || qSub.includes(subLow) || subLow.includes(qSub))) return true;
        return false;
      });
    }

    // Step 4: Filter by explicit Topic filter (supports topicId or topic name) or Syllabus Topic match
    if (strictTopicFilter && strictTopicFilter.toUpperCase() !== 'ALL') {
      const topLow = strictTopicFilter.toLowerCase();
      eligiblePool = eligiblePool.filter((q) => {
        const qTopId = String(q.topicId || '').trim().toLowerCase();
        const qTop = String(q.topic || '').trim().toLowerCase();
        const qSubTop = String(q.subtopic || '').trim().toLowerCase();
        const qSub = String(q.subjectTag || '').trim().toLowerCase();
        return (
          (qTopId && qTopId === topLow) ||
          qTop === topLow ||
          qSubTop === topLow ||
          qSub === topLow ||
          (qTop && qTop.includes(topLow))
        );
      });
    } else if (rawTopicInput && (!subjectFilter || subjectFilter.toUpperCase() === 'ALL')) {
      const rawLow = rawTopicInput.toLowerCase();
      const topicMatched = eligiblePool.filter((q) => {
        const qTopId = String(q.topicId || '').trim().toLowerCase();
        const qTop = String(q.topic || '').trim().toLowerCase();
        const qSubTopId = String(q.subtopicId || '').trim().toLowerCase();
        const qSubTop = String(q.subtopic || '').trim().toLowerCase();
        const qSubId = String(q.subjectId || '').trim().toLowerCase();
        const qSub = String(q.subjectTag || '').trim().toLowerCase();
        const qTags = Array.isArray(q.tags) ? q.tags.join(' ').toLowerCase() : '';
        return (
          (qTopId && qTopId === rawLow) ||
          (qSubTopId && qSubTopId === rawLow) ||
          (qSubId && qSubId === rawLow) ||
          (qTop && (qTop === rawLow || rawLow.includes(qTop) || qTop.includes(rawLow))) ||
          (qSub && (qSub === rawLow || rawLow.includes(qSub) || qSub.includes(rawLow))) ||
          (qSubTop && (qSubTop === rawLow || rawLow.includes(qSubTop) || qSubTop.includes(rawLow))) ||
          (qTags && qTags.includes(rawLow))
        );
      });
      if (topicMatched.length > 0 || opts.strictTopicMatch === true) {
        eligiblePool = topicMatched;
      }
    }

    // Step 4b: Filter by explicit Subtopic filter (supports subtopicId or subtopic name)
    if (strictSubtopicFilter && strictSubtopicFilter.toUpperCase() !== 'ALL') {
      const subtopLow = strictSubtopicFilter.toLowerCase();
      eligiblePool = eligiblePool.filter((q) => {
        const qSubTopId = String(q.subtopicId || '').trim().toLowerCase();
        const qSubTop = String(q.subtopic || '').trim().toLowerCase();
        return (
          (qSubTopId && qSubTopId === subtopLow) ||
          qSubTop === subtopLow ||
          (qSubTop && qSubTop.includes(subtopLow))
        );
      });
    }

    // Step 5: Filter by Difficulty Level (supports Easy, Moderate, Hard/Difficult)
    if (difficultyFilter && difficultyFilter.toUpperCase() !== 'ALL') {
      const targetDiffNorm = normalizeDifficultyValueForMatch(difficultyFilter);
      eligiblePool = eligiblePool.filter((q) => {
        const qDiffNorm = normalizeDifficultyValueForMatch(q.difficultyLevel || q.difficulty || 'Moderate');
        return qDiffNorm === targetDiffNorm;
      });
    }

    // Step 6: Filter by Language Availability
    if (languageFilter && languageFilter.toUpperCase() !== 'ALL') {
      const langLow = languageFilter.toLowerCase();
      eligiblePool = eligiblePool.filter((q) => {
        const qLang = String(q.languageAvailability || 'Both').trim().toLowerCase();
        return qLang === langLow || qLang === 'both';
      });
    }

    // Step 7: Deduplicate candidate pool & prevent duplicate questions within the same test
    const uniqueEligible = [];
    const seenIds = new Set();
    const seenNormHi = new Set();
    const seenNormEn = new Set();

    for (const q of eligiblePool) {
      const qid = String(q.centralQuestionId || q.questionId || q.id || '').trim();
      const normHi = normalizeStemTextForSelection(q.questionHi || '');
      const normEn = normalizeStemTextForSelection(q.questionEn || '');

      if (qid && seenIds.has(qid)) continue;
      if (normHi && seenNormHi.has(normHi)) continue;
      if (normEn && seenNormEn.has(normEn)) continue;

      const isNearDup = uniqueEligible.some((already) => {
        const simHi = (normHi && already.questionHi) ? computeStemSimilarityForSelection(q.questionHi, already.questionHi) : 0;
        const simEn = (normEn && already.questionEn) ? computeStemSimilarityForSelection(q.questionEn, already.questionEn) : 0;
        return Math.max(simHi, simEn) >= 0.88;
      });
      if (isNearDup) continue;

      if (qid) seenIds.add(qid);
      if (normHi) seenNormHi.add(normHi);
      if (normEn) seenNormEn.add(normEn);
      uniqueEligible.push(q);
    }

    const availableEligibleCount = uniqueEligible.length;
    const chosenSlice = requestedCount > 0 ? uniqueEligible.slice(0, requestedCount) : [];

    // Create independent snapshot copies linked via centralQuestionId so published tests are never mutated later
    const selectedQuestions = chosenSlice.map((q, idx) => {
      const optsHi = Array.isArray(q.optionsHi) && q.optionsHi.length === 4
        ? [...q.optionsHi]
        : [q.optA_Hi, q.optB_Hi, q.optC_Hi, q.optD_Hi].map((o, i) => String(o || (q.optionsEn && q.optionsEn[i]) || ['A', 'B', 'C', 'D'][i]));
      const optsEn = Array.isArray(q.optionsEn) && q.optionsEn.length === 4
        ? [...q.optionsEn]
        : [q.optA_En, q.optB_En, q.optC_En, q.optD_En].map((o, i) => String(o || optsHi[i] || ['A', 'B', 'C', 'D'][i]));
      const corrIdx = Number(q.correctOptionIndex != null ? q.correctOptionIndex : q.correctIndex || 0);
      const canonicalId = q.questionId || q.id || `qb_${idx + 1}`;
      const examIdsArr = Array.isArray(q.examIds) && q.examIds.length > 0
        ? [...q.examIds]
        : [q.examCode || examFilter || 'CGPSC'];
      const diffLabel = q.difficultyLevel || (String(q.difficulty || '').toLowerCase() === 'difficult' ? 'Hard' : (q.difficulty || 'Moderate'));

      return {
        id: `${testPrefix}_ref_${canonicalId}`,
        questionId: canonicalId,
        centralQuestionId: q.id || canonicalId,
        examCode: q.examCode || examIdsArr[0] || examFilter || 'CGPSC',
        examIds: examIdsArr,
        subjectId: q.subjectId || '',
        subjectTag: q.subjectTag || subjectFilter || rawTopicInput || 'General Studies',
        topicId: q.topicId || '',
        topic: q.topic || strictTopicFilter || rawTopicInput || 'General Knowledge',
        subtopicId: q.subtopicId || '',
        subtopic: q.subtopic || strictSubtopicFilter || '',
        difficulty: q.difficulty || diffLabel || 'Moderate',
        difficultyLevel: diffLabel || 'Moderate',
        questionType: q.questionType || 'MCQ',
        sourceExam: q.sourceExam || '',
        sourceYear: q.sourceYear || '',
        paperSetCode: q.paperSetCode || '',
        sourceDocument: q.sourceDocument || '',
        sourcePageNumber: q.sourcePageNumber || '',
        languageAvailability: q.languageAvailability || 'Both',
        pyqTag: q.pyqTag || '',
        tags: Array.isArray(q.tags) ? [...q.tags] : [],
        status: 'verified',
        verificationStatus: 'verified',
        verified: true,
        importSource: q.importSource || 'central_bank',
        questionHi: q.questionHi || q.questionEn,
        questionEn: q.questionEn || q.questionHi,
        optA_Hi: optsHi[0],
        optB_Hi: optsHi[1],
        optC_Hi: optsHi[2],
        optD_Hi: optsHi[3],
        optA_En: optsEn[0],
        optB_En: optsEn[1],
        optC_En: optsEn[2],
        optD_En: optsEn[3],
        optionsHi: optsHi,
        optionsEn: optsEn,
        correctIndex: corrIdx,
        correctOptionIndex: corrIdx,
        explanationHi: q.explanationHi || q.explanationEn || 'विस्तृत व्याख्या उपलब्ध है।',
        explanationEn: q.explanationEn || q.explanationHi || 'Detailed explanation available.'
      };
    });

    const insufficient = requestedCount > 0 && availableEligibleCount < requestedCount;
    const filterSummaryParts = [];
    if (examFilter && examFilter !== 'ALL') filterSummaryParts.push(`Exam: ${examFilter}`);
    if (subjectFilter && subjectFilter.toUpperCase() !== 'ALL') filterSummaryParts.push(`Subject: ${subjectFilter}`);
    if (strictTopicFilter && strictTopicFilter.toUpperCase() !== 'ALL') filterSummaryParts.push(`Topic: ${strictTopicFilter}`);
    if (strictSubtopicFilter && strictSubtopicFilter.toUpperCase() !== 'ALL') filterSummaryParts.push(`Subtopic: ${strictSubtopicFilter}`);
    if (difficultyFilter && difficultyFilter.toUpperCase() !== 'ALL') filterSummaryParts.push(`Difficulty: ${difficultyFilter}`);
    const filterDesc = filterSummaryParts.length > 0 ? ` (${filterSummaryParts.join(', ')})` : '';

    const warningMessage = insufficient
      ? `⚠️ Admin Warning: Requested ${requestedCount} question(s), but only ${availableEligibleCount} eligible verified question(s) are available in the Central Question Bank${filterDesc}. ${availableEligibleCount > 0 ? `Selected all ${availableEligibleCount} available unique question(s).` : 'Please import and verify questions in the Central Question Bank first.'}`
      : '';

    return {
      questions: selectedQuestions,
      requestedCount,
      selectedCount: selectedQuestions.length,
      availableEligibleCount,
      insufficient,
      warningMessage
    };
  }

  function generateHighYieldBilingualQuestions(prefix, topic, count, customPrompt, extraFilters) {
    const selectionResult = selectEligibleQuestionsForTest(Object.assign({
      testId: prefix,
      topic,
      count,
      customPrompt
    }, extraFilters || {}));
    return selectionResult.questions;
  }

  function parseBulkQuestionsText(text, fileName) {
    try {
      if (fileName.toLowerCase().endsWith('.json') || text.trim().startsWith('[') || text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        const arr = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        return arr.map((item, idx) => ({
          id: 'imp_' + Date.now() + '_' + idx,
          subjectTag: item.subjectTag || 'General Studies',
          questionHi: item.questionHi || item.question || 'प्रश्न ' + (idx + 1),
          questionEn: item.questionEn || item.question || 'Question ' + (idx + 1),
          optionsHi: Array.isArray(item.optionsHi) && item.optionsHi.length === 4 ? item.optionsHi : ['A', 'B', 'C', 'D'],
          optionsEn: Array.isArray(item.optionsEn) && item.optionsEn.length === 4 ? item.optionsEn : ['A', 'B', 'C', 'D'],
          correctOptionIndex: Number(item.correctOptionIndex || 0),
          explanationHi: item.explanationHi || '',
          explanationEn: item.explanationEn || ''
        }));
      }
      // CSV parsing
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const out = [];
      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (i === 0 && cols[0].toLowerCase().includes('question')) continue;
        if (cols.length >= 6) {
          out.push({
            id: 'csv_' + Date.now() + '_' + i,
            questionHi: cols[0],
            questionEn: cols[1] || cols[0],
            optionsHi: [cols[2] || 'A', cols[3] || 'B', cols[4] || 'C', cols[5] || 'D'],
            optionsEn: [cols[6] || cols[2] || 'A', cols[7] || cols[3] || 'B', cols[8] || cols[4] || 'C', cols[9] || cols[5] || 'D'],
            correctOptionIndex: Math.max(0, Math.min(3, Number(cols[10] || 0))),
            explanationHi: cols[11] || '',
            explanationEn: cols[12] || cols[11] || '',
            subjectTag: cols[13] || 'General Studies'
          });
        }
      }
      return out;
    } catch (_) {
      return [];
    }
  }

  async function launchCustomCurrentAffairsQuiz(opts) {
    const options = opts || {};
    const scopeType = options.scopeType || 'recent';
    const nowDate = new Date();
    const defaultMonthKey = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
    const monthKey = options.monthKey || defaultMonthKey;
    const yearKey = options.yearKey || String(nowDate.getFullYear());
    const questionCount = Math.max(5, Math.min(100, Number(options.questionCount || 10)));
    const durationMinutes = Math.max(3, Math.min(180, Number(options.durationMinutes || 12)));
    const btnEl = options.buttonEl || null;

    const allStories = (state.stories || []).slice().sort((a, b) => {
      const ta = Number(a.createdAtMs || (a.createdAtIso ? Date.parse(a.createdAtIso) : 0) || 0);
      const tb = Number(b.createdAtMs || (b.createdAtIso ? Date.parse(b.createdAtIso) : 0) || 0);
      return tb - ta;
    });

    let targetStories = [];
    let scopeLabelHi = 'हालिया समसामयिकी (Recent Current Affairs)';
    let scopeLabelEn = 'Recent Current Affairs Quiz';

    if (scopeType === 'monthly') {
      targetStories = allStories.filter((st) => getStoryMonthKey(st) === monthKey);
      scopeLabelHi = `मासिक समसामयिकी क्विज़ — ${formatMonthKeyDisplay(monthKey)}`;
      scopeLabelEn = `Monthly Current Affairs Quiz (${monthKey})`;
    } else if (scopeType === 'yearly') {
      targetStories = allStories.filter((st) => getStoryYearKey(st) === yearKey);
      scopeLabelHi = `वार्षिक समसामयिकी क्विज़ — वर्ष ${yearKey}`;
      scopeLabelEn = `Yearly Current Affairs Quiz (${yearKey})`;
    } else {
      const nowMs = Date.now();
      targetStories = allStories.filter((s) => {
        const createdMs = Number(s.createdAtMs || (s.createdAtIso ? Date.parse(s.createdAtIso) : 0) || 0);
        return createdMs > 0 && (nowMs - createdMs) <= 86400000;
      });
      if (targetStories.length === 0) {
        targetStories = allStories.slice(0, 12);
      }
    }

    const prevText = btnEl ? btnEl.textContent : '';
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = '⏳ Preparing Current Affairs Questions...';
    } else {
      toast('⏳ करंट अफेयर्स प्रश्न तैयार किए जा रहे हैं...');
    }

    let generatedQs = [];
    try {
      if (window.CGpediaAdmin && typeof window.CGpediaAdmin.generateCurrentAffairsQuizQuestionsWithAi === 'function') {
        generatedQs = await window.CGpediaAdmin.generateCurrentAffairsQuizQuestionsWithAi({
          stories: targetStories,
          scopeType,
          monthKey,
          yearKey,
          questionCount,
          stateRef: state,
          apiRef: publicApi
        });
      }
    } catch (_) {}

    if (btnEl) {
      btnEl.disabled = false;
      btnEl.textContent = prevText || '🎯 Start Current Affairs Quiz';
    }

    if (!Array.isArray(generatedQs) || generatedQs.length === 0) {
      // Build fresh randomized questions from selected stories if offline or fallback needed
      if (targetStories.length > 0) {
        const shuffledStories = targetStories.slice().sort(() => Math.random() - 0.5);
        generatedQs = [];
        for (let i = 0; i < questionCount; i++) {
          const st = shuffledStories[i % shuffledStories.length];
          const other1 = shuffledStories[(i + 1) % shuffledStories.length];
          const other2 = shuffledStories[(i + 2) % shuffledStories.length];
          const headHi = st.headlineHi || st.titleHi || 'समसामयिकी अपडेट';
          const headEn = st.headlineEn || st.titleEn || 'Current Affairs Update';
          const sumHi = st.summaryHi || headHi;
          const sumEn = st.summaryEn || headEn;
          const correctPos = i % 4;
          const distractorsHi = [
            (other1 && other1 !== st && other1.summaryHi) ? other1.summaryHi.slice(0, 150) : 'यह योजना केवल निजी औद्योगिक इकाइयों के लिए सीमित है',
            (other2 && other2 !== st && other2.summaryHi) ? other2.summaryHi.slice(0, 150) : 'इसे वर्ष 2014 में समाप्त कर दिया गया था',
            'उपर्युक्त में से कोई नहीं'
          ];
          const distractorsEn = [
            (other1 && other1 !== st && other1.summaryEn) ? other1.summaryEn.slice(0, 150) : 'This initiative is restricted exclusively to private corporations',
            (other2 && other2 !== st && other2.summaryEn) ? other2.summaryEn.slice(0, 150) : 'It was discontinued in 2014',
            'None of the above'
          ];
          const optsHi = [...distractorsHi];
          const optsEn = [...distractorsEn];
          optsHi.splice(correctPos, 0, sumHi.slice(0, 150));
          optsEn.splice(correctPos, 0, sumEn.slice(0, 150));
          generatedQs.push({
            id: `ca_story_q_${Date.now()}_${i}`,
            subjectId: 'sub_current_affairs',
            subjectTag: 'Current Affairs',
            monthKey: st.monthKey || monthKey,
            questionHi: `हालिया समसामयिकी के संदर्भ में "${headHi}" के विषय में कौन-सा कथन सही है?`,
            questionEn: `With reference to recent current affairs regarding "${headEn}", which statement is correct?`,
            optionsHi: optsHi.slice(0, 4),
            optionsEn: optsEn.slice(0, 4),
            correctOptionIndex: correctPos,
            explanationHi: `${headHi}: ${sumHi}`,
            explanationEn: `${headEn}: ${sumEn}`
          });
        }
        if (window.CGpediaAdmin && typeof window.CGpediaAdmin.saveGeneratedCaQuestionsToQuestionBank === 'function') {
          window.CGpediaAdmin.saveGeneratedCaQuestionsToQuestionBank(generatedQs, state, publicApi, monthKey).catch(() => {});
        }
      } else {
        generatedQs = generateHighYieldBilingualQuestions('daily_ca_' + Date.now(), 'Current Affairs & Chhattisgarh GS', questionCount, '');
      }
    }

    window.CGpediaCBT.openPreTestInstructions({
      id: `ca_quiz_${scopeType}_${Date.now()}`,
      examCode: 'CURRENT AFFAIRS',
      titleHi: scopeLabelHi,
      titleEn: scopeLabelEn,
      topic: 'Chhattisgarh, National & International Current Affairs',
      durationMinutes,
      marksPerQuestion: 2,
      negativeMarking: 0.66
    }, generatedQs.slice(0, questionCount), cbtCallbacks);
  }

  function launchInstantDailyQuiz() {
    launchCustomCurrentAffairsQuiz({
      scopeType: 'recent',
      questionCount: 10,
      durationMinutes: 12
    });
  }

  let activeStoryTimerId = null;

  function getCaLangMode() {
    if (state && state.student && (state.student.caLangMode === 'en' || state.student.caLangMode === 'hi')) {
      return state.student.caLangMode;
    }
    if (state && (state.caLangMode === 'en' || state.caLangMode === 'hi')) {
      return state.caLangMode;
    }
    return 'hi';
  }

  function setCaLangMode(nextMode) {
    const mode = nextMode === 'en' ? 'en' : 'hi';
    state.caLangMode = mode;
    if (state.student) {
      state.student.caLangMode = mode;
    }
    saveState();
    if (window.CGpediaCloud && state.student && state.student.uid) {
      window.CGpediaCloud.saveCloudDoc('users', state.student.uid, {
        userId: state.student.uid,
        caLangMode: mode,
        seenStoryIds: Array.from(getSeenStoryIdsSet()),
        updatedAtIso: new Date().toISOString()
      }).catch(() => {});
    }
  }

  function getSeenStoriesStorageKey(uid) {
    const cleanUid = String(uid || (state && state.student && state.student.uid) || 'guest').trim();
    return `cgpedia_seen_stories_v2_${cleanUid}`;
  }

  function loadSeenStoriesFromLocal(uid) {
    try {
      const raw = localStorage.getItem(getSeenStoriesStorageKey(uid));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
    } catch (_) {
      return [];
    }
  }

  function saveSeenStoriesToLocal(uid, list) {
    try {
      const unique = Array.from(new Set((Array.isArray(list) ? list : []).map((id) => String(id))));
      localStorage.setItem(getSeenStoriesStorageKey(uid), JSON.stringify(unique));
    } catch (_) {}
  }

  function getSeenStoryIdsSet() {
    const uid = (state && state.student && state.student.uid) || 'guest';
    const fromStudent = (state && state.student && Array.isArray(state.student.seenStoryIds))
      ? state.student.seenStoryIds
      : [];
    const fromState = (state && Array.isArray(state.seenStoryIds))
      ? state.seenStoryIds
      : [];
    const fromLocal = loadSeenStoriesFromLocal(uid);
    return new Set([...fromStudent, ...fromState, ...fromLocal].filter(Boolean).map((id) => String(id)));
  }

  function isStorySeenByStudent(storyId) {
    if (!storyId) return false;
    return getSeenStoryIdsSet().has(String(storyId));
  }

  function markStorySeenByStudent(storyId) {
    if (!storyId) return;
    const sid = String(storyId);
    const set = getSeenStoryIdsSet();
    if (set.has(sid)) return;
    set.add(sid);
    const updatedArr = Array.from(set);
    state.seenStoryIds = updatedArr;
    if (state.student) {
      state.student.seenStoryIds = updatedArr;
    }
    const uid = (state && state.student && state.student.uid) || 'guest';
    saveSeenStoriesToLocal(uid, updatedArr);
    saveState();

    // Persist story viewing progress per student in Firebase across devices and sessions
    if (window.CGpediaCloud && state.student && state.student.uid) {
      window.CGpediaCloud.saveCloudDoc('users', state.student.uid, {
        userId: state.student.uid,
        seenStoryIds: updatedArr,
        caLangMode: getCaLangMode(),
        updatedAtIso: new Date().toISOString()
      }).catch(() => {});
    }
  }

  function normalizeStoryCategory(rawCat, fallbackText) {
    const c = String(rawCat || '').trim().toLowerCase();
    if (c === 'chhattisgarh' || c.includes('chhattisgarh') || c === 'cg') return 'chhattisgarh';
    if (c === 'national' || c.includes('national') || c.includes('india') || c.includes('pib')) return 'national';
    if (c === 'international' || c.includes('international') || c.includes('world') || c.includes('global')) return 'international';
    const text = String(fallbackText || '').toLowerCase();
    if (/छत्तीसगढ़|रायपुर|बस्तर|बिलासपुर|सरगुजा|chhattisgarh|raipur|bastar|surguja/.test(text)) return 'chhattisgarh';
    if (/विश्व|अंतर्राष्ट्रीय|संयुक्त राष्ट्र|world|international|global|un |unesco|cop-|spadex|docking/.test(text)) return 'international';
    return 'national';
  }

  function getStoryCategoryLabel(cat, lang) {
    const norm = normalizeStoryCategory(cat);
    const isHi = (lang || getCaLangMode()) === 'hi';
    if (norm === 'chhattisgarh') return isHi ? 'छत्तीसगढ़' : 'Chhattisgarh';
    if (norm === 'national') return isHi ? 'राष्ट्रीय' : 'National';
    return isHi ? 'अंतर्राष्ट्रीय' : 'International';
  }

  function getStoryLocalizedHeadline(st, lang) {
    if (!st) return '';
    const isHi = (lang || getCaLangMode()) === 'hi';
    const hi = String(st.headlineHi || st.titleHi || '').trim();
    const en = String(st.headlineEn || st.titleEn || '').trim();
    return isHi ? (hi || en) : (en || hi);
  }

  function getStoryLocalizedSummary(st, lang) {
    if (!st) return '';
    const isHi = (lang || getCaLangMode()) === 'hi';
    const hi = String(st.summaryHi || '').trim();
    const en = String(st.summaryEn || '').trim();
    return isHi ? (hi || en) : (en || hi);
  }

  function getStoryTimestampMs(st) {
    if (!st) return 0;
    const ms = Number(st.createdAtMs || (st.createdAtIso ? Date.parse(st.createdAtIso) : 0) || 0);
    return Number.isFinite(ms) && ms > 0 ? ms : 0;
  }

  function sortStoriesLatestFirst(list) {
    return (Array.isArray(list) ? list.slice() : []).sort((a, b) => {
      return getStoryTimestampMs(b) - getStoryTimestampMs(a);
    });
  }

  function sortStoriesOldestToNewest(list) {
    return (Array.isArray(list) ? list.slice() : []).sort((a, b) => {
      return getStoryTimestampMs(a) - getStoryTimestampMs(b);
    });
  }

  function normalizeTextTokensForDedup(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function computeStoryTextSimilarity(a, b) {
    const na = normalizeTextTokensForDedup(a);
    const nb = normalizeTextTokensForDedup(b);
    if (!na || !nb) return 0;
    if (na === nb) return 1;
    const setA = new Set(na.split(' ').filter((w) => w.length > 2));
    const setB = new Set(nb.split(' ').filter((w) => w.length > 2));
    if (setA.size === 0 || setB.size === 0) return 0;
    let inter = 0;
    setA.forEach((w) => {
      if (setB.has(w)) inter += 1;
    });
    const union = setA.size + setB.size - inter;
    return union > 0 ? inter / union : 0;
  }

  // Unified, deduplicated Current Affairs & Daily Dose content database
  function getCanonicalCurrentAffairsList() {
    const rawList = Array.isArray(state.stories) ? state.stories : [];
    const nowMs = Date.now();
    const nowDate = new Date(nowMs);
    const currentMonthKey = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
    const currentYearKey = String(nowDate.getFullYear());

    // Ensure baseline verified items across Chhattisgarh, National, and International exist if empty
    const baselineVerifiedItems = [
      {
        id: 'ca_verified_cg_ind_policy',
        category: 'chhattisgarh',
        headlineHi: 'छत्तीसगढ़ औद्योगिक विकास नीति 2024-30: बस्तर एवं सरगुजा में विशेष निवेश प्रोत्साहन',
        headlineEn: 'Chhattisgarh Industrial Development Policy 2024-30: Special Investment Incentives in Bastar & Surguja',
        summaryHi: 'राज्य सरकार ने नई औद्योगिक नीति 2024-30 के अंतर्गत अनुसूचित क्षेत्रों, बस्तर और सरगुजा संभाग में एमएसएमई, कृषि प्रसंस्करण एवं हरित उद्योग स्थापित करने पर अतिरिक्त पूंजी अनुदान तथा स्टाम्प शुल्क छूट का प्रावधान किया है।',
        summaryEn: 'Under the Industrial Policy 2024-30, Chhattisgarh provides enhanced capital subsidies and stamp duty exemptions for MSMEs, agro-processing, and green industries in Bastar and Surguja divisions.',
        sourceName: 'DPR Chhattisgarh',
        sourceUrl: 'https://dprcg.gov.in',
        createdAtMs: nowMs - 7200000
      },
      {
        id: 'ca_verified_nat_vidyalaxmi',
        category: 'national',
        headlineHi: 'पीएम विद्यालक्ष्मी योजना: मेधावी छात्रों को उच्च शिक्षा हेतु बिना गारंटी 10 लाख रुपये तक शिक्षा ऋण',
        headlineEn: 'PM Vidyalaxmi Scheme: Collateral-Free Education Loans up to ₹10 Lakh for Meritorious Students',
        summaryHi: 'केंद्रीय मंत्रिमंडल द्वारा स्वीकृत पीएम विद्यालक्ष्मी योजना के अंतर्गत देश के शीर्ष 860 उच्च शिक्षण संस्थानों (NIRF रैंकिंग आधारित) में प्रवेश लेने वाले छात्रों को बिना किसी जमानत या गारंटर के शिक्षा ऋण तथा 3% ब्याज अनुदान प्रदान किया जा रहा है।',
        summaryEn: 'Approved by the Union Cabinet, PM Vidyalaxmi provides collateral-free, guarantor-free education loans with 3% interest subvention for students admitted to top 860 NIRF-ranked institutions.',
        sourceName: 'PIB India',
        sourceUrl: 'https://pib.gov.in',
        createdAtMs: nowMs - 5400000
      },
      {
        id: 'ca_verified_int_spadex',
        category: 'international',
        headlineHi: 'इसरो (ISRO) स्पैडेक्स (SpaDeX) मिशन: अंतरिक्ष में डॉकिंग तकनीक सिद्ध करने वाला भारत चौथा देश बना',
        headlineEn: 'ISRO SpaDeX Mission: India Becomes 4th Country to Demonstrate In-Space Autonomous Docking',
        summaryHi: 'भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) ने PSLV-C60 द्वारा प्रक्षेपित SpaDeX (SDX01 चेज़र और SDX02 टारगेट) उपग्रहों की सफल अंतरिक्ष डॉकिंग पूर्ण की, जिससे अमेरिका, रूस और चीन के बाद भारत विश्व का चौथा देश बन गया है।',
        summaryEn: 'ISRO successfully executed autonomous orbital docking with the SpaDeX satellites (SDX01 and SDX02) launched aboard PSLV-C60, making India the 4th nation globally after the US, Russia, and China.',
        sourceName: 'ISRO / Global Space Desk',
        sourceUrl: 'https://www.isro.gov.in',
        createdAtMs: nowMs - 3600000
      }
    ];

    const combinedInput = rawList.length > 0 ? rawList.slice() : baselineVerifiedItems;
    // Also ensure International category has at least 1 verified item if missing
    const hasInt = combinedInput.some((s) => s && normalizeStoryCategory(s.category, `${s.headlineHi || ''} ${s.headlineEn || ''}`) === 'international');
    if (!hasInt) {
      combinedInput.push(baselineVerifiedItems[2]);
    }
    const hasNat = combinedInput.some((s) => s && normalizeStoryCategory(s.category, `${s.headlineHi || ''} ${s.headlineEn || ''}`) === 'national');
    if (!hasNat) {
      combinedInput.push(baselineVerifiedItems[1]);
    }
    const hasCg = combinedInput.some((s) => s && normalizeStoryCategory(s.category, `${s.headlineHi || ''} ${s.headlineEn || ''}`) === 'chhattisgarh');
    if (!hasCg) {
      combinedInput.push(baselineVerifiedItems[0]);
    }

    const deduplicated = [];
    const seenIds = new Set();

    combinedInput.forEach((raw, idx) => {
      if (!raw || typeof raw !== 'object') return;
      if (raw.isDeleted === true || raw.status === 'deleted') return;
      const headHi = String(raw.headlineHi || raw.titleHi || raw.headlineEn || raw.titleEn || '').trim();
      const headEn = String(raw.headlineEn || raw.titleEn || headHi).trim();
      const sumHi = String(raw.summaryHi || headHi).trim();
      const sumEn = String(raw.summaryEn || sumHi).trim();
      if (!headHi && !headEn) return;

      const id = String(raw.id || (`ca_${nowMs}_${idx}`)).trim();
      if (seenIds.has(id)) return;

      // Prevent duplicate copies of the same news via similarity check
      const isDup = deduplicated.some((ex) => {
        const simHi = computeStoryTextSimilarity(headHi, ex.headlineHi || ex.titleHi || '');
        const simEn = computeStoryTextSimilarity(headEn, ex.headlineEn || ex.titleEn || '');
        return simHi >= 0.68 || simEn >= 0.68;
      });
      if (isDup) return;

      seenIds.add(id);
      const ts = getStoryTimestampMs(raw) || (nowMs - (idx * 60000));
      const d = new Date(ts);
      const derivedMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      // Align monthKey with current month if the item is recent (within 48h) so Daily Dose and Current Affairs counts always match
      const monthKey = (nowMs - ts) <= 172800000
        ? currentMonthKey
        : (/^\d{4}-\d{2}$/.test(String(raw.monthKey || '')) ? String(raw.monthKey) : derivedMonth);
      const yearKey = monthKey.slice(0, 4) || currentYearKey;
      const cat = normalizeStoryCategory(raw.category, `${headHi} ${headEn} ${sumHi}`);
      const defaultSourceUrl = cat === 'chhattisgarh'
        ? 'https://dprcg.gov.in'
        : (cat === 'national' ? 'https://pib.gov.in' : 'https://news.un.org');
      const rawImg = String(raw.imageUrl || '').trim();
      const isAiImg = raw.isAiGeneratedImage !== undefined
        ? Boolean(raw.isAiGeneratedImage)
        : (!rawImg || rawImg.startsWith('data:image/svg+xml'));

      const normalizedItem = Object.assign({}, raw, {
        id,
        category: cat,
        titleHi: headHi,
        titleEn: headEn,
        headlineHi: headHi,
        headlineEn: headEn,
        summaryHi: sumHi,
        summaryEn: sumEn,
        sourceName: String(raw.sourceName || (cat === 'chhattisgarh' ? 'DPR Chhattisgarh' : (cat === 'national' ? 'PIB India' : 'Global Official Desk'))).trim(),
        sourceUrl: String(raw.sourceUrl || defaultSourceUrl).trim(),
        createdAtMs: ts,
        createdAtIso: raw.createdAtIso || new Date(ts).toISOString(),
        publishedDateIso: raw.publishedDateIso || raw.dateIso || new Date(ts).toISOString().slice(0, 10),
        monthKey,
        yearKey,
        isAiGeneratedImage: isAiImg
      });
      normalizedItem.imageUrl = getStoryImageUrl(normalizedItem);
      deduplicated.push(normalizedItem);
    });

    state.stories = deduplicated;
    return deduplicated;
  }

  function getActiveDailyDoseStories() {
    const all = getCanonicalCurrentAffairsList();
    const nowDate = new Date();
    const currentMonthKey = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthItems = all.filter((s) => getStoryMonthKey(s) === currentMonthKey);
    return currentMonthItems.length > 0 ? currentMonthItems : all;
  }

  function formatStoryUploadTimeShort(st) {
    const ms = getStoryTimestampMs(st);
    if (!ms) return 'Just now';
    const d = new Date(ms);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  function formatStoryUploadTimeFull(st) {
    const ms = getStoryTimestampMs(st);
    const isHi = getCaLangMode() === 'hi';
    if (!ms) return isHi ? 'हाल ही में प्रकाशित' : 'Uploaded recently';
    const d = new Date(ms);
    const now = new Date();
    const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    const timeStr = d.toLocaleTimeString(isHi ? 'hi-IN' : 'en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = isToday
      ? `${isHi ? 'आज' : 'Today'}, ${timeStr}`
      : `${d.toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })}, ${timeStr}`;
    const diffMin = Math.max(1, Math.floor((Date.now() - ms) / 60000));
    const relStr = diffMin < 60
      ? `${diffMin}m ago`
      : (diffMin < 1440 ? `${Math.floor(diffMin / 60)}h ago` : `${Math.floor(diffMin / 1440)}d ago`);
    return `${dateStr} • ${relStr}`;
  }

  function isStoryImageAiGenerated(st) {
    if (!st) return true;
    if (st.isAiGeneratedImage === false) return false;
    if (st.isAiGeneratedImage === true) return true;
    const url = String(st.imageUrl || '').trim();
    return !url || url.startsWith('data:image/svg+xml');
  }

  function getStoryImageUrl(st) {
    if (!st) return '';
    if (st.imageUrl && String(st.imageUrl).trim() && !String(st.imageUrl).startsWith('data:image/svg+xml')) {
      return String(st.imageUrl).trim();
    }
    if (st.imageUrl && String(st.imageUrl).startsWith('data:image/svg+xml') && String(st.imageUrl).includes('AI Generated Image')) {
      st.isAiGeneratedImage = true;
      return String(st.imageUrl);
    }
    if (window.CGpediaAdmin && typeof window.CGpediaAdmin.generateAutoStoryImageUrl === 'function') {
      const generated = window.CGpediaAdmin.generateAutoStoryImageUrl(st);
      if (generated) {
        st.imageUrl = generated;
        st.isAiGeneratedImage = true;
        return generated;
      }
    }
    const cat = normalizeStoryCategory(st.category);
    const palette = cat === 'chhattisgarh'
      ? { bg1: '#064E3B', bg2: '#047857', accent: '#34D399', badge: 'CHHATTISGARH CURRENT AFFAIRS', icon: '🌾' }
      : cat === 'national'
        ? { bg1: '#1E3A8A', bg2: '#1D4ED8', accent: '#FBBF24', badge: 'NATIONAL CURRENT AFFAIRS', icon: '🇮🇳' }
        : { bg1: '#311042', bg2: '#6D28D9', accent: '#38BDF8', badge: 'INTERNATIONAL CURRENT AFFAIRS', icon: '🌍' };
    const headline = String(st.headlineEn || st.titleEn || st.headlineHi || st.titleHi || 'Daily Current Affairs').replace(/[<>&"']/g, ' ').slice(0, 72);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" width="800" height="420">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.bg1}"/>
          <stop offset="100%" stop-color="${palette.bg2}"/>
        </linearGradient>
      </defs>
      <rect width="800" height="420" rx="22" fill="url(#g)"/>
      <circle cx="700" cy="80" r="130" fill="${palette.accent}" opacity="0.14"/>
      <circle cx="100" cy="360" r="160" fill="#ffffff" opacity="0.06"/>
      <rect x="38" y="34" width="320" height="38" rx="19" fill="rgba(255,255,255,0.16)"/>
      <text x="56" y="59" fill="#ffffff" font-family="sans-serif" font-size="15" font-weight="bold">${palette.icon} ${palette.badge}</text>
      <rect x="556" y="34" width="206" height="36" rx="18" fill="rgba(15,23,42,0.75)"/>
      <text x="659" y="57" text-anchor="middle" fill="#FDE68A" font-family="sans-serif" font-size="14" font-weight="bold">✨ AI Generated Image</text>
      <text x="42" y="195" fill="#ffffff" font-family="sans-serif" font-size="27" font-weight="bold">${headline}</text>
      <text x="42" y="370" fill="${palette.accent}" font-family="sans-serif" font-size="16" font-weight="bold">⚡ AI Generated Image • Exam Fact</text>
    </svg>`;
    const url = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    st.imageUrl = url;
    st.isAiGeneratedImage = true;
    return url;
  }

  // Group stories into the 3 categories ordered Oldest -> Newest (chronological order)
  function groupStoriesByCategoryCircles(stories) {
    const chronological = sortStoriesOldestToNewest(stories || []);
    const lang = getCaLangMode();
    const isHi = lang === 'hi';
    const categoriesMeta = [
      { category: 'chhattisgarh', labelEn: 'Chhattisgarh', labelHi: 'छत्तीसगढ़', icon: '🌾' },
      { category: 'national', labelEn: 'National', labelHi: 'राष्ट्रीय', icon: '🇮🇳' },
      { category: 'international', labelEn: 'International', labelHi: 'अंतर्राष्ट्रीय', icon: '🌍' }
    ];
    return categoriesMeta.map((meta) => {
      const catStories = chronological.filter((st) => normalizeStoryCategory(st.category) === meta.category);
      const seenCount = catStories.filter((st) => isStorySeenByStudent(st.id)).length;
      const unseenCount = catStories.length - seenCount;
      const firstUnseenIdx = catStories.findIndex((st) => !isStorySeenByStudent(st.id));
      return {
        ...meta,
        displayLabel: isHi ? meta.labelHi : meta.labelEn,
        stories: catStories,
        seenCount,
        unseenCount,
        firstUnseenIndex: firstUnseenIdx !== -1 ? firstUnseenIdx : 0
      };
    }).filter((grp) => grp.stories.length > 0);
  }

  // Build WhatsApp-style segmented SVG ring indicating seen (grey) vs unseen (emerald green) stories
  function buildWhatsAppStoryRingSvg(storiesInCategory) {
    const list = Array.isArray(storiesInCategory) ? storiesInCategory : [];
    const total = list.length;
    const size = 74;
    const r = 33.5;
    const c = size / 2;
    const circumference = 2 * Math.PI * r;

    if (total <= 1) {
      const seen = total === 1 && isStorySeenByStudent(list[0].id);
      const color = seen ? '#94A3B8' : '#10B981';
      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="position:absolute;inset:0;transform:rotate(-90deg);pointer-events:none;">
        <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round" />
      </svg>`;
    }

    const gapLen = Math.min(7, circumference / (total * 3.2));
    const segLen = Math.max(4, (circumference / total) - gapLen);

    const segmentsSvg = list.map((st, idx) => {
      const seen = isStorySeenByStudent(st.id);
      const strokeColor = seen ? '#94A3B8' : '#10B981';
      const offset = -(idx * (segLen + gapLen));
      return `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${strokeColor}" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="${segLen.toFixed(2)} ${(circumference - segLen).toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" />`;
    }).join('');

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="position:absolute;inset:0;transform:rotate(-90deg);pointer-events:none;">
      ${segmentsSvg}
    </svg>`;
  }

  function renderDailyDoseStoryStripHtml(storiesList, prefix) {
    const lang = getCaLangMode();
    const isHi = lang === 'hi';
    const groupedCategories = groupStoriesByCategoryCircles(storiesList);
    const totalStories = (storiesList || []).length;
    const totalSeen = (storiesList || []).filter((s) => isStorySeenByStudent(s.id)).length;
    const totalUnseen = Math.max(0, totalStories - totalSeen);

    return `
      <div class="card" style="margin-bottom:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <h2 style="font-size:1.04rem;font-weight:800;margin:0;">Daily Dose</h2>
            <span style="font-size:0.73rem;font-weight:700;padding:2px 9px;border-radius:99px;background:var(--surface-alt);border:1px solid var(--border);color:var(--text-secondary);">
              ${isHi
                ? `अनदेखे: ${totalUnseen} • देखे गए: ${totalSeen}`
                : `Unseen: ${totalUnseen} • Seen: ${totalSeen}`}
            </span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <div style="display:inline-flex;border-radius:99px;border:1px solid var(--border-strong);overflow:hidden;background:var(--surface-alt);">
              <button type="button" data-strip-lang="${prefix}" data-lang-val="hi" style="padding:4px 10px;font-size:0.73rem;font-weight:800;border:none;cursor:pointer;background:${isHi ? 'var(--secondary)' : 'transparent'};color:${isHi ? '#fff' : 'var(--text)'};">हिंदी</button>
              <button type="button" data-strip-lang="${prefix}" data-lang-val="en" style="padding:4px 10px;font-size:0.73rem;font-weight:800;border:none;cursor:pointer;background:${!isHi ? 'var(--secondary)' : 'transparent'};color:${!isHi ? '#fff' : 'var(--text)'};">English</button>
            </div>
            ${isCurrentUserAdmin() ? `<button class="btn btn-outline btn-sm" id="${prefix}AdminPostStoryBtn">➕ Post Story</button>` : ''}
          </div>
        </div>
        ${groupedCategories.length === 0 ? `
          <div style="font-size:0.83rem;color:var(--text-muted);padding:6px 0;">
            ${isHi ? 'अभी कोई सक्रिय करंट अफेयर्स स्टोरी उपलब्ध नहीं है।' : 'No active Current Affairs stories available right now.'}
          </div>
        ` : `
          <div class="stories-strip" style="gap:22px;padding:6px 4px;">
            ${groupedCategories.map((catGroup) => {
              const targetPreviewStory = catGroup.stories[catGroup.firstUnseenIndex] || catGroup.stories[catGroup.stories.length - 1];
              const thumbUrl = getStoryImageUrl(targetPreviewStory);
              const ringSvg = buildWhatsAppStoryRingSvg(catGroup.stories);
              const statusText = catGroup.unseenCount > 0
                ? (isHi ? `● ${catGroup.unseenCount} अनदेखे` : `● ${catGroup.unseenCount} Unseen`)
                : (isHi ? '✓ सभी देखे गए' : '✓ All Seen');
              const statusColor = catGroup.unseenCount > 0 ? '#059669' : 'var(--text-muted)';
              return `
                <div class="story-item" data-open-whatsapp-cat="${esc(catGroup.category)}" data-strip-prefix="${esc(prefix)}" style="min-width:92px;cursor:pointer;display:flex;flex-direction:column;align-items:center;">
                  <div style="position:relative;width:74px;height:74px;display:flex;align-items:center;justify-content:center;">
                    ${ringSvg}
                    <div style="width:62px;height:62px;border-radius:50%;overflow:hidden;position:relative;background:#0F2557;display:flex;align-items:center;justify-content:center;">
                      ${thumbUrl ? `<img src="${esc(thumbUrl)}" alt="${esc(catGroup.displayLabel)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" />` : `<span style="font-size:1.55rem;">${catGroup.icon}</span>`}
                      <span style="position:absolute;inset:0;background:rgba(8,15,38,0.28);display:flex;align-items:center;justify-content:center;font-size:1.25rem;text-shadow:0 2px 6px rgba(0,0,0,0.65);">${catGroup.icon}</span>
                    </div>
                  </div>
                  <span class="story-caption" style="font-weight:800;font-size:0.79rem;margin-top:6px;color:var(--text);">${esc(catGroup.displayLabel)}</span>
                  <span style="font-size:0.68rem;font-weight:700;color:${statusColor};line-height:1.2;margin-top:2px;">${esc(statusText)}</span>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  function bindDailyDoseStoryStripEvents(containerEl, storiesList, prefix) {
    if (!containerEl) return;
    const groupedByCat = groupStoriesByCategoryCircles(storiesList);
    containerEl.querySelectorAll(`[data-open-whatsapp-cat][data-strip-prefix="${prefix}"]`).forEach((item) => {
      item.onclick = () => {
        const catKey = item.getAttribute('data-open-whatsapp-cat');
        const foundGroup = groupedByCat.find((g) => g.category === catKey);
        if (foundGroup && foundGroup.stories.length > 0) {
          // Open stories in chronological order (oldest -> newest) starting directly from the first unseen story
          openStoryViewerModal(foundGroup.firstUnseenIndex, foundGroup.stories, { autoStartUnseen: true });
        }
      };
    });

    containerEl.querySelectorAll(`[data-strip-lang="${prefix}"]`).forEach((btn) => {
      btn.onclick = () => {
        const nextLang = btn.getAttribute('data-lang-val');
        setCaLangMode(nextLang);
        renderApp();
      };
    });

    const postBtn = document.getElementById(`${prefix}AdminPostStoryBtn`);
    if (postBtn) {
      postBtn.onclick = () => openQuickAdminPostStoryModal();
    }
  }

  function openStoryViewerModal(storyOrIndex, optionalStoryList, viewerOpts) {
    const storyRoot = document.getElementById('storyModalContainer');
    if (!storyRoot) return;

    if (activeStoryTimerId) {
      clearInterval(activeStoryTimerId);
      activeStoryTimerId = null;
    }

    const opts = viewerOpts || {};
    const defaultList = sortStoriesOldestToNewest(getActiveDailyDoseStories());

    const rawList = Array.isArray(optionalStoryList) && optionalStoryList.length > 0
      ? optionalStoryList
      : (typeof storyOrIndex === 'object' && storyOrIndex ? [storyOrIndex] : defaultList);

    // Always display stories in chronological order: Oldest to Newest within their sequence
    const targetStoryObj = typeof storyOrIndex === 'number' && rawList[storyOrIndex]
      ? rawList[storyOrIndex]
      : (typeof storyOrIndex === 'object' ? storyOrIndex : null);
    const storiesList = sortStoriesOldestToNewest(rawList);

    if (!storiesList.length) return;

    let currentIndex = 0;
    if (opts.autoStartUnseen !== false && typeof storyOrIndex === 'number') {
      const firstUnseenIdx = storiesList.findIndex((s) => !isStorySeenByStudent(s.id));
      currentIndex = firstUnseenIdx !== -1 ? firstUnseenIdx : 0;
    } else if (targetStoryObj && targetStoryObj.id) {
      const matchedIdx = storiesList.findIndex((s) => s.id === targetStoryObj.id);
      if (matchedIdx !== -1) currentIndex = matchedIdx;
    } else {
      const firstUnseenIdx = storiesList.findIndex((s) => !isStorySeenByStudent(s.id));
      currentIndex = firstUnseenIdx !== -1 ? firstUnseenIdx : 0;
    }

    let progressPct = 0;
    let isPaused = false;
    const STORY_DURATION_MS = 8000;
    const TICK_MS = 80;

    function closeViewer() {
      if (activeStoryTimerId) {
        clearInterval(activeStoryTimerId);
        activeStoryTimerId = null;
      }
      storyRoot.innerHTML = '';
      // Refresh underlying strip so seen/unseen ring indicators update immediately
      renderApp();
    }

    function renderCurrentStorySlide(preserveProgress) {
      const storyObj = storiesList[currentIndex];
      if (!storyObj) {
        closeViewer();
        return;
      }
      if (!preserveProgress) {
        // Mark current story as seen in local state + Firebase Cloud
        markStorySeenByStudent(storyObj.id);
      }

      const lang = getCaLangMode();
      const isHi = lang === 'hi';
      const normCat = normalizeStoryCategory(storyObj.category);
      const catIcon = normCat === 'chhattisgarh' ? '🌾' : normCat === 'national' ? '🇮🇳' : '🌍';
      const catName = getStoryCategoryLabel(normCat, lang);
      const adminUser = isCurrentUserAdmin();
      const imageUrl = getStoryImageUrl(storyObj);
      const isAiImg = isStoryImageAiGenerated(storyObj);
      const uploadTimeFormatted = formatStoryUploadTimeFull(storyObj);
      const headlineText = getStoryLocalizedHeadline(storyObj, lang);
      const summaryText = getStoryLocalizedSummary(storyObj, lang);

      const seenCountInSeq = storiesList.filter((s) => isStorySeenByStudent(s.id)).length;
      const unseenCountInSeq = Math.max(0, storiesList.length - seenCountInSeq);

      storyRoot.innerHTML = `
        <div class="modal-backdrop" id="instaStoryBackdrop" style="position:fixed;inset:0;width:100vw;height:100dvh;background:#040918;padding:0;margin:0;z-index:9999;display:flex;align-items:stretch;justify-content:center;">
          <div style="width:100vw;height:100dvh;max-width:100vw;max-height:100dvh;background:linear-gradient(165deg,#07122E 0%,#0F2557 52%,#1B1440 100%);color:#fff;border-radius:0;border:none;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;user-select:none;">

            <!-- Top Segmented WhatsApp-Style Story Progress Bars -->
            <div style="padding:max(14px, env(safe-area-inset-top, 14px)) 16px 10px 16px;background:linear-gradient(180deg,rgba(4,9,24,0.88) 0%,rgba(4,9,24,0) 100%);z-index:4;">
              <div style="display:flex;gap:5px;margin-bottom:12px;">
                ${storiesList.map((stItem, idx) => {
                  const fill = idx < currentIndex ? 100 : (idx === currentIndex ? progressPct : 0);
                  const isItemSeen = isStorySeenByStudent(stItem.id);
                  const trackBg = isItemSeen ? 'rgba(148,163,184,0.38)' : 'rgba(16,185,129,0.35)';
                  const barBg = idx === currentIndex ? '#10B981' : (isItemSeen ? '#E2E8F0' : '#10B981');
                  return `
                    <div style="flex:1;height:4px;background:${trackBg};border-radius:99px;overflow:hidden;">
                      <div id="instaStoryProgBar_${idx}" style="width:${fill}%;height:100%;background:${barBg};border-radius:99px;transition:width 0.08s linear;"></div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Story Category Header + Seen/Unseen Indicator + Language Switch + Admin Controls -->
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                  <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(45deg,#10B981,#059669);padding:2.5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <div style="width:100%;height:100%;border-radius:50%;background:#0F2557;display:flex;align-items:center;justify-content:center;font-size:1.15rem;">${catIcon}</div>
                  </div>
                  <div style="min-width:0;">
                    <div style="font-size:0.92rem;font-weight:800;line-height:1.2;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span>${esc(catName)}</span>
                      <span style="font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:99px;background:rgba(16,185,129,0.22);color:#6EE7B7;">
                        ${isHi ? `देखे: ${seenCountInSeq} • अनदेखे: ${unseenCountInSeq}` : `Seen: ${seenCountInSeq} • Unseen: ${unseenCountInSeq}`}
                      </span>
                    </div>
                    <div style="font-size:0.73rem;color:#BFDBFE;margin-top:2px;">🕒 ${esc(uploadTimeFormatted)}</div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                  <!-- Language Switch inside Story Viewer (Preserves Progress) -->
                  <div style="display:inline-flex;border-radius:99px;border:1px solid rgba(255,255,255,0.28);overflow:hidden;background:rgba(15,23,42,0.65);">
                    <button type="button" data-story-viewer-lang="hi" style="padding:4px 9px;font-size:0.72rem;font-weight:800;border:none;cursor:pointer;background:${isHi ? '#EA580C' : 'transparent'};color:#fff;">हिंदी</button>
                    <button type="button" data-story-viewer-lang="en" style="padding:4px 9px;font-size:0.72rem;font-weight:800;border:none;cursor:pointer;background:${!isHi ? '#EA580C' : 'transparent'};color:#fff;">English</button>
                  </div>
                  ${adminUser ? `
                    <button type="button" class="btn btn-header-chip" id="instaAdminPostStoryBtn" title="Post New Story" style="padding:5px 10px;font-size:0.74rem;background:rgba(37,99,235,0.9);color:#fff;">➕ Post</button>
                    <button type="button" class="btn btn-header-chip" id="instaAdminDeleteStoryBtn" title="Delete This Story" style="padding:5px 10px;font-size:0.74rem;background:rgba(220,38,38,0.9);color:#fff;">🗑️ Delete</button>
                  ` : ''}
                  <button type="button" class="btn btn-header-chip" id="closeStoryModalBtn" style="padding:5px 12px;font-size:0.9rem;background:rgba(255,255,255,0.16);color:#fff;">✕</button>
                </div>
              </div>
            </div>

            <!-- Full-Screen Story Body (Single Language Only + Relevant Image / AI Generated Image Label) -->
            <div id="instaStoryContentArea" style="flex:1;width:100%;max-width:680px;margin:0 auto;padding:10px 20px 18px 20px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow-y:auto;cursor:pointer;">
              ${imageUrl ? `
                <div style="position:relative;width:100%;max-height:245px;border-radius:16px;overflow:hidden;margin-bottom:14px;border:1px solid rgba(255,255,255,0.18);box-shadow:0 12px 30px rgba(0,0,0,0.4);background:#091534;flex-shrink:0;">
                  <img src="${esc(imageUrl)}" alt="${esc(headlineText)}" style="width:100%;height:215px;object-fit:cover;display:block;" />
                  ${isAiImg ? `
                    <span style="position:absolute;top:10px;right:10px;background:rgba(15,23,42,0.88);color:#FDE68A;border:1px solid rgba(253,230,138,0.5);font-size:0.72rem;font-weight:800;padding:4px 10px;border-radius:99px;backdrop-filter:blur(4px);">
                      ✨ AI Generated Image
                    </span>
                  ` : ''}
                </div>
              ` : ''}

              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                <span class="badge" style="background:rgba(234,88,12,0.95);color:#fff;font-size:0.72rem;padding:4px 11px;border-radius:99px;">
                  ${catIcon} ${esc(catName)}
                </span>
                <span style="font-size:0.74rem;color:#93C5FD;font-weight:600;">
                  ${isHi ? 'स्रोत' : 'Source'}: ${esc(storyObj.sourceName || 'Official PIB / DPR')}
                </span>
              </div>

              <h2 style="font-size:1.28rem;font-weight:800;line-height:1.42;margin-bottom:12px;color:#FFFFFF;">
                ${esc(headlineText)}
              </h2>

              <div style="padding:15px 17px;border-radius:16px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.16);backdrop-filter:blur(8px);">
                <p style="font-size:0.96rem;line-height:1.68;color:#F8FAFC;margin:0;">
                  ${esc(summaryText)}
                </p>
              </div>
            </div>

            <!-- Story Footer Navigation Hint Only (Quiz Button Removed as Requested) -->
            <div style="padding:12px 18px max(18px, env(safe-area-inset-bottom, 18px)) 18px;background:rgba(4,9,24,0.82);border-top:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:4;">
              <span style="font-size:0.74rem;color:#93C5FD;">
                ${isHi ? 'बाएं/दाएं टैप कर स्टोरी बदलें • रोकने के लिए दबाए रखें' : 'Tap left/right to navigate • Hold to pause'}
              </span>
              ${storyObj.sourceUrl ? `
                <a href="${esc(storyObj.sourceUrl)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" style="font-size:0.74rem;color:#6EE7B7;font-weight:700;text-decoration:none;">
                  🔗 ${isHi ? 'आधिकारिक स्रोत' : 'Official Source'} ↗
                </a>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      const closeBtn = document.getElementById('closeStoryModalBtn');
      if (closeBtn) closeBtn.onclick = closeViewer;

      // Language switch inside Story Viewer preserves currentIndex & progressPct
      storyRoot.querySelectorAll('[data-story-viewer-lang]').forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const nextLang = btn.getAttribute('data-story-viewer-lang');
          setCaLangMode(nextLang);
          renderCurrentStorySlide(true);
        };
      });

      const postBtn = document.getElementById('instaAdminPostStoryBtn');
      if (postBtn && adminUser) {
        postBtn.onclick = (e) => {
          e.stopPropagation();
          closeViewer();
          openQuickAdminPostStoryModal();
        };
      }

      const delBtn = document.getElementById('instaAdminDeleteStoryBtn');
      if (delBtn && adminUser) {
        delBtn.onclick = (e) => {
          e.stopPropagation();
          isPaused = true;
          confirmUserAction({
            title: 'Delete Current Affairs Story?',
            message: `क्या आप वाकई इस करंट अफेयर्स स्टोरी ("${headlineText || storyObj.id}") को हटाना चाहते हैं?`,
            confirmText: '🗑️ Yes, Delete Story',
            cancelText: 'Cancel'
          }, async () => {
            const delId = storyObj.id;
            state.stories = (state.stories || []).filter((s) => s.id !== delId);
            const idxInViewer = storiesList.findIndex((s) => s.id === delId);
            if (idxInViewer !== -1) storiesList.splice(idxInViewer, 1);
            saveState(true);
            if (window.CGpediaCloud && typeof window.CGpediaCloud.deleteCloudDoc === 'function') {
              await window.CGpediaCloud.deleteCloudDoc('current_affairs', delId);
            }
            toast('🗑️ Current Affairs Story deleted.');
            if (storiesList.length === 0) {
              closeViewer();
            } else {
              currentIndex = Math.min(currentIndex, storiesList.length - 1);
              progressPct = 0;
              isPaused = false;
              renderCurrentStorySlide();
            }
          });
        };
      }

      const contentArea = document.getElementById('instaStoryContentArea');
      if (contentArea) {
        let holdStartMs = 0;
        contentArea.onmousedown = () => {
          holdStartMs = Date.now();
          isPaused = true;
        };
        contentArea.onmouseup = () => {
          isPaused = false;
        };
        contentArea.onmouseleave = () => {
          isPaused = false;
        };
        contentArea.ontouchstart = () => {
          holdStartMs = Date.now();
          isPaused = true;
        };
        contentArea.ontouchend = () => {
          isPaused = false;
        };
        contentArea.onclick = (e) => {
          if (holdStartMs && (Date.now() - holdStartMs) > 280) {
            holdStartMs = 0;
            return;
          }
          holdStartMs = 0;
          const rect = contentArea.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          if (clickX < rect.width * 0.35) {
            if (currentIndex > 0) {
              currentIndex -= 1;
              progressPct = 0;
              renderCurrentStorySlide();
            }
          } else {
            if (currentIndex < storiesList.length - 1) {
              currentIndex += 1;
              progressPct = 0;
              renderCurrentStorySlide();
            } else {
              closeViewer();
            }
          }
        };
      }
    }

    renderCurrentStorySlide();

    activeStoryTimerId = setInterval(() => {
      if (isPaused) return;
      progressPct += (TICK_MS / STORY_DURATION_MS) * 100;
      const activeBar = document.getElementById(`instaStoryProgBar_${currentIndex}`);
      if (activeBar) {
        activeBar.style.width = `${Math.min(100, progressPct)}%`;
      }
      if (progressPct >= 100) {
        if (currentIndex < storiesList.length - 1) {
          currentIndex += 1;
          progressPct = 0;
          renderCurrentStorySlide();
        } else {
          closeViewer();
        }
      }
    }, TICK_MS);
  }

  function openQuickAdminPostStoryModal() {
    if (!isCurrentUserAdmin()) return;
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;
    let uploadedImageDataUrl = '';
    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="quickAdminStoryModalBackdrop">
        <div class="modal-card" style="max-width:560px;width:100%;max-height:92vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;">
            <div>
              <span class="badge badge-exam">🛡️ ADMIN DAILY DOSE PUBLISHER</span>
              <h2 style="font-size:1.1rem;font-weight:800;margin-top:4px;">➕ Post Daily Dose Story</h2>
            </div>
            <button type="button" class="btn btn-outline btn-sm" id="closeQuickAdminStoryModalBtn">✕</button>
          </div>

          <div style="padding:10px 12px;border-radius:10px;background:var(--secondary-soft);margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <span style="font-size:0.78rem;color:var(--text);">Want to generate stories from Topic, News Text, or PDF/Image with Google AI?</span>
            <button type="button" class="btn btn-navy btn-sm" id="openFullAiCaStudioBtn">⚡ Open AI Current Affairs Studio</button>
          </div>

          <div class="form-group">
            <label class="form-label">Category Circle (Chhattisgarh / National / International)</label>
            <select class="form-select" id="quickStoryCatInput">
              <option value="chhattisgarh">🌾 Chhattisgarh</option>
              <option value="national">🇮🇳 National</option>
              <option value="international">🌍 International</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Headline (Hindi) *</label>
            <input class="form-input" id="quickStoryHeadlineHi" placeholder="उदा. छत्तीसगढ़ आर्थिक सर्वेक्षण 2025-26 के प्रमुख बिंदु" />
          </div>
          <div class="form-group">
            <label class="form-label">Headline (English)</label>
            <input class="form-input" id="quickStoryHeadlineEn" placeholder="e.g. Key Highlights of Chhattisgarh Economic Survey 2025-26" />
          </div>
          <div class="form-group">
            <label class="form-label">Key Exam Points / Summary (Hindi) *</label>
            <textarea class="form-textarea" id="quickStorySummaryHi" rows="3" placeholder="परीक्षा उपयोगी मुख्य तथ्य यहाँ लिखें..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Key Exam Points / Summary (English)</label>
            <textarea class="form-textarea" id="quickStorySummaryEn" rows="2" placeholder="Exam-relevant key facts in English..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">🖼️ Attach Story Image (Optional — Gemini AI generates &amp; labels "AI Generated Image" if blank)</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
              <input type="file" accept="image/*" class="form-input" id="quickStoryImageFileInput" style="flex:1;min-width:190px;padding:6px;" />
              <input type="url" class="form-input" id="quickStoryImageUrlInput" placeholder="Or paste Original Photo URL (https://...)" style="flex:1;min-width:190px;" />
            </div>
            <div id="quickStoryImagePreviewWrap" style="display:none;margin-top:8px;">
              <img id="quickStoryImagePreviewEl" src="" alt="Preview" style="max-height:110px;border-radius:10px;border:1px solid var(--border);" />
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;">
            <button type="button" class="btn btn-outline" id="cancelQuickAdminStoryBtn">Cancel</button>
            <button type="button" class="btn btn-primary" id="publishQuickAdminStoryBtn">🚀 Publish Story Now</button>
          </div>
        </div>
      </div>
    `;

    const closeModal = () => { modalRoot.innerHTML = ''; };
    document.getElementById('closeQuickAdminStoryModalBtn').onclick = closeModal;
    document.getElementById('cancelQuickAdminStoryBtn').onclick = closeModal;
    document.getElementById('openFullAiCaStudioBtn').onclick = () => {
      closeModal();
      navigateToTab('admin', 'stories');
    };

    const fileInput = document.getElementById('quickStoryImageFileInput');
    const urlInput = document.getElementById('quickStoryImageUrlInput');
    const previewWrap = document.getElementById('quickStoryImagePreviewWrap');
    const previewImg = document.getElementById('quickStoryImagePreviewEl');

    if (fileInput) {
      fileInput.onchange = () => {
        const f = fileInput.files && fileInput.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          uploadedImageDataUrl = String(reader.result || '');
          if (previewImg && previewWrap && uploadedImageDataUrl) {
            previewImg.src = uploadedImageDataUrl;
            previewWrap.style.display = 'block';
          }
        };
        reader.readAsDataURL(f);
      };
    }
    if (urlInput) {
      urlInput.oninput = () => {
        const val = (urlInput.value || '').trim();
        if (val && previewImg && previewWrap) {
          previewImg.src = val;
          previewWrap.style.display = 'block';
        }
      };
    }

    document.getElementById('publishQuickAdminStoryBtn').onclick = async () => {
      const cat = normalizeStoryCategory(document.getElementById('quickStoryCatInput').value || 'chhattisgarh');
      const headHi = (document.getElementById('quickStoryHeadlineHi').value || '').trim();
      const headEn = (document.getElementById('quickStoryHeadlineEn').value || '').trim() || headHi;
      const sumHi = (document.getElementById('quickStorySummaryHi').value || '').trim();
      const sumEn = (document.getElementById('quickStorySummaryEn').value || '').trim() || sumHi;
      const customImgUrl = (urlInput && urlInput.value ? urlInput.value.trim() : '') || uploadedImageDataUrl;
      if (!headHi || !sumHi) {
        toast('⚠️ कृपया स्टोरी का शीर्षक (Headline) और मुख्य बिंदु (Summary) दर्ज करें।');
        return;
      }
      // Prevent duplicate story creation
      const existingAll = getCanonicalCurrentAffairsList();
      if (existingAll.some((ex) => computeStoryTextSimilarity(headHi, ex.headlineHi) >= 0.68 || computeStoryTextSimilarity(headEn, ex.headlineEn) >= 0.68)) {
        toast('⚠️ यह करंट अफेयर्स पहले से प्रकाशित है (Duplicate prevented).');
        return;
      }
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const hasAuthenticCustomPhoto = Boolean(customImgUrl && !customImgUrl.startsWith('data:image/svg+xml'));
      const newStory = {
        id: 'ca_' + now.getTime(),
        category: cat,
        titleHi: headHi,
        titleEn: headEn,
        headlineHi: headHi,
        headlineEn: headEn,
        summaryHi: sumHi,
        summaryEn: sumEn,
        sourceName: 'Official Admin Desk',
        sourceUrl: cat === 'chhattisgarh' ? 'https://dprcg.gov.in' : (cat === 'national' ? 'https://pib.gov.in' : 'https://news.un.org'),
        createdAtIso: now.toISOString(),
        publishedDateIso: now.toISOString().slice(0, 10),
        createdAtMs: now.getTime(),
        expiresAtMs: now.getTime() + 86400000,
        monthKey,
        yearKey: String(now.getFullYear()),
        isAiGeneratedImage: !hasAuthenticCustomPhoto
      };
      newStory.imageUrl = hasAuthenticCustomPhoto ? customImgUrl : getStoryImageUrl(newStory);
      state.stories = [newStory, ...existingAll];
      saveState(true);
      if (window.CGpediaCloud && typeof window.CGpediaCloud.saveCloudDoc === 'function') {
        await window.CGpediaCloud.saveCloudDoc('current_affairs', newStory.id, newStory);
      }
      closeModal();
      renderApp();
      toast('✅ Daily Dose & Current Affairs Story published live!');
    };
  }

  function bindTestCardButtons(containerEl) {
    containerEl.querySelectorAll('[data-start-test]').forEach((btn) => {
      btn.onclick = () => {
        const tid = btn.getAttribute('data-start-test');
        const testObj = (state.tests || []).find((t) => t.id === tid);
        if (!testObj) return;
        const qs = (testObj.questions && testObj.questions.length > 0)
          ? testObj.questions
          : generateHighYieldBilingualQuestions(testObj.id, testObj.topic || 'General Studies', 10, '');
        window.CGpediaCBT.openPreTestInstructions(testObj, qs, cbtCallbacks);
      };
    });

    containerEl.querySelectorAll('[data-view-test-result]').forEach((btn) => {
      btn.onclick = () => {
        const tid = btn.getAttribute('data-view-test-result');
        const found = (state.attempts || []).find((a) => a.testId === tid);
        if (found) state.activeResultId = found.id;
        state.activeTab = 'analytics';
        saveState();
        renderApp();
      };
    });

    containerEl.querySelectorAll('[data-unlock-paid-item]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-unlock-paid-item');
        const type = btn.getAttribute('data-unlock-type') || 'test';
        openStudentPaymentModal(id, type);
      };
    });
  }

  // =========================================================================
  // CBT Callbacks (Submission, Bookmarks, Question Error Reports, Leaderboard)
  // =========================================================================
  const cbtCallbacks = {
    toast,
    isBookmarked: (qid) => (state.bookmarks || []).some((b) => b.id === qid),
    toggleBookmark: (qObj, testId, testTitle) => {
      state.bookmarks = state.bookmarks || [];
      const exists = state.bookmarks.some((b) => b.id === qObj.id);
      if (exists) {
        state.bookmarks = state.bookmarks.filter((b) => b.id !== qObj.id);
        toast('🏷️ Removed from Bookmarks.');
      } else {
        state.bookmarks.unshift(Object.assign({}, qObj, {
          testId,
          testTitle,
          userId: state.student.uid
        }));
        toast('🔖 Question saved to Bookmarks for quick revision!');
      }
      saveState();
      if (window.CGpediaCloud && state.student.uid) {
        window.CGpediaCloud.saveCloudDoc('users', state.student.uid, {
          userId: state.student.uid,
          bookmarks: state.bookmarks
        });
      }
    },
    reportQuestionError: (qObj, testId, testTitle) => {
      const rep = {
        id: 'rep_' + Date.now(),
        userId: state.student.uid,
        testId,
        testTitle,
        questionId: qObj.id,
        questionHi: qObj.questionHi,
        studentEmail: state.student.email || state.student.uid,
        reason: 'Reported during CBT attempt for Admin verification',
        createdAtIso: new Date().toISOString()
      };
      state.questionReports = state.questionReports || [];
      state.questionReports.unshift(rep);
      saveState();
      if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('question_reports', rep.id, rep);
      toast('🚩 Question flagged for Admin review.');
    },
    onExamCompleted: (resultRecord, wrongQuestions) => {
      const taggedResult = Object.assign({}, resultRecord, {
        userId: state.student.uid,
        studentEmail: state.student.email || '',
        studentName: state.student.name || 'Aspirant'
      });
      state.attempts = state.attempts || [];
      state.attempts.unshift(taggedResult);
      state.activeResultId = taggedResult.id;

      // Automatically populate Mistake Notebook with any wrong questions for this student
      if (Array.isArray(wrongQuestions) && wrongQuestions.length > 0) {
        state.mistakes = state.mistakes || [];
        wrongQuestions.forEach((wq) => {
          if (!state.mistakes.some((m) => m.questionHi === wq.questionHi)) {
            state.mistakes.unshift(Object.assign({}, wq, { userId: state.student.uid }));
          }
        });
      }

      // Update Leaderboard if public
      if (state.student.leaderboardPublic !== false) {
        const lbEntry = {
          id: 'lb_' + state.student.uid + '_' + taggedResult.testId,
          userId: state.student.uid,
          studentName: state.student.name,
          testId: taggedResult.testId,
          testTitle: taggedResult.testTitleHi,
          score: taggedResult.score,
          maxScore: taggedResult.maxScore,
          accuracyPercent: taggedResult.accuracyPercent,
          timeTakenSeconds: taggedResult.timeTakenSeconds,
          submittedAtIso: taggedResult.submittedAtIso
        };
        state.leaderboard = (state.leaderboard || []).filter((e) => e.id !== lbEntry.id);
        state.leaderboard.push(lbEntry);
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('leaderboard', lbEntry.id, lbEntry);
      }

      saveState();
      if (window.CGpediaCloud) {
        window.CGpediaCloud.saveCloudDoc('results', taggedResult.id, taggedResult);
        if (state.student.uid) {
          window.CGpediaCloud.saveCloudDoc('users', state.student.uid, {
            userId: state.student.uid,
            displayName: state.student.name,
            email: state.student.email,
            bookmarks: state.bookmarks || [],
            mistakes: state.mistakes || []
          });
        }
      }
      applyBrandingAndSecurity();
      state.activeTab = 'analytics';
      renderApp();
      toast(`🎉 Exam submitted! Net Score: ${taggedResult.score} / ${taggedResult.maxScore} (${taggedResult.accuracyPercent}% Accuracy)`);
    }
  };

  // =========================================================================
  // Cloud Sync Merge & Auth Handlers
  // =========================================================================
  function handleFirebaseAuthUser(fbUser) {
    authStateCheckComplete = true;
    // Do NOT auto-login if the student intentionally logged out
    if (!fbUser || (state.authSession && state.authSession.intentionalLogout === true)) {
      renderApp();
      return;
    }
    const incomingUid = String(fbUser.uid || '').trim();
    const incomingEmail = String(fbUser.email || '').trim().toLowerCase();
    if (incomingUid && incomingEmail && (!isStudentAuthenticated() || state.student.uid !== incomingUid)) {
      activateStudentAccountSession({
        uid: incomingUid,
        name: fbUser.displayName || state.student.name || incomingEmail.split('@')[0] || 'Aspirant',
        email: incomingEmail,
        phone: fbUser.phoneNumber || state.student.phone || ''
      });
      return;
    }
    if (fbUser.displayName && (!state.student.name || state.student.name === 'Aspirant')) {
      state.student.name = fbUser.displayName;
    }
    if (incomingEmail) {
      state.student.email = incomingEmail;
    }
    if (incomingUid) {
      state.student.uid = incomingUid;
    }
    saveState();
    renderApp();
  }

  let cloudGlobalConfigSynced = false;
  let adminInitialAutoSyncTriggered = false;
  const syncedLocalCollectionKeys = new Set();

  function getCollectionNameForStateKey(key) {
    const map = {
      examMaster: 'exams',
      subjectMaster: 'subjects',
      topicMaster: 'topics',
      subtopicMaster: 'subtopics',
      folders: 'exam_folders',
      tests: 'tests',
      questionBank: 'question_bank',
      stories: 'current_affairs',
      notifications: 'broadcast_notifications',
      upcomingTests: 'upcoming_tests',
      coupons: 'coupons',
      activations: 'purchases',
      orders: 'orders',
      leaderboard: 'leaderboard',
      queries: 'student_queries',
      questionReports: 'question_reports',
      adminStaff: 'admin_staff',
      registeredStudents: 'users'
    };
    return map[key] || '';
  }

  async function syncLocalAdminStateToCloud(showNotification) {
    if (!window.CGpediaCloud || typeof window.CGpediaCloud.syncAllAdminStateToCloud !== 'function') {
      return { synced: 0 };
    }
    const res = await window.CGpediaCloud.syncAllAdminStateToCloud(state);
    if (showNotification) {
      toast('☁️ All Admin Tests, Question Bank & Settings synced to Cloud!');
    }
    return res;
  }

  function mergeCloudCollection(key, docs, colNameArg) {
    if (!Array.isArray(docs)) return;
    const colName = colNameArg || getCollectionNameForStateKey(key);
    const adminMode = isCurrentUserAdmin();

    if (key === 'configDocs') {
      const globalDoc = docs.find((d) => d.id === 'global' || d.configKey === 'global');
      if (globalDoc) {
        cloudGlobalConfigSynced = true;
        const cloudTs = globalDoc.updatedAtIso ? Date.parse(globalDoc.updatedAtIso) : 0;
        const localTs = (state.config && state.config.updatedAtIso) ? Date.parse(state.config.updatedAtIso) : 0;
        if (!adminMode || !localTs || cloudTs >= localTs) {
          state.config = Object.assign({}, state.config, globalDoc);
          if (globalDoc.whatsappSupportNumber && !globalDoc.whatsappNumber) {
            state.config.whatsappNumber = globalDoc.whatsappSupportNumber;
          }
        } else if (adminMode && localTs > cloudTs && window.CGpediaCloud && window.CGpediaCloud.saveCloudDoc) {
          window.CGpediaCloud.saveCloudDoc('app_config', 'global', Object.assign({ id: 'global', configKey: 'global' }, state.config));
        }
      } else if (adminMode && state.config && window.CGpediaCloud && window.CGpediaCloud.saveCloudDoc) {
        window.CGpediaCloud.saveCloudDoc('app_config', 'global', Object.assign({ id: 'global', configKey: 'global' }, state.config));
      }

      const taxDoc = docs.find((d) => d.id === 'taxonomy' || d.configKey === 'taxonomy');
      if (taxDoc) {
        state.customTaxonomy = Object.assign({ customCategories: [], customSubjects: [] }, state.customTaxonomy || {}, taxDoc);
      } else if (adminMode && state.customTaxonomy && window.CGpediaCloud && window.CGpediaCloud.saveCloudDoc) {
        window.CGpediaCloud.saveCloudDoc('app_config', 'taxonomy', Object.assign({ id: 'taxonomy', configKey: 'taxonomy' }, state.customTaxonomy));
      }
      saveState();
      applyBrandingAndSecurity();
      renderApp();
      return;
    }

    const activeCloudDocs = docs.filter((d) => d && d.id && d.isDeleted !== true && d.status !== 'deleted');

    if (adminMode) {
      const isDeletedFn = (window.CGpediaCloud && typeof window.CGpediaCloud.isDocDeletedLocally === 'function')
        ? window.CGpediaCloud.isDocDeletedLocally
        : () => false;

      const localArr = Array.isArray(state[key])
        ? state[key].filter((item) => item && item.id && !isDeletedFn(colName, item.id))
        : [];

      const mergedMap = new Map();
      const cloudIds = new Set();
      activeCloudDocs.forEach((cDoc) => {
        if (!isDeletedFn(colName, cDoc.id)) {
          mergedMap.set(String(cDoc.id), cDoc);
          cloudIds.add(String(cDoc.id));
        }
      });

      const toPushToCloud = [];
      const cloudHasDocs = activeCloudDocs.length > 0;

      localArr.forEach((lDoc) => {
        const lid = String(lDoc.id);
        if (!mergedMap.has(lid)) {
          // If Cloud is empty on initial load, push all local Admin items to Cloud.
          // If Cloud already has documents, only push local items that have admin timestamps/metadata
          // (so untouched default seed items on a second Admin device don't overwrite Cloud).
          const isAuthoredOrEmptyCloud = !cloudHasDocs || Boolean(lDoc.updatedAtIso || lDoc.createdAtIso || lDoc.updatedByAdminEmail);
          if (isAuthoredOrEmptyCloud) {
            mergedMap.set(lid, lDoc);
            toPushToCloud.push(lDoc);
          }
        } else {
          const cDoc = mergedMap.get(lid);
          const cTime = cDoc.updatedAtIso ? Date.parse(cDoc.updatedAtIso) : 0;
          const lTime = lDoc.updatedAtIso ? Date.parse(lDoc.updatedAtIso) : 0;
          if (lTime > cTime) {
            mergedMap.set(lid, lDoc);
            toPushToCloud.push(lDoc);
          }
        }
      });

      state[key] = Array.from(mergedMap.values());

      if (toPushToCloud.length > 0 && colName && window.CGpediaCloud && window.CGpediaCloud.batchSaveCloudDocs && !syncedLocalCollectionKeys.has(key)) {
        syncedLocalCollectionKeys.add(key);
        window.CGpediaCloud.batchSaveCloudDocs(colName, toPushToCloud).catch(() => {});
      }
    } else {
      // Student mode: Cloud is authoritative when non-empty or once global config is synced
      if (activeCloudDocs.length > 0 || cloudGlobalConfigSynced || key === 'questionBank' || key === 'orders' || key === 'activations' || key === 'coupons' || key === 'registeredStudents') {
        state[key] = activeCloudDocs;
      }
    }

    if (key === 'stories') {
      getCanonicalCurrentAffairsList();
    }

    if (key === 'registeredStudents' && isStudentAuthenticated() && state.student && state.student.uid) {
      const myCloudDoc = activeCloudDocs.find((u) => String(u.id || u.userId) === String(state.student.uid));
      if (myCloudDoc) {
        if (Array.isArray(myCloudDoc.seenStoryIds) && myCloudDoc.seenStoryIds.length > 0) {
          const mergedSeen = new Set([
            ...Array.from(getSeenStoryIdsSet()),
            ...myCloudDoc.seenStoryIds.map((id) => String(id))
          ]);
          const nextArr = Array.from(mergedSeen);
          state.seenStoryIds = nextArr;
          state.student.seenStoryIds = nextArr;
          saveSeenStoriesToLocal(state.student.uid, nextArr);
        }
        if (myCloudDoc.caLangMode === 'hi' || myCloudDoc.caLangMode === 'en') {
          state.caLangMode = myCloudDoc.caLangMode;
          state.student.caLangMode = myCloudDoc.caLangMode;
        }
      }
    }

    if (key === 'tests' || key === 'notifications' || key === 'stories') {
      checkAndDispatchCloudUpdateNotifications(key, state[key] || activeCloudDocs);
    }

    saveState();
    applyBrandingAndSecurity();
    scheduleCloudRenderApp();
  }

  let cloudRenderScheduled = false;
  let cloudRenderTimerId = null;

  function scheduleCloudRenderApp() {
    if (cloudRenderTimerId) {
      clearTimeout(cloudRenderTimerId);
    }
    cloudRenderTimerId = setTimeout(() => {
      cloudRenderTimerId = null;
      if (cloudRenderScheduled) return;
      cloudRenderScheduled = true;
      const runRender = () => {
        cloudRenderScheduled = false;
        // Avoid wiping out an active text input/textarea while user is typing
        const activeEl = document.activeElement;
        const appRoot = document.getElementById('appRoot');
        if (activeEl && appRoot && appRoot.contains(activeEl)) {
          const tag = String(activeEl.tagName || '').toUpperCase();
          if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
            applyBrandingAndSecurity();
            return;
          }
        }
        renderApp();
      };
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(runRender);
      } else {
        runRender();
      }
    }, 90);
  }

  const NOTIFIED_ITEMS_STORAGE_KEY = 'cgpedia_notified_items_v1';
  const SEED_ITEM_IDS = new Set([
    'notif_seed_1',
    'story_seed_1',
    'story_seed_2',
    'test_cgpsc_pre_mock_1',
    'test_cgvyapam_hostel_1',
    'test_ssc_cgl_tier1_1'
  ]);

  function loadNotifiedItemsStore() {
    try {
      const raw = localStorage.getItem(NOTIFIED_ITEMS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          parsed.initializedKeys = parsed.initializedKeys || {};
          parsed.seenIds = parsed.seenIds || {};
          return parsed;
        }
      }
    } catch (_) {}
    return { initializedKeys: {}, seenIds: {} };
  }

  function saveNotifiedItemsStore(store) {
    try {
      localStorage.setItem(NOTIFIED_ITEMS_STORAGE_KEY, JSON.stringify(store));
    } catch (_) {}
  }

  function requestStudentNotificationPermissionImmediate() {
    if (!isStudentAuthenticated()) return;
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.requestNotificationPermission === 'function') {
        window.AndroidBridge.requestNotificationPermission();
      }
    } catch (_) {}
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            toast('🔔 Notifications enabled for Live Tests, Current Affairs & Announcements!');
          }
        }).catch(() => {});
      }
    } catch (_) {}
  }

  function sendSystemAndAppNotification(title, message, category, notifKey, targetTab) {
    const cleanTitle = String(title || 'CGpedia Update').trim();
    const cleanMsg = String(message || 'Tap to view the latest update in CGpedia.').trim();
    const cleanKey = String(notifKey || (category + '_' + Date.now()));

    // 1. Native Android Notification Bridge
    let sentViaAndroid = false;
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.postNotification === 'function') {
        window.AndroidBridge.postNotification(cleanTitle, cleanMsg, String(category || 'broadcast'), cleanKey);
        sentViaAndroid = true;
      }
    } catch (_) {}

    // 2. Web / PWA Service Worker or Browser Notification API
    if (!sentViaAndroid && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            if (reg && typeof reg.showNotification === 'function') {
              reg.showNotification(cleanTitle, {
                body: cleanMsg,
                icon: 'assets/icon-192.png',
                badge: 'assets/icon-192.png',
                tag: cleanKey,
                data: { tab: targetTab || 'dashboard' }
              });
            }
          }).catch(() => {});
        } else {
          new Notification(cleanTitle, {
            body: cleanMsg,
            icon: 'assets/icon-192.png',
            tag: cleanKey
          });
        }
      } catch (_) {}
    }

    // 3. In-App Toast Banner
    toast(`🔔 ${cleanTitle}: ${cleanMsg.slice(0, 90)}`);
  }

  function buildNotificationPayloadForItem(key, item) {
    if (!item || !item.id) return null;
    if (key === 'tests') {
      const title = '📝 नया टेस्ट उपलब्ध: ' + (item.titleHi || item.titleEn || 'New Mock Test');
      const examLabel = item.examCode ? `[${item.examCode}] ` : '';
      const msg = `${examLabel}${item.titleEn || item.titleHi || 'Live Test'} अब अटेम्प्ट करने के लिए उपलब्ध है।`;
      return { title, message: msg, category: 'tests', tab: 'test-series' };
    }
    if (key === 'notifications') {
      const title = '📢 ' + (item.titleHi || item.titleEn || 'CGpedia Official Update');
      const msg = item.messageHi || item.messageEn || item.titleEn || 'नया आधिकारिक अपडेट उपलब्ध है।';
      return { title, message: msg, category: 'broadcast', tab: 'notifications' };
    }
    if (key === 'stories') {
      const title = '⚡ समसामयिकी (Current Affairs): ' + (item.titleHi || item.headlineHi || item.titleEn || 'Daily Update');
      const msg = item.summaryHi || item.summaryEn || item.titleEn || 'नया समसामयिकी (Current Affairs) अपडेट पढ़ें।';
      return { title, message: msg, category: 'stories', tab: 'current-affairs' };
    }
    return null;
  }

  function checkAndDispatchCloudUpdateNotifications(key, docs) {
    if (!Array.isArray(docs)) return;
    const eligibleItems = key === 'tests'
      ? docs.filter((d) => d && d.id && d.status === 'published')
      : docs.filter((d) => d && d.id);

    const store = loadNotifiedItemsStore();
    const isFirstSyncForKey = !store.initializedKeys[key];

    if (isFirstSyncForKey) {
      let newestRecentItem = null;
      let newestTs = 0;
      const recentCutoffMs = Date.now() - (24 * 60 * 60 * 1000);

      eligibleItems.forEach((item) => {
        const compositeId = `${key}:${item.id}`;
        store.seenIds[compositeId] = Date.now();
        if (!SEED_ITEM_IDS.has(String(item.id))) {
          const itemTs = Date.parse(item.updatedAtIso || item.createdAtIso || '') || 0;
          if (itemTs >= recentCutoffMs && itemTs >= newestTs) {
            newestTs = itemTs;
            newestRecentItem = item;
          }
        }
      });

      store.initializedKeys[key] = true;
      saveNotifiedItemsStore(store);

      if (newestRecentItem && isStudentAuthenticated()) {
        const notifInfo = buildNotificationPayloadForItem(key, newestRecentItem);
        if (notifInfo) {
          sendSystemAndAppNotification(
            notifInfo.title,
            notifInfo.message,
            notifInfo.category,
            `${key}_${newestRecentItem.id}`,
            notifInfo.tab
          );
        }
      }
      return;
    }

    const newlyArrived = [];
    eligibleItems.forEach((item) => {
      const compositeId = `${key}:${item.id}`;
      if (!store.seenIds[compositeId]) {
        store.seenIds[compositeId] = Date.now();
        if (!SEED_ITEM_IDS.has(String(item.id))) {
          newlyArrived.push(item);
        }
      }
    });

    if (newlyArrived.length > 0) {
      saveNotifiedItemsStore(store);
      if (isStudentAuthenticated()) {
        newlyArrived.slice(0, 3).forEach((item) => {
          const notifInfo = buildNotificationPayloadForItem(key, item);
          if (notifInfo) {
            sendSystemAndAppNotification(
              notifInfo.title,
              notifInfo.message,
              notifInfo.category,
              `${key}_${item.id}`,
              notifInfo.tab
            );
          }
        });
      }
    }
  }

  function detectPhysicalLandscapeOrientation(explicitLandscapeFlag) {
    if (typeof explicitLandscapeFlag === 'boolean') {
      return explicitLandscapeFlag;
    }
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.isLandscapeOrientation === 'function') {
        return Boolean(window.AndroidBridge.isLandscapeOrientation());
      }
    } catch (_) {}
    try {
      if (window.screen && window.screen.orientation && typeof window.screen.orientation.type === 'string') {
        return window.screen.orientation.type.indexOf('landscape') !== -1;
      }
    } catch (_) {}
    if (typeof window.orientation === 'number') {
      return Math.abs(window.orientation) === 90;
    }
    if (window.screen && window.screen.availWidth && window.screen.availHeight) {
      return window.screen.availWidth > window.screen.availHeight;
    }
    return window.innerWidth > window.innerHeight;
  }

  function syncOrientationViewportMode(explicitLandscapeFlag) {
    const isLandscape = detectPhysicalLandscapeOrientation(explicitLandscapeFlag);
    const viewportMeta = document.getElementById('dynamicViewportMeta') || document.querySelector('meta[name="viewport"]');
    const htmlEl = document.documentElement;

    if (isLandscape) {
      const rawScreenW = Math.max(
        (window.screen && window.screen.availWidth) || 0,
        (window.screen && window.screen.width) || 0,
        window.outerWidth || 0
      );
      const scale = rawScreenW > 0 && rawScreenW < 1280
        ? Math.max(0.35, Math.min(1.0, Number((rawScreenW / 1280).toFixed(2))))
        : 1.0;
      if (viewportMeta) {
        viewportMeta.setAttribute(
          'content',
          `width=1280, initial-scale=${scale}, minimum-scale=0.25, maximum-scale=5.0, user-scalable=yes`
        );
      }
      if (htmlEl) {
        htmlEl.classList.add('landscape-desktop-mode');
      }
    } else {
      if (viewportMeta) {
        viewportMeta.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
        );
      }
      if (htmlEl) {
        htmlEl.classList.remove('landscape-desktop-mode');
      }
    }
  }

  window.__onNativeOrientationChange = function (isLandscape) {
    syncOrientationViewportMode(Boolean(isLandscape));
  };

  window.__onNativeNotificationPermissionResult = function (granted) {
    if (granted) {
      toast('🔔 Notifications enabled for Live Tests, Current Affairs & Announcements!');
    }
  };

  function isAnthemPublishedForStudents() {
    if (!state || !state.config || !state.config.anthemEnabled) return false;
    const ad = state.config.anthemData;
    if (!ad || !ad.published) return false;
    return Boolean(ad.downloadUrl || ad.storagePath);
  }

  function formatPlayerSeconds(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function stopSynthesizedAnthem() {
    synthAnthemPlaying = false;
    if (synthAnthemTimer) {
      clearTimeout(synthAnthemTimer);
      synthAnthemTimer = null;
    }
    if (synthAnthemCtx) {
      try { synthAnthemCtx.close(); } catch (_) {}
      synthAnthemCtx = null;
    }
  }

  function startSynthesizedAnthem(onEndedCallback) {
    stopSynthesizedAnthem();
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      synthAnthemCtx = new AudioContext();
      synthAnthemPlaying = true;
      const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 392.00, 329.63, 293.66, 261.63];
      let startTime = synthAnthemCtx.currentTime;
      const effectiveVol = studentAnthemMuted ? 0.0001 : Math.max(0.01, studentAnthemVolume * 0.22);
      notes.forEach((freq) => {
        const osc = synthAnthemCtx.createOscillator();
        const gain = synthAnthemCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(effectiveVol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.44);
        osc.connect(gain);
        gain.connect(synthAnthemCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.44);
        startTime += 0.46;
      });
      synthAnthemTimer = setTimeout(() => {
        stopSynthesizedAnthem();
        if (typeof onEndedCallback === 'function') onEndedCallback();
      }, notes.length * 460 + 120);
      return true;
    } catch (_) {
      return false;
    }
  }

  function closeAndStopStudentAnthemPlayer() {
    studentAnthemPlayerOpen = false;
    stopSynthesizedAnthem();
    if (studentAnthemAudioEl) {
      try { studentAnthemAudioEl.pause(); } catch (_) {}
    }
    const container = document.getElementById('studentAnthemFloatingPlayer');
    if (container) {
      container.style.display = 'none';
    }
    const anthemBtn = document.getElementById('anthemToggleBtn');
    if (anthemBtn) {
      anthemBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function syncStudentAnthemPlayerMeta() {
    const ad = (state.config && state.config.anthemData) || {};
    const titleEl = document.getElementById('stuAnthemPlayerTitle');
    const descEl = document.getElementById('stuAnthemPlayerDesc');
    if (titleEl) titleEl.textContent = ad.title || 'छत्तीसगढ़ राज्य गीत — अरपा पैरी के धार (Chhattisgarh State Anthem)';
    if (descEl) descEl.textContent = ad.description || 'रचयिता: डॉ. नरेन्द्र देव वर्मा • Official State Anthem of Chhattisgarh';
  }

  async function toggleStudentAnthemFloatingPlayer() {
    if (!isStudentAuthenticated() || !isAnthemPublishedForStudents()) {
      closeAndStopStudentAnthemPlayer();
      return;
    }

    const container = document.getElementById('studentAnthemFloatingPlayer');
    const anthemBtn = document.getElementById('anthemToggleBtn');
    if (!container) return;

    if (studentAnthemPlayerOpen) {
      closeAndStopStudentAnthemPlayer();
      return;
    }

    studentAnthemPlayerOpen = true;
    if (anthemBtn) anthemBtn.setAttribute('aria-expanded', 'true');

    const ad = (state.config && state.config.anthemData) || {};
    const hasUploadedPublishedAudio = isAnthemPublishedForStudents();
    const displayTitle = ad.title || 'छत्तीसगढ़ राज्य गीत — अरपा पैरी के धार (Chhattisgarh State Anthem)';
    const displayDesc = ad.description || 'रचयिता: डॉ. नरेन्द्र देव वर्मा • Official State Anthem of Chhattisgarh';

    container.style.display = 'block';
    container.innerHTML = `
      <div class="anthem-floating-card" oncontextmenu="return false;">
        <div class="anthem-floating-header">
          <div style="display:flex;align-items:center;gap:10px;min-width:0;">
            <div class="anthem-floating-icon">🎵</div>
            <div style="min-width:0;">
              <div class="anthem-floating-title" id="stuAnthemPlayerTitle">${esc(displayTitle)}</div>
              <div class="anthem-floating-desc" id="stuAnthemPlayerDesc">${esc(displayDesc)}</div>
            </div>
          </div>
          <button type="button" class="btn btn-outline btn-sm" id="stuAnthemCloseBtn" title="Close Anthem Player" aria-label="Close Anthem Player">✕</button>
        </div>

        <audio id="stuAnthemHiddenAudio" preload="metadata" controlsList="nodownload" style="display:none;"></audio>

        <div class="anthem-floating-controls">
          <button type="button" class="btn btn-primary btn-sm" id="stuAnthemPlayPauseBtn" style="min-width:98px;">
            ▶️ Play
          </button>

          <div class="anthem-floating-timeline">
            <input type="range" id="stuAnthemSeekSlider" min="0" max="100" value="0" step="0.1" aria-label="Anthem playback timeline" />
            <span id="stuAnthemTimeDisplay" class="anthem-floating-time">00:00 / 00:00</span>
          </div>

          <div class="anthem-floating-volume">
            <button type="button" class="btn btn-outline btn-sm" id="stuAnthemMuteBtn" title="Mute / Unmute" aria-label="Toggle Mute">
              ${studentAnthemMuted || studentAnthemVolume === 0 ? '🔇' : '🔊'}
            </button>
            <input type="range" id="stuAnthemVolumeSlider" min="0" max="100" value="${Math.round((studentAnthemMuted ? 0 : studentAnthemVolume) * 100)}" step="1" aria-label="Adjust Anthem volume" />
          </div>
        </div>
      </div>
    `;

    studentAnthemAudioEl = document.getElementById('stuAnthemHiddenAudio');
    const playPauseBtn = document.getElementById('stuAnthemPlayPauseBtn');
    const seekSlider = document.getElementById('stuAnthemSeekSlider');
    const timeDisplay = document.getElementById('stuAnthemTimeDisplay');
    const muteBtn = document.getElementById('stuAnthemMuteBtn');
    const volSlider = document.getElementById('stuAnthemVolumeSlider');
    const closeBtn = document.getElementById('stuAnthemCloseBtn');

    if (closeBtn) {
      closeBtn.onclick = () => closeAndStopStudentAnthemPlayer();
    }

    if (!studentAnthemAudioEl) return;

    studentAnthemAudioEl.volume = studentAnthemMuted ? 0 : studentAnthemVolume;
    studentAnthemAudioEl.muted = studentAnthemMuted;

    let resolvedUrl = '';
    if (hasUploadedPublishedAudio) {
      resolvedUrl = window.CGpediaCloud && window.CGpediaCloud.resolveAnthemPlaybackUrl
        ? await window.CGpediaCloud.resolveAnthemPlaybackUrl(ad)
        : (ad.downloadUrl || '');
      if (resolvedUrl) {
        studentAnthemAudioEl.src = resolvedUrl;
      }
    }

    if (playPauseBtn) {
      playPauseBtn.onclick = async () => {
        if (!isAnthemPublishedForStudents()) {
          closeAndStopStudentAnthemPlayer();
          return;
        }
        if (!studentAnthemAudioEl.src) {
          const freshUrl = window.CGpediaCloud && window.CGpediaCloud.resolveAnthemPlaybackUrl
            ? await window.CGpediaCloud.resolveAnthemPlaybackUrl(ad)
            : (ad.downloadUrl || '');
          if (freshUrl) studentAnthemAudioEl.src = freshUrl;
        }
        if (studentAnthemAudioEl.paused) {
          studentAnthemAudioEl.play().catch((err) => {
            toast('⚠️ Unable to play Anthem audio: ' + (err.message || 'Check connection'));
          });
        } else {
          studentAnthemAudioEl.pause();
        }
      };
    }

    studentAnthemAudioEl.onplay = () => {
      if (playPauseBtn) playPauseBtn.innerHTML = '⏸️ Pause';
    };
    studentAnthemAudioEl.onpause = () => {
      if (playPauseBtn) playPauseBtn.innerHTML = '▶️ Play';
    };
    studentAnthemAudioEl.onended = () => {
      if (playPauseBtn) playPauseBtn.innerHTML = '▶️ Play';
      if (seekSlider) seekSlider.value = '0';
    };
    studentAnthemAudioEl.onloadedmetadata = () => {
      if (timeDisplay) {
        timeDisplay.textContent = `00:00 / ${formatPlayerSeconds(studentAnthemAudioEl.duration)}`;
      }
    };
    studentAnthemAudioEl.ontimeupdate = () => {
      const dur = studentAnthemAudioEl.duration || 0;
      const cur = studentAnthemAudioEl.currentTime || 0;
      if (dur > 0 && seekSlider) {
        seekSlider.value = String(((cur / dur) * 100).toFixed(1));
      }
      if (timeDisplay) {
        timeDisplay.textContent = `${formatPlayerSeconds(cur)} / ${formatPlayerSeconds(dur)}`;
      }
    };

    if (seekSlider) {
      seekSlider.oninput = () => {
        const dur = studentAnthemAudioEl.duration || 0;
        if (dur > 0) {
          studentAnthemAudioEl.currentTime = (Number(seekSlider.value) / 100) * dur;
        }
      };
    }

    if (volSlider) {
      volSlider.oninput = () => {
        const pct = Number(volSlider.value || 0);
        studentAnthemVolume = Math.max(0, Math.min(1, pct / 100));
        studentAnthemMuted = studentAnthemVolume === 0;
        studentAnthemAudioEl.muted = studentAnthemMuted;
        studentAnthemAudioEl.volume = studentAnthemVolume;
        if (muteBtn) {
          muteBtn.textContent = studentAnthemMuted ? '🔇' : '🔊';
        }
      };
    }

    if (muteBtn) {
      muteBtn.onclick = () => {
        studentAnthemMuted = !studentAnthemMuted;
        if (!studentAnthemMuted && studentAnthemVolume === 0) {
          studentAnthemVolume = 0.75;
        }
        studentAnthemAudioEl.muted = studentAnthemMuted;
        studentAnthemAudioEl.volume = studentAnthemMuted ? 0 : studentAnthemVolume;
        muteBtn.textContent = studentAnthemMuted ? '🔇' : '🔊';
        if (volSlider) {
          volSlider.value = String(Math.round((studentAnthemMuted ? 0 : studentAnthemVolume) * 100));
        }
      };
    }
  }

  // =========================================================================
  // Right-Side Settings Drawer (My Profile, All Exams, Language, Appearance, Logout)
  // =========================================================================
  function openSettingsDrawer() {
    settingsDrawerOpen = true;
    const backdrop = document.getElementById('settingsDrawerBackdrop');
    const panel = document.getElementById('settingsDrawerPanel');
    const gearBtn = document.getElementById('settingsDrawerTriggerBtn');
    if (backdrop) {
      backdrop.classList.add('open');
      backdrop.setAttribute('aria-hidden', 'false');
    }
    if (panel) {
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
    }
    if (gearBtn) {
      gearBtn.setAttribute('aria-expanded', 'true');
    }
    renderSettingsDrawerContent();
  }

  function closeSettingsDrawer() {
    settingsDrawerOpen = false;
    const backdrop = document.getElementById('settingsDrawerBackdrop');
    const panel = document.getElementById('settingsDrawerPanel');
    const gearBtn = document.getElementById('settingsDrawerTriggerBtn');
    if (backdrop) {
      backdrop.classList.remove('open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    if (panel) {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }
    if (gearBtn) {
      gearBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function toggleSettingsDrawer() {
    if (settingsDrawerOpen) {
      closeSettingsDrawer();
    } else {
      openSettingsDrawer();
    }
  }

  function renderSettingsDrawerContent() {
    const panel = document.getElementById('settingsDrawerPanel');
    if (!panel) return;

    const exams = window.CGpediaCloud ? window.CGpediaCloud.EXAM_CATEGORIES : [];
    const loggedOut = isLoggedOut();
    const stu = state.student || {};
    const activeExamObj = exams.find((e) => e.code === state.selectedExamFilter);
    const activeExamLabel = state.selectedExamFilter === 'ALL'
      ? 'All Exams (सभी परीक्षाएं)'
      : (activeExamObj ? `${activeExamObj.icon} ${activeExamObj.nameEn}` : state.selectedExamFilter);

    panel.innerHTML = `
      <div class="settings-drawer-inner">
        <!-- Drawer Header -->
        <div class="settings-drawer-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="settings-drawer-header-icon">⚙️</span>
            <div>
              <h2 class="settings-drawer-title">Settings</h2>
              <p class="settings-drawer-subtitle">Account, Exam Preferences, Language &amp; Theme</p>
            </div>
          </div>
          <button type="button" class="settings-drawer-close-btn" id="closeSettingsDrawerBtn" aria-label="Close Settings Drawer" title="Close Settings">✕</button>
        </div>

        <!-- Drawer Scrollable Body -->
        <div class="settings-drawer-body">
          <!-- 1. My Profile -->
          <div class="settings-drawer-section">
            <div class="settings-section-label">1. MY PROFILE</div>
            <div class="settings-profile-card">
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="settings-profile-avatar">
                  ${esc(String(stu.name || 'A').trim().charAt(0).toUpperCase())}
                </div>
                <div style="min-width:0;flex:1;">
                  <div class="settings-profile-name">
                    ${esc(loggedOut ? 'Not Signed In' : (stu.name || 'Aspirant'))}
                    ${!loggedOut && isCurrentUserAdmin() ? `<span class="badge" style="background:#EA580C;color:#fff;font-size:0.65rem;">🛡️ Admin</span>` : ''}
                  </div>
                  <div class="settings-profile-email">
                    ${esc(loggedOut ? 'Sign in to access your personal account' : (stu.email || 'Local Student Account'))}
                  </div>
                  ${!loggedOut && stu.phone ? `<div class="settings-profile-meta">📱 ${esc(stu.phone)}</div>` : ''}
                  ${!loggedOut && stu.uid ? `<div class="settings-profile-meta">🆔 UID: ${esc(stu.uid)}</div>` : ''}
                </div>
              </div>

              ${!loggedOut ? `
                <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;gap:6px;flex-wrap:wrap;">
                  <button type="button" class="btn btn-outline btn-sm" id="drawerToggleProfileEditBtn" style="flex:1;">
                    ✏️ ${settingsProfileEditExpanded ? 'Hide Edit Form' : 'Edit Profile'}
                  </button>
                  <button type="button" class="btn btn-navy btn-sm" id="drawerOpenFullProfileBtn" style="flex:1;">
                    👤 Account Details
                  </button>
                </div>
                ${isCurrentUserAdmin() ? `
                  <div style="margin-top:8px;">
                    <button type="button" class="btn btn-warning btn-sm" id="drawerOpenAdminPanelBtn" style="width:100%;font-weight:800;">
                      🛡️ Open Master Admin Panel
                    </button>
                  </div>
                ` : ''}

                ${settingsProfileEditExpanded ? `
                  <div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);display:grid;gap:8px;">
                    <div>
                      <label class="form-label" style="font-size:0.74rem;margin-bottom:2px;">Full Name</label>
                      <input class="form-input" id="drawerEditNameInput" value="${esc(stu.name || '')}" style="padding:7px 10px;font-size:0.82rem;" />
                    </div>
                    <div>
                      <label class="form-label" style="font-size:0.74rem;margin-bottom:2px;">Email Address</label>
                      <input class="form-input" id="drawerEditEmailInput" type="email" value="${esc(stu.email || '')}" style="padding:7px 10px;font-size:0.82rem;" />
                    </div>
                    <div>
                      <label class="form-label" style="font-size:0.74rem;margin-bottom:2px;">Mobile / WhatsApp Number</label>
                      <input class="form-input" id="drawerEditPhoneInput" value="${esc(stu.phone || '')}" style="padding:7px 10px;font-size:0.82rem;" />
                    </div>
                    <button type="button" class="btn btn-primary btn-sm" id="drawerSaveProfileInlineBtn">💾 Save Profile Info</button>
                  </div>
                ` : ''}
              ` : `
                <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
                  <button type="button" class="btn btn-primary btn-sm" id="drawerSignInBtn" style="width:100%;">
                    🔐 Sign In / Create Account
                  </button>
                </div>
              `}
            </div>
          </div>

          <!-- 2. All Exams -->
          <div class="settings-drawer-section">
            <div class="settings-section-label">2. ALL EXAMS</div>
            <div class="settings-option-box">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
                <div>
                  <div style="font-size:0.85rem;font-weight:700;color:var(--text);">Active Exam Category</div>
                  <div style="font-size:0.76rem;color:var(--text-secondary);" id="drawerActiveExamText">${esc(activeExamLabel)}</div>
                </div>
                <button type="button" class="btn btn-outline btn-sm" id="drawerOpenTargetExamsModalBtn">🎯 Target Exams</button>
              </div>
              <select class="form-select" id="drawerAllExamsSelect" aria-label="Select Exam Category" style="padding:8px 10px;font-size:0.83rem;">
                <option value="ALL" ${state.selectedExamFilter === 'ALL' ? 'selected' : ''}>🌟 All Exams (सभी प्रतियोगी परीक्षाएं)</option>
                ${exams.map((ex) => `
                  <option value="${esc(ex.code)}" ${state.selectedExamFilter === ex.code ? 'selected' : ''}>
                    ${esc(ex.icon)} ${esc(ex.nameEn)} — ${esc(ex.nameHi)}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- 3. Language -->
          <div class="settings-drawer-section">
            <div class="settings-section-label">3. LANGUAGE (हिन्दी / ENGLISH)</div>
            <div class="settings-option-box">
              <div class="settings-segmented-group" role="group" aria-label="Select Language">
                <button type="button" class="settings-segment-btn ${state.lang === 'bilingual' ? 'active' : ''}" data-drawer-lang="bilingual">
                  🌐 हिन्दी + EN
                </button>
                <button type="button" class="settings-segment-btn ${state.lang === 'hi' ? 'active' : ''}" data-drawer-lang="hi">
                  🇮🇳 हिन्दी
                </button>
                <button type="button" class="settings-segment-btn ${state.lang === 'en' ? 'active' : ''}" data-drawer-lang="en">
                  🔤 English
                </button>
              </div>
            </div>
          </div>

          <!-- 4. Appearance -->
          <div class="settings-drawer-section">
            <div class="settings-section-label">4. APPEARANCE</div>
            <div class="settings-option-box">
              <div class="settings-segmented-group" role="group" aria-label="Select Appearance Theme">
                <button type="button" class="settings-segment-btn ${state.theme !== 'dark' ? 'active' : ''}" data-drawer-theme="light">
                  ☀️ Light Mode
                </button>
                <button type="button" class="settings-segment-btn ${state.theme === 'dark' ? 'active' : ''}" data-drawer-theme="dark">
                  🌙 Dark Mode
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Logout Button at the Bottom of the Settings Drawer -->
        <div class="settings-drawer-footer">
          <button type="button" class="settings-logout-btn" id="drawerLogoutBtn">
            <span class="settings-logout-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    `;

    // Bind Drawer Events
    const closeBtn = document.getElementById('closeSettingsDrawerBtn');
    if (closeBtn) {
      closeBtn.onclick = () => closeSettingsDrawer();
    }

    const toggleEditBtn = document.getElementById('drawerToggleProfileEditBtn');
    if (toggleEditBtn) {
      toggleEditBtn.onclick = () => {
        settingsProfileEditExpanded = !settingsProfileEditExpanded;
        renderSettingsDrawerContent();
      };
    }

    const saveInlineBtn = document.getElementById('drawerSaveProfileInlineBtn');
    if (saveInlineBtn) {
      saveInlineBtn.onclick = () => {
        const nameVal = (document.getElementById('drawerEditNameInput').value || '').trim();
        const emailVal = (document.getElementById('drawerEditEmailInput').value || '').trim().toLowerCase();
        const phoneVal = (document.getElementById('drawerEditPhoneInput').value || '').trim();
        if (nameVal) state.student.name = nameVal;
        if (emailVal) state.student.email = emailVal;
        state.student.phone = phoneVal;
        settingsProfileEditExpanded = false;
        saveState();
        if (window.CGpediaCloud && state.student.uid) {
          window.CGpediaCloud.saveCloudDoc('users', state.student.uid, {
            userId: state.student.uid,
            displayName: state.student.name,
            email: state.student.email,
            phoneNumber: state.student.phone,
            targetExams: state.student.targetExams
          });
        }
        renderApp();
        toast('✅ Profile information updated!');
      };
    }

    const openFullProfBtn = document.getElementById('drawerOpenFullProfileBtn');
    if (openFullProfBtn) {
      openFullProfBtn.onclick = () => {
        closeSettingsDrawer();
        navigateToTab('profile');
      };
    }

    const openAdminDrawerBtn = document.getElementById('drawerOpenAdminPanelBtn');
    if (openAdminDrawerBtn) {
      openAdminDrawerBtn.onclick = () => {
        closeSettingsDrawer();
        navigateToTab('admin');
      };
    }

    const signInBtn = document.getElementById('drawerSignInBtn');
    if (signInBtn) {
      signInBtn.onclick = () => {
        closeSettingsDrawer();
        openStudentAuthModal('login', '');
      };
    }

    const targetExamsModalBtn = document.getElementById('drawerOpenTargetExamsModalBtn');
    if (targetExamsModalBtn) {
      targetExamsModalBtn.onclick = () => {
        closeSettingsDrawer();
        openOnboardingModal();
      };
    }

    const allExamsSelect = document.getElementById('drawerAllExamsSelect');
    if (allExamsSelect) {
      allExamsSelect.onchange = () => {
        state.selectedExamFilter = allExamsSelect.value;
        saveState();
        renderApp();
        toast(`🎯 Exam category set to: ${allExamsSelect.value === 'ALL' ? 'All Exams' : allExamsSelect.value}`);
      };
    }

    panel.querySelectorAll('[data-drawer-lang]').forEach((btn) => {
      btn.onclick = () => {
        const chosenLang = btn.getAttribute('data-drawer-lang');
        state.lang = chosenLang;
        if (state.student) state.student.preferredLang = chosenLang;
        saveState();
        renderApp();
        toast(`🌐 Language updated to: ${chosenLang === 'bilingual' ? 'Hindi + English' : chosenLang === 'hi' ? 'हिन्दी (Hindi)' : 'English'}`);
      };
    });

    panel.querySelectorAll('[data-drawer-theme]').forEach((btn) => {
      btn.onclick = () => {
        const chosenTheme = btn.getAttribute('data-drawer-theme');
        state.theme = chosenTheme;
        saveState();
        applyBrandingAndSecurity();
        toast(`${chosenTheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'} activated`);
      };
    });

    const logoutBtn = document.getElementById('drawerLogoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        closeSettingsDrawer();
        performStudentLogout();
      };
    }
  }

  // =========================================================================
  // Initialization & Global Event Listeners
  // =========================================================================
  const publicApi = {
    saveState,
    renderApp,
    navigateToTab,
    toast,
    applyBrandingAndSecurity,
    generateHighYieldBilingualQuestions,
    selectEligibleQuestionsForTest,
    isQuestionEligibleForAutoSelection,
    openQuestionEditorModal,
    parseBulkQuestionsText,
    handleFirebaseAuthUser,
    mergeCloudCollection,
    syncLocalAdminStateToCloud,
    isCurrentUserAdmin,
    getCurrentStudentUid,
    openStudentAuthModal,
    performStudentLogout,
    toggleStudentAnthemFloatingPlayer,
    openSettingsDrawer,
    closeSettingsDrawer
  };
  window.CGpediaApp = publicApi;

  document.addEventListener('DOMContentLoaded', () => {
    // Hide splash smoothly after 650ms
    setTimeout(() => {
      const splash = document.getElementById('splashOverlay');
      if (splash) splash.classList.add('hidden');
    }, 650);

    // Safety fallback timer so auth loading state resolves even if offline
    setTimeout(() => {
      if (!authStateCheckComplete) {
        authStateCheckComplete = true;
        renderApp();
      }
    }, 420);

    // Browser Back/Forward (popstate) & manual URL hash change protection
    window.addEventListener('popstate', () => {
      if (!isStudentAuthenticated()) {
        try {
          window.history.replaceState({ authGate: 'login' }, '', '#login');
        } catch (_) {}
      } else {
        const rawHash = String(window.location.hash || '').replace(/^#\/?/, '').trim().toLowerCase();
        if (PROTECTED_TABS.includes(rawHash)) {
          state.activeTab = (rawHash === 'admin' && !isCurrentUserAdmin()) ? 'dashboard' : rawHash;
        }
      }
      renderApp();
    });

    window.addEventListener('hashchange', () => {
      if (suppressNextHashChange) return;
      const rawHash = String(window.location.hash || '').replace(/^#\/?/, '').trim().toLowerCase();
      if (!isStudentAuthenticated()) {
        if (rawHash !== 'login' && rawHash !== 'register' && rawHash !== 'reset') {
          try {
            window.history.replaceState({ authGate: 'login' }, '', '#login');
          } catch (_) {}
        }
        renderApp();
        return;
      }
      if (PROTECTED_TABS.includes(rawHash)) {
        if (rawHash === 'admin' && !isCurrentUserAdmin()) {
          toast('🔒 Access Denied: Admin Panel is restricted to authorized administrators.');
          state.activeTab = 'dashboard';
          syncUrlHashWithActiveTab('dashboard', false);
        } else {
          state.activeTab = rawHash;
        }
        initialHashSynced = true;
        saveState();
        renderApp();
      }
    });

    // Delegated + Direct Top & Bottom Navigation Click Handlers
    const handleNavContainerClick = (ev) => {
      const btn = ev.target && typeof ev.target.closest === 'function'
        ? ev.target.closest('[data-tab]')
        : null;
      if (!btn) return;
      ev.preventDefault();
      const targetTab = btn.getAttribute('data-tab');
      if (targetTab) {
        navigateToTab(targetTab);
      }
    };

    const mainNavContainer = document.getElementById('mainNavTabs');
    if (mainNavContainer) {
      mainNavContainer.addEventListener('click', handleNavContainerClick);
    }
    const mobileNavContainer = document.getElementById('mobileBottomNav');
    if (mobileNavContainer) {
      mobileNavContainer.addEventListener('click', handleNavContainerClick);
    }

    // Brand Home Trigger
    const brandHome = document.getElementById('brandHomeTrigger');
    if (brandHome) {
      brandHome.onclick = () => {
        navigateToTab('dashboard');
      };
    }

    // Settings Gear Icon & Drawer Backdrop
    const settingsBtn = document.getElementById('settingsDrawerTriggerBtn');
    if (settingsBtn) {
      settingsBtn.onclick = () => {
        if (!isStudentAuthenticated()) return;
        toggleSettingsDrawer();
      };
    }
    const settingsBackdrop = document.getElementById('settingsDrawerBackdrop');
    if (settingsBackdrop) {
      settingsBackdrop.onclick = () => closeSettingsDrawer();
    }

    // Persistent Hero Card Controls: My Target Exams, Anthem Icon, Notification Bell Icon, and Search
    const heroTargetExamsBtn = document.getElementById('homeEditOnboardingBtn');
    if (heroTargetExamsBtn) {
      heroTargetExamsBtn.onclick = () => {
        if (!isStudentAuthenticated()) return;
        openOnboardingModal();
      };
    }

    const anthemBtn = document.getElementById('anthemToggleBtn');
    if (anthemBtn) {
      anthemBtn.onclick = () => {
        if (!isStudentAuthenticated()) return;
        toggleStudentAnthemFloatingPlayer();
      };
    }

    const notifBtn = document.getElementById('notifBellBtn');
    if (notifBtn) {
      notifBtn.onclick = () => {
        if (!isStudentAuthenticated()) return;
        navigateToTab('notifications');
      };
    }

    const heroSearchBtn = document.getElementById('globalHomeSearchBtn');
    const heroSearchInput = document.getElementById('globalHomeSearchInput');
    if (heroSearchBtn && heroSearchInput) {
      const triggerHeroSearch = () => {
        if (!isStudentAuthenticated()) return;
        state.searchQuery = heroSearchInput.value.trim();
        navigateToTab('test-series');
      };
      heroSearchBtn.onclick = triggerHeroSearch;
      heroSearchInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          triggerHeroSearch();
        }
      };
    }

    // Security Blur when window loses focus if screenshot restriction is enabled
    const secOverlay = document.getElementById('securityBlurOverlay');
    window.addEventListener('blur', () => {
      if (state.config.screenshotRestriction && secOverlay) {
        secOverlay.classList.add('active');
      }
    });
    window.addEventListener('focus', () => {
      if (secOverlay) secOverlay.classList.remove('active');
    });
    if (secOverlay) {
      secOverlay.onclick = () => secOverlay.classList.remove('active');
    }

    // PWA Install Banner
    const pwaBanner = document.getElementById('pwaInstallBanner');
    const installBtn = document.getElementById('installPwaBtn');
    const dismissPwa = document.getElementById('dismissPwaBannerBtn');
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPwaPrompt = e;
    });
    if (installBtn) {
      installBtn.onclick = async () => {
        if (deferredPwaPrompt) {
          deferredPwaPrompt.prompt();
          await deferredPwaPrompt.userChoice;
          deferredPwaPrompt = null;
        } else {
          toast('📲 Browser menu (⋮) खोलें और "Add to Home Screen / Install App" चुनें।');
        }
      };
    }
    if (dismissPwa && pwaBanner) {
      dismissPwa.onclick = () => pwaBanner.classList.add('hidden');
    }

    // Register Service Worker & force update check
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('sw.js?v=6.6').then((reg) => {
        try { reg.update(); } catch (_) {}
      }).catch(() => {});
    }

    // Portrait (Normal Mobile Site) vs Landscape (1280px Desktop Site) Automatic Switcher
    syncOrientationViewportMode();
    window.addEventListener('orientationchange', () => {
      setTimeout(() => syncOrientationViewportMode(), 80);
      setTimeout(() => syncOrientationViewportMode(), 260);
    });
    window.addEventListener('resize', () => {
      syncOrientationViewportMode();
    });
    if (window.screen && window.screen.orientation && typeof window.screen.orientation.addEventListener === 'function') {
      try {
        window.screen.orientation.addEventListener('change', () => {
          syncOrientationViewportMode();
        });
      } catch (_) {}
    }

    // Request notification permission if user is already logged in
    if (isStudentAuthenticated()) {
      setTimeout(() => {
        requestStudentNotificationPermissionImmediate();
      }, 600);
    }

    // Connect Firebase Cloud Sync & Intelligent Verified Current Affairs Sync
    let hourlyCaSyncInProgress = false;
    async function runHourlyCurrentAffairsAutoUpdate(forceNow) {
      if (hourlyCaSyncInProgress || navigator.onLine === false) return;
      if (!window.CGpediaAdmin || typeof window.CGpediaAdmin.generateCurrentAffairsWithAi !== 'function') return;

      const LAST_HOURLY_CA_KEY = 'cgpedia_last_hourly_ca_sync_ms_v1';
      const lastSyncMs = Number(localStorage.getItem(LAST_HOURLY_CA_KEY) || 0);
      const nowMs = Date.now();
      const canonicalStories = getCanonicalCurrentAffairsList();
      const hasAllThreeCategories =
        canonicalStories.some((s) => normalizeStoryCategory(s.category) === 'chhattisgarh') &&
        canonicalStories.some((s) => normalizeStoryCategory(s.category) === 'national') &&
        canonicalStories.some((s) => normalizeStoryCategory(s.category) === 'international');

      if (!forceNow && (nowMs - lastSyncMs) < 3600000 && canonicalStories.length >= 3 && hasAllThreeCategories) {
        return;
      }

      hourlyCaSyncInProgress = true;
      try {
        const generated = await window.CGpediaAdmin.generateCurrentAffairsWithAi({
          mode: 'intelligent_sync',
          category: 'ALL',
          existingStories: canonicalStories,
          sourceName: 'PIB / DPR Chhattisgarh / Official Desk',
          count: 3
        });
        if (Array.isArray(generated) && generated.length > 0 && typeof window.CGpediaAdmin.enrichAndDeduplicateCurrentAffairsItems === 'function') {
          const uniqueItems = window.CGpediaAdmin.enrichAndDeduplicateCurrentAffairsItems(generated, canonicalStories, {
            category: 'ALL',
            sourceName: 'PIB / DPR Chhattisgarh / Official Desk'
          });
          if (uniqueItems.length > 0) {
            state.stories = [...uniqueItems, ...canonicalStories];
            getCanonicalCurrentAffairsList();
            saveState();
            localStorage.setItem(LAST_HOURLY_CA_KEY, String(Date.now()));
            if (window.CGpediaCloud && typeof window.CGpediaCloud.saveCloudDoc === 'function') {
              for (const item of uniqueItems) {
                try {
                  await window.CGpediaCloud.saveCloudDoc('current_affairs', item.id, item);
                } catch (_) {}
              }
            }
            if (state.activeTab === 'dashboard' || state.activeTab === 'current-affairs') {
              renderApp();
            }
          } else {
            localStorage.setItem(LAST_HOURLY_CA_KEY, String(Date.now()));
          }
        }
      } catch (_) {
        // Silent retry on next cycle
      } finally {
        hourlyCaSyncInProgress = false;
      }
    }

    if (window.CGpediaCloud) {
      window.CGpediaCloud.initFirebaseConnection((connected) => {
        if (connected && isCurrentUserAdmin() && !adminInitialAutoSyncTriggered) {
          adminInitialAutoSyncTriggered = true;
          setTimeout(() => {
            syncLocalAdminStateToCloud(false);
          }, 1200);
        }
        if (connected) {
          setTimeout(() => {
            runHourlyCurrentAffairsAutoUpdate(false);
          }, 3500);
        }
      });
    }

    // Trigger online Current Affairs auto-update every 1 hour (3,600,000 ms)
    setInterval(() => {
      runHourlyCurrentAffairsAutoUpdate(false);
    }, 3600000);

    renderApp();
  });
})();
