/**
 * CGpedia — Role-Protected Master Admin Control Center
 * Exclusively accessible to verified Owner Admin (usahu0304@gmail.com) and delegated staff roles.
 */
(function () {
  'use strict';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  let savedAdminNavScrollLeft = 0;
  const VALID_ADMIN_SECTIONS = ['overview', 'tests', 'qbank', 'students', 'payments', 'stories', 'broadcast', 'branding'];

  function switchAdminSection(rootEl, state, api, nextSection) {
    if (!nextSection) return;
    const navRowEl = rootEl.querySelector('#adminSubTabNavRow');
    const lockedScroll = navRowEl ? navRowEl.scrollLeft : savedAdminNavScrollLeft;
    savedAdminNavScrollLeft = lockedScroll;
    state.adminSection = VALID_ADMIN_SECTIONS.includes(nextSection) ? nextSection : 'overview';
    api.saveState();
    renderAdminConsole(rootEl, state, api);
    const updatedNavRow = rootEl.querySelector('#adminSubTabNavRow');
    if (updatedNavRow) {
      updatedNavRow.scrollLeft = lockedScroll;
      requestAnimationFrame(() => {
        updatedNavRow.scrollLeft = lockedScroll;
      });
    }
  }

  function renderAdminConsole(rootEl, state, api) {
    if (state.adminSection === 'folders') {
      state.adminSection = 'tests';
    }
    if (!VALID_ADMIN_SECTIONS.includes(state.adminSection)) {
      state.adminSection = 'overview';
    }
    const activeSection = state.adminSection || 'overview';

    // Combine registered students from Firestore, local registry, attempts, orders, and activations
    let localRegistryAccounts = [];
    try {
      const rawReg = localStorage.getItem('cgpedia_registered_accounts_v1');
      if (rawReg) {
        const parsedReg = JSON.parse(rawReg);
        if (Array.isArray(parsedReg)) localRegistryAccounts = parsedReg;
      }
    } catch (_) {}

    const studentMap = new Map();
    const registerStudentEntry = (entry) => {
      if (!entry) return;
      const email = String(entry.email || entry.studentEmail || entry.studentIdentifier || '').trim().toLowerCase();
      const uid = String(entry.uid || entry.id || '').trim();
      const key = email || uid;
      if (!key) return;
      const existing = studentMap.get(key) || {
        uid: uid || ('STU-' + key.slice(0, 6).toUpperCase()),
        name: entry.name || entry.displayName || entry.studentName || 'Aspirant',
        email: email || '',
        phone: entry.phone || entry.studentPhone || '',
        targetExams: Array.isArray(entry.targetExams) ? entry.targetExams : ['CGPSC'],
        createdAtIso: entry.createdAtIso || entry.registeredAtIso || ''
      };
      if (entry.name || entry.displayName || entry.studentName) {
        existing.name = entry.name || entry.displayName || entry.studentName;
      }
      if (email) existing.email = email;
      if (uid && !existing.uid) existing.uid = uid;
      if (entry.phone || entry.studentPhone) existing.phone = entry.phone || entry.studentPhone;
      studentMap.set(key, existing);
    };

    (state.registeredStudents || []).forEach(registerStudentEntry);
    localRegistryAccounts.forEach(registerStudentEntry);
    if (state.student && (state.student.email || state.student.uid)) {
      registerStudentEntry(state.student);
    }
    (state.orders || []).forEach(registerStudentEntry);
    (state.activations || []).forEach((a) => {
      if (a.studentIdentifier) {
        registerStudentEntry({
          email: String(a.studentIdentifier).includes('@') ? a.studentIdentifier : '',
          uid: !String(a.studentIdentifier).includes('@') ? a.studentIdentifier : '',
          name: a.studentName || 'Student'
        });
      }
    });

    const allRegisteredStudents = Array.from(studentMap.values());
    const totalStudents = Math.max(1, allRegisteredStudents.length);
    const publishedTests = (state.tests || []).filter((t) => t.status === 'published').length;
    const draftTests = (state.tests || []).filter((t) => t.status !== 'published').length;
    const totalQBank = (state.questionBank || []).length + (state.tests || []).reduce((acc, t) => acc + ((t.questions || []).length), 0);
    const totalRevenue = (state.activations || []).reduce((acc, a) => acc + Number(a.amountPaid || 0), 0);

    // Original 5 Top-Level Admin Modules in their exact original arrangement and positions
    const subTabs = [
      { id: 'overview', label: '📊 Dashboard KPIs', title: 'Dashboard KPIs' },
      { id: 'tests', label: '📝 Test Series Builder', title: 'Test Series Builder' },
      { id: 'qbank', label: '🧠 Question Bank', title: 'Question Bank' },
      { id: 'students', label: '👥 Student Management', title: 'Student Management' },
      { id: 'payments', label: '💳 Payment Management', title: 'Payment Management' }
    ];

    const secondaryModuleTitles = {
      stories: 'Current Affairs & PDFs',
      broadcast: 'Announcements & Student Queries',
      branding: 'Branding, Anthem Audio & Staff Roles'
    };

    const activeModuleObj = subTabs.find((t) => t.id === activeSection);
    const activeModuleTitle = activeModuleObj
      ? activeModuleObj.title
      : (secondaryModuleTitles[activeSection] || 'Dashboard KPIs');

    const existingNavRow = rootEl.querySelector('#adminSubTabNavRow');
    const existingBodyEl = rootEl.querySelector('#adminSubSectionBody');

    if (existingNavRow) {
      savedAdminNavScrollLeft = existingNavRow.scrollLeft;
    }

    if (!existingNavRow || !existingBodyEl) {
      rootEl.innerHTML = `
        <div class="hero-banner" style="padding:18px 20px;margin-bottom:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:12px;">
              <img src="assets/cgpedia-logo-clean.png" alt="CGpedia" style="width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid #93C5FD;" />
              <div>
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <span class="badge" style="background:#EA580C;color:#fff;">MASTER ADMIN CONSOLE</span>
                  <span class="badge badge-cloud" id="adminOwnerEmailBadge">Owner: ${esc(state.student.email)}</span>
                </div>
                <h1 style="font-size:1.25rem;font-weight:800;margin-top:3px;">CGpedia Multi-Exam Control Center</h1>
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" class="btn btn-header-chip" data-admin-util-jump="stories" title="Publish 24-Hour Current Affairs">⚡ Current Affairs</button>
              <button type="button" class="btn btn-header-chip" data-admin-util-jump="broadcast" title="Announcements & Student Queries">📢 Announcements</button>
              <button type="button" class="btn btn-header-chip" data-admin-util-jump="branding" title="Branding, Anthem Audio & Roles">⚙️ Branding &amp; Anthem</button>
              <button type="button" class="btn btn-header-chip" id="adminExportBackupBtn">⬇️ Export JSON Backup</button>
              <button type="button" class="btn btn-header-chip" id="adminLockBtn">🔒 Exit Admin</button>
            </div>
          </div>
        </div>

        <div class="chip-row" id="adminSubTabNavRow" style="margin-bottom:12px;overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch;scroll-behavior:auto;">
          ${subTabs.map((t) => `
            <button type="button" class="filter-chip ${activeSection === t.id ? 'active' : ''}" data-admin-subtab="${t.id}" style="flex:0 0 auto;">
              ${t.label}
            </button>
          `).join('')}
        </div>

        <div id="adminActiveModuleHeaderBar" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 14px;margin-bottom:14px;border-radius:10px;background:var(--surface);border:1px solid var(--border);box-shadow:var(--shadow-sm);">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="badge badge-exam">ACTIVE MODULE</span>
            <strong id="adminActiveModuleTitleText" style="font-size:0.98rem;font-weight:800;color:var(--text);">${esc(activeModuleTitle)}</strong>
          </div>
          <div style="font-size:0.76rem;color:var(--text-secondary);">
            All existing Firebase data, Test Series &amp; Question Bank records preserved
          </div>
        </div>

        <div id="adminSubSectionBody"></div>
      `;

      const mountedNavRow = rootEl.querySelector('#adminSubTabNavRow');
      if (mountedNavRow) {
        mountedNavRow.scrollLeft = savedAdminNavScrollLeft;
        mountedNavRow.addEventListener('scroll', () => {
          savedAdminNavScrollLeft = mountedNavRow.scrollLeft;
        }, { passive: true });
      }
    } else {
      const ownerBadge = rootEl.querySelector('#adminOwnerEmailBadge');
      if (ownerBadge) {
        ownerBadge.textContent = `Owner: ${(state.student && state.student.email) || ''}`;
      }
      const activeTitleEl = rootEl.querySelector('#adminActiveModuleTitleText');
      if (activeTitleEl) {
        activeTitleEl.textContent = activeModuleTitle;
      }
      existingNavRow.querySelectorAll('[data-admin-subtab]').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-admin-subtab') === activeSection);
      });
      existingNavRow.scrollLeft = savedAdminNavScrollLeft;
      requestAnimationFrame(() => {
        if (existingNavRow) existingNavRow.scrollLeft = savedAdminNavScrollLeft;
      });
    }

    const navRowEl = rootEl.querySelector('#adminSubTabNavRow');
    if (navRowEl) {
      navRowEl.onclick = (ev) => {
        const btn = ev.target && typeof ev.target.closest === 'function'
          ? ev.target.closest('[data-admin-subtab]')
          : null;
        if (!btn) return;
        const targetSubTab = btn.getAttribute('data-admin-subtab');
        if (targetSubTab) {
          switchAdminSection(rootEl, state, api, targetSubTab);
        }
      };
    }

    rootEl.querySelectorAll('[data-admin-util-jump]').forEach((btn) => {
      btn.onclick = () => {
        const targetUtil = btn.getAttribute('data-admin-util-jump');
        if (targetUtil) {
          switchAdminSection(rootEl, state, api, targetUtil);
        }
      };
    });

    const lockBtn = document.getElementById('adminLockBtn');
    if (lockBtn) {
      lockBtn.onclick = () => {
        state.adminUnlocked = false;
        if (api && typeof api.navigateToTab === 'function') {
          api.navigateToTab('dashboard');
        } else {
          state.activeTab = 'dashboard';
          api.saveState();
          api.renderApp();
        }
      };
    }

    const expBtn = document.getElementById('adminExportBackupBtn');
    if (expBtn) {
      expBtn.onclick = () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `cgpedia-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        api.toast('📦 Complete platform backup exported!');
      };
    }

    const bodyEl = document.getElementById('adminSubSectionBody');
    if (!bodyEl) return;

    try {
    if (activeSection === 'overview') {
      const pendingOrdersCount = (state.orders || []).filter((o) => String(o.status || 'pending').toLowerCase() === 'pending').length;
      bodyEl.innerHTML = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-value">${(state.folders || []).length}</div>
            <div class="kpi-label">Test Series Packages</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value" style="color:var(--success);">${publishedTests}</div>
            <div class="kpi-label">Published Live Tests</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value" style="color:var(--warning);">${draftTests}</div>
            <div class="kpi-label">Draft Tests (In Review)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${totalQBank}</div>
            <div class="kpi-label">Total Bilingual MCQs</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value">${totalStudents}</div>
            <div class="kpi-label">Registered Students (${(state.attempts || []).length} Attempts)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value" style="color:var(--secondary);">₹${totalRevenue}</div>
            <div class="kpi-label">Activated Revenue (${(state.activations || []).length} unlocks${pendingOrdersCount > 0 ? ` • ${pendingOrdersCount} Pending` : ''})</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">🚀 Quick Actions</h3>
            <div style="display:grid;gap:8px;">
              <button class="btn btn-primary" data-quick-jump="tests">📝 Test Series Builder (Create Series &amp; Tests)</button>
              <button class="btn btn-outline" data-quick-jump="qbank">🧠 Question Bank (CSV / JSON / Smart PDF Import)</button>
              <button class="btn btn-navy" data-quick-jump="students">👥 Student Management (${totalStudents} Students)</button>
              <button class="btn btn-success" data-quick-jump="payments">💳 Payment Management (UPI QR, Records &amp; Unlocks)</button>
            </div>
          </div>

          <div class="card">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">🚩 Recent Question Error Reports &amp; Doubts</h3>
            ${(state.questionReports || []).length === 0 && (state.queries || []).length === 0 ? `
              <p style="font-size:0.84rem;color:var(--text-muted);">No pending error reports or student queries.</p>
            ` : `
              <div style="display:grid;gap:8px;max-height:220px;overflow-y:auto;">
                ${(state.questionReports || []).slice(0, 5).map((rep) => `
                  <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);font-size:0.8rem;">
                    <strong>🚩 ${esc(rep.testTitle || 'CBT Question')}:</strong> ${esc(rep.reason)}
                    <div style="font-size:0.72rem;color:var(--text-muted);">By ${esc(rep.studentEmail || 'Student')}</div>
                  </div>
                `).join('')}
                ${(state.queries || []).slice(0, 5).map((q) => `
                  <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);font-size:0.8rem;">
                    <strong>💬 ${esc(q.subject)}:</strong> ${esc(q.message)}
                    <div style="font-size:0.72rem;color:var(--text-muted);">${esc(q.studentName)} (${esc(q.status)})</div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      `;
      bodyEl.querySelectorAll('[data-quick-jump]').forEach((btn) => {
        btn.onclick = () => {
          const targetJump = btn.getAttribute('data-quick-jump');
          if (targetJump) {
            switchAdminSection(rootEl, state, api, targetJump);
          }
        };
      });
      return;
    }
    if (activeSection === 'tests') {
      const catalog = getTaxonomyCatalog(state);
      const exams = catalog.examCategories;
      const tbState = state._testBuilderUiState || {
        examCode: 'CGPSC',
        subjectFilter: 'ALL',
        topicFilter: '',
        subtopicFilter: 'ALL',
        difficultyFilter: 'ALL',
        lastWarning: null,
        lastSelectionSummary: null
      };
      state._testBuilderUiState = tbState;

      const activeBankForTests = (state.questionBank || []).filter((q) => !q.isDeleted && q.status !== 'deleted');
      const examSubjects = tbState.examCode && tbState.examCode !== 'ALL'
        ? catalog.getSubjectsForExam(tbState.examCode)
        : catalog.subjects;
      const repoSubjectsForTests = Array.from(new Set([
        ...examSubjects.map((s) => s.titleEn),
        ...catalog.subjects.map((s) => s.titleEn),
        ...activeBankForTests.map((q) => q.subjectTag || 'General Studies')
      ])).filter(Boolean);

      const availableTopicsForTests = tbState.subjectFilter && tbState.subjectFilter !== 'ALL'
        ? catalog.getTopicsForSubject(tbState.subjectFilter).map((t) => t.titleEn)
        : catalog.allTopics;

      const availableSubtopicsForTests = tbState.topicFilter
        ? catalog.getSubtopicsForTopic(tbState.topicFilter, tbState.subjectFilter !== 'ALL' ? tbState.subjectFilter : '').map((st) => st.titleEn)
        : (catalog.allSubtopics || []);

      const computeLiveEligiblePoolCount = (examVal, subjVal, topicVal, subtopicVal, diffVal) => {
        if (api && typeof api.selectEligibleQuestionsForTest === 'function') {
          const probe = api.selectEligibleQuestionsForTest({
            testId: 'probe_preview',
            examCode: examVal || 'CGPSC',
            subject: subjVal && subjVal !== 'ALL' ? subjVal : '',
            topicFilter: topicVal || '',
            subtopicFilter: subtopicVal && subtopicVal !== 'ALL' ? subtopicVal : '',
            difficulty: diffVal && diffVal !== 'ALL' ? diffVal : '',
            count: 0
          });
          return probe.availableEligibleCount || 0;
        }
        return (state.questionBank || []).length;
      };

      const initialEligibleCount = computeLiveEligiblePoolCount(
        tbState.examCode,
        tbState.subjectFilter,
        tbState.topicFilter || '',
        tbState.subtopicFilter || 'ALL',
        tbState.difficultyFilter
      );

      bodyEl.innerHTML = `
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
            <h3 style="font-size:1.05rem;font-weight:800;">📝 3-Stage Test Builder (Create as Draft → Review/Edit → Publish)</h3>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span class="badge badge-free" id="admTestEligibleCountBadge" title="Verified, categorised, non-deleted, non-duplicate questions in Central Question Bank matching current filters">
                ✅ ${initialEligibleCount} Eligible Verified Question(s) Available
              </span>
              <span class="badge badge-review">Step 1: Saves as DRAFT</span>
            </div>
          </div>

          ${tbState.lastWarning ? `
            <div id="admTestBuilderWarningBanner" style="padding:12px 14px;border-radius:10px;background:var(--warning-soft);border:1.5px solid var(--warning);color:var(--text);margin-bottom:14px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
              <div>
                <div style="font-weight:800;font-size:0.88rem;color:var(--warning);">
                  ⚠️ Insufficient Eligible Questions in Central Question Bank (Available: ${tbState.lastWarning.availableCount} / Requested: ${tbState.lastWarning.requestedCount})
                </div>
                <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:3px;">
                  ${esc(tbState.lastWarning.message)}
                </div>
              </div>
              <button class="btn btn-outline btn-sm" id="admDismissTestWarningBtn">✕ Dismiss</button>
            </div>
          ` : ''}

          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Parent Test Series Folder</label>
              <select class="form-select" id="admTestFolderId">
                <option value="standalone">Standalone / Direct Exam Test</option>
                ${(state.folders || []).map((f) => `<option value="${esc(f.id)}">[${esc(f.examCode || 'CGPSC')}] ${esc(f.titleHi)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Exam Category</label>
              <select class="form-select" id="admTestExamCode">
                ${catalog.examCategories.map((ex) => `<option value="${esc(ex.code)}" ${tbState.examCode === ex.code ? 'selected' : ''}>${esc(ex.icon || '📘')} ${esc(ex.nameEn)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Test Title (Hindi)</label>
              <input class="form-input" id="admTestTitleHi" placeholder="उदा: CGPSC Prelims फुल लेंथ मॉक टेस्ट - 01" />
            </div>
            <div class="form-group">
              <label class="form-label">Test Title (English)</label>
              <input class="form-input" id="admTestTitleEn" placeholder="e.g., CGPSC Prelims Full Length Mock Test - 01" />
            </div>
            <div class="form-group">
              <label class="form-label">Subject, Topic, Subtopic &amp; Difficulty Filters</label>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr 115px;gap:6px;">
                <select class="form-select" id="admTestSubjectFilter" title="Filter automatic question selection by Subject">
                  <option value="ALL" ${tbState.subjectFilter === 'ALL' ? 'selected' : ''}>All Subjects</option>
                  ${repoSubjectsForTests.map((s) => `<option value="${esc(s)}" ${tbState.subjectFilter === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
                </select>
                <input class="form-input" id="admTestTopic" list="admTestTopicDatalist" value="${esc(tbState.topicFilter || '')}" placeholder="Topic (e.g., Ancient Indian History)" />
                <input class="form-input" id="admTestSubtopicFilter" list="admTestSubtopicDatalist" value="${esc(tbState.subtopicFilter && tbState.subtopicFilter !== 'ALL' ? tbState.subtopicFilter : '')}" placeholder="Subtopic (e.g., Maurya Empire)" />
                <select class="form-select" id="admTestDifficultyFilter" title="Filter automatic question selection by Difficulty">
                  <option value="ALL" ${tbState.difficultyFilter === 'ALL' ? 'selected' : ''}>All Difficulty</option>
                  <option value="Easy" ${tbState.difficultyFilter === 'Easy' ? 'selected' : ''}>Easy</option>
                  <option value="Moderate" ${tbState.difficultyFilter === 'Moderate' ? 'selected' : ''}>Moderate</option>
                  <option value="Hard" ${(tbState.difficultyFilter === 'Hard' || tbState.difficultyFilter === 'Difficult') ? 'selected' : ''}>Hard</option>
                </select>
                <datalist id="admTestTopicDatalist">
                  ${availableTopicsForTests.map((t) => `<option value="${esc(t)}"></option>`).join('')}
                </datalist>
                <datalist id="admTestSubtopicDatalist">
                  ${availableSubtopicsForTests.map((st) => `<option value="${esc(st)}"></option>`).join('')}
                </datalist>
              </div>
            </div>
            <div class="form-group" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
              <div>
                <label class="form-label">Duration (m)</label>
                <input type="number" class="form-input" id="admTestDuration" value="60" min="5" />
              </div>
              <div>
                <label class="form-label">+Marks/Q</label>
                <input type="number" step="0.5" class="form-input" id="admTestPosMarks" value="2" />
              </div>
              <div>
                <label class="form-label">-Neg Marks</label>
                <input type="number" step="0.01" class="form-input" id="admTestNegMarks" value="0.66" />
              </div>
              <div>
                <label class="form-label">Access</label>
                <select class="form-select" id="admTestIsPaid">
                  <option value="free">FREE</option>
                  <option value="paid">PAID</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Price (₹ if Paid) &amp; Validity Days</label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <input type="number" class="form-input" id="admTestPrice" value="49" placeholder="Price ₹" />
                <input type="number" class="form-input" id="admTestValidity" value="180" placeholder="Validity Days" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Auto-Select Verified Bilingual Questions (Customizable Count: 0 for Manual)</label>
              <div style="display:grid;grid-template-columns:110px 1fr;gap:8px;">
                <input type="number" class="form-input" id="admTestAiCount" value="10" min="0" max="200" />
                <input class="form-input" id="admTestAiPrompt" placeholder="Optional filter/instructions (auto-selects verified Central Bank &amp; PDF-imported questions)" />
              </div>
            </div>
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
            <button class="btn btn-primary" id="admCreateDraftTestBtn">💾 Create Test as DRAFT (With AI / Auto-Selected Questions)</button>
          </div>
        </div>

        <div class="card">
          <h3 style="font-size:1rem;font-weight:800;margin-bottom:12px;">📋 All Tests — Draft, Review &amp; Publish Queue (${(state.tests || []).length})</h3>
          ${(state.tests || []).length === 0 ? `
            <p style="font-size:0.86rem;color:var(--text-muted);">No tests created yet. Create your first Draft test above.</p>
          ` : `
            <div style="display:grid;gap:12px;">
              ${state.tests.map((t) => `
                <div style="padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--surface-alt);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                  <div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span class="badge ${t.status === 'published' ? 'badge-free' : 'badge-draft'}">${t.status === 'published' ? '🟢 PUBLISHED LIVE' : '📝 DRAFT (HIDDEN FROM STUDENTS)'}</span>
                      <span class="badge badge-exam">${esc(t.examCode || 'CGPSC')}</span>
                      ${t.subject ? `<span class="badge badge-review">${esc(t.subject)}</span>` : ''}
                      ${t.subtopic ? `<span class="badge badge-draft">Subtopic: ${esc(t.subtopic)}</span>` : ''}
                      ${t.difficulty && t.difficulty !== 'ALL' ? `<span class="badge badge-draft">${esc(t.difficulty)}</span>` : ''}
                      <span class="badge ${t.isPaid ? 'badge-paid' : 'badge-free'}">${t.isPaid ? '₹' + t.priceInr : 'FREE'}</span>
                      <span class="badge badge-draft">${(t.questions || []).length} Questions • ${t.durationMinutes}m</span>
                    </div>
                    <div style="font-weight:800;font-size:0.98rem;margin-top:5px;">${esc(t.titleHi)}</div>
                    <div style="font-size:0.8rem;color:var(--text-secondary);">${esc(t.titleEn)} — Topic: ${esc(t.topic)}</div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <button class="btn btn-outline btn-sm" data-manage-questions="${esc(t.id)}">✏️ Review / Add Questions (${(t.questions || []).length})</button>
                    <button class="btn ${t.status === 'published' ? 'btn-warning' : 'btn-success'} btn-sm" data-toggle-publish="${esc(t.id)}">
                      ${t.status === 'published' ? '⏸️ Unpublish to Draft' : '🚀 Publish Live'}
                    </button>
                    <button class="btn btn-danger btn-sm" data-delete-test="${esc(t.id)}">🗑️</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Integrated Test Series Package / Folder Manager inside Test Series Builder -->
        <div class="card">
          <h3 style="font-size:1.02rem;font-weight:800;margin-bottom:10px;">🏛️ Create &amp; Manage Test Series Packages / Folders (${(state.folders || []).length})</h3>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Exam Category / परीक्षा श्रेणी</label>
              <select class="form-select" id="admFolderExamCat">
                ${exams.map((ex) => `<option value="${esc(ex.code)}">${esc(ex.icon || '🏛️')} ${esc(ex.nameHi)} (${esc(ex.nameEn)})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Package Type</label>
              <select class="form-select" id="admFolderType">
                <option value="exam">Exam-Wise Full Test Series</option>
                <option value="subject">Subject / Topic-Wise Test Series</option>
                <option value="pyq">Previous Year Paper Series (PYQ)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Package Title (Hindi / मुख्य नाम)</label>
              <input class="form-input" id="admFolderTitleHi" placeholder="उदा: CGPSC Prelims 2026 सम्पूर्ण टेस्ट सीरीज़" />
            </div>
            <div class="form-group">
              <label class="form-label">Package Title (English)</label>
              <input class="form-input" id="admFolderTitleEn" placeholder="e.g., CGPSC Prelims 2026 Complete Test Series" />
            </div>
            <div class="form-group">
              <label class="form-label">Syllabus / Description</label>
              <input class="form-input" id="admFolderDesc" placeholder="Full GS + CSAT + Current Affairs Bilingual Series" />
            </div>
            <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
              <div>
                <label class="form-label">Access</label>
                <select class="form-select" id="admFolderIsPaid">
                  <option value="free">FREE</option>
                  <option value="paid">PAID (₹)</option>
                </select>
              </div>
              <div>
                <label class="form-label">Price (₹)</label>
                <input type="number" class="form-input" id="admFolderPrice" value="99" min="0" />
              </div>
              <div>
                <label class="form-label">Validity (Days)</label>
                <select class="form-select" id="admFolderValidity">
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                  <option value="180" selected>180 Days</option>
                  <option value="365">365 Days</option>
                </select>
              </div>
            </div>
          </div>
          <button class="btn btn-primary" id="admCreateFolderBtn" style="margin-bottom:14px;">➕ Save &amp; Publish Test Series Folder</button>

          ${(state.folders || []).length > 0 ? `
            <div style="display:grid;gap:8px;border-top:1px solid var(--border);padding-top:12px;">
              ${state.folders.map((f) => `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;flex-wrap:wrap;">
                  <div>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span class="badge badge-exam">${esc(f.examCode || 'CGPSC')}</span>
                      <span class="badge ${f.isPaid ? 'badge-paid' : 'badge-free'}">${f.isPaid ? 'PAID ₹' + f.priceInr + ' (' + f.validityDays + 'd)' : 'FREE'}</span>
                    </div>
                    <div style="font-weight:800;margin-top:4px;">${esc(f.titleHi)}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted);">${esc(f.titleEn)}</div>
                  </div>
                  <button class="btn btn-danger btn-sm" data-del-folder="${esc(f.id)}">🗑️ Delete</button>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;

      const updateLiveEligibleBadge = () => {
        const examEl = document.getElementById('admTestExamCode');
        const subjEl = document.getElementById('admTestSubjectFilter');
        const topicEl = document.getElementById('admTestTopic');
        const subtopicEl = document.getElementById('admTestSubtopicFilter');
        const diffEl = document.getElementById('admTestDifficultyFilter');
        const badgeEl = document.getElementById('admTestEligibleCountBadge');
        if (!badgeEl) return;
        const examVal = examEl ? examEl.value : 'CGPSC';
        const subjVal = subjEl ? subjEl.value : 'ALL';
        const topicVal = topicEl ? topicEl.value.trim() : '';
        const subtopicVal = subtopicEl ? subtopicEl.value.trim() : '';
        const diffVal = diffEl ? diffEl.value : 'ALL';
        tbState.examCode = examVal;
        tbState.subjectFilter = subjVal;
        tbState.topicFilter = topicVal;
        tbState.subtopicFilter = subtopicVal || 'ALL';
        tbState.difficultyFilter = diffVal;
        const cnt = computeLiveEligiblePoolCount(examVal, subjVal, topicVal, subtopicVal, diffVal);
        badgeEl.textContent = `✅ ${cnt} Eligible Verified Question(s) Available`;
      };

      ['admTestExamCode', 'admTestSubjectFilter', 'admTestDifficultyFilter'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.onchange = updateLiveEligibleBadge;
      });
      ['admTestTopic', 'admTestSubtopicFilter'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.oninput = updateLiveEligibleBadge;
      });

      const dismissWarnBtn = document.getElementById('admDismissTestWarningBtn');
      if (dismissWarnBtn) {
        dismissWarnBtn.onclick = () => {
          tbState.lastWarning = null;
          renderAdminConsole(rootEl, state, api);
        };
      }

      document.getElementById('admCreateDraftTestBtn').onclick = () => {
        const titleHi = document.getElementById('admTestTitleHi').value.trim();
        const titleEn = document.getElementById('admTestTitleEn').value.trim() || titleHi;
        const rawTopicInput = document.getElementById('admTestTopic').value.trim();
        const rawSubtopicInput = document.getElementById('admTestSubtopicFilter')
          ? document.getElementById('admTestSubtopicFilter').value.trim()
          : '';
        const selectedSubject = document.getElementById('admTestSubjectFilter')
          ? document.getElementById('admTestSubjectFilter').value
          : 'ALL';
        const selectedDifficulty = document.getElementById('admTestDifficultyFilter')
          ? document.getElementById('admTestDifficultyFilter').value
          : 'ALL';
        const examCode = document.getElementById('admTestExamCode').value || 'CGPSC';
        const topic = rawTopicInput || (selectedSubject !== 'ALL' ? selectedSubject : titleHi);

        if (!titleHi) {
          api.toast('कृपया टेस्ट का शीर्षक (Title) दर्ज करें।');
          return;
        }
        const aiCount = Math.max(0, Math.min(200, Number(document.getElementById('admTestAiCount').value || 0)));
        const customPrompt = document.getElementById('admTestAiPrompt').value.trim();
        const isPaid = document.getElementById('admTestIsPaid').value === 'paid';
        const testId = 'test_' + Date.now();

        let generatedQuestions = [];
        let selectionResult = null;

        if (aiCount > 0) {
          if (api && typeof api.selectEligibleQuestionsForTest === 'function') {
            selectionResult = api.selectEligibleQuestionsForTest({
              testId,
              examCode,
              subject: selectedSubject !== 'ALL' ? selectedSubject : '',
              topicFilter: rawTopicInput,
              subtopicFilter: rawSubtopicInput,
              topic,
              difficulty: selectedDifficulty !== 'ALL' ? selectedDifficulty : '',
              count: aiCount,
              customPrompt
            });
            generatedQuestions = selectionResult.questions || [];
          } else {
            generatedQuestions = api.generateHighYieldBilingualQuestions(testId, topic, aiCount, customPrompt, {
              examCode,
              subject: selectedSubject !== 'ALL' ? selectedSubject : '',
              topicFilter: rawTopicInput,
              subtopicFilter: rawSubtopicInput,
              difficulty: selectedDifficulty !== 'ALL' ? selectedDifficulty : ''
            });
          }
        }

        if (selectionResult && selectionResult.insufficient) {
          tbState.lastWarning = {
            requestedCount: selectionResult.requestedCount,
            availableCount: selectionResult.availableEligibleCount,
            selectedCount: selectionResult.selectedCount,
            message: selectionResult.warningMessage
          };
        } else {
          tbState.lastWarning = null;
        }

        const resolvedHierarchy = catalog.resolveHierarchy({
          examCode,
          subjectTag: selectedSubject !== 'ALL' ? selectedSubject : '',
          topic: rawTopicInput,
          subtopic: rawSubtopicInput
        });

        const newTest = {
          id: testId,
          folderId: document.getElementById('admTestFolderId').value || 'standalone',
          examCode,
          examId: resolvedHierarchy.examIds[0] || examCode,
          subjectId: resolvedHierarchy.subjectId || '',
          subject: selectedSubject !== 'ALL' ? selectedSubject : '',
          topicId: resolvedHierarchy.topicId || '',
          topic,
          subtopicId: resolvedHierarchy.subtopicId || '',
          subtopic: rawSubtopicInput || '',
          difficulty: selectedDifficulty !== 'ALL' ? selectedDifficulty : 'ALL',
          difficultyLevel: selectedDifficulty !== 'ALL' ? selectedDifficulty : 'ALL',
          titleHi,
          titleEn,
          requestedQuestionCount: aiCount,
          durationMinutes: Math.max(5, Number(document.getElementById('admTestDuration').value || 60)),
          marksPerQuestion: Number(document.getElementById('admTestPosMarks').value || 2),
          negativeMarking: Number(document.getElementById('admTestNegMarks').value || 0.66),
          isPaid,
          priceInr: isPaid ? Math.max(1, Number(document.getElementById('admTestPrice').value || 49)) : 0,
          validityDays: Number(document.getElementById('admTestValidity').value || 180),
          status: 'draft',
          questions: generatedQuestions,
          createdAtIso: new Date().toISOString()
        };

        state.tests.unshift(newTest);
        api.saveState();
        if (window.CGpediaCloud) {
          window.CGpediaCloud.saveCloudDoc('tests', newTest.id, newTest);
        }

        if (selectionResult && selectionResult.insufficient) {
          api.toast(selectionResult.warningMessage);
        } else {
          api.toast(`📝 Test saved as DRAFT with ${generatedQuestions.length} verified bilingual question(s). Review & click Publish when ready!`);
        }
        renderAdminConsole(rootEl, state, api);
      };

      bodyEl.querySelectorAll('[data-toggle-publish]').forEach((btn) => {
        btn.onclick = () => {
          const tid = btn.getAttribute('data-toggle-publish');
          const t = state.tests.find((item) => item.id === tid);
          if (!t) return;
          if (t.status !== 'published' && (!t.questions || t.questions.length === 0)) {
            api.toast('⚠️ पब्लिश करने से पहले कम से कम 1 प्रश्न जोड़ें।');
            return;
          }
          t.status = t.status === 'published' ? 'draft' : 'published';
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('tests', t.id, t);
          api.toast(t.status === 'published' ? '🚀 Test is now PUBLISHED LIVE for students!' : '⏸️ Test moved back to DRAFT.');
          renderAdminConsole(rootEl, state, api);
        };
      });

      bodyEl.querySelectorAll('[data-delete-test]').forEach((btn) => {
        btn.onclick = () => {
          const tid = btn.getAttribute('data-delete-test');
          state.tests = state.tests.filter((item) => item.id !== tid);
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.deleteCloudDoc('tests', tid);
          api.toast('🗑️ Test deleted.');
          renderAdminConsole(rootEl, state, api);
        };
      });

      bodyEl.querySelectorAll('[data-manage-questions]').forEach((btn) => {
        btn.onclick = () => {
          const tid = btn.getAttribute('data-manage-questions');
          api.openQuestionEditorModal(tid, () => renderAdminConsole(rootEl, state, api));
        };
      });

      const createFolderBtn = document.getElementById('admCreateFolderBtn');
      if (createFolderBtn) {
        createFolderBtn.onclick = () => {
          const titleHi = document.getElementById('admFolderTitleHi').value.trim();
          const titleEn = document.getElementById('admFolderTitleEn').value.trim() || titleHi;
          if (!titleHi) {
            api.toast('कृपया टेस्ट सीरीज़ फ़ोल्डर का नाम दर्ज करें।');
            return;
          }
          const isPaid = document.getElementById('admFolderIsPaid').value === 'paid';
          const folderObj = {
            id: 'fld_' + Date.now(),
            examCode: document.getElementById('admFolderExamCat').value || 'CGPSC',
            folderType: document.getElementById('admFolderType').value || 'exam',
            titleHi,
            titleEn,
            descriptionHi: document.getElementById('admFolderDesc').value.trim() || titleHi,
            descriptionEn: document.getElementById('admFolderDesc').value.trim() || titleEn,
            isPaid,
            isFreeFolder: !isPaid,
            priceInr: isPaid ? Math.max(1, Number(document.getElementById('admFolderPrice').value || 99)) : 0,
            validityDays: Number(document.getElementById('admFolderValidity').value || 180),
            visibility: 'published',
            createdAtIso: new Date().toISOString()
          };
          state.folders.unshift(folderObj);
          api.saveState();
          if (window.CGpediaCloud) {
            window.CGpediaCloud.saveCloudDoc('exam_folders', folderObj.id, folderObj);
          }
          api.toast('✅ Test Series Folder created & synced to Firebase!');
          renderAdminConsole(rootEl, state, api);
        };
      }

      bodyEl.querySelectorAll('[data-del-folder]').forEach((btn) => {
        btn.onclick = () => {
          const fid = btn.getAttribute('data-del-folder');
          state.folders = state.folders.filter((f) => f.id !== fid);
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.deleteCloudDoc('exam_folders', fid);
          api.toast('🗑️ Folder removed.');
          renderAdminConsole(rootEl, state, api);
        };
      });
      return;
    }

    if (activeSection === 'qbank') {
      renderQuestionBankManagement(bodyEl, rootEl, state, api);
      return;
    }

    if (activeSection === 'students') {
      const stuSearch = String(state._adminStudentSearch || '').trim().toLowerCase();
      const filteredStudents = allRegisteredStudents.filter((s) => {
        if (!stuSearch) return true;
        return (
          String(s.name || '').toLowerCase().includes(stuSearch) ||
          String(s.email || '').toLowerCase().includes(stuSearch) ||
          String(s.uid || '').toLowerCase().includes(stuSearch) ||
          String(s.phone || '').toLowerCase().includes(stuSearch)
        );
      });

      bodyEl.innerHTML = `
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-value">${allRegisteredStudents.length}</div>
            <div class="kpi-label">Registered Students</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value" style="color:var(--success);">${(state.activations || []).length}</div>
            <div class="kpi-label">Active Package Unlocks</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value" style="color:var(--secondary);">${(state.attempts || []).length}</div>
            <div class="kpi-label">Total CBT Exam Attempts</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value" style="color:var(--warning);">${(state.queries || []).length}</div>
            <div class="kpi-label">Student Support Queries</div>
          </div>
        </div>

        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
            <div>
              <h3 style="font-size:1.05rem;font-weight:800;">👥 Registered Student Directory &amp; Access Control (${filteredStudents.length})</h3>
              <p style="font-size:0.78rem;color:var(--text-secondary);">View student accounts, exam attempts, unlocked packages, and grant package access.</p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;min-width:260px;">
              <input class="form-input" id="admStudentSearchInput" value="${esc(state._adminStudentSearch || '')}" placeholder="🔍 Search student by Name, Email, UID or Phone..." style="padding:7px 11px;font-size:0.82rem;" />
            </div>
          </div>

          ${filteredStudents.length === 0 ? `
            <p style="font-size:0.85rem;color:var(--text-muted);padding:16px 0;">No matching student records found.</p>
          ` : `
            <div style="display:grid;gap:10px;">
              ${filteredStudents.map((stu) => {
                const emailLow = String(stu.email || '').toLowerCase();
                const uidLow = String(stu.uid || '').toLowerCase();
                const stuActivations = (state.activations || []).filter((a) => {
                  const idLow = String(a.studentIdentifier || '').toLowerCase();
                  return (emailLow && idLow === emailLow) || (uidLow && idLow === uidLow);
                });
                const stuOrders = (state.orders || []).filter((o) => {
                  const oEmail = String(o.studentEmail || o.studentIdentifier || '').toLowerCase();
                  const oUid = String(o.uid || o.studentIdentifier || '').toLowerCase();
                  return (emailLow && oEmail === emailLow) || (uidLow && oUid === uidLow);
                });
                const stuAttempts = (state.attempts || []).filter((at) => {
                  const atEmail = String(at.studentEmail || '').toLowerCase();
                  const atUid = String(at.studentUid || at.uid || '').toLowerCase();
                  return (emailLow && atEmail === emailLow) || (uidLow && atUid === uidLow);
                });

                return `
                  <div style="padding:12px 14px;border:1px solid var(--border);border-radius:10px;background:var(--surface-alt);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                    <div>
                      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        <strong style="font-size:0.94rem;">${esc(stu.name || 'Aspirant')}</strong>
                        <span class="badge badge-cloud">UID: ${esc(stu.uid || '-')}</span>
                        ${stuActivations.length > 0 ? `<span class="badge badge-free">🔓 ${stuActivations.length} Unlocked Package(s)</span>` : `<span class="badge badge-draft">Free Tier</span>`}
                        ${stuOrders.some((o) => String(o.status || 'pending').toLowerCase() === 'pending') ? `<span class="badge badge-paid">⏳ Pending Payment</span>` : ''}
                      </div>
                      <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;">
                        📧 Email: <strong>${esc(stu.email || 'Not provided')}</strong>
                        ${stu.phone ? ` • 📱 Phone: <strong>${esc(stu.phone)}</strong>` : ''}
                        • 📝 Attempts: <strong>${stuAttempts.length}</strong>
                      </div>
                      ${stuActivations.length > 0 ? `
                        <div style="font-size:0.74rem;color:var(--success);margin-top:3px;font-weight:700;">
                          Active Packages: ${stuActivations.map((a) => esc(a.targetTitle)).join(', ')}
                        </div>
                      ` : ''}
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                      <button class="btn btn-success btn-sm" data-stu-quick-unlock="${esc(stu.email || stu.uid)}">🔓 Unlock Package</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;

      const stuSearchInput = document.getElementById('admStudentSearchInput');
      if (stuSearchInput) {
        stuSearchInput.oninput = () => {
          state._adminStudentSearch = stuSearchInput.value;
          renderAdminConsole(rootEl, state, api);
          const reInput = document.getElementById('admStudentSearchInput');
          if (reInput) {
            reInput.focus();
            reInput.setSelectionRange(reInput.value.length, reInput.value.length);
          }
        };
      }

      bodyEl.querySelectorAll('[data-stu-quick-unlock]').forEach((btn) => {
        btn.onclick = () => {
          state._prefillUnlockStudent = btn.getAttribute('data-stu-quick-unlock') || '';
          state.adminSection = 'payments';
          api.saveState();
          renderAdminConsole(rootEl, state, api);
        };
      });
      return;
    }

    if (activeSection === 'payments') {
      const allPackages = [
        ...(state.folders || []).filter((f) => f.isPaid).map((f) => ({ id: f.id, title: `[Series] ${f.titleHi}`, price: f.priceInr, validityDays: f.validityDays || 180 })),
        ...(state.tests || []).filter((t) => t.isPaid).map((t) => ({ id: t.id, title: `[Test] ${t.titleHi}`, price: t.priceInr, validityDays: t.validityDays || 180 }))
      ];

      const currentQrImage = String(state.config.upiQrImage || '').trim();
      const currentUpiId = String(state.config.upiId || '').trim();
      const currentWhatsapp = String(state.config.whatsappNumber || state.config.whatsappSupportNumber || '').trim();
      const currentInstrHi = String(state.config.paymentInstructionsHi || 'QR कोड स्कैन करके या UPI ID पर पेमेंट करें, पेमेंट का स्क्रीनशॉट लें और एक्टिवेशन के लिए नीचे दिए गए WhatsApp बटन पर क्लिक करके या पेमेंट रिकॉर्ड सबमिट करके विवरण भेजें।').trim();
      const currentInstrEn = String(state.config.paymentInstructionsEn || 'Scan the QR Code or pay via the configured UPI ID, take a payment screenshot, and click the WhatsApp button below or submit your payment verification details for package activation.').trim();

      const payFilter = state._adminPayRecordFilter || 'ALL';
      const allOrders = Array.isArray(state.orders) ? state.orders : [];
      const filteredOrders = allOrders.filter((ord) => {
        if (payFilter === 'ALL') return true;
        return String(ord.status || 'pending').toLowerCase() === payFilter.toLowerCase();
      });

      const pendingCount = allOrders.filter((o) => String(o.status || 'pending').toLowerCase() === 'pending').length;
      const approvedCount = allOrders.filter((o) => String(o.status || '').toLowerCase() === 'approved').length;
      const rejectedCount = allOrders.filter((o) => String(o.status || '').toLowerCase() === 'rejected').length;

      bodyEl.innerHTML = `
        <div class="grid-2">
          <!-- 1. Complete Payment Configuration (QR Upload, Preview, Replace/Delete, UPI ID + Copy, WhatsApp, Instructions) -->
          <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
              <h3 style="font-size:1rem;font-weight:800;">📲 Payment Configuration (UPI QR, UPI ID, WhatsApp &amp; Instructions)</h3>
              <span class="badge badge-cloud">Dynamic Firebase Sync</span>
            </div>

            <!-- Live QR Code Preview + Upload / Replace / Delete Controls -->
            <div style="padding:12px;border:1.5px dashed var(--border-strong);border-radius:10px;background:var(--surface-alt);text-align:center;margin-bottom:12px;">
              <div style="font-size:0.76rem;font-weight:800;color:var(--text-secondary);margin-bottom:8px;">UPI QR Code Preview (Shown to Students)</div>
              <div id="admQrLivePreviewBox">
                ${currentQrImage ? `
                  <img src="${esc(currentQrImage)}" alt="Uploaded UPI QR Code Preview" style="max-width:185px;max-height:185px;border-radius:10px;border:2px solid #fff;box-shadow:var(--shadow-sm);margin:0 auto 10px;display:block;object-fit:contain;" />
                ` : `
                  <div style="padding:18px 10px;font-size:0.8rem;color:var(--text-muted);">
                    No UPI QR Code image uploaded yet. Upload an image below or paste an image URL.
                  </div>
                `}
              </div>
              <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:6px;">
                <label class="btn btn-outline btn-sm" style="cursor:pointer;margin:0;">
                  ${currentQrImage ? '🔄 Replace QR Code Image' : '📤 Upload UPI QR Code Image'}
                  <input type="file" accept="image/*" id="admQrGalleryFileInput" style="display:none;" />
                </label>
                ${currentQrImage ? `
                  <button type="button" class="btn btn-danger btn-sm" id="admDeleteQrCodeBtn">🗑️ Delete QR Code</button>
                ` : ''}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">UPI QR Image URL / Data URL</label>
              <input class="form-input" id="admQrUrlInput" value="${esc(currentQrImage)}" placeholder="Paste QR Code Image URL or upload from device above..." />
            </div>

            <div class="grid-2" style="gap:8px;">
              <div class="form-group">
                <label class="form-label">Official UPI ID</label>
                <div style="display:flex;gap:6px;">
                  <input class="form-input" id="admUpiIdInput" value="${esc(currentUpiId)}" placeholder="e.g., merchant@upi" />
                  <button type="button" class="btn btn-outline btn-sm" id="admCopyUpiIdBtn" title="Copy UPI ID">📋 Copy</button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">WhatsApp Contact Number</label>
                <input class="form-input" id="admWhatsappInput" value="${esc(currentWhatsapp)}" placeholder="e.g., 10-digit WhatsApp number" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Payment Instructions for Students (Hindi / हिन्दी निर्देश)</label>
              <textarea class="form-textarea" id="admPayInstrHiInput" rows="2" placeholder="छात्रों के लिए पेमेंट निर्देश (हिन्दी में)...">${esc(currentInstrHi)}</textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Payment Instructions for Students (English)</label>
              <textarea class="form-textarea" id="admPayInstrEnInput" rows="2" placeholder="Payment instructions for students in English...">${esc(currentInstrEn)}</textarea>
            </div>

            <button class="btn btn-primary" id="admSavePaymentConfigBtn" style="width:100%;">💾 Save &amp; Update Payment Settings in Firebase</button>
          </div>

          <!-- 2. Strict Activation-Based Validity Unlock for Student -->
          <div class="card">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">🔓 Activate Paid Package for Student (Countdown Starts Now)</h3>
            <div class="form-group">
              <label class="form-label">Student Registered Email ID or User ID</label>
              <input class="form-input" id="admUnlockStudentIdentifier" value="${esc(state._prefillUnlockStudent || '')}" placeholder="student@gmail.com or STU-XXXX" />
            </div>
            <div class="form-group">
              <label class="form-label">Select Paid Test Series or Test</label>
              <select class="form-select" id="admUnlockPackageSelect">
                ${allPackages.length === 0 ? `<option value="">No Paid Series/Tests Created Yet</option>` : allPackages.map((p) => `<option value="${esc(p.id)}" data-validity="${p.validityDays}" data-price="${p.price}" data-title="${esc(p.title)}">${esc(p.title)} — ₹${p.price} (${p.validityDays} Days)</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label class="form-label">Validity Days Override</label>
                <input type="number" class="form-input" id="admUnlockValidityDays" value="180" min="1" />
              </div>
              <div>
                <label class="form-label">Amount Paid (₹)</label>
                <input type="number" class="form-input" id="admUnlockAmountPaid" value="99" min="0" />
              </div>
            </div>
            <button class="btn btn-success" id="admActivateStudentAccessBtn" style="width:100%;">✅ Activate Student Access Now</button>

            <!-- Discount Coupons Manager inside right column -->
            <div style="border-top:1px solid var(--border);margin-top:16px;padding-top:14px;">
              <h4 style="font-size:0.94rem;font-weight:800;margin-bottom:8px;">🎟️ Discount Coupons Manager</h4>
              <div style="display:grid;grid-template-columns:1fr 90px 1fr auto;gap:6px;align-items:end;margin-bottom:10px;">
                <div>
                  <label class="form-label" style="font-size:0.74rem;">Code</label>
                  <input class="form-input" id="admCouponCode" placeholder="CGPSC50" style="padding:6px 8px;font-size:0.8rem;" />
                </div>
                <div>
                  <label class="form-label" style="font-size:0.74rem;">Discount %</label>
                  <input type="number" class="form-input" id="admCouponPercent" value="25" min="1" max="100" style="padding:6px 8px;font-size:0.8rem;" />
                </div>
                <div>
                  <label class="form-label" style="font-size:0.74rem;">Description</label>
                  <input class="form-input" id="admCouponDesc" placeholder="Scholarship Offer" style="padding:6px 8px;font-size:0.8rem;" />
                </div>
                <button class="btn btn-navy btn-sm" id="admCreateCouponBtn">➕ Add</button>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${(state.coupons || []).map((c) => `
                  <span class="badge badge-paid" style="padding:5px 10px;font-size:0.76rem;">
                    🎟️ <strong>${esc(c.code)}</strong> (${c.discountPercent}% OFF)
                    <button data-del-coupon="${esc(c.id)}" style="background:none;border:none;color:var(--danger);cursor:pointer;margin-left:5px;font-weight:800;">✕</button>
                  </span>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Student Payment Records & Verification Workflow (Pending / Approved / Rejected) -->
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
            <div>
              <h3 style="font-size:1.02rem;font-weight:800;">🧾 Student Payment Records &amp; Approval Workflow (${allOrders.length})</h3>
              <p style="font-size:0.78rem;color:var(--text-secondary);">Verify student UPI transaction references (UTR) and manage Pending, Approved, or Rejected payment records.</p>
            </div>
            <div class="chip-row" style="margin:0;">
              <button class="filter-chip ${payFilter === 'ALL' ? 'active' : ''}" data-pay-status-filter="ALL">All (${allOrders.length})</button>
              <button class="filter-chip ${payFilter === 'pending' ? 'active' : ''}" data-pay-status-filter="pending">⏳ Pending (${pendingCount})</button>
              <button class="filter-chip ${payFilter === 'approved' ? 'active' : ''}" data-pay-status-filter="approved">✅ Approved (${approvedCount})</button>
              <button class="filter-chip ${payFilter === 'rejected' ? 'active' : ''}" data-pay-status-filter="rejected">❌ Rejected (${rejectedCount})</button>
            </div>
          </div>

          ${filteredOrders.length === 0 ? `
            <p style="font-size:0.84rem;color:var(--text-muted);">No student payment records in this status filter.</p>
          ` : `
            <div style="display:grid;gap:10px;">
              ${filteredOrders.map((ord) => {
                const st = String(ord.status || 'pending').toLowerCase();
                const badgeCls = st === 'approved' ? 'badge-free' : (st === 'rejected' ? 'badge-live' : 'badge-paid');
                const stText = st === 'approved' ? 'APPROVED ✅' : (st === 'rejected' ? 'REJECTED ❌' : 'PENDING ⏳');
                return `
                  <div style="padding:12px 14px;border:1px solid var(--border);border-radius:10px;background:var(--surface-alt);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                    <div>
                      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        <span class="badge ${badgeCls}">${stText}</span>
                        <strong>${esc(ord.targetTitle || 'Paid Package')}</strong>
                        <span class="badge badge-exam">₹${Number(ord.amountPaid || 0)}</span>
                        ${ord.validityDays ? `<span class="badge badge-draft">${Number(ord.validityDays)} Days</span>` : ''}
                      </div>
                      <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;">
                        👤 Student: <strong>${esc(ord.studentName || 'Student')}</strong>
                        • 📧 Email/ID: <strong>${esc(ord.studentEmail || ord.studentIdentifier || ord.uid || '-')}</strong>
                        ${ord.studentPhone ? ` • 📱 Phone: <strong>${esc(ord.studentPhone)}</strong>` : ''}
                      </div>
                      <div style="font-size:0.76rem;color:var(--text-secondary);margin-top:2px;">
                        🔢 UTR / Ref: <code>${esc(ord.transactionRef || '-')}</code>
                        • 🕒 Date: ${ord.createdAtMs ? new Date(ord.createdAtMs).toLocaleString() : (ord.createdAtIso || '-')}
                        ${ord.note ? ` • Note: ${esc(ord.note)}` : ''}
                      </div>
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                      ${st !== 'approved' ? `
                        <button class="btn btn-success btn-sm" data-order-status-action="approved" data-order-id="${esc(ord.id)}">✅ Approve &amp; Unlock</button>
                      ` : ''}
                      ${st !== 'pending' ? `
                        <button class="btn btn-outline btn-sm" data-order-status-action="pending" data-order-id="${esc(ord.id)}">⏳ Mark Pending</button>
                      ` : ''}
                      ${st !== 'rejected' ? `
                        <button class="btn btn-danger btn-sm" data-order-status-action="rejected" data-order-id="${esc(ord.id)}">❌ Reject</button>
                      ` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- 4. Active Student Unlocks Table -->
        <div class="card">
          <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">📋 Active Student Unlocks &amp; Exact Validity Countdowns (${(state.activations || []).length})</h3>
          ${(state.activations || []).length === 0 ? `
            <p style="font-size:0.84rem;color:var(--text-muted);">No paid activations yet.</p>
          ` : `
            <div style="display:grid;gap:8px;">
              ${state.activations.map((act) => {
                const remMs = Number(act.expiresAtMs || 0) - Date.now();
                const remDays = Math.max(0, Math.ceil(remMs / 86400000));
                const expired = remMs <= 0;
                return `
                  <div style="padding:10px 12px;border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                    <div>
                      <span class="badge ${expired ? 'badge-live' : 'badge-free'}">${expired ? 'EXPIRED' : 'ACTIVE • ' + remDays + ' Days Left'}</span>
                      <strong style="margin-left:6px;">${esc(act.targetTitle)}</strong>
                      <div style="font-size:0.76rem;color:var(--text-secondary);margin-top:2px;">
                        Student: <strong>${esc(act.studentIdentifier)}</strong> • Amount: ₹${Number(act.amountPaid || 0)} • Activated: ${new Date(act.activatedAtMs).toLocaleString()} • Expires: ${new Date(act.expiresAtMs).toLocaleDateString()}
                      </div>
                    </div>
                    <button class="btn btn-danger btn-sm" data-revoke-activation="${esc(act.id)}">Revoke</button>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;

      const qrFileInput = document.getElementById('admQrGalleryFileInput');
      if (qrFileInput) {
        qrFileInput.onchange = () => {
          if (!qrFileInput.files || !qrFileInput.files[0]) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            state.config.upiQrImage = String(ev.target.result || '');
            const urlInp = document.getElementById('admQrUrlInput');
            if (urlInp) urlInp.value = state.config.upiQrImage;
            api.saveState();
            if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('app_config', 'global', state.config);
            api.toast('📷 UPI QR Code uploaded, preview updated & synced to Firebase!');
            renderAdminConsole(rootEl, state, api);
          };
          reader.readAsDataURL(qrFileInput.files[0]);
        };
      }

      const qrUrlInput = document.getElementById('admQrUrlInput');
      if (qrUrlInput) {
        qrUrlInput.oninput = () => {
          const val = qrUrlInput.value.trim();
          const previewBox = document.getElementById('admQrLivePreviewBox');
          if (previewBox) {
            previewBox.innerHTML = val
              ? `<img src="${esc(val)}" alt="Uploaded UPI QR Code Preview" style="max-width:185px;max-height:185px;border-radius:10px;border:2px solid #fff;box-shadow:var(--shadow-sm);margin:0 auto 10px;display:block;object-fit:contain;" />`
              : `<div style="padding:18px 10px;font-size:0.8rem;color:var(--text-muted);">No UPI QR Code image uploaded yet. Upload an image below or paste an image URL.</div>`;
          }
        };
      }

      const delQrBtn = document.getElementById('admDeleteQrCodeBtn');
      if (delQrBtn) {
        delQrBtn.onclick = () => {
          state.config.upiQrImage = '';
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('app_config', 'global', state.config);
          api.toast('🗑️ UPI QR Code deleted from configuration.');
          renderAdminConsole(rootEl, state, api);
        };
      }

      const copyUpiBtn = document.getElementById('admCopyUpiIdBtn');
      if (copyUpiBtn) {
        copyUpiBtn.onclick = () => {
          const val = (document.getElementById('admUpiIdInput').value || '').trim();
          if (!val) {
            api.toast('⚠️ No UPI ID entered yet.');
            return;
          }
          try { navigator.clipboard.writeText(val); } catch (_) {}
          api.toast('📋 UPI ID copied: ' + val);
        };
      }

      document.getElementById('admSavePaymentConfigBtn').onclick = () => {
        state.config.upiQrImage = document.getElementById('admQrUrlInput').value.trim();
        state.config.upiId = document.getElementById('admUpiIdInput').value.trim();
        state.config.whatsappNumber = document.getElementById('admWhatsappInput').value.trim();
        state.config.whatsappSupportNumber = state.config.whatsappNumber;
        state.config.paymentInstructionsHi = document.getElementById('admPayInstrHiInput').value.trim();
        state.config.paymentInstructionsEn = document.getElementById('admPayInstrEnInput').value.trim();
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('app_config', 'global', state.config);
        api.toast('✅ Payment Settings (QR Code, UPI ID, WhatsApp & Instructions) saved to Firebase!');
        renderAdminConsole(rootEl, state, api);
      };

      bodyEl.querySelectorAll('[data-pay-status-filter]').forEach((btn) => {
        btn.onclick = () => {
          state._adminPayRecordFilter = btn.getAttribute('data-pay-status-filter') || 'ALL';
          renderAdminConsole(rootEl, state, api);
        };
      });

      bodyEl.querySelectorAll('[data-order-status-action]').forEach((btn) => {
        btn.onclick = () => {
          const actionStatus = btn.getAttribute('data-order-status-action');
          const ordId = btn.getAttribute('data-order-id');
          const ord = (state.orders || []).find((o) => o.id === ordId);
          if (!ord) return;
          ord.status = actionStatus;
          ord.updatedAtMs = Date.now();
          if (window.CGpediaCloud) {
            window.CGpediaCloud.saveCloudDoc('orders', ord.id, ord);
          }

          if (actionStatus === 'approved') {
            const studentId = String(ord.studentEmail || ord.studentIdentifier || ord.uid || '').trim().toLowerCase();
            const validityDays = Math.max(1, Number(ord.validityDays || 180));
            const nowMs = Date.now();
            const alreadyUnlocked = (state.activations || []).some(
              (a) => String(a.studentIdentifier || '').toLowerCase() === studentId && a.targetId === ord.targetId && Number(a.expiresAtMs || 0) > nowMs
            );
            if (studentId && !alreadyUnlocked) {
              const actObj = {
                id: 'act_' + nowMs,
                studentIdentifier: studentId,
                targetId: ord.targetId || 'custom_package',
                targetTitle: ord.targetTitle || 'Paid Package',
                validityDays,
                amountPaid: Number(ord.amountPaid || 0),
                orderId: ord.id,
                activatedAtMs: nowMs,
                expiresAtMs: nowMs + validityDays * 86400000
              };
              state.activations = state.activations || [];
              state.activations.unshift(actObj);
              if (window.CGpediaCloud) {
                window.CGpediaCloud.saveCloudDoc('purchases', actObj.id, actObj);
              }
            }
            api.toast(`✅ Payment approved & package unlocked for ${studentId || ord.studentName}!`);
          } else if (actionStatus === 'rejected') {
            api.toast('❌ Payment record marked as Rejected.');
          } else {
            api.toast('⏳ Payment record marked as Pending.');
          }
          api.saveState();
          renderAdminConsole(rootEl, state, api);
        };
      });

      document.getElementById('admActivateStudentAccessBtn').onclick = () => {
        const studentId = document.getElementById('admUnlockStudentIdentifier').value.trim().toLowerCase();
        const pkgSel = document.getElementById('admUnlockPackageSelect');
        if (!studentId || !pkgSel.value) {
          api.toast('कृपया छात्र का Email/User ID और पैकेज चुनें।');
          return;
        }
        const opt = pkgSel.options[pkgSel.selectedIndex];
        const validityDays = Math.max(1, Number(document.getElementById('admUnlockValidityDays').value || opt.getAttribute('data-validity') || 180));
        const amountPaid = Math.max(0, Number(document.getElementById('admUnlockAmountPaid').value || opt.getAttribute('data-price') || 99));
        const nowMs = Date.now();
        const actObj = {
          id: 'act_' + nowMs,
          studentIdentifier: studentId,
          targetId: pkgSel.value,
          targetTitle: opt.getAttribute('data-title') || 'Paid Package',
          validityDays,
          amountPaid,
          activatedAtMs: nowMs,
          expiresAtMs: nowMs + validityDays * 86400000
        };
        state.activations.unshift(actObj);
        state._prefillUnlockStudent = '';
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('purchases', actObj.id, actObj);
        api.toast(`🔓 Access activated for ${studentId}! Validity (${validityDays} days) countdown started.`);
        renderAdminConsole(rootEl, state, api);
      };

      document.getElementById('admCreateCouponBtn').onclick = () => {
        const code = document.getElementById('admCouponCode').value.trim().toUpperCase();
        const pct = Math.max(1, Math.min(100, Number(document.getElementById('admCouponPercent').value || 20)));
        if (!code) return;
        const cObj = {
          id: 'cpn_' + Date.now(),
          code,
          discountPercent: pct,
          description: document.getElementById('admCouponDesc').value.trim() || `${pct}% Discount`
        };
        state.coupons = state.coupons || [];
        state.coupons.push(cObj);
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('coupons', cObj.id, cObj);
        renderAdminConsole(rootEl, state, api);
      };

      bodyEl.querySelectorAll('[data-del-coupon]').forEach((btn) => {
        btn.onclick = () => {
          const cid = btn.getAttribute('data-del-coupon');
          state.coupons = (state.coupons || []).filter((c) => c.id !== cid);
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.deleteCloudDoc('coupons', cid);
          renderAdminConsole(rootEl, state, api);
        };
      });

      bodyEl.querySelectorAll('[data-revoke-activation]').forEach((btn) => {
        btn.onclick = () => {
          const aid = btn.getAttribute('data-revoke-activation');
          state.activations = state.activations.filter((a) => a.id !== aid);
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.deleteCloudDoc('purchases', aid);
          renderAdminConsole(rootEl, state, api);
        };
      });
      return;
    }

    if (activeSection === 'stories') {
      bodyEl.innerHTML = `
        <div class="card">
          <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">⚡ Publish 24-Hour Current Affairs Story &amp; Daily Quiz</h3>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" id="admCaCategory">
                <option value="chhattisgarh">छत्तीसगढ़ समसामयिकी (Chhattisgarh)</option>
                <option value="national">राष्ट्रीय समसामयिकी (National)</option>
                <option value="international">अंतर्राष्ट्रीय एवं विज्ञान (International &amp; Sci)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Source Name</label>
              <input class="form-input" id="admCaSource" value="PIB / DPR Chhattisgarh" />
            </div>
            <div class="form-group">
              <label class="form-label">Headline (Hindi)</label>
              <input class="form-input" id="admCaHeadHi" placeholder="उदा: छत्तीसगढ़ आर्थिक सर्वेक्षण एवं नई योजनाएं" />
            </div>
            <div class="form-group">
              <label class="form-label">Headline (English)</label>
              <input class="form-input" id="admCaHeadEn" placeholder="e.g., Chhattisgarh Economic Survey & Key Schemes" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Exam Key Points &amp; Summary (Bilingual)</label>
            <textarea class="form-textarea" id="admCaSummary" rows="3" placeholder="परीक्षा उपयोगी मुख्य तथ्य..."></textarea>
          </div>
          <button class="btn btn-primary" id="admPublishCaBtn">⚡ Publish Current Affairs Story</button>
        </div>
      `;

      document.getElementById('admPublishCaBtn').onclick = () => {
        const headHi = document.getElementById('admCaHeadHi').value.trim();
        const headEn = document.getElementById('admCaHeadEn').value.trim() || headHi;
        const summary = document.getElementById('admCaSummary').value.trim() || headHi;
        if (!headHi) {
          api.toast('कृपया करंट अफेयर्स शीर्षक दर्ज करें।');
          return;
        }
        const stObj = {
          id: 'ca_' + Date.now(),
          category: document.getElementById('admCaCategory').value,
          headlineHi: headHi,
          headlineEn: headEn,
          summaryHi: summary,
          summaryEn: summary,
          sourceName: document.getElementById('admCaSource').value.trim() || 'DPR Chhattisgarh',
          createdAtMs: Date.now(),
          expiresAtMs: Date.now() + 86400000
        };
        state.stories.unshift(stObj);
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('current_affairs', stObj.id, stObj);
        api.toast('⚡ Current Affairs story published!');
        renderAdminConsole(rootEl, state, api);
      };
      return;
    }

    if (activeSection === 'broadcast') {
      bodyEl.innerHTML = `
        <div class="grid-2">
          <div class="card">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">📢 Post Announcement / Upcoming Exam Schedule</h3>
            <div class="form-group">
              <input class="form-input" id="admNotifTitle" placeholder="Announcement Title (Hindi & English)" style="margin-bottom:8px;" />
              <textarea class="form-textarea" id="admNotifBody" rows="3" placeholder="Message details, syllabus PDF link, or upcoming test date..." style="margin-bottom:8px;"></textarea>
              <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;margin-bottom:10px;">
                <input type="checkbox" id="admNotifPin" checked /> Pin to Top of Student Dashboard
              </label>
              <button class="btn btn-primary" id="admSendBroadcastBtn">📢 Publish Announcement</button>
            </div>
          </div>

          <div class="card">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">💬 Student Queries &amp; Support Desk (${(state.queries || []).length})</h3>
            ${(state.queries || []).length === 0 ? `
              <p style="font-size:0.84rem;color:var(--text-muted);">No student support queries yet.</p>
            ` : `
              <div style="display:grid;gap:10px;max-height:320px;overflow-y:auto;">
                ${state.queries.map((q) => `
                  <div style="padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--surface-alt);">
                    <div style="font-weight:800;font-size:0.85rem;">${esc(q.studentName)} (${esc(q.studentEmail)}) — <span class="badge badge-exam">${esc(q.category)}</span></div>
                    <div style="font-size:0.84rem;margin:4px 0;">${esc(q.message)}</div>
                    <div style="display:flex;gap:6px;margin-top:6px;">
                      <input class="form-input" id="reply_input_${esc(q.id)}" value="${esc(q.adminReply || '')}" placeholder="Write official reply..." style="padding:6px 10px;font-size:0.8rem;" />
                      <button class="btn btn-success btn-sm" data-send-query-reply="${esc(q.id)}">Reply</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      `;

      document.getElementById('admSendBroadcastBtn').onclick = () => {
        const title = document.getElementById('admNotifTitle').value.trim();
        const msg = document.getElementById('admNotifBody').value.trim();
        if (!title) return;
        const nObj = {
          id: 'notif_' + Date.now(),
          titleHi: title,
          titleEn: title,
          messageHi: msg || title,
          messageEn: msg || title,
          isPinned: document.getElementById('admNotifPin').checked,
          createdAtIso: new Date().toISOString()
        };
        state.notifications.unshift(nObj);
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('broadcast_notifications', nObj.id, nObj);
        api.toast('📢 Announcement published!');
        renderAdminConsole(rootEl, state, api);
      };

      bodyEl.querySelectorAll('[data-send-query-reply]').forEach((btn) => {
        btn.onclick = () => {
          const qid = btn.getAttribute('data-send-query-reply');
          const inp = document.getElementById('reply_input_' + qid);
          const qObj = state.queries.find((item) => item.id === qid);
          if (qObj && inp) {
            qObj.adminReply = inp.value.trim();
            qObj.status = 'resolved';
            api.saveState();
            if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('student_queries', qObj.id, qObj);
            api.toast('✅ Reply sent to student!');
            renderAdminConsole(rootEl, state, api);
          }
        };
      });
      return;
    }

    if (activeSection === 'branding') {
      const anthemData = (state.config && state.config.anthemData) || {
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
      };
      const hasUploadedAnthem = Boolean(anthemData && (anthemData.downloadUrl || anthemData.storagePath));

      bodyEl.innerHTML = `
        <div class="grid-2" style="margin-bottom:16px;">
          <div class="card" style="margin-bottom:0;">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">⚙️ Platform Branding, Security &amp; Anthem Config</h3>
            <div class="form-group">
              <label class="form-label">Platform Title</label>
              <input class="form-input" id="admBrandTitle" value="${esc(state.config.appTitle || 'CGpedia')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Platform Subtitle</label>
              <input class="form-input" id="admBrandSub" value="${esc(state.config.appSubtitle || 'Competitive Exam & CBT Test Portal')}" />
            </div>
            <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;margin-bottom:10px;">
              <input type="checkbox" id="admScreenshotRestrict" ${state.config.screenshotRestriction ? 'checked' : ''} />
              Enable Strict Screenshot &amp; Screen Recording Protection During Exams
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;margin-bottom:14px;">
              <input type="checkbox" id="admAnthemEnabled" ${state.config.anthemEnabled ? 'checked' : ''} />
              Show State Anthem Audio Button in Student Header (Requires Published Anthem)
            </label>
            <button class="btn btn-primary" id="admSaveBrandingBtn">💾 Save Platform Settings</button>
          </div>

          <div class="card" style="margin-bottom:0;">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">🛡️ Role-Based Access Control (Delegated Admin Staff)</h3>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:10px;">
              Super Admin: <strong>usahu0304@gmail.com</strong>. Assign Exam Manager, Question Editor, Evaluator, Support Staff, or Finance Admin roles below.
            </p>
            <div style="display:grid;grid-template-columns:1fr 140px auto;gap:8px;margin-bottom:12px;">
              <input class="form-input" id="admStaffEmail" placeholder="staff@gmail.com" />
              <select class="form-select" id="admStaffRole">
                <option value="exam_manager">Exam Manager</option>
                <option value="question_editor">Question Editor</option>
                <option value="evaluator">Evaluator</option>
                <option value="support_staff">Support Staff</option>
                <option value="finance_admin">Finance Admin</option>
              </select>
              <button class="btn btn-navy" id="admAddStaffBtn">Assign</button>
            </div>
            <div style="display:grid;gap:6px;">
              ${(state.adminStaff || []).map((st) => `
                <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);display:flex;justify-content:space-between;align-items:center;font-size:0.82rem;">
                  <span><strong>${esc(st.email)}</strong> — <span class="badge badge-exam">${esc(st.role)}</span></span>
                  <button class="btn btn-danger btn-sm" data-del-staff="${esc(st.id)}">✕</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Complete Anthem Audio Management Studio -->
        <div class="card anthem-admin-studio-card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <h3 style="font-size:1.05rem;font-weight:800;margin:0;">🎵 Anthem Audio Management</h3>
                <span class="badge ${hasUploadedAnthem && anthemData.published && state.config.anthemEnabled ? 'badge-free' : 'badge-paid'}">
                  ${hasUploadedAnthem && anthemData.published && state.config.anthemEnabled
                    ? '🟢 PUBLISHED & LIVE FOR STUDENTS'
                    : hasUploadedAnthem
                      ? '🟡 UPLOADED (HIDDEN FROM STUDENTS)'
                      : '⚪ NO ANTHEM AUDIO UPLOADED'}
                </span>
              </div>
              <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;">
                Upload, preview, publish, replace, or delete the official Anthem audio in Firebase Storage (<code>cgpedia-2bd5c.firebasestorage.app</code>). Supported formats: <strong>MP3, WAV, M4A</strong> (Max size: <strong>15 MB</strong>).
              </p>
            </div>
            <div style="font-size:0.76rem;color:var(--text-muted);text-align:right;">
              <div>Storage Bucket: <strong>cgpedia-2bd5c.firebasestorage.app</strong></div>
              <div>Metadata Doc: <strong>app_config/global</strong></div>
            </div>
          </div>

          <div class="grid-2" style="align-items:start;">
            <!-- Left Column: Anthem Metadata, File Selector, Validation, Pre-Publish Preview & Upload -->
            <div style="background:var(--surface-alt);border:1px solid var(--border);border-radius:12px;padding:14px;">
              <h4 style="font-size:0.92rem;font-weight:800;margin-bottom:10px;" id="admAnthemFormHeading">
                ${hasUploadedAnthem ? '📤 Upload / Replace Anthem Audio & Metadata' : '📤 Upload New Anthem Audio'}
              </h4>

              <div class="form-group">
                <label class="form-label" for="admAnthemTitle">Anthem Title *</label>
                <input class="form-input" id="admAnthemTitle" value="${esc(anthemData.title || 'छत्तीसगढ़ राज्य गीत — अरपा पैरी के धार (Chhattisgarh State Anthem)')}" placeholder="e.g., छत्तीसगढ़ राज्य गीत — अरपा पैरी के धार" />
              </div>

              <div class="form-group">
                <label class="form-label" for="admAnthemDesc">Anthem Description</label>
                <textarea class="form-textarea" id="admAnthemDesc" rows="2" placeholder="Enter Anthem description, lyricist credits, or ceremonial note...">${esc(anthemData.description || 'रचयिता: डॉ. नरेन्द्र देव वर्मा • Official State Anthem of Chhattisgarh')}</textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Select Audio File from Device (MP3, WAV, M4A • Max 15 MB)</label>
                <input type="file" id="admAnthemFileInput" accept=".mp3,.wav,.m4a,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/m4a" style="display:none;" />
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <button type="button" class="btn btn-outline btn-sm" id="admSelectAnthemFileBtn">
                    📁 ${hasUploadedAnthem ? 'Select Replacement Audio File' : 'Choose Audio File (.MP3 / .WAV / .M4A)'}
                  </button>
                  <span id="admSelectedFileSummary" style="font-size:0.78rem;color:var(--text-secondary);">No new file selected</span>
                </div>
              </div>

              <!-- Validation Error Banner -->
              <div id="admAnthemValidationError" style="display:none;padding:10px 12px;border-radius:8px;background:var(--danger-soft);color:var(--danger);border:1px solid var(--danger);font-size:0.8rem;font-weight:600;margin-bottom:10px;"></div>

              <!-- Pre-Publish Local Audio Preview Box -->
              <div id="admPrePublishPreviewBox" style="display:none;padding:12px;border-radius:10px;background:var(--surface);border:1.5px dashed var(--secondary);margin-bottom:12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                  <div>
                    <span class="badge badge-exam">🎧 PRE-PUBLISH PREVIEW</span>
                    <div id="admPreviewFileName" style="font-size:0.82rem;font-weight:700;margin-top:3px;"></div>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" id="admClearSelectedFileBtn">✕ Clear Selection</button>
                </div>
                <audio id="admPrePublishAudioEl" preload="metadata" controlsList="nodownload" style="display:none;"></audio>
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                  <button type="button" class="btn btn-navy btn-sm" id="admPreviewPlayPauseBtn">▶️ Play Preview</button>
                  <input type="range" id="admPreviewSeekSlider" min="0" max="100" value="0" step="0.1" style="flex:1;min-width:120px;accent-color:var(--secondary);" aria-label="Preview audio timeline" />
                  <span id="admPreviewTimeLabel" style="font-size:0.75rem;font-weight:700;color:var(--text-secondary);min-width:74px;text-align:right;">00:00 / 00:00</span>
                </div>
              </div>

              <!-- Upload Progress Bar & Live Status -->
              <div id="admAnthemUploadProgressWrap" style="display:none;padding:10px 12px;border-radius:10px;background:var(--surface);border:1px solid var(--border);margin-bottom:12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.78rem;font-weight:700;margin-bottom:6px;">
                  <span id="admAnthemUploadStatusText">Uploading to Firebase Storage...</span>
                  <span id="admAnthemUploadPctLabel">0%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" id="admAnthemUploadProgressBar" style="width:0%;"></div>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <button type="button" class="btn btn-primary" id="admUploadPublishAnthemBtn">
                  🚀 ${hasUploadedAnthem ? 'Upload & Publish Replacement Audio' : 'Upload & Publish Anthem Audio'}
                </button>
                ${hasUploadedAnthem ? `
                  <button type="button" class="btn btn-outline" id="admSaveAnthemMetaOnlyBtn">
                    💾 Save Title &amp; Description
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Right Column: Currently Uploaded / Published Anthem Player & Controls -->
            <div style="background:var(--surface-alt);border:1px solid var(--border);border-radius:12px;padding:14px;">
              <h4 style="font-size:0.92rem;font-weight:800;margin-bottom:10px;">📻 Published / Uploaded Anthem Audio</h4>

              ${!hasUploadedAnthem ? `
                <div style="padding:26px 14px;text-align:center;background:var(--surface);border-radius:10px;border:1px dashed var(--border-strong);">
                  <div style="font-size:2rem;margin-bottom:6px;">🎵</div>
                  <div style="font-size:0.9rem;font-weight:800;margin-bottom:4px;">No Anthem Audio Uploaded Yet</div>
                  <p style="font-size:0.78rem;color:var(--text-secondary);max-width:340px;margin:0 auto;">
                    Select an <strong>MP3, WAV, or M4A</strong> audio file on the left, preview it, and click <strong>Upload &amp; Publish Anthem Audio</strong> to make it available to students.
                  </p>
                </div>
              ` : `
                <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;">
                  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                    <div>
                      <div style="font-size:0.96rem;font-weight:800;">${esc(anthemData.title || 'CGpedia Anthem')}</div>
                      <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px;">${esc(anthemData.description || '')}</div>
                    </div>
                    <span class="badge ${anthemData.published ? 'badge-free' : 'badge-paid'}">
                      ${anthemData.published ? '🟢 Published' : '⚪ Unpublished'}
                    </span>
                  </div>

                  <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:0.75rem;color:var(--text-muted);margin-bottom:12px;">
                    <span>📄 File: <strong>${esc(anthemData.fileName || 'anthem.mp3')}</strong></span>
                    <span>• Format: <strong>${esc(anthemData.formatLabel || 'AUDIO')}</strong></span>
                    <span>• Size: <strong>${esc(anthemData.sizeMbText || ((Number(anthemData.sizeBytes || 0) / (1024 * 1024)).toFixed(2) + ' MB'))}</strong></span>
                    ${anthemData.updatedAtIso ? `<span>• Updated: <strong>${esc(new Date(anthemData.updatedAtIso).toLocaleString())}</strong></span>` : ''}
                  </div>

                  <!-- Admin Playback Controls for Uploaded Anthem -->
                  <div style="padding:10px 12px;border-radius:10px;background:var(--surface-alt);border:1px solid var(--border);margin-bottom:12px;">
                    <div style="font-size:0.74rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px;">
                      🔊 Play / Pause Uploaded Anthem Audio
                    </div>
                    <audio id="admUploadedAnthemAudioEl" preload="metadata" controlsList="nodownload" style="display:none;"></audio>
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                      <button type="button" class="btn btn-primary btn-sm" id="admUploadedPlayPauseBtn">▶️ Play Uploaded Audio</button>
                      <input type="range" id="admUploadedSeekSlider" min="0" max="100" value="0" step="0.1" style="flex:1;min-width:110px;accent-color:var(--primary);" aria-label="Uploaded audio timeline" />
                      <span id="admUploadedTimeLabel" style="font-size:0.75rem;font-weight:700;color:var(--text-secondary);min-width:74px;text-align:right;">00:00 / 00:00</span>
                    </div>
                  </div>

                  <!-- Publish Toggle, Replace & Delete Actions -->
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding-top:8px;border-top:1px solid var(--border);">
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                      <button type="button" class="btn ${anthemData.published ? 'btn-outline' : 'btn-success'} btn-sm" id="admTogglePublishAnthemBtn">
                        ${anthemData.published ? '⏸️ Unpublish from Students' : '🌐 Publish for Students'}
                      </button>
                      <button type="button" class="btn btn-navy btn-sm" id="admReplaceAnthemBtn">
                        🔄 Replace Audio File
                      </button>
                    </div>
                    <button type="button" class="btn btn-danger btn-sm" id="admDeleteAnthemBtn">
                      🗑️ Delete Audio File
                    </button>
                  </div>
                </div>
              `}
            </div>
          </div>
        </div>
      `;

      // Format seconds helper (mm:ss)
      function formatAudioSec(sec) {
        if (!Number.isFinite(sec) || sec < 0) return '00:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      }

      // Wire standard Platform Branding save button
      document.getElementById('admSaveBrandingBtn').onclick = () => {
        state.config.appTitle = document.getElementById('admBrandTitle').value.trim() || 'CGpedia';
        state.config.appSubtitle = document.getElementById('admBrandSub').value.trim() || 'Competitive Exam & CBT Test Portal';
        state.config.screenshotRestriction = document.getElementById('admScreenshotRestrict').checked;
        state.config.anthemEnabled = document.getElementById('admAnthemEnabled').checked;
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('app_config', 'global', state.config);
        api.applyBrandingAndSecurity();
        api.toast('✅ Branding & security settings updated!');
        renderAdminConsole(rootEl, state, api);
      };

      // Wire Role-Based Staff assignment
      document.getElementById('admAddStaffBtn').onclick = () => {
        const email = document.getElementById('admStaffEmail').value.trim().toLowerCase();
        const role = document.getElementById('admStaffRole').value;
        if (!email) return;
        const stObj = { id: 'staff_' + Date.now(), email, role };
        state.adminStaff = state.adminStaff || [];
        state.adminStaff.push(stObj);
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('admin_staff', stObj.id, stObj);
        renderAdminConsole(rootEl, state, api);
      };

      bodyEl.querySelectorAll('[data-del-staff]').forEach((btn) => {
        btn.onclick = () => {
          const sid = btn.getAttribute('data-del-staff');
          state.adminStaff = (state.adminStaff || []).filter((s) => s.id !== sid);
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.deleteCloudDoc('admin_staff', sid);
          renderAdminConsole(rootEl, state, api);
        };
      });

      // =====================================================================
      // Anthem Audio Management Event Handlers
      // =====================================================================
      let selectedAnthemFile = null;
      let previewObjectUrl = null;

      const fileInputEl = document.getElementById('admAnthemFileInput');
      const selectFileBtn = document.getElementById('admSelectAnthemFileBtn');
      const fileSummaryEl = document.getElementById('admSelectedFileSummary');
      const errorBoxEl = document.getElementById('admAnthemValidationError');
      const previewBoxEl = document.getElementById('admPrePublishPreviewBox');
      const previewFileNameEl = document.getElementById('admPreviewFileName');
      const previewAudioEl = document.getElementById('admPrePublishAudioEl');
      const previewPlayBtn = document.getElementById('admPreviewPlayPauseBtn');
      const previewSeekEl = document.getElementById('admPreviewSeekSlider');
      const previewTimeEl = document.getElementById('admPreviewTimeLabel');
      const clearFileBtn = document.getElementById('admClearSelectedFileBtn');
      const uploadPublishBtn = document.getElementById('admUploadPublishAnthemBtn');
      const saveMetaOnlyBtn = document.getElementById('admSaveAnthemMetaOnlyBtn');
      const progressWrapEl = document.getElementById('admAnthemUploadProgressWrap');
      const progressBarEl = document.getElementById('admAnthemUploadProgressBar');
      const progressPctEl = document.getElementById('admAnthemUploadPctLabel');
      const progressStatusEl = document.getElementById('admAnthemUploadStatusText');

      function showValidationError(msg) {
        if (!errorBoxEl) return;
        if (!msg) {
          errorBoxEl.style.display = 'none';
          errorBoxEl.textContent = '';
        } else {
          errorBoxEl.style.display = 'block';
          errorBoxEl.textContent = '⚠️ ' + msg;
        }
      }

      function resetSelectedPreview() {
        selectedAnthemFile = null;
        if (previewAudioEl) {
          try { previewAudioEl.pause(); } catch (_) {}
          previewAudioEl.removeAttribute('src');
        }
        if (previewObjectUrl) {
          try { URL.revokeObjectURL(previewObjectUrl); } catch (_) {}
          previewObjectUrl = null;
        }
        if (fileInputEl) fileInputEl.value = '';
        if (fileSummaryEl) fileSummaryEl.textContent = 'No new file selected';
        if (previewBoxEl) previewBoxEl.style.display = 'none';
        if (previewPlayBtn) previewPlayBtn.textContent = '▶️ Play Preview';
      }

      if (selectFileBtn && fileInputEl) {
        selectFileBtn.onclick = () => fileInputEl.click();
      }

      if (clearFileBtn) {
        clearFileBtn.onclick = () => {
          resetSelectedPreview();
          showValidationError('');
        };
      }

      if (fileInputEl) {
        fileInputEl.onchange = () => {
          const file = fileInputEl.files && fileInputEl.files[0];
          if (!file) return;

          const validator = window.CGpediaCloud && window.CGpediaCloud.validateAnthemAudioFile
            ? window.CGpediaCloud.validateAnthemAudioFile(file)
            : { valid: true, extension: 'MP3', sizeMbText: (file.size / (1024 * 1024)).toFixed(2) + ' MB' };

          if (!validator.valid) {
            resetSelectedPreview();
            showValidationError(validator.error);
            api.toast('⚠️ ' + validator.error);
            return;
          }

          showValidationError('');
          selectedAnthemFile = file;
          if (previewObjectUrl) {
            try { URL.revokeObjectURL(previewObjectUrl); } catch (_) {}
          }
          previewObjectUrl = URL.createObjectURL(file);

          if (fileSummaryEl) {
            fileSummaryEl.innerHTML = `Selected: <strong>${esc(file.name)}</strong> (${esc(validator.extension)} • ${esc(validator.sizeMbText)})`;
          }
          if (previewFileNameEl) {
            previewFileNameEl.textContent = `${file.name} (${validator.extension} • ${validator.sizeMbText})`;
          }
          if (previewBoxEl) {
            previewBoxEl.style.display = 'block';
          }
          if (previewAudioEl) {
            previewAudioEl.src = previewObjectUrl;
            previewAudioEl.load();
          }
          if (previewPlayBtn) {
            previewPlayBtn.textContent = '▶️ Play Preview';
          }
          if (previewSeekEl) previewSeekEl.value = '0';
          if (previewTimeEl) previewTimeEl.textContent = '00:00 / 00:00';
        };
      }

      // Wire Pre-Publish Preview Player
      if (previewAudioEl && previewPlayBtn) {
        previewPlayBtn.onclick = () => {
          if (!previewAudioEl.src) return;
          // Pause uploaded audio player if playing
          const upAudio = document.getElementById('admUploadedAnthemAudioEl');
          if (upAudio && !upAudio.paused) {
            try { upAudio.pause(); } catch (_) {}
          }
          if (previewAudioEl.paused) {
            previewAudioEl.play().catch((err) => {
              showValidationError('Could not play audio preview: ' + (err.message || 'Unsupported codec'));
            });
          } else {
            previewAudioEl.pause();
          }
        };

        previewAudioEl.onplay = () => {
          previewPlayBtn.textContent = '⏸️ Pause Preview';
        };
        previewAudioEl.onpause = () => {
          previewPlayBtn.textContent = '▶️ Play Preview';
        };
        previewAudioEl.onended = () => {
          previewPlayBtn.textContent = '▶️ Play Preview';
          if (previewSeekEl) previewSeekEl.value = '0';
        };
        previewAudioEl.onloadedmetadata = () => {
          if (previewTimeEl) {
            previewTimeEl.textContent = `00:00 / ${formatAudioSec(previewAudioEl.duration)}`;
          }
        };
        previewAudioEl.ontimeupdate = () => {
          const dur = previewAudioEl.duration || 0;
          const cur = previewAudioEl.currentTime || 0;
          if (dur > 0 && previewSeekEl) {
            previewSeekEl.value = String(((cur / dur) * 100).toFixed(1));
          }
          if (previewTimeEl) {
            previewTimeEl.textContent = `${formatAudioSec(cur)} / ${formatAudioSec(dur)}`;
          }
        };
        if (previewSeekEl) {
          previewSeekEl.oninput = () => {
            const dur = previewAudioEl.duration || 0;
            if (dur > 0) {
              previewAudioEl.currentTime = (Number(previewSeekEl.value) / 100) * dur;
            }
          };
        }
      }

      // Wire Upload & Publish Anthem Button
      if (uploadPublishBtn) {
        uploadPublishBtn.onclick = async () => {
          const titleVal = (document.getElementById('admAnthemTitle').value || '').trim();
          const descVal = (document.getElementById('admAnthemDesc').value || '').trim();

          if (!titleVal) {
            showValidationError('Please enter an Anthem Title before uploading and publishing.');
            return;
          }
          if (!selectedAnthemFile) {
            showValidationError('Please select an MP3, WAV, or M4A audio file from your device first.');
            return;
          }

          const validator = window.CGpediaCloud && window.CGpediaCloud.validateAnthemAudioFile
            ? window.CGpediaCloud.validateAnthemAudioFile(selectedAnthemFile)
            : { valid: true };
          if (!validator.valid) {
            showValidationError(validator.error);
            return;
          }

          showValidationError('');
          if (previewAudioEl && !previewAudioEl.paused) {
            try { previewAudioEl.pause(); } catch (_) {}
          }

          uploadPublishBtn.disabled = true;
          if (progressWrapEl) progressWrapEl.style.display = 'block';

          const oldStoragePath = state.config && state.config.anthemData && state.config.anthemData.storagePath
            ? state.config.anthemData.storagePath
            : '';

          try {
            const uploadedMeta = await window.CGpediaCloud.uploadAnthemAudioFile(
              selectedAnthemFile,
              (pct, statusText) => {
                if (progressBarEl) progressBarEl.style.width = `${pct}%`;
                if (progressPctEl) progressPctEl.textContent = `${pct}%`;
                if (progressStatusEl) progressStatusEl.textContent = statusText || `Uploading (${pct}%)...`;
              },
              state.student && state.student.email ? state.student.email : 'usahu0304@gmail.com'
            );

            // If replacing an existing audio file, remove the previous Storage object
            if (oldStoragePath && oldStoragePath !== uploadedMeta.storagePath && window.CGpediaCloud.deleteAnthemAudioFile) {
              try {
                await window.CGpediaCloud.deleteAnthemAudioFile(
                  oldStoragePath,
                  state.student && state.student.email ? state.student.email : 'usahu0304@gmail.com'
                );
              } catch (_) {}
            }

            state.config.anthemEnabled = true;
            state.config.anthemData = {
              title: titleVal,
              description: descVal,
              downloadUrl: uploadedMeta.downloadUrl,
              storagePath: uploadedMeta.storagePath,
              fileName: uploadedMeta.fileName,
              mimeType: uploadedMeta.mimeType,
              formatLabel: uploadedMeta.formatLabel,
              sizeBytes: uploadedMeta.sizeBytes,
              sizeMbText: uploadedMeta.sizeMbText,
              published: true,
              updatedAtIso: new Date().toISOString(),
              updatedByEmail: (state.student && state.student.email) || 'usahu0304@gmail.com'
            };

            api.saveState();
            if (window.CGpediaCloud) {
              await window.CGpediaCloud.saveCloudDoc('app_config', 'global', state.config);
            }
            api.applyBrandingAndSecurity();
            resetSelectedPreview();
            api.toast('✅ Anthem audio uploaded to Firebase Storage & published for students!');
            renderAdminConsole(rootEl, state, api);
          } catch (err) {
            uploadPublishBtn.disabled = false;
            showValidationError(err && err.message ? err.message : 'Failed to upload Anthem audio.');
            if (progressStatusEl) progressStatusEl.textContent = 'Upload failed.';
          }
        };
      }

      // Wire Save Title & Description Only (when audio already exists)
      if (saveMetaOnlyBtn) {
        saveMetaOnlyBtn.onclick = async () => {
          const titleVal = (document.getElementById('admAnthemTitle').value || '').trim();
          const descVal = (document.getElementById('admAnthemDesc').value || '').trim();
          if (!titleVal) {
            showValidationError('Anthem Title cannot be empty.');
            return;
          }
          showValidationError('');
          state.config.anthemData = Object.assign({}, state.config.anthemData || {}, {
            title: titleVal,
            description: descVal,
            updatedAtIso: new Date().toISOString()
          });
          api.saveState();
          if (window.CGpediaCloud) {
            await window.CGpediaCloud.saveCloudDoc('app_config', 'global', state.config);
          }
          api.applyBrandingAndSecurity();
          api.toast('✅ Anthem Title & Description updated!');
          renderAdminConsole(rootEl, state, api);
        };
      }

      // Wire Uploaded / Published Audio Playback Controls in Admin
      const uploadedAudioEl = document.getElementById('admUploadedAnthemAudioEl');
      const uploadedPlayBtn = document.getElementById('admUploadedPlayPauseBtn');
      const uploadedSeekEl = document.getElementById('admUploadedSeekSlider');
      const uploadedTimeEl = document.getElementById('admUploadedTimeLabel');

      if (uploadedAudioEl && uploadedPlayBtn && hasUploadedAnthem) {
        (async () => {
          const playableUrl = window.CGpediaCloud && window.CGpediaCloud.resolveAnthemPlaybackUrl
            ? await window.CGpediaCloud.resolveAnthemPlaybackUrl(anthemData)
            : anthemData.downloadUrl;
          if (playableUrl) {
            uploadedAudioEl.src = playableUrl;
          }
        })();

        uploadedPlayBtn.onclick = async () => {
          if (previewAudioEl && !previewAudioEl.paused) {
            try { previewAudioEl.pause(); } catch (_) {}
          }
          if (!uploadedAudioEl.src) {
            const resolved = window.CGpediaCloud && window.CGpediaCloud.resolveAnthemPlaybackUrl
              ? await window.CGpediaCloud.resolveAnthemPlaybackUrl(anthemData)
              : anthemData.downloadUrl;
            if (resolved) uploadedAudioEl.src = resolved;
          }
          if (uploadedAudioEl.paused) {
            uploadedAudioEl.play().catch((err) => {
              api.toast('⚠️ Audio playback error: ' + (err.message || 'Check file'));
            });
          } else {
            uploadedAudioEl.pause();
          }
        };

        uploadedAudioEl.onplay = () => {
          uploadedPlayBtn.textContent = '⏸️ Pause Uploaded Audio';
        };
        uploadedAudioEl.onpause = () => {
          uploadedPlayBtn.textContent = '▶️ Play Uploaded Audio';
        };
        uploadedAudioEl.onended = () => {
          uploadedPlayBtn.textContent = '▶️ Play Uploaded Audio';
          if (uploadedSeekEl) uploadedSeekEl.value = '0';
        };
        uploadedAudioEl.onloadedmetadata = () => {
          if (uploadedTimeEl) {
            uploadedTimeEl.textContent = `00:00 / ${formatAudioSec(uploadedAudioEl.duration)}`;
          }
        };
        uploadedAudioEl.ontimeupdate = () => {
          const dur = uploadedAudioEl.duration || 0;
          const cur = uploadedAudioEl.currentTime || 0;
          if (dur > 0 && uploadedSeekEl) {
            uploadedSeekEl.value = String(((cur / dur) * 100).toFixed(1));
          }
          if (uploadedTimeEl) {
            uploadedTimeEl.textContent = `${formatAudioSec(cur)} / ${formatAudioSec(dur)}`;
          }
        };
        if (uploadedSeekEl) {
          uploadedSeekEl.oninput = () => {
            const dur = uploadedAudioEl.duration || 0;
            if (dur > 0) {
              uploadedAudioEl.currentTime = (Number(uploadedSeekEl.value) / 100) * dur;
            }
          };
        }
      }

      // Wire Publish / Unpublish Toggle
      const togglePublishBtn = document.getElementById('admTogglePublishAnthemBtn');
      if (togglePublishBtn && hasUploadedAnthem) {
        togglePublishBtn.onclick = async () => {
          const nextPublished = !Boolean(state.config.anthemData && state.config.anthemData.published);
          state.config.anthemData = Object.assign({}, state.config.anthemData, {
            published: nextPublished,
            updatedAtIso: new Date().toISOString()
          });
          if (nextPublished) {
            state.config.anthemEnabled = true;
          }
          api.saveState();
          if (window.CGpediaCloud) {
            await window.CGpediaCloud.saveCloudDoc('app_config', 'global', state.config);
          }
          api.applyBrandingAndSecurity();
          api.toast(nextPublished ? '🟢 Anthem published for students!' : '⏸️ Anthem unpublished from student view.');
          renderAdminConsole(rootEl, state, api);
        };
      }

      // Wire Replace Audio File Button
      const replaceAnthemBtn = document.getElementById('admReplaceAnthemBtn');
      if (replaceAnthemBtn && fileInputEl) {
        replaceAnthemBtn.onclick = () => {
          const headingEl = document.getElementById('admAnthemFormHeading');
          if (headingEl) headingEl.textContent = '🔄 Select Replacement Anthem Audio File';
          fileInputEl.click();
        };
      }

      // Wire Delete Existing Audio File Button
      const deleteAnthemBtn = document.getElementById('admDeleteAnthemBtn');
      if (deleteAnthemBtn && hasUploadedAnthem) {
        deleteAnthemBtn.onclick = async () => {
          if (uploadedAudioEl && !uploadedAudioEl.paused) {
            try { uploadedAudioEl.pause(); } catch (_) {}
          }
          const storagePath = state.config.anthemData && state.config.anthemData.storagePath
            ? state.config.anthemData.storagePath
            : '';

          deleteAnthemBtn.disabled = true;
          deleteAnthemBtn.textContent = 'Deleting...';

          try {
            if (storagePath && window.CGpediaCloud && window.CGpediaCloud.deleteAnthemAudioFile) {
              await window.CGpediaCloud.deleteAnthemAudioFile(
                storagePath,
                state.student && state.student.email ? state.student.email : 'usahu0304@gmail.com'
              );
            }
          } catch (_) {}

          state.config.anthemData = {
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
            updatedAtIso: new Date().toISOString()
          };
          state.config.anthemEnabled = false;

          api.saveState();
          if (window.CGpediaCloud) {
            await window.CGpediaCloud.saveCloudDoc('app_config', 'global', state.config);
          }
          api.applyBrandingAndSecurity();
          api.toast('🗑️ Anthem audio deleted from Firebase Storage.');
          renderAdminConsole(rootEl, state, api);
        };
      }
    }
    } catch (adminRenderErr) {
      console.error('Admin module render error:', adminRenderErr);
      bodyEl.innerHTML = `
        <div class="card" style="border-left:4px solid var(--danger);">
          <h3 style="font-size:1rem;font-weight:800;margin-bottom:6px;">⚠️ Module View Recovery</h3>
          <p style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:10px;">
            An unexpected display issue occurred while loading this module (${esc(adminRenderErr && adminRenderErr.message ? adminRenderErr.message : 'Unknown error')}).
          </p>
          <button type="button" class="btn btn-primary btn-sm" id="admRecoverToOverviewBtn">🔄 Return to Dashboard KPIs</button>
        </div>
      `;
      const recBtn = document.getElementById('admRecoverToOverviewBtn');
      if (recBtn) {
        recBtn.onclick = () => switchAdminSection(rootEl, state, api, 'overview');
      }
    }
  }

  // =========================================================================
  // Professional Question Management System (CSV/JSON Preview, Validation,
  // Duplicate Detection, Categorization, Bulk Operations & Import Reporting)
  // =========================================================================
  const qbState = {
    previewSession: null,
    lastImportReport: null,
    pendingAnswerKeyText: '',
    lastUploadedFileName: '',
    lastAnswerKeyFileName: '',
    categoryManagerOpen: false,
    categoryManagerTab: 'exams',
    filters: {
      search: '',
      examCode: 'ALL',
      subject: 'ALL',
      topic: 'ALL',
      subtopic: 'ALL',
      difficulty: 'ALL',
      language: 'ALL',
      status: 'ALL'
    },
    selectedIds: new Set(),
    expandedIds: new Set(),
    page: 1,
    pageSize: 15,
    singleDraft: {
      targetTestId: 'central_bank',
      examCode: 'CGPSC',
      examIds: ['CGPSC'],
      subjectId: 'sub_cg_gk',
      subjectTag: 'Chhattisgarh General Knowledge',
      topicId: 'top_cg_history',
      topic: 'History of Chhattisgarh',
      subtopicId: 'subtop_cg_kalchuri',
      subtopic: 'Kalchuri & Maratha Period',
      difficulty: 'Moderate',
      difficultyLevel: 'Moderate',
      questionType: 'MCQ',
      sourceExam: '',
      sourceYear: '',
      paperSetCode: '',
      sourceDocument: '',
      sourcePageNumber: '',
      languageAvailability: 'Both',
      pyqTag: '',
      tagsText: '',
      questionHi: '',
      questionEn: '',
      optionsHi: ['', '', '', ''],
      optionsEn: ['', '', '', ''],
      correctOptionIndex: 0,
      explanationHi: '',
      explanationEn: ''
    }
  };

  function makeSlugId(prefix, text) {
    const clean = String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 42);
    return `${prefix}_${clean || Date.now()}`;
  }

  function getTaxonomyCatalog(state) {
    const baseExams = window.CGpediaCloud && Array.isArray(window.CGpediaCloud.EXAM_CATEGORIES)
      ? window.CGpediaCloud.EXAM_CATEGORIES
      : [
          { id: 'exam_cgpsc', examId: 'exam_cgpsc', code: 'CGPSC', nameEn: 'CGPSC State Services', nameHi: 'छत्तीसगढ़ पीएससी (CGPSC)', icon: '🏛️', subjectIds: [] },
          { id: 'exam_cg_vyapam', examId: 'exam_cg_vyapam', code: 'CG_VYAPAM', nameEn: 'CG Vyapam', nameHi: 'छत्तीसगढ़ व्यापम (CG Vyapam)', icon: '📑', subjectIds: [] },
          { id: 'exam_adeo', examId: 'exam_adeo', code: 'ADEO', nameEn: 'ADEO', nameHi: 'सहायक विकास विस्तार अधिकारी (ADEO)', icon: '🌾', subjectIds: [] },
          { id: 'exam_patwari', examId: 'exam_patwari', code: 'PATWARI', nameEn: 'Patwari', nameHi: 'पटवारी भर्ती परीक्षा', icon: '📐', subjectIds: [] },
          { id: 'exam_sub_inspector', examId: 'exam_sub_inspector', code: 'SUB_INSPECTOR', nameEn: 'Sub Inspector', nameHi: 'सब इंस्पेक्टर (SI)', icon: '🚓', subjectIds: [] },
          { id: 'exam_teacher', examId: 'exam_teacher', code: 'TEACHER_RECRUITMENT', nameEn: 'Teacher Recruitment', nameHi: 'शिक्षक भर्ती परीक्षा', icon: '👩‍🏫', subjectIds: [] },
          { id: 'exam_tet', examId: 'exam_tet', code: 'TET', nameEn: 'TET (CG TET / CTET)', nameHi: 'शिक्षक पात्रता परीक्षा (TET)', icon: '🎓', subjectIds: [] },
          { id: 'exam_upsc', examId: 'exam_upsc', code: 'UPSC', nameEn: 'UPSC Civil Services', nameHi: 'संघ लोक सेवा आयोग (UPSC)', icon: '🇮🇳', subjectIds: [] },
          { id: 'exam_ssc', examId: 'exam_ssc', code: 'SSC', nameEn: 'SSC Examinations', nameHi: 'एसएससी परीक्षाएं', icon: '📋', subjectIds: [] }
        ];

    const customTax = (state && state.customTaxonomy) || { customCategories: [], customSubjects: [] };
    const stateExamMaster = (state && Array.isArray(state.examMaster)) ? state.examMaster : [];
    const stateSubjectMaster = (state && Array.isArray(state.subjectMaster)) ? state.subjectMaster : [];
    const stateTopicMaster = (state && Array.isArray(state.topicMaster)) ? state.topicMaster : [];
    const stateSubtopicMaster = (state && Array.isArray(state.subtopicMaster)) ? state.subtopicMaster : [];

    // 1. Build Exam Master Map
    const examsMap = new Map();
    function registerExam(ex) {
      if (!ex) return;
      const code = String(ex.code || ex.examCode || ex.examId || ex.nameEn || '').trim().toUpperCase().replace(/\s+/g, '_');
      if (!code) return;
      const examId = String(ex.examId || ex.id || makeSlugId('exam', code)).trim();
      const existing = examsMap.get(code);
      if (!existing) {
        examsMap.set(code, {
          id: examId,
          examId,
          code,
          nameEn: String(ex.nameEn || ex.titleEn || code).trim(),
          nameHi: String(ex.nameHi || ex.titleHi || ex.nameEn || code).trim(),
          icon: ex.icon || '📘',
          badge: ex.badge || 'Competitive Exam',
          subjectIds: Array.isArray(ex.subjectIds) ? [...ex.subjectIds] : []
        });
      } else {
        if (ex.nameEn) existing.nameEn = String(ex.nameEn).trim();
        if (ex.nameHi) existing.nameHi = String(ex.nameHi).trim();
        if (Array.isArray(ex.subjectIds)) {
          existing.subjectIds = Array.from(new Set([...existing.subjectIds, ...ex.subjectIds]));
        }
      }
    }
    baseExams.forEach(registerExam);
    (customTax.customCategories || []).forEach(registerExam);
    stateExamMaster.forEach(registerExam);
    const examCategories = Array.from(examsMap.values());

    // 2. Build Subject Master Map
    const baseSubjects = window.CGpediaCloud && Array.isArray(window.CGpediaCloud.DEFAULT_SUBJECTS)
      ? window.CGpediaCloud.DEFAULT_SUBJECTS
      : [];
    const builtinSubjectFallbacks = [
      { id: 'sub_cg_gs', subjectId: 'sub_cg_gs', titleEn: 'Chhattisgarh General Knowledge', titleHi: 'छत्तीसगढ़ सामान्य ज्ञान', examCode: 'CGPSC', aliases: ['sub_cg_gk', 'Chhattisgarh General Studies', 'Chhattisgarh GS', 'CG GK', 'CG GS', 'Chhattisgarh History', 'Chhattisgarh Geography', 'छत्तीसगढ़ सामान्य अध्ययन', 'छत्तीसगढ़ जीके', 'छत्तीसगढ़'], topics: ['History of Chhattisgarh', 'Geography & Climate of CG', 'Tribes, Art & Culture', 'Panchayati Raj & Local Administration', 'CG Economy, Forest & Agriculture', 'Chhattisgarh Current Affairs'] },
      { id: 'sub_history', subjectId: 'sub_history', titleEn: 'History', titleHi: 'इतिहास', examCode: 'ALL', aliases: ['Indian History', 'History of India', 'Ancient History', 'Modern History', 'भारत का इतिहास', 'इतिहास'], topics: ['Ancient Indian History', 'Medieval Indian History', 'Modern Indian History', 'Indian National Movement', 'Art & Architecture'] },
      { id: 'sub_geography', subjectId: 'sub_geography', titleEn: 'Geography', titleHi: 'भूगोल', examCode: 'ALL', aliases: ['Indian Geography', 'World Geography', 'Physical Geography', 'Indian & World Geography', 'भारत का भूगोल', 'विश्व का भूगोल', 'भूगोल'], topics: ['Indian Geography', 'World Geography', 'Physical Geography', 'Chhattisgarh Geography', 'Environment & Ecology'] },
      { id: 'sub_polity', subjectId: 'sub_polity', titleEn: 'Indian Polity', titleHi: 'भारतीय राजव्यवस्था एवं संविधान', examCode: 'ALL', aliases: ['Polity', 'Indian Polity & Governance', 'Constitution', 'Governance', 'संविधान', 'राजव्यवस्था', 'भारतीय संविधान'], topics: ['Constitution', 'Fundamental Rights', 'Directive Principles', 'Parliament', 'President and Governor', 'Judiciary & Panchayati Raj'] },
      { id: 'sub_economy', subjectId: 'sub_economy', titleEn: 'Economics', titleHi: 'अर्थव्यवस्था', examCode: 'ALL', aliases: ['sub_economics', 'Indian Economy', 'Economy', 'भारतीय अर्थव्यवस्था', 'अर्थशास्त्र'], topics: ['National Income & Planning', 'Banking, RBI & Monetary Policy', 'Union & State Budget, Economic Survey', 'Agriculture, Industry & Infrastructure'] },
      { id: 'sub_science', subjectId: 'sub_science', titleEn: 'General Science', titleHi: 'सामान्य विज्ञान एवं प्रौद्योगिकी', examCode: 'ALL', aliases: ['Science', 'General Science & Tech', 'Science & Technology', 'विज्ञान', 'सामान्य विज्ञान', 'भौतिकी', 'रसायन', 'जीव विज्ञान'], topics: ['Physics & Chemistry in Daily Life', 'Biology & Human Health', 'Space (ISRO), Defence (DRDO) & IT', 'Environment & Ecology'] },
      { id: 'sub_mathematics', subjectId: 'sub_mathematics', titleEn: 'Mathematics', titleHi: 'गणित एवं संख्यात्मक अभियोग्यता', examCode: 'ALL', aliases: ['Maths', 'Quantitative Aptitude', 'Arithmetic', 'CSAT Maths', 'गणित'], topics: ['Number System & Simplification', 'Percentage, Profit & Loss, SI & CI', 'Ratio, Time & Work, Speed & Distance', 'Algebra, Geometry & Mensuration'] },
      { id: 'sub_reasoning', subjectId: 'sub_reasoning', titleEn: 'Reasoning', titleHi: 'तार्किक अभियोग्यता (Reasoning)', examCode: 'ALL', aliases: ['Logical Reasoning', 'General Intelligence & Reasoning', 'Aptitude & Reasoning', 'CSAT Quantitative Aptitude & Reasoning', 'रीजनिंग', 'तर्कशक्ति'], topics: ['Coding-Decoding & Series', 'Blood Relations & Direction Sense', 'Syllogism, Statement & Conclusion', 'Puzzles, Seating & Non-Verbal Reasoning'] },
      { id: 'sub_hindi', subjectId: 'sub_hindi', titleEn: 'Hindi', titleHi: 'सामान्य हिन्दी व्याकरण एवं भाषा', examCode: 'ALL', aliases: ['General Hindi', 'Hindi Language', 'Hindi Grammar', 'General Hindi & Chhattisgarhi Language', 'सामान्य हिन्दी', 'हिन्दी', 'हिंदी', 'हिन्दी व्याकरण', 'छत्तीसगढ़ी भाषा'], topics: ['वर्णमाला, संधि एवं समास (Sandhi & Samas)', 'तत्सम-तद्भव, पर्यायवाची एवं विलोम', 'पर्यायवाची, विलोम एवं मुहावरे', 'छत्तीसगढ़ी भाषा एवं व्याकरण'] },
      { id: 'sub_english', subjectId: 'sub_english', titleEn: 'English', titleHi: 'General English & Comprehension', examCode: 'ALL', aliases: ['General English', 'English Language', 'English Grammar', 'अंग्रेजी', 'सामान्य अंग्रेजी'], topics: ['Parts of Speech, Tenses & Voice', 'Direct/Indirect Speech & Error Spotting', 'Synonyms, Antonyms, Idioms & One-Word', 'Reading Comprehension & Cloze Test'] },
      { id: 'sub_computer', subjectId: 'sub_computer', titleEn: 'Computer Knowledge', titleHi: 'कम्प्यूटर सामान्य ज्ञान', examCode: 'ALL', aliases: ['Computer', 'Computer Awareness', 'ICT', 'कंप्यूटर', 'कम्प्यूटर'], topics: ['Computer Architecture, Hardware & Memory', 'Operating System & MS Office (Word, Excel, PowerPoint)', 'Internet, Networking, Email & Cyber Security', 'Multimedia, Printers & Antivirus'] },
      { id: 'sub_pedagogy', subjectId: 'sub_pedagogy', titleEn: 'Child Development & Pedagogy', titleHi: 'बाल विकास एवं शिक्षाशास्त्र (CDP)', examCode: 'TET', aliases: ['sub_cdp', 'CDP', 'Pedagogy', 'Teaching Aptitude', 'बाल विकास', 'शिक्षाशास्त्र'], topics: ['Learning Theories', 'Inclusive Education', 'Teaching Aptitude & Assessment'] },
      { id: 'sub_current_affairs', subjectId: 'sub_current_affairs', titleEn: 'Current Affairs', titleHi: 'समसामयिकी (Current Affairs)', examCode: 'ALL', aliases: ['Chhattisgarh, National & International Current Affairs', 'Daily Current Affairs', 'समसामयिकी', 'करंट अफेयर्स'], topics: ['National & International Events', 'Chhattisgarh Current Affairs & Schemes', 'Awards, Sports, Summits & Reports'] }
    ];

    const subjectsById = new Map();
    const subjectLookupMap = new Map();

    function registerSubject(subObj) {
      if (!subObj || (!subObj.titleEn && !subObj.nameEn)) return;
      const titleEn = String(subObj.titleEn || subObj.nameEn).trim();
      const titleHi = String(subObj.titleHi || subObj.nameHi || titleEn).trim();
      const lowEn = titleEn.toLowerCase();

      // Check if this subject matches an existing registered subject via ID, title, or alias
      let matched = null;
      if (subObj.subjectId && subjectsById.has(subObj.subjectId)) {
        matched = subjectsById.get(subObj.subjectId);
      } else if (subObj.id && subjectsById.has(subObj.id)) {
        matched = subjectsById.get(subObj.id);
      } else if (subjectLookupMap.has(lowEn)) {
        matched = subjectLookupMap.get(lowEn);
      }

      if (!matched) {
        const subjectId = String(subObj.subjectId || subObj.id || makeSlugId('sub', titleEn)).trim();
        matched = {
          id: subjectId,
          subjectId,
          titleEn,
          titleHi,
          examCode: subObj.examCode || 'ALL',
          aliases: Array.isArray(subObj.aliases) ? [...subObj.aliases] : [],
          topics: Array.isArray(subObj.topics) ? [...subObj.topics] : []
        };
        subjectsById.set(subjectId, matched);
      } else {
        if (Array.isArray(subObj.aliases)) {
          subObj.aliases.forEach((al) => {
            if (al && !matched.aliases.some((x) => x.toLowerCase() === String(al).toLowerCase())) {
              matched.aliases.push(String(al).trim());
            }
          });
        }
        if (Array.isArray(subObj.topics)) {
          subObj.topics.forEach((t) => {
            const cleanT = String(t || '').trim();
            if (cleanT && !matched.topics.some((et) => et.toLowerCase() === cleanT.toLowerCase())) {
              matched.topics.push(cleanT);
            }
          });
        }
      }

      subjectLookupMap.set(matched.subjectId.toLowerCase(), matched);
      subjectLookupMap.set(matched.titleEn.toLowerCase(), matched);
      subjectLookupMap.set(matched.titleHi.toLowerCase(), matched);
      (matched.aliases || []).forEach((al) => {
        if (al) subjectLookupMap.set(String(al).trim().toLowerCase(), matched);
      });
    }

    baseSubjects.forEach(registerSubject);
    builtinSubjectFallbacks.forEach(registerSubject);
    (customTax.customSubjects || []).forEach(registerSubject);
    stateSubjectMaster.forEach(registerSubject);

    const subjects = Array.from(subjectsById.values());

    // 3. Build Hierarchical Topic Master
    const baseTopics = window.CGpediaCloud && Array.isArray(window.CGpediaCloud.DEFAULT_TOPICS)
      ? window.CGpediaCloud.DEFAULT_TOPICS
      : [];
    const topicsById = new Map();

    function registerTopic(topObj) {
      if (!topObj || (!topObj.titleEn && !topObj.nameEn)) return;
      const titleEn = String(topObj.titleEn || topObj.nameEn).trim();
      const titleHi = String(topObj.titleHi || topObj.nameHi || titleEn).trim();
      const parentSub = subjectLookupMap.get(String(topObj.subjectId || topObj.subject || '').trim().toLowerCase()) || subjects[0];
      const subjectId = parentSub ? parentSub.subjectId : String(topObj.subjectId || 'sub_cg_gk');
      const topicId = String(topObj.topicId || topObj.id || makeSlugId(`top_${subjectId.replace(/^sub_/, '')}`, titleEn)).trim();

      let existing = topicsById.get(topicId);
      if (!existing) {
        // Also check same subjectId + titleEn
        for (const t of topicsById.values()) {
          if (t.subjectId === subjectId && t.titleEn.toLowerCase() === titleEn.toLowerCase()) {
            existing = t;
            break;
          }
        }
      }

      if (!existing) {
        existing = {
          id: topicId,
          topicId,
          subjectId,
          titleEn,
          titleHi,
          keywords: Array.isArray(topObj.keywords) ? [...topObj.keywords] : []
        };
        topicsById.set(topicId, existing);
      } else {
        existing.titleEn = titleEn;
        existing.titleHi = titleHi;
        if (Array.isArray(topObj.keywords)) {
          existing.keywords = Array.from(new Set([...(existing.keywords || []), ...topObj.keywords]));
        }
      }

      if (parentSub && !parentSub.topics.some((t) => t.toLowerCase() === titleEn.toLowerCase())) {
        parentSub.topics.push(titleEn);
      }
    }

    baseTopics.forEach(registerTopic);
    // Ensure every topic string on every subject is also registered in Topic Master
    subjects.forEach((s) => {
      (s.topics || []).forEach((tName) => {
        registerTopic({
          subjectId: s.subjectId,
          titleEn: tName,
          titleHi: tName,
          keywords: [tName.toLowerCase()]
        });
      });
    });
    stateTopicMaster.forEach(registerTopic);

    const topicMaster = Array.from(topicsById.values());

    // 4. Build Hierarchical Subtopic Master
    const baseSubtopics = window.CGpediaCloud && Array.isArray(window.CGpediaCloud.DEFAULT_SUBTOPICS)
      ? window.CGpediaCloud.DEFAULT_SUBTOPICS
      : [];
    const subtopicsById = new Map();

    function registerSubtopic(stObj) {
      if (!stObj || (!stObj.titleEn && !stObj.nameEn)) return;
      const titleEn = String(stObj.titleEn || stObj.nameEn).trim();
      const titleHi = String(stObj.titleHi || stObj.nameHi || titleEn).trim();
      let parentTop = topicsById.get(String(stObj.topicId || '').trim());
      if (!parentTop && stObj.topic) {
        const lowT = String(stObj.topic).trim().toLowerCase();
        parentTop = topicMaster.find((t) => t.titleEn.toLowerCase() === lowT || t.titleHi.toLowerCase() === lowT);
      }
      const topicId = parentTop ? parentTop.topicId : String(stObj.topicId || (topicMaster[0] && topicMaster[0].topicId) || 'top_cg_history');
      const subjectId = parentTop ? parentTop.subjectId : String(stObj.subjectId || 'sub_cg_gk');
      const subtopicId = String(stObj.subtopicId || stObj.id || makeSlugId('subtop', `${topicId}_${titleEn}`)).trim();

      let existing = subtopicsById.get(subtopicId);
      if (!existing) {
        for (const st of subtopicsById.values()) {
          if (st.topicId === topicId && st.titleEn.toLowerCase() === titleEn.toLowerCase()) {
            existing = st;
            break;
          }
        }
      }

      if (!existing) {
        existing = {
          id: subtopicId,
          subtopicId,
          topicId,
          subjectId,
          titleEn,
          titleHi,
          keywords: Array.isArray(stObj.keywords) ? [...stObj.keywords] : [titleEn.toLowerCase()]
        };
        subtopicsById.set(subtopicId, existing);
      } else {
        existing.titleEn = titleEn;
        existing.titleHi = titleHi;
        if (Array.isArray(stObj.keywords)) {
          existing.keywords = Array.from(new Set([...(existing.keywords || []), ...stObj.keywords]));
        }
      }
    }

    baseSubtopics.forEach(registerSubtopic);
    stateSubtopicMaster.forEach(registerSubtopic);
    const subtopicMaster = Array.from(subtopicsById.values());

    const allTopicsSet = new Set();
    topicMaster.forEach((t) => allTopicsSet.add(t.titleEn));
    subjects.forEach((s) => (s.topics || []).forEach((t) => allTopicsSet.add(t)));

    const allSubtopicsSet = new Set();
    subtopicMaster.forEach((st) => allSubtopicsSet.add(st.titleEn));

    return {
      examCategories,
      subjects,
      topicMaster,
      topics: topicMaster,
      subtopicMaster,
      subtopics: subtopicMaster,
      allTopics: Array.from(allTopicsSet),
      allSubtopics: Array.from(allSubtopicsSet),

      findExam(val) {
        if (!val) return null;
        const clean = String(val).trim();
        const up = clean.toUpperCase().replace(/[\s-]+/g, '_');
        const low = clean.toLowerCase();
        return examCategories.find((e) =>
          e.code.toUpperCase() === up ||
          e.examId.toLowerCase() === low ||
          e.nameEn.toLowerCase() === low ||
          e.nameHi.toLowerCase() === low ||
          e.nameEn.toLowerCase().includes(low)
        ) || null;
      },

      isKnownExamCode(code) {
        if (!code) return false;
        const up = String(code).trim().toUpperCase();
        if (up === 'ALL') return true;
        return Boolean(this.findExam(code));
      },

      findSubject(subVal) {
        if (!subVal) return null;
        const low = String(subVal).trim().toLowerCase();
        if (subjectLookupMap.has(low)) return subjectLookupMap.get(low);
        return subjects.find((s) =>
          s.subjectId.toLowerCase() === low ||
          s.titleEn.toLowerCase() === low ||
          s.titleHi.toLowerCase() === low ||
          (s.aliases || []).some((a) => a.toLowerCase() === low)
        ) || null;
      },

      findTopic(subVal, topicVal) {
        if (!topicVal) return null;
        const lowT = String(topicVal).trim().toLowerCase();
        const subObj = subVal ? this.findSubject(subVal) : null;
        if (subObj) {
          const scoped = topicMaster.find((t) =>
            t.subjectId === subObj.subjectId &&
            (t.topicId.toLowerCase() === lowT || t.titleEn.toLowerCase() === lowT || t.titleHi.toLowerCase() === lowT)
          );
          if (scoped) return scoped;
        }
        return topicMaster.find((t) =>
          t.topicId.toLowerCase() === lowT ||
          t.titleEn.toLowerCase() === lowT ||
          t.titleHi.toLowerCase() === lowT
        ) || null;
      },

      findSubtopic(topicVal, subtopicVal, subVal) {
        if (!subtopicVal) return null;
        const lowSt = String(subtopicVal).trim().toLowerCase();
        const topObj = topicVal ? this.findTopic(subVal, topicVal) : null;
        if (topObj) {
          const scoped = subtopicMaster.find((st) =>
            st.topicId === topObj.topicId &&
            (st.subtopicId.toLowerCase() === lowSt || st.titleEn.toLowerCase() === lowSt || st.titleHi.toLowerCase() === lowSt)
          );
          if (scoped) return scoped;
        }
        return subtopicMaster.find((st) =>
          st.subtopicId.toLowerCase() === lowSt ||
          st.titleEn.toLowerCase() === lowSt ||
          st.titleHi.toLowerCase() === lowSt
        ) || null;
      },

      isKnownTopic(subName, topicName) {
        if (!topicName) return true;
        const lowT = String(topicName).trim().toLowerCase();
        if (lowT === 'general' || lowT === 'general knowledge' || lowT === 'miscellaneous' || lowT === 'all') return true;
        return Boolean(this.findTopic(subName, topicName));
      },

      getSubjectsForExam(examVal) {
        if (!examVal || String(examVal).toUpperCase() === 'ALL') return subjects;
        const ex = this.findExam(examVal);
        if (!ex || !Array.isArray(ex.subjectIds) || ex.subjectIds.length === 0) return subjects;
        const filtered = subjects.filter((s) => ex.subjectIds.includes(s.subjectId) || s.examCode === ex.code || s.examCode === 'ALL');
        return filtered.length > 0 ? filtered : subjects;
      },

      getTopicsForSubject(subVal) {
        if (!subVal || String(subVal).toUpperCase() === 'ALL') return topicMaster;
        const subObj = this.findSubject(subVal);
        if (!subObj) return topicMaster;
        return topicMaster.filter((t) => t.subjectId === subObj.subjectId);
      },

      getSubtopicsForTopic(topicVal, subVal) {
        if (!topicVal || String(topicVal).toUpperCase() === 'ALL') {
          if (subVal && String(subVal).toUpperCase() !== 'ALL') {
            const subObj = this.findSubject(subVal);
            if (subObj) return subtopicMaster.filter((st) => st.subjectId === subObj.subjectId);
          }
          return subtopicMaster;
        }
        const topObj = this.findTopic(subVal, topicVal);
        if (!topObj) return [];
        return subtopicMaster.filter((st) => st.topicId === topObj.topicId);
      },

      resolveHierarchy(input) {
        const raw = input || {};
        const rawExams = [];
        if (Array.isArray(raw.examIds)) rawExams.push(...raw.examIds);
        if (Array.isArray(raw.examCodes)) rawExams.push(...raw.examCodes);
        if (raw.examCode) {
          String(raw.examCode).split(/[;|,]/).forEach((x) => {
            if (x.trim()) rawExams.push(x.trim());
          });
        }
        const resolvedExamCodes = [];
        rawExams.forEach((re) => {
          const exObj = this.findExam(re);
          const code = exObj ? exObj.code : String(re || '').trim().toUpperCase().replace(/\s+/g, '_');
          if (code && !resolvedExamCodes.includes(code)) resolvedExamCodes.push(code);
        });
        if (resolvedExamCodes.length === 0) resolvedExamCodes.push('CGPSC');

        const subObj = this.findSubject(raw.subjectId || raw.subjectTag || raw.subject);
        const topObj = this.findTopic(subObj ? subObj.subjectId : (raw.subjectTag || ''), raw.topicId || raw.topic);
        const subtopObj = this.findSubtopic(topObj ? topObj.topicId : (raw.topic || ''), raw.subtopicId || raw.subtopic, subObj ? subObj.subjectId : '');

        const finalSubjectObj = subObj || (topObj ? this.findSubject(topObj.subjectId) : null);
        const isGenericPlaceholderTopic = !topObj && (!raw.topic || ['general knowledge', 'general', 'unknown', 'uncategorized'].includes(String(raw.topic).trim().toLowerCase()));

        return {
          examIds: resolvedExamCodes,
          examCode: resolvedExamCodes[0] || 'CGPSC',
          subjectId: finalSubjectObj ? finalSubjectObj.subjectId : '',
          subjectTag: finalSubjectObj ? finalSubjectObj.titleEn : String(raw.subjectTag || raw.subject || '').trim(),
          topicId: topObj ? topObj.topicId : '',
          topic: topObj ? topObj.titleEn : String(raw.topic || '').trim(),
          subtopicId: subtopObj ? subtopObj.subtopicId : '',
          subtopic: subtopObj ? subtopObj.titleEn : String(raw.subtopic || '').trim(),
          isFullyCategorised: Boolean(finalSubjectObj && topObj && !isGenericPlaceholderTopic)
        };
      }
    };
  }

  function addCustomTaxonomyEntry(state, api, { examCode, subjectName, topicName, subtopicName }) {
    state.customTaxonomy = state.customTaxonomy || { customCategories: [], customSubjects: [] };
    state.customTaxonomy.customCategories = state.customTaxonomy.customCategories || [];
    state.customTaxonomy.customSubjects = state.customTaxonomy.customSubjects || [];
    state.examMaster = state.examMaster || [];
    state.subjectMaster = state.subjectMaster || [];
    state.topicMaster = state.topicMaster || [];
    state.subtopicMaster = state.subtopicMaster || [];

    const cleanExam = String(examCode || '').trim().toUpperCase().replace(/\s+/g, '_');
    const cleanSub = String(subjectName || '').trim();
    const cleanTopic = String(topicName || '').trim();
    const cleanSubtopic = String(subtopicName || '').trim();

    let catalog = getTaxonomyCatalog(state);
    if (cleanExam && !catalog.isKnownExamCode(cleanExam)) {
      const newExam = {
        id: makeSlugId('exam', cleanExam),
        examId: makeSlugId('exam', cleanExam),
        code: cleanExam,
        nameEn: cleanExam.replace(/_/g, ' '),
        nameHi: cleanExam.replace(/_/g, ' '),
        icon: '📘',
        badge: 'Custom',
        subjectIds: []
      };
      state.customTaxonomy.customCategories.push(newExam);
      state.examMaster.push(newExam);
      if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('exams', newExam.id, newExam);
    }

    catalog = getTaxonomyCatalog(state);
    let subObj = cleanSub ? catalog.findSubject(cleanSub) : null;
    if (cleanSub && !subObj) {
      const subjectId = makeSlugId('sub', cleanSub);
      const newSub = {
        id: subjectId,
        subjectId,
        titleEn: cleanSub,
        titleHi: cleanSub,
        examCode: cleanExam || 'ALL',
        aliases: [],
        topics: cleanTopic ? [cleanTopic] : []
      };
      state.customTaxonomy.customSubjects.push(newSub);
      state.subjectMaster.push(newSub);
      if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('subjects', newSub.id, newSub);
      catalog = getTaxonomyCatalog(state);
      subObj = catalog.findSubject(subjectId);
    }

    let topObj = (subObj && cleanTopic) ? catalog.findTopic(subObj.subjectId, cleanTopic) : null;
    if (subObj && cleanTopic && !topObj) {
      const topicId = makeSlugId(`top_${subObj.subjectId.replace(/^sub_/, '')}`, cleanTopic);
      const newTop = {
        id: topicId,
        topicId,
        subjectId: subObj.subjectId,
        titleEn: cleanTopic,
        titleHi: cleanTopic,
        keywords: [cleanTopic.toLowerCase()]
      };
      state.topicMaster.push(newTop);
      if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('topics', newTop.id, newTop);
      catalog = getTaxonomyCatalog(state);
      topObj = catalog.findTopic(subObj.subjectId, topicId);
    }

    if (topObj && cleanSubtopic && !catalog.findSubtopic(topObj.topicId, cleanSubtopic)) {
      const subtopicId = makeSlugId('subtop', `${topObj.topicId}_${cleanSubtopic}`);
      const newSubtop = {
        id: subtopicId,
        subtopicId,
        topicId: topObj.topicId,
        subjectId: topObj.subjectId,
        titleEn: cleanSubtopic,
        titleHi: cleanSubtopic,
        keywords: [cleanSubtopic.toLowerCase()]
      };
      state.subtopicMaster.push(newSubtop);
      if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('subtopics', newSubtop.id, newSubtop);
    }

    api.saveState();
    if (window.CGpediaCloud) {
      window.CGpediaCloud.saveCloudDoc('app_config', 'taxonomy', Object.assign({ configKey: 'taxonomy' }, state.customTaxonomy));
    }
  }

  function resolveCanonicalQuestionHierarchy(rawObj, catalogOrState) {
    const raw = rawObj || {};
    const cat = (catalogOrState && typeof catalogOrState.resolveHierarchy === 'function')
      ? catalogOrState
      : getTaxonomyCatalog(catalogOrState || {});
    return cat.resolveHierarchy(raw);
  }

  function upsertCategoryMasterItem(state, api, type, payload) {
    if (!state || !payload) return null;
    state.customTaxonomy = state.customTaxonomy || { customCategories: [], customSubjects: [] };
    state.customTaxonomy.customCategories = state.customTaxonomy.customCategories || [];
    state.customTaxonomy.customSubjects = state.customTaxonomy.customSubjects || [];
    state.examMaster = state.examMaster || [];
    state.subjectMaster = state.subjectMaster || [];
    state.topicMaster = state.topicMaster || [];
    state.subtopicMaster = state.subtopicMaster || [];

    const cleanType = String(type || '').toLowerCase();
    const nowIso = new Date().toISOString();

    if (cleanType === 'exam') {
      const code = String(payload.code || payload.examId || payload.nameEn || 'CUSTOM_EXAM').trim().toUpperCase().replace(/\s+/g, '_');
      const examId = String(payload.examId || payload.id || code).trim();
      const examObj = {
        id: examId,
        examId,
        code,
        nameEn: String(payload.nameEn || code).trim(),
        nameHi: String(payload.nameHi || payload.nameEn || code).trim(),
        icon: payload.icon || '📘',
        badge: payload.badge || 'Active',
        subjectIds: Array.isArray(payload.subjectIds) ? payload.subjectIds : [],
        updatedAtIso: nowIso
      };
      const idx = state.examMaster.findIndex((e) => (e.examId || e.code) === examId || e.code === code);
      if (idx >= 0) state.examMaster[idx] = Object.assign({}, state.examMaster[idx], examObj);
      else state.examMaster.push(examObj);

      const cIdx = state.customTaxonomy.customCategories.findIndex((e) => (e.examId || e.code) === examId || e.code === code);
      if (cIdx >= 0) state.customTaxonomy.customCategories[cIdx] = Object.assign({}, state.customTaxonomy.customCategories[cIdx], examObj);
      else state.customTaxonomy.customCategories.push(examObj);

      if (api && typeof api.saveState === 'function') api.saveState();
      if (window.CGpediaCloud) {
        window.CGpediaCloud.saveCloudDoc('exams', examObj.id, examObj);
        window.CGpediaCloud.saveCloudDoc('app_config', 'taxonomy', Object.assign({ configKey: 'taxonomy' }, state.customTaxonomy));
      }
      return examObj;
    }

    if (cleanType === 'subject') {
      const titleEn = String(payload.titleEn || payload.subjectId || 'General Studies').trim();
      const subjectId = String(payload.subjectId || payload.id || makeSlugId('sub', titleEn)).trim();
      const subObj = {
        id: subjectId,
        subjectId,
        titleEn,
        titleHi: String(payload.titleHi || titleEn).trim(),
        examCode: payload.examCode || 'ALL',
        aliases: Array.isArray(payload.aliases) ? payload.aliases : [],
        topics: Array.isArray(payload.topics) ? payload.topics : [],
        updatedAtIso: nowIso
      };
      const idx = state.subjectMaster.findIndex((s) => (s.subjectId || s.id) === subjectId || String(s.titleEn || '').toLowerCase() === titleEn.toLowerCase());
      if (idx >= 0) state.subjectMaster[idx] = Object.assign({}, state.subjectMaster[idx], subObj);
      else state.subjectMaster.push(subObj);

      const cIdx = state.customTaxonomy.customSubjects.findIndex((s) => (s.subjectId || s.id) === subjectId || String(s.titleEn || '').toLowerCase() === titleEn.toLowerCase());
      if (cIdx >= 0) state.customTaxonomy.customSubjects[cIdx] = Object.assign({}, state.customTaxonomy.customSubjects[cIdx], subObj);
      else state.customTaxonomy.customSubjects.push(subObj);

      if (api && typeof api.saveState === 'function') api.saveState();
      if (window.CGpediaCloud) {
        window.CGpediaCloud.saveCloudDoc('subjects', subObj.id, subObj);
        window.CGpediaCloud.saveCloudDoc('app_config', 'taxonomy', Object.assign({ configKey: 'taxonomy' }, state.customTaxonomy));
      }
      return subObj;
    }

    if (cleanType === 'topic') {
      const subjectId = String(payload.subjectId || 'sub_general_studies').trim();
      const titleEn = String(payload.titleEn || 'General Topic').trim();
      const topicId = String(payload.topicId || payload.id || makeSlugId(`top_${subjectId.replace(/^sub_/, '')}`, titleEn)).trim();
      const topObj = {
        id: topicId,
        topicId,
        subjectId,
        titleEn,
        titleHi: String(payload.titleHi || titleEn).trim(),
        keywords: Array.isArray(payload.keywords) ? payload.keywords : [titleEn.toLowerCase()],
        updatedAtIso: nowIso
      };
      const idx = state.topicMaster.findIndex((t) => (t.topicId || t.id) === topicId || (t.subjectId === subjectId && String(t.titleEn || '').toLowerCase() === titleEn.toLowerCase()));
      if (idx >= 0) state.topicMaster[idx] = Object.assign({}, state.topicMaster[idx], topObj);
      else state.topicMaster.push(topObj);

      if (api && typeof api.saveState === 'function') api.saveState();
      if (window.CGpediaCloud) {
        window.CGpediaCloud.saveCloudDoc('topics', topObj.id, topObj);
      }
      return topObj;
    }

    if (cleanType === 'subtopic') {
      const topicId = String(payload.topicId || 'top_general').trim();
      const subjectId = String(payload.subjectId || '').trim();
      const titleEn = String(payload.titleEn || 'General Subtopic').trim();
      const subtopicId = String(payload.subtopicId || payload.id || makeSlugId('subtop', `${topicId}_${titleEn}`)).trim();
      const stObj = {
        id: subtopicId,
        subtopicId,
        topicId,
        subjectId,
        titleEn,
        titleHi: String(payload.titleHi || titleEn).trim(),
        keywords: Array.isArray(payload.keywords) ? payload.keywords : [titleEn.toLowerCase()],
        updatedAtIso: nowIso
      };
      const idx = state.subtopicMaster.findIndex((st) => (st.subtopicId || st.id) === subtopicId || (st.topicId === topicId && String(st.titleEn || '').toLowerCase() === titleEn.toLowerCase()));
      if (idx >= 0) state.subtopicMaster[idx] = Object.assign({}, state.subtopicMaster[idx], stObj);
      else state.subtopicMaster.push(stObj);

      if (api && typeof api.saveState === 'function') api.saveState();
      if (window.CGpediaCloud) {
        window.CGpediaCloud.saveCloudDoc('subtopics', stObj.id, stObj);
      }
      return stObj;
    }

    return null;
  }

  function renameCategoryMasterItem(state, api, type, id, newEn, newHi) {
    if (!state || !id || !newEn) return;
    const cleanType = String(type || '').toLowerCase();
    const cleanEn = String(newEn).trim();
    const cleanHi = String(newHi || cleanEn).trim();
    const catalog = getTaxonomyCatalog(state);

    if (cleanType === 'exam') {
      const existing = catalog.findExam(id);
      upsertCategoryMasterItem(state, api, 'exam', Object.assign({}, existing || {}, {
        id,
        examId: id,
        code: (existing && existing.code) || id,
        nameEn: cleanEn,
        nameHi: cleanHi
      }));
    } else if (cleanType === 'subject') {
      const existing = catalog.findSubject(id);
      const oldEn = existing ? existing.titleEn : '';
      upsertCategoryMasterItem(state, api, 'subject', Object.assign({}, existing || {}, {
        id,
        subjectId: id,
        titleEn: cleanEn,
        titleHi: cleanHi
      }));
      (state.questionBank || []).forEach((q) => {
        if (q.subjectId === id || (oldEn && String(q.subjectTag || '').toLowerCase() === oldEn.toLowerCase())) {
          q.subjectId = id;
          q.subjectTag = cleanEn;
        }
      });
    } else if (cleanType === 'topic') {
      const existing = (catalog.topics || []).find((t) => t.topicId === id);
      const oldEn = existing ? existing.titleEn : '';
      upsertCategoryMasterItem(state, api, 'topic', Object.assign({}, existing || {}, {
        id,
        topicId: id,
        subjectId: (existing && existing.subjectId) || 'sub_general_studies',
        titleEn: cleanEn,
        titleHi: cleanHi
      }));
      (state.questionBank || []).forEach((q) => {
        if (q.topicId === id || (oldEn && String(q.topic || '').toLowerCase() === oldEn.toLowerCase())) {
          q.topicId = id;
          q.topic = cleanEn;
        }
      });
    } else if (cleanType === 'subtopic') {
      const existing = (catalog.subtopics || []).find((st) => st.subtopicId === id);
      const oldEn = existing ? existing.titleEn : '';
      upsertCategoryMasterItem(state, api, 'subtopic', Object.assign({}, existing || {}, {
        id,
        subtopicId: id,
        topicId: (existing && existing.topicId) || '',
        subjectId: (existing && existing.subjectId) || '',
        titleEn: cleanEn,
        titleHi: cleanHi
      }));
      (state.questionBank || []).forEach((q) => {
        if (q.subtopicId === id || (oldEn && String(q.subtopic || '').toLowerCase() === oldEn.toLowerCase())) {
          q.subtopicId = id;
          q.subtopic = cleanEn;
        }
      });
    }

    if (api && typeof api.saveState === 'function') api.saveState();
  }

  // Expanded Hindi (Devanagari) & English Keyword Rules for High-Accuracy Categorisation
  const EXTRA_SUBJECT_TOPIC_RULES = [
    {
      subjectId: 'sub_cg_gs',
      topicTitle: 'History of Chhattisgarh',
      keywords: ['कलचुरी', 'रतनपुर', 'रायपुर शाखा', 'कलिंगराज', 'रत्नदेव', 'जाजल्लदेव', 'प्रतापमल्ल', 'मराठा', 'बिंबाजी', 'भोंसले', 'सूबा शासन', 'हल्बा विद्रोह', 'परलकोट', 'गेंदसिंह', 'वीर नारायण सिंह', 'सोनाखान', 'भूमकाल', 'गुण्डाधूर', 'सिरपुर', 'शरभपुरीय', 'पाण्डु वंश', 'बाण वंश', 'छिंदक नागवंश', 'काकतीय', 'अन्नमदेव', 'बस्तर का इतिहास', 'जंगल सत्याग्रह', 'गट्टासिल्ली', 'रुद्री नवागांव', 'kalchuri', 'ratanpur', 'sonakhan', 'veer narayan', 'bhumkal', 'gundadhur', 'sirpur']
    },
    {
      subjectId: 'sub_cg_gs',
      topicTitle: 'Tribes, Art & Culture',
      keywords: ['जनजाति', 'गोंड', 'बैगा', 'अबूझमाड़िया', 'कमार', 'कोरवा', 'बिरहोर', 'उरांव', 'कंवर', 'हलबा', 'भतरा', 'मुरिया', 'माड़िया', 'घोटुल', 'धुमकुड़िया', 'सुआ नृत्य', 'पंथी', 'राउत नाचा', 'करमा', 'सरहुल', 'ककसार', 'गौर नृत्य', 'पंडवानी', 'तीजन बाई', 'चक्रधर समारोह', 'बस्तर दशहरा', 'हरेली', 'छेरछेरा', 'पोला', 'भोजली', 'तीजा', 'कमरछठ', 'मातर', 'मड़ई', 'गोदना', 'बांस गीत', 'ददरिया', 'भरथरी', 'चंदैनी गोंदा', 'नाचा', 'दाऊ मंदराजी', 'हबीब तनवीर', 'gond', 'baiga', 'abujhmaria', 'pandwani', 'panthi', 'karma', 'raut nacha', 'hareli', 'cherchera', 'bastar dussehra']
    },
    {
      subjectId: 'sub_cg_gs',
      topicTitle: 'Geography & Climate of CG',
      keywords: ['छत्तीसगढ़', 'रायपुर', 'बिलासपुर', 'बस्तर', 'सरगुजा', 'दुर्ग', 'राजनांदगांव', 'कोरबा', 'रायगढ़', 'जगदलपुर', 'अंबिकापुर', 'धमतरी', 'महासमुंद', 'कांकेर', 'दंतेवाड़ा', 'बीजापुर', 'सुकमा', 'नारायणपुर', 'कोंडागांव', 'कबीरधाम', 'कवर्धा', 'बेमेतरा', 'बालोद', 'बलौदाबाजार', 'गरियाबंद', 'मुंगेली', 'जांजगीर', 'चांपा', 'सूरजपुर', 'बलरामपुर', 'जशपुर', 'कोरिया', 'मनेंद्रगढ़', 'सक्ती', 'सारंगढ़', 'मोहला', 'खैरागढ़', 'महानदी', 'शिवनाथ', 'इंद्रावती', 'हसदेव', 'अरपा', 'पैरी', 'सोंढूर', 'खारून', 'सबरी', 'कोटरी', 'रिहंद', 'कन्हार', 'केलो', 'मांड', 'जोंक', 'सिहावा', 'चित्रकोट', 'तीरथगढ़', 'अमृतधारा', 'सातधारा', 'रानीदाह', 'केंदई', 'गौरलाटा', 'सामरी पाट', 'मैनपाट', 'जशपुर पाट', 'दण्डकारण्य', 'बैलाडीला', 'नंदराज', 'दलहा पहाड़', 'मैक़ल', 'छुरी उदयपुर', 'कांगेर घाटी', 'इंद्रावती राष्ट्रीय उद्यान', 'गुरु घासीदास', 'अचानकमार', 'उदंती', 'सीतानदी', 'बारनवापारा', 'तमोर पिंगला', 'सेमरसोत', 'बादलखोल', 'भोरमदेव', 'गंगरेल', 'मिनीमाता बांगो', 'तांदुला', 'दुधवा', 'खूंटाघाट', 'कोडार', 'chhattisgarh', 'mahanadi', 'indravati', 'shivnath', 'hasdeo', 'chitrakote', 'tirathgarh', 'bailadila', 'mainpat', 'gaurlata']
    },
    {
      subjectId: 'sub_cg_gs',
      topicTitle: 'Panchayati Raj & Local Administration',
      keywords: ['पंचायती राज', 'ग्राम सभा', 'ग्राम पंचायत', 'जनपद पंचायत', 'जिला पंचायत', 'सरपंच', 'उपसरपंच', 'पंच', '73वां संशोधन', '74वां संशोधन', 'नगर निगम', 'नगर पालिका', 'नगर पंचायत', 'महापौर', 'पार्षद', 'बलवंत राय मेहता', 'अशोक मेहता', 'अनुसूचित क्षेत्र', 'पेसा', 'pesa', 'panchayati raj', 'gram sabha', 'zila panchayat', 'janpad panchayat', 'sarpanch']
    },
    {
      subjectId: 'sub_cg_gs',
      topicTitle: 'CG Economy, Forest & Agriculture',
      keywords: ['तेंदूपत्ता', 'साल वन', 'सागौन', 'लाख', 'कोसा', 'टिन', 'कोयला', 'लौह अयस्क', 'बॉक्साइट', 'डोलोमाइट', 'चूना पत्थर', 'कोरंडम', 'हीरा', 'भिलाई इस्पात', 'बाल्को', 'एनटीपीसी', 'धान का कटोरा', 'समर्थन मूल्य', 'आर्थिक सर्वेक्षण', 'छत्तीसगढ़ बजट', 'महतारी वंदन', 'कृषक उन्नति', 'tendu', 'bhilai steel', 'balco', 'tin ore']
    },
    {
      subjectId: 'sub_hindi',
      topicTitle: 'वर्णमाला, संधि एवं समास (Sandhi & Samas)',
      keywords: ['वर्णमाला', 'स्वर', 'व्यंजन', 'अल्पप्राण', 'महाप्राण', 'अघोष', 'सघोष', 'कंठ्य', 'तालव्य', 'मूर्धन्य', 'दंत्य', 'ओष्ठ्य', 'अनुस्वार', 'विसर्ग', 'संधि', 'स्वर संधि', 'दीर्घ संधि', 'गुण संधि', 'वृद्धि संधि', 'यण संधि', 'अयादि संधि', 'व्यंजन संधि', 'विसर्ग संधि', 'समास', 'अव्ययीभाव', 'तत्पुरुष', 'कर्मधारय', 'द्विगु', 'द्वंद्व', 'बहुव्रीहि', 'समास विग्रह', 'संधि विच्छेद', 'छत्तीसगढ़ी भाषा', 'छत्तीसगढ़ी व्याकरण', 'जनउला', 'हाना']
    },
    {
      subjectId: 'sub_hindi',
      topicTitle: 'तत्सम-तद्भव, पर्यायवाची एवं विलोम',
      keywords: ['तत्सम', 'तद्भव', 'देशज', 'विदेशज', 'उपसर्ग', 'प्रत्यय', 'पर्यायवाची', 'विलोम', 'अनेकार्थी', 'वाक्यांश के लिए एक शब्द', 'मुहावरा', 'मुहावरे', 'लोकोक्ति', 'वर्तनी', 'वाक्य शुद्धि', 'रस', 'छंद', 'अलंकार', 'श्रृंगार रस', 'वीर रस', 'अनुप्रास', 'यमक', 'श्लेष', 'उपमा', 'रूपक', 'उत्प्रेक्षा', 'दोहा', 'चौपाई', 'सोरठा', 'संज्ञा', 'सर्वनाम', 'विशेषण', 'क्रिया', 'अव्यय', 'कारक', 'लिंग', 'वचन', 'काल']
    },
    {
      subjectId: 'sub_polity',
      topicTitle: 'Constitution',
      keywords: ['संविधान', 'अनुच्छेद', 'अनुसूची', 'प्रस्तावना', 'मौलिक अधिकार', 'मूल अधिकार', 'नीति निदेशक', 'मूल कर्तव्य', 'मौलिक कर्तव्य', 'संविधान संशोधन', 'संविधान सभा', 'प्रारूप समिति', 'अंबेडकर', 'राष्ट्रपति', 'उपराष्ट्रपति', 'प्रधानमंत्री', 'मंत्रिपरिषद', 'राज्यपाल', 'मुख्यमंत्री', 'संसद', 'लोकसभा', 'राज्यसभा', 'विधानसभा', 'विधान परिषद', 'धन विधेयक', 'वित्त विधेयक', 'अध्यादेश', 'महाभियोग', 'सर्वोच्च न्यायालय', 'उच्चतम न्यायालय', 'उच्च न्यायालय', 'रिट', 'बंदी प्रत्यक्षीकरण', 'निर्वाचन आयोग', 'नियंत्रक एवं महालेखा परीक्षक', 'संघ लोक सेवा आयोग', 'वित्त आयोग', 'आपातकाल', 'article ', 'constitution', 'parliament', 'fundamental right', 'directive principle', 'supreme court', 'president', 'governor', 'lok sabha', 'rajya sabha']
    },
    {
      subjectId: 'sub_history',
      topicTitle: 'Ancient Indian History',
      keywords: ['सिंधु घाटी', 'हड़प्पा', 'मोहनजोदड़ो', 'लोथल', 'कालीबंगा', 'धौलावीरा', 'वैदिक', 'ऋग्वेद', 'सामवेद', 'यजुर्वेद', 'अथर्ववेद', 'उपनिषद', 'महाजनपद', 'मगध', 'गौतम बुद्ध', 'बौद्ध धर्म', 'महावीर स्वामी', 'जैन धर्म', 'त्रिपिटक', 'मौर्य', 'चन्द्रगुप्त', 'अशोक', 'चाणक्य', 'कौटिल्य', 'अर्थशास्त्र', 'शिलालेख', 'गुप्त वंश', 'समुद्रगुप्त', 'विक्रमादित्य', 'हर्षवर्धन', 'चोल', 'पल्लव', 'चालुक्य', 'खजुराहो', 'अजंता', 'एलोरा', 'harappa', 'indus valley', 'vedic', 'maurya', 'ashoka', 'gupta', 'buddha', 'jain']
    },
    {
      subjectId: 'sub_history',
      topicTitle: 'Medieval Indian History',
      keywords: ['दिल्ली सल्तनत', 'कुतुबुद्दीन ऐबक', 'इल्तुतमिश', 'रजिया', 'बलबन', 'खिलजी', 'अलाउद्दीन', 'तुगलक', 'लोदी', 'मुगल', 'बाबर', 'हुमायूँ', 'अकबर', 'जहाँगीर', 'शाहजहाँ', 'औरंगजेब', 'शेरशाह सूरी', 'पानीपत का युद्ध', 'हल्दीघाटी', 'तराइन', 'शिवाजी', 'मराठा साम्राज्य', 'अष्टप्रधान', 'विजयनगर', 'कृष्णदेव राय', 'भक्ति आंदोलन', 'कबीर', 'तुलसीदास', 'सूफी', 'मनसबदारी', 'जजिया', 'sultanate', 'mughal', 'akbar', 'babur', 'aurangzeb', 'shivaji', 'vijayanagara']
    },
    {
      subjectId: 'sub_history',
      topicTitle: 'Modern Indian History',
      keywords: ['1857 की क्रांति', '1857 का विद्रोह', 'मंगल पांडे', 'रानी लक्ष्मीबाई', 'तात्या टोपे', 'कांग्रेस अधिवेशन', 'बंगाल विभाजन', 'स्वदेशी आंदोलन', 'मुस्लिम लीग', 'सूरत विभाजन', 'होमरूल', 'चंपारण', 'खेड़ा', 'रौलेट एक्ट', 'जलियांवाला बाग', 'खिलाफत', 'असहयोग आंदोलन', 'चौरी चौरा', 'स्वराज पार्टी', 'साइमन कमीशन', 'पूर्ण स्वराज', 'दांडी मार्च', 'सविनय अवज्ञा', 'गांधी इरविन', 'पूना पैक्ट', 'भारत छोड़ो आंदोलन', 'सुभाष चंद्र बोस', 'आजाद हिंद फौज', 'भगत सिंह', 'चंद्रशेखर आजाद', 'कैबिनेट मिशन', 'माउंटबेटन', 'गवर्नर जनरल', 'वायसराय', 'ब्रिटिश', 'आर्य समाज', 'ब्रह्म समाज', 'राजा राममोहन राय', 'स्वामी दयानंद', 'स्वामी विवेकानंद', 'mahatma gandhi', 'quit india', 'non-cooperation', 'dandi', '1857', 'viceroy', 'governor general']
    },
    {
      subjectId: 'sub_geography',
      topicTitle: 'Indian Geography',
      keywords: ['हिमालय', 'काराकोरम', 'शिवालिक', 'अरावली', 'विंध्याचल', 'सतपुड़ा', 'पश्चिमी घाट', 'पूर्वी घाट', 'नीलगिरि', 'एवरेस्ट', 'कंचनजंगा', 'गंगा', 'यमुना', 'ब्रह्मपुत्र', 'सिंधु', 'गोदावरी', 'कृष्णा', 'कावेरी', 'नर्मदा', 'ताप्ती', 'चिल्का', 'वुलर', 'सांभर', 'लोकटक', 'मानसून', 'जलोढ़ मृदा', 'काली मिट्टी', 'लैटेराइट', 'जनगणना 2011', 'साक्षरता दर', 'लिंगानुपात', 'राष्ट्रीय उद्यान', 'टाइगर रिजर्व', 'जैवमंडल', 'सौरमंडल', 'ग्रह', 'पृथ्वी', 'अक्षांश', 'देशांतर', 'वायुमंडल', 'क्षोभमंडल', 'समतापमंडल', 'ओजोन परत', 'भूकंप', 'ज्वालामुखी', 'चट्टान', 'महाद्वीप', 'महासागर', 'himalaya', 'monsoon', 'ganga', 'brahmaputra', 'godavari', 'narmada', 'atmosphere', 'latitude', 'longitude', 'solar system']
    },
    {
      subjectId: 'sub_economy',
      topicTitle: 'National Income & Planning',
      keywords: ['अर्थव्यवस्था', 'राष्ट्रीय आय', 'सकल घरेलू उत्पाद', 'जीडीपी', 'प्रति व्यक्ति आय', 'नीति आयोग', 'योजना आयोग', 'पंचवर्षीय योजना', 'रिजर्व बैंक', 'आरबीआई', 'रेपो दर', 'रिवर्स रेपो', 'सीआरआर', 'एसएलआर', 'मुद्रास्फीति', 'मौद्रिक नीति', 'राजकोषीय घाटा', 'जीएसटी', 'बजट', 'कर प्रणाली', 'नाबार्ड', 'सेबी', 'बैंकिंग', 'बेरोजगारी', 'गरीबी', 'हरित क्रांति', 'श्वेत क्रांति', 'gdp', 'rbi', 'repo rate', 'inflation', 'monetary policy', 'fiscal deficit', 'gst', 'niti aayog', 'five year plan', 'nabard']
    },
    {
      subjectId: 'sub_science',
      topicTitle: 'Biology & Human Health',
      keywords: ['कोशिका', 'माइटोकॉन्ड्रिया', 'राइबोसोम', 'डीएनए', 'आरएनए', 'गुणसूत्र', 'रक्त समूह', 'हीमोग्लोबिन', 'हृदय', 'मस्तिष्क', 'वृक्क', 'यकृत', 'पाचन', 'श्वसन', 'प्रकाश संश्लेषण', 'क्लोरोफिल', 'जाइलम', 'फ्लोएम', 'विटामिन', 'प्रोटीन', 'कार्बोहाइड्रेट', 'हार्मोन', 'इंसुलिन', 'जीवाणु', 'विषाणु', 'प्रोटोजोआ', 'कवक', 'टीका', 'मलेरिया', 'डेंगू', 'तपेदिक', 'विद्युत धारा', 'प्रतिरोध', 'ओम का नियम', 'लेंस', 'दर्पण', 'अपवर्तन', 'परावर्तन', 'ध्वनि', 'आवृत्ति', 'गुरुत्वाकर्षण', 'न्यूटन', 'ऊर्जा', 'कार्य', 'शक्ति', 'अम्ल', 'क्षार', 'लवण', 'पीएच मान', 'आवर्त सारणी', 'परमाणु', 'इलेक्ट्रॉन', 'प्रोटॉन', 'न्यूट्रॉन', 'समस्थानिक', 'धातु', 'अधातु', 'मिश्रधातु', 'इसरो', 'उपग्रह', 'चंद्रयान', 'vitamin', 'cell', 'photosynthesis', 'blood', 'hormone', 'bacteria', 'virus', 'ohm', 'lens', 'mirror', 'acid', 'periodic table', 'atom', 'electron']
    },
    {
      subjectId: 'sub_mathematics',
      topicTitle: 'Percentage, Profit & Loss, SI & CI',
      keywords: ['प्रतिशत', 'लाभ और हानि', 'लाभ-हानि', 'क्रय मूल्य', 'विक्रय मूल्य', 'बट्टा', 'छूट', 'साधारण ब्याज', 'चक्रवृद्धि ब्याज', 'मूलधन', 'मिश्रधन', 'अनुपात', 'समानुपात', 'औसत', 'समय और कार्य', 'चाल समय दूरी', 'रेलगाड़ी', 'नाव और धारा', 'लघुत्तम समापवर्त्य', 'महत्तम समापवर्तक', 'ल.स.', 'म.स.', 'अभाज्य संख्या', 'वर्गमूल', 'घनमूल', 'क्षेत्रफल', 'आयतन', 'परिमाप', 'त्रिभुज', 'वृत्त', 'आयत', 'वर्ग', 'बेलन', 'शंकु', 'गोला', 'बीजगणित', 'समीकरण', 'percentage', 'profit and loss', 'simple interest', 'compound interest', 'ratio', 'average', 'time and work', 'speed and distance', 'lcm', 'hcf', 'area', 'volume', 'triangle', 'circle']
    },
    {
      subjectId: 'sub_reasoning',
      topicTitle: 'Coding-Decoding & Series',
      keywords: ['कोडिंग', 'डिकोडिंग', 'श्रृंखला', 'लुप्त संख्या', 'अगला पद', 'सादृश्यता', 'रक्त संबंध', 'दिशा परीक्षण', 'कथन और निष्कर्ष', 'न्याय निगमन', 'वेन आरेख', 'पासा', 'कैलेंडर', 'घड़ी', 'बैठक व्यवस्था', 'दर्पण प्रतिबिंब', 'जल प्रतिबिंब', 'विषम चुनिए', 'coding', 'decoding', 'blood relation', 'syllogism', 'missing number', 'series', 'direction']
    },
    {
      subjectId: 'sub_computer',
      topicTitle: 'Computer Architecture, Hardware & Memory',
      keywords: ['कंप्यूटर', 'कम्प्यूटर', 'सीपीयू', 'रैम', 'रोम', 'कैश मेमोरी', 'हार्ड डिस्क', 'इनपुट डिवाइस', 'आउटपुट डिवाइस', 'कीबोर्ड', 'माउस', 'मॉनिटर', 'प्रिंटर', 'लेजर प्रिंटर', 'इंकजेट', 'स्कैनर', 'प्लॉटर', 'ऑपरेटिंग सिस्टम', 'विंडोज', 'लिनक्स', 'यूनिक्स', 'एमएस वर्ड', 'एमएस एक्सेल', 'पॉवरपॉइंट', 'स्प्रेडशीट', 'शॉर्टकट कुंजी', 'इंटरनेट', 'ब्राउज़र', 'सर्च इंजन', 'ईमेल', 'वायरस', 'एंटीवायरस', 'मैलवेयर', 'फायरवॉल', 'बाइनरी', 'बिट', 'बाइट', 'मेगाबाइट', 'गीगाबाइट', 'cpu', 'ram', 'rom', 'input device', 'output device', 'printer', 'operating system', 'ms word', 'ms excel', 'powerpoint', 'internet', 'browser', 'virus', 'firewall', 'shortcut key']
    },
    {
      subjectId: 'sub_pedagogy',
      topicTitle: 'Learning Theories',
      keywords: ['बाल विकास', 'शिक्षाशास्त्र', 'अधिगम', 'जीन पियाजे', 'वायगोत्स्की', 'कोहलबर्ग', 'स्किनर', 'पावलव', 'थार्नडाइक', 'बुद्धि लब्धि', 'समावेशी शिक्षा', 'सतत एवं व्यापक मूल्यांकन', 'शिक्षण विधि', 'एनसीएफ', 'आरटीई', 'राष्ट्रीय शिक्षा नीति', 'piaget', 'vygotsky', 'kohlberg', 'pedagogy', 'child development', 'inclusive education']
    },
    {
      subjectId: 'sub_english',
      topicTitle: 'Parts of Speech, Tenses & Voice',
      keywords: ['synonym', 'antonym', 'passive voice', 'active voice', 'indirect speech', 'direct speech', 'narration', 'fill in the blank', 'preposition', 'article', 'idiom', 'one word substitution', 'correctly spelt', 'grammatical error', 'tense']
    }
  ];

  // Automatic Categorisation Engine using Subject, Topic & Subtopic Master (Section 6)
  function autoCategorizeQuestionFromMaster(item, catalog, defaultExamIds) {
    const combinedText = [
      item.questionHi || '',
      item.questionEn || '',
      ...(Array.isArray(item.optionsHi) ? item.optionsHi : []),
      ...(Array.isArray(item.optionsEn) ? item.optionsEn : []),
      item.explanationHi || '',
      item.explanationEn || '',
      item.subjectTag || '',
      item.topic || '',
      item.subtopic || ''
    ].join(' ').toLowerCase();

    const incomingExams = [];
    if (Array.isArray(item.examIds)) incomingExams.push(...item.examIds);
    if (item.examCode) {
      String(item.examCode).split(/[;|,]/).forEach((x) => {
        if (x.trim()) incomingExams.push(x.trim().toUpperCase().replace(/\s+/g, '_'));
      });
    }
    if (Array.isArray(defaultExamIds)) {
      defaultExamIds.forEach((x) => {
        if (x && !incomingExams.includes(x)) incomingExams.push(x);
      });
    }
    const finalExamIds = incomingExams.length > 0 ? incomingExams : ['CGPSC'];

    const rawSubInput = String(item.subjectId || item.subjectTag || '').trim();
    const isGenericSubInput = !rawSubInput || ['general', 'general studies', 'gs', 'gk', 'general knowledge', 'unknown', 'needs categorisation'].includes(rawSubInput.toLowerCase());
    const rawTopInput = String(item.topicId || item.topic || '').trim();
    const isGenericTopInput = !rawTopInput || ['general', 'general knowledge', 'miscellaneous', 'unknown', 'needs categorisation'].includes(rawTopInput.toLowerCase());

    // 1. Check if item already has explicit Subject/Topic/Subtopic that matches Master
    let matchedSub = (!isGenericSubInput) ? catalog.findSubject(rawSubInput) : null;
    let matchedTop = (!isGenericTopInput)
      ? catalog.findTopic(matchedSub ? matchedSub.subjectId : '', rawTopInput)
      : null;
    let matchedSubtop = (item.subtopicId || item.subtopic)
      ? catalog.findSubtopic(matchedTop ? matchedTop.topicId : '', item.subtopicId || item.subtopic, matchedSub ? matchedSub.subjectId : '')
      : null;

    let confidence = 0;
    if (matchedSub && matchedTop) {
      confidence = matchedSubtop ? 96 : 88;
    }

    // 2. Score Subtopic Master keywords first (most specific)
    if (!matchedSubtop) {
      let bestSubtop = null;
      let bestSubtopHits = 0;
      for (const st of catalog.subtopicMaster) {
        if (matchedTop && st.topicId !== matchedTop.topicId) continue;
        if (matchedSub && st.subjectId !== matchedSub.subjectId) continue;
        let hits = 0;
        const terms = [st.titleEn.toLowerCase(), st.titleHi.toLowerCase(), ...(st.keywords || [])];
        terms.forEach((kw) => {
          const cleanKw = String(kw || '').trim().toLowerCase();
          if (cleanKw && cleanKw.length >= 2 && combinedText.includes(cleanKw)) {
            hits += cleanKw.length >= 6 ? 3 : 2;
          }
        });
        if (hits > bestSubtopHits) {
          bestSubtopHits = hits;
          bestSubtop = st;
        }
      }
      if (bestSubtop && bestSubtopHits >= 2) {
        matchedSubtop = bestSubtop;
        if (!matchedTop) matchedTop = catalog.findTopic('', bestSubtop.topicId);
        if (!matchedSub && matchedTop) matchedSub = catalog.findSubject(matchedTop.subjectId);
        confidence = Math.max(confidence, Math.min(98, 74 + bestSubtopHits * 5));
      }
    }

    // 3. Score Topic Master keywords + Expanded Hindi/English Domain Rules if Topic not yet matched
    if (!matchedTop) {
      let bestTop = null;
      let bestTopHits = 0;
      for (const top of catalog.topicMaster) {
        if (matchedSub && top.subjectId !== matchedSub.subjectId) continue;
        let hits = 0;
        const terms = [top.titleEn.toLowerCase(), top.titleHi.toLowerCase(), ...(top.keywords || [])];
        terms.forEach((kw) => {
          const cleanKw = String(kw || '').trim().toLowerCase();
          if (cleanKw && cleanKw.length >= 2 && combinedText.includes(cleanKw)) {
            hits += cleanKw.length >= 6 ? 3 : 2;
          }
        });
        if (hits > bestTopHits) {
          bestTopHits = hits;
          bestTop = top;
        }
      }

      // Also score against EXTRA_SUBJECT_TOPIC_RULES (rich Hindi Devanagari + English keyword bank)
      for (const rule of EXTRA_SUBJECT_TOPIC_RULES) {
        const ruleSub = catalog.findSubject(rule.subjectId);
        if (matchedSub && ruleSub && ruleSub.subjectId !== matchedSub.subjectId) continue;
        let hits = 0;
        rule.keywords.forEach((kw) => {
          const cleanKw = String(kw || '').trim().toLowerCase();
          if (cleanKw && combinedText.includes(cleanKw)) {
            hits += cleanKw.length >= 5 ? 3 : 2;
          }
        });
        if (hits > bestTopHits && ruleSub) {
          const ruleTop = catalog.findTopic(ruleSub.subjectId, rule.topicTitle) ||
            (catalog.getTopicsForSubject(ruleSub.subjectId)[0] || null);
          if (ruleTop) {
            bestTopHits = hits;
            bestTop = ruleTop;
          }
        }
      }

      if (bestTop && bestTopHits >= 2) {
        matchedTop = bestTop;
        if (!matchedSub) matchedSub = catalog.findSubject(bestTop.subjectId);
        confidence = Math.max(confidence, Math.min(94, 66 + bestTopHits * 5));
        if (!matchedSubtop) {
          const candidateSubtopics = catalog.getSubtopicsForTopic(matchedTop.topicId);
          for (const st of candidateSubtopics) {
            const stTerms = [st.titleEn.toLowerCase(), st.titleHi.toLowerCase(), ...(st.keywords || [])];
            if (stTerms.some((kw) => kw && kw.length >= 2 && combinedText.includes(kw.toLowerCase()))) {
              matchedSubtop = st;
              confidence = Math.min(96, confidence + 8);
              break;
            }
          }
        }
      }
    }

    // 4. Score Subject Master if Subject still not matched
    if (!matchedSub) {
      let bestSub = null;
      let bestSubHits = 0;
      for (const s of catalog.subjects) {
        let hits = 0;
        const terms = [s.titleEn.toLowerCase(), s.titleHi.toLowerCase(), ...(s.aliases || [])];
        terms.forEach((kw) => {
          const cleanKw = String(kw || '').trim().toLowerCase();
          if (cleanKw && cleanKw.length >= 2 && combinedText.includes(cleanKw)) {
            hits += 2;
          }
        });
        if (hits > bestSubHits) {
          bestSubHits = hits;
          bestSub = s;
        }
      }
      if (bestSub && bestSubHits >= 2) {
        matchedSub = bestSub;
        confidence = Math.max(confidence, 68);
      }
    }

    // 5. If Subject is matched (either from file or keywords) but Topic wasn't matched yet, assign the Subject's primary Topic in Master so it doesn't fail categorisation
    if (matchedSub && !matchedTop) {
      const subTopics = catalog.getTopicsForSubject(matchedSub.subjectId);
      if (subTopics && subTopics.length > 0) {
        matchedTop = subTopics[0];
        confidence = Math.max(confidence, 68);
      }
    }

    const hasValidMasterCategory = Boolean(matchedSub && matchedTop && confidence >= 50);

    return {
      examIds: finalExamIds,
      examCode: finalExamIds[0] || 'CGPSC',
      subjectId: matchedSub ? matchedSub.subjectId : '',
      subjectTag: matchedSub ? matchedSub.titleEn : '',
      topicId: matchedTop ? matchedTop.topicId : '',
      topic: matchedTop ? matchedTop.titleEn : '',
      subtopicId: matchedSubtop ? matchedSubtop.subtopicId : '',
      subtopic: matchedSubtop ? matchedSubtop.titleEn : '',
      categorisationConfidence: hasValidMasterCategory ? confidence : Math.min(confidence, 35),
      needsCategorisation: !hasValidMasterCategory,
      verificationStatus: hasValidMasterCategory ? 'verified' : 'needs_categorisation'
    };
  }

  // Safe, Resumable, Backward-Compatible Migration for Existing Questions (Section 11)
  async function migrateExistingQuestionBankRecords(state, api, options) {
    const opts = options || {};
    const catalog = getTaxonomyCatalog(state);
    state.questionBank = state.questionBank || [];
    state.migrationState = state.migrationState || {
      version: 0,
      lastRunIso: '',
      migratedCount: 0,
      alreadyCategorisedCount: 0,
      needsCategorisationCount: 0,
      errors: []
    };

    let migratedCount = 0;
    let alreadyCategorisedCount = 0;
    let needsCategorisationCount = 0;
    const migrationErrors = [];
    const docsToSync = [];
    const nowIso = new Date().toISOString();

    state.questionBank.forEach((q, idx) => {
      try {
        if (!q || typeof q !== 'object') return;
        const canonicalId = q.questionId || q.id || computeDeterministicQuestionId(q, `mig_${idx}`);
        q.id = q.id || canonicalId;
        q.questionId = canonicalId;

        // Preserve & populate 4 options in both array and optA_Hi..optD_En formats
        const optsHi = Array.isArray(q.optionsHi) && q.optionsHi.length === 4
          ? q.optionsHi.map((o) => String(o || '').trim())
          : [q.optA_Hi, q.optB_Hi, q.optC_Hi, q.optD_Hi].map((o, i) => String(o || (q.optionsHi && q.optionsHi[i]) || '').trim());
        const optsEn = Array.isArray(q.optionsEn) && q.optionsEn.length === 4
          ? q.optionsEn.map((o) => String(o || '').trim())
          : [q.optA_En, q.optB_En, q.optC_En, q.optD_En].map((o, i) => String(o || (q.optionsEn && q.optionsEn[i]) || optsHi[i] || '').trim());

        q.optionsHi = optsHi;
        q.optionsEn = optsEn;
        q.optA_Hi = optsHi[0] || '';
        q.optB_Hi = optsHi[1] || '';
        q.optC_Hi = optsHi[2] || '';
        q.optD_Hi = optsHi[3] || '';
        q.optA_En = optsEn[0] || '';
        q.optB_En = optsEn[1] || '';
        q.optC_En = optsEn[2] || '';
        q.optD_En = optsEn[3] || '';

        const corrIdx = Number(q.correctOptionIndex !== undefined ? q.correctOptionIndex : (q.correctIndex !== undefined ? q.correctIndex : 0));
        q.correctOptionIndex = Number.isInteger(corrIdx) && corrIdx >= 0 && corrIdx <= 3 ? corrIdx : 0;
        q.correctIndex = q.correctOptionIndex;

        // Normalize difficultyLevel (Easy / Moderate / Hard) while preserving difficulty
        const rawDiff = String(q.difficultyLevel || q.difficulty || 'Moderate').trim();
        const lowDiff = rawDiff.toLowerCase();
        if (lowDiff === 'easy' || lowDiff === 'सरल') {
          q.difficultyLevel = 'Easy';
          q.difficulty = q.difficulty || 'Easy';
        } else if (lowDiff === 'hard' || lowDiff === 'difficult' || lowDiff === 'कठिन') {
          q.difficultyLevel = 'Hard';
          q.difficulty = q.difficulty || 'Hard';
        } else {
          q.difficultyLevel = 'Moderate';
          q.difficulty = q.difficulty || 'Moderate';
        }

        // Map Exam without guessing unknown exams
        const examSet = new Set();
        if (Array.isArray(q.examIds)) {
          q.examIds.forEach((e) => {
            const exObj = catalog.findExam(e);
            if (exObj) examSet.add(exObj.code);
            else if (String(e || '').trim()) examSet.add(String(e).trim().toUpperCase());
          });
        }
        if (q.examCode) {
          const exObj = catalog.findExam(q.examCode);
          if (exObj) examSet.add(exObj.code);
          else if (String(q.examCode).trim().toUpperCase() !== 'ALL') {
            examSet.add(String(q.examCode).trim().toUpperCase());
          }
        }
        q.examIds = Array.from(examSet);
        if (q.examIds.length > 0 && !q.examCode) {
          q.examCode = q.examIds[0];
        }

        // Map existing subjectTag to Subject Master where possible (never guess unknown Topic/Subtopic)
        const matchedSub = catalog.findSubject(q.subjectId || q.subjectTag);
        if (matchedSub) {
          q.subjectId = matchedSub.subjectId;
          if (!q.subjectTag) q.subjectTag = matchedSub.titleEn;
        } else {
          q.subjectId = q.subjectId || '';
        }

        // Map existing topic & subtopic ONLY when deterministically matched in Topic/Subtopic Master (never guess unknown values)
        const rawTopicStr = String(q.topic || '').trim();
        const isGenericPlaceholder = !rawTopicStr || ['general knowledge', 'general', 'miscellaneous', 'unknown'].includes(rawTopicStr.toLowerCase());
        const matchedTop = (!isGenericPlaceholder || q.topicId)
          ? catalog.findTopic(q.subjectId || q.subjectTag, q.topicId || rawTopicStr)
          : null;
        if (matchedTop) {
          q.topicId = matchedTop.topicId;
          q.topic = q.topic || matchedTop.titleEn;
          if (!q.subjectId) {
            const parentSub = catalog.findSubject(matchedTop.subjectId);
            if (parentSub) {
              q.subjectId = parentSub.subjectId;
              q.subjectTag = q.subjectTag || parentSub.titleEn;
            }
          }
        } else {
          q.topicId = '';
        }

        const matchedSubtop = (q.subtopicId || q.subtopic)
          ? catalog.findSubtopic(q.topicId || q.topic, q.subtopicId || q.subtopic, q.subjectId)
          : null;
        if (matchedSubtop) {
          q.subtopicId = matchedSubtop.subtopicId;
          q.subtopic = q.subtopic || matchedSubtop.titleEn;
        } else {
          q.subtopicId = '';
        }

        q.questionType = q.questionType || 'MCQ';
        q.sourceExam = q.sourceExam || '';
        q.sourceYear = q.sourceYear || '';
        q.paperSetCode = q.paperSetCode || '';
        q.sourceDocument = q.sourceDocument || '';
        q.sourcePageNumber = q.sourcePageNumber || '';
        q.createdAt = q.createdAt || q.createdAtIso || nowIso;
        q.updatedAt = nowIso;
        q.updatedAtIso = nowIso;

        const hasSufficientClassification = Boolean(q.subjectId && q.topicId && q.examIds && q.examIds.length > 0);
        if (!hasSufficientClassification) {
          q.needsCategorisation = true;
          q.verificationStatus = 'needs_categorisation';
          needsCategorisationCount += 1;
        } else {
          q.needsCategorisation = false;
          if (!q.verificationStatus || q.verificationStatus === 'needs_categorisation') {
            q.verificationStatus = (q.verified === false || q.adminVerified === false || q.status === 'unverified')
              ? 'unverified'
              : 'verified';
          }
          alreadyCategorisedCount += 1;
        }

        migratedCount += 1;
        docsToSync.push(q);
      } catch (err) {
        migrationErrors.push({
          index: idx,
          questionId: (q && q.id) || `idx_${idx}`,
          error: err && err.message ? err.message : 'Migration error'
        });
      }
    });

    state.migrationState = {
      version: 2,
      lastRunIso: nowIso,
      lastMigratedAt: nowIso,
      totalInspected: state.questionBank.length,
      migratedCount,
      alreadyCategorisedCount,
      needsCategorisationCount,
      errors: migrationErrors
    };
    qbState.migrationReport = state.migrationState;

    if (api && typeof api.saveState === 'function') {
      api.saveState();
    }

    if (!opts.skipCloudSync && window.CGpediaCloud && docsToSync.length > 0 && window.CGpediaCloud.batchSaveCloudDocs) {
      try {
        await window.CGpediaCloud.batchSaveCloudDocs('question_bank', docsToSync);
      } catch (_) {}
    }

    return state.migrationState;
  }

  function normalizeDevanagariDigits(str) {
    return String(str == null ? '' : str).replace(/[\u0966-\u096F]/g, (d) => String(d.charCodeAt(0) - 0x0966));
  }

  function normalizeTextForComparison(str) {
    const raw = normalizeDevanagariDigits(str == null ? '' : str);
    return raw.normalize
      ? raw.normalize('NFC')
        .toLowerCase()
        .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      : raw.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function computeTextSimilarity(strA, strB) {
    const a = normalizeTextForComparison(strA);
    const b = normalizeTextForComparison(strB);
    if (!a && !b) return 0;
    if (a && b && a === b) return 1.0;
    if (!a || !b) return 0;

    const tokensA = new Set(a.split(' ').filter(Boolean));
    const tokensB = new Set(b.split(' ').filter(Boolean));
    let intersection = 0;
    tokensA.forEach((t) => {
      if (tokensB.has(t)) intersection += 1;
    });
    const union = tokensA.size + tokensB.size - intersection;
    const jaccard = union > 0 ? intersection / union : 0;

    const ngrams = (s) => {
      const compact = s.replace(/\s+/g, '');
      if (compact.length < 2) return [compact];
      const list = [];
      for (let i = 0; i < compact.length - 1; i++) {
        list.push(compact.slice(i, i + 2));
      }
      return list;
    };
    const bgA = ngrams(a);
    const bgB = ngrams(b);
    const countsB = new Map();
    bgB.forEach((g) => countsB.set(g, (countsB.get(g) || 0) + 1));
    let bgMatches = 0;
    bgA.forEach((g) => {
      const c = countsB.get(g) || 0;
      if (c > 0) {
        bgMatches += 1;
        countsB.set(g, c - 1);
      }
    });
    const dice = (bgA.length + bgB.length) > 0 ? (2 * bgMatches) / (bgA.length + bgB.length) : 0;

    return Math.max(jaccard, (jaccard * 0.45) + (dice * 0.55));
  }

  function computeOptionsOrderAgnosticSimilarity(optsA, optsB) {
    if (!Array.isArray(optsA) || !Array.isArray(optsB) || optsA.length !== 4 || optsB.length !== 4) {
      return { score: 0, isPermuted: false };
    }
    const normA = optsA.map((o) => normalizeTextForComparison(o));
    const normB = optsB.map((o) => normalizeTextForComparison(o));
    const sameOrderExact = normA.every((v, idx) => v && v === normB[idx]);
    const sortedA = [...normA].sort();
    const sortedB = [...normB].sort();
    let totalSim = 0;
    for (let i = 0; i < 4; i++) {
      totalSim += computeTextSimilarity(sortedA[i], sortedB[i]);
    }
    const avgSim = totalSim / 4;
    return {
      score: avgSim,
      isPermuted: avgSim >= 0.85 && !sameOrderExact
    };
  }

  function computeDeterministicQuestionId(qObj, extraSalt) {
    const rawKey = [
      normalizeTextForComparison(qObj.questionHi || ''),
      normalizeTextForComparison(qObj.questionEn || ''),
      (qObj.optionsHi || []).map((o) => normalizeTextForComparison(o)).join('|'),
      (qObj.optionsEn || []).map((o) => normalizeTextForComparison(o)).join('|'),
      String(qObj.correctOptionIndex !== undefined ? qObj.correctOptionIndex : qObj.correctIndex || 0),
      extraSalt || ''
    ].join('::');
    let h1 = 0x811c9dc5;
    for (let i = 0; i < rawKey.length; i++) {
      h1 ^= rawKey.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
    }
    const hex = (h1 >>> 0).toString(16).padStart(8, '0');
    return `qb_${hex}_${rawKey.length}`;
  }

  function detectLanguageAvailability(qHi, qEn) {
    const hiStr = String(qHi || '').trim();
    const enStr = String(qEn || '').trim();
    const hasDevanagari = /[\u0900-\u097F]/.test(hiStr + ' ' + enStr);
    const hasLatin = /[A-Za-z]{2,}/.test(hiStr + ' ' + enStr);
    if (hiStr && enStr && hiStr !== enStr) return 'Both';
    if (hasDevanagari && hasLatin) return 'Both';
    if (hasDevanagari) return 'Hindi';
    if (hasLatin) return 'English';
    if (hiStr && enStr) return 'Both';
    if (hiStr) return 'Hindi';
    if (enStr) return 'English';
    return 'Both';
  }

  function normalizeDifficulty(val) {
    const low = String(val || '').trim().toLowerCase();
    if (low === 'easy' || low === 'सरल' || low === 'आसान') return 'Easy';
    if (low === 'difficult' || low === 'hard' || low === 'कठिन') return 'Hard';
    if (low === 'moderate' || low === 'medium' || low === 'मध्यम' || low === 'सामान्य') return 'Moderate';
    return '';
  }

  function normalizeDifficultyValue(val) {
    return normalizeDifficulty(val);
  }

  function parseCorrectIndexValue(rawVal, optsHi, optsEn, preferOneBased) {
    if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
      return { valid: false, missing: true, index: null, reason: 'Missing correct answer (correctIndex is empty).' };
    }
    const rawStr = normalizeDevanagariDigits(String(rawVal).trim());
    const cleanToken = rawStr
      .toUpperCase()
      .replace(/^(?:OPTION|OPT|ANS(?:WER)?|विकल्प|उत्तर|सही\s*उत्तर)[\s.:=\-]*/i, '')
      .replace(/^[([{\s]+|[)\]}\s.:-]+$/g, '')
      .trim();

    if (preferOneBased) {
      if (cleanToken === '1') return { valid: true, missing: false, index: 0, reason: '' };
      if (cleanToken === '2') return { valid: true, missing: false, index: 1, reason: '' };
      if (cleanToken === '3') return { valid: true, missing: false, index: 2, reason: '' };
      if (cleanToken === '4') return { valid: true, missing: false, index: 3, reason: '' };
    }

    if (cleanToken === '0' || cleanToken === '1' || cleanToken === '2' || cleanToken === '3') {
      return { valid: true, missing: false, index: Number(cleanToken), reason: '' };
    }
    if (cleanToken === '4') {
      return { valid: true, missing: false, index: 3, reason: '' };
    }

    const tokenMap = {
      A: 0, B: 1, C: 2, D: 3,
      'अ': 0, 'ब': 1, 'स': 2, 'द': 3,
      'क': 0, 'ख': 1, 'ग': 2, 'घ': 3,
      'आ': 1, 'इ': 2, 'ई': 3
    };
    if (tokenMap[cleanToken] !== undefined) {
      return { valid: true, missing: false, index: tokenMap[cleanToken], reason: '' };
    }

    // Match if rawVal is the actual option text (e.g., "रायपुर" or "Raipur")
    const normTarget = normalizeTextForComparison(rawStr);
    if (normTarget) {
      const hiArr = Array.isArray(optsHi) ? optsHi : [];
      const enArr = Array.isArray(optsEn) ? optsEn : [];
      for (let i = 0; i < 4; i++) {
        const nHi = normalizeTextForComparison(hiArr[i] || '');
        const nEn = normalizeTextForComparison(enArr[i] || '');
        if ((nHi && nHi === normTarget) || (nEn && nEn === normTarget)) {
          return { valid: true, missing: false, index: i, reason: '' };
        }
      }
    }

    return {
      valid: false,
      missing: false,
      index: null,
      reason: `Invalid correctIndex value "${String(rawVal).trim()}". Must be 0-3, 1-4, A-D, अ-द, क-घ, or matching option text.`
    };
  }

  function parseCsvWithRowNumbers(rawText) {
    const text = String(rawText || '').replace(/^\uFEFF/, '');
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;
    let currentLine = 1;
    let rowStartLine = 1;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const nextCh = text[i + 1];

      if (inQuotes) {
        if (ch === '"' && nextCh === '"') {
          currentCell += '"';
          i += 1;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          if (ch === '\n') currentLine += 1;
          currentCell += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else if (ch === '\r' && nextCh === '\n') {
          currentRow.push(currentCell.trim());
          if (currentRow.some((c) => c !== '')) {
            rows.push({ rowNumber: rowStartLine, cells: currentRow });
          }
          currentRow = [];
          currentCell = '';
          i += 1;
          currentLine += 1;
          rowStartLine = currentLine;
        } else if (ch === '\n' || ch === '\r') {
          currentRow.push(currentCell.trim());
          if (currentRow.some((c) => c !== '')) {
            rows.push({ rowNumber: rowStartLine, cells: currentRow });
          }
          currentRow = [];
          currentCell = '';
          currentLine += 1;
          rowStartLine = currentLine;
        } else {
          currentCell += ch;
        }
      }
    }
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push({ rowNumber: rowStartLine, cells: currentRow });
    }
    return rows;
  }

  const KNOWN_CSV_COLUMN_MAP = {
    questionhi: 'questionHi',
    question_hi: 'questionHi',
    stemhi: 'questionHi',
    hindi_question: 'questionHi',
    questionen: 'questionEn',
    question_en: 'questionEn',
    stemen: 'questionEn',
    english_question: 'questionEn',
    question: 'questionEn',
    opta_hi: 'optA_Hi',
    optiona_hi: 'optA_Hi',
    opt0_hi: 'optA_Hi',
    optb_hi: 'optB_Hi',
    optionb_hi: 'optB_Hi',
    opt1_hi: 'optB_Hi',
    optc_hi: 'optC_Hi',
    optionc_hi: 'optC_Hi',
    opt2_hi: 'optC_Hi',
    optd_hi: 'optD_Hi',
    optiond_hi: 'optD_Hi',
    opt3_hi: 'optD_Hi',
    opta_en: 'optA_En',
    optiona_en: 'optA_En',
    opta: 'optA_En',
    option_a: 'optA_En',
    opt0_en: 'optA_En',
    optb_en: 'optB_En',
    optionb_en: 'optB_En',
    optb: 'optB_En',
    option_b: 'optB_En',
    opt1_en: 'optB_En',
    optc_en: 'optC_En',
    optionc_en: 'optC_En',
    optc: 'optC_En',
    option_c: 'optC_En',
    opt2_en: 'optC_En',
    optd_en: 'optD_En',
    optiond_en: 'optD_En',
    optd: 'optD_En',
    option_d: 'optD_En',
    opt3_en: 'optD_En',
    correctindex: 'correctIndex',
    correct_index: 'correctIndex',
    correctoptionindex: 'correctIndex',
    correct_answer: 'correctIndex',
    answer: 'correctIndex',
    explanationhi: 'explanationHi',
    explanation_hi: 'explanationHi',
    exphi: 'explanationHi',
    explanationen: 'explanationEn',
    explanation_en: 'explanationEn',
    expen: 'explanationEn',
    explanation: 'explanationEn',
    subjecttag: 'subjectTag',
    subject_tag: 'subjectTag',
    subject: 'subjectTag',
    subjectid: 'subjectId',
    subject_id: 'subjectId',
    examcode: 'examCode',
    exam_code: 'examCode',
    examcategory: 'examCode',
    exam_category: 'examCode',
    exam: 'examCode',
    examids: 'examIds',
    exam_ids: 'examIds',
    exams: 'examIds',
    topic: 'topic',
    topicid: 'topicId',
    topic_id: 'topicId',
    subtopic: 'subtopic',
    sub_topic: 'subtopic',
    subtopicid: 'subtopicId',
    subtopic_id: 'subtopicId',
    difficulty: 'difficulty',
    difficultylevel: 'difficultyLevel',
    difficulty_level: 'difficultyLevel',
    questiontype: 'questionType',
    question_type: 'questionType',
    sourceexam: 'sourceExam',
    source_exam: 'sourceExam',
    sourceyear: 'sourceYear',
    source_year: 'sourceYear',
    papersetcode: 'paperSetCode',
    paper_set_code: 'paperSetCode',
    sourcedocument: 'sourceDocument',
    source_document: 'sourceDocument',
    sourcepagenumber: 'sourcePageNumber',
    source_page_number: 'sourcePageNumber',
    verificationstatus: 'verificationStatus',
    verification_status: 'verificationStatus',
    language: 'languageAvailability',
    languageavailability: 'languageAvailability',
    tags: 'tags',
    pyqtag: 'pyqTag',
    pyq_tag: 'pyqTag',
    status: 'status',
    id: 'id',
    questionid: 'questionId',
    question_id: 'questionId',
    'प्रश्न': 'questionHi',
    'हिन्दी_प्रश्न': 'questionHi',
    'हिंदी_प्रश्न': 'questionHi',
    'विकल्प_a': 'optA_Hi',
    'विकल्प_b': 'optB_Hi',
    'विकल्प_c': 'optC_Hi',
    'विकल्प_d': 'optD_Hi',
    'विकल्प_अ': 'optA_Hi',
    'विकल्प_ब': 'optB_Hi',
    'विकल्प_स': 'optC_Hi',
    'विकल्प_द': 'optD_Hi',
    'विकल्प_क': 'optA_Hi',
    'विकल्प_ख': 'optB_Hi',
    'विकल्प_ग': 'optC_Hi',
    'विकल्प_घ': 'optD_Hi',
    'विकल्प_1': 'optA_Hi',
    'विकल्प_2': 'optB_Hi',
    'विकल्प_3': 'optC_Hi',
    'विकल्प_4': 'optD_Hi',
    'उत्तर': 'correctIndex',
    'सही_उत्तर': 'correctIndex',
    'सही_विकल्प': 'correctIndex',
    'व्याख्या': 'explanationHi',
    'उत्तर_व्याख्या': 'explanationHi',
    'विषय': 'subjectTag',
    'टॉपिक': 'topic',
    'अध्याय': 'topic',
    'उपटॉपिक': 'subtopic',
    'परीक्षा': 'examCode',
    'कठिनाई': 'difficulty',
    'स्तर': 'difficulty'
  };

  function decodePdfEscapedLiteral(raw) {
    return String(raw || '')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, ' ')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
  }

  function decodePdfHexLiteral(hexStr) {
    const clean = String(hexStr || '').replace(/[^0-9A-Fa-f]/g, '');
    if (!clean) return '';
    // Check UTF-16BE BOM or 4-hex-digit Devanagari sequences (09xx)
    if (clean.length % 4 === 0 && (/^(?:FEFF|09[0-7][0-9A-Fa-f]|00[2-7][0-9A-Fa-f])/i.test(clean))) {
      let out16 = '';
      for (let i = 0; i < clean.length; i += 4) {
        const code = parseInt(clean.slice(i, i + 4), 16);
        if (code && code !== 0xFEFF) out16 += String.fromCharCode(code);
      }
      if (out16.trim()) return out16;
    }
    let out8 = '';
    for (let i = 0; i < clean.length; i += 2) {
      const code = parseInt(clean.slice(i, i + 2), 16);
      if (code) out8 += String.fromCharCode(code);
    }
    return out8;
  }

  function extractTextOperatorsFromPdfChunk(chunkStr) {
    const out = [];
    const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*(?:Tj|'|")/g;
    let m;
    while ((m = tjRegex.exec(chunkStr)) !== null) {
      const dec = decodePdfEscapedLiteral(m[1]).trim();
      if (dec) out.push(dec);
    }
    const hexTjRegex = /<([0-9A-Fa-f\s]+)>\s*(?:Tj|'|")/g;
    while ((m = hexTjRegex.exec(chunkStr)) !== null) {
      const dec = decodePdfHexLiteral(m[1]).trim();
      if (dec) out.push(dec);
    }
    const tjArrRegex = /\[((?:[^[\]]|\([^()\\]*(?:\\.[^()\\]*)*\))*)\]\s*TJ/gi;
    while ((m = tjArrRegex.exec(chunkStr)) !== null) {
      const inner = m[1];
      const strParts = [];
      const tokenRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)|<([0-9A-Fa-f\s]+)>/g;
      let lm;
      while ((lm = tokenRegex.exec(inner)) !== null) {
        if (lm[1] !== undefined) strParts.push(decodePdfEscapedLiteral(lm[1]));
        else if (lm[2] !== undefined) strParts.push(decodePdfHexLiteral(lm[2]));
      }
      const joined = strParts.join('').trim();
      if (joined) out.push(joined);
    }
    if (out.length === 0) {
      const fallbackLit = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
      while ((m = fallbackLit.exec(chunkStr)) !== null) {
        const dec = decodePdfEscapedLiteral(m[1]).trim();
        if (dec) out.push(dec);
      }
    }
    return out.join('\n');
  }

  function extractReadableTextFromPdfStream(rawContent) {
    const str = String(rawContent || '');
    if (!str.trim()) return '';
    if (!str.includes('%PDF-')) {
      return str.replace(/^Method:\s*PDF_OCR\s*\r?\n?/i, '');
    }
    const extracted = extractTextOperatorsFromPdfChunk(str);
    if (extracted.trim()) {
      return extracted;
    }
    return str
      .replace(/^%PDF-[^\n]*$/gm, '')
      .replace(/\b(?:obj|endobj|stream|endstream|xref|trailer|startxref)\b/g, '\n')
      .replace(/[^\p{L}\p{M}\p{N}\p{P}\p{Z}\n\r]/gu, ' ');
  }

  let pdfJsLoaderPromise = null;
  function ensurePdfJsLoaded() {
    if (typeof window !== 'undefined' && window.pdfjsLib) {
      return Promise.resolve(window.pdfjsLib);
    }
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
      return Promise.resolve(null);
    }
    if (pdfJsLoaderPromise) return pdfJsLoaderPromise;
    pdfJsLoaderPromise = new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 5000);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = () => {
        clearTimeout(timer);
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        resolve(window.pdfjsLib || null);
      };
      script.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };
      if (document.head) document.head.appendChild(script);
      else resolve(null);
    });
    return pdfJsLoaderPromise;
  }

  async function decompressPdfBufferStreams(uint8) {
    const latin1 = new TextDecoder('latin1').decode(uint8);
    if (!latin1.includes('%PDF-')) {
      return new TextDecoder('utf-8', { fatal: false }).decode(uint8);
    }
    const collectedPages = [];
    const directText = extractTextOperatorsFromPdfChunk(latin1);
    if (directText.trim()) {
      collectedPages.push(directText);
    }
    if (typeof DecompressionStream === 'function') {
      const streamRegex = /stream\r?\n/g;
      let match;
      while ((match = streamRegex.exec(latin1)) !== null) {
        const startOffset = match.index + match[0].length;
        const endIdx = latin1.indexOf('endstream', startOffset);
        if (endIdx === -1) break;
        let endOffset = endIdx;
        if (latin1[endOffset - 1] === '\n') endOffset -= 1;
        if (latin1[endOffset - 1] === '\r') endOffset -= 1;
        if (endOffset <= startOffset || (endOffset - startOffset) > 5 * 1024 * 1024) continue;
        const slice = uint8.subarray(startOffset, endOffset);
        for (const fmt of ['deflate', 'deflate-raw']) {
          try {
            const ds = new DecompressionStream(fmt);
            const writer = ds.writable.getWriter();
            writer.write(slice).catch(() => {});
            writer.close().catch(() => {});
            const decompressedBuf = await new Response(ds.readable).arrayBuffer();
            const decompressedStr = new TextDecoder('utf-8', { fatal: false }).decode(decompressedBuf);
            const parsedChunk = extractTextOperatorsFromPdfChunk(decompressedStr);
            if (parsedChunk.trim()) {
              collectedPages.push(parsedChunk);
              break;
            }
          } catch (_) {}
        }
      }
    }
    return collectedPages.join('\n');
  }

  async function extractTextFromUploadedFile(file) {
    if (!file) return '';
    const fileName = String(file.name || '').toLowerCase();
    const isPdf = fileName.endsWith('.pdf') || String(file.type || '').toLowerCase() === 'application/pdf';

    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev && ev.target ? ev.target.result : null);
      reader.onerror = () => reject(new Error('Failed to read uploaded file.'));
      reader.readAsArrayBuffer(file);
    });

    if (!arrayBuffer) return isPdf ? 'Method: PDF_OCR\n' : '';
    const uint8 = new Uint8Array(arrayBuffer);

    if (!isPdf) {
      // Detect UTF-16LE / UTF-16BE BOMs (e.g. Excel "Unicode Text" CSV exports containing Hindi Devanagari)
      if (uint8.length >= 2 && uint8[0] === 0xFF && uint8[1] === 0xFE) {
        return new TextDecoder('utf-16le', { fatal: false }).decode(uint8.subarray(2));
      }
      if (uint8.length >= 2 && uint8[0] === 0xFE && uint8[1] === 0xFF) {
        return new TextDecoder('utf-16be', { fatal: false }).decode(uint8.subarray(2));
      }
      const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(uint8);
      return utf8Text.replace(/^\uFEFF/, '');
    }

    // 1. Try PDF.js page-by-page extraction with CMap support for Hindi Devanagari fonts
    try {
      const pdfjsLib = await ensurePdfJsLoaded();
      if (pdfjsLib && typeof pdfjsLib.getDocument === 'function') {
        const loadingTask = pdfjsLib.getDocument({
          data: uint8.slice(0),
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/'
        });
        const pdfDoc = await loadingTask.promise;
        const pageTexts = [];
        for (let p = 1; p <= pdfDoc.numPages; p++) {
          const page = await pdfDoc.getPage(p);
          const textContent = await page.getTextContent();
          const lines = [];
          let currentLine = [];
          let lastY = null;
          (textContent.items || []).forEach((item) => {
            const str = String(item.str || '');
            const y = item.transform ? Math.round(item.transform[5]) : null;
            if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
              if (currentLine.length > 0) lines.push(currentLine.join(' ').trim());
              currentLine = [str];
            } else {
              currentLine.push(str);
            }
            if (item.hasEOL) {
              if (currentLine.length > 0) lines.push(currentLine.join(' ').trim());
              currentLine = [];
              lastY = null;
            } else {
              lastY = y;
            }
          });
          if (currentLine.length > 0) lines.push(currentLine.join(' ').trim());
          const cleanPage = lines.filter(Boolean).join('\n');
          if (cleanPage) {
            pageTexts.push(`Page: ${p}\n${cleanPage}`);
          }
        }
        if (pageTexts.join('\n').trim()) {
          return 'Method: PDF_OCR\n' + pageTexts.join('\n\n');
        }
      }
    } catch (_) {}

    // 2. Fallback to native FlateDecode stream decompression + literal operator extraction
    try {
      const streamExtracted = await decompressPdfBufferStreams(uint8);
      if (streamExtracted && streamExtracted.trim()) {
        return 'Method: PDF_OCR\n' + streamExtracted;
      }
    } catch (_) {}

    // 3. Final fallback to plain text decoding
    const rawUtf8 = new TextDecoder('utf-8', { fatal: false }).decode(uint8);
    return 'Method: PDF_OCR\n' + extractReadableTextFromPdfStream(rawUtf8);
  }

  function parseMultiSetAnswerKeyFromPdf(answerKeyText, preferredSetCode) {
    const targetSet = String(preferredSetCode || 'A').trim().toUpperCase().replace(/^SET[\s\-_]*/i, '') || 'A';
    const raw = normalizeDevanagariDigits(extractReadableTextFromPdfStream(String(answerKeyText || '')));
    const columnMaps = {
      A: new Map(),
      B: new Map(),
      C: new Map(),
      D: new Map()
    };
    const detectedColumnsSet = new Set();
    const ambiguousQuestions = new Set();

    if (!raw.trim()) {
      return {
        selectedSetColumn: targetSet,
        detectedColumns: ['A', 'B', 'C', 'D'],
        selectedMap: new Map(),
        columnMaps,
        ambiguousQuestions: []
      };
    }

    const optionLetterToIdx = {
      A: 0, B: 1, C: 2, D: 3,
      '0': 0, '1': 1, '2': 2, '3': 3,
      'अ': 0, 'ब': 1, 'स': 2, 'द': 3,
      'क': 0, 'ख': 1, 'ग': 2, 'घ': 3,
      'आ': 1, 'इ': 2, 'ई': 3
    };

    const normalizeOpt = (tok) => {
      const clean = String(tok || '').trim().toUpperCase().replace(/[()[\].]/g, '');
      return optionLetterToIdx[clean] !== undefined ? optionLetterToIdx[clean] : null;
    };

    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    let activeColumnOrder = ['A', 'B', 'C', 'D'];
    let currentSectionSet = null;

    lines.forEach((line) => {
      // 1. Detect multi-column table header row such as: "Q.No | Set A | Set B | Set C | Set D" or "A B C D"
      const headerMatches = [];
      const setHeaderRegex = /\b(?:SET[\s\-_]*|SERIES[\s\-_]*)?([ABCD])\b/gi;
      if (/(?:set|series|q\.?\s*no|ques|अ|ब|स|द)/i.test(line) && !/^\d+\s*[-:=.)]/.test(line)) {
        let hm;
        while ((hm = setHeaderRegex.exec(line)) !== null) {
          const colLetter = hm[1].toUpperCase();
          if (!headerMatches.includes(colLetter)) headerMatches.push(colLetter);
        }
        if (headerMatches.length >= 2) {
          activeColumnOrder = headerMatches;
          headerMatches.forEach((c) => detectedColumnsSet.add(c));
          currentSectionSet = null;
          return;
        }
      }

      // 2. Detect single-set section header e.g., "SET - B" or "Answer Key Set B"
      const singleSetHeader = line.match(/^(?:ANSWER\s*KEY\s*(?:FOR)?\s*)?(?:SET|SERIES|PAPER\s*SET|सेट)[\s\-_:]*([ABCD])\b[:\-]?$/i);
      if (singleSetHeader) {
        currentSectionSet = singleSetHeader[1].toUpperCase();
        detectedColumnsSet.add(currentSectionSet);
        return;
      }

      // 3. Detect tabular multi-set row: e.g. "1   A   B   C   D" or "1 | C | B | A | D" or "1. (A) (C) (B) (D)"
      const tabularRowMatch = line.match(/^(?:Q\.?\s*)?(\d{1,3})\s*[|.:\-]?\s*\(?([A-Da-dअआइईब सदकखगघ])\)?[\s|,;]+\(?([A-Da-dअआइईबसदकखगघ])\)?(?:[\s|,;]+\(?([A-Da-dअआइईबसदकखगघ])\)?)?(?:[\s|,;]+\(?([A-Da-dअआइईबसदकखगघ])\)?)?\s*$/);
      if (tabularRowMatch) {
        const qNum = Number(tabularRowMatch[1]);
        const ansTokens = [tabularRowMatch[2], tabularRowMatch[3], tabularRowMatch[4], tabularRowMatch[5]].filter(Boolean);
        if (qNum > 0 && ansTokens.length >= 2) {
          ansTokens.forEach((tok, idx) => {
            const setCol = activeColumnOrder[idx] || ['A', 'B', 'C', 'D'][idx];
            const optIdx = normalizeOpt(tok);
            if (setCol && optIdx !== null) {
              detectedColumnsSet.add(setCol);
              if (columnMaps[setCol].has(qNum) && columnMaps[setCol].get(qNum) !== optIdx) {
                if (setCol === targetSet) ambiguousQuestions.add(qNum);
              }
              columnMaps[setCol].set(qNum, optIdx);
            }
          });
          return;
        }
      }

      // 4. Detect inline explicit Set-tagged pairs e.g. "Set B: 1-A, 2-C"
      const inlineSetPrefix = line.match(/^(?:SET|SERIES|सेट)[\s\-_]*([ABCD])\s*[:\-]\s*(.+)$/i);
      if (inlineSetPrefix) {
        const sCol = inlineSetPrefix[1].toUpperCase();
        detectedColumnsSet.add(sCol);
        const pairRegex = /(?:^|[\s,;|\n\r])(?:Q\.?\s*|प्रश्न\s*|प्र\.?\s*)?(\d{1,3})\s*(?:[-:=.)>]+|\s+)\s*\(?([A-Da-d0-3अआइईबसदकखगघ])\)?(?=$|[\s,;|\n\r.)])/g;
        let pm;
        while ((pm = pairRegex.exec(inlineSetPrefix[2])) !== null) {
          const qNum = Number(pm[1]);
          const optIdx = normalizeOpt(pm[2]);
          if (qNum > 0 && optIdx !== null) {
            columnMaps[sCol].set(qNum, optIdx);
          }
        }
        return;
      }

      // 5. Standard pairs ("1-A, 2-B, 3-C"): assign to currentSectionSet if active, otherwise to targetSet
      const pairRegex = /(?:^|[\s,;|\n\r])(?:Q\.?\s*|प्रश्न\s*|प्र\.?\s*)?(\d{1,3})\s*(?:[-:=.)>]+|\s+)\s*\(?([A-Da-d0-3अआइईबसदकखगघ])\)?(?=$|[\s,;|\n\r.)])/g;
      let match;
      while ((match = pairRegex.exec(line)) !== null) {
        const qNum = Number(match[1]);
        const optIdx = normalizeOpt(match[2]);
        if (qNum > 0 && optIdx !== null) {
          const destSet = currentSectionSet || targetSet;
          detectedColumnsSet.add(destSet);
          if (columnMaps[destSet].has(qNum) && columnMaps[destSet].get(qNum) !== optIdx) {
            if (destSet === targetSet) ambiguousQuestions.add(qNum);
          }
          columnMaps[destSet].set(qNum, optIdx);
        }
      }
    });

    const detectedColumns = detectedColumnsSet.size > 0
      ? ['A', 'B', 'C', 'D'].filter((c) => detectedColumnsSet.has(c))
      : ['A', 'B', 'C', 'D'];

    const selectedMap = columnMaps[targetSet] && columnMaps[targetSet].size > 0
      ? columnMaps[targetSet]
      : new Map();

    return {
      selectedSetColumn: targetSet,
      detectedColumns: detectedColumns.length > 0 ? detectedColumns : ['A', 'B', 'C', 'D'],
      selectedMap,
      columnMaps,
      ambiguousQuestions: Array.from(ambiguousQuestions)
    };
  }

  function parseAnswerKeyMap(answerKeyText, preferredSetCode) {
    if (preferredSetCode) {
      return parseMultiSetAnswerKeyFromPdf(answerKeyText, preferredSetCode).selectedMap;
    }
    const keyMap = new Map();
    const raw = normalizeDevanagariDigits(String(answerKeyText || ''));
    if (!raw.trim()) return keyMap;

    const optionLetterToIdx = {
      A: 0, B: 1, C: 2, D: 3,
      '0': 0, '1': 1, '2': 2, '3': 3,
      'अ': 0, 'ब': 1, 'स': 2, 'द': 3,
      'क': 0, 'ख': 1, 'ग': 2, 'घ': 3,
      'आ': 1, 'इ': 2, 'ई': 3
    };

    const pairRegex = /(?:^|[\s,;|\n\r])(?:Q\.?\s*|प्रश्न\s*|प्र\.?\s*)?(\d{1,3})\s*(?:[-:=.)>]+|\s+)\s*\(?([A-Da-d0-3अआइईबसदकखगघ])\)?(?=$|[\s,;|\n\r.)])/g;
    let match;
    while ((match = pairRegex.exec(raw)) !== null) {
      const qNum = Number(match[1]);
      const optToken = String(match[2] || '').trim().toUpperCase();
      if (qNum > 0 && optionLetterToIdx[optToken] !== undefined) {
        keyMap.set(qNum, optionLetterToIdx[optToken]);
      }
    }
    return keyMap;
  }

  function splitBilingualText(text) {
    const clean = String(text || '').trim();
    if (!clean) return { hi: '', en: '' };
    const hasDevanagari = /[\u0900-\u097F]/.test(clean);
    const hasLatin = /[A-Za-z]/.test(clean);
    if (hasDevanagari && hasLatin) {
      const parts = clean.split(/\s*(?:\/|\|\||\n)\s*/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const hiParts = parts.filter((p) => /[\u0900-\u097F]/.test(p));
        const enParts = parts.filter((p) => !/[\u0900-\u097F]/.test(p) && /[A-Za-z]/.test(p));
        if (hiParts.length > 0 && enParts.length > 0) {
          return { hi: hiParts.join(' '), en: enParts.join(' ') };
        }
      }
    }
    return { hi: clean, en: clean };
  }

  function parsePdfOcrAndMatchAnswerKey(rawContent, fileName, answerKeyOverride, paperSetCodeOverride, answerKeySetColOverride) {
    const structureErrors = [];
    const rawItems = [];
    const readableText = extractReadableTextFromPdfStream(rawContent);

    // Detect Question Paper Set Code from user selection or PDF header
    let detectedPaperSet = String(paperSetCodeOverride || '').trim().toUpperCase().replace(/^SET[\s\-_]*/i, '');
    if (!['A', 'B', 'C', 'D'].includes(detectedPaperSet)) {
      const headerSetMatch = readableText.slice(0, 600).match(/\b(?:SET|SERIES|PAPER\s*SET|सेट)[\s\-_:]*([ABCD])\b/i);
      detectedPaperSet = headerSetMatch ? headerSetMatch[1].toUpperCase() : 'A';
    }
    const selectedAnswerKeyColumn = String(answerKeySetColOverride || detectedPaperSet || 'A').trim().toUpperCase().replace(/^SET[\s\-_]*/i, '') || detectedPaperSet;

    if (!readableText.trim()) {
      structureErrors.push({
        rowNumber: 1,
        questionNumber: '-',
        errorType: 'Empty PDF / OCR Stream',
        reason: 'No readable text or OCR content could be extracted from the PDF file.'
      });
      return {
        fileType: 'PDF',
        structureErrors,
        rawItems,
        answerKeyMapSize: 0,
        paperSetCode: detectedPaperSet,
        detectedAnswerKeyColumns: ['A', 'B', 'C', 'D'],
        selectedAnswerKeyColumn
      };
    }

    let bodyText = readableText;
    let embeddedAnswerKeySection = '';
    const akHeaderMatch = readableText.match(/(?:^|\n)\s*(?:ANSWER\s*KEY|ANSWERS|उत्तर\s*माला|उत्तर\s*कुंजी|मॉडल\s*उत्तर)\s*[:\-]?\s*([\s\S]*)$/i);
    if (akHeaderMatch) {
      embeddedAnswerKeySection = akHeaderMatch[1] || '';
      bodyText = readableText.slice(0, akHeaderMatch.index);
    }

    // Parse Answer Key strictly for the selected Set Column (ignoring other sets A/B/C/D)
    const multiSetParsed = parseMultiSetAnswerKeyFromPdf(
      embeddedAnswerKeySection + '\n' + String(answerKeyOverride || ''),
      selectedAnswerKeyColumn
    );
    const combinedAnswerKeyMap = multiSetParsed.selectedMap;
    const ambiguousSet = new Set(multiSetParsed.ambiguousQuestions || []);

    const lines = bodyText.split(/\r?\n/);
    const questionBlocks = [];
    let currentBlock = null;
    let currentDetectedPage = 1;

    const qStartRegex = /^\s*(?:Q(?:uestion|ues)?\.?\s*|प्रश्न\s*(?:क्र(?:मांक)?\.?)?\s*|प्र\.?\s*)?(?:\(?([0-9\u0966-\u096F]{1,3})\)?\s*[.):\-]|(?:\(([0-9\u0966-\u096F]{1,3})\)))\s*(.+)$/i;
    const pageMarkerRegex = /(?:^|\s)(?:Page|पृष्ठ)\s*[:\-]?\s*([0-9\u0966-\u096F]{1,4})\b/i;

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      if (!line) return;
      const pageMatch = line.match(pageMarkerRegex);
      if (pageMatch && line.length < 32) {
        currentDetectedPage = Number(normalizeDevanagariDigits(pageMatch[1])) || currentDetectedPage;
        return;
      }
      const qMatch = line.match(qStartRegex);
      const qNumDigits = qMatch ? normalizeDevanagariDigits(qMatch[1] || qMatch[2] || '') : '';
      if (qMatch && Number(qNumDigits) > 0) {
        const qNum = Number(qNumDigits);
        if (currentBlock) questionBlocks.push(currentBlock);
        currentBlock = {
          rowNumber: idx + 1,
          questionNumber: qNum,
          pageNumber: currentDetectedPage,
          rawLines: [String(qMatch[3] || '').trim()]
        };
      } else if (currentBlock) {
        currentBlock.rawLines.push(line);
      }
    });
    if (currentBlock) questionBlocks.push(currentBlock);

    if (questionBlocks.length === 0) {
      structureErrors.push({
        rowNumber: 1,
        questionNumber: '-',
        errorType: 'No Numbered Questions Found in PDF',
        reason: 'Could not detect numbered questions (e.g., "1. प्रश्न...", "प्र. 1 ...", "Q1. ...") in the uploaded PDF.'
      });
      return {
        fileType: 'PDF',
        structureErrors,
        rawItems,
        answerKeyMapSize: combinedAnswerKeyMap.size,
        paperSetCode: detectedPaperSet,
        detectedAnswerKeyColumns: multiSetParsed.detectedColumns,
        selectedAnswerKeyColumn
      };
    }

    questionBlocks.forEach((block, idx) => {
      const fullBlockText = block.rawLines.join('\n');
      let inlineAnswer = null;
      let explanationHi = '';
      let explanationEn = '';
      let examCode = '';
      let subjectTag = '';
      let topic = '';
      let subtopic = '';
      let difficulty = '';

      const examMatch = fullBlockText.match(/\[\s*(?:Exam|Category|परीक्षा)\s*:\s*([^\]]+)\]/i);
      if (examMatch) examCode = examMatch[1].trim();
      const subjMatch = fullBlockText.match(/\[\s*(?:Subject|विषय)\s*:\s*([^\]]+)\]/i);
      if (subjMatch) subjectTag = subjMatch[1].trim();
      const topicMatch = fullBlockText.match(/\[\s*(?:Topic|टॉपिक|अध्याय)\s*:\s*([^\]]+)\]/i);
      if (topicMatch) topic = topicMatch[1].trim();
      const subtopicMatch = fullBlockText.match(/\[\s*(?:Subtopic|उपटॉपिक)\s*:\s*([^\]]+)\]/i);
      if (subtopicMatch) subtopic = subtopicMatch[1].trim();
      const diffMatch = fullBlockText.match(/\[\s*(?:Difficulty|कठिनाई|स्तर)\s*:\s*([^\]]+)\]/i);
      if (diffMatch) difficulty = diffMatch[1].trim();

      const inlineAnsMatch = fullBlockText.match(/(?:^|\n)\s*(?:Ans(?:wer)?|Correct\s*Answer|उत्तर|सही\s*उत्तर|सही\s*विकल्प)\s*[:\-=]\s*\(?([A-Da-d0-3अआइईबसदकखगघ])\)?/i);
      if (inlineAnsMatch) {
        const inlineMap = parseAnswerKeyMap(`1-${inlineAnsMatch[1]}`);
        if (inlineMap.has(1)) inlineAnswer = inlineMap.get(1);
      }

      const expMatch = fullBlockText.match(/(?:^|\n)\s*(?:Explanation|Sol(?:ution)?|व्याख्या|उत्तर\s*व्याख्या|हल)\s*[:\-]\s*([\s\S]+)$/i);
      let textWithoutExp = fullBlockText;
      if (expMatch) {
        const expBilingual = splitBilingualText(expMatch[1].trim());
        explanationHi = expBilingual.hi;
        explanationEn = expBilingual.en;
        textWithoutExp = fullBlockText.slice(0, expMatch.index);
      }

      textWithoutExp = textWithoutExp
        .replace(/(?:^|\n)\s*(?:Ans(?:wer)?|Correct\s*Answer|उत्तर|सही\s*उत्तर|सही\s*विकल्प)\s*[:\-=]\s*\(?[A-Da-d0-3अआइईबसदकखगघ]\b[^\n]*/gi, '')
        .replace(/\[\s*(?:Exam|Category|Subject|Topic|Subtopic|Difficulty|परीक्षा|विषय|टॉपिक|अध्याय|उपटॉपिक|कठिनाई|स्तर)\s*:[^\]]+\]/gi, '')
        .trim();

      const optRegex = /(?:^|\n|\s)(?:[([]\s*([A-Da-dअआइईबसदकखगघ1-4१-४])\s*[)\]]|([A-Da-dअआइईबसदकखगघ])\s*[).:\-])\s*([\s\S]*?)(?=(?:\n|\s)(?:[([]\s*[A-Da-dअआइईबसदकखगघ1-4१-४]\s*[)\]]|[A-Da-dअआइईबसदकखगघ]\s*[).:\-])|$)/g;
      const extractedOpts = ['', '', '', ''];
      let firstOptIndex = -1;
      let optMatch;
      const optTokenMap = {
        A: 0, B: 1, C: 2, D: 3,
        'अ': 0, 'ब': 1, 'स': 2, 'द': 3,
        'क': 0, 'ख': 1, 'ग': 2, 'घ': 3,
        'आ': 1, 'इ': 2, 'ई': 3,
        '1': 0, '2': 1, '3': 2, '4': 3,
        '१': 0, '२': 1, '३': 2, '४': 3
      };

      while ((optMatch = optRegex.exec(textWithoutExp)) !== null) {
        const rawLetter = String(optMatch[1] || optMatch[2] || '').trim().toUpperCase();
        const optIdx = optTokenMap[rawLetter];
        if (optIdx !== undefined) {
          if (firstOptIndex === -1) firstOptIndex = optMatch.index;
          extractedOpts[optIdx] = String(optMatch[3] || '').trim();
        }
      }

      const stemRaw = (firstOptIndex > 0 ? textWithoutExp.slice(0, firstOptIndex) : textWithoutExp).trim();
      const stemBilingual = splitBilingualText(stemRaw);
      const optsHi = [];
      const optsEn = [];
      for (let i = 0; i < 4; i++) {
        const splitOpt = splitBilingualText(extractedOpts[i]);
        optsHi.push(splitOpt.hi);
        optsEn.push(splitOpt.en);
      }

      const isAmbiguous = ambiguousSet.has(block.questionNumber);
      const matchedFromKey = !isAmbiguous && combinedAnswerKeyMap.has(block.questionNumber)
        ? combinedAnswerKeyMap.get(block.questionNumber)
        : (!isAmbiguous ? inlineAnswer : null);

      const finalExpHi = explanationHi || explanationEn || (matchedFromKey !== undefined && matchedFromKey !== null
        ? `सही उत्तर विकल्प ${['A', 'B', 'C', 'D'][matchedFromKey]} (Set ${selectedAnswerKeyColumn}) है।`
        : '');
      const finalExpEn = explanationEn || explanationHi || (matchedFromKey !== undefined && matchedFromKey !== null
        ? `Correct answer is Option ${['A', 'B', 'C', 'D'][matchedFromKey]} (Set ${selectedAnswerKeyColumn}).`
        : '');

      rawItems.push({
        rowNumber: block.rowNumber || (idx + 1),
        questionNumber: block.questionNumber || (idx + 1),
        id: '',
        questionHi: stemBilingual.hi,
        questionEn: stemBilingual.en,
        optionsHi: optsHi,
        optionsEn: optsEn,
        rawCorrectIndex: matchedFromKey !== null && matchedFromKey !== undefined ? matchedFromKey : '',
        answerKeyMatched: matchedFromKey !== null && matchedFromKey !== undefined,
        answerKeySetColumn: selectedAnswerKeyColumn,
        paperSetCode: `Set ${detectedPaperSet}`,
        explanationHi: finalExpHi,
        explanationEn: finalExpEn,
        examCode,
        subjectTag,
        topic,
        subtopic,
        difficulty: difficulty || 'Moderate',
        difficultyLevel: difficulty || 'Moderate',
        questionType: 'MCQ',
        sourceDocument: fileName || 'uploaded_paper.pdf',
        sourcePageNumber: String(block.pageNumber || 1),
        languageAvailability: detectLanguageAvailability(stemBilingual.hi, stemBilingual.en),
        pyqTag: `PDF Import (Set ${detectedPaperSet})`,
        tags: ['PDF Import', `Set ${detectedPaperSet}`, 'OCR Verified'],
        status: matchedFromKey !== null && matchedFromKey !== undefined ? 'verified' : 'unverified',
        adminVerified: matchedFromKey !== null && matchedFromKey !== undefined,
        importSource: 'pdf_ocr_answer_key'
      });
    });

    return {
      fileType: 'PDF',
      structureErrors,
      rawItems,
      answerKeyMapSize: combinedAnswerKeyMap.size,
      paperSetCode: detectedPaperSet,
      detectedAnswerKeyColumns: multiSetParsed.detectedColumns,
      selectedAnswerKeyColumn
    };
  }

  function parseRawImportFile(rawText, fileName, answerKeyText, paperSetCode, answerKeySetCol) {
    const cleanText = String(rawText || '').trim();
    const lowName = String(fileName || '').toLowerCase();
    const isPdfFile = lowName.endsWith('.pdf') || cleanText.startsWith('%PDF-') || /^Method:\s*PDF_OCR/i.test(cleanText);
    const isJsonFile = !isPdfFile && (lowName.endsWith('.json') || cleanText.startsWith('[') || cleanText.startsWith('{'));
    const structureErrors = [];
    const rawItems = [];

    if (!cleanText) {
      structureErrors.push({
        rowNumber: 1,
        questionNumber: '-',
        errorType: 'Empty File',
        reason: 'The uploaded file is completely empty.'
      });
      return { fileType: isPdfFile ? 'PDF' : (isJsonFile ? 'JSON' : 'CSV'), structureErrors, rawItems };
    }

    if (isPdfFile) {
      return parsePdfOcrAndMatchAnswerKey(cleanText, fileName, answerKeyText, paperSetCode, answerKeySetCol);
    }

    if (isJsonFile) {
      let parsed = null;
      try {
        parsed = JSON.parse(cleanText);
      } catch (syntaxErr) {
        structureErrors.push({
          rowNumber: 1,
          questionNumber: '-',
          errorType: 'Invalid JSON Structure',
          reason: `Malformed JSON syntax: ${syntaxErr.message || 'Unable to parse JSON'}`
        });
        return { fileType: 'JSON', structureErrors, rawItems };
      }

      let arr = null;
      if (Array.isArray(parsed)) {
        arr = parsed;
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.questions)) {
        arr = parsed.questions;
      } else {
        structureErrors.push({
          rowNumber: 1,
          questionNumber: '-',
          errorType: 'Invalid JSON Structure',
          reason: 'Root JSON must be an Array of question objects or an Object containing a "questions" Array.'
        });
        return { fileType: 'JSON', structureErrors, rawItems };
      }

      // Detect if JSON batch uses 1-based answer numbering (1..4 with no 0)
      const jsonRawIndices = arr
        .map((it) => (it && typeof it === 'object' ? normalizeDevanagariDigits(String(it.correctIndex ?? it.correctOptionIndex ?? it.correctAnswer ?? it.answer ?? '')).trim() : ''))
        .filter(Boolean);
      const jsonPreferOneBased = jsonRawIndices.includes('4') && !jsonRawIndices.includes('0');

      arr.forEach((item, idx) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          rawItems.push({
            rowNumber: idx + 1,
            questionNumber: idx + 1,
            isMalformedRow: true,
            malformedReason: 'JSON entry is not a valid question object.'
          });
          return;
        }
        const fallbackOpts = Array.isArray(item.options) ? item.options : [];
        const hiOpts = Array.isArray(item.optionsHi)
          ? item.optionsHi
          : [item.optA_Hi ?? fallbackOpts[0], item.optB_Hi ?? fallbackOpts[1], item.optC_Hi ?? fallbackOpts[2], item.optD_Hi ?? fallbackOpts[3]];
        const enOpts = Array.isArray(item.optionsEn)
          ? item.optionsEn
          : [item.optA_En ?? item.optA ?? fallbackOpts[0], item.optB_En ?? item.optB ?? fallbackOpts[1], item.optC_En ?? item.optC ?? fallbackOpts[2], item.optD_En ?? item.optD ?? fallbackOpts[3]];
        const parsedExamIds = Array.isArray(item.examIds)
          ? item.examIds
          : (item.examIds ? String(item.examIds).split(/[;|,]/).map((e) => e.trim()).filter(Boolean) : []);
        rawItems.push({
          rowNumber: idx + 1,
          questionNumber: idx + 1,
          preferOneBased: jsonPreferOneBased,
          id: item.questionId || item.id || '',
          questionId: item.questionId || item.id || '',
          questionHi: item.questionHi != null ? String(item.questionHi).trim() : '',
          questionEn: item.questionEn != null ? String(item.questionEn).trim() : (item.question != null ? String(item.question).trim() : ''),
          optionsHi: [
            hiOpts[0] != null ? String(hiOpts[0]).trim() : '',
            hiOpts[1] != null ? String(hiOpts[1]).trim() : '',
            hiOpts[2] != null ? String(hiOpts[2]).trim() : '',
            hiOpts[3] != null ? String(hiOpts[3]).trim() : ''
          ],
          optionsEn: [
            enOpts[0] != null ? String(enOpts[0]).trim() : '',
            enOpts[1] != null ? String(enOpts[1]).trim() : '',
            enOpts[2] != null ? String(enOpts[2]).trim() : '',
            enOpts[3] != null ? String(enOpts[3]).trim() : ''
          ],
          rawCorrectIndex: item.correctIndex !== undefined ? item.correctIndex : (item.correctOptionIndex !== undefined ? item.correctOptionIndex : (item.correctAnswer !== undefined ? item.correctAnswer : item.answer)),
          explanationHi: item.explanationHi != null ? String(item.explanationHi).trim() : '',
          explanationEn: item.explanationEn != null ? String(item.explanationEn).trim() : (item.explanation != null ? String(item.explanation).trim() : ''),
          examCode: item.examCode || item.examCategory || (parsedExamIds[0] || ''),
          examIds: parsedExamIds,
          subjectId: item.subjectId || '',
          subjectTag: item.subjectTag || item.subject || '',
          topicId: item.topicId || '',
          topic: item.topic || '',
          subtopicId: item.subtopicId || '',
          subtopic: item.subtopic || '',
          difficulty: item.difficultyLevel || item.difficulty || '',
          difficultyLevel: item.difficultyLevel || item.difficulty || '',
          questionType: item.questionType || 'MCQ',
          sourceExam: item.sourceExam || '',
          sourceYear: item.sourceYear || '',
          paperSetCode: item.paperSetCode || '',
          sourceDocument: item.sourceDocument || fileName || '',
          sourcePageNumber: item.sourcePageNumber || '',
          verificationStatus: item.verificationStatus || item.status || 'verified',
          languageAvailability: item.languageAvailability || item.language || '',
          pyqTag: item.pyqTag || '',
          tags: Array.isArray(item.tags) ? item.tags : (item.tags ? String(item.tags).split(',').map((t) => t.trim()).filter(Boolean) : []),
          status: item.status || 'verified',
          adminVerified: item.adminVerified !== false && item.verified !== false && item.status !== 'unverified' && item.verificationStatus !== 'needs_categorisation'
        });
      });

      return { fileType: 'JSON', structureErrors, rawItems };
    }

    // CSV File Parsing & Header Validation (100% compatible with legacy 14-column CSV + optional hierarchical columns + Hindi headers)
    const csvRows = parseCsvWithRowNumbers(cleanText);
    if (csvRows.length === 0) {
      structureErrors.push({
        rowNumber: 1,
        questionNumber: '-',
        errorType: 'Empty CSV File',
        reason: 'No rows found in the CSV file.'
      });
      return { fileType: 'CSV', structureErrors, rawItems };
    }

    const firstRowCells = csvRows[0].cells;
    const looksLikeHeader = firstRowCells.some((c) => {
      const k = String(c || '').toLowerCase().replace(/[\s_-]/g, '');
      return k.includes('question') || k.includes('opta') || k.includes('correct') || k.includes('subject') || k.includes('explanation') ||
        k.includes('प्रश्न') || k.includes('विकल्प') || k.includes('उत्तर') || k.includes('विषय');
    });

    let columnKeys = [];
    let dataStartIdx = 0;

    if (looksLikeHeader) {
      dataStartIdx = 1;
      const unrecognizedCols = [];
      columnKeys = firstRowCells.map((rawCol) => {
        const cleanCol = String(rawCol || '').trim().toLowerCase();
        const snakeKey = cleanCol.replace(/[\s\-]+/g, '_');
        const compactKey = cleanCol.replace(/[\s\-_]+/g, '');
        const mapped = KNOWN_CSV_COLUMN_MAP[cleanCol] || KNOWN_CSV_COLUMN_MAP[snakeKey] || KNOWN_CSV_COLUMN_MAP[compactKey];
        if (!mapped && cleanCol && !['qno', 'q_no', 'sno', 's_no', 'srno', 'serial', 'क्रमांक', 'क्र'].includes(compactKey)) {
          unrecognizedCols.push(rawCol);
        }
        return mapped || null;
      });

      if (unrecognizedCols.length > 0) {
        structureErrors.push({
          rowNumber: csvRows[0].rowNumber,
          questionNumber: 'Header',
          errorType: 'Incorrect CSV Column Names',
          reason: `Unrecognized column header(s): ${unrecognizedCols.map((c) => `"${c}"`).join(', ')}. Expected standard headers like questionHi, questionEn, optA_Hi..optD_Hi, optA_En..optD_En, correctIndex, explanationHi, explanationEn, subjectTag.`
        });
      }

      const mappedSet = new Set(columnKeys.filter(Boolean));
      const missingRequiredHeaders = [];
      if (!mappedSet.has('questionHi') && !mappedSet.has('questionEn')) missingRequiredHeaders.push('questionHi / questionEn');
      if (!mappedSet.has('optA_Hi') && !mappedSet.has('optA_En')) missingRequiredHeaders.push('optA_Hi..optD_Hi / optA_En..optD_En');
      if (!mappedSet.has('correctIndex')) missingRequiredHeaders.push('correctIndex');

      if (missingRequiredHeaders.length > 0) {
        structureErrors.push({
          rowNumber: csvRows[0].rowNumber,
          questionNumber: 'Header',
          errorType: 'Missing Required CSV Columns',
          reason: `CSV header row is missing required columns: ${missingRequiredHeaders.join(', ')}.`
        });
      }
    } else if (firstRowCells.length >= 6 && firstRowCells.length <= 10) {
      // Compact positional CSV (single-language 6-to-10 column format)
      columnKeys = [
        'questionHi',
        'optA_Hi', 'optB_Hi', 'optC_Hi', 'optD_Hi',
        'correctIndex', 'explanationHi', 'subjectTag', 'examCode', 'topic'
      ];
    } else {
      // Positional fallback: legacy 14-column format + optional columns
      columnKeys = [
        'questionHi', 'questionEn',
        'optA_Hi', 'optB_Hi', 'optC_Hi', 'optD_Hi',
        'optA_En', 'optB_En', 'optC_En', 'optD_En',
        'correctIndex', 'explanationHi', 'explanationEn',
        'subjectTag', 'examCode', 'topic', 'subtopic', 'difficulty', 'tags'
      ];
    }

    const corrColPosition = columnKeys.indexOf('correctIndex');
    const csvRawCorrectValues = [];
    if (corrColPosition >= 0) {
      for (let r = dataStartIdx; r < csvRows.length; r++) {
        const v = normalizeDevanagariDigits(String((csvRows[r].cells || [])[corrColPosition] || '')).trim();
        if (v) csvRawCorrectValues.push(v);
      }
    }
    const csvPreferOneBased = csvRawCorrectValues.includes('4') && !csvRawCorrectValues.includes('0');

    let qCounter = 0;
    for (let r = dataStartIdx; r < csvRows.length; r++) {
      const rowObj = csvRows[r];
      const cells = rowObj.cells;
      qCounter += 1;

      const mappedData = {};
      columnKeys.forEach((key, colIdx) => {
        if (key && cells[colIdx] !== undefined) {
          mappedData[key] = cells[colIdx];
        }
      });

      const minRequiredCells = looksLikeHeader ? Math.min(6, columnKeys.filter(Boolean).length) : 6;
      const missingColumnCount = cells.length < minRequiredCells;
      const parsedExamIds = mappedData.examIds
        ? String(mappedData.examIds).split(/[;|,]/).map((e) => e.trim()).filter(Boolean)
        : [];
      rawItems.push({
        rowNumber: rowObj.rowNumber,
        questionNumber: qCounter,
        preferOneBased: csvPreferOneBased,
        hasFewerColumns: missingColumnCount,
        columnCountDetected: cells.length,
        id: mappedData.questionId || mappedData.id || '',
        questionId: mappedData.questionId || mappedData.id || '',
        questionHi: mappedData.questionHi != null ? String(mappedData.questionHi).trim() : '',
        questionEn: mappedData.questionEn != null ? String(mappedData.questionEn).trim() : '',
        optionsHi: [
          mappedData.optA_Hi != null ? String(mappedData.optA_Hi).trim() : '',
          mappedData.optB_Hi != null ? String(mappedData.optB_Hi).trim() : '',
          mappedData.optC_Hi != null ? String(mappedData.optC_Hi).trim() : '',
          mappedData.optD_Hi != null ? String(mappedData.optD_Hi).trim() : ''
        ],
        optionsEn: [
          mappedData.optA_En != null ? String(mappedData.optA_En).trim() : '',
          mappedData.optB_En != null ? String(mappedData.optB_En).trim() : '',
          mappedData.optC_En != null ? String(mappedData.optC_En).trim() : '',
          mappedData.optD_En != null ? String(mappedData.optD_En).trim() : ''
        ],
        rawCorrectIndex: mappedData.correctIndex,
        explanationHi: mappedData.explanationHi != null ? String(mappedData.explanationHi).trim() : '',
        explanationEn: mappedData.explanationEn != null ? String(mappedData.explanationEn).trim() : '',
        examCode: mappedData.examCode || parsedExamIds[0] || '',
        examIds: parsedExamIds,
        subjectId: mappedData.subjectId || '',
        subjectTag: mappedData.subjectTag || '',
        topicId: mappedData.topicId || '',
        topic: mappedData.topic || '',
        subtopicId: mappedData.subtopicId || '',
        subtopic: mappedData.subtopic || '',
        difficulty: mappedData.difficultyLevel || mappedData.difficulty || '',
        difficultyLevel: mappedData.difficultyLevel || mappedData.difficulty || '',
        questionType: mappedData.questionType || 'MCQ',
        sourceExam: mappedData.sourceExam || '',
        sourceYear: mappedData.sourceYear || '',
        paperSetCode: mappedData.paperSetCode || '',
        sourceDocument: mappedData.sourceDocument || fileName || '',
        sourcePageNumber: mappedData.sourcePageNumber || '',
        verificationStatus: mappedData.verificationStatus || mappedData.status || 'verified',
        languageAvailability: mappedData.languageAvailability || '',
        pyqTag: mappedData.pyqTag || '',
        tags: mappedData.tags ? String(mappedData.tags).split(/[;|,]/).map((t) => t.trim()).filter(Boolean) : [],
        status: mappedData.status || 'verified',
        adminVerified: mappedData.status !== 'unverified' && mappedData.verificationStatus !== 'needs_categorisation'
      });
    }

    return { fileType: 'CSV', structureErrors, rawItems };
  }

  function buildAndValidatePreviewSession(rawText, fileName, targetTestId, batchDefaults, existingPreviewRecords, state, answerKeyText) {
    const catalog = getTaxonomyCatalog(state);
    let structureErrors = [];
    let sourceRecords = [];
    let fileType = 'CSV';
    const effectiveAnswerKeyText = answerKeyText !== undefined
      ? answerKeyText
      : ((qbState.previewSession && qbState.previewSession.answerKeyText) || '');

    const defaultExamCode = (batchDefaults && batchDefaults.examCode) || 'CGPSC';
    const defaultExamIds = (batchDefaults && Array.isArray(batchDefaults.examIds) && batchDefaults.examIds.length > 0)
      ? batchDefaults.examIds
      : [defaultExamCode];

    const effectivePaperSetCode = String(
      (batchDefaults && batchDefaults.paperSetCode) ||
      (qbState.previewSession && qbState.previewSession.paperSetCode) ||
      'A'
    ).trim().toUpperCase().replace(/^SET[\s\-_]*/i, '') || 'A';

    const effectiveAnswerKeySetCol = String(
      (batchDefaults && batchDefaults.answerKeySetColumn) ||
      (qbState.previewSession && qbState.previewSession.selectedAnswerKeyColumn) ||
      effectivePaperSetCode
    ).trim().toUpperCase().replace(/^SET[\s\-_]*/i, '') || effectivePaperSetCode;

    let detectedAnswerKeyCols = (qbState.previewSession && qbState.previewSession.detectedAnswerKeyColumns) || ['A', 'B', 'C', 'D'];

    if (Array.isArray(existingPreviewRecords)) {
      sourceRecords = existingPreviewRecords;
      fileType = (qbState.previewSession && qbState.previewSession.fileType) || 'CSV';
      structureErrors = (qbState.previewSession && qbState.previewSession.fileStructureErrors) || [];
      if (fileType === 'PDF' && (answerKeyText !== undefined || (batchDefaults && batchDefaults.answerKeySetColumn))) {
        const multiParsed = parseMultiSetAnswerKeyFromPdf(effectiveAnswerKeyText, effectiveAnswerKeySetCol);
        detectedAnswerKeyCols = multiParsed.detectedColumns;
        const keyMap = multiParsed.selectedMap;
        sourceRecords.forEach((rec) => {
          rec.paperSetCode = `Set ${effectivePaperSetCode}`;
          rec.answerKeySetColumn = effectiveAnswerKeySetCol;
          if (keyMap.has(Number(rec.questionNumber))) {
            rec.rawCorrectIndex = keyMap.get(Number(rec.questionNumber));
            rec.answerKeyMatched = true;
          } else if (multiParsed.detectedColumns.length > 0 && effectiveAnswerKeyText.trim()) {
            rec.rawCorrectIndex = '';
            rec.answerKeyMatched = false;
          }
        });
      }
    } else {
      const parsed = parseRawImportFile(rawText, fileName, effectiveAnswerKeyText, effectivePaperSetCode, effectiveAnswerKeySetCol);
      fileType = parsed.fileType;
      structureErrors = parsed.structureErrors;
      if (parsed.detectedAnswerKeyColumns) {
        detectedAnswerKeyCols = parsed.detectedAnswerKeyColumns;
      }
      sourceRecords = parsed.rawItems.map((item) => {
        const hasSpecificSubject = item.subjectTag && !/^(?:general|general\s*studies|gs|gk|सामान्य\s*अध्ययन|needs[\s_]*categorisation|unknown|-)$/i.test(String(item.subjectTag).trim());
        const hasSpecificTopic = item.topic && !/^(?:general|general\s*knowledge|gk|gs|सामान्य\s*ज्ञान|needs[\s_]*categorisation|unknown|-)$/i.test(String(item.topic).trim());
        const shouldAutoCat = !(batchDefaults && batchDefaults.overrideAll) && (fileType === 'PDF' || !hasSpecificSubject || !hasSpecificTopic);

        if (shouldAutoCat) {
          const predicted = autoCategorizeQuestionFromMaster(item, catalog, defaultExamIds);
          const isPdf = fileType === 'PDF';
          return Object.assign({}, item, {
            examCode: item.examCode || predicted.examCode,
            examIds: (Array.isArray(item.examIds) && item.examIds.length > 0) ? item.examIds : predicted.examIds,
            subjectId: predicted.subjectId || item.subjectId || '',
            subjectTag: predicted.subjectTag || item.subjectTag || (batchDefaults && batchDefaults.subjectTag) || 'Chhattisgarh General Knowledge',
            topicId: predicted.topicId || item.topicId || '',
            topic: predicted.topic || item.topic || (batchDefaults && batchDefaults.topic) || 'History of Chhattisgarh',
            subtopicId: predicted.subtopicId || item.subtopicId || '',
            subtopic: predicted.subtopic || item.subtopic || '',
            categorisationConfidence: predicted.categorisationConfidence,
            needsCategorisation: isPdf ? predicted.needsCategorisation : false,
            verificationStatus: isPdf ? (predicted.needsCategorisation ? 'needs_categorisation' : (item.answerKeyMatched ? 'verified' : 'unverified')) : (item.verificationStatus || 'verified'),
            status: isPdf ? (predicted.needsCategorisation ? 'needs_categorisation' : (item.answerKeyMatched ? 'verified' : 'unverified')) : (item.status || 'verified'),
            adminVerified: isPdf ? (!predicted.needsCategorisation && Boolean(item.answerKeyMatched)) : (item.adminVerified !== false),
            duplicateResolution: 'merge_exams'
          });
        }
        return Object.assign({}, item, {
          duplicateResolution: 'merge_exams',
          adminVerified: item.adminVerified !== false
        });
      });
    }

    // Existing questions pool for duplicate detection (excluding deleted questions)
    const existingPool = [];
    (state.questionBank || []).forEach((q) => {
      if (q.isDeleted === true || q.deleted === true || String(q.status || '').toLowerCase() === 'deleted') return;
      existingPool.push({
        id: q.id,
        questionId: q.questionId || q.id,
        examCode: q.examCode || 'CGPSC',
        examIds: Array.isArray(q.examIds) && q.examIds.length > 0 ? q.examIds : [q.examCode || 'CGPSC'],
        sourceLabel: 'Central Question Bank',
        questionHi: q.questionHi || '',
        questionEn: q.questionEn || '',
        optionsHi: q.optionsHi || ['', '', '', ''],
        optionsEn: q.optionsEn || ['', '', '', ''],
        correctOptionIndex: q.correctOptionIndex || 0,
        explanationHi: q.explanationHi || '',
        explanationEn: q.explanationEn || '',
        subjectTag: q.subjectTag || ''
      });
    });

    if (targetTestId && targetTestId !== 'central_bank') {
      const targetTest = (state.tests || []).find((t) => t.id === targetTestId);
      if (targetTest && Array.isArray(targetTest.questions)) {
        targetTest.questions.forEach((tq) => {
          existingPool.push({
            id: tq.id,
            questionId: tq.questionId || tq.centralQuestionId || tq.id,
            examCode: tq.examCode || targetTest.examCode || 'CGPSC',
            examIds: Array.isArray(tq.examIds) ? tq.examIds : [tq.examCode || targetTest.examCode || 'CGPSC'],
            sourceLabel: `Target Test: ${targetTest.titleHi}`,
            questionHi: tq.questionHi || '',
            questionEn: tq.questionEn || '',
            optionsHi: tq.optionsHi || ['', '', '', ''],
            optionsEn: tq.optionsEn || ['', '', '', ''],
            correctOptionIndex: tq.correctOptionIndex || 0,
            explanationHi: tq.explanationHi || '',
            explanationEn: tq.explanationEn || '',
            subjectTag: tq.subjectTag || ''
          });
        });
      }
    }

    const seenInBatch = [];
    const unknownTaxonomyItems = [];

    const validatedRecords = sourceRecords.map((item, idx) => {
      const rowNumber = item.rowNumber || (idx + 1);
      const questionNumber = item.questionNumber || (idx + 1);
      const errors = [];
      const warnings = [];

      if (item.isMalformedRow) {
        errors.push({
          rowNumber,
          questionNumber,
          errorType: 'Invalid JSON Structure',
          reason: item.malformedReason || 'Invalid question object structure.'
        });
      }

      if (item.hasFewerColumns) {
        errors.push({
          rowNumber,
          questionNumber,
          errorType: 'Missing CSV Columns',
          reason: `Row has only ${item.columnCountDetected} column(s); expected at least 6 columns (question, 4 options, correctIndex).`
        });
      }

      const rawQHi = String(item.questionHi || '').trim();
      const rawQEn = String(item.questionEn || '').trim();
      const qHi = rawQHi || rawQEn;
      const qEn = rawQEn || rawQHi;

      const rawOptsHi = Array.isArray(item.optionsHi) ? item.optionsHi.map((o) => String(o || '').trim()) : ['', '', '', ''];
      const rawOptsEn = Array.isArray(item.optionsEn) ? item.optionsEn.map((o) => String(o || '').trim()) : ['', '', '', ''];
      const optsHi = [0, 1, 2, 3].map((i) => rawOptsHi[i] || rawOptsEn[i] || '');
      const optsEn = [0, 1, 2, 3].map((i) => rawOptsEn[i] || rawOptsHi[i] || '');

      const rawExpHi = String(item.explanationHi || '').trim();
      const rawExpEn = String(item.explanationEn || '').trim();

      const isPdfWithAutoCat = fileType === 'PDF' && !(batchDefaults && batchDefaults.overrideAll);

      const effectiveExamCode = String(
        (batchDefaults && batchDefaults.overrideAll && batchDefaults.examCode)
          ? batchDefaults.examCode
          : (item.examCode || (batchDefaults && batchDefaults.examCode) || 'CGPSC')
      ).trim().toUpperCase().replace(/\s+/g, '_');

      const effectiveExamIds = Array.from(new Set([
        ...(Array.isArray(item.examIds) ? item.examIds.map((e) => String(e).trim().toUpperCase().replace(/\s+/g, '_')) : []),
        effectiveExamCode
      ])).filter(Boolean);

      const effectiveSubject = String(
        (batchDefaults && batchDefaults.overrideAll && batchDefaults.subjectTag)
          ? batchDefaults.subjectTag
          : (item.subjectTag !== undefined && item.subjectTag !== ''
              ? item.subjectTag
              : (isPdfWithAutoCat ? '' : ((batchDefaults && batchDefaults.subjectTag) || 'Chhattisgarh General Knowledge')))
      ).trim();

      const effectiveTopic = String(
        (batchDefaults && batchDefaults.overrideAll && batchDefaults.topic)
          ? batchDefaults.topic
          : (item.topic !== undefined && item.topic !== ''
              ? item.topic
              : (isPdfWithAutoCat ? '' : ((batchDefaults && batchDefaults.topic) || '')))
      ).trim();

      const effectiveSubtopic = String(
        (batchDefaults && batchDefaults.overrideAll && batchDefaults.subtopic)
          ? batchDefaults.subtopic
          : (item.subtopic || (batchDefaults && batchDefaults.subtopic) || '')
      ).trim();

      const rawDiff = (batchDefaults && batchDefaults.overrideAll && batchDefaults.difficulty)
        ? batchDefaults.difficulty
        : (item.difficultyLevel || item.difficulty || (batchDefaults && batchDefaults.difficulty) || 'Moderate');
      const normalizedDiff = normalizeDifficulty(rawDiff);

      const batchTags = (batchDefaults && batchDefaults.tagsText)
        ? String(batchDefaults.tagsText).split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const mergedTags = Array.from(new Set([...(item.tags || []), ...batchTags]));

      // Resolve hierarchical IDs against Subject/Topic/Subtopic Master
      const resolvedHierarchy = catalog.resolveHierarchy({
        examIds: effectiveExamIds,
        examCode: effectiveExamCode,
        subjectId: item.subjectId || '',
        subjectTag: effectiveSubject,
        topicId: item.topicId || '',
        topic: effectiveTopic,
        subtopicId: item.subtopicId || '',
        subtopic: effectiveSubtopic
      });

      const idxCheck = parseCorrectIndexValue(item.rawCorrectIndex, optsHi, optsEn, item.preferOneBased);
      const corrLetter = idxCheck.valid ? ['A', 'B', 'C', 'D'][idxCheck.index] : 'A';
      const expHi = rawExpHi || rawExpEn || (idxCheck.valid ? `सही उत्तर विकल्प ${corrLetter} है।` : '');
      const expEn = rawExpEn || rawExpHi || (idxCheck.valid ? `Correct answer is Option ${corrLetter}.` : '');

      // 1. Check empty record
      const isCompletelyEmpty = !qHi && !qEn && optsHi.every((o) => !o) && optsEn.every((o) => !o);
      if (isCompletelyEmpty) {
        errors.push({
          rowNumber,
          questionNumber,
          errorType: 'Empty Question Record',
          reason: 'Question stem and all answer options are empty.'
        });
      } else {
        // 2. Check missing Hindi or English question text
        if (!rawQHi && !rawQEn) {
          errors.push({
            rowNumber,
            questionNumber,
            errorType: 'Missing Question Text',
            reason: 'Both Hindi (questionHi) and English (questionEn) question text are missing.'
          });
        } else if (!rawQHi || !rawQEn) {
          warnings.push({
            rowNumber,
            questionNumber,
            warningType: 'Single-Language Question',
            reason: !rawQHi ? 'Hindi question text was empty and mirrored from English.' : 'English question text was empty and mirrored from Hindi.'
          });
        }

        // 3. Check missing answer options (A, B, C, D)
        const missingOptLabels = [];
        ['A', 'B', 'C', 'D'].forEach((letter, i) => {
          if (!optsHi[i] && !optsEn[i]) missingOptLabels.push(`Option ${letter}`);
        });
        if (missingOptLabels.length > 0) {
          errors.push({
            rowNumber,
            questionNumber,
            errorType: 'Missing Answer Options',
            reason: `Missing required option(s): ${missingOptLabels.join(', ')}. All 4 options (A, B, C, D) must be provided.`
          });
        }

        // 4. Check missing or invalid correctIndex (For PDF without answer key, mark as Unverified warning instead of rejecting)
        if (!idxCheck.valid) {
          if (fileType === 'PDF' && idxCheck.missing) {
            warnings.push({
              rowNumber,
              questionNumber,
              warningType: 'Unverified — Answer Key Pending',
              reason: `Answer key not matched for Q${questionNumber}. Click Option A/B/C/D on the card or paste "${questionNumber}-A" in the Answer Key box.`
            });
          } else {
            errors.push({
              rowNumber,
              questionNumber,
              errorType: idxCheck.missing ? 'Missing Correct Answer' : 'Invalid correctIndex',
              reason: idxCheck.reason
            });
          }
        }

        // 5. Check missing explanations
        if (!rawExpHi && !rawExpEn) {
          warnings.push({
            rowNumber,
            questionNumber,
            warningType: 'Auto-Generated Explanation',
            reason: 'Explanation was empty in file; default answer explanation was generated automatically.'
          });
        } else if (!rawExpHi || !rawExpEn) {
          warnings.push({
            rowNumber,
            questionNumber,
            warningType: 'Partial Explanation',
            reason: !rawExpHi ? 'Hindi explanation is empty (will fallback to English explanation).' : 'English explanation is empty (will fallback to Hindi explanation).'
          });
        }

        // 6. Check Subject, Topic & Difficulty validity
        if (!normalizedDiff) {
          errors.push({
            rowNumber,
            questionNumber,
            errorType: 'Invalid Difficulty Level',
            reason: `Difficulty "${rawDiff}" is invalid. Allowed values: Easy, Moderate, Hard.`
          });
        }

        // If an explicit Subject or Topic was provided that is not in the Master, offer 1-click creation and auto-register on import
        if (effectiveSubject) {
          const knownExam = catalog.isKnownExamCode(effectiveExamCode);
          const knownSub = Boolean(catalog.findSubject(effectiveSubject));
          const knownTop = !effectiveTopic || catalog.isKnownTopic(effectiveSubject, effectiveTopic);
          if (!knownExam || !knownSub || !knownTop) {
            unknownTaxonomyItems.push({
              examCode: effectiveExamCode,
              subjectName: effectiveSubject,
              topicName: effectiveTopic || 'General Knowledge',
              subtopicName: effectiveSubtopic || ''
            });
            warnings.push({
              rowNumber,
              questionNumber,
              warningType: 'New Category / Subject / Topic',
              reason: `Category "${effectiveExamCode} → ${effectiveSubject}${effectiveTopic ? ' → ' + effectiveTopic : ''}" will be automatically added to the Category Master upon import.`
            });
          }
        }
      }

      // Check if question Needs Categorisation (e.g. PDF question with no matching Master category or CSV missing topic)
      const needsCategorisationFlag = Boolean(
        item.needsCategorisation === true ||
        !resolvedHierarchy.subjectId ||
        !resolvedHierarchy.topicId
      );

      if (needsCategorisationFlag && errors.length === 0) {
        warnings.push({
          rowNumber,
          questionNumber,
          warningType: 'Needs Categorisation',
          reason: 'Subject or Topic could not be deterministically matched in the Category Master. Marked as "Needs Categorisation" (will not be auto-published to tests until categorised & verified by Admin).'
        });
      }

      // 7. Duplicate Question Detection (Exact, Minor Text Difference, Permuted Options)
      let duplicateInfo = null;
      const allComparisonTargets = [...seenInBatch, ...existingPool];

      for (const target of allComparisonTargets) {
        const simHi = (qHi && target.questionHi) ? computeTextSimilarity(qHi, target.questionHi) : 0;
        const simEn = (qEn && target.questionEn) ? computeTextSimilarity(qEn, target.questionEn) : 0;
        const maxStemSim = Math.max(simHi, simEn);

        const normHiA = normalizeTextForComparison(qHi);
        const normHiB = normalizeTextForComparison(target.questionHi);
        const normEnA = normalizeTextForComparison(qEn);
        const normEnB = normalizeTextForComparison(target.questionEn);

        const isExactStem = (normHiA && normHiA === normHiB) || (normEnA && normEnA === normEnB);
        const optCompHi = computeOptionsOrderAgnosticSimilarity(optsHi, target.optionsHi);
        const optCompEn = computeOptionsOrderAgnosticSimilarity(optsEn, target.optionsEn);
        const maxOptSim = Math.max(optCompHi.score, optCompEn.score);
        const isPermuted = optCompHi.isPermuted || optCompEn.isPermuted;

        if (isExactStem && isPermuted) {
          duplicateInfo = {
            matchType: 'Different Option Ordering',
            similarityPct: 100,
            matchedQuestion: target,
            reason: `Identical question stem with different answer-option ordering (matches ${target.sourceLabel}).`
          };
          break;
        } else if (isExactStem) {
          duplicateInfo = {
            matchType: 'Exact Duplicate',
            similarityPct: 100,
            matchedQuestion: target,
            reason: `Exact text match (100% identical) with existing question in ${target.sourceLabel}.`
          };
          break;
        } else if (maxStemSim >= 0.72 && isPermuted && maxOptSim >= 0.85) {
          duplicateInfo = {
            matchType: 'Different Option Ordering',
            similarityPct: Math.round(maxStemSim * 100),
            matchedQuestion: target,
            reason: `Question has ${Math.round(maxStemSim * 100)}% text similarity and shuffled/reordered answer options (${target.sourceLabel}).`
          };
          break;
        } else if (maxStemSim >= 0.82) {
          duplicateInfo = {
            matchType: 'Minor Text Difference',
            similarityPct: Math.round(maxStemSim * 100),
            matchedQuestion: target,
            reason: `High text similarity (${Math.round(maxStemSim * 100)}%) with minor wording/punctuation differences (${target.sourceLabel}).`
          };
          break;
        }
      }

      if (qHi || qEn) {
        seenInBatch.push({
          id: `row_${rowNumber}`,
          examCode: resolvedHierarchy.examCode,
          examIds: resolvedHierarchy.examIds,
          sourceLabel: `Uploaded File Row #${rowNumber} (Q${questionNumber})`,
          questionHi: qHi,
          questionEn: qEn,
          optionsHi: optsHi,
          optionsEn: optsEn,
          correctOptionIndex: idxCheck.index || 0,
          explanationHi: expHi,
          explanationEn: expEn,
          subjectTag: resolvedHierarchy.subjectTag || effectiveSubject
        });
      }

      const parsedIdx = idxCheck;
      const isVerifiedFlag = !needsCategorisationFlag && parsedIdx.valid && item.adminVerified !== false && item.status !== 'unverified' && item.verificationStatus !== 'needs_categorisation';

      return {
        rowNumber,
        questionNumber,
        preferOneBased: Boolean(item.preferOneBased),
        id: item.questionId || item.id || '',
        questionId: item.questionId || item.id || '',
        questionHi: qHi,
        questionEn: qEn,
        optionsHi: optsHi,
        optionsEn: optsEn,
        rawCorrectIndex: parsedIdx.valid ? parsedIdx.index : item.rawCorrectIndex,
        correctOptionIndex: parsedIdx.valid ? parsedIdx.index : 0,
        answerKeyMatched: Boolean(item.answerKeyMatched || parsedIdx.valid),
        explanationHi: expHi,
        explanationEn: expEn,
        examCode: resolvedHierarchy.examCode,
        examIds: resolvedHierarchy.examIds,
        subjectId: resolvedHierarchy.subjectId,
        subjectTag: resolvedHierarchy.subjectTag || effectiveSubject || 'Needs Categorisation',
        topicId: resolvedHierarchy.topicId,
        topic: resolvedHierarchy.topic || effectiveTopic || 'Needs Categorisation',
        subtopicId: resolvedHierarchy.subtopicId,
        subtopic: resolvedHierarchy.subtopic || effectiveSubtopic || '',
        difficulty: normalizedDiff || 'Moderate',
        difficultyLevel: normalizedDiff || 'Moderate',
        questionType: item.questionType || 'MCQ',
        sourceExam: item.sourceExam || '',
        sourceYear: item.sourceYear || '',
        paperSetCode: item.paperSetCode || '',
        sourceDocument: item.sourceDocument || fileName || '',
        sourcePageNumber: item.sourcePageNumber || '',
        categorisationConfidence: item.categorisationConfidence != null ? item.categorisationConfidence : (needsCategorisationFlag ? 25 : 95),
        needsCategorisation: needsCategorisationFlag,
        verificationStatus: needsCategorisationFlag ? 'needs_categorisation' : (isVerifiedFlag ? 'verified' : 'unverified'),
        languageAvailability: detectLanguageAvailability(rawQHi, rawQEn),
        pyqTag: item.pyqTag || '',
        tags: mergedTags,
        status: needsCategorisationFlag ? 'needs_categorisation' : (isVerifiedFlag ? 'verified' : 'unverified'),
        adminVerified: isVerifiedFlag,
        importSource: item.importSource || (fileType === 'PDF' ? 'pdf_ocr_answer_key' : fileType.toLowerCase()),
        errors,
        warnings,
        duplicateInfo,
        duplicateResolution: item.duplicateResolution || 'merge_exams'
      };
    });

    const uniqueUnknownTaxonomy = [];
    const seenTaxKeys = new Set();
    unknownTaxonomyItems.forEach((ut) => {
      const k = `${ut.examCode}::${ut.subjectName}::${ut.topicName}`.toLowerCase();
      if (!seenTaxKeys.has(k)) {
        seenTaxKeys.add(k);
        uniqueUnknownTaxonomy.push(ut);
      }
    });

    return {
      fileName: fileName || 'questions_import.csv',
      fileType,
      targetTestId: targetTestId || 'central_bank',
      rawText,
      answerKeyText: effectiveAnswerKeyText,
      paperSetCode: effectivePaperSetCode,
      detectedAnswerKeyColumns: detectedAnswerKeyCols,
      selectedAnswerKeyColumn: effectiveAnswerKeySetCol,
      fileStructureErrors: structureErrors,
      records: validatedRecords,
      unknownTaxonomy: uniqueUnknownTaxonomy,
      batchDefaults: batchDefaults || {
        examCode: 'CGPSC',
        examIds: ['CGPSC'],
        subjectTag: 'Chhattisgarh General Knowledge',
        topic: 'History of Chhattisgarh',
        subtopic: '',
        difficulty: 'Moderate',
        tagsText: '',
        paperSetCode: effectivePaperSetCode,
        answerKeySetColumn: effectiveAnswerKeySetCol,
        overrideAll: false
      },
      previewFilter: (qbState.previewSession && qbState.previewSession.previewFilter) || 'all',
      validatedStageReached: Boolean(qbState.previewSession && qbState.previewSession.validatedStageReached)
    };
  }

  function downloadBlobFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  }

  function escapeCsvCell(val) {
    const str = String(val == null ? '' : val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function exportQuestionsToCsv(questionsArray, fileName) {
    const headers = [
      'questionHi', 'questionEn',
      'optA_Hi', 'optB_Hi', 'optC_Hi', 'optD_Hi',
      'optA_En', 'optB_En', 'optC_En', 'optD_En',
      'correctIndex', 'explanationHi', 'explanationEn', 'subjectTag',
      'questionId', 'examIds', 'subjectId', 'topicId', 'topic', 'subtopicId', 'subtopic',
      'difficultyLevel', 'questionType', 'sourceExam', 'sourceYear', 'paperSetCode',
      'sourceDocument', 'sourcePageNumber', 'verificationStatus'
    ];
    const lines = [headers.join(',')];
    (questionsArray || []).forEach((q) => {
      const optsHi = Array.isArray(q.optionsHi) ? q.optionsHi : [q.optA_Hi || '', q.optB_Hi || '', q.optC_Hi || '', q.optD_Hi || ''];
      const optsEn = Array.isArray(q.optionsEn) ? q.optionsEn : [q.optA_En || '', q.optB_En || '', q.optC_En || '', q.optD_En || ''];
      const examIdsArr = Array.isArray(q.examIds) && q.examIds.length > 0 ? q.examIds : [q.examCode || 'CGPSC'];
      const row = [
        q.questionHi || '',
        q.questionEn || '',
        optsHi[0] || '', optsHi[1] || '', optsHi[2] || '', optsHi[3] || '',
        optsEn[0] || '', optsEn[1] || '', optsEn[2] || '', optsEn[3] || '',
        q.correctOptionIndex != null ? q.correctOptionIndex : (q.correctIndex || 0),
        q.explanationHi || '',
        q.explanationEn || '',
        q.subjectTag || 'General Studies',
        q.questionId || q.id || '',
        examIdsArr.join(';'),
        q.subjectId || '',
        q.topicId || '',
        q.topic || '',
        q.subtopicId || '',
        q.subtopic || '',
        q.difficultyLevel || q.difficulty || 'Moderate',
        q.questionType || 'MCQ',
        q.sourceExam || '',
        q.sourceYear || '',
        q.paperSetCode || '',
        q.sourceDocument || '',
        q.sourcePageNumber || '',
        q.verificationStatus || q.status || 'verified'
      ];
      lines.push(row.map(escapeCsvCell).join(','));
    });
    downloadBlobFile('\uFEFF' + lines.join('\r\n'), fileName || `cgpedia-questions-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
  }

  function exportQuestionsToJson(questionsArray, fileName) {
    const payload = {
      exportedAtIso: new Date().toISOString(),
      totalQuestions: (questionsArray || []).length,
      questions: (questionsArray || []).map((q) => {
        const optsHi = Array.isArray(q.optionsHi) ? q.optionsHi : [q.optA_Hi || '', q.optB_Hi || '', q.optC_Hi || '', q.optD_Hi || ''];
        const optsEn = Array.isArray(q.optionsEn) ? q.optionsEn : [q.optA_En || '', q.optB_En || '', q.optC_En || '', q.optD_En || ''];
        const corrIdx = q.correctOptionIndex != null ? q.correctOptionIndex : (q.correctIndex || 0);
        const examIdsArr = Array.isArray(q.examIds) && q.examIds.length > 0 ? q.examIds : [q.examCode || 'CGPSC'];
        return {
          id: q.id || q.questionId,
          questionId: q.questionId || q.id,
          examCode: q.examCode || examIdsArr[0] || 'CGPSC',
          examIds: examIdsArr,
          subjectId: q.subjectId || '',
          subjectTag: q.subjectTag || 'General Studies',
          topicId: q.topicId || '',
          topic: q.topic || '',
          subtopicId: q.subtopicId || '',
          subtopic: q.subtopic || '',
          difficulty: q.difficulty || q.difficultyLevel || 'Moderate',
          difficultyLevel: q.difficultyLevel || q.difficulty || 'Moderate',
          questionType: q.questionType || 'MCQ',
          sourceExam: q.sourceExam || '',
          sourceYear: q.sourceYear || '',
          paperSetCode: q.paperSetCode || '',
          sourceDocument: q.sourceDocument || '',
          sourcePageNumber: q.sourcePageNumber || '',
          verificationStatus: q.verificationStatus || q.status || 'verified',
          languageAvailability: q.languageAvailability || detectLanguageAvailability(q.questionHi, q.questionEn),
          questionHi: q.questionHi || '',
          questionEn: q.questionEn || '',
          optA_Hi: optsHi[0] || '',
          optB_Hi: optsHi[1] || '',
          optC_Hi: optsHi[2] || '',
          optD_Hi: optsHi[3] || '',
          optA_En: optsEn[0] || '',
          optB_En: optsEn[1] || '',
          optC_En: optsEn[2] || '',
          optD_En: optsEn[3] || '',
          optionsHi: optsHi,
          optionsEn: optsEn,
          correctIndex: corrIdx,
          correctOptionIndex: corrIdx,
          explanationHi: q.explanationHi || '',
          explanationEn: q.explanationEn || '',
          pyqTag: q.pyqTag || '',
          tags: Array.isArray(q.tags) ? q.tags : [],
          status: q.status || 'verified',
          createdAt: q.createdAt || q.createdAtIso || '',
          updatedAt: q.updatedAt || q.updatedAtIso || ''
        };
      })
    };
    downloadBlobFile(JSON.stringify(payload, null, 2), fileName || `cgpedia-questions-${new Date().toISOString().slice(0, 10)}.json`, 'application/json;charset=utf-8');
  }

  function downloadImportReportCsv(report) {
    if (!report) return;
    const headers = [
      'RowNumber', 'QuestionNumber', 'OutcomeStatus', 'QuestionID',
      'ExamCategory', 'Subject', 'Topic', 'Difficulty',
      'IssueType', 'Details', 'QuestionHi', 'QuestionEn'
    ];
    const lines = [headers.join(',')];
    (report.detailedRows || []).forEach((r) => {
      lines.push([
        r.rowNumber,
        r.questionNumber,
        r.outcome,
        r.questionId || '-',
        r.examCode || '',
        r.subjectTag || '',
        r.topic || '',
        r.difficulty || '',
        r.issueType || 'None',
        r.details || '',
        r.questionHi || '',
        r.questionEn || ''
      ].map(escapeCsvCell).join(','));
    });
    downloadBlobFile(
      '\uFEFF' + lines.join('\r\n'),
      `cgpedia-import-report-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`,
      'text/csv;charset=utf-8'
    );
  }

  // Modal Helpers for Question Bank
  function openDuplicateReviewModal(rec, stateRef, onUpdated) {
    if (typeof stateRef === 'function' && !onUpdated) {
      onUpdated = stateRef;
      stateRef = null;
    }
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot || !rec || !rec.duplicateInfo) return;
    const existing = rec.duplicateInfo.matchedQuestion || {};
    const letters = ['A', 'B', 'C', 'D'];
    const incomingExams = Array.isArray(rec.examIds) && rec.examIds.length > 0 ? rec.examIds : [rec.examCode || 'CGPSC'];
    const existingExams = Array.isArray(existing.examIds) && existing.examIds.length > 0 ? existing.examIds : [existing.examCode || 'CGPSC'];

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:860px;max-height:90vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
            <div>
              <span class="badge badge-paid">⚠️ ${esc(rec.duplicateInfo.matchType)} (${rec.duplicateInfo.similarityPct}% Similarity)</span>
              <h2 style="font-size:1.1rem;font-weight:800;margin-top:4px;">🔍 Review Duplicate Question (Row #${rec.rowNumber} / Q${rec.questionNumber})</h2>
              <div style="font-size:0.78rem;color:var(--text-secondary);">${esc(rec.duplicateInfo.reason)}</div>
            </div>
            <button class="btn btn-outline btn-sm" id="closeDupReviewModalBtn">✕ Close</button>
          </div>

          <div class="grid-2" style="gap:14px;margin-bottom:14px;">
            <div class="card" style="margin-bottom:0;border:2px solid var(--warning);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:4px;">
                <span class="badge badge-paid">📥 INCOMING QUESTION (Row #${rec.rowNumber})</span>
                <span class="badge badge-exam">Exams: ${esc(incomingExams.join(', '))}</span>
                <span class="badge badge-review">${esc(rec.subjectTag)} → ${esc(rec.topic)}</span>
              </div>
              <div style="font-weight:800;font-size:0.9rem;margin-bottom:4px;">${esc(rec.questionHi)}</div>
              <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:10px;">${esc(rec.questionEn)}</div>
              <div style="display:grid;gap:6px;margin-bottom:8px;">
                ${[0, 1, 2, 3].map((i) => `
                  <div class="qb-option-pill ${rec.correctOptionIndex === i ? 'is-correct' : ''}">
                    <span><strong>${letters[i]}.</strong> ${esc(rec.optionsHi[i])} / ${esc(rec.optionsEn[i])}</span>
                    ${rec.correctOptionIndex === i ? '<span class="badge badge-free">✓ Correct</span>' : ''}
                  </div>
                `).join('')}
              </div>
              <div class="qb-explanation-box">
                <strong>व्याख्या / Explanation:</strong> ${esc(rec.explanationHi || rec.explanationEn || 'N/A')}
              </div>
            </div>

            <div class="card" style="margin-bottom:0;border:2px solid var(--secondary);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:4px;">
                <span class="badge badge-exam">🗄️ CANONICAL RECORD (${esc(existing.sourceLabel || 'Database')})</span>
                <span class="badge badge-draft">ID: ${esc(existing.id || '-')} • Exams: ${esc(existingExams.join(', '))}</span>
              </div>
              <div style="font-weight:800;font-size:0.9rem;margin-bottom:4px;">${esc(existing.questionHi)}</div>
              <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:10px;">${esc(existing.questionEn)}</div>
              <div style="display:grid;gap:6px;margin-bottom:8px;">
                ${[0, 1, 2, 3].map((i) => `
                  <div class="qb-option-pill ${(existing.correctOptionIndex || 0) === i ? 'is-correct' : ''}">
                    <span><strong>${letters[i]}.</strong> ${esc((existing.optionsHi || [])[i] || '')} / ${esc((existing.optionsEn || [])[i] || '')}</span>
                    ${(existing.correctOptionIndex || 0) === i ? '<span class="badge badge-free">✓ Correct</span>' : ''}
                  </div>
                `).join('')}
              </div>
              <div class="qb-explanation-box">
                <strong>व्याख्या / Explanation:</strong> ${esc(existing.explanationHi || existing.explanationEn || 'N/A')}
              </div>
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--border);">
            <div style="font-size:0.82rem;color:var(--text-secondary);">
              Current Decision: <strong>${rec.duplicateResolution === 'import_anyway' ? '✅ Import Separate Copy' : (rec.duplicateResolution === 'merge_exams' ? '🔗 Merge Exam Tags into Canonical Question' : '⏭️ Skip Duplicate')}</strong>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-outline" id="dupModalEditIncomingBtn">✏️ Edit Incoming Question</button>
              <button class="btn btn-primary" id="dupModalMergeExamsBtn" title="Keep 1 canonical question record and append Exam tags without duplicating">🔗 Merge Exam Tags into Canonical Question</button>
              <button class="btn btn-warning" id="dupModalSkipBtn">⏭️ Skip Duplicate</button>
              <button class="btn btn-success" id="dupModalImportAnywayBtn">✅ Import Separate Copy</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeDupReviewModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('dupModalMergeExamsBtn').onclick = () => {
      rec.duplicateResolution = 'merge_exams';
      modalRoot.innerHTML = '';
      if (onUpdated) onUpdated();
    };
    document.getElementById('dupModalSkipBtn').onclick = () => {
      rec.duplicateResolution = 'skip';
      modalRoot.innerHTML = '';
      if (onUpdated) onUpdated();
    };
    document.getElementById('dupModalImportAnywayBtn').onclick = () => {
      rec.duplicateResolution = 'import_anyway';
      modalRoot.innerHTML = '';
      if (onUpdated) onUpdated();
    };
    document.getElementById('dupModalEditIncomingBtn').onclick = () => {
      modalRoot.innerHTML = '';
      openQuestionFormModal({
        title: `✏️ Edit Preview Question (Row #${rec.rowNumber})`,
        question: rec,
        stateRef,
        isPreviewRow: true,
        onSave: (updatedFields) => {
          Object.assign(rec, updatedFields, {
            rawCorrectIndex: updatedFields.correctOptionIndex
          });
          if (onUpdated) onUpdated();
        }
      });
    };
  }

  function openQuestionPreviewModal(qObj, titleText, onConfirmSave) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot || !qObj) return;
    const letters = ['A', 'B', 'C', 'D'];
    const diffVal = qObj.difficultyLevel || qObj.difficulty || 'Moderate';
    const diffClass = diffVal === 'Easy' ? 'badge-diff-easy' : ((diffVal === 'Hard' || diffVal === 'Difficult') ? 'badge-diff-difficult' : 'badge-diff-moderate');
    const examBadges = Array.isArray(qObj.examIds) && qObj.examIds.length > 0 ? qObj.examIds : [qObj.examCode || 'CGPSC'];

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:720px;max-height:90vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;">
            <div>
              ${examBadges.map((ex) => `<span class="badge badge-exam" style="margin-right:4px;">${esc(ex)}</span>`).join('')}
              <span class="badge badge-review">${esc(qObj.subjectTag || 'General Studies')}</span>
              ${qObj.topic ? `<span class="badge badge-draft">Topic: ${esc(qObj.topic)}</span>` : ''}
              ${qObj.subtopic ? `<span class="badge badge-draft">Subtopic: ${esc(qObj.subtopic)}</span>` : ''}
              <span class="badge ${diffClass}">${esc(diffVal)}</span>
              <h2 style="font-size:1.08rem;font-weight:800;margin-top:4px;">${esc(titleText || '👁️ Question Preview')}</h2>
            </div>
            <button class="btn btn-outline btn-sm" id="closeQPreviewModalBtn">✕ Close</button>
          </div>

          <div class="qb-preview-card status-valid" style="margin-bottom:12px;">
            <div style="font-weight:800;font-size:0.95rem;margin-bottom:4px;">🇮🇳 हिन्दी प्रश्न: ${esc(qObj.questionHi)}</div>
            <div style="font-weight:700;font-size:0.88rem;color:var(--text-secondary);margin-bottom:10px;">🇬🇧 English Question: ${esc(qObj.questionEn)}</div>

            <div class="qb-options-grid">
              ${[0, 1, 2, 3].map((i) => `
                <div class="qb-option-pill ${Number(qObj.correctOptionIndex) === i ? 'is-correct' : ''}">
                  <div>
                    <div><strong>Option ${letters[i]} (Hi):</strong> ${esc((qObj.optionsHi || [])[i] || '')}</div>
                    <div style="font-size:0.75rem;color:var(--text-secondary);"><strong>Option ${letters[i]} (En):</strong> ${esc((qObj.optionsEn || [])[i] || '')}</div>
                  </div>
                  ${Number(qObj.correctOptionIndex) === i ? '<span class="badge badge-free">✓ Correct Answer</span>' : ''}
                </div>
              `).join('')}
            </div>

            <div class="qb-explanation-box">
              <div><strong>व्याख्या (Hindi):</strong> ${esc(qObj.explanationHi || '-')}</div>
              <div style="margin-top:4px;"><strong>Explanation (English):</strong> ${esc(qObj.explanationEn || '-')}</div>
            </div>

            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;font-size:0.74rem;color:var(--text-muted);">
              <span>Hierarchy IDs: <strong>${esc(qObj.subjectId || '-')} → ${esc(qObj.topicId || '-')} → ${esc(qObj.subtopicId || '-')}</strong></span>
              <span>• Verification: <strong>${esc(qObj.verificationStatus || qObj.status || 'verified')}</strong></span>
              ${qObj.sourceExam || qObj.sourceYear ? `<span>• Source: <strong>${esc(qObj.sourceExam || '')} ${esc(qObj.sourceYear || '')}</strong></span>` : ''}
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-outline" id="cancelQPreviewModalBtn">Back to Form</button>
            ${typeof onConfirmSave === 'function' ? `<button class="btn btn-success" id="confirmSaveFromPreviewBtn">💾 Confirm &amp; Save Question</button>` : ''}
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeQPreviewModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('cancelQPreviewModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    const confirmBtn = document.getElementById('confirmSaveFromPreviewBtn');
    if (confirmBtn && typeof onConfirmSave === 'function') {
      confirmBtn.onclick = () => {
        modalRoot.innerHTML = '';
        onConfirmSave();
      };
    }
  }

  function openQuestionFormModal({ title, question, stateRef, onSave }) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot || !question) return;
    const catalog = getTaxonomyCatalog(stateRef);
    const optsHi = Array.isArray(question.optionsHi) ? question.optionsHi : [question.optA_Hi || '', question.optB_Hi || '', question.optC_Hi || '', question.optD_Hi || ''];
    const optsEn = Array.isArray(question.optionsEn) ? question.optionsEn : [question.optA_En || '', question.optB_En || '', question.optC_En || '', question.optD_En || ''];
    const tagsStr = Array.isArray(question.tags) ? question.tags.join(', ') : (question.tags || '');
    const currentExamIds = Array.isArray(question.examIds) && question.examIds.length > 0
      ? question.examIds
      : [question.examCode || 'CGPSC'];
    const currentDiff = normalizeDifficultyValue(question.difficultyLevel || question.difficulty) || 'Moderate';
    const currentVerStatus = question.verificationStatus || question.status || 'verified';

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:820px;max-height:92vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h2 style="font-size:1.08rem;font-weight:800;">${esc(title || '✏️ Edit Question & Hierarchical Categorisation')}</h2>
            <button class="btn btn-outline btn-sm" id="closeEditQModalBtn">✕ Cancel</button>
          </div>

          <div id="editQValidationErrorBanner" style="display:none;padding:10px 12px;border-radius:8px;background:var(--danger-soft);color:var(--danger);font-size:0.8rem;font-weight:700;margin-bottom:10px;"></div>

          <div style="padding:10px;border-radius:8px;background:var(--surface-alt);border:1px solid var(--border);margin-bottom:10px;">
            <div style="font-size:0.76rem;font-weight:800;color:var(--text-secondary);margin-bottom:6px;">
              🗂️ Multi-Exam Association (Assign 1 canonical question to multiple exams without duplication)
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;" id="eqExamMultiCheckboxes">
              ${catalog.examCategories.map((ex) => {
                const exCode = ex.examId || ex.code;
                const isChecked = currentExamIds.some((id) => String(id).toUpperCase() === String(exCode).toUpperCase());
                return `
                  <label style="display:inline-flex;align-items:center;gap:4px;font-size:0.75rem;padding:3px 8px;border-radius:6px;background:var(--surface);border:1px solid var(--border);cursor:pointer;">
                    <input type="checkbox" data-eq-exam-chk="${esc(exCode)}" ${isChecked ? 'checked' : ''} />
                    <span><strong>${esc(exCode)}</strong> (${esc(ex.nameEn)})</span>
                  </label>
                `;
              }).join('')}
            </div>
            <div class="grid-4" style="gap:8px;">
              <div>
                <label class="form-label">Primary Exam</label>
                <select class="form-select" id="eqExamCode">
                  ${catalog.examCategories.map((ex) => `<option value="${esc(ex.code)}" ${(question.examCode || currentExamIds[0] || 'CGPSC') === ex.code ? 'selected' : ''}>${esc(ex.code)} — ${esc(ex.nameEn)}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="form-label">Subject *</label>
                <input class="form-input" id="eqSubjectTag" list="eqSubjectList" value="${esc(question.subjectTag || 'Chhattisgarh General Knowledge')}" placeholder="Subject..." />
                <datalist id="eqSubjectList">
                  ${catalog.subjects.map((s) => `<option value="${esc(s.titleEn)}">${esc(s.titleHi)}</option>`).join('')}
                </datalist>
              </div>
              <div>
                <label class="form-label">Topic *</label>
                <input class="form-input" id="eqTopic" list="eqTopicList" value="${esc(question.topic || 'History of Chhattisgarh')}" placeholder="Topic..." />
                <datalist id="eqTopicList">
                  ${catalog.allTopics.map((t) => `<option value="${esc(t)}"></option>`).join('')}
                </datalist>
              </div>
              <div>
                <label class="form-label">Subtopic</label>
                <input class="form-input" id="eqSubtopic" list="eqSubtopicList" value="${esc(question.subtopic || '')}" placeholder="Subtopic..." />
                <datalist id="eqSubtopicList">
                  ${(catalog.allSubtopics || []).map((st) => `<option value="${esc(st)}"></option>`).join('')}
                </datalist>
              </div>
            </div>
          </div>

          <div class="grid-4" style="gap:8px;margin-bottom:10px;">
            <div>
              <label class="form-label">Difficulty Level</label>
              <select class="form-select" id="eqDifficulty">
                <option value="Easy" ${currentDiff === 'Easy' ? 'selected' : ''}>Easy</option>
                <option value="Moderate" ${currentDiff === 'Moderate' ? 'selected' : ''}>Moderate</option>
                <option value="Hard" ${currentDiff === 'Hard' ? 'selected' : ''}>Hard</option>
              </select>
            </div>
            <div>
              <label class="form-label">Verification Status</label>
              <select class="form-select" id="eqStatus">
                <option value="verified" ${(currentVerStatus === 'verified' || currentVerStatus === 'active') ? 'selected' : ''}>Verified (Eligible)</option>
                <option value="needs_categorisation" ${currentVerStatus === 'needs_categorisation' ? 'selected' : ''}>Needs Categorisation</option>
                <option value="unverified" ${currentVerStatus === 'unverified' ? 'selected' : ''}>Unverified</option>
                <option value="draft" ${currentVerStatus === 'draft' ? 'selected' : ''}>Draft</option>
                <option value="flagged" ${currentVerStatus === 'flagged' ? 'selected' : ''}>Flagged</option>
              </select>
            </div>
            <div>
              <label class="form-label">Source Exam / Year / Set</label>
              <input class="form-input" id="eqSourceMeta" value="${esc([question.sourceExam, question.sourceYear, question.paperSetCode].filter(Boolean).join(' | '))}" placeholder="e.g. CGPSC Pre | 2024 | Set A" />
            </div>
            <div>
              <label class="form-label">Tags (comma-separated)</label>
              <input class="form-input" id="eqTags" value="${esc(tagsStr)}" placeholder="PYQ, Prelim, Imp" />
            </div>
          </div>

          <div class="grid-2" style="gap:8px;margin-bottom:8px;">
            <div>
              <label class="form-label">Question Text (Hindi / हिन्दी प्रश्न) *</label>
              <textarea class="form-textarea" id="eqStemHi" rows="2">${esc(question.questionHi || '')}</textarea>
            </div>
            <div>
              <label class="form-label">Question Text (English) *</label>
              <textarea class="form-textarea" id="eqStemEn" rows="2">${esc(question.questionEn || '')}</textarea>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
            <input class="form-input" id="eqOpt0Hi" value="${esc(optsHi[0] || '')}" placeholder="विकल्प A (Hindi) *" />
            <input class="form-input" id="eqOpt0En" value="${esc(optsEn[0] || '')}" placeholder="Option A (English) *" />
            <input class="form-input" id="eqOpt1Hi" value="${esc(optsHi[1] || '')}" placeholder="विकल्प B (Hindi) *" />
            <input class="form-input" id="eqOpt1En" value="${esc(optsEn[1] || '')}" placeholder="Option B (English) *" />
            <input class="form-input" id="eqOpt2Hi" value="${esc(optsHi[2] || '')}" placeholder="विकल्प C (Hindi) *" />
            <input class="form-input" id="eqOpt2En" value="${esc(optsEn[2] || '')}" placeholder="Option C (English) *" />
            <input class="form-input" id="eqOpt3Hi" value="${esc(optsHi[3] || '')}" placeholder="विकल्प D (Hindi) *" />
            <input class="form-input" id="eqOpt3En" value="${esc(optsEn[3] || '')}" placeholder="Option D (English) *" />
          </div>

          <div class="grid-3" style="gap:8px;margin-bottom:12px;">
            <div>
              <label class="form-label">Correct Answer (0–3) *</label>
              <select class="form-select" id="eqCorrectIdx">
                <option value="0" ${Number(question.correctOptionIndex ?? question.correctIndex ?? 0) === 0 ? 'selected' : ''}>Option A (0)</option>
                <option value="1" ${Number(question.correctOptionIndex ?? question.correctIndex ?? 0) === 1 ? 'selected' : ''}>Option B (1)</option>
                <option value="2" ${Number(question.correctOptionIndex ?? question.correctIndex ?? 0) === 2 ? 'selected' : ''}>Option C (2)</option>
                <option value="3" ${Number(question.correctOptionIndex ?? question.correctIndex ?? 0) === 3 ? 'selected' : ''}>Option D (3)</option>
              </select>
            </div>
            <div>
              <label class="form-label">Hindi Explanation (व्याख्या) *</label>
              <input class="form-input" id="eqExpHi" value="${esc(question.explanationHi || '')}" placeholder="हिन्दी व्याख्या..." />
            </div>
            <div>
              <label class="form-label">English Explanation *</label>
              <input class="form-input" id="eqExpEn" value="${esc(question.explanationEn || '')}" placeholder="English explanation..." />
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:8px;">
            <button class="btn btn-outline" id="cancelEditQModalBtn">Cancel</button>
            <button class="btn btn-primary" id="saveEditQModalBtn">💾 Validate &amp; Save Changes</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeEditQModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('cancelEditQModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('saveEditQModalBtn').onclick = () => {
      const rawQHi = document.getElementById('eqStemHi').value.trim();
      const rawQEn = document.getElementById('eqStemEn').value.trim();
      const qHi = rawQHi || rawQEn;
      const qEn = rawQEn || rawQHi;

      const rawOptsHi = [
        document.getElementById('eqOpt0Hi').value.trim(),
        document.getElementById('eqOpt1Hi').value.trim(),
        document.getElementById('eqOpt2Hi').value.trim(),
        document.getElementById('eqOpt3Hi').value.trim()
      ];
      const rawOptsEn = [
        document.getElementById('eqOpt0En').value.trim(),
        document.getElementById('eqOpt1En').value.trim(),
        document.getElementById('eqOpt2En').value.trim(),
        document.getElementById('eqOpt3En').value.trim()
      ];
      const newOptsHi = [0, 1, 2, 3].map((i) => rawOptsHi[i] || rawOptsEn[i] || '');
      const newOptsEn = [0, 1, 2, 3].map((i) => rawOptsEn[i] || rawOptsHi[i] || '');

      const corrIdx = Number(document.getElementById('eqCorrectIdx').value || 0);
      const corrLetter = ['A', 'B', 'C', 'D'][corrIdx] || 'A';
      const rawExpHi = document.getElementById('eqExpHi').value.trim();
      const rawExpEn = document.getElementById('eqExpEn').value.trim();
      const expHi = rawExpHi || rawExpEn || `सही उत्तर विकल्प ${corrLetter} है।`;
      const expEn = rawExpEn || rawExpHi || `Correct answer is Option ${corrLetter}.`;

      const subjectTag = document.getElementById('eqSubjectTag').value.trim();
      const topic = document.getElementById('eqTopic').value.trim();
      const subtopic = document.getElementById('eqSubtopic').value.trim();
      const errBanner = document.getElementById('editQValidationErrorBanner');

      const errs = [];
      if (!qHi && !qEn) errs.push('Question text (Hindi or English) is required.');
      if (newOptsHi.some((o) => !o)) errs.push('All 4 options (A–D) are required (in Hindi or English).');
      if (!subjectTag || !topic) errs.push('Subject and Topic are required.');

      if (errs.length > 0) {
        errBanner.style.display = 'block';
        errBanner.textContent = '⚠️ ' + errs.join(' ');
        return;
      }

      const primaryExam = document.getElementById('eqExamCode').value || 'CGPSC';
      const checkedExams = [];
      modalRoot.querySelectorAll('[data-eq-exam-chk]').forEach((chk) => {
        if (chk.checked) checkedExams.push(chk.getAttribute('data-eq-exam-chk'));
      });
      const finalExamIds = Array.from(new Set([primaryExam, ...checkedExams])).filter(Boolean);

      const resolved = resolveCanonicalQuestionHierarchy(
        { examCode: primaryExam, examIds: finalExamIds, subjectTag, topic, subtopic },
        catalog
      );

      const sourceParts = document.getElementById('eqSourceMeta').value.split('|').map((s) => s.trim());
      const tagsArr = document.getElementById('eqTags').value.split(',').map((t) => t.trim()).filter(Boolean);
      const diffVal = normalizeDifficultyValue(document.getElementById('eqDifficulty').value) || 'Moderate';
      const statusVal = document.getElementById('eqStatus').value || 'verified';
      const nowIso = new Date().toISOString();

      const updated = {
        examCode: resolved.examCode,
        examIds: resolved.examIds,
        subjectId: resolved.subjectId,
        subjectTag: resolved.subjectTag || subjectTag,
        topicId: resolved.topicId,
        topic: resolved.topic || topic,
        subtopicId: resolved.subtopicId,
        subtopic: resolved.subtopic || subtopic,
        difficulty: diffVal,
        difficultyLevel: diffVal,
        status: statusVal,
        verificationStatus: statusVal,
        needsCategorisation: statusVal === 'needs_categorisation',
        languageAvailability: detectLanguageAvailability(rawQHi, rawQEn),
        sourceExam: sourceParts[0] || question.sourceExam || '',
        sourceYear: sourceParts[1] || question.sourceYear || '',
        paperSetCode: sourceParts[2] || question.paperSetCode || '',
        tags: tagsArr,
        pyqTag: tagsArr[0] || question.pyqTag || '',
        questionHi: qHi,
        questionEn: qEn,
        optA_Hi: newOptsHi[0],
        optB_Hi: newOptsHi[1],
        optC_Hi: newOptsHi[2],
        optD_Hi: newOptsHi[3],
        optA_En: newOptsEn[0],
        optB_En: newOptsEn[1],
        optC_En: newOptsEn[2],
        optD_En: newOptsEn[3],
        optionsHi: newOptsHi,
        optionsEn: newOptsEn,
        correctIndex: corrIdx,
        correctOptionIndex: corrIdx,
        explanationHi: expHi,
        explanationEn: expEn,
        updatedAt: nowIso,
        updatedAtIso: nowIso
      };

      modalRoot.innerHTML = '';
      if (onSave) onSave(updated);
    };
  }

  function openConfirmationDialog({ title, message, confirmLabel, isDanger, onConfirm }) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;
    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:440px;">
          <h2 style="font-size:1.08rem;font-weight:800;margin-bottom:8px;">${esc(title || 'Confirm Action')}</h2>
          <p style="font-size:0.86rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.5;">${esc(message)}</p>
          <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button class="btn btn-outline" id="confirmDialogCancelBtn">Cancel</button>
            <button class="btn ${isDanger ? 'btn-danger' : 'btn-primary'}" id="confirmDialogProceedBtn">${esc(confirmLabel || 'Confirm')}</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('confirmDialogCancelBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('confirmDialogProceedBtn').onclick = () => {
      modalRoot.innerHTML = '';
      if (typeof onConfirm === 'function') onConfirm();
    };
  }

  function openBulkEditModal(selectedCount, state, api, onApplyBulkChanges) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;
    const catalog = getTaxonomyCatalog(state);

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:620px;max-height:90vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h2 style="font-size:1.05rem;font-weight:800;">✏️ Bulk Categorise &amp; Edit ${selectedCount} Selected Question(s)</h2>
            <button class="btn btn-outline btn-sm" id="closeBulkEditModalBtn">✕</button>
          </div>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:12px;">
            Leave any field set to <em>"-- Keep Existing --"</em> (or blank) to preserve each question's current value. You can also append multiple Exam associations without duplicating questions.
          </p>

          <div style="padding:10px;border-radius:8px;background:var(--surface-alt);border:1px solid var(--border);margin-bottom:12px;">
            <div style="font-size:0.75rem;font-weight:800;color:var(--text-secondary);margin-bottom:6px;">
              🎯 Multi-Exam Assignment (Check exams to associate with all selected questions)
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
              ${catalog.examCategories.map((ex) => {
                const exCode = ex.examId || ex.code;
                return `
                  <label style="display:inline-flex;align-items:center;gap:4px;font-size:0.74rem;padding:3px 7px;border-radius:6px;background:var(--surface);border:1px solid var(--border);cursor:pointer;">
                    <input type="checkbox" data-bulk-exam-chk="${esc(exCode)}" />
                    <span>${esc(exCode)}</span>
                  </label>
                `;
              }).join('')}
            </div>
            <label style="display:inline-flex;align-items:center;gap:6px;font-size:0.74rem;cursor:pointer;">
              <input type="checkbox" id="bulkReplaceExamIdsChk" />
              <span>Replace existing Exam tags instead of appending to them</span>
            </label>
          </div>

          <div class="grid-2" style="gap:10px;margin-bottom:12px;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Primary Exam Category</label>
              <select class="form-select" id="bulkEditExamCode">
                <option value="">-- Keep Existing --</option>
                ${catalog.examCategories.map((ex) => `<option value="${esc(ex.code)}">${esc(ex.code)} (${esc(ex.nameEn)})</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Difficulty Level</label>
              <select class="form-select" id="bulkEditDifficulty">
                <option value="">-- Keep Existing --</option>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Subject (Subject Master)</label>
              <input class="form-input" id="bulkEditSubject" list="bulkSubjectDatalist" placeholder="Leave blank to keep existing..." />
              <datalist id="bulkSubjectDatalist">
                ${catalog.subjects.map((s) => `<option value="${esc(s.titleEn)}">${esc(s.titleHi)}</option>`).join('')}
              </datalist>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Topic (Topic Master)</label>
              <input class="form-input" id="bulkEditTopic" list="bulkTopicDatalist" placeholder="Leave blank to keep existing..." />
              <datalist id="bulkTopicDatalist">
                ${catalog.allTopics.map((t) => `<option value="${esc(t)}"></option>`).join('')}
              </datalist>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Subtopic (Subtopic Master)</label>
              <input class="form-input" id="bulkEditSubtopic" list="bulkSubtopicDatalist" placeholder="Leave blank to keep existing..." />
              <datalist id="bulkSubtopicDatalist">
                ${(catalog.allSubtopics || []).map((st) => `<option value="${esc(st)}"></option>`).join('')}
              </datalist>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Verification Status</label>
              <select class="form-select" id="bulkEditStatus">
                <option value="">-- Keep Existing --</option>
                <option value="verified">Verified (Eligible for Auto-Test)</option>
                <option value="needs_categorisation">Needs Categorisation</option>
                <option value="unverified">Unverified</option>
                <option value="draft">Draft</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Add / Update Tags (comma-separated)</label>
            <input class="form-input" id="bulkEditTags" placeholder="e.g., CGPSC 2026, High Yield" />
          </div>

          <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button class="btn btn-outline" id="cancelBulkEditModalBtn">Cancel</button>
            <button class="btn btn-primary" id="applyBulkEditModalBtn">💾 Apply Bulk Categorisation (${selectedCount})</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeBulkEditModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('cancelBulkEditModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('applyBulkEditModalBtn').onclick = () => {
      const checkedExams = [];
      modalRoot.querySelectorAll('[data-bulk-exam-chk]').forEach((chk) => {
        if (chk.checked) checkedExams.push(chk.getAttribute('data-bulk-exam-chk'));
      });
      const changes = {
        examCode: document.getElementById('bulkEditExamCode').value.trim(),
        examIds: checkedExams,
        replaceExamIds: Boolean(document.getElementById('bulkReplaceExamIdsChk').checked),
        difficulty: document.getElementById('bulkEditDifficulty').value.trim(),
        subjectTag: document.getElementById('bulkEditSubject').value.trim(),
        topic: document.getElementById('bulkEditTopic').value.trim(),
        subtopic: document.getElementById('bulkEditSubtopic').value.trim(),
        status: document.getElementById('bulkEditStatus').value.trim(),
        tagsText: document.getElementById('bulkEditTags').value.trim()
      };
      modalRoot.innerHTML = '';
      if (onApplyBulkChanges) onApplyBulkChanges(changes);
    };
  }

  function openAssignToTestModal(selectedQuestions, state, api, onAssigned) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;
    const tests = state.tests || [];

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:500px;">
          <h2 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">📝 Assign ${selectedQuestions.length} Reusable Question(s) to Test</h2>
          <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">
            Selected questions from the Central Question Bank will be linked to the chosen Test without duplicating records in the Central Question Bank.
          </p>
          ${tests.length === 0 ? `
            <p style="font-size:0.84rem;color:var(--danger);margin-bottom:12px;">No tests exist yet. Create a test in the Test Builder first.</p>
          ` : `
            <div class="form-group">
              <label class="form-label">Select Target Test</label>
              <select class="form-select" id="assignModalTargetTestSelect">
                ${tests.map((t) => `<option value="${esc(t.id)}">[${esc(t.examCode || 'CGPSC')}] ${esc(t.titleHi)} (${(t.questions || []).length} Qs • ${t.status.toUpperCase()})</option>`).join('')}
              </select>
            </div>
          `}
          <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button class="btn btn-outline" id="cancelAssignTestModalBtn">Cancel</button>
            ${tests.length > 0 ? `<button class="btn btn-primary" id="confirmAssignTestModalBtn">🔗 Link to Selected Test</button>` : ''}
          </div>
        </div>
      </div>
    `;

    document.getElementById('cancelAssignTestModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    const confirmBtn = document.getElementById('confirmAssignTestModalBtn');
    if (confirmBtn) {
      confirmBtn.onclick = () => {
        const targetId = document.getElementById('assignModalTargetTestSelect').value;
        const targetTest = tests.find((t) => t.id === targetId);
        modalRoot.innerHTML = '';
        if (!targetTest) return;
        targetTest.questions = targetTest.questions || [];
        const existingRefIds = new Set(targetTest.questions.map((q) => q.centralQuestionId || q.id));
        let linkedCount = 0;
        const updatedCentral = [];

        selectedQuestions.forEach((cq) => {
          if (!existingRefIds.has(cq.id)) {
            targetTest.questions.push(Object.assign({}, cq, {
              id: `${targetTest.id}_ref_${cq.id}`,
              centralQuestionId: cq.id
            }));
            cq.linkedTestIds = Array.from(new Set([...(cq.linkedTestIds || []), targetTest.id]));
            updatedCentral.push(cq);
            linkedCount += 1;
          }
        });

        api.saveState();
        if (window.CGpediaCloud) {
          window.CGpediaCloud.saveCloudDoc('tests', targetTest.id, targetTest);
          if (updatedCentral.length > 0 && window.CGpediaCloud.batchSaveCloudDocs) {
            window.CGpediaCloud.batchSaveCloudDocs('question_bank', updatedCentral);
          }
        }
        api.toast(`✅ Linked ${linkedCount} question(s) to "${targetTest.titleHi}" (${selectedQuestions.length - linkedCount} already present).`);
        if (onAssigned) onAssigned();
      };
    }
  }

  function renderQuestionBankManagement(bodyEl, rootEl, state, api) {
    state.questionBank = state.questionBank || [];
    // Automatically run safe backward-compatible migration if legacy records exist
    if (state.questionBank.some((q) => !q.questionId || !Array.isArray(q.examIds))) {
      migrateExistingQuestionBankRecords(state, api, { skipCloudSync: true });
    }
    const catalog = getTaxonomyCatalog(state);
    const sd = qbState.singleDraft;
    const ps = qbState.previewSession;
    const rep = qbState.lastImportReport;
    const migRep = qbState.migrationReport || state.migrationState;

    // Compute Preview KPIs if a preview session is active
    let previewStats = null;
    if (ps) {
      const total = ps.records.length;
      let validReady = 0;
      let verifiedReady = 0;
      let unverifiedCount = 0;
      let needsCatCount = 0;
      let errorCount = ps.fileStructureErrors.length;
      let rowErrorCount = 0;
      let dupCount = 0;
      let warnCount = 0;

      ps.records.forEach((r) => {
        const hasErr = r.errors && r.errors.length > 0;
        const hasDup = Boolean(r.duplicateInfo);
        const hasWarn = r.warnings && r.warnings.length > 0;
        const isNeedsCat = Boolean(r.needsCategorisation) || r.verificationStatus === 'needs_categorisation' || r.status === 'needs_categorisation';
        const isVer = r.adminVerified !== false && r.status !== 'unverified' && !isNeedsCat;
        if (hasErr) {
          rowErrorCount += 1;
          errorCount += r.errors.length;
        }
        if (hasDup) dupCount += 1;
        if (hasWarn) warnCount += 1;
        if (isNeedsCat) needsCatCount += 1;
        if (!isVer) unverifiedCount += 1;
        if (!hasErr && (!hasDup || r.duplicateResolution === 'import_anyway' || r.duplicateResolution === 'merge_exams')) {
          validReady += 1;
          if (isVer) verifiedReady += 1;
        }
      });

      previewStats = {
        total,
        validReady,
        verifiedReady,
        unverifiedCount,
        needsCatCount,
        rowErrorCount,
        totalErrorMessages: errorCount,
        dupCount,
        warnCount
      };
    }

    // Filter Central Question Bank (excluding deleted questions)
    const flt = qbState.filters;
    const searchLow = String(flt.search || '').trim().toLowerCase();
    const activeBankPool = (state.questionBank || []).filter(
      (q) => !q.isDeleted && !q.deleted && String(q.status || '').toLowerCase() !== 'deleted'
    );

    // Compute Question Counts by Exam, Subject, and Topic
    const countByExam = {};
    const countBySubject = {};
    const countByTopic = {};
    let totalNeedsCategorisation = 0;

    activeBankPool.forEach((q) => {
      const qExams = Array.isArray(q.examIds) && q.examIds.length > 0 ? q.examIds : [q.examCode || 'CGPSC'];
      qExams.forEach((ex) => {
        const exKey = String(ex || 'CGPSC').toUpperCase();
        countByExam[exKey] = (countByExam[exKey] || 0) + 1;
      });
      const sKey = q.subjectTag || 'General Studies';
      countBySubject[sKey] = (countBySubject[sKey] || 0) + 1;
      const tKey = q.topic || 'General Knowledge';
      countByTopic[tKey] = (countByTopic[tKey] || 0) + 1;
      if (q.needsCategorisation || q.verificationStatus === 'needs_categorisation' || q.status === 'needs_categorisation') {
        totalNeedsCategorisation += 1;
      }
    });

    const filteredBank = activeBankPool.filter((q) => {
      const qExams = Array.isArray(q.examIds) && q.examIds.length > 0
        ? q.examIds.map((e) => String(e).toUpperCase())
        : [String(q.examCode || 'CGPSC').toUpperCase()];
      const qSub = q.subjectTag || 'General Studies';
      const qSubId = q.subjectId || '';
      const qTopic = q.topic || 'General Knowledge';
      const qTopicId = q.topicId || '';
      const qSubtopic = q.subtopic || '';
      const qSubtopicId = q.subtopicId || '';
      const qDiff = normalizeDifficultyValue(q.difficultyLevel || q.difficulty) || 'Moderate';
      const qLang = q.languageAvailability || detectLanguageAvailability(q.questionHi, q.questionEn);
      const qStatus = q.verificationStatus || q.status || 'verified';

      if (flt.examCode !== 'ALL') {
        const targetEx = flt.examCode.toUpperCase();
        const normTarget = targetEx.replace(/[\s_-]+/g, '');
        const matchEx = qExams.some((ex) => ex === targetEx || ex.replace(/[\s_-]+/g, '') === normTarget);
        if (!matchEx) return false;
      }
      if (flt.subject !== 'ALL') {
        const fSubLow = flt.subject.toLowerCase();
        if (qSub.toLowerCase() !== fSubLow && qSubId.toLowerCase() !== fSubLow) return false;
      }
      if (flt.topic !== 'ALL') {
        const fTopLow = flt.topic.toLowerCase();
        if (qTopic.toLowerCase() !== fTopLow && qTopicId.toLowerCase() !== fTopLow) return false;
      }
      if (flt.subtopic && flt.subtopic !== 'ALL') {
        const fSubtopLow = flt.subtopic.toLowerCase();
        if (qSubtopic.toLowerCase() !== fSubtopLow && qSubtopicId.toLowerCase() !== fSubtopLow) return false;
      }
      if (flt.difficulty !== 'ALL') {
        const normFltDiff = normalizeDifficultyValue(flt.difficulty) || flt.difficulty;
        if (qDiff !== normFltDiff) return false;
      }
      if (flt.language !== 'ALL' && qLang !== flt.language) return false;
      if (flt.status !== 'ALL') {
        if (flt.status === 'needs_categorisation') {
          if (!q.needsCategorisation && qStatus !== 'needs_categorisation') return false;
        } else if (qStatus !== flt.status && (q.status || '') !== flt.status) {
          return false;
        }
      }

      if (searchLow) {
        const hay = [
          q.id, q.questionId, q.questionHi, q.questionEn, q.subjectTag, q.subjectId,
          q.topic, q.topicId, q.subtopic, q.subtopicId, (q.examIds || []).join(' '),
          q.pyqTag, (q.tags || []).join(' '), (q.optionsHi || []).join(' '),
          (q.optionsEn || []).join(' '), q.explanationHi, q.explanationEn
        ].join(' ').toLowerCase();
        if (!hay.includes(searchLow)) return false;
      }
      return true;
    });

    // Gather distinct subjects, topics & subtopics for cascading filter dropdowns
    const repoSubjects = Array.from(new Set([
      ...catalog.subjects.map((s) => s.titleEn),
      ...activeBankPool.map((q) => q.subjectTag || 'General Studies')
    ])).filter(Boolean);

    const matchedFilterSubObj = flt.subject !== 'ALL' ? catalog.findSubject(flt.subject) : null;
    const repoTopics = Array.from(new Set([
      ...(matchedFilterSubObj
        ? catalog.getTopicsForSubject(matchedFilterSubObj.subjectId).map((t) => t.titleEn)
        : catalog.allTopics),
      ...activeBankPool
        .filter((q) => flt.subject === 'ALL' || (q.subjectTag || '').toLowerCase() === flt.subject.toLowerCase())
        .map((q) => q.topic || '')
        .filter(Boolean)
    ])).filter(Boolean);

    const matchedFilterTopObj = flt.topic !== 'ALL' ? catalog.findTopic(matchedFilterSubObj ? matchedFilterSubObj.subjectId : '', flt.topic) : null;
    const repoSubtopics = Array.from(new Set([
      ...(matchedFilterTopObj
        ? catalog.getSubtopicsForTopic(matchedFilterTopObj.topicId).map((st) => st.titleEn)
        : (catalog.allSubtopics || [])),
      ...activeBankPool
        .filter((q) => (flt.subject === 'ALL' || (q.subjectTag || '').toLowerCase() === flt.subject.toLowerCase()) &&
                       (flt.topic === 'ALL' || (q.topic || '').toLowerCase() === flt.topic.toLowerCase()))
        .map((q) => q.subtopic || '')
        .filter(Boolean)
    ])).filter(Boolean);

    // Pagination calculations
    const totalFiltered = filteredBank.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / qbState.pageSize));
    if (qbState.page > totalPages) qbState.page = totalPages;
    if (qbState.page < 1) qbState.page = 1;
    const startIdx = (qbState.page - 1) * qbState.pageSize;
    const pageItems = filteredBank.slice(startIdx, startIdx + qbState.pageSize);

    // Selected count
    const validSelectedIds = new Set(
      Array.from(qbState.selectedIds).filter((id) => activeBankPool.some((q) => q.id === id))
    );
    qbState.selectedIds = validSelectedIds;
    const selectedCount = validSelectedIds.size;

    const letters = ['A', 'B', 'C', 'D'];

    bodyEl.innerHTML = `
      <!-- 0. Hierarchical Category Master (Exam → Subject → Topic → Subtopic) & Safe Data Migration -->
      <div class="card" style="border-left:4px solid var(--primary);margin-bottom:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span class="badge badge-exam">🗂️ HIERARCHICAL QUESTION CATEGORISATION SYSTEM</span>
              <span class="badge badge-review">${catalog.examCategories.length} Exams • ${catalog.subjects.length} Subjects • ${catalog.topics.length} Topics • ${catalog.subtopics.length} Subtopics</span>
              ${totalNeedsCategorisation > 0 ? `<span class="badge badge-paid">⚠️ ${totalNeedsCategorisation} Needs Categorisation</span>` : '<span class="badge badge-free">✓ All Questions Categorised</span>'}
            </div>
            <h3 style="font-size:1rem;font-weight:800;margin-top:4px;">
              Exam → Subject → Topic → Subtopic Master &amp; Question Distribution
            </h3>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${totalNeedsCategorisation > 0 ? `<button class="btn btn-warning btn-sm" id="qbFilterNeedsCategorisationBtn">⚠️ View Needs Categorisation (${totalNeedsCategorisation})</button>` : ''}
            <button class="btn btn-outline btn-sm" id="qbRunSafeMigrationBtn" title="Safely migrate existing questions without overwriting or losing data">🔄 Run / Verify Data Migration</button>
            <button class="btn btn-primary btn-sm" id="qbToggleCategoryMasterBtn">
              ${qbState.categoryManagerOpen ? '🔼 Hide Category Master Manager' : '⚙️ Manage Exams, Subjects, Topics &amp; Subtopics'}
            </button>
          </div>
        </div>

        <!-- Question Counts Breakdown by Exam, Subject & Top Topics -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
          <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);border:1px solid var(--border);">
            <div style="font-size:0.74rem;font-weight:800;color:var(--text-secondary);margin-bottom:6px;">🎯 Question Count by Exam (Multi-Exam Enabled)</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">
              ${catalog.examCategories.map((ex) => {
                const code = ex.examId || ex.code;
                const cnt = countByExam[code.toUpperCase()] || countByExam[(ex.code || '').toUpperCase()] || 0;
                return `<span class="badge ${cnt > 0 ? 'badge-exam' : 'badge-draft'}" style="cursor:pointer;" data-quick-exam-filter="${esc(ex.code)}">${esc(ex.code)}: ${cnt}</span>`;
              }).join('')}
            </div>
          </div>
          <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);border:1px solid var(--border);">
            <div style="font-size:0.74rem;font-weight:800;color:var(--text-secondary);margin-bottom:6px;">📚 Question Count by Subject Master</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;max-height:66px;overflow-y:auto;">
              ${Object.entries(countBySubject).sort((a, b) => b[1] - a[1]).map(([sName, cnt]) => `
                <span class="badge badge-review" style="cursor:pointer;" data-quick-subject-filter="${esc(sName)}">${esc(sName)}: ${cnt}</span>
              `).join('')}
            </div>
          </div>
          <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);border:1px solid var(--border);">
            <div style="font-size:0.74rem;font-weight:800;color:var(--text-secondary);margin-bottom:6px;">🏷️ Question Count by Topic Master</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;max-height:66px;overflow-y:auto;">
              ${Object.entries(countByTopic).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([tName, cnt]) => `
                <span class="badge badge-draft" style="cursor:pointer;" data-quick-topic-filter="${esc(tName)}">${esc(tName)}: ${cnt}</span>
              `).join('')}
            </div>
          </div>
        </div>

        ${migRep && migRep.lastMigratedAt ? `
          <div style="margin-top:8px;padding:7px 10px;border-radius:6px;background:var(--surface-alt);font-size:0.75rem;color:var(--text-secondary);display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;">
            <span>✅ <strong>Migration Status:</strong> ${migRep.totalInspected || activeBankPool.length} inspected • ${migRep.migratedCount || 0} upgraded • ${migRep.alreadyCategorisedCount || 0} already categorised • ${migRep.needsCategorisationCount || 0} marked <em>Needs Categorisation</em> • ${(migRep.errors || []).length} errors</span>
            <span>Last verified: ${esc(String(migRep.lastMigratedAt).slice(0, 19).replace('T', ' '))}</span>
          </div>
        ` : ''}

        ${qbState.categoryManagerOpen ? `
          <div style="margin-top:12px;padding-top:12px;border-top:2px dashed var(--border);">
            <div class="chip-row" style="margin-bottom:10px;">
              <button class="filter-chip ${qbState.categoryManagerTab === 'exams' ? 'active' : ''}" data-cat-mgr-tab="exams">1. Exam Master (${catalog.examCategories.length})</button>
              <button class="filter-chip ${qbState.categoryManagerTab === 'subjects' ? 'active' : ''}" data-cat-mgr-tab="subjects">2. Subject Master (${catalog.subjects.length})</button>
              <button class="filter-chip ${qbState.categoryManagerTab === 'topics' ? 'active' : ''}" data-cat-mgr-tab="topics">3. Topic Master (${catalog.topics.length})</button>
              <button class="filter-chip ${qbState.categoryManagerTab === 'subtopics' ? 'active' : ''}" data-cat-mgr-tab="subtopics">4. Subtopic Master (${catalog.subtopics.length})</button>
            </div>

            ${qbState.categoryManagerTab === 'exams' ? `
              <div style="padding:10px;border-radius:8px;background:var(--surface-alt);border:1px solid var(--border);">
                <div style="font-weight:800;font-size:0.84rem;margin-bottom:6px;">➕ Create / Update Exam in Exam Master</div>
                <div class="grid-4" style="gap:8px;margin-bottom:8px;">
                  <input class="form-input" id="cmExamCodeInput" placeholder="Exam Code (e.g., CG_VYAPAM, ADEO)" style="padding:6px 8px;font-size:0.8rem;" />
                  <input class="form-input" id="cmExamNameEnInput" placeholder="Exam Name (English) *" style="padding:6px 8px;font-size:0.8rem;" />
                  <input class="form-input" id="cmExamNameHiInput" placeholder="परीक्षा नाम (Hindi)" style="padding:6px 8px;font-size:0.8rem;" />
                  <button class="btn btn-primary btn-sm" id="cmSaveExamBtn">💾 Add / Update Exam</button>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;max-height:150px;overflow-y:auto;">
                  ${catalog.examCategories.map((ex) => `
                    <span class="badge badge-exam" style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;">
                      <span><strong>${esc(ex.code)}</strong> — ${esc(ex.nameEn)} (${esc(ex.nameHi || ex.nameEn)})</span>
                      <button class="btn btn-outline btn-sm" style="padding:1px 5px;font-size:0.68rem;" data-cm-rename-type="exam" data-cm-rename-id="${esc(ex.examId || ex.code)}" data-cm-rename-en="${esc(ex.nameEn)}" data-cm-rename-hi="${esc(ex.nameHi || ex.nameEn)}">✏️</button>
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${qbState.categoryManagerTab === 'subjects' ? `
              <div style="padding:10px;border-radius:8px;background:var(--surface-alt);border:1px solid var(--border);">
                <div style="font-weight:800;font-size:0.84rem;margin-bottom:6px;">➕ Create / Update Subject in Subject Master</div>
                <div class="grid-4" style="gap:8px;margin-bottom:8px;">
                  <input class="form-input" id="cmSubjectIdInput" placeholder="Subject ID (optional auto)" style="padding:6px 8px;font-size:0.8rem;" />
                  <input class="form-input" id="cmSubjectTitleEnInput" placeholder="Subject Name (English) *" style="padding:6px 8px;font-size:0.8rem;" />
                  <input class="form-input" id="cmSubjectTitleHiInput" placeholder="विषय नाम (Hindi)" style="padding:6px 8px;font-size:0.8rem;" />
                  <button class="btn btn-primary btn-sm" id="cmSaveSubjectBtn">💾 Add / Update Subject</button>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;max-height:150px;overflow-y:auto;">
                  ${catalog.subjects.map((s) => `
                    <span class="badge badge-review" style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;">
                      <span><strong>${esc(s.titleEn)}</strong> (${esc(s.titleHi)}) [<code>${esc(s.subjectId)}</code>]</span>
                      <button class="btn btn-outline btn-sm" style="padding:1px 5px;font-size:0.68rem;" data-cm-rename-type="subject" data-cm-rename-id="${esc(s.subjectId)}" data-cm-rename-en="${esc(s.titleEn)}" data-cm-rename-hi="${esc(s.titleHi)}">✏️</button>
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${qbState.categoryManagerTab === 'topics' ? `
              <div style="padding:10px;border-radius:8px;background:var(--surface-alt);border:1px solid var(--border);">
                <div style="font-weight:800;font-size:0.84rem;margin-bottom:6px;">➕ Create / Update Topic Linked to Subject</div>
                <div class="grid-4" style="gap:8px;margin-bottom:8px;">
                  <select class="form-select" id="cmTopicParentSubjectSelect" style="padding:6px 8px;font-size:0.8rem;">
                    ${catalog.subjects.map((s) => `<option value="${esc(s.subjectId)}">${esc(s.titleEn)} (${esc(s.titleHi)})</option>`).join('')}
                  </select>
                  <input class="form-input" id="cmTopicTitleEnInput" placeholder="Topic Name (English) *" style="padding:6px 8px;font-size:0.8rem;" />
                  <input class="form-input" id="cmTopicTitleHiInput" placeholder="टॉपिक नाम (Hindi)" style="padding:6px 8px;font-size:0.8rem;" />
                  <button class="btn btn-primary btn-sm" id="cmSaveTopicBtn">💾 Add / Update Topic</button>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;max-height:160px;overflow-y:auto;">
                  ${catalog.topics.map((t) => `
                    <span class="badge badge-draft" style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;">
                      <span>[${esc(t.subjectId)}] <strong>${esc(t.titleEn)}</strong> (${esc(t.titleHi)})</span>
                      <button class="btn btn-outline btn-sm" style="padding:1px 5px;font-size:0.68rem;" data-cm-rename-type="topic" data-cm-rename-id="${esc(t.topicId)}" data-cm-rename-en="${esc(t.titleEn)}" data-cm-rename-hi="${esc(t.titleHi)}">✏️</button>
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${qbState.categoryManagerTab === 'subtopics' ? `
              <div style="padding:10px;border-radius:8px;background:var(--surface-alt);border:1px solid var(--border);">
                <div style="font-weight:800;font-size:0.84rem;margin-bottom:6px;">➕ Create / Update Subtopic Linked to Topic</div>
                <div class="grid-4" style="gap:8px;margin-bottom:8px;">
                  <select class="form-select" id="cmSubtopicParentTopicSelect" style="padding:6px 8px;font-size:0.8rem;">
                    ${catalog.topics.map((t) => `<option value="${esc(t.topicId)}" data-subject-id="${esc(t.subjectId)}">${esc(t.titleEn)} (${esc(t.subjectId)})</option>`).join('')}
                  </select>
                  <input class="form-input" id="cmSubtopicTitleEnInput" placeholder="Subtopic Name (English) *" style="padding:6px 8px;font-size:0.8rem;" />
                  <input class="form-input" id="cmSubtopicTitleHiInput" placeholder="उप-टॉपिक नाम (Hindi)" style="padding:6px 8px;font-size:0.8rem;" />
                  <button class="btn btn-primary btn-sm" id="cmSaveSubtopicBtn">💾 Add / Update Subtopic</button>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;max-height:160px;overflow-y:auto;">
                  ${catalog.subtopics.map((st) => `
                    <span class="badge badge-draft" style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;">
                      <span>[${esc(st.topicId)}] <strong>${esc(st.titleEn)}</strong> (${esc(st.titleHi)})</span>
                      <button class="btn btn-outline btn-sm" style="padding:1px 5px;font-size:0.68rem;" data-cm-rename-type="subtopic" data-cm-rename-id="${esc(st.subtopicId)}" data-cm-rename-en="${esc(st.titleEn)}" data-cm-rename-hi="${esc(st.titleHi)}">✏️</button>
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>

      <!-- Top 2-Column Section: Bulk CSV/JSON/PDF Upload + Add Single Question -->
      <div class="grid-2">
        <!-- 1. Bulk Question Upload (CSV, JSON, or Smart PDF with Answer Key Matching) Card -->
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
            <h3 style="font-size:1rem;font-weight:800;">📂 Bulk Question Upload (CSV, JSON &amp; Smart PDF + Answer Key)</h3>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm" id="qbDownloadSampleCsvBtn" title="Download sample CSV template">⬇️ Sample CSV</button>
              <button class="btn btn-outline btn-sm" id="qbDownloadSampleJsonBtn" title="Download sample JSON template">⬇️ Sample JSON</button>
            </div>
          </div>
          <p style="font-size:0.79rem;color:var(--text-secondary);margin-bottom:10px;">
            Upload a <code>.csv</code>, <code>.json</code>, or <code>.pdf</code> question paper.
            Smart PDF Import extracts questions via OCR, matches the Answer Key (<code>1-A, 2-B, 3-C...</code>), predicts <strong>Subject → Topic → Subtopic</strong> from the Master with confidence scoring, and lets you verify &amp; save to the <strong>Central Reusable Question Bank</strong>.
          </p>

          <div class="form-group">
            <label class="form-label">Target Destination (Central Reusable Question Bank or Draft Test)</label>
            <select class="form-select" id="admBulkTargetTest">
              <option value="central_bank" ${(ps && ps.targetTestId === 'central_bank') ? 'selected' : ''}>Central Reusable Question Bank (Eligible for Auto Test Generation)</option>
              ${(state.tests || []).filter((t) => t.status !== 'published').map((t) => `<option value="${esc(t.id)}" ${(ps && ps.targetTestId === t.id) ? 'selected' : ''}>[${esc(t.examCode || 'CGPSC')}] ${esc(t.titleHi)} (DRAFT)</option>`).join('')}
            </select>
          </div>

          <!-- Default Categorization Mapping for Bulk Upload -->
          <div style="padding:10px;border-radius:8px;background:var(--surface-alt);border:1px solid var(--border);margin-bottom:12px;">
            <div style="font-size:0.76rem;font-weight:800;color:var(--text-secondary);margin-bottom:6px;">
              🗂️ Default Categorization Mapping (Used for CSV/JSON when optional columns are omitted or when Override is checked)
            </div>
            <div class="grid-3" style="gap:6px;margin-bottom:6px;">
              <select class="form-select" id="admBulkDefaultExam" style="padding:6px 8px;font-size:0.78rem;">
                ${catalog.examCategories.map((ex) => `<option value="${esc(ex.code)}">${esc(ex.code)} — ${esc(ex.nameEn)}</option>`).join('')}
              </select>
              <input class="form-input" id="admBulkDefaultSubject" list="qbSubjectDatalist" value="Chhattisgarh General Knowledge" placeholder="Default Subject" style="padding:6px 8px;font-size:0.78rem;" />
              <input class="form-input" id="admBulkDefaultTopic" list="qbTopicDatalist" value="History of Chhattisgarh" placeholder="Default Topic" style="padding:6px 8px;font-size:0.78rem;" />
            </div>
            <div class="grid-3" style="gap:6px;align-items:center;">
              <input class="form-input" id="admBulkDefaultSubtopic" list="qbSubtopicDatalist" placeholder="Subtopic (optional)" style="padding:6px 8px;font-size:0.78rem;" />
              <select class="form-select" id="admBulkDefaultDifficulty" style="padding:6px 8px;font-size:0.78rem;">
                <option value="Easy">Difficulty: Easy</option>
                <option value="Moderate" selected>Difficulty: Moderate</option>
                <option value="Hard">Difficulty: Hard</option>
              </select>
              <input class="form-input" id="admBulkDefaultTags" placeholder="Multi-Exams / Tags (e.g. CG_VYAPAM, ADEO)" style="padding:6px 8px;font-size:0.78rem;" />
            </div>
            <label style="display:inline-flex;align-items:center;gap:6px;font-size:0.75rem;margin-top:6px;cursor:pointer;">
              <input type="checkbox" id="admBulkOverrideAllChk" />
              <span>Override file/PDF Subject, Topic, Subtopic &amp; Difficulty with the selection above</span>
            </label>
          </div>

          <div class="grid-2" style="gap:8px;margin-bottom:8px;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">1. Select CSV / JSON / Question Paper PDF</label>
              <input type="file" accept=".csv,.json,.pdf,text/csv,application/json,application/pdf" class="form-input" id="admBulkFileInput" />
              ${qbState.lastUploadedFileName ? `<div style="font-size:0.74rem;color:var(--success);font-weight:700;margin-top:3px;">📄 Loaded: ${esc(qbState.lastUploadedFileName)}</div>` : ''}
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Question Paper Set Code (Single-Set PDF Import)</label>
              <select class="form-select" id="admPdfPaperSetSelect">
                <option value="A" ${((ps && ps.paperSetCode) || 'A') === 'A' ? 'selected' : ''}>Set A (केवल सेट A)</option>
                <option value="B" ${((ps && ps.paperSetCode) || '') === 'B' ? 'selected' : ''}>Set B (केवल सेट B)</option>
                <option value="C" ${((ps && ps.paperSetCode) || '') === 'C' ? 'selected' : ''}>Set C (केवल सेट C)</option>
                <option value="D" ${((ps && ps.paperSetCode) || '') === 'D' ? 'selected' : ''}>Set D (केवल सेट D)</option>
              </select>
            </div>
          </div>

          <div class="grid-2" style="gap:8px;margin-bottom:10px;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:0.75rem;">2. Upload Answer Key PDF (Multi-Set A/B/C/D Table Supported)</label>
              <input type="file" accept=".pdf,.txt,.csv,application/pdf,text/plain" class="form-input" id="admPdfAnswerKeyFileInput" />
              ${qbState.lastAnswerKeyFileName ? `<div style="font-size:0.74rem;color:var(--secondary);font-weight:700;margin-top:3px;">🔑 Key File: ${esc(qbState.lastAnswerKeyFileName)}</div>` : ''}
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label" style="font-size:0.75rem;">🔑 Or Paste Answer Key Text / Table (Auto-Filters Selected Set Column)</label>
              <input class="form-input" id="admPdfAnswerKeyInput" value="${esc((ps && ps.answerKeyText) || qbState.pendingAnswerKeyText || '')}" placeholder="e.g., 1-A, 2-B or Multi-Set Table (Set A/B/C/D)" style="padding:7px 9px;font-size:0.8rem;" />
            </div>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary" id="admProcessBulkUploadBtn">👁️ Preview, Auto-Categorise &amp; Validate Before Import</button>
          </div>
        </div>

        <!-- 2. Enhanced Add Single Question Card -->
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
            <h3 style="font-size:1rem;font-weight:800;">➕ Add Single Question to Question Bank</h3>
            <span class="badge badge-exam">Exam → Subject → Topic → Subtopic</span>
          </div>

          <div id="qbSingleValidationMsg" style="display:none;padding:8px 10px;border-radius:8px;background:var(--danger-soft);color:var(--danger);font-size:0.78rem;font-weight:700;margin-bottom:8px;"></div>

          <div class="form-group" style="margin-bottom:0;">
            <!-- Exam Category, Subject, Topic & Subtopic Row -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
              <div>
                <label class="form-label" style="font-size:0.73rem;margin-bottom:2px;">Primary Exam</label>
                <select class="form-select" id="qbExamCode" style="padding:7px 9px;font-size:0.8rem;">
                  ${catalog.examCategories.map((ex) => `<option value="${esc(ex.code)}" ${sd.examCode === ex.code ? 'selected' : ''}>${esc(ex.code)} (${esc(ex.nameEn)})</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="form-label" style="font-size:0.73rem;margin-bottom:2px;">Target Destination</label>
                <select class="form-select" id="qbSingleTargetTest" style="padding:7px 9px;font-size:0.8rem;">
                  <option value="central_bank" ${sd.targetTestId === 'central_bank' ? 'selected' : ''}>Central Question Bank Only</option>
                  ${(state.tests || []).filter((t) => t.status !== 'published').map((t) => `<option value="${esc(t.id)}" ${sd.targetTestId === t.id ? 'selected' : ''}>Central Bank + Draft Test: ${esc(t.titleHi)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:6px;">
              <div>
                <label class="form-label" style="font-size:0.73rem;margin-bottom:2px;">Subject *</label>
                <input class="form-input" id="qbSubjectTag" list="qbSubjectDatalist" value="${esc(sd.subjectTag)}" placeholder="Subject (e.g., History)" style="padding:7px 9px;font-size:0.8rem;" />
                <datalist id="qbSubjectDatalist">
                  ${catalog.subjects.map((s) => `<option value="${esc(s.titleEn)}">${esc(s.titleHi)}</option>`).join('')}
                </datalist>
              </div>
              <div>
                <label class="form-label" style="font-size:0.73rem;margin-bottom:2px;">Topic *</label>
                <input class="form-input" id="qbTopicInput" list="qbTopicDatalist" value="${esc(sd.topic)}" placeholder="Topic (e.g., Ancient Indian History)" style="padding:7px 9px;font-size:0.8rem;" />
                <datalist id="qbTopicDatalist">
                  ${catalog.allTopics.map((t) => `<option value="${esc(t)}"></option>`).join('')}
                </datalist>
              </div>
              <div>
                <label class="form-label" style="font-size:0.73rem;margin-bottom:2px;">Difficulty *</label>
                <select class="form-select" id="qbDifficultySelect" style="padding:7px 9px;font-size:0.8rem;">
                  <option value="Easy" ${sd.difficulty === 'Easy' ? 'selected' : ''}>Easy (सरल)</option>
                  <option value="Moderate" ${sd.difficulty === 'Moderate' ? 'selected' : ''}>Moderate (मध्यम)</option>
                  <option value="Hard" ${(sd.difficulty === 'Hard' || sd.difficulty === 'Difficult') ? 'selected' : ''}>Hard (कठिन)</option>
                </select>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
              <div>
                <input class="form-input" id="qbSubtopicInput" list="qbSubtopicDatalist" value="${esc(sd.subtopic)}" placeholder="Subtopic (e.g., Maurya Empire)" style="padding:7px 9px;font-size:0.8rem;" />
                <datalist id="qbSubtopicDatalist">
                  ${(catalog.allSubtopics || []).map((st) => `<option value="${esc(st)}"></option>`).join('')}
                </datalist>
              </div>
              <input class="form-input" id="qbPyqTag" value="${esc(sd.pyqTag)}" placeholder="Additional Exams / Tags (e.g., CG_VYAPAM, ADEO)" style="padding:7px 9px;font-size:0.8rem;" />
            </div>

            <textarea class="form-textarea" id="qbStemHi" rows="2" placeholder="प्रश्न (हिन्दी में) *..." style="margin-bottom:6px;padding:8px 10px;font-size:0.82rem;">${esc(sd.questionHi)}</textarea>
            <textarea class="form-textarea" id="qbStemEn" rows="2" placeholder="Question (in English) *..." style="margin-bottom:6px;padding:8px 10px;font-size:0.82rem;">${esc(sd.questionEn)}</textarea>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
              <input class="form-input" id="qbOpt0Hi" value="${esc(sd.optionsHi[0] || '')}" placeholder="विकल्प A (Hi) *" style="padding:7px 9px;font-size:0.8rem;" />
              <input class="form-input" id="qbOpt0En" value="${esc(sd.optionsEn[0] || '')}" placeholder="Option A (En) *" style="padding:7px 9px;font-size:0.8rem;" />
              <input class="form-input" id="qbOpt1Hi" value="${esc(sd.optionsHi[1] || '')}" placeholder="विकल्प B (Hi) *" style="padding:7px 9px;font-size:0.8rem;" />
              <input class="form-input" id="qbOpt1En" value="${esc(sd.optionsEn[1] || '')}" placeholder="Option B (En) *" style="padding:7px 9px;font-size:0.8rem;" />
              <input class="form-input" id="qbOpt2Hi" value="${esc(sd.optionsHi[2] || '')}" placeholder="विकल्प C (Hi) *" style="padding:7px 9px;font-size:0.8rem;" />
              <input class="form-input" id="qbOpt2En" value="${esc(sd.optionsEn[2] || '')}" placeholder="Option C (En) *" style="padding:7px 9px;font-size:0.8rem;" />
              <input class="form-input" id="qbOpt3Hi" value="${esc(sd.optionsHi[3] || '')}" placeholder="विकल्प D (Hi) *" style="padding:7px 9px;font-size:0.8rem;" />
              <input class="form-input" id="qbOpt3En" value="${esc(sd.optionsEn[3] || '')}" placeholder="Option D (En) *" style="padding:7px 9px;font-size:0.8rem;" />
            </div>

            <div style="display:grid;grid-template-columns:150px 1fr 1fr;gap:6px;margin-bottom:8px;">
              <select class="form-select" id="qbCorrectIdx" style="padding:7px 9px;font-size:0.8rem;">
                <option value="0" ${Number(sd.correctOptionIndex) === 0 ? 'selected' : ''}>Correct: Option A</option>
                <option value="1" ${Number(sd.correctOptionIndex) === 1 ? 'selected' : ''}>Correct: Option B</option>
                <option value="2" ${Number(sd.correctOptionIndex) === 2 ? 'selected' : ''}>Correct: Option C</option>
                <option value="3" ${Number(sd.correctOptionIndex) === 3 ? 'selected' : ''}>Correct: Option D</option>
              </select>
              <input class="form-input" id="qbExplanationHi" value="${esc(sd.explanationHi)}" placeholder="हिन्दी व्याख्या (Hindi Explanation) *" style="padding:7px 9px;font-size:0.8rem;" />
              <input class="form-input" id="qbExplanationEn" value="${esc(sd.explanationEn)}" placeholder="English Explanation *" style="padding:7px 9px;font-size:0.8rem;" />
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-outline" id="qbPreviewSingleBtn">👁️ Preview Question</button>
              <button class="btn btn-success" id="qbSaveSingleBtn">💾 Save to Central Question Bank</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. CSV / JSON / Smart PDF Import Preview, Auto-Categorisation, Validation & Duplicate Detection Workbench -->
      ${ps ? `
        <div class="card" id="qbImportPreviewWorkbench" style="border:2px solid var(--secondary);box-shadow:var(--shadow-md);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
            <div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span class="badge badge-exam">📋 STEP 1: PREVIEW, AUTO-CATEGORISATION &amp; VALIDATION STAGE (NOT SAVED YET)</span>
                <span class="badge badge-draft">File: ${esc(ps.fileName)} (${esc(ps.fileType)})</span>
                <span class="badge badge-review">Target: ${ps.targetTestId === 'central_bank' ? 'Central Reusable Question Bank' : esc(((state.tests || []).find((t) => t.id === ps.targetTestId) || {}).titleHi || ps.targetTestId)}</span>
              </div>
              <h3 style="font-size:1.08rem;font-weight:800;margin-top:4px;">
                🔍 Import Preview, Hierarchical Categorisation &amp; Admin Verification (${previewStats.total} Question(s) Detected)
              </h3>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm" id="qbVerifyAllExtractedBtn" title="Mark all properly categorised questions as Admin Verified">☑️ Verify All Categorised (${previewStats.total - previewStats.needsCatCount})</button>
              <button class="btn btn-danger" id="qbCancelImportPreviewBtn">✕ Cancel Import</button>
              <button class="btn btn-success" id="qbValidateAndContinueBtn">
                ✅ Validate and Continue (${previewStats.validReady} Ready)
              </button>
            </div>
          </div>

          <!-- KPI Summary Strip -->
          <div class="qb-kpi-strip">
            <div class="qb-kpi-box">
              <div class="qb-kpi-num">${previewStats.total}</div>
              <div class="qb-kpi-lbl">Total Questions Detected</div>
            </div>
            <div class="qb-kpi-box" style="border-color:var(--success);">
              <div class="qb-kpi-num" style="color:var(--success);">${previewStats.verifiedReady}</div>
              <div class="qb-kpi-lbl">Verified &amp; Eligible for Auto-Test</div>
            </div>
            <div class="qb-kpi-box" style="border-color:var(--warning);">
              <div class="qb-kpi-num" style="color:var(--warning);">${previewStats.needsCatCount}</div>
              <div class="qb-kpi-lbl">Needs Categorisation</div>
            </div>
            <div class="qb-kpi-box" style="border-color:var(--danger);">
              <div class="qb-kpi-num" style="color:var(--danger);">${previewStats.rowErrorCount + (ps.fileStructureErrors.length > 0 ? ps.fileStructureErrors.length : 0)}</div>
              <div class="qb-kpi-lbl">Rejected / Validation Errors</div>
            </div>
            <div class="qb-kpi-box" style="border-color:var(--secondary);">
              <div class="qb-kpi-num" style="color:var(--secondary);">${previewStats.dupCount}</div>
              <div class="qb-kpi-lbl">Duplicates (Canonical Merge Ready)</div>
            </div>
          </div>

          <!-- Single-Set PDF Import & Answer Key Set Column Admin Confirmation Banner -->
          ${ps.fileType === 'PDF' ? `
            <div style="padding:12px 14px;border-radius:10px;background:var(--secondary-soft);border:1.5px solid var(--secondary);margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
              <div>
                <div style="font-weight:800;font-size:0.88rem;color:var(--primary);">
                  🎯 Single-Set Smart PDF Import — Answer Key Column Confirmation
                </div>
                <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:0.8rem;margin-top:4px;color:var(--text);">
                  <span>• <strong>Question Paper Set:</strong> <span class="badge badge-exam">Set ${esc(ps.paperSetCode || 'A')}</span></span>
                  <span>• <strong>Detected Answer Key Columns:</strong> <code>${esc((ps.detectedAnswerKeyColumns || ['A', 'B', 'C', 'D']).join(', '))}</code></span>
                  <span>• <strong>Selected Answer Key Column:</strong> <span class="badge badge-free">Set ${esc(ps.selectedAnswerKeyColumn || ps.paperSetCode || 'A')}</span> (Other sets ignored)</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <label style="font-size:0.76rem;font-weight:800;">Override Answer Key Column:</label>
                <select class="form-select" id="qbOverrideAnswerKeySetColSelect" style="width:auto;padding:5px 10px;font-size:0.8rem;">
                  ${['A', 'B', 'C', 'D'].map((col) => `<option value="${col}" ${(ps.selectedAnswerKeyColumn || ps.paperSetCode || 'A') === col ? 'selected' : ''}>Column Set ${col}</option>`).join('')}
                </select>
              </div>
            </div>
          ` : ''}

          <!-- New / Unrecognized Category, Subject or Topic Confirmation Banner -->
          ${ps.unknownTaxonomy && ps.unknownTaxonomy.length > 0 ? `
            <div style="padding:12px 14px;border-radius:10px;background:var(--warning-soft);border:1px solid var(--warning);margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
              <div>
                <div style="font-weight:800;font-size:0.86rem;color:var(--text);">
                  🗂️ Unmapped Subject / Topic / Subtopic Detected (${ps.unknownTaxonomy.length})
                </div>
                <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:2px;">
                  Questions with unmapped categories are marked <strong>Needs Categorisation</strong> and will not be auto-published until categorised or added to the Master:
                  ${ps.unknownTaxonomy.map((u) => `<code>${esc(u.examCode)} → ${esc(u.subjectName)} → ${esc(u.topicName)}${u.subtopicName ? ' → ' + esc(u.subtopicName) : ''}</code>`).join(', ')}
                </div>
              </div>
              <button class="btn btn-warning btn-sm" id="qbConfirmCreateTaxonomyBtn">
                ➕ Add to Category Master &amp; Verify
              </button>
            </div>
          ` : ''}

          <!-- Structured Validation Error Report (Section 2) -->
          ${(ps.fileStructureErrors.length > 0 || previewStats.rowErrorCount > 0) ? `
            <div style="margin-bottom:14px;padding:12px;border-radius:10px;border:1px solid var(--danger);background:rgba(220,38,38,0.04);">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                <h4 style="font-size:0.9rem;font-weight:800;color:var(--danger);">
                  ❌ Validation Error Report (${ps.fileStructureErrors.length + ps.records.reduce((acc, r) => acc + r.errors.length, 0)} Issue(s) Found)
                </h4>
                <span style="font-size:0.75rem;color:var(--text-secondary);">
                  Fix errors inline using "✏️ Fix Question" below, or correct your CSV/JSON/PDF file and re-upload. Invalid rows are never silently discarded.
                </span>
              </div>
              <div class="qb-table-wrap" style="max-height:220px;overflow-y:auto;">
                <table class="qb-table">
                  <thead>
                    <tr>
                      <th>Row #</th>
                      <th>Question #</th>
                      <th>Error Type</th>
                      <th>Reason for Rejection</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ps.fileStructureErrors.map((fe) => `
                      <tr>
                        <td><strong>Row ${esc(fe.rowNumber)}</strong></td>
                        <td>${esc(fe.questionNumber)}</td>
                        <td><span class="badge badge-live">${esc(fe.errorType)}</span></td>
                        <td>${esc(fe.reason)}</td>
                        <td><span style="font-size:0.74rem;color:var(--text-muted);">Fix file header/structure &amp; re-upload</span></td>
                      </tr>
                    `).join('')}
                    ${ps.records.map((rec, rIdx) => (rec.errors || []).map((err) => `
                      <tr>
                        <td><strong>Row ${esc(err.rowNumber)}</strong></td>
                        <td>Q${esc(err.questionNumber)}</td>
                        <td><span class="badge badge-live">${esc(err.errorType)}</span></td>
                        <td>${esc(err.reason)}</td>
                        <td>
                          <button class="btn btn-outline btn-sm" data-fix-preview-row="${rIdx}">✏️ Fix Inline</button>
                        </td>
                      </tr>
                    `).join('')).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : `
            <div style="margin-bottom:12px;padding:10px 14px;border-radius:8px;background:var(--success-soft);color:var(--success);font-size:0.82rem;font-weight:700;">
              ✅ All ${previewStats.total} parsed question record(s) passed structural, option, answer key matching, and format validation!
            </div>
          `}

          <!-- Dedicated Duplicate Question Management Panel (Section 9) -->
          ${previewStats.dupCount > 0 ? `
            <div style="margin-bottom:14px;padding:12px;border-radius:10px;border:1px solid var(--warning);background:rgba(217,119,6,0.05);">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                <div>
                  <h4 style="font-size:0.9rem;font-weight:800;color:var(--warning);">
                    ⚠️ Duplicate Question Management (${previewStats.dupCount} Match(es) Found)
                  </h4>
                  <p style="font-size:0.76rem;color:var(--text-secondary);">
                    When the same question is useful for multiple exams, keep <strong>one canonical question record</strong> and merge exam associations (<code>examIds</code>) instead of creating duplicate copies.
                  </p>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <button class="btn btn-primary btn-sm" id="qbMergeAllDuplicatesExamsBtn">🔗 Merge Exam Tags into Canonical Record (Recommended)</button>
                  <button class="btn btn-warning btn-sm" id="qbSkipAllDuplicatesBtn">⏭️ Skip All Duplicates</button>
                  <button class="btn btn-outline btn-sm" id="qbImportAllDuplicatesBtn">✅ Import Separate Copies</button>
                </div>
              </div>
              <div class="qb-table-wrap" style="max-height:240px;overflow-y:auto;">
                <table class="qb-table">
                  <thead>
                    <tr>
                      <th>Row / Q#</th>
                      <th>Duplicate Type</th>
                      <th>Incoming Question &amp; Exam(s)</th>
                      <th>Matched Canonical Record</th>
                      <th>Resolution Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${ps.records.map((rec, rIdx) => {
                      if (!rec.duplicateInfo) return '';
                      const d = rec.duplicateInfo;
                      const recExams = Array.isArray(rec.examIds) && rec.examIds.length > 0 ? rec.examIds : [rec.examCode || 'CGPSC'];
                      return `
                        <tr>
                          <td><strong>Row ${rec.rowNumber}</strong> (Q${rec.questionNumber})</td>
                          <td>
                            <span class="badge badge-paid">${esc(d.matchType)} (${d.similarityPct}%)</span>
                          </td>
                          <td>
                            <div style="font-weight:700;">${esc(rec.questionHi || rec.questionEn)}</div>
                            <div style="font-size:0.74rem;color:var(--text-secondary);">Exams: <strong>${esc(recExams.join(', '))}</strong></div>
                          </td>
                          <td>
                            <div style="font-size:0.75rem;font-weight:700;color:var(--secondary);">${esc(d.matchedQuestion.sourceLabel)} (ID: ${esc(d.matchedQuestion.id || '-')})</div>
                            <div style="font-size:0.74rem;color:var(--text-secondary);">${esc(d.matchedQuestion.questionHi || d.matchedQuestion.questionEn)}</div>
                          </td>
                          <td>
                            <div style="display:flex;gap:6px;flex-wrap:wrap;">
                              <button class="btn ${rec.duplicateResolution === 'merge_exams' ? 'btn-primary' : 'btn-outline'} btn-sm" data-dup-action="merge_exams" data-dup-idx="${rIdx}" title="Keep canonical question and append Exam tags">🔗 Merge Exams</button>
                              <button class="btn ${rec.duplicateResolution === 'skip' ? 'btn-warning' : 'btn-outline'} btn-sm" data-dup-action="skip" data-dup-idx="${rIdx}">⏭️ Skip</button>
                              <button class="btn ${rec.duplicateResolution === 'import_anyway' ? 'btn-success' : 'btn-outline'} btn-sm" data-dup-action="import_anyway" data-dup-idx="${rIdx}">✅ Separate Copy</button>
                              <button class="btn btn-navy btn-sm" data-dup-action="review" data-dup-idx="${rIdx}">🔍 Review</button>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <!-- Filter Tabs for Structured Preview Cards -->
          <div class="chip-row" style="margin-bottom:10px;">
            <button class="filter-chip ${ps.previewFilter === 'all' ? 'active' : ''}" data-preview-filter="all">All Detected (${previewStats.total})</button>
            <button class="filter-chip ${ps.previewFilter === 'valid' ? 'active' : ''}" data-preview-filter="valid">✅ Verified &amp; Categorised (${previewStats.verifiedReady})</button>
            <button class="filter-chip ${ps.previewFilter === 'needs_cat' ? 'active' : ''}" data-preview-filter="needs_cat">⚠️ Needs Categorisation (${previewStats.needsCatCount})</button>
            <button class="filter-chip ${ps.previewFilter === 'errors' ? 'active' : ''}" data-preview-filter="errors">❌ Validation Errors (${previewStats.rowErrorCount})</button>
            <button class="filter-chip ${ps.previewFilter === 'duplicates' ? 'active' : ''}" data-preview-filter="duplicates">🔗 Duplicates (${previewStats.dupCount})</button>
          </div>

          <!-- Structured Preview List -->
          <div style="max-height:520px;overflow-y:auto;padding-right:4px;">
            ${ps.records.filter((r) => {
              const isNeedsCat = Boolean(r.needsCategorisation) || r.verificationStatus === 'needs_categorisation' || r.status === 'needs_categorisation';
              if (ps.previewFilter === 'valid') return r.errors.length === 0 && (!r.duplicateInfo || r.duplicateResolution === 'import_anyway') && r.adminVerified !== false && !isNeedsCat;
              if (ps.previewFilter === 'needs_cat') return isNeedsCat;
              if (ps.previewFilter === 'errors') return r.errors.length > 0;
              if (ps.previewFilter === 'duplicates') return Boolean(r.duplicateInfo);
              return true;
            }).map((rec) => {
              const origIdx = ps.records.indexOf(rec);
              const hasErr = rec.errors && rec.errors.length > 0;
              const hasDup = Boolean(rec.duplicateInfo);
              const isNeedsCat = Boolean(rec.needsCategorisation) || rec.verificationStatus === 'needs_categorisation' || rec.status === 'needs_categorisation';
              const isVerifiedRec = rec.adminVerified !== false && rec.status !== 'unverified' && !isNeedsCat;
              const cardClass = hasErr ? 'status-error' : (hasDup ? 'status-duplicate' : 'status-valid');
              const diffVal = rec.difficultyLevel || rec.difficulty || 'Moderate';
              const diffClass = diffVal === 'Easy' ? 'badge-diff-easy' : ((diffVal === 'Hard' || diffVal === 'Difficult') ? 'badge-diff-difficult' : 'badge-diff-moderate');
              const recExamIds = Array.isArray(rec.examIds) && rec.examIds.length > 0 ? rec.examIds : [rec.examCode || 'CGPSC'];

              return `
                <div class="qb-preview-card ${cardClass}">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      <span class="badge badge-draft">Row #${rec.rowNumber} • Q${rec.questionNumber}</span>
                      ${hasErr ? `<span class="badge badge-live">❌ REJECTED (${rec.errors.length} Error${rec.errors.length > 1 ? 's' : ''})</span>` : ''}
                      ${!hasErr && hasDup ? `<span class="badge badge-paid">🔗 DUPLICATE (${rec.duplicateResolution === 'merge_exams' ? 'MERGE EXAMS INTO CANONICAL' : (rec.duplicateResolution === 'import_anyway' ? 'SEPARATE COPY' : 'SKIP')})</span>` : ''}
                      ${!hasErr && !hasDup && isNeedsCat ? `<span class="badge badge-paid">⚠️ NEEDS CATEGORISATION (Confidence: ${rec.categorisationConfidence || 20}%)</span>` : ''}
                      ${!hasErr && !hasDup && !isNeedsCat ? `<span class="badge ${isVerifiedRec ? 'badge-free' : 'badge-draft'}">${isVerifiedRec ? `✅ VERIFIED (Conf: ${rec.categorisationConfidence || 95}%)` : '⏳ UNVERIFIED'}</span>` : ''}
                      ${recExamIds.map((ex) => `<span class="badge badge-exam">${esc(ex)}</span>`).join('')}
                      <span class="badge badge-review">Subject: ${esc(rec.subjectTag)}</span>
                      <span class="badge badge-draft">Topic: ${esc(rec.topic)}</span>
                      ${rec.subtopic ? `<span class="badge badge-draft">Subtopic: ${esc(rec.subtopic)}</span>` : ''}
                      <span class="badge ${diffClass}">${esc(diffVal)}</span>
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                      <div style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:6px;background:var(--surface-alt);border:1px solid var(--border);font-size:0.72rem;">
                        <span style="font-weight:700;color:var(--text-secondary);">उत्तर:</span>
                        ${[0, 1, 2, 3].map((oi) => {
                          const isSelectedAns = rec.answerKeyMatched && Number(rec.correctOptionIndex) === oi;
                          return `<button type="button" class="btn ${isSelectedAns ? 'btn-success' : 'btn-outline'} btn-sm" style="padding:1px 6px;min-height:22px;font-size:0.7rem;" data-set-preview-ans="${origIdx}:${oi}" title="Set Option ${letters[oi]} as Correct Answer">${letters[oi]}</button>`;
                        }).join('')}
                      </div>
                      <button class="btn ${isVerifiedRec ? 'btn-success' : 'btn-outline'} btn-sm" data-toggle-verify-preview="${origIdx}" title="Toggle Admin Verification for Automatic Test Generation">
                        ${isVerifiedRec ? '✓ Admin Verified' : '⏳ Mark Verified'}
                      </button>
                      ${hasDup ? `<button class="btn btn-warning btn-sm" data-dup-action="review" data-dup-idx="${origIdx}">🔍 Compare Duplicate</button>` : ''}
                      <button class="btn btn-outline btn-sm" data-fix-preview-row="${origIdx}">✏️ Change Category / Edit</button>
                    </div>
                  </div>

                  ${hasErr ? `
                    <div style="padding:6px 10px;border-radius:6px;background:var(--danger-soft);color:var(--danger);font-size:0.76rem;font-weight:700;margin-bottom:6px;">
                      ${rec.errors.map((e) => `• [${esc(e.errorType)}] ${esc(e.reason)}`).join('<br/>')}
                    </div>
                  ` : ''}

                  <div style="font-weight:800;font-size:0.9rem;margin-top:4px;">🇮🇳 हिन्दी: ${esc(rec.questionHi || '(Missing Hindi Question Text)')}</div>
                  <div style="font-weight:600;font-size:0.84rem;color:var(--text-secondary);margin-top:2px;">🇬🇧 English: ${esc(rec.questionEn || '(Missing English Question Text)')}</div>

                  <!-- All 4 Answer Options with Highlighted Correct Answer -->
                  <div class="qb-options-grid">
                    ${[0, 1, 2, 3].map((optIdx) => {
                      const isCorr = Boolean(rec.answerKeyMatched) && Number(rec.correctOptionIndex) === optIdx;
                      return `
                        <div class="qb-option-pill ${isCorr ? 'is-correct' : ''}" style="cursor:pointer;" data-set-preview-ans="${origIdx}:${optIdx}" title="Click to set Option ${letters[optIdx]} as Correct Answer">
                          <div>
                            <div><strong>${letters[optIdx]} (Hi):</strong> ${esc(rec.optionsHi[optIdx] || '(Missing)')}</div>
                            <div style="font-size:0.74rem;color:var(--text-secondary);"><strong>${letters[optIdx]} (En):</strong> ${esc(rec.optionsEn[optIdx] || '(Missing)')}</div>
                          </div>
                          ${isCorr ? '<span class="badge badge-free">✓ Correct</span>' : ''}
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <!-- Hindi and English Explanations -->
                  <div class="qb-explanation-box">
                    <div><strong>व्याख्या (Hindi):</strong> ${esc(rec.explanationHi || '(Missing Hindi Explanation)')}</div>
                    <div style="margin-top:2px;"><strong>Explanation (English):</strong> ${esc(rec.explanationEn || '(Missing English Explanation)')}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-top:12px;margin-top:12px;border-top:1px solid var(--border);">
            <div style="font-size:0.8rem;color:var(--text-secondary);">
              Ready to commit <strong>${previewStats.verifiedReady}</strong> verified question(s) •
              Needs Categorisation: <strong>${previewStats.needsCatCount}</strong> (saved as unverified until categorised) •
              Duplicates to Merge/Skip: <strong>${previewStats.dupCount}</strong> •
              Rejecting <strong>${previewStats.rowErrorCount}</strong> invalid row(s)
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <button class="btn btn-danger" id="qbCancelImportPreviewBottomBtn">✕ Cancel Import</button>
              <button class="btn btn-success" id="qbValidateAndContinueBottomBtn">✅ Validate and Continue</button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- 4. Post-Import Summary & Downloadable CSV Report (Section 5) -->
      ${rep ? `
        <div class="card" style="border-left:5px solid var(--success);background:var(--surface);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
            <div>
              <span class="badge badge-free">📊 IMPORT SUMMARY &amp; AUDIT REPORT</span>
              <h3 style="font-size:1.02rem;font-weight:800;margin-top:3px;">
                Import Completed: ${esc(rep.fileName)} → ${esc(rep.targetLabel)}
              </h3>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-navy btn-sm" id="qbDownloadImportReportCsvBtn">⬇️ Download Import Report (CSV)</button>
              <button class="btn btn-outline btn-sm" id="qbDismissImportReportBtn">✕ Dismiss</button>
            </div>
          </div>

          <div class="qb-kpi-strip">
            <div class="qb-kpi-box">
              <div class="qb-kpi-num">${rep.totalDetected}</div>
              <div class="qb-kpi-lbl">Total Questions Detected</div>
            </div>
            <div class="qb-kpi-box" style="border-color:var(--success);">
              <div class="qb-kpi-num" style="color:var(--success);">${rep.importedCount}</div>
              <div class="qb-kpi-lbl">Successfully Imported</div>
            </div>
            <div class="qb-kpi-box" style="border-color:var(--danger);">
              <div class="qb-kpi-num" style="color:var(--danger);">${rep.rejectedCount}</div>
              <div class="qb-kpi-lbl">Rejected Questions</div>
            </div>
            <div class="qb-kpi-box" style="border-color:var(--warning);">
              <div class="qb-kpi-num" style="color:var(--warning);">${rep.duplicatesSkippedCount}</div>
              <div class="qb-kpi-lbl">Duplicates Merged / Skipped</div>
            </div>
            <div class="qb-kpi-box">
              <div class="qb-kpi-num" style="color:var(--review);">${rep.importedWithWarningsCount}</div>
              <div class="qb-kpi-lbl">Needs Categorisation / Warnings</div>
            </div>
          </div>

          <details ${rep.expanded ? 'open' : ''} style="margin-top:8px;">
            <summary style="cursor:pointer;font-weight:800;font-size:0.84rem;color:var(--secondary);padding:6px 0;">
              📋 Expandable Error, Duplicate &amp; Row-by-Row Import Report (${(rep.detailedRows || []).length} entries)
            </summary>
            <div class="qb-table-wrap" style="max-height:260px;overflow-y:auto;margin-top:8px;">
              <table class="qb-table">
                <thead>
                  <tr>
                    <th>Row #</th>
                    <th>Q #</th>
                    <th>Status</th>
                    <th>Question ID</th>
                    <th>Category / Subject / Topic</th>
                    <th>Issue / Duplicate Type</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  ${(rep.detailedRows || []).map((r) => `
                    <tr>
                      <td>Row ${esc(r.rowNumber)}</td>
                      <td>${esc(r.questionNumber)}</td>
                      <td>
                        <span class="badge ${r.outcome === 'IMPORTED' || r.outcome === 'MERGED_EXAMS_CANONICAL' ? 'badge-free' : (r.outcome === 'IMPORTED_WITH_WARNING' ? 'badge-review' : (r.outcome === 'SKIPPED_DUPLICATE' ? 'badge-paid' : 'badge-live'))}">
                          ${esc(r.outcome)}
                        </span>
                      </td>
                      <td><code>${esc(r.questionId || '-')}</code></td>
                      <td>${esc(r.examCode)} • ${esc(r.subjectTag)} (${esc(r.topic)})</td>
                      <td>${esc(r.issueType || 'None')}</td>
                      <td>${esc(r.details)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      ` : ''}

      <!-- 5. Central Reusable Question Bank Management Repository (Section 8) -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
          <div>
            <h3 style="font-size:1.05rem;font-weight:800;">
              🧠 Central Reusable Question Bank (${activeBankPool.length} Total • ${totalFiltered} Matching Filter)
            </h3>
            <p style="font-size:0.78rem;color:var(--text-secondary);">
              Cascading Hierarchical Filter: <strong>Exam → Subject → Topic → Subtopic</strong>. Verified &amp; categorised questions are automatically eligible for Test Series Builder generation.
            </p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${(flt.examCode !== 'ALL' || flt.subject !== 'ALL' || flt.topic !== 'ALL' || (flt.subtopic && flt.subtopic !== 'ALL') || flt.difficulty !== 'ALL' || flt.status !== 'ALL' || flt.search) ? `
              <button class="btn btn-outline btn-sm" id="qbResetAllFiltersBtn">🔄 Reset Filters</button>
            ` : ''}
            <button class="btn btn-outline btn-sm" id="qbExportFilteredCsvBtn">⬇️ Export ${selectedCount > 0 ? `Selected (${selectedCount})` : `Filtered (${totalFiltered})`} CSV</button>
            <button class="btn btn-outline btn-sm" id="qbExportFilteredJsonBtn">⬇️ Export ${selectedCount > 0 ? `Selected (${selectedCount})` : `Filtered (${totalFiltered})`} JSON</button>
          </div>
        </div>

        <!-- Search & Cascading Hierarchical Multi-Filter Controls (Exam -> Subject -> Topic -> Subtopic + Difficulty + Status) -->
        <div class="qb-filter-grid" style="grid-template-columns:repeat(auto-fit,minmax(145px,1fr));">
          <input class="form-input" id="qbRepoSearchInput" value="${esc(flt.search)}" placeholder="🔍 Search text or Question ID..." style="padding:8px 10px;font-size:0.82rem;" />
          <select class="form-select" id="qbFilterExam" style="padding:8px;font-size:0.8rem;">
            <option value="ALL" ${flt.examCode === 'ALL' ? 'selected' : ''}>1. Exam: All</option>
            ${catalog.examCategories.map((ex) => `<option value="${esc(ex.code)}" ${flt.examCode === ex.code ? 'selected' : ''}>${esc(ex.code)} (${countByExam[(ex.examId || ex.code).toUpperCase()] || 0})</option>`).join('')}
          </select>
          <select class="form-select" id="qbFilterSubject" style="padding:8px;font-size:0.8rem;">
            <option value="ALL" ${flt.subject === 'ALL' ? 'selected' : ''}>2. Subject: All</option>
            ${repoSubjects.map((s) => `<option value="${esc(s)}" ${flt.subject.toLowerCase() === s.toLowerCase() ? 'selected' : ''}>${esc(s)} (${countBySubject[s] || 0})</option>`).join('')}
          </select>
          <select class="form-select" id="qbFilterTopic" style="padding:8px;font-size:0.8rem;">
            <option value="ALL" ${flt.topic === 'ALL' ? 'selected' : ''}>3. Topic: All</option>
            ${repoTopics.map((t) => `<option value="${esc(t)}" ${flt.topic.toLowerCase() === t.toLowerCase() ? 'selected' : ''}>${esc(t)} (${countByTopic[t] || 0})</option>`).join('')}
          </select>
          <select class="form-select" id="qbFilterSubtopic" style="padding:8px;font-size:0.8rem;">
            <option value="ALL" ${(!flt.subtopic || flt.subtopic === 'ALL') ? 'selected' : ''}>4. Subtopic: All</option>
            ${repoSubtopics.map((st) => `<option value="${esc(st)}" ${(flt.subtopic || '').toLowerCase() === st.toLowerCase() ? 'selected' : ''}>${esc(st)}</option>`).join('')}
          </select>
          <select class="form-select" id="qbFilterDifficulty" style="padding:8px;font-size:0.8rem;">
            <option value="ALL" ${flt.difficulty === 'ALL' ? 'selected' : ''}>Difficulty: All</option>
            <option value="Easy" ${flt.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
            <option value="Moderate" ${flt.difficulty === 'Moderate' ? 'selected' : ''}>Moderate</option>
            <option value="Hard" ${(flt.difficulty === 'Hard' || flt.difficulty === 'Difficult') ? 'selected' : ''}>Hard</option>
          </select>
          <select class="form-select" id="qbFilterStatus" style="padding:8px;font-size:0.8rem;">
            <option value="ALL" ${flt.status === 'ALL' ? 'selected' : ''}>Verification: All</option>
            <option value="verified" ${flt.status === 'verified' ? 'selected' : ''}>Verified</option>
            <option value="needs_categorisation" ${flt.status === 'needs_categorisation' ? 'selected' : ''}>Needs Categorisation (${totalNeedsCategorisation})</option>
            <option value="unverified" ${flt.status === 'unverified' ? 'selected' : ''}>Unverified</option>
            <option value="draft" ${flt.status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="flagged" ${flt.status === 'flagged' ? 'selected' : ''}>Flagged</option>
          </select>
        </div>

        <!-- Bulk Action Toolbar -->
        <div class="qb-bulk-toolbar">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <label style="display:inline-flex;align-items:center;gap:6px;font-size:0.8rem;font-weight:800;cursor:pointer;">
              <input type="checkbox" id="qbSelectAllPageChk" ${pageItems.length > 0 && pageItems.every((q) => validSelectedIds.has(q.id)) ? 'checked' : ''} />
              <span>Select Page (${pageItems.length})</span>
            </label>
            <button class="btn btn-outline btn-sm" id="qbSelectAllFilteredBtn">☑️ Select All Filtered (${totalFiltered})</button>
            ${selectedCount > 0 ? `<button class="btn btn-outline btn-sm" id="qbClearSelectionBtn">✕ Clear Selection (${selectedCount})</button>` : ''}
            <span style="font-size:0.78rem;color:var(--text-secondary);">
              <strong>${selectedCount}</strong> question(s) selected
            </span>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" id="qbBulkEditBtn" ${selectedCount === 0 ? 'disabled' : ''}>✏️ Bulk Categorise &amp; Assign Exams (${selectedCount})</button>
            <button class="btn btn-navy btn-sm" id="qbBulkAssignTestBtn" ${selectedCount === 0 ? 'disabled' : ''}>📝 Assign to Test (${selectedCount})</button>
            <button class="btn btn-danger btn-sm" id="qbBulkDeleteBtn" ${selectedCount === 0 ? 'disabled' : ''}>🗑️ Bulk Delete (${selectedCount})</button>
          </div>
        </div>

        <!-- Question Repository Data Table -->
        ${totalFiltered === 0 ? `
          <div style="padding:28px 16px;text-align:center;color:var(--text-muted);font-size:0.86rem;">
            ${activeBankPool.length === 0
              ? 'No questions in Central Question Bank yet. Add a single question above or upload a CSV/JSON/PDF file.'
              : 'No questions match the current Exam / Subject / Topic / Subtopic filter criteria.'}
          </div>
        ` : `
          <div class="qb-table-wrap">
            <table class="qb-table">
              <thead>
                <tr>
                  <th style="width:36px;">✓</th>
                  <th style="width:72px;">Q# / ID</th>
                  <th>Bilingual Question &amp; Details</th>
                  <th style="width:215px;">Hierarchy (Exam → Subj → Topic → Subtopic)</th>
                  <th style="width:120px;">Difficulty &amp; Status</th>
                  <th style="width:165px;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${pageItems.map((q, idx) => {
                  const globalNum = startIdx + idx + 1;
                  const isChecked = validSelectedIds.has(q.id);
                  const isExpanded = qbState.expandedIds.has(q.id);
                  const diff = normalizeDifficultyValue(q.difficultyLevel || q.difficulty) || 'Moderate';
                  const diffClass = diff === 'Easy' ? 'badge-diff-easy' : (diff === 'Hard' ? 'badge-diff-difficult' : 'badge-diff-moderate');
                  const verStat = (q.verificationStatus || q.status || 'verified').toUpperCase();
                  const isNeedsCat = Boolean(q.needsCategorisation) || verStat === 'NEEDS_CATEGORISATION';
                  const isEligible = api && typeof api.isQuestionEligibleForAutoSelection === 'function'
                    ? api.isQuestionEligibleForAutoSelection(q)
                    : ((verStat === 'VERIFIED' || verStat === 'ACTIVE') && !isNeedsCat);
                  const corrIdx = Number(q.correctOptionIndex ?? q.correctIndex ?? 0);
                  const qExams = Array.isArray(q.examIds) && q.examIds.length > 0 ? q.examIds : [q.examCode || 'CGPSC'];
                  const optsHi = Array.isArray(q.optionsHi) ? q.optionsHi : [q.optA_Hi || '', q.optB_Hi || '', q.optC_Hi || '', q.optD_Hi || ''];
                  const optsEn = Array.isArray(q.optionsEn) ? q.optionsEn : [q.optA_En || '', q.optB_En || '', q.optC_En || '', q.optD_En || ''];

                  return `
                    <tr class="${isChecked ? 'row-selected' : ''}">
                      <td>
                        <input type="checkbox" data-qb-row-select="${esc(q.id)}" ${isChecked ? 'checked' : ''} />
                      </td>
                      <td>
                        <strong>#${globalNum}</strong>
                        <div style="font-size:0.68rem;color:var(--text-muted);word-break:break-all;">${esc(q.questionId || q.id)}</div>
                      </td>
                      <td>
                        <div style="font-weight:700;font-size:0.86rem;">${esc(q.questionHi)}</div>
                        <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:2px;">${esc(q.questionEn)}</div>
                        <div style="font-size:0.75rem;color:var(--success);font-weight:700;margin-top:4px;">
                          ✓ Correct Answer: Option ${letters[corrIdx] || 'A'} — ${esc(optsHi[corrIdx] || '')} / ${esc(optsEn[corrIdx] || '')}
                        </div>
                        ${isExpanded ? `
                          <div class="qb-options-grid" style="margin-top:8px;">
                            ${[0, 1, 2, 3].map((oi) => `
                              <div class="qb-option-pill ${corrIdx === oi ? 'is-correct' : ''}">
                                <span><strong>${letters[oi]}:</strong> ${esc(optsHi[oi] || '')} / ${esc(optsEn[oi] || '')}</span>
                                ${corrIdx === oi ? '<span class="badge badge-free">✓</span>' : ''}
                              </div>
                            `).join('')}
                          </div>
                          <div class="qb-explanation-box">
                            <div><strong>व्याख्या (Hi):</strong> ${esc(q.explanationHi || '-')}</div>
                            <div><strong>Explanation (En):</strong> ${esc(q.explanationEn || '-')}</div>
                          </div>
                        ` : ''}
                      </td>
                      <td>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">
                          ${qExams.map((ex) => `<span class="badge badge-exam">${esc(ex)}</span>`).join('')}
                        </div>
                        <div style="margin-top:4px;">
                          <span class="badge badge-review">${esc(q.subjectTag || 'General Studies')}</span>
                        </div>
                        <div style="font-size:0.74rem;color:var(--text-secondary);margin-top:4px;">
                          Topic: <strong>${esc(q.topic || 'General Knowledge')}</strong>
                          ${q.subtopic ? `<br/>Subtopic: <strong>${esc(q.subtopic)}</strong>` : ''}
                        </div>
                        ${q.pyqTag || (q.tags && q.tags.length > 0) ? `
                          <div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap;">
                            ${q.pyqTag ? `<span class="badge badge-paid">${esc(q.pyqTag)}</span>` : ''}
                            ${(q.tags || []).filter((t) => t !== q.pyqTag).map((t) => `<span class="badge badge-draft">${esc(t)}</span>`).join('')}
                          </div>
                        ` : ''}
                      </td>
                      <td>
                        <span class="badge ${diffClass}">${esc(diff)}</span>
                        <div style="margin-top:4px;">
                          <span class="badge ${isNeedsCat ? 'badge-paid' : (isEligible ? 'badge-free' : 'badge-draft')}">${esc(isNeedsCat ? 'NEEDS CATEGORISATION' : verStat)}</span>
                        </div>
                        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">
                          Lang: ${esc(q.languageAvailability || detectLanguageAvailability(q.questionHi, q.questionEn))}
                        </div>
                      </td>
                      <td>
                        <div style="display:flex;gap:5px;flex-wrap:wrap;">
                          ${!isEligible ? `<button class="btn btn-success btn-sm" data-verify-qbank="${esc(q.id)}" title="Verify question for automatic test generation">✓ Verify</button>` : ''}
                          <button class="btn btn-outline btn-sm" data-toggle-expand-qb="${esc(q.id)}" title="Expand Options & Explanation">${isExpanded ? '🔼 Hide' : '👁️ View'}</button>
                          <button class="btn btn-outline btn-sm" data-edit-qbank="${esc(q.id)}" title="Edit Question & Hierarchy">✏️</button>
                          <button class="btn btn-danger btn-sm" data-del-qbank="${esc(q.id)}" title="Delete Question">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Pagination Controls -->
          <div class="qb-pagination-bar">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <span>Showing <strong>${startIdx + 1}–${Math.min(totalFiltered, startIdx + pageItems.length)}</strong> of <strong>${totalFiltered}</strong> question(s)</span>
              <select class="form-select" id="qbPageSizeSelect" style="width:auto;padding:4px 8px;font-size:0.76rem;">
                <option value="10" ${qbState.pageSize === 10 ? 'selected' : ''}>10 / page</option>
                <option value="15" ${qbState.pageSize === 15 ? 'selected' : ''}>15 / page</option>
                <option value="25" ${qbState.pageSize === 25 ? 'selected' : ''}>25 / page</option>
                <option value="50" ${qbState.pageSize === 50 ? 'selected' : ''}>50 / page</option>
                <option value="100" ${qbState.pageSize === 100 ? 'selected' : ''}>100 / page</option>
              </select>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <button class="btn btn-outline btn-sm" id="qbPrevPageBtn" ${qbState.page <= 1 ? 'disabled' : ''}>◀ Prev</button>
              <span style="font-weight:700;padding:0 6px;">Page ${qbState.page} of ${totalPages}</span>
              <button class="btn btn-outline btn-sm" id="qbNextPageBtn" ${qbState.page >= totalPages ? 'disabled' : ''}>Next ▶</button>
            </div>
          </div>
        `}
      </div>
    `;

    // Helper to sync Single Question form inputs into qbState.singleDraft
    function syncSingleDraftFromDom() {
      const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
      };
      sd.examCode = getVal('qbExamCode') || 'CGPSC';
      sd.targetTestId = getVal('qbSingleTargetTest') || 'central_bank';
      sd.subjectTag = getVal('qbSubjectTag');
      sd.topic = getVal('qbTopicInput');
      sd.difficulty = getVal('qbDifficultySelect') || 'Moderate';
      sd.subtopic = getVal('qbSubtopicInput');
      sd.pyqTag = getVal('qbPyqTag');
      sd.questionHi = getVal('qbStemHi');
      sd.questionEn = getVal('qbStemEn');
      sd.optionsHi = [
        getVal('qbOpt0Hi'),
        getVal('qbOpt1Hi'),
        getVal('qbOpt2Hi'),
        getVal('qbOpt3Hi')
      ];
      sd.optionsEn = [
        getVal('qbOpt0En'),
        getVal('qbOpt1En'),
        getVal('qbOpt2En'),
        getVal('qbOpt3En')
      ];
      sd.correctOptionIndex = Number(getVal('qbCorrectIdx') || 0);
      sd.explanationHi = getVal('qbExplanationHi');
      sd.explanationEn = getVal('qbExplanationEn');
    }

    function validateAndBuildSingleQuestion() {
      syncSingleDraftFromDom();
      const qHi = sd.questionHi.trim();
      const qEn = sd.questionEn.trim();
      const optsHi = sd.optionsHi.map((o) => o.trim());
      const optsEn = sd.optionsEn.map((o) => o.trim());
      const expHi = sd.explanationHi.trim();
      const expEn = sd.explanationEn.trim();
      const subjectTag = sd.subjectTag.trim() || 'Chhattisgarh General Knowledge';
      const topic = sd.topic.trim() || 'History of Chhattisgarh';
      const subtopic = sd.subtopic.trim();

      const missing = [];
      if (!qHi) missing.push('Hindi Question (प्रश्न हिन्दी में)');
      if (!qEn) missing.push('English Question');
      ['A', 'B', 'C', 'D'].forEach((l, idx) => {
        if (!optsHi[idx]) missing.push(`Hindi Option ${l}`);
        if (!optsEn[idx]) missing.push(`English Option ${l}`);
      });
      if (!expHi && !expEn) missing.push('Hindi/English Explanation (व्याख्या)');

      const msgEl = document.getElementById('qbSingleValidationMsg');
      if (missing.length > 0) {
        if (msgEl) {
          msgEl.style.display = 'block';
          msgEl.textContent = `⚠️ Required fields missing: ${missing.join(', ')}.`;
        }
        api.toast(`⚠️ Please complete required fields: ${missing.slice(0, 3).join(', ')}`);
        return null;
      }
      if (msgEl) msgEl.style.display = 'none';

      const tagsList = sd.pyqTag ? sd.pyqTag.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const extraExams = tagsList.filter((t) => catalog.findExam(t)).map((t) => catalog.findExam(t).examId || t.toUpperCase());
      const examIds = Array.from(new Set([sd.examCode || 'CGPSC', ...extraExams]));
      const resolved = resolveCanonicalQuestionHierarchy(
        { examCode: sd.examCode || 'CGPSC', examIds, subjectTag, topic, subtopic },
        catalog
      );
      const corrIdx = Number(sd.correctOptionIndex || 0);
      const diffVal = normalizeDifficultyValue(sd.difficulty) || 'Moderate';
      const nowIso = new Date().toISOString();

      const qObj = {
        id: '',
        questionId: '',
        examCode: resolved.examCode,
        examIds: resolved.examIds,
        subjectId: resolved.subjectId,
        subjectTag: resolved.subjectTag || subjectTag,
        topicId: resolved.topicId,
        topic: resolved.topic || topic,
        subtopicId: resolved.subtopicId,
        subtopic: resolved.subtopic || subtopic,
        difficulty: diffVal,
        difficultyLevel: diffVal,
        questionType: 'MCQ',
        languageAvailability: detectLanguageAvailability(qHi, qEn),
        pyqTag: tagsList[0] || '',
        tags: tagsList,
        status: 'verified',
        verificationStatus: 'verified',
        needsCategorisation: false,
        verified: true,
        adminVerified: true,
        isDeleted: false,
        questionHi: qHi,
        questionEn: qEn,
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
        explanationHi: expHi || expEn,
        explanationEn: expEn || expHi,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdAtIso: nowIso,
        updatedAtIso: nowIso
      };
      qObj.id = computeDeterministicQuestionId(qObj);
      qObj.questionId = qObj.id;
      return qObj;
    }

    function commitSingleQuestion(qObj) {
      // Auto-register subject/topic/subtopic if new
      addCustomTaxonomyEntry(state, api, {
        examCode: qObj.examCode,
        subjectName: qObj.subjectTag,
        topicName: qObj.topic,
        subtopicName: qObj.subtopic
      });

      const existingIdx = (state.questionBank || []).findIndex((item) => item.id === qObj.id);
      if (existingIdx >= 0) {
        state.questionBank[existingIdx] = Object.assign({}, state.questionBank[existingIdx], qObj, {
          isDeleted: false,
          verified: true,
          adminVerified: true,
          status: 'verified'
        });
      } else {
        state.questionBank.unshift(qObj);
      }

      if (window.CGpediaCloud) {
        window.CGpediaCloud.saveCloudDoc('question_bank', qObj.id, qObj);
      }

      if (sd.targetTestId && sd.targetTestId !== 'central_bank') {
        const targetTest = (state.tests || []).find((t) => t.id === sd.targetTestId);
        // Never unexpectedly alter already published tests
        if (targetTest && targetTest.status !== 'published') {
          targetTest.questions = targetTest.questions || [];
          const normHiNew = normalizeTextForComparison(qObj.questionHi);
          const normEnNew = normalizeTextForComparison(qObj.questionEn);
          const alreadyInTest = targetTest.questions.some(
            (tq) => tq.centralQuestionId === qObj.id || tq.id === qObj.id ||
              (normHiNew && normalizeTextForComparison(tq.questionHi) === normHiNew) ||
              (normEnNew && normalizeTextForComparison(tq.questionEn) === normEnNew)
          );
          if (!alreadyInTest) {
            targetTest.questions.push(Object.assign({}, qObj, {
              id: `${targetTest.id}_ref_${qObj.id}`,
              centralQuestionId: qObj.id
            }));
            if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('tests', targetTest.id, targetTest);
          }
        }
      }

      // Reset form text fields while keeping selected categorization
      sd.questionHi = '';
      sd.questionEn = '';
      sd.optionsHi = ['', '', '', ''];
      sd.optionsEn = ['', '', '', ''];
      sd.explanationHi = '';
      sd.explanationEn = '';
      sd.correctOptionIndex = 0;

      api.saveState();
      api.toast('✅ Bilingual Question validated & saved to Central Question Bank!');
      renderAdminConsole(rootEl, state, api);
    }

    // Wire Hierarchical Category Master & Safe Data Migration Controls
    const toggleCatMgrBtn = document.getElementById('qbToggleCategoryMasterBtn');
    if (toggleCatMgrBtn) {
      toggleCatMgrBtn.onclick = () => {
        qbState.categoryManagerOpen = !qbState.categoryManagerOpen;
        renderAdminConsole(rootEl, state, api);
      };
    }

    const runMigrationBtn = document.getElementById('qbRunSafeMigrationBtn');
    if (runMigrationBtn) {
      runMigrationBtn.onclick = async () => {
        const res = await migrateExistingQuestionBankRecords(state, api);
        api.toast(`✅ Safe Migration verified: ${res.totalInspected} inspected, ${res.migratedCount} upgraded, ${res.needsCategorisationCount} Needs Categorisation.`);
        renderAdminConsole(rootEl, state, api);
      };
    }

    const filterNeedsCatBtn = document.getElementById('qbFilterNeedsCategorisationBtn');
    if (filterNeedsCatBtn) {
      filterNeedsCatBtn.onclick = () => {
        qbState.filters.status = 'needs_categorisation';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }

    bodyEl.querySelectorAll('[data-quick-exam-filter]').forEach((el) => {
      el.onclick = () => {
        qbState.filters.examCode = el.getAttribute('data-quick-exam-filter') || 'ALL';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    });

    bodyEl.querySelectorAll('[data-quick-subject-filter]').forEach((el) => {
      el.onclick = () => {
        qbState.filters.subject = el.getAttribute('data-quick-subject-filter') || 'ALL';
        qbState.filters.topic = 'ALL';
        qbState.filters.subtopic = 'ALL';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    });

    bodyEl.querySelectorAll('[data-quick-topic-filter]').forEach((el) => {
      el.onclick = () => {
        qbState.filters.topic = el.getAttribute('data-quick-topic-filter') || 'ALL';
        qbState.filters.subtopic = 'ALL';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    });

    const resetFiltersBtn = document.getElementById('qbResetAllFiltersBtn');
    if (resetFiltersBtn) {
      resetFiltersBtn.onclick = () => {
        qbState.filters = {
          search: '',
          examCode: 'ALL',
          subject: 'ALL',
          topic: 'ALL',
          subtopic: 'ALL',
          difficulty: 'ALL',
          language: 'ALL',
          status: 'ALL'
        };
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }

    bodyEl.querySelectorAll('[data-cat-mgr-tab]').forEach((tabBtn) => {
      tabBtn.onclick = () => {
        qbState.categoryManagerTab = tabBtn.getAttribute('data-cat-mgr-tab') || 'exams';
        renderAdminConsole(rootEl, state, api);
      };
    });

    const cmSaveExamBtn = document.getElementById('cmSaveExamBtn');
    if (cmSaveExamBtn) {
      cmSaveExamBtn.onclick = () => {
        const code = (document.getElementById('cmExamCodeInput').value || '').trim();
        const nameEn = (document.getElementById('cmExamNameEnInput').value || '').trim();
        const nameHi = (document.getElementById('cmExamNameHiInput').value || '').trim();
        if (!nameEn && !code) {
          api.toast('⚠️ Please enter an Exam Code and English Name.');
          return;
        }
        upsertCategoryMasterItem(state, api, 'exam', {
          code: code || nameEn.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
          nameEn: nameEn || code,
          nameHi: nameHi || nameEn || code
        });
        api.toast(`✅ Exam "${nameEn || code}" saved to Exam Master!`);
        renderAdminConsole(rootEl, state, api);
      };
    }

    const cmSaveSubjectBtn = document.getElementById('cmSaveSubjectBtn');
    if (cmSaveSubjectBtn) {
      cmSaveSubjectBtn.onclick = () => {
        const subjectId = (document.getElementById('cmSubjectIdInput').value || '').trim();
        const titleEn = (document.getElementById('cmSubjectTitleEnInput').value || '').trim();
        const titleHi = (document.getElementById('cmSubjectTitleHiInput').value || '').trim();
        if (!titleEn) {
          api.toast('⚠️ Please enter a Subject Name in English.');
          return;
        }
        upsertCategoryMasterItem(state, api, 'subject', {
          subjectId: subjectId || undefined,
          titleEn,
          titleHi: titleHi || titleEn
        });
        api.toast(`✅ Subject "${titleEn}" saved to Subject Master!`);
        renderAdminConsole(rootEl, state, api);
      };
    }

    const cmSaveTopicBtn = document.getElementById('cmSaveTopicBtn');
    if (cmSaveTopicBtn) {
      cmSaveTopicBtn.onclick = () => {
        const subjectId = document.getElementById('cmTopicParentSubjectSelect').value;
        const titleEn = (document.getElementById('cmTopicTitleEnInput').value || '').trim();
        const titleHi = (document.getElementById('cmTopicTitleHiInput').value || '').trim();
        if (!titleEn) {
          api.toast('⚠️ Please enter a Topic Name in English.');
          return;
        }
        upsertCategoryMasterItem(state, api, 'topic', {
          subjectId,
          titleEn,
          titleHi: titleHi || titleEn
        });
        api.toast(`✅ Topic "${titleEn}" saved to Topic Master!`);
        renderAdminConsole(rootEl, state, api);
      };
    }

    const cmSaveSubtopicBtn = document.getElementById('cmSaveSubtopicBtn');
    if (cmSaveSubtopicBtn) {
      cmSaveSubtopicBtn.onclick = () => {
        const sel = document.getElementById('cmSubtopicParentTopicSelect');
        const topicId = sel.value;
        const opt = sel.options[sel.selectedIndex];
        const subjectId = opt ? opt.getAttribute('data-subject-id') : '';
        const titleEn = (document.getElementById('cmSubtopicTitleEnInput').value || '').trim();
        const titleHi = (document.getElementById('cmSubtopicTitleHiInput').value || '').trim();
        if (!titleEn) {
          api.toast('⚠️ Please enter a Subtopic Name in English.');
          return;
        }
        upsertCategoryMasterItem(state, api, 'subtopic', {
          topicId,
          subjectId,
          titleEn,
          titleHi: titleHi || titleEn
        });
        api.toast(`✅ Subtopic "${titleEn}" saved to Subtopic Master!`);
        renderAdminConsole(rootEl, state, api);
      };
    }

    bodyEl.querySelectorAll('[data-cm-rename-type]').forEach((btn) => {
      btn.onclick = () => {
        const type = btn.getAttribute('data-cm-rename-type');
        const id = btn.getAttribute('data-cm-rename-id');
        const curEn = btn.getAttribute('data-cm-rename-en') || '';
        const curHi = btn.getAttribute('data-cm-rename-hi') || '';
        const modalRoot = document.getElementById('genericModalContainer');
        if (!modalRoot) return;
        modalRoot.innerHTML = `
          <div class="modal-backdrop">
            <div class="modal-card" style="max-width:460px;">
              <h2 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">✏️ Edit / Rename ${esc(type.toUpperCase())} (${esc(id)})</h2>
              <div class="form-group">
                <label class="form-label">English Title *</label>
                <input class="form-input" id="cmRenameEnInput" value="${esc(curEn)}" />
              </div>
              <div class="form-group">
                <label class="form-label">Hindi Title (हिन्दी नाम)</label>
                <input class="form-input" id="cmRenameHiInput" value="${esc(curHi)}" />
              </div>
              <div style="display:flex;justify-content:flex-end;gap:8px;">
                <button class="btn btn-outline" id="cmRenameCancelBtn">Cancel</button>
                <button class="btn btn-primary" id="cmRenameConfirmBtn">💾 Save &amp; Update Linked Questions</button>
              </div>
            </div>
          </div>
        `;
        document.getElementById('cmRenameCancelBtn').onclick = () => { modalRoot.innerHTML = ''; };
        document.getElementById('cmRenameConfirmBtn').onclick = () => {
          const newEn = document.getElementById('cmRenameEnInput').value.trim();
          const newHi = document.getElementById('cmRenameHiInput').value.trim();
          if (!newEn) return;
          modalRoot.innerHTML = '';
          renameCategoryMasterItem(state, api, type, id, newEn, newHi || newEn);
          api.toast(`✅ Updated ${type} "${newEn}" across Master & Question Bank!`);
          renderAdminConsole(rootEl, state, api);
        };
      };
    });

    // Wire Sample CSV & JSON Download Buttons
    const sampleCsvBtn = document.getElementById('qbDownloadSampleCsvBtn');
    if (sampleCsvBtn) {
      sampleCsvBtn.onclick = () => {
        const sampleRows = [
          {
            id: 'sample_cg_1',
            questionId: 'sample_cg_1',
            examCode: 'CGPSC',
            examIds: ['CGPSC', 'CG_VYAPAM', 'ADEO'],
            subjectId: 'sub_cg_gk',
            subjectTag: 'Chhattisgarh General Knowledge',
            topicId: 'top_cg_history',
            topic: 'History of Chhattisgarh',
            subtopicId: 'subtop_cg_kalchuri',
            subtopic: 'Kalchuri Dynasty',
            difficulty: 'Easy',
            difficultyLevel: 'Easy',
            languageAvailability: 'Both',
            questionHi: 'छत्तीसगढ़ राज्य का गठन कब हुआ था?',
            questionEn: 'When was the state of Chhattisgarh formed?',
            optionsHi: ['1 नवंबर 2000', '9 नवंबर 2000', '15 नवंबर 2000', '26 जनवरी 2000'],
            optionsEn: ['1 November 2000', '9 November 2000', '15 November 2000', '26 January 2000'],
            correctOptionIndex: 0,
            explanationHi: 'मध्यप्रदेश पुनर्गठन अधिनियम 2000 के अंतर्गत 1 नवंबर 2000 को छत्तीसगढ़ देश का 26वां राज्य बना।',
            explanationEn: 'Chhattisgarh became the 26th state of India on 1 November 2000 under the MP Reorganization Act 2000.',
            pyqTag: 'CGPSC Pre',
            tags: ['CGPSC Pre', 'State Formation'],
            status: 'verified',
            verificationStatus: 'verified'
          }
        ];
        exportQuestionsToCsv(sampleRows, 'cgpedia-sample-questions-template.csv');
        api.toast('⬇️ Sample CSV template downloaded!');
      };
    }

    const sampleJsonBtn = document.getElementById('qbDownloadSampleJsonBtn');
    if (sampleJsonBtn) {
      sampleJsonBtn.onclick = () => {
        const sampleRows = [
          {
            id: 'sample_cg_json_1',
            questionId: 'sample_cg_json_1',
            examCode: 'CGPSC',
            examIds: ['CGPSC', 'CG_VYAPAM'],
            subjectId: 'sub_cg_gk',
            subjectTag: 'Chhattisgarh General Knowledge',
            topicId: 'top_cg_geography',
            topic: 'Chhattisgarh Geography',
            subtopicId: 'subtop_cg_rivers',
            subtopic: 'Rivers & Drainage of CG',
            difficulty: 'Moderate',
            difficultyLevel: 'Moderate',
            languageAvailability: 'Both',
            questionHi: 'महानदी का उद्गम स्थल किस जिले में स्थित है?',
            questionEn: 'In which district is the origin of the Mahanadi river located?',
            optionsHi: ['धमतरी (सिहावा पर्वत)', 'कांकेर', 'बस्तर', 'सरगुजा'],
            optionsEn: ['Dhamtari (Sihawa Hills)', 'Kanker', 'Bastar', 'Surguja'],
            correctOptionIndex: 0,
            explanationHi: 'महानदी का उद्गम धमतरी जिले के सिहावा पर्वत से होता है।',
            explanationEn: 'The Mahanadi river originates from the Sihawa hills in Dhamtari district.',
            pyqTag: 'CGPSC 2024',
            tags: ['Rivers', 'CG Geography'],
            status: 'verified',
            verificationStatus: 'verified'
          }
        ];
        exportQuestionsToJson(sampleRows, 'cgpedia-sample-questions-template.json');
        api.toast('⬇️ Sample JSON template downloaded!');
      };
    }

    // Wire Single Question Preview & Save
    const previewSingleBtn = document.getElementById('qbPreviewSingleBtn');
    if (previewSingleBtn) {
      previewSingleBtn.onclick = () => {
        const qObj = validateAndBuildSingleQuestion();
        if (!qObj) return;
        openQuestionPreviewModal(qObj, '👁️ Preview Single Question Before Saving', () => {
          commitSingleQuestion(qObj);
        });
      };
    }

    const saveSingleBtn = document.getElementById('qbSaveSingleBtn');
    if (saveSingleBtn) {
      saveSingleBtn.onclick = () => {
        const qObj = validateAndBuildSingleQuestion();
        if (!qObj) return;
        commitSingleQuestion(qObj);
      };
    }

    // Helper to trigger CSV/JSON/PDF File Preview & Validation Stage (WITHOUT saving to DB)
    async function startFilePreviewFromInput(file) {
      if (!file) {
        api.toast('कृपया पहले CSV, JSON या PDF फ़ाइल चुनें। (Please select a CSV, JSON, or PDF file first.)');
        return;
      }
      syncSingleDraftFromDom();
      const targetTestId = document.getElementById('admBulkTargetTest').value || 'central_bank';
      const domAkText = document.getElementById('admPdfAnswerKeyInput')
        ? document.getElementById('admPdfAnswerKeyInput').value.trim()
        : '';
      const answerKeyText = domAkText || qbState.pendingAnswerKeyText || '';
      qbState.pendingAnswerKeyText = answerKeyText;
      qbState.lastUploadedFileName = file.name || 'questions_file';

      const selectedSetCode = document.getElementById('admPdfPaperSetSelect')
        ? document.getElementById('admPdfPaperSetSelect').value
        : 'A';
      const batchDefaults = {
        examCode: document.getElementById('admBulkDefaultExam').value || 'CGPSC',
        subjectTag: document.getElementById('admBulkDefaultSubject').value.trim() || 'Chhattisgarh General Knowledge',
        topic: document.getElementById('admBulkDefaultTopic').value.trim() || 'History of Chhattisgarh',
        subtopic: document.getElementById('admBulkDefaultSubtopic').value.trim(),
        difficulty: document.getElementById('admBulkDefaultDifficulty').value || 'Moderate',
        tagsText: document.getElementById('admBulkDefaultTags').value.trim(),
        paperSetCode: selectedSetCode,
        answerKeySetColumn: selectedSetCode,
        overrideAll: Boolean(document.getElementById('admBulkOverrideAllChk').checked)
      };

      try {
        if (String(file.name || '').toLowerCase().endsWith('.pdf')) {
          api.toast('⏳ PDF फ़ाइल से प्रश्न पढ़े जा रहे हैं... (Extracting questions from PDF...)');
        }
        const rawText = await extractTextFromUploadedFile(file);
        qbState.previewSession = buildAndValidatePreviewSession(
          rawText,
          file.name,
          targetTestId,
          batchDefaults,
          null,
          state,
          answerKeyText
        );
        qbState.lastImportReport = null;
        api.toast(`📋 Loaded ${qbState.previewSession.records.length} question(s) into Import Preview (${qbState.previewSession.fileType} • Set ${qbState.previewSession.paperSetCode}).`);
        renderAdminConsole(rootEl, state, api);
        setTimeout(() => {
          const previewEl = document.getElementById('qbImportPreviewWorkbench');
          if (previewEl && typeof previewEl.scrollIntoView === 'function') {
            previewEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 80);
      } catch (readErr) {
        console.error('File upload parse error:', readErr);
        api.toast('⚠️ फ़ाइल पढ़ने में समस्या आई। कृपया फ़ाइल फ़ॉर्मेट जांचें।');
      }
    }

    const bulkFileInput = document.getElementById('admBulkFileInput');
    if (bulkFileInput) {
      bulkFileInput.onchange = () => {
        if (bulkFileInput.files && bulkFileInput.files[0]) {
          startFilePreviewFromInput(bulkFileInput.files[0]);
        }
      };
    }

    const akTextInputEl = document.getElementById('admPdfAnswerKeyInput');
    if (akTextInputEl) {
      akTextInputEl.oninput = () => {
        qbState.pendingAnswerKeyText = akTextInputEl.value;
      };
    }

    const akFileInput = document.getElementById('admPdfAnswerKeyFileInput');
    if (akFileInput) {
      akFileInput.onchange = async () => {
        if (!akFileInput.files || !akFileInput.files[0]) return;
        const akFile = akFileInput.files[0];
        qbState.lastAnswerKeyFileName = akFile.name || 'answer_key';
        try {
          const extractedAk = await extractTextFromUploadedFile(akFile);
          const rawAk = extractReadableTextFromPdfStream(extractedAk);
          qbState.pendingAnswerKeyText = rawAk;
          const akInp = document.getElementById('admPdfAnswerKeyInput');
          if (akInp) akInp.value = rawAk;
          const selectedSetCode = document.getElementById('admPdfPaperSetSelect')
            ? document.getElementById('admPdfPaperSetSelect').value
            : ((qbState.previewSession && qbState.previewSession.paperSetCode) || 'A');
          if (qbState.previewSession) {
            qbState.previewSession.answerKeyText = rawAk;
            qbState.previewSession = buildAndValidatePreviewSession(
              qbState.previewSession.rawText,
              qbState.previewSession.fileName,
              qbState.previewSession.targetTestId,
              Object.assign({}, qbState.previewSession.batchDefaults, {
                paperSetCode: selectedSetCode,
                answerKeySetColumn: selectedSetCode
              }),
              qbState.previewSession.records,
              state,
              rawAk
            );
          }
          renderAdminConsole(rootEl, state, api);
          api.toast(`🔑 Answer Key loaded (${akFile.name})! Selected Set ${selectedSetCode} column.`);
        } catch (akErr) {
          console.error('Answer key file error:', akErr);
          api.toast('⚠️ Answer Key फ़ाइल पढ़ने में समस्या आई।');
        }
      };
    }

    const paperSetSelect = document.getElementById('admPdfPaperSetSelect');
    if (paperSetSelect) {
      paperSetSelect.onchange = () => {
        const newSet = paperSetSelect.value || 'A';
        if (qbState.previewSession && qbState.previewSession.fileType === 'PDF') {
          qbState.previewSession.paperSetCode = newSet;
          qbState.previewSession.selectedAnswerKeyColumn = newSet;
          qbState.previewSession = buildAndValidatePreviewSession(
            qbState.previewSession.rawText,
            qbState.previewSession.fileName,
            qbState.previewSession.targetTestId,
            Object.assign({}, qbState.previewSession.batchDefaults, {
              paperSetCode: newSet,
              answerKeySetColumn: newSet
            }),
            qbState.previewSession.records,
            state,
            qbState.previewSession.answerKeyText
          );
          api.toast(`🎯 Switched Question Paper & Answer Key column to Set ${newSet}.`);
          renderAdminConsole(rootEl, state, api);
        }
      };
    }

    const processBulkBtn = document.getElementById('admProcessBulkUploadBtn');
    if (processBulkBtn) {
      processBulkBtn.onclick = () => {
        const domAkText = document.getElementById('admPdfAnswerKeyInput')
          ? document.getElementById('admPdfAnswerKeyInput').value.trim()
          : '';
        const answerKeyText = domAkText || qbState.pendingAnswerKeyText || '';
        qbState.pendingAnswerKeyText = answerKeyText;
        const selectedSetCode = document.getElementById('admPdfPaperSetSelect')
          ? document.getElementById('admPdfPaperSetSelect').value
          : 'A';
        if (bulkFileInput && bulkFileInput.files && bulkFileInput.files[0]) {
          startFilePreviewFromInput(bulkFileInput.files[0]);
        } else if (qbState.previewSession) {
          qbState.previewSession = buildAndValidatePreviewSession(
            qbState.previewSession.rawText,
            qbState.previewSession.fileName,
            document.getElementById('admBulkTargetTest').value || qbState.previewSession.targetTestId,
            {
              examCode: document.getElementById('admBulkDefaultExam').value || 'CGPSC',
              subjectTag: document.getElementById('admBulkDefaultSubject').value.trim() || 'Chhattisgarh General Knowledge',
              topic: document.getElementById('admBulkDefaultTopic').value.trim() || 'History of Chhattisgarh',
              subtopic: document.getElementById('admBulkDefaultSubtopic').value.trim(),
              difficulty: document.getElementById('admBulkDefaultDifficulty').value || 'Moderate',
              tagsText: document.getElementById('admBulkDefaultTags').value.trim(),
              paperSetCode: selectedSetCode,
              answerKeySetColumn: (qbState.previewSession && qbState.previewSession.selectedAnswerKeyColumn) || selectedSetCode,
              overrideAll: Boolean(document.getElementById('admBulkOverrideAllChk').checked)
            },
            qbState.previewSession.records,
            state,
            answerKeyText
          );
          renderAdminConsole(rootEl, state, api);
        } else {
          api.toast('कृपया पहले CSV, JSON या PDF फ़ाइल चुनें।');
        }
      };
    }

    // Wire Preview Stage Controls if Preview Session is Active
    if (ps) {
      const overrideColSel = document.getElementById('qbOverrideAnswerKeySetColSelect');
      if (overrideColSel) {
        overrideColSel.onchange = () => {
          const newCol = overrideColSel.value || ps.paperSetCode || 'A';
          ps.selectedAnswerKeyColumn = newCol;
          qbState.previewSession = buildAndValidatePreviewSession(
            ps.rawText,
            ps.fileName,
            ps.targetTestId,
            Object.assign({}, ps.batchDefaults, {
              paperSetCode: ps.paperSetCode || 'A',
              answerKeySetColumn: newCol
            }),
            ps.records,
            state,
            ps.answerKeyText
          );
          api.toast(`🔑 Selected Answer Key Column updated to Set ${newCol} (Other columns ignored).`);
          renderAdminConsole(rootEl, state, api);
        };
      }

      const cancelImport = () => {
        qbState.previewSession = null;
        qbState.lastUploadedFileName = '';
        qbState.lastAnswerKeyFileName = '';
        api.toast('🚫 Import cancelled. No questions were saved to the database.');
        renderAdminConsole(rootEl, state, api);
      };
      const cancelTop = document.getElementById('qbCancelImportPreviewBtn');
      const cancelBottom = document.getElementById('qbCancelImportPreviewBottomBtn');
      if (cancelTop) cancelTop.onclick = cancelImport;
      if (cancelBottom) cancelBottom.onclick = cancelImport;

      const verifyAllBtn = document.getElementById('qbVerifyAllExtractedBtn');
      if (verifyAllBtn) {
        verifyAllBtn.onclick = () => {
          ps.records.forEach((r) => {
            if (!r.needsCategorisation && r.verificationStatus !== 'needs_categorisation') {
              r.adminVerified = true;
              r.status = 'verified';
              r.verificationStatus = 'verified';
            }
          });
          api.toast('✅ All categorised questions marked as Admin Verified!');
          renderAdminConsole(rootEl, state, api);
        };
      }

      bodyEl.querySelectorAll('[data-set-preview-ans]').forEach((el) => {
        el.onclick = (ev) => {
          ev.stopPropagation();
          const pair = String(el.getAttribute('data-set-preview-ans') || '').split(':');
          const rIdx = Number(pair[0]);
          const ansIdx = Number(pair[1]);
          const rec = ps.records[rIdx];
          if (!rec || Number.isNaN(ansIdx) || ansIdx < 0 || ansIdx > 3) return;
          rec.rawCorrectIndex = ansIdx;
          rec.correctOptionIndex = ansIdx;
          rec.answerKeyMatched = true;
          if (!rec.needsCategorisation) {
            rec.adminVerified = true;
            rec.status = 'verified';
            rec.verificationStatus = 'verified';
          }
          qbState.previewSession = buildAndValidatePreviewSession(
            ps.rawText,
            ps.fileName,
            ps.targetTestId,
            ps.batchDefaults,
            ps.records,
            state,
            ps.answerKeyText
          );
          api.toast(`✅ Q${rec.questionNumber}: Correct answer set to Option ${['A', 'B', 'C', 'D'][ansIdx]}!`);
          renderAdminConsole(rootEl, state, api);
        };
      });

      bodyEl.querySelectorAll('[data-toggle-verify-preview]').forEach((btn) => {
        btn.onclick = () => {
          const idx = Number(btn.getAttribute('data-toggle-verify-preview'));
          const rec = ps.records[idx];
          if (!rec) return;
          rec.adminVerified = rec.adminVerified === false;
          if (rec.adminVerified && (rec.rawCorrectIndex === '' || rec.rawCorrectIndex === undefined || rec.rawCorrectIndex === null)) {
            rec.rawCorrectIndex = Number(rec.correctOptionIndex || 0);
            rec.answerKeyMatched = true;
          }
          rec.needsCategorisation = false;
          rec.status = rec.adminVerified ? 'verified' : 'unverified';
          rec.verificationStatus = rec.status;
          renderAdminConsole(rootEl, state, api);
        };
      });

      const confirmTaxonomyBtn = document.getElementById('qbConfirmCreateTaxonomyBtn');
      if (confirmTaxonomyBtn) {
        confirmTaxonomyBtn.onclick = () => {
          (ps.unknownTaxonomy || []).forEach((u) => {
            addCustomTaxonomyEntry(state, api, u);
          });
          qbState.previewSession = buildAndValidatePreviewSession(
            ps.rawText,
            ps.fileName,
            ps.targetTestId,
            ps.batchDefaults,
            ps.records,
            state,
            ps.answerKeyText
          );
          api.toast('✅ New Exam Categories, Subjects, Topics & Subtopics added to Master & validated!');
          renderAdminConsole(rootEl, state, api);
        };
      }

      // Preview filter chips
      bodyEl.querySelectorAll('[data-preview-filter]').forEach((chip) => {
        chip.onclick = () => {
          ps.previewFilter = chip.getAttribute('data-preview-filter') || 'all';
          renderAdminConsole(rootEl, state, api);
        };
      });

      // Bulk duplicate resolution buttons
      const mergeAllDupsBtn = document.getElementById('qbMergeAllDuplicatesExamsBtn');
      if (mergeAllDupsBtn) {
        mergeAllDupsBtn.onclick = () => {
          ps.records.forEach((r) => {
            if (r.duplicateInfo) r.duplicateResolution = 'merge_exams';
          });
          api.toast('🔗 All duplicates set to Merge Exam Tags into Canonical Question Record.');
          renderAdminConsole(rootEl, state, api);
        };
      }

      const skipAllDupsBtn = document.getElementById('qbSkipAllDuplicatesBtn');
      if (skipAllDupsBtn) {
        skipAllDupsBtn.onclick = () => {
          ps.records.forEach((r) => {
            if (r.duplicateInfo) r.duplicateResolution = 'skip';
          });
          api.toast('⏭️ All duplicates set to Skip.');
          renderAdminConsole(rootEl, state, api);
        };
      }

      const importAllDupsBtn = document.getElementById('qbImportAllDuplicatesBtn');
      if (importAllDupsBtn) {
        importAllDupsBtn.onclick = () => {
          ps.records.forEach((r) => {
            if (r.duplicateInfo) r.duplicateResolution = 'import_anyway';
          });
          api.toast('✅ All duplicates set to Import Separate Copies.');
          renderAdminConsole(rootEl, state, api);
        };
      }

      // Per-row duplicate action buttons
      bodyEl.querySelectorAll('[data-dup-action]').forEach((btn) => {
        btn.onclick = () => {
          const action = btn.getAttribute('data-dup-action');
          const idx = Number(btn.getAttribute('data-dup-idx'));
          const rec = ps.records[idx];
          if (!rec) return;
          if (action === 'skip' || action === 'import_anyway' || action === 'merge_exams') {
            rec.duplicateResolution = action;
            renderAdminConsole(rootEl, state, api);
          } else if (action === 'review') {
            openDuplicateReviewModal(rec, state, () => {
              qbState.previewSession = buildAndValidatePreviewSession(
                ps.rawText,
                ps.fileName,
                ps.targetTestId,
                ps.batchDefaults,
                ps.records,
                state,
                ps.answerKeyText
              );
              renderAdminConsole(rootEl, state, api);
            });
          }
        };
      });

      // Per-row inline fix/edit button
      bodyEl.querySelectorAll('[data-fix-preview-row]').forEach((btn) => {
        btn.onclick = () => {
          const idx = Number(btn.getAttribute('data-fix-preview-row'));
          const rec = ps.records[idx];
          if (!rec) return;
          openQuestionFormModal({
            title: `✏️ Fix / Categorise Preview Question (Row #${rec.rowNumber} / Q${rec.questionNumber})`,
            question: rec,
            stateRef: state,
            onSave: (updatedFields) => {
              addCustomTaxonomyEntry(state, api, {
                examCode: updatedFields.examCode,
                subjectName: updatedFields.subjectTag,
                topicName: updatedFields.topic,
                subtopicName: updatedFields.subtopic
              });
              Object.assign(rec, updatedFields, {
                rawCorrectIndex: updatedFields.correctOptionIndex,
                needsCategorisation: updatedFields.status === 'needs_categorisation',
                adminVerified: updatedFields.status !== 'unverified' && updatedFields.status !== 'draft' && updatedFields.status !== 'needs_categorisation'
              });
              qbState.previewSession = buildAndValidatePreviewSession(
                ps.rawText,
                ps.fileName,
                ps.targetTestId,
                ps.batchDefaults,
                ps.records,
                state,
                ps.answerKeyText
              );
              api.toast(`✅ Row #${rec.rowNumber} updated and re-validated!`);
              renderAdminConsole(rootEl, state, api);
            }
          });
        };
      });

      // Validate and Continue Action (Executes Safe Batch Import & Generates Import Report)
      const executeValidatedImport = async () => {
        if (Array.isArray(ps.unknownTaxonomy) && ps.unknownTaxonomy.length > 0) {
          ps.unknownTaxonomy.forEach((u) => {
            addCustomTaxonomyEntry(state, api, u);
          });
        }
        const currentAnswerKeyText = document.getElementById('admPdfAnswerKeyInput')
          ? document.getElementById('admPdfAnswerKeyInput').value.trim()
          : (ps.answerKeyText || qbState.pendingAnswerKeyText || '');
        const validated = buildAndValidatePreviewSession(
          ps.rawText,
          ps.fileName,
          document.getElementById('admBulkTargetTest') ? document.getElementById('admBulkTargetTest').value : ps.targetTestId,
          ps.batchDefaults,
          ps.records,
          state,
          currentAnswerKeyText
        );
        qbState.previewSession = validated;

        const detailedRows = [];
        let importedCount = 0;
        let rejectedCount = 0;
        let duplicatesSkippedCount = 0;
        let importedWithWarningsCount = 0;
        const nowIso = new Date().toISOString();

        (validated.fileStructureErrors || []).forEach((fe) => {
          rejectedCount += 1;
          detailedRows.push({
            rowNumber: fe.rowNumber,
            questionNumber: fe.questionNumber,
            outcome: 'REJECTED_ERROR',
            questionId: '-',
            examCode: '-',
            subjectTag: '-',
            topic: '-',
            difficulty: '-',
            issueType: fe.errorType,
            details: fe.reason,
            questionHi: '',
            questionEn: ''
          });
        });

        const centralDocsToBatchSave = [];
        const rawTargetTest = validated.targetTestId !== 'central_bank'
          ? (state.tests || []).find((t) => t.id === validated.targetTestId)
          : null;
        // Never unexpectedly alter already-published tests
        const targetTest = (rawTargetTest && rawTargetTest.status !== 'published') ? rawTargetTest : null;

        validated.records.forEach((rec) => {
          if (rec.errors && rec.errors.length > 0) {
            rejectedCount += 1;
            detailedRows.push({
              rowNumber: rec.rowNumber,
              questionNumber: 'Q' + rec.questionNumber,
              outcome: 'REJECTED_ERROR',
              questionId: '-',
              examCode: rec.examCode,
              subjectTag: rec.subjectTag,
              topic: rec.topic,
              difficulty: rec.difficulty,
              issueType: rec.errors.map((e) => e.errorType).join('; '),
              details: rec.errors.map((e) => e.reason).join(' | '),
              questionHi: rec.questionHi,
              questionEn: rec.questionEn
            });
            return;
          }

          // Duplicate Question Management (Section 9): Canonical Multi-Exam Merge or Skip
          if (rec.duplicateInfo && rec.duplicateResolution !== 'import_anyway') {
            const matchedQ = rec.duplicateInfo.matchedQuestion;
            if (rec.duplicateResolution === 'merge_exams' && matchedQ && matchedQ.id) {
              const canonicalIdx = state.questionBank.findIndex((q) => q.id === matchedQ.id || q.questionId === matchedQ.id);
              if (canonicalIdx >= 0) {
                const canonicalQ = state.questionBank[canonicalIdx];
                const mergedExams = Array.from(new Set([
                  ...(Array.isArray(canonicalQ.examIds) ? canonicalQ.examIds : [canonicalQ.examCode || 'CGPSC']),
                  ...(Array.isArray(rec.examIds) ? rec.examIds : [rec.examCode || 'CGPSC'])
                ])).filter(Boolean);
                canonicalQ.examIds = mergedExams;
                canonicalQ.updatedAt = nowIso;
                canonicalQ.updatedAtIso = nowIso;
                centralDocsToBatchSave.push(canonicalQ);
                duplicatesSkippedCount += 1;
                detailedRows.push({
                  rowNumber: rec.rowNumber,
                  questionNumber: 'Q' + rec.questionNumber,
                  outcome: 'MERGED_EXAMS_CANONICAL',
                  questionId: canonicalQ.id,
                  examCode: mergedExams.join(', '),
                  subjectTag: canonicalQ.subjectTag,
                  topic: canonicalQ.topic,
                  difficulty: canonicalQ.difficultyLevel || canonicalQ.difficulty,
                  issueType: 'Canonical Multi-Exam Merge',
                  details: `Merged exam tags [${mergedExams.join(', ')}] into canonical question (${canonicalQ.id}) without creating a duplicate record.`,
                  questionHi: rec.questionHi,
                  questionEn: rec.questionEn
                });
                return;
              }
            }

            duplicatesSkippedCount += 1;
            detailedRows.push({
              rowNumber: rec.rowNumber,
              questionNumber: 'Q' + rec.questionNumber,
              outcome: 'SKIPPED_DUPLICATE',
              questionId: matchedQ ? matchedQ.id : '-',
              examCode: rec.examCode,
              subjectTag: rec.subjectTag,
              topic: rec.topic,
              difficulty: rec.difficulty,
              issueType: rec.duplicateInfo.matchType,
              details: rec.duplicateInfo.reason,
              questionHi: rec.questionHi,
              questionEn: rec.questionEn
            });
            return;
          }

          const hasWarnings = rec.warnings && rec.warnings.length > 0;
          const salt = (rec.duplicateInfo && rec.duplicateResolution === 'import_anyway')
            ? `dup_override_r${rec.rowNumber}`
            : '';
          const stableId = rec.id || computeDeterministicQuestionId(rec, salt);
          const isNeedsCat = Boolean(rec.needsCategorisation) || rec.verificationStatus === 'needs_categorisation' || rec.status === 'needs_categorisation';
          const isVerifiedDoc = !isNeedsCat && rec.adminVerified !== false && rec.status !== 'unverified' && rec.status !== 'draft';
          const verStatusStr = isNeedsCat ? 'needs_categorisation' : (isVerifiedDoc ? 'verified' : 'unverified');
          const optsHi = Array.isArray(rec.optionsHi) ? rec.optionsHi : ['', '', '', ''];
          const optsEn = Array.isArray(rec.optionsEn) ? rec.optionsEn : ['', '', '', ''];
          const corrIdx = Number(rec.correctOptionIndex || 0);
          const diffVal = normalizeDifficultyValue(rec.difficultyLevel || rec.difficulty) || 'Moderate';
          const examIdsArr = Array.isArray(rec.examIds) && rec.examIds.length > 0 ? rec.examIds : [rec.examCode || 'CGPSC'];

          const finalQuestionDoc = {
            id: stableId,
            questionId: stableId,
            examCode: rec.examCode || examIdsArr[0] || 'CGPSC',
            examIds: examIdsArr,
            subjectId: rec.subjectId || '',
            subjectTag: rec.subjectTag || 'Needs Categorisation',
            topicId: rec.topicId || '',
            topic: rec.topic || 'Needs Categorisation',
            subtopicId: rec.subtopicId || '',
            subtopic: rec.subtopic || '',
            difficulty: diffVal,
            difficultyLevel: diffVal,
            questionType: rec.questionType || 'MCQ',
            sourceExam: rec.sourceExam || '',
            sourceYear: rec.sourceYear || '',
            paperSetCode: rec.paperSetCode || '',
            sourceDocument: rec.sourceDocument || validated.fileName || '',
            sourcePageNumber: rec.sourcePageNumber || '',
            categorisationConfidence: rec.categorisationConfidence != null ? rec.categorisationConfidence : (isNeedsCat ? 20 : 95),
            needsCategorisation: isNeedsCat,
            verificationStatus: verStatusStr,
            languageAvailability: rec.languageAvailability || 'Both',
            pyqTag: rec.pyqTag || (rec.tags && rec.tags[0]) || '',
            tags: Array.isArray(rec.tags) ? rec.tags : [],
            status: verStatusStr,
            verified: isVerifiedDoc,
            adminVerified: isVerifiedDoc,
            isDeleted: false,
            importSource: rec.importSource || validated.fileType.toLowerCase(),
            questionHi: rec.questionHi,
            questionEn: rec.questionEn,
            optA_Hi: optsHi[0] || '',
            optB_Hi: optsHi[1] || '',
            optC_Hi: optsHi[2] || '',
            optD_Hi: optsHi[3] || '',
            optA_En: optsEn[0] || '',
            optB_En: optsEn[1] || '',
            optC_En: optsEn[2] || '',
            optD_En: optsEn[3] || '',
            optionsHi: optsHi,
            optionsEn: optsEn,
            correctIndex: corrIdx,
            correctOptionIndex: corrIdx,
            explanationHi: rec.explanationHi || rec.explanationEn || 'विस्तृत व्याख्या उपलब्ध है।',
            explanationEn: rec.explanationEn || rec.explanationHi || 'Detailed explanation available.',
            linkedTestIds: (targetTest && isVerifiedDoc) ? [targetTest.id] : [],
            createdAt: nowIso,
            updatedAt: nowIso,
            createdAtIso: nowIso,
            updatedAtIso: nowIso
          };

          // Upsert into Central Reusable Question Bank without duplicate IDs
          const existingIdx = state.questionBank.findIndex((q) => q.id === stableId || q.questionId === stableId);
          if (existingIdx >= 0) {
            const existingQ = state.questionBank[existingIdx];
            const mergedLinked = Array.from(new Set([
              ...(existingQ.linkedTestIds || []),
              ...(finalQuestionDoc.linkedTestIds || [])
            ]));
            const mergedExamIds = Array.from(new Set([
              ...(Array.isArray(existingQ.examIds) ? existingQ.examIds : [existingQ.examCode || 'CGPSC']),
              ...examIdsArr
            ])).filter(Boolean);
            state.questionBank[existingIdx] = Object.assign({}, existingQ, finalQuestionDoc, {
              examIds: mergedExamIds,
              linkedTestIds: mergedLinked,
              createdAt: existingQ.createdAt || existingQ.createdAtIso || nowIso
            });
            centralDocsToBatchSave.push(state.questionBank[existingIdx]);
          } else {
            state.questionBank.unshift(finalQuestionDoc);
            centralDocsToBatchSave.push(finalQuestionDoc);
          }

          // If a DRAFT Target Test is selected and question is verified, also associate with Target Test (preventing duplicates)
          if (targetTest && isVerifiedDoc) {
            targetTest.questions = targetTest.questions || [];
            const refId = `${targetTest.id}_ref_${stableId}`;
            const normHiNew = normalizeTextForComparison(finalQuestionDoc.questionHi);
            const normEnNew = normalizeTextForComparison(finalQuestionDoc.questionEn);
            const existingInTestIdx = targetTest.questions.findIndex(
              (tq) => tq.id === refId || tq.centralQuestionId === stableId || tq.id === stableId ||
                (normHiNew && normalizeTextForComparison(tq.questionHi) === normHiNew) ||
                (normEnNew && normalizeTextForComparison(tq.questionEn) === normEnNew)
            );
            const testQuestionRecord = Object.assign({}, finalQuestionDoc, {
              id: refId,
              centralQuestionId: stableId
            });
            if (existingInTestIdx >= 0) {
              targetTest.questions[existingInTestIdx] = testQuestionRecord;
            } else {
              targetTest.questions.push(testQuestionRecord);
            }
          }

          importedCount += 1;
          if (hasWarnings || isNeedsCat) importedWithWarningsCount += 1;

          detailedRows.push({
            rowNumber: rec.rowNumber,
            questionNumber: 'Q' + rec.questionNumber,
            outcome: (hasWarnings || isNeedsCat) ? 'IMPORTED_WITH_WARNING' : 'IMPORTED',
            questionId: stableId,
            examCode: finalQuestionDoc.examIds.join(', '),
            subjectTag: finalQuestionDoc.subjectTag,
            topic: finalQuestionDoc.topic,
            difficulty: finalQuestionDoc.difficultyLevel,
            issueType: isNeedsCat ? 'Needs Categorisation' : (hasWarnings ? rec.warnings.map((w) => w.warningType).join('; ') : (rec.duplicateInfo ? 'Imported Duplicate Override' : (isVerifiedDoc ? 'Verified' : 'Unverified'))),
            details: isNeedsCat
              ? 'Saved with status "Needs Categorisation" (excluded from automatic test generation until Admin assigns Subject/Topic).'
              : (hasWarnings
                ? rec.warnings.map((w) => w.reason).join(' | ')
                : (isVerifiedDoc ? 'Verified and saved to Central Reusable Question Bank (eligible for automatic test generation).' : 'Saved as unverified (excluded from automatic test generation until verified).')),
            questionHi: finalQuestionDoc.questionHi,
            questionEn: finalQuestionDoc.questionEn
          });
        });

        const topBtn = document.getElementById('qbValidateAndContinueBtn');
        const botBtn = document.getElementById('qbValidateAndContinueBottomBtn');
        if (topBtn) {
          topBtn.disabled = true;
          topBtn.textContent = '⏳ Importing & Syncing...';
        }
        if (botBtn) {
          botBtn.disabled = true;
          botBtn.textContent = '⏳ Importing & Syncing...';
        }

        api.saveState();

        if (window.CGpediaCloud) {
          if (centralDocsToBatchSave.length > 0 && window.CGpediaCloud.batchSaveCloudDocs) {
            await window.CGpediaCloud.batchSaveCloudDocs('question_bank', centralDocsToBatchSave);
          }
          if (targetTest) {
            await window.CGpediaCloud.saveCloudDoc('tests', targetTest.id, targetTest);
          }
          if (typeof window.CGpediaCloud.invalidateQuestionBankQueryCache === 'function') {
            window.CGpediaCloud.invalidateQuestionBankQueryCache();
          }
        }

        qbState.lastImportReport = {
          fileName: validated.fileName,
          targetLabel: targetTest ? `Draft Test: ${targetTest.titleHi} (+ Central Reusable Bank)` : 'Central Reusable Question Bank',
          timestamp: nowIso,
          totalDetected: validated.records.length,
          importedCount,
          rejectedCount,
          duplicatesSkippedCount,
          importedWithWarningsCount,
          detailedRows,
          expanded: (rejectedCount > 0 || duplicatesSkippedCount > 0 || importedWithWarningsCount > 0)
        };

        qbState.previewSession = null;
        qbState.pendingAnswerKeyText = '';
        qbState.lastUploadedFileName = '';
        qbState.lastAnswerKeyFileName = '';
        api.toast(`✅ Import complete: ${importedCount} imported to Central Question Bank, ${duplicatesSkippedCount} duplicate(s) merged/skipped, ${rejectedCount} rejected.`);
        renderAdminConsole(rootEl, state, api);
      };

      const validateTopBtn = document.getElementById('qbValidateAndContinueBtn');
      const validateBottomBtn = document.getElementById('qbValidateAndContinueBottomBtn');
      if (validateTopBtn) validateTopBtn.onclick = executeValidatedImport;
      if (validateBottomBtn) validateBottomBtn.onclick = executeValidatedImport;
    }

    // Wire Post-Import Report Controls
    const dlReportBtn = document.getElementById('qbDownloadImportReportCsvBtn');
    if (dlReportBtn && rep) {
      dlReportBtn.onclick = () => {
        downloadImportReportCsv(rep);
        api.toast('⬇️ Import report downloaded as CSV!');
      };
    }
    const dismissReportBtn = document.getElementById('qbDismissImportReportBtn');
    if (dismissReportBtn) {
      dismissReportBtn.onclick = () => {
        qbState.lastImportReport = null;
        renderAdminConsole(rootEl, state, api);
      };
    }

    // Wire Repository Search & Cascading Filter Controls
    const searchInput = document.getElementById('qbRepoSearchInput');
    if (searchInput) {
      searchInput.oninput = () => {
        const pos = searchInput.selectionStart;
        qbState.filters.search = searchInput.value;
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
        const nextInput = document.getElementById('qbRepoSearchInput');
        if (nextInput) {
          nextInput.focus();
          try { nextInput.setSelectionRange(pos, pos); } catch (_) {}
        }
      };
    }

    const bindFilterSelect = (elId, filterKey, onCascadeReset) => {
      const el = document.getElementById(elId);
      if (el) {
        el.onchange = () => {
          qbState.filters[filterKey] = el.value;
          if (typeof onCascadeReset === 'function') onCascadeReset();
          qbState.page = 1;
          renderAdminConsole(rootEl, state, api);
        };
      }
    };
    bindFilterSelect('qbFilterExam', 'examCode');
    bindFilterSelect('qbFilterSubject', 'subject', () => {
      qbState.filters.topic = 'ALL';
      qbState.filters.subtopic = 'ALL';
    });
    bindFilterSelect('qbFilterTopic', 'topic', () => {
      qbState.filters.subtopic = 'ALL';
    });
    bindFilterSelect('qbFilterSubtopic', 'subtopic');
    bindFilterSelect('qbFilterDifficulty', 'difficulty');
    bindFilterSelect('qbFilterLanguage', 'language');
    bindFilterSelect('qbFilterStatus', 'status');

    // Wire Selection Checkboxes
    const selectAllPageChk = document.getElementById('qbSelectAllPageChk');
    if (selectAllPageChk) {
      selectAllPageChk.onchange = () => {
        pageItems.forEach((q) => {
          if (selectAllPageChk.checked) qbState.selectedIds.add(q.id);
          else qbState.selectedIds.delete(q.id);
        });
        renderAdminConsole(rootEl, state, api);
      };
    }

    const selectAllFilteredBtn = document.getElementById('qbSelectAllFilteredBtn');
    if (selectAllFilteredBtn) {
      selectAllFilteredBtn.onclick = () => {
        filteredBank.forEach((q) => qbState.selectedIds.add(q.id));
        renderAdminConsole(rootEl, state, api);
      };
    }

    const clearSelectionBtn = document.getElementById('qbClearSelectionBtn');
    if (clearSelectionBtn) {
      clearSelectionBtn.onclick = () => {
        qbState.selectedIds.clear();
        renderAdminConsole(rootEl, state, api);
      };
    }

    bodyEl.querySelectorAll('[data-qb-row-select]').forEach((chk) => {
      chk.onchange = () => {
        const qid = chk.getAttribute('data-qb-row-select');
        if (chk.checked) qbState.selectedIds.add(qid);
        else qbState.selectedIds.delete(qid);
        renderAdminConsole(rootEl, state, api);
      };
    });

    // Wire Export Buttons (Selected or Filtered)
    const getExportTargetQuestions = () => {
      if (qbState.selectedIds.size > 0) {
        return activeBankPool.filter((q) => qbState.selectedIds.has(q.id));
      }
      return filteredBank;
    };

    const exportCsvBtn = document.getElementById('qbExportFilteredCsvBtn');
    if (exportCsvBtn) {
      exportCsvBtn.onclick = () => {
        const list = getExportTargetQuestions();
        if (list.length === 0) {
          api.toast('⚠️ No questions available to export.');
          return;
        }
        exportQuestionsToCsv(list);
        api.toast(`⬇️ Exported ${list.length} question(s) to CSV!`);
      };
    }

    const exportJsonBtn = document.getElementById('qbExportFilteredJsonBtn');
    if (exportJsonBtn) {
      exportJsonBtn.onclick = () => {
        const list = getExportTargetQuestions();
        if (list.length === 0) {
          api.toast('⚠️ No questions available to export.');
          return;
        }
        exportQuestionsToJson(list);
        api.toast(`⬇️ Exported ${list.length} question(s) to JSON!`);
      };
    }

    // Wire Bulk Edit, Bulk Assign to Test, and Bulk Delete
    const bulkEditBtn = document.getElementById('qbBulkEditBtn');
    if (bulkEditBtn) {
      bulkEditBtn.onclick = () => {
        if (qbState.selectedIds.size === 0) return;
        openBulkEditModal(qbState.selectedIds.size, state, api, async (changes) => {
          if (changes.examCode || changes.subjectTag || changes.topic || changes.subtopic) {
            addCustomTaxonomyEntry(state, api, {
              examCode: changes.examCode,
              subjectName: changes.subjectTag,
              topicName: changes.topic,
              subtopicName: changes.subtopic
            });
          }
          const updatedCatalog = getTaxonomyCatalog(state);
          const updatedDocs = [];
          const newTags = changes.tagsText
            ? changes.tagsText.split(',').map((t) => t.trim()).filter(Boolean)
            : [];
          const nowIso = new Date().toISOString();

          state.questionBank.forEach((q) => {
            if (!qbState.selectedIds.has(q.id)) return;
            if (changes.examCode) q.examCode = changes.examCode;
            if (Array.isArray(changes.examIds) && changes.examIds.length > 0) {
              if (changes.replaceExamIds) {
                q.examIds = Array.from(new Set([ ...(changes.examCode ? [changes.examCode] : []), ...changes.examIds ]));
              } else {
                const cur = Array.isArray(q.examIds) ? q.examIds : [q.examCode || 'CGPSC'];
                q.examIds = Array.from(new Set([...cur, ...(changes.examCode ? [changes.examCode] : []), ...changes.examIds]));
              }
              q.examCode = q.examCode || q.examIds[0] || 'CGPSC';
            } else if (changes.examCode) {
              const cur = Array.isArray(q.examIds) ? q.examIds : [];
              q.examIds = Array.from(new Set([changes.examCode, ...cur]));
            }
            if (changes.difficulty) {
              const normDiff = normalizeDifficultyValue(changes.difficulty) || 'Moderate';
              q.difficulty = normDiff;
              q.difficultyLevel = normDiff;
            }
            if (changes.subjectTag) q.subjectTag = changes.subjectTag;
            if (changes.topic) q.topic = changes.topic;
            if (changes.subtopic) q.subtopic = changes.subtopic;

            // Resolve canonical Subject/Topic/Subtopic IDs
            const resolved = resolveCanonicalQuestionHierarchy(q, updatedCatalog);
            q.subjectId = resolved.subjectId || q.subjectId || '';
            q.subjectTag = resolved.subjectTag || q.subjectTag;
            q.topicId = resolved.topicId || q.topicId || '';
            q.topic = resolved.topic || q.topic;
            q.subtopicId = resolved.subtopicId || q.subtopicId || '';
            q.subtopic = resolved.subtopic || q.subtopic || '';

            if (changes.status) {
              q.status = changes.status;
              q.verificationStatus = changes.status;
              q.needsCategorisation = changes.status === 'needs_categorisation';
              q.verified = changes.status === 'verified' || changes.status === 'active';
              q.adminVerified = q.verified;
            } else if (q.subjectId && q.topicId && q.needsCategorisation) {
              q.needsCategorisation = false;
              q.status = 'verified';
              q.verificationStatus = 'verified';
              q.verified = true;
              q.adminVerified = true;
            }
            if (newTags.length > 0) {
              q.tags = Array.from(new Set([...(q.tags || []), ...newTags]));
              q.pyqTag = q.pyqTag || newTags[0];
            }
            q.updatedAt = nowIso;
            q.updatedAtIso = nowIso;
            updatedDocs.push(q);
          });

          api.saveState();
          if (window.CGpediaCloud && window.CGpediaCloud.batchSaveCloudDocs && updatedDocs.length > 0) {
            await window.CGpediaCloud.batchSaveCloudDocs('question_bank', updatedDocs);
          }
          api.toast(`✅ Bulk categorised & updated ${updatedDocs.length} question(s)!`);
          renderAdminConsole(rootEl, state, api);
        });
      };
    }

    const bulkAssignTestBtn = document.getElementById('qbBulkAssignTestBtn');
    if (bulkAssignTestBtn) {
      bulkAssignTestBtn.onclick = () => {
        const selectedQs = activeBankPool.filter((q) => qbState.selectedIds.has(q.id));
        if (selectedQs.length === 0) return;
        openAssignToTestModal(selectedQs, state, api, () => {
          renderAdminConsole(rootEl, state, api);
        });
      };
    }

    const bulkDeleteBtn = document.getElementById('qbBulkDeleteBtn');
    if (bulkDeleteBtn) {
      bulkDeleteBtn.onclick = () => {
        const idsToDelete = Array.from(qbState.selectedIds);
        if (idsToDelete.length === 0) return;
        openConfirmationDialog({
          title: 'Confirm Bulk Delete',
          message: `Are you sure you want to permanently delete ${idsToDelete.length} selected question(s) from the Central Question Bank?`,
          confirmLabel: `Yes, Delete ${idsToDelete.length} Question(s)`,
          isDanger: true,
          onConfirm: async () => {
            const delSet = new Set(idsToDelete);
            state.questionBank = (state.questionBank || []).filter((q) => !delSet.has(q.id));
            qbState.selectedIds.clear();
            api.saveState();
            if (window.CGpediaCloud && window.CGpediaCloud.batchDeleteCloudDocs) {
              await window.CGpediaCloud.batchDeleteCloudDocs('question_bank', idsToDelete);
            }
            api.toast(`🗑️ Deleted ${idsToDelete.length} question(s) from Central Question Bank.`);
            renderAdminConsole(rootEl, state, api);
          }
        });
      };
    }

    // Wire 1-click Verify button in Central Question Bank Repository
    bodyEl.querySelectorAll('[data-verify-qbank]').forEach((btn) => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-verify-qbank');
        const qObj = (state.questionBank || []).find((q) => q.id === qid);
        if (!qObj) return;
        qObj.status = 'verified';
        qObj.verificationStatus = 'verified';
        qObj.needsCategorisation = false;
        qObj.verified = true;
        qObj.adminVerified = true;
        qObj.isDeleted = false;
        qObj.updatedAt = new Date().toISOString();
        qObj.updatedAtIso = qObj.updatedAt;
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('question_bank', qObj.id, qObj);
        api.toast('✅ Question verified and eligible for automatic test generation!');
        renderAdminConsole(rootEl, state, api);
      };
    });

    // Wire Individual Row Expand, Edit, and Delete with Confirmation
    bodyEl.querySelectorAll('[data-toggle-expand-qb]').forEach((btn) => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-toggle-expand-qb');
        if (qbState.expandedIds.has(qid)) qbState.expandedIds.delete(qid);
        else qbState.expandedIds.add(qid);
        renderAdminConsole(rootEl, state, api);
      };
    });

    bodyEl.querySelectorAll('[data-edit-qbank]').forEach((btn) => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-edit-qbank');
        const qObj = (state.questionBank || []).find((q) => q.id === qid);
        if (!qObj) return;
        openQuestionFormModal({
          title: `✏️ Edit Question & Hierarchy (${qObj.id})`,
          question: qObj,
          stateRef: state,
          onSave: (updatedFields) => {
            addCustomTaxonomyEntry(state, api, {
              examCode: updatedFields.examCode,
              subjectName: updatedFields.subjectTag,
              topicName: updatedFields.topic,
              subtopicName: updatedFields.subtopic
            });
            const isVer = updatedFields.status === 'verified' || updatedFields.status === 'active';
            Object.assign(qObj, updatedFields, {
              verified: isVer,
              adminVerified: isVer
            });
            // Only update linked references in DRAFT tests (never alter already published tests)
            (state.tests || []).forEach((t) => {
              if (t.status === 'published') return;
              let changed = false;
              (t.questions || []).forEach((tq) => {
                if (tq.centralQuestionId === qObj.id || tq.id === qObj.id) {
                  Object.assign(tq, updatedFields, { id: tq.id, centralQuestionId: qObj.id });
                  changed = true;
                }
              });
              if (changed && window.CGpediaCloud) {
                window.CGpediaCloud.saveCloudDoc('tests', t.id, t);
              }
            });
            api.saveState();
            if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('question_bank', qObj.id, qObj);
            api.toast('✅ Question updated in Central Bank (published tests preserved unchanged)!');
            renderAdminConsole(rootEl, state, api);
          }
        });
      };
    });

    bodyEl.querySelectorAll('[data-del-qbank]').forEach((btn) => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-del-qbank');
        const qObj = (state.questionBank || []).find((q) => q.id === qid);
        if (!qObj) return;
        openConfirmationDialog({
          title: 'Confirm Question Deletion',
          message: `Are you sure you want to delete this question ("${(qObj.questionHi || qObj.questionEn || '').slice(0, 80)}...") from the Central Question Bank?`,
          confirmLabel: 'Yes, Delete Question',
          isDanger: true,
          onConfirm: () => {
            state.questionBank = (state.questionBank || []).filter((q) => q.id !== qid);
            qbState.selectedIds.delete(qid);
            api.saveState();
            if (window.CGpediaCloud) window.CGpediaCloud.deleteCloudDoc('question_bank', qid);
            api.toast('🗑️ Question deleted from Central Question Bank.');
            renderAdminConsole(rootEl, state, api);
          }
        });
      };
    });

    // Wire Pagination Controls
    const pageSizeSelect = document.getElementById('qbPageSizeSelect');
    if (pageSizeSelect) {
      pageSizeSelect.onchange = () => {
        qbState.pageSize = Number(pageSizeSelect.value || 15);
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }

    const prevPageBtn = document.getElementById('qbPrevPageBtn');
    if (prevPageBtn) {
      prevPageBtn.onclick = () => {
        if (qbState.page > 1) {
          qbState.page -= 1;
          renderAdminConsole(rootEl, state, api);
        }
      };
    }

    const nextPageBtn = document.getElementById('qbNextPageBtn');
    if (nextPageBtn) {
      nextPageBtn.onclick = () => {
        if (qbState.page < totalPages) {
          qbState.page += 1;
          renderAdminConsole(rootEl, state, api);
        }
      };
    }
  }

  window.CGpediaAdmin = {
    renderAdminConsole,
    parseRawImportFile,
    parsePdfOcrAndMatchAnswerKey,
    parseAnswerKeyMap,
    buildAndValidatePreviewSession,
    getTaxonomyCatalog,
    autoCategorizeQuestionFromMaster,
    migrateExistingQuestionBankRecords,
    upsertCategoryMasterItem,
    renameCategoryMasterItem
  };
})();
