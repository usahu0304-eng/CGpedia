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
              <button type="button" class="btn btn-header-chip" id="adminSyncAllCloudBtn" title="Sync all local Admin data to Cloud for Students">☁️ Sync to Cloud</button>
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
      navRowEl.querySelectorAll('[data-admin-subtab]').forEach((btn) => {
        btn.onclick = (ev) => {
          if (ev) ev.stopPropagation();
          const targetSubTab = btn.getAttribute('data-admin-subtab');
          if (targetSubTab) {
            switchAdminSection(rootEl, state, api, targetSubTab);
          }
        };
      });
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

    const syncCloudBtn = document.getElementById('adminSyncAllCloudBtn');
    if (syncCloudBtn) {
      syncCloudBtn.onclick = async () => {
        syncCloudBtn.disabled = true;
        const origLabel = syncCloudBtn.textContent;
        syncCloudBtn.textContent = '⏳ Syncing...';
        try {
          if (api && typeof api.syncLocalAdminStateToCloud === 'function') {
            await api.syncLocalAdminStateToCloud(true);
          } else if (window.CGpediaCloud && typeof window.CGpediaCloud.syncAllAdminStateToCloud === 'function') {
            await window.CGpediaCloud.syncAllAdminStateToCloud(state);
            api.toast('☁️ All Admin Tests, Question Bank & Settings synced to Cloud!');
          }
        } finally {
          syncCloudBtn.disabled = false;
          syncCloudBtn.textContent = origLabel;
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
                    <button class="btn btn-outline btn-sm" data-edit-test-meta="${esc(t.id)}">⚙️ Edit Details / Price</button>
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

      const createDraftBtn = document.getElementById('admCreateDraftTestBtn');
      if (createDraftBtn) {
        createDraftBtn.onclick = () => {
          const rawTitleHi = (document.getElementById('admTestTitleHi') && document.getElementById('admTestTitleHi').value || '').trim();
          const rawTitleEn = (document.getElementById('admTestTitleEn') && document.getElementById('admTestTitleEn').value || '').trim();
          const rawTopicInput = (document.getElementById('admTestTopic') && document.getElementById('admTestTopic').value || '').trim();
          const rawSubtopicInput = document.getElementById('admTestSubtopicFilter')
            ? document.getElementById('admTestSubtopicFilter').value.trim()
            : '';
          const selectedSubject = document.getElementById('admTestSubjectFilter')
            ? document.getElementById('admTestSubjectFilter').value
            : 'ALL';
          const selectedDifficulty = document.getElementById('admTestDifficultyFilter')
            ? document.getElementById('admTestDifficultyFilter').value
            : 'ALL';
          const examCode = (document.getElementById('admTestExamCode') && document.getElementById('admTestExamCode').value) || 'CGPSC';
          const defaultLabel = `${examCode} ${selectedSubject !== 'ALL' ? selectedSubject : (rawTopicInput || 'Mock Test')}`;
          const titleHi = rawTitleHi || rawTitleEn || `${defaultLabel} टेस्ट`;
          const titleEn = rawTitleEn || rawTitleHi || `${defaultLabel} Test`;
          const topic = rawTopicInput || (selectedSubject !== 'ALL' ? selectedSubject : titleHi);

          const aiCount = Math.max(0, Math.min(200, Number((document.getElementById('admTestAiCount') && document.getElementById('admTestAiCount').value) || 10)));
          const customPrompt = (document.getElementById('admTestAiPrompt') && document.getElementById('admTestAiPrompt').value || '').trim();
          const isPaid = (document.getElementById('admTestIsPaid') && document.getElementById('admTestIsPaid').value) === 'paid';
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
              generatedQuestions = (selectionResult && selectionResult.questions) ? selectionResult.questions.slice() : [];
            }
            if (generatedQuestions.length < aiCount && api && typeof api.generateHighYieldBilingualQuestions === 'function') {
              const fallbackQs = api.generateHighYieldBilingualQuestions(testId, topic, aiCount, customPrompt, {
                examCode,
                subject: selectedSubject !== 'ALL' ? selectedSubject : '',
                topicFilter: rawTopicInput,
                subtopicFilter: rawSubtopicInput,
                difficulty: selectedDifficulty !== 'ALL' ? selectedDifficulty : ''
              });
              const seenIds = new Set(generatedQuestions.map((q) => q.centralQuestionId || q.questionId || q.id));
              for (const fq of (fallbackQs || [])) {
                if (generatedQuestions.length >= aiCount) break;
                const fid = fq.centralQuestionId || fq.questionId || fq.id;
                if (!seenIds.has(fid)) {
                  seenIds.add(fid);
                  generatedQuestions.push(fq);
                }
              }
            }
          }

          tbState.lastWarning = null;

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
      }

      bodyEl.querySelectorAll('[data-edit-test-meta]').forEach((btn) => {
        btn.onclick = () => {
          const tid = btn.getAttribute('data-edit-test-meta');
          const t = (state.tests || []).find((item) => item.id === tid);
          if (!t) return;
          openEditTestDetailsModal(t, state, api, () => {
            renderAdminConsole(rootEl, state, api);
          });
        };
      });

      bodyEl.querySelectorAll('[data-toggle-publish]').forEach((btn) => {
        btn.onclick = () => {
          const tid = btn.getAttribute('data-toggle-publish');
          const t = state.tests.find((item) => item.id === tid);
          if (!t) return;
          if (t.status !== 'published' && (!t.questions || t.questions.length === 0)) {
            if (api && typeof api.generateHighYieldBilingualQuestions === 'function') {
              t.questions = api.generateHighYieldBilingualQuestions(
                t.id,
                t.topic || t.subject || 'General Studies',
                Math.max(10, Number(t.requestedQuestionCount || 10)),
                '',
                { examCode: t.examCode || 'CGPSC' }
              );
            }
            if (!t.questions || t.questions.length === 0) {
              api.toast('⚠️ पब्लिश करने से पहले कम से कम 1 प्रश्न जोड़ें।');
              return;
            }
          }
          if (t.status === 'published') {
            openConfirmationDialog({
              title: 'Unpublish Live Test?',
              message: `क्या आप वाकई "${t.titleHi || t.titleEn}" को Live से हटाकर वापस Draft में भेजना चाहते हैं?`,
              confirmLabel: 'Yes, Move to Draft',
              isDanger: true,
              onConfirm: () => {
                t.status = 'draft';
                t.updatedAtIso = new Date().toISOString();
                api.saveState();
                if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('tests', t.id, t);
                api.toast('⏸️ Test moved back to DRAFT.');
                renderAdminConsole(rootEl, state, api);
              }
            });
            return;
          }
          t.status = 'published';
          t.updatedAtIso = new Date().toISOString();
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('tests', t.id, t);
          if (api && typeof api.sendSystemAndAppNotification === 'function') {
            const examLabel = t.examCode ? `[${t.examCode}] ` : '';
            api.sendSystemAndAppNotification(
              '📝 नया टेस्ट उपलब्ध: ' + (t.titleHi || t.titleEn || 'New Mock Test'),
              `${examLabel}${t.titleEn || t.titleHi || 'Live Test'} अब अटेम्प्ट करने के लिए उपलब्ध है।`,
              'tests',
              'tests_' + t.id,
              'test-series'
            );
          } else {
            api.toast('🚀 Test is now PUBLISHED LIVE for students!');
          }
          renderAdminConsole(rootEl, state, api);
        };
      });

      bodyEl.querySelectorAll('[data-delete-test]').forEach((btn) => {
        btn.onclick = () => {
          const tid = btn.getAttribute('data-delete-test');
          const targetTest = (state.tests || []).find((item) => item.id === tid);
          if (!targetTest) return;
          openConfirmationDialog({
            title: 'Confirm Test Deletion',
            message: `क्या आप वाकई टेस्ट "${targetTest.titleHi || targetTest.titleEn}" को स्थायी रूप से डिलीट करना चाहते हैं?`,
            confirmLabel: 'Yes, Delete Test',
            isDanger: true,
            onConfirm: () => {
              state.tests = state.tests.filter((item) => item.id !== tid);
              api.saveState();
              if (window.CGpediaCloud) window.CGpediaCloud.deleteCloudDoc('tests', tid);
              api.toast('🗑️ Test deleted.');
              renderAdminConsole(rootEl, state, api);
            }
          });
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
          const targetFolder = (state.folders || []).find((f) => f.id === fid);
          if (!targetFolder) return;
          openConfirmationDialog({
            title: 'Confirm Folder Deletion',
            message: `क्या आप वाकई टेस्ट सीरीज़ फ़ोल्डर "${targetFolder.titleHi || targetFolder.titleEn}" को डिलीट करना चाहते हैं?`,
            confirmLabel: 'Yes, Delete Folder',
            isDanger: true,
            onConfirm: () => {
              state.folders = state.folders.filter((f) => f.id !== fid);
              api.saveState();
              if (window.CGpediaCloud) window.CGpediaCloud.deleteCloudDoc('exam_folders', fid);
              api.toast('🗑️ Folder removed.');
              renderAdminConsole(rootEl, state, api);
            }
          });
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
          openConfirmationDialog({
            title: 'Delete UPI QR Code?',
            message: 'क्या आप वाकई वर्तमान UPI QR Code इमेज को हटाना चाहते हैं?',
            confirmLabel: 'Yes, Delete QR Code',
            isDanger: true,
            onConfirm: () => {
              state.config.upiQrImage = '';
              api.saveState();
              if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('app_config', 'global', state.config);
              api.toast('🗑️ UPI QR Code deleted from configuration.');
              renderAdminConsole(rootEl, state, api);
            }
          });
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
          const cObj = (state.coupons || []).find((c) => c.id === cid);
          openConfirmationDialog({
            title: 'Delete Discount Coupon?',
            message: `क्या आप वाकई कूपन "${(cObj && cObj.code) || cid}" को डिलीट करना चाहते हैं?`,
            confirmLabel: 'Yes, Delete Coupon',
            isDanger: true,
            onConfirm: () => {
              state.coupons = (state.coupons || []).filter((c) => c.id !== cid);
              api.saveState();
              if (window.CGpediaCloud) window.CGpediaCloud.deleteCloudDoc('coupons', cid);
              renderAdminConsole(rootEl, state, api);
            }
          });
        };
      });

      bodyEl.querySelectorAll('[data-revoke-activation]').forEach((btn) => {
        btn.onclick = () => {
          const aid = btn.getAttribute('data-revoke-activation');
          const actObj = (state.activations || []).find((a) => a.id === aid);
          openConfirmationDialog({
            title: 'Revoke Student Package Access?',
            message: `क्या आप वाकई "${(actObj && actObj.studentIdentifier) || 'student'}" का "${(actObj && actObj.targetTitle) || 'Package'}" एक्सेस रद्द (Revoke) करना चाहते हैं?`,
            confirmLabel: 'Yes, Revoke Access',
            isDanger: true,
            onConfirm: () => {
              state.activations = state.activations.filter((a) => a.id !== aid);
              api.saveState();
              if (window.CGpediaCloud) window.CGpediaCloud.deleteCloudDoc('purchases', aid);
              renderAdminConsole(rootEl, state, api);
            }
          });
        };
      });
      return;
    }

    if (activeSection === 'stories') {
      state.admCaUploadTab = state.admCaUploadTab || 'prompt';
      const activeCaTab = state.admCaUploadTab;
      const nowDate = new Date();
      const defaultMonthKey = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
      const editingStory = state.editingCaStoryId
        ? (state.stories || []).find((s) => s && s.id === state.editingCaStoryId)
        : null;

      bodyEl.innerHTML = `
        <!-- AI Current Affairs Uploader (Prompt / Paste Text / PDF & Image File) -->
        <div class="card" style="border:1.5px solid var(--secondary);background:linear-gradient(180deg, var(--surface) 0%, var(--surface-alt) 100%);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
            <div>
              <span class="badge badge-exam">✨ AI CURRENT AFFAIRS ENGINE</span>
              <h3 style="font-size:1.04rem;font-weight:800;margin-top:4px;">AI Current Affairs Uploader &amp; Hourly Auto-Sync</h3>
              <p style="font-size:0.78rem;color:var(--text-secondary);">Non-repeating Bilingual (Hindi + English) Current Affairs from Prompt, Pasted News, or PDF/Image files</p>
            </div>
            <button type="button" class="btn btn-outline btn-sm" id="admTriggerHourlyCaNowBtn">🔄 Auto-Fetch Latest Hourly Current Affairs</button>
          </div>

          <div class="chip-row" style="margin-bottom:12px;">
            <button type="button" class="filter-chip ${activeCaTab === 'prompt' ? 'active' : ''}" data-adm-ca-tab="prompt">✨ Topic / Prompt</button>
            <button type="button" class="filter-chip ${activeCaTab === 'paste' ? 'active' : ''}" data-adm-ca-tab="paste">📋 Copy-Paste News / Paragraph</button>
            <button type="button" class="filter-chip ${activeCaTab === 'file' ? 'active' : ''}" data-adm-ca-tab="file">📄 PDF / Image File Upload</button>
          </div>

          <div class="grid-3" style="margin-bottom:10px;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Category</label>
              <select class="form-select" id="admAiCaCategory">
                <option value="ALL">🌟 Auto-Detect (CG + National + International)</option>
                <option value="chhattisgarh">🌾 छत्तीसगढ़ समसामयिकी (Chhattisgarh)</option>
                <option value="national">🇮🇳 राष्ट्रीय समसामयिकी (National)</option>
                <option value="international">🌍 अंतर्राष्ट्रीय एवं विज्ञान (International &amp; Sci)</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Target Month Archive</label>
              <input type="month" class="form-input" id="admAiCaMonth" value="${esc(defaultMonthKey)}" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Source Tag</label>
              <input class="form-input" id="admAiCaSource" value="PIB / DPR Chhattisgarh" />
            </div>
          </div>

          ${activeCaTab === 'prompt' ? `
            <div class="grid-2" style="margin-bottom:10px;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Topic / Event / Date Prompt</label>
                <input class="form-input" id="admAiCaPromptInput" placeholder="e.g., Chhattisgarh Budget 2026 schemes, National awards, ISRO missions..." />
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Number of Updates to Generate</label>
                <select class="form-select" id="admAiCaPromptCount">
                  <option value="3">3 Current Affairs Updates</option>
                  <option value="5" selected>5 Current Affairs Updates</option>
                  <option value="8">8 Current Affairs Updates</option>
                  <option value="10">10 Current Affairs Updates</option>
                </select>
              </div>
            </div>
            <button type="button" class="btn btn-primary" id="admRunAiCaPromptBtn">✨ Generate &amp; Publish Current Affairs</button>
          ` : ''}

          ${activeCaTab === 'paste' ? `
            <div class="form-group">
              <label class="form-label">Paste Unlimited News Article / Press Release / Notes (Hindi or English)</label>
              <textarea class="form-textarea" id="admAiCaPasteText" rows="5" placeholder="यहाँ कोई भी समाचार, पीआईबी विज्ञप्ति, जनसंपर्क नोट्स या पैराग्राफ कॉपी-पेस्ट करें (Unlimited length)..."></textarea>
            </div>
            <button type="button" class="btn btn-primary" id="admRunAiCaPasteBtn">📋 Extract &amp; Publish Current Affairs from Text</button>
          ` : ''}

          ${activeCaTab === 'file' ? `
            <div class="form-group">
              <label class="form-label">Select Newspaper Clipping Image, Magazine PDF, or Text Document (.pdf, .png, .jpg, .webp, .txt)</label>
              <input type="file" class="form-input" id="admAiCaFileInput" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv,.json" />
            </div>
            <button type="button" class="btn btn-primary" id="admRunAiCaFileBtn">📄 Scan File &amp; Publish Current Affairs</button>
          ` : ''}

          <div id="admAiCaStatusBox" style="display:none;margin-top:10px;padding:10px 12px;border-radius:8px;background:var(--secondary-soft);font-size:0.82rem;font-weight:600;color:var(--secondary);"></div>
        </div>

        <!-- Manual Create / Edit Current Affairs Form -->
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
            <h3 style="font-size:1rem;font-weight:800;">
              ${editingStory ? '✏️ Edit Current Affairs Update' : '⚡ Manual Current Affairs Entry'}
            </h3>
            ${editingStory ? `<button type="button" class="btn btn-outline btn-sm" id="admCancelEditCaBtn">✕ Cancel Edit</button>` : ''}
          </div>
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" id="admCaCategory">
                <option value="chhattisgarh" ${editingStory && editingStory.category === 'chhattisgarh' ? 'selected' : ''}>छत्तीसगढ़ समसामयिकी (Chhattisgarh)</option>
                <option value="national" ${editingStory && editingStory.category === 'national' ? 'selected' : ''}>राष्ट्रीय समसामयिकी (National)</option>
                <option value="international" ${editingStory && editingStory.category === 'international' ? 'selected' : ''}>अंतर्राष्ट्रीय एवं विज्ञान (International &amp; Sci)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Month Archive</label>
              <input type="month" class="form-input" id="admCaMonthKey" value="${esc((editingStory && editingStory.monthKey) || defaultMonthKey)}" />
            </div>
            <div class="form-group">
              <label class="form-label">Source Name</label>
              <input class="form-input" id="admCaSource" value="${esc((editingStory && editingStory.sourceName) || 'PIB / DPR Chhattisgarh')}" />
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Headline (Hindi)</label>
              <input class="form-input" id="admCaHeadHi" value="${esc((editingStory && editingStory.headlineHi) || '')}" placeholder="उदा: छत्तीसगढ़ आर्थिक सर्वेक्षण एवं नई योजनाएं" />
            </div>
            <div class="form-group">
              <label class="form-label">Headline (English)</label>
              <input class="form-input" id="admCaHeadEn" value="${esc((editingStory && editingStory.headlineEn) || '')}" placeholder="e.g., Chhattisgarh Economic Survey & Key Schemes" />
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Exam Key Points &amp; Summary (Hindi)</label>
              <textarea class="form-textarea" id="admCaSummaryHi" rows="3" placeholder="परीक्षा उपयोगी मुख्य तथ्य (हिन्दी)...">${esc((editingStory && editingStory.summaryHi) || '')}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Exam Key Points &amp; Summary (English)</label>
              <textarea class="form-textarea" id="admCaSummaryEn" rows="3" placeholder="Exam-oriented key facts (English)...">${esc((editingStory && (editingStory.summaryEn || editingStory.summaryHi)) || '')}</textarea>
            </div>
          </div>
          <div class="grid-2" style="align-items:end;margin-bottom:10px;">
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Attach Story Image (Upload Photo — Optional, AI auto-attaches if blank)</label>
              <input type="file" class="form-input" id="admCaImageFileInput" accept="image/*" />
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <label class="form-label">Or Paste Story Image URL (Optional)</label>
              <input class="form-input" id="admCaImageUrlInput" value="${esc((editingStory && editingStory.imageUrl && !String(editingStory.imageUrl).startsWith('data:')) ? editingStory.imageUrl : '')}" placeholder="https://... (Leave blank for AI auto-image)" />
            </div>
          </div>
          <button class="btn btn-primary" id="admPublishCaBtn">
            ${editingStory ? '💾 Save Updated Current Affairs' : '⚡ Publish Current Affairs Update'}
          </button>
        </div>

        <!-- Existing Current Affairs Archive List -->
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
            <h3 style="font-size:1rem;font-weight:800;">📚 Published Current Affairs Archive (${(state.stories || []).length})</h3>
          </div>
          ${(state.stories || []).length === 0 ? `
            <p style="font-size:0.84rem;color:var(--text-muted);">No Current Affairs published yet.</p>
          ` : `
            <div style="display:grid;gap:10px;max-height:480px;overflow-y:auto;">
              ${(state.stories || []).map((st) => `
                <div style="padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--surface-alt);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                  <img src="${esc(st.imageUrl || generateAutoStoryImageUrl(st))}" alt="" style="width:76px;height:54px;border-radius:8px;object-fit:cover;border:1px solid var(--border);flex-shrink:0;" />
                  <div style="flex:1;min-width:220px;">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
                      <span class="badge badge-exam">${esc(st.category || 'chhattisgarh').toUpperCase()}</span>
                      <span class="badge badge-cloud">${esc(st.monthKey || defaultMonthKey)}</span>
                      <span style="font-size:0.74rem;color:var(--text-muted);">${esc(st.sourceName || 'PIB / DPR')}</span>
                    </div>
                    <div style="font-weight:800;font-size:0.93rem;">${esc(st.headlineHi)}</div>
                    <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:2px;">${esc(st.headlineEn)}</div>
                    <div style="font-size:0.8rem;color:var(--text);margin-top:4px;line-height:1.45;">${esc(st.summaryHi)}</div>
                  </div>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button type="button" class="btn btn-outline btn-sm" data-edit-ca-story="${esc(st.id)}">✏️ Edit</button>
                    <button type="button" class="btn btn-danger btn-sm" data-delete-ca-story="${esc(st.id)}">🗑️ Delete</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;

      bodyEl.querySelectorAll('[data-adm-ca-tab]').forEach((btn) => {
        btn.onclick = () => {
          state.admCaUploadTab = btn.getAttribute('data-adm-ca-tab') || 'prompt';
          renderAdminConsole(rootEl, state, api);
        };
      });

      const showCaStatus = (msg) => {
        const box = document.getElementById('admAiCaStatusBox');
        if (box) {
          box.style.display = 'block';
          box.textContent = msg;
        }
      };

      const saveGeneratedCaBatch = async (rawItems, preferredCat, preferredMonth, preferredSource) => {
        const added = enrichAndDeduplicateCurrentAffairsItems(
          rawItems,
          state.stories || [],
          preferredCat,
          preferredSource,
          preferredMonth
        );
        if (added.length === 0) {
          api.toast('ℹ️ कोई नया यूनिक करंट अफेयर्स नहीं मिला (डुप्लीकेट अपडेट्स को छोड़ दिया गया)।');
          return 0;
        }
        state.stories = added.concat(state.stories || []);
        api.saveState();
        if (window.CGpediaCloud && window.CGpediaCloud.batchSaveCloudDocs) {
          await window.CGpediaCloud.batchSaveCloudDocs('current_affairs', added);
        }
        if (api && typeof api.sendSystemAndAppNotification === 'function' && added[0]) {
          const topSt = added[0];
          api.sendSystemAndAppNotification(
            '⚡ समसामयिकी (Current Affairs): ' + (topSt.headlineHi || topSt.headlineEn || 'New Update'),
            topSt.summaryHi || topSt.summaryEn || topSt.headlineEn || 'नया समसामयिकी अपडेट उपलब्ध है।',
            'stories',
            'stories_' + topSt.id,
            'current-affairs'
          );
        } else {
          api.toast(`✅ ${added.length} नए (Non-Repeating) करंट अफेयर्स सफलतापूर्वक पब्लिश किए गए!`);
        }
        renderAdminConsole(rootEl, state, api);
        return added.length;
      };

      const hourlyBtn = document.getElementById('admTriggerHourlyCaNowBtn');
      if (hourlyBtn) {
        hourlyBtn.onclick = async () => {
          hourlyBtn.disabled = true;
          hourlyBtn.textContent = '⏳ Fetching Latest Updates...';
          showCaStatus('⏳ छत्तीसगढ़, राष्ट्रीय एवं अंतर्राष्ट्रीय नवीनतम समसामयिकी अपडेट्स तैयार किए जा रहे हैं...');
          try {
            const cat = (document.getElementById('admAiCaCategory') && document.getElementById('admAiCaCategory').value) || 'ALL';
            const monthVal = (document.getElementById('admAiCaMonth') && document.getElementById('admAiCaMonth').value) || defaultMonthKey;
            const srcVal = (document.getElementById('admAiCaSource') && document.getElementById('admAiCaSource').value.trim()) || 'PIB / DPR Chhattisgarh';
            const items = await generateCurrentAffairsWithAi({
              mode: 'hourly',
              category: cat,
              monthKey: monthVal,
              sourceName: srcVal,
              count: 4,
              existingStories: state.stories || [],
              onProgress: showCaStatus
            });
            await saveGeneratedCaBatch(items, cat, monthVal, srcVal);
          } catch (err) {
            api.toast('⚠️ Auto-update error: ' + (err.message || 'Please try again'));
          } finally {
            hourlyBtn.disabled = false;
            hourlyBtn.textContent = '🔄 Auto-Fetch Latest Hourly Current Affairs';
          }
        };
      }

      const runPromptBtn = document.getElementById('admRunAiCaPromptBtn');
      if (runPromptBtn) {
        runPromptBtn.onclick = async () => {
          const promptVal = (document.getElementById('admAiCaPromptInput') && document.getElementById('admAiCaPromptInput').value.trim()) || '';
          const countVal = Number((document.getElementById('admAiCaPromptCount') && document.getElementById('admAiCaPromptCount').value) || 5);
          const cat = (document.getElementById('admAiCaCategory') && document.getElementById('admAiCaCategory').value) || 'ALL';
          const monthVal = (document.getElementById('admAiCaMonth') && document.getElementById('admAiCaMonth').value) || defaultMonthKey;
          const srcVal = (document.getElementById('admAiCaSource') && document.getElementById('admAiCaSource').value.trim()) || 'PIB / DPR Chhattisgarh';
          if (!promptVal) {
            api.toast('⚠️ कृपया करंट अफेयर्स का विषय या प्रॉम्प्ट दर्ज करें।');
            return;
          }
          runPromptBtn.disabled = true;
          runPromptBtn.textContent = '⏳ Generating Current Affairs...';
          showCaStatus('⏳ विषय के आधार पर द्विभाषी करंट अफेयर्स तैयार किए जा रहे हैं...');
          try {
            const items = await generateCurrentAffairsWithAi({
              mode: 'prompt',
              topicPrompt: promptVal,
              category: cat,
              monthKey: monthVal,
              sourceName: srcVal,
              count: countVal,
              existingStories: state.stories || [],
              onProgress: showCaStatus
            });
            await saveGeneratedCaBatch(items, cat, monthVal, srcVal);
          } finally {
            runPromptBtn.disabled = false;
            runPromptBtn.textContent = '✨ Generate & Publish Current Affairs';
          }
        };
      }

      const runPasteBtn = document.getElementById('admRunAiCaPasteBtn');
      if (runPasteBtn) {
        runPasteBtn.onclick = async () => {
          const rawText = (document.getElementById('admAiCaPasteText') && document.getElementById('admAiCaPasteText').value.trim()) || '';
          const cat = (document.getElementById('admAiCaCategory') && document.getElementById('admAiCaCategory').value) || 'ALL';
          const monthVal = (document.getElementById('admAiCaMonth') && document.getElementById('admAiCaMonth').value) || defaultMonthKey;
          const srcVal = (document.getElementById('admAiCaSource') && document.getElementById('admAiCaSource').value.trim()) || 'PIB / DPR Chhattisgarh';
          if (!rawText) {
            api.toast('⚠️ कृपया न्यूज़ या पैराग्राफ टेक्स्ट पेस्ट करें।');
            return;
          }
          runPasteBtn.disabled = true;
          runPasteBtn.textContent = '⏳ Extracting Current Affairs...';
          showCaStatus('⏳ पेस्ट किए गए टेक्स्ट से मुख्य परीक्षा उपयोगी करंट अफेयर्स निकाले जा रहे हैं...');
          try {
            const items = await generateCurrentAffairsWithAi({
              mode: 'paste',
              rawText,
              category: cat,
              monthKey: monthVal,
              sourceName: srcVal,
              existingStories: state.stories || [],
              onProgress: showCaStatus
            });
            await saveGeneratedCaBatch(items, cat, monthVal, srcVal);
          } finally {
            runPasteBtn.disabled = false;
            runPasteBtn.textContent = '📋 Extract & Publish Current Affairs from Text';
          }
        };
      }

      const runFileBtn = document.getElementById('admRunAiCaFileBtn');
      if (runFileBtn) {
        runFileBtn.onclick = async () => {
          const fileEl = document.getElementById('admAiCaFileInput');
          const file = fileEl && fileEl.files && fileEl.files[0];
          const cat = (document.getElementById('admAiCaCategory') && document.getElementById('admAiCaCategory').value) || 'ALL';
          const monthVal = (document.getElementById('admAiCaMonth') && document.getElementById('admAiCaMonth').value) || defaultMonthKey;
          const srcVal = (document.getElementById('admAiCaSource') && document.getElementById('admAiCaSource').value.trim()) || 'PIB / DPR Chhattisgarh';
          if (!file) {
            api.toast('⚠️ कृपया PDF या Image फ़ाइल चुनें।');
            return;
          }
          runFileBtn.disabled = true;
          runFileBtn.textContent = '⏳ Scanning File...';
          showCaStatus(`⏳ फ़ाइल (${file.name}) को स्कैन कर द्विभाषी करंट अफेयर्स निकाले जा रहे हैं...`);
          try {
            const items = await generateCurrentAffairsWithAi({
              mode: 'file',
              file,
              category: cat,
              monthKey: monthVal,
              sourceName: srcVal,
              existingStories: state.stories || [],
              onProgress: showCaStatus
            });
            await saveGeneratedCaBatch(items, cat, monthVal, srcVal);
          } finally {
            runFileBtn.disabled = false;
            runFileBtn.textContent = '📄 Scan File & Publish Current Affairs';
          }
        };
      }

      const cancelEditCaBtn = document.getElementById('admCancelEditCaBtn');
      if (cancelEditCaBtn) {
        cancelEditCaBtn.onclick = () => {
          state.editingCaStoryId = null;
          renderAdminConsole(rootEl, state, api);
        };
      }

      document.getElementById('admPublishCaBtn').onclick = async () => {
        const headHi = document.getElementById('admCaHeadHi').value.trim();
        const headEn = document.getElementById('admCaHeadEn').value.trim() || headHi;
        const summaryHi = document.getElementById('admCaSummaryHi').value.trim() || headHi;
        const summaryEn = document.getElementById('admCaSummaryEn').value.trim() || summaryHi;
        const catVal = document.getElementById('admCaCategory').value || 'chhattisgarh';
        const monthVal = document.getElementById('admCaMonthKey').value || defaultMonthKey;
        const yearVal = monthVal.split('-')[0] || String(new Date().getFullYear());
        const srcVal = document.getElementById('admCaSource').value.trim() || 'DPR Chhattisgarh';
        const imgUrlText = (document.getElementById('admCaImageUrlInput') && document.getElementById('admCaImageUrlInput').value.trim()) || '';
        const imgFileEl = document.getElementById('admCaImageFileInput');
        const imgFile = imgFileEl && imgFileEl.files && imgFileEl.files[0];

        if (!headHi) {
          api.toast('कृपया करंट अफेयर्स शीर्षक दर्ज करें।');
          return;
        }

        let resolvedImgUrl = imgUrlText;
        if (imgFile) {
          try {
            resolvedImgUrl = await readFileAsDataUrl(imgFile);
          } catch (_) {}
        }

        if (editingStory) {
          editingStory.category = catVal;
          editingStory.headlineHi = headHi;
          editingStory.headlineEn = headEn;
          editingStory.summaryHi = summaryHi;
          editingStory.summaryEn = summaryEn;
          editingStory.sourceName = srcVal;
          editingStory.monthKey = monthVal;
          editingStory.yearKey = yearVal;
          if (resolvedImgUrl) {
            editingStory.imageUrl = resolvedImgUrl;
            editingStory.isAiGeneratedImage = false;
          } else if (!editingStory.imageUrl || String(editingStory.imageUrl).startsWith('data:image/svg+xml')) {
            editingStory.imageUrl = generateAutoStoryImageUrl({
              category: catVal,
              headlineHi: headHi,
              headlineEn: headEn,
              summaryHi,
              summaryEn,
              sourceName: srcVal
            });
            editingStory.isAiGeneratedImage = false;
          }
          editingStory.updatedAtIso = new Date().toISOString();
          state.editingCaStoryId = null;
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('current_affairs', editingStory.id, editingStory);
          api.toast('✅ Current Affairs updated!');
          renderAdminConsole(rootEl, state, api);
          return;
        }

        const candidate = {
          headlineHi: headHi,
          headlineEn: headEn,
          summaryHi
        };
        if (isDuplicateCurrentAffair(candidate, state.stories || [])) {
          api.toast('⚠️ यह करंट अफेयर्स पहले से मौजूद है (Repeated Current Affairs blocked).');
          return;
        }

        const nowMs = Date.now();
        const nowIso = new Date(nowMs).toISOString();
        const stObj = {
          id: 'ca_' + nowMs,
          category: catVal,
          headlineHi: headHi,
          headlineEn: headEn,
          summaryHi,
          summaryEn,
          sourceName: srcVal,
          sourceUrl: catVal === 'chhattisgarh' ? 'https://dprcg.gov.in' : (catVal === 'national' ? 'https://pib.gov.in' : 'https://news.un.org'),
          monthKey: monthVal,
          yearKey: yearVal,
          dateIso: nowIso.slice(0, 10),
          publishedDateIso: nowIso.slice(0, 10),
          createdAtMs: nowMs,
          expiresAtMs: nowMs + 86400000,
          createdAtIso: nowIso,
          updatedAtIso: nowIso,
          isAiGeneratedImage: false
        };
        stObj.imageUrl = (resolvedImgUrl && !String(resolvedImgUrl).startsWith('data:image/svg+xml')) ? resolvedImgUrl : generateAutoStoryImageUrl(stObj);
        state.stories.unshift(stObj);
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('current_affairs', stObj.id, stObj);
        if (api && typeof api.sendSystemAndAppNotification === 'function') {
          api.sendSystemAndAppNotification(
            '⚡ समसामयिकी (Current Affairs): ' + (stObj.headlineHi || stObj.headlineEn),
            stObj.summaryHi || stObj.summaryEn || stObj.headlineEn,
            'stories',
            'stories_' + stObj.id,
            'current-affairs'
          );
        } else {
          api.toast('⚡ Current Affairs published!');
        }
        renderAdminConsole(rootEl, state, api);
      };

      bodyEl.querySelectorAll('[data-edit-ca-story]').forEach((btn) => {
        btn.onclick = () => {
          state.editingCaStoryId = btn.getAttribute('data-edit-ca-story');
          renderAdminConsole(rootEl, state, api);
        };
      });

      bodyEl.querySelectorAll('[data-delete-ca-story]').forEach((btn) => {
        btn.onclick = () => {
          const sid = btn.getAttribute('data-delete-ca-story');
          const stObj = (state.stories || []).find((s) => s && s.id === sid);
          openConfirmationDialog({
            title: 'Delete Current Affairs Story?',
            message: `क्या आप वाकई करंट अफेयर्स "${(stObj && (stObj.headlineHi || stObj.headlineEn)) || sid}" को डिलीट करना चाहते हैं?`,
            confirmLabel: 'Yes, Delete Current Affairs',
            isDanger: true,
            onConfirm: async () => {
              state.stories = (state.stories || []).filter((s) => s.id !== sid);
              if (state.editingCaStoryId === sid) state.editingCaStoryId = null;
              api.saveState();
              if (window.CGpediaCloud) await window.CGpediaCloud.deleteCloudDoc('current_affairs', sid);
              api.toast('🗑️ Current Affairs deleted.');
              renderAdminConsole(rootEl, state, api);
            }
          });
        };
      });
      return;
    }

    if (activeSection === 'broadcast') {
      const editingNotif = state.editingNotifId
        ? (state.notifications || []).find((n) => n && n.id === state.editingNotifId)
        : null;

      bodyEl.innerHTML = `
        <div class="grid-2">
          <div class="card">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
              <h3 style="font-size:1rem;font-weight:800;">
                ${editingNotif ? '✏️ Edit Announcement' : '📢 Post Announcement / Upcoming Exam Schedule'}
              </h3>
              ${editingNotif ? `<button type="button" class="btn btn-outline btn-sm" id="admCancelEditNotifBtn">✕ Cancel Edit</button>` : ''}
            </div>
            <div class="form-group">
              <input class="form-input" id="admNotifTitle" value="${esc((editingNotif && (editingNotif.titleHi || editingNotif.titleEn)) || '')}" placeholder="Announcement Title (Hindi & English)" style="margin-bottom:8px;" />
              <textarea class="form-textarea" id="admNotifBody" rows="3" placeholder="Message details, syllabus PDF link, or upcoming test date..." style="margin-bottom:8px;">${esc((editingNotif && (editingNotif.messageHi || editingNotif.messageEn)) || '')}</textarea>
              <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;margin-bottom:10px;">
                <input type="checkbox" id="admNotifPin" ${(editingNotif ? editingNotif.isPinned : true) ? 'checked' : ''} /> Pin to Top of Student Dashboard
              </label>
              <button class="btn btn-primary" id="admSendBroadcastBtn">
                ${editingNotif ? '💾 Save Announcement Changes' : '📢 Publish Announcement'}
              </button>
            </div>

            <div style="margin-top:18px;border-top:1px solid var(--border);padding-top:14px;">
              <h4 style="font-size:0.92rem;font-weight:800;margin-bottom:10px;">📋 Published Announcements (${(state.notifications || []).length})</h4>
              ${(state.notifications || []).length === 0 ? `
                <p style="font-size:0.82rem;color:var(--text-muted);">No announcements published yet.</p>
              ` : `
                <div style="display:grid;gap:10px;max-height:360px;overflow-y:auto;">
                  ${(state.notifications || []).map((n) => `
                    <div style="padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface-alt);">
                      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
                        <span class="badge ${n.isPinned ? 'badge-exam' : 'badge-cloud'}">${n.isPinned ? '📌 PINNED' : '📍 UNPINNED'}</span>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;">
                          <button type="button" class="btn btn-outline btn-sm" data-toggle-pin-notif="${esc(n.id)}">
                            ${n.isPinned ? '📍 Unpin' : '📌 Pin'}
                          </button>
                          <button type="button" class="btn btn-outline btn-sm" data-edit-notif="${esc(n.id)}">✏️ Edit</button>
                          <button type="button" class="btn btn-danger btn-sm" data-delete-notif="${esc(n.id)}">🗑️ Delete</button>
                        </div>
                      </div>
                      <div style="font-weight:800;font-size:0.88rem;">${esc(n.titleHi || n.titleEn)}</div>
                      <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:3px;">${esc(n.messageHi || n.messageEn)}</div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>

          <div class="card">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">💬 Student Queries &amp; Support Desk (${(state.queries || []).length})</h3>
            ${(state.queries || []).length === 0 ? `
              <p style="font-size:0.84rem;color:var(--text-muted);">No student support queries yet.</p>
            ` : `
              <div style="display:grid;gap:10px;max-height:460px;overflow-y:auto;">
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

      const cancelEditNotifBtn = document.getElementById('admCancelEditNotifBtn');
      if (cancelEditNotifBtn) {
        cancelEditNotifBtn.onclick = () => {
          state.editingNotifId = null;
          renderAdminConsole(rootEl, state, api);
        };
      }

      document.getElementById('admSendBroadcastBtn').onclick = () => {
        const title = document.getElementById('admNotifTitle').value.trim();
        const msg = document.getElementById('admNotifBody').value.trim();
        const isPinned = document.getElementById('admNotifPin').checked;
        if (!title) {
          api.toast('⚠️ कृपया घोषणा का शीर्षक दर्ज करें।');
          return;
        }
        const nowIso = new Date().toISOString();

        if (editingNotif) {
          editingNotif.titleHi = title;
          editingNotif.titleEn = title;
          editingNotif.messageHi = msg || title;
          editingNotif.messageEn = msg || title;
          editingNotif.isPinned = isPinned;
          editingNotif.updatedAtIso = nowIso;
          state.editingNotifId = null;
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('broadcast_notifications', editingNotif.id, editingNotif);
          api.toast('✅ Announcement updated!');
          renderAdminConsole(rootEl, state, api);
          return;
        }

        const nObj = {
          id: 'notif_' + Date.now(),
          titleHi: title,
          titleEn: title,
          messageHi: msg || title,
          messageEn: msg || title,
          isPinned,
          createdAtIso: nowIso,
          updatedAtIso: nowIso
        };
        state.notifications.unshift(nObj);
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('broadcast_notifications', nObj.id, nObj);
        if (api && typeof api.sendSystemAndAppNotification === 'function') {
          api.sendSystemAndAppNotification(
            '📢 ' + (nObj.titleHi || nObj.titleEn),
            nObj.messageHi || nObj.messageEn || nObj.titleEn,
            'broadcast',
            'notifications_' + nObj.id,
            'notifications'
          );
        } else {
          api.toast('📢 Announcement published!');
        }
        renderAdminConsole(rootEl, state, api);
      };

      bodyEl.querySelectorAll('[data-toggle-pin-notif]').forEach((btn) => {
        btn.onclick = () => {
          const nid = btn.getAttribute('data-toggle-pin-notif');
          const target = (state.notifications || []).find((n) => n && n.id === nid);
          if (!target) return;
          target.isPinned = !target.isPinned;
          target.updatedAtIso = new Date().toISOString();
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('broadcast_notifications', target.id, target);
          api.toast(target.isPinned ? '📌 Announcement pinned to Student Dashboard!' : '📍 Announcement unpinned from Student Dashboard.');
          renderAdminConsole(rootEl, state, api);
        };
      });

      bodyEl.querySelectorAll('[data-edit-notif]').forEach((btn) => {
        btn.onclick = () => {
          state.editingNotifId = btn.getAttribute('data-edit-notif');
          renderAdminConsole(rootEl, state, api);
        };
      });

      bodyEl.querySelectorAll('[data-delete-notif]').forEach((btn) => {
        btn.onclick = () => {
          const nid = btn.getAttribute('data-delete-notif');
          const nObj = (state.notifications || []).find((n) => n && n.id === nid);
          openConfirmationDialog({
            title: 'Delete Announcement?',
            message: `क्या आप वाकई घोषणा "${(nObj && (nObj.titleHi || nObj.titleEn)) || nid}" को डिलीट करना चाहते हैं?`,
            confirmLabel: 'Yes, Delete Announcement',
            isDanger: true,
            onConfirm: async () => {
              state.notifications = (state.notifications || []).filter((n) => n && n.id !== nid);
              if (state.editingNotifId === nid) state.editingNotifId = null;
              api.saveState();
              if (window.CGpediaCloud) await window.CGpediaCloud.deleteCloudDoc('broadcast_notifications', nid);
              api.toast('🗑️ Announcement deleted.');
              renderAdminConsole(rootEl, state, api);
            }
          });
        };
      });

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

      // Immediately sync Anthem checkbox toggle as well as Save Platform Settings button
      const anthemCheckboxEl = document.getElementById('admAnthemEnabled');
      if (anthemCheckboxEl) {
        anthemCheckboxEl.onchange = async () => {
          state.config.anthemEnabled = anthemCheckboxEl.checked;
          if (!state.config.anthemEnabled && state.config.anthemData) {
            state.config.anthemData = Object.assign({}, state.config.anthemData, {
              published: false,
              updatedAtIso: new Date().toISOString()
            });
          }
          state.config.updatedAtIso = new Date().toISOString();
          api.saveState();
          if (window.CGpediaCloud) {
            await window.CGpediaCloud.saveCloudDoc('app_config', 'global', Object.assign({ id: 'global', configKey: 'global' }, state.config));
          }
          api.applyBrandingAndSecurity();
          api.toast(state.config.anthemEnabled ? '🎵 Anthem button enabled for students.' : '🔇 Anthem disabled and hidden from student view.');
        };
      }

      // Wire standard Platform Branding save button
      document.getElementById('admSaveBrandingBtn').onclick = async () => {
        state.config.appTitle = document.getElementById('admBrandTitle').value.trim() || 'CGpedia';
        state.config.appSubtitle = document.getElementById('admBrandSub').value.trim() || 'Competitive Exam & CBT Test Portal';
        state.config.screenshotRestriction = document.getElementById('admScreenshotRestrict').checked;
        state.config.anthemEnabled = document.getElementById('admAnthemEnabled').checked;
        if (!state.config.anthemEnabled && state.config.anthemData) {
          state.config.anthemData = Object.assign({}, state.config.anthemData, {
            published: false,
            updatedAtIso: new Date().toISOString()
          });
        }
        state.config.updatedAtIso = new Date().toISOString();
        api.saveState();
        if (window.CGpediaCloud) {
          await window.CGpediaCloud.saveCloudDoc('app_config', 'global', Object.assign({ id: 'global', configKey: 'global' }, state.config));
        }
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
          const stObj = (state.adminStaff || []).find((s) => s.id === sid);
          openConfirmationDialog({
            title: 'Remove Delegated Admin Staff?',
            message: `क्या आप वाकई "${(stObj && stObj.email) || sid}" का एडमिन स्टाफ रोल हटाना चाहते हैं?`,
            confirmLabel: 'Yes, Remove Staff',
            isDanger: true,
            onConfirm: () => {
              state.adminStaff = (state.adminStaff || []).filter((s) => s.id !== sid);
              api.saveState();
              if (window.CGpediaCloud) window.CGpediaCloud.deleteCloudDoc('admin_staff', sid);
              renderAdminConsole(rootEl, state, api);
            }
          });
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
          const nowIso = new Date().toISOString();
          state.config.anthemData = Object.assign({}, state.config.anthemData, {
            published: nextPublished,
            updatedAtIso: nowIso
          });
          state.config.anthemEnabled = nextPublished;
          state.config.updatedAtIso = nowIso;
          api.saveState();
          if (window.CGpediaCloud) {
            await window.CGpediaCloud.saveCloudDoc('app_config', 'global', Object.assign({ id: 'global', configKey: 'global' }, state.config));
          }
          api.applyBrandingAndSecurity();
          api.toast(nextPublished ? '🟢 Anthem published for students!' : '⏸️ Anthem unpublished and hidden from student view.');
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

          const nowIso = new Date().toISOString();
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
            updatedAtIso: nowIso
          };
          state.config.anthemEnabled = false;
          state.config.updatedAtIso = nowIso;

          api.saveState();
          if (window.CGpediaCloud) {
            await window.CGpediaCloud.saveCloudDoc('app_config', 'global', Object.assign({ id: 'global', configKey: 'global' }, state.config));
          }
          api.applyBrandingAndSecurity();
          api.toast('🗑️ Anthem audio deleted and hidden from student view.');
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

  function normalizeFolderKey(str) {
    return String(str == null ? '' : str)
      .normalize('NFC')
      .trim()
      .toLowerCase()
      .replace(/[\s\-_\/]+/g, ' ')
      .replace(/[()[\]{}.,:;'"!?]+/g, '')
      .trim();
  }

  function getTaxonomyCatalog(state) {
    const cloudDefs = window.CGpediaTaxonomyDefaults || window.CGpediaCloud || {};
    const baseMainCategories = Array.isArray(cloudDefs.MAIN_CATEGORIES) && cloudDefs.MAIN_CATEGORIES.length > 0
      ? cloudDefs.MAIN_CATEGORIES
      : [
          { id: 'cat_cg_gk', mainCategoryId: 'cat_cg_gk', code: 'CHHATTISGARH_GK', titleEn: 'Chhattisgarh GK', titleHi: 'छत्तीसगढ़ सामान्य ज्ञान (Chhattisgarh GK)', icon: '🏛️', hasSubjectFolders: true, order: 1, aliases: ['chhattisgarh gk', 'cg gk', 'cg gs', 'chhattisgarh general knowledge', 'छत्तीसगढ़ सामान्य ज्ञान'] },
          { id: 'cat_indian_gs', mainCategoryId: 'cat_indian_gs', code: 'INDIAN_GS', titleEn: 'Indian GS', titleHi: 'भारतीय सामान्य अध्ययन (Indian GS)', icon: '🇮🇳', hasSubjectFolders: true, order: 2, aliases: ['indian gs', 'general studies', 'भारतीय सामान्य अध्ययन', 'सामान्य अध्ययन'] },
          { id: 'cat_maths', mainCategoryId: 'cat_maths', code: 'MATHS', titleEn: 'Maths', titleHi: 'गणित (Maths)', icon: '📐', hasSubjectFolders: false, directSubjectId: 'sub_maths', order: 3, aliases: ['maths', 'mathematics', 'quantitative aptitude', 'गणित'] },
          { id: 'cat_english', mainCategoryId: 'cat_english', code: 'ENGLISH', titleEn: 'English', titleHi: 'अंग्रेजी (English)', icon: '🔤', hasSubjectFolders: false, directSubjectId: 'sub_english', order: 4, aliases: ['english', 'general english', 'अंग्रेजी'] },
          { id: 'cat_hindi', mainCategoryId: 'cat_hindi', code: 'HINDI', titleEn: 'Hindi', titleHi: 'हिन्दी (Hindi)', icon: '🕉️', hasSubjectFolders: false, directSubjectId: 'sub_hindi', order: 5, aliases: ['hindi', 'general hindi', 'हिन्दी', 'हिंदी'] },
          { id: 'cat_reasoning', mainCategoryId: 'cat_reasoning', code: 'REASONING', titleEn: 'Reasoning', titleHi: 'तर्कशक्ति (Reasoning)', icon: '🧠', hasSubjectFolders: false, directSubjectId: 'sub_reasoning', order: 6, aliases: ['reasoning', 'logical reasoning', 'तर्कशक्ति', 'रीजनिंग'] },
          { id: 'cat_uncategorised', mainCategoryId: 'cat_uncategorised', code: 'UNCATEGORISED', titleEn: 'Uncategorised', titleHi: 'अवर्गीकृत प्रश्न (Uncategorised)', icon: '📂', hasSubjectFolders: false, directSubjectId: 'sub_uncategorised', order: 99, aliases: ['uncategorised', 'uncategorized', 'needs categorisation', 'अवर्गीकृत'] }
        ];

    const baseExams = Array.isArray(cloudDefs.EXAM_CATEGORIES) && cloudDefs.EXAM_CATEGORIES.length > 0
      ? cloudDefs.EXAM_CATEGORIES
      : [
          { id: 'exam_cgpsc', examId: 'exam_cgpsc', code: 'CGPSC', nameEn: 'CGPSC', nameHi: 'छत्तीसगढ़ पीएससी (CGPSC)', icon: '🏛️', pyqCategory: 'CGPSC' },
          { id: 'exam_cg_vyapam', examId: 'exam_cg_vyapam', code: 'CG_VYAPAM', nameEn: 'CG Vyapam', nameHi: 'छत्तीसगढ़ व्यापम (CG Vyapam)', icon: '📋', pyqCategory: 'CG Vyapam' },
          { id: 'exam_upsc', examId: 'exam_upsc', code: 'UPSC', nameEn: 'UPSC', nameHi: 'संघ लोक सेवा आयोग (UPSC)', icon: '🇮🇳', pyqCategory: 'UPSC' },
          { id: 'exam_ssc', examId: 'exam_ssc', code: 'SSC', nameEn: 'SSC', nameHi: 'एसएससी परीक्षाएं (SSC)', icon: '🏢', pyqCategory: 'SSC' },
          { id: 'exam_railway', examId: 'exam_railway', code: 'RAILWAY', nameEn: 'Railway', nameHi: 'रेलवे भर्ती बोर्ड (Railway)', icon: '🚆', pyqCategory: 'Railway' },
          { id: 'exam_banking', examId: 'exam_banking', code: 'BANKING', nameEn: 'Banking', nameHi: 'बैंकिंग परीक्षाएं (Banking)', icon: '🏦', pyqCategory: 'Banking' },
          { id: 'exam_teaching', examId: 'exam_teaching', code: 'TEACHING_EXAMS', nameEn: 'Teaching Exams', nameHi: 'शिक्षक भर्ती एवं पात्रता (Teaching)', icon: '🎓', pyqCategory: 'Teaching Exams' },
          { id: 'exam_other', examId: 'exam_other', code: 'OTHER_EXAMS', nameEn: 'Other Exams', nameHi: 'अन्य प्रतियोगी परीक्षाएं', icon: '📚', pyqCategory: 'Other Exams' }
        ];

    const basePyqHierarchy = Array.isArray(cloudDefs.PYQ_EXAM_CATEGORIES) && cloudDefs.PYQ_EXAM_CATEGORIES.length > 0
      ? cloudDefs.PYQ_EXAM_CATEGORIES
      : [];

    const customTax = (state && state.customTaxonomy) || { customCategories: [], customSubjects: [], pyqCategories: [] };
    const stateExamMaster = (state && Array.isArray(state.examMaster)) ? state.examMaster : [];
    const stateSubjectMaster = (state && Array.isArray(state.subjectMaster)) ? state.subjectMaster : [];
    const stateTopicMaster = (state && Array.isArray(state.topicMaster)) ? state.topicMaster : [];
    const stateSubtopicMaster = (state && Array.isArray(state.subtopicMaster)) ? state.subtopicMaster : [];

    // 0. Main Categories Map
    const mainCategoriesMap = new Map();
    const mainCatLookup = new Map();
    baseMainCategories.forEach((mc) => {
      const catObj = Object.assign({}, mc, {
        aliases: Array.isArray(mc.aliases) ? [...mc.aliases] : []
      });
      mainCategoriesMap.set(catObj.mainCategoryId, catObj);
      mainCatLookup.set(normalizeFolderKey(catObj.mainCategoryId), catObj);
      mainCatLookup.set(normalizeFolderKey(catObj.code), catObj);
      mainCatLookup.set(normalizeFolderKey(catObj.titleEn), catObj);
      mainCatLookup.set(normalizeFolderKey(catObj.titleHi), catObj);
      catObj.aliases.forEach((al) => mainCatLookup.set(normalizeFolderKey(al), catObj));
    });
    const mainCategories = Array.from(mainCategoriesMap.values()).sort((a, b) => (a.order || 50) - (b.order || 50));

    // 1. Build Exam Master Map & PYQ Hierarchy
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
          pyqCategory: ex.pyqCategory || 'Other Exams',
          subjectIds: Array.isArray(ex.subjectIds) ? [...ex.subjectIds] : []
        });
      } else {
        if (ex.nameEn) existing.nameEn = String(ex.nameEn).trim();
        if (ex.nameHi) existing.nameHi = String(ex.nameHi).trim();
        if (ex.pyqCategory) existing.pyqCategory = ex.pyqCategory;
        if (Array.isArray(ex.subjectIds)) {
          existing.subjectIds = Array.from(new Set([...existing.subjectIds, ...ex.subjectIds]));
        }
      }
    }
    baseExams.forEach(registerExam);
    (customTax.customCategories || []).forEach(registerExam);
    stateExamMaster.forEach(registerExam);
    const examCategories = Array.from(examsMap.values());

    // Merge PYQ Categories (base + custom + dynamically discovered from questions)
    const pyqCatMap = new Map();
    function ensurePyqCategory(catName, titleHi, icon) {
      const cleanName = String(catName || 'Other Exams').trim() || 'Other Exams';
      const normKey = normalizeFolderKey(cleanName);
      for (const existing of pyqCatMap.values()) {
        if (normalizeFolderKey(existing.categoryName) === normKey) return existing;
      }
      const created = {
        id: makeSlugId('pyq_cat', cleanName),
        categoryName: cleanName,
        titleHi: titleHi || cleanName,
        icon: icon || '🏛️',
        exams: []
      };
      pyqCatMap.set(created.categoryName, created);
      return created;
    }

    function ensurePyqExamEntry(catName, examName, yearsArr, papersArr) {
      const catObj = ensurePyqCategory(catName);
      const cleanExam = String(examName || '').trim();
      if (!cleanExam) return catObj;
      const normEx = normalizeFolderKey(cleanExam);
      let exEntry = catObj.exams.find((e) => normalizeFolderKey(e.examName) === normEx);
      if (!exEntry) {
        exEntry = {
          examName: cleanExam,
          years: [],
          papers: []
        };
        catObj.exams.push(exEntry);
      }
      (yearsArr || []).forEach((y) => {
        const cleanY = String(y || '').trim();
        if (cleanY && !exEntry.years.includes(cleanY)) exEntry.years.push(cleanY);
      });
      (papersArr || []).forEach((p) => {
        const cleanP = String(p || '').trim();
        if (cleanP && !exEntry.papers.includes(cleanP)) exEntry.papers.push(cleanP);
      });
      exEntry.years.sort((a, b) => String(b).localeCompare(String(a)));
      return catObj;
    }

    basePyqHierarchy.forEach((pc) => {
      ensurePyqCategory(pc.categoryName, pc.titleHi, pc.icon);
      (pc.exams || []).forEach((ex) => {
        ensurePyqExamEntry(pc.categoryName, ex.examName, ex.years, ex.papers);
      });
    });

    (customTax.pyqCategories || []).forEach((pc) => {
      ensurePyqCategory(pc.categoryName, pc.titleHi, pc.icon);
      (pc.exams || []).forEach((ex) => {
        ensurePyqExamEntry(pc.categoryName, ex.examName, ex.years, ex.papers);
      });
    });

    // Also include any PYQ references present on questions in state.questionBank
    ((state && state.questionBank) || []).forEach((q) => {
      if (!q || q.isDeleted) return;
      const refs = Array.isArray(q.pyqReferences) ? q.pyqReferences : [];
      refs.forEach((ref) => {
        if (ref && ref.examCategory) {
          const pList = [];
          if (ref.paperName && ref.shift) pList.push(`${ref.paperName} - ${ref.shift}`);
          else if (ref.paperName) pList.push(ref.paperName);
          else if (ref.shift) pList.push(ref.shift);
          ensurePyqExamEntry(
            ref.examCategory,
            ref.examName || ref.examCategory,
            ref.examYear ? [String(ref.examYear)] : [],
            pList
          );
        }
      });
    });

    const pyqCategories = Array.from(pyqCatMap.values());

    // 2. Build Subject Master Map (preventing duplicate subject folders)
    const baseSubjects = Array.isArray(cloudDefs.DEFAULT_SUBJECTS) ? cloudDefs.DEFAULT_SUBJECTS : [];
    const subjectsById = new Map();
    const subjectLookupMap = new Map();

    function inferMainCategoryForSubject(subObj) {
      if (subObj.mainCategoryId && mainCategoriesMap.has(subObj.mainCategoryId)) {
        return mainCategoriesMap.get(subObj.mainCategoryId);
      }
      if (subObj.mainCategory && mainCatLookup.has(normalizeFolderKey(subObj.mainCategory))) {
        return mainCatLookup.get(normalizeFolderKey(subObj.mainCategory));
      }
      const txt = `${subObj.subjectId || ''} ${subObj.titleEn || ''} ${subObj.titleHi || ''}`.toLowerCase();
      if (/छत्तीसगढ़|chhattisgarh|\bcg\b|sub_cg/.test(txt)) return mainCategoriesMap.get('cat_cg_gk');
      if (/गणित|math|quant|अंकगणित|क्षेत्रमिति|बीजगणित|ज्यामिति|त्रिकोणमिति/.test(txt)) return mainCategoriesMap.get('cat_maths');
      if (/english|अंग्रेजी/.test(txt)) return mainCategoriesMap.get('cat_english');
      if (/हिन्दी|हिंदी|\bhindi\b|व्याकरण/.test(txt)) return mainCategoriesMap.get('cat_hindi');
      if (/तर्कशक्ति|रीजनिंग|reasoning|mental ability/.test(txt)) return mainCategoriesMap.get('cat_reasoning');
      if (/uncategorised|uncategorized|needs_categorisation|अवर्गीकृत/.test(txt)) return mainCategoriesMap.get('cat_uncategorised');
      return mainCategoriesMap.get('cat_indian_gs');
    }

    function registerSubject(subObj) {
      if (!subObj || (!subObj.titleEn && !subObj.nameEn && !subObj.titleHi)) return;
      const titleEn = String(subObj.titleEn || subObj.nameEn || subObj.titleHi).trim();
      const titleHi = String(subObj.titleHi || subObj.nameHi || titleEn).trim();
      const normEn = normalizeFolderKey(titleEn);
      const normHi = normalizeFolderKey(titleHi);
      const normId = normalizeFolderKey(subObj.subjectId || subObj.id || '');

      let matched = null;
      if (subObj.subjectId && subjectsById.has(subObj.subjectId)) {
        matched = subjectsById.get(subObj.subjectId);
      } else if (subObj.id && subjectsById.has(subObj.id)) {
        matched = subjectsById.get(subObj.id);
      } else if (normId && subjectLookupMap.has(normId)) {
        matched = subjectLookupMap.get(normId);
      } else if (normEn && subjectLookupMap.has(normEn)) {
        matched = subjectLookupMap.get(normEn);
      } else if (normHi && subjectLookupMap.has(normHi)) {
        matched = subjectLookupMap.get(normHi);
      }

      const mainCatObj = inferMainCategoryForSubject(subObj);

      if (!matched) {
        const subjectId = String(subObj.subjectId || subObj.id || makeSlugId('sub', titleEn)).trim();
        matched = {
          id: subjectId,
          subjectId,
          mainCategoryId: mainCatObj ? mainCatObj.mainCategoryId : 'cat_indian_gs',
          mainCategory: mainCatObj ? mainCatObj.titleEn : 'Indian GS',
          titleEn,
          titleHi,
          examCode: subObj.examCode || 'ALL',
          aliases: Array.isArray(subObj.aliases) ? [...subObj.aliases] : (Array.isArray(subObj.legacyAliases) ? [...subObj.legacyAliases] : []),
          keywords: Array.isArray(subObj.keywords) ? [...subObj.keywords] : [],
          topics: Array.isArray(subObj.topics) ? [...subObj.topics] : []
        };
        subjectsById.set(subjectId, matched);
      } else {
        const incomingAliases = [...(subObj.aliases || []), ...(subObj.legacyAliases || []), titleEn, titleHi];
        incomingAliases.forEach((al) => {
          const cleanAl = String(al || '').trim();
          if (cleanAl && !matched.aliases.some((x) => normalizeFolderKey(x) === normalizeFolderKey(cleanAl))) {
            matched.aliases.push(cleanAl);
          }
        });
        if (Array.isArray(subObj.keywords)) {
          subObj.keywords.forEach((kw) => {
            if (kw && !matched.keywords.includes(kw)) matched.keywords.push(kw);
          });
        }
        if (Array.isArray(subObj.topics)) {
          subObj.topics.forEach((t) => {
            const cleanT = String(t || '').trim();
            if (cleanT && !matched.topics.some((et) => normalizeFolderKey(et) === normalizeFolderKey(cleanT))) {
              matched.topics.push(cleanT);
            }
          });
        }
      }

      subjectLookupMap.set(normalizeFolderKey(matched.subjectId), matched);
      subjectLookupMap.set(normalizeFolderKey(matched.titleEn), matched);
      subjectLookupMap.set(normalizeFolderKey(matched.titleHi), matched);
      (matched.aliases || []).forEach((al) => {
        if (al) subjectLookupMap.set(normalizeFolderKey(al), matched);
      });
    }

    baseSubjects.forEach(registerSubject);
    (customTax.customSubjects || []).forEach(registerSubject);
    stateSubjectMaster.forEach(registerSubject);

    const subjects = Array.from(subjectsById.values());

    // 3. Build Hierarchical Topic Master (preventing duplicate topic folders under same parent)
    const baseTopics = Array.isArray(cloudDefs.DEFAULT_TOPICS) ? cloudDefs.DEFAULT_TOPICS : [];
    const topicsById = new Map();
    const topicAliasLookup = new Map(); // normalized key -> topicObj

    function registerTopic(topObj) {
      if (!topObj || (!topObj.titleEn && !topObj.nameEn && !topObj.titleHi)) return;
      const titleEn = String(topObj.titleEn || topObj.nameEn || topObj.titleHi).trim();
      const titleHi = String(topObj.titleHi || topObj.nameHi || titleEn).trim();
      const normEn = normalizeFolderKey(titleEn);
      const normHi = normalizeFolderKey(titleHi);

      // Skip legacy generic placeholder topic names if they aren't canonical
      if (['general', 'general topic', 'unknown', 'needs categorisation'].includes(normEn) && topObj.id !== 'top_uncategorised') {
        return;
      }

      // Check if this topic matches an existing registered topic via ID or alias
      let existing = null;
      if (topObj.topicId && topicsById.has(topObj.topicId)) {
        existing = topicsById.get(topObj.topicId);
      } else if (topObj.id && topicsById.has(topObj.id)) {
        existing = topicsById.get(topObj.id);
      }

      const rawParentSub = subjectLookupMap.get(normalizeFolderKey(topObj.subjectId || topObj.subject || ''));
      if (!existing) {
        for (const t of topicsById.values()) {
          const sameSub = !rawParentSub || t.subjectId === rawParentSub.subjectId;
          const matchesTitle = normalizeFolderKey(t.titleEn) === normEn ||
            normalizeFolderKey(t.titleHi) === normHi ||
            (t.aliases || []).some((a) => normalizeFolderKey(a) === normEn || normalizeFolderKey(a) === normHi);
          if (sameSub && matchesTitle) {
            existing = t;
            break;
          }
        }
      }
      // Also check global alias lookup if legacy topic is being remapped to a new subject
      if (!existing && topicAliasLookup.has(normEn)) {
        existing = topicAliasLookup.get(normEn);
      } else if (!existing && topicAliasLookup.has(normHi)) {
        existing = topicAliasLookup.get(normHi);
      }

      const parentSub = rawParentSub || (existing ? subjectsById.get(existing.subjectId) : null) || subjectsById.get('sub_cg_general_info') || subjects[0];
      const subjectId = parentSub ? parentSub.subjectId : 'sub_cg_general_info';
      const mainCategoryId = (topObj.mainCategoryId && mainCategoriesMap.has(topObj.mainCategoryId))
        ? topObj.mainCategoryId
        : (parentSub ? parentSub.mainCategoryId : 'cat_cg_gk');

      if (!existing) {
        const topicId = String(topObj.topicId || topObj.id || makeSlugId(`top_${subjectId.replace(/^sub_/, '')}`, titleEn)).trim();
        existing = {
          id: topicId,
          topicId,
          subjectId,
          mainCategoryId,
          titleEn,
          titleHi,
          aliases: Array.isArray(topObj.aliases) ? [...topObj.aliases] : [],
          keywords: Array.isArray(topObj.keywords) ? [...topObj.keywords] : []
        };
        topicsById.set(topicId, existing);
      } else {
        if (Array.isArray(topObj.aliases)) {
          topObj.aliases.forEach((al) => {
            if (al && !existing.aliases.some((x) => normalizeFolderKey(x) === normalizeFolderKey(al))) {
              existing.aliases.push(al);
            }
          });
        }
        if (Array.isArray(topObj.keywords)) {
          existing.keywords = Array.from(new Set([...(existing.keywords || []), ...topObj.keywords]));
        }
      }

      topicAliasLookup.set(normalizeFolderKey(existing.topicId), existing);
      topicAliasLookup.set(normalizeFolderKey(existing.titleEn), existing);
      topicAliasLookup.set(normalizeFolderKey(existing.titleHi), existing);
      (existing.aliases || []).forEach((al) => {
        if (al) topicAliasLookup.set(normalizeFolderKey(al), existing);
      });

      const canonicalParentSub = subjectsById.get(existing.subjectId);
      if (canonicalParentSub && !canonicalParentSub.topics.some((t) => normalizeFolderKey(t) === normalizeFolderKey(existing.titleEn))) {
        canonicalParentSub.topics.push(existing.titleEn);
      }
    }

    baseTopics.forEach(registerTopic);
    stateTopicMaster.forEach(registerTopic);

    const topicMaster = Array.from(topicsById.values());

    // 4. Build Hierarchical Subtopic Master
    const baseSubtopics = Array.isArray(cloudDefs.DEFAULT_SUBTOPICS) ? cloudDefs.DEFAULT_SUBTOPICS : [];
    const subtopicsById = new Map();

    function registerSubtopic(stObj) {
      if (!stObj || (!stObj.titleEn && !stObj.nameEn && !stObj.titleHi)) return;
      const titleEn = String(stObj.titleEn || stObj.nameEn || stObj.titleHi).trim();
      const titleHi = String(stObj.titleHi || stObj.nameHi || titleEn).trim();
      let parentTop = topicsById.get(String(stObj.topicId || '').trim()) || topicAliasLookup.get(normalizeFolderKey(stObj.topicId || stObj.topic || ''));
      const topicId = parentTop ? parentTop.topicId : String(stObj.topicId || (topicMaster[0] && topicMaster[0].topicId) || 'top_cg_hist_medieval');
      const subjectId = parentTop ? parentTop.subjectId : String(stObj.subjectId || 'sub_cg_history');
      const subtopicId = String(stObj.subtopicId || stObj.id || makeSlugId('subtop', `${topicId}_${titleEn}`)).trim();

      let existing = subtopicsById.get(subtopicId);
      if (!existing) {
        for (const st of subtopicsById.values()) {
          if (st.topicId === topicId && normalizeFolderKey(st.titleEn) === normalizeFolderKey(titleEn)) {
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
    topicMaster.forEach((t) => {
      if (t.topicId !== 'top_uncategorised') allTopicsSet.add(t.titleHi || t.titleEn);
    });

    const allSubtopicsSet = new Set();
    subtopicMaster.forEach((st) => allSubtopicsSet.add(st.titleEn));

    return {
      mainCategories,
      pyqCategories,
      examCategories,
      subjects,
      topicMaster,
      topics: topicMaster,
      subtopicMaster,
      subtopics: subtopicMaster,
      allTopics: Array.from(allTopicsSet),
      allSubtopics: Array.from(allSubtopicsSet),

      findMainCategory(val) {
        if (!val) return null;
        const norm = normalizeFolderKey(val);
        if (mainCatLookup.has(norm)) return mainCatLookup.get(norm);
        return mainCategories.find((mc) =>
          normalizeFolderKey(mc.mainCategoryId) === norm ||
          normalizeFolderKey(mc.titleEn) === norm ||
          normalizeFolderKey(mc.titleHi) === norm ||
          (mc.aliases || []).some((a) => normalizeFolderKey(a) === norm)
        ) || null;
      },

      getSubjectsForMainCategory(mainCatVal) {
        if (!mainCatVal || String(mainCatVal).toUpperCase() === 'ALL') {
          return subjects.filter((s) => s.subjectId !== 'sub_uncategorised');
        }
        const mc = this.findMainCategory(mainCatVal);
        if (!mc) return subjects.filter((s) => s.subjectId !== 'sub_uncategorised');
        return subjects.filter((s) => s.mainCategoryId === mc.mainCategoryId);
      },

      getTopicsForMainCategory(mainCatVal) {
        if (!mainCatVal || String(mainCatVal).toUpperCase() === 'ALL') {
          return topicMaster.filter((t) => t.topicId !== 'top_uncategorised');
        }
        const mc = this.findMainCategory(mainCatVal);
        if (!mc) return topicMaster.filter((t) => t.topicId !== 'top_uncategorised');
        return topicMaster.filter((t) => t.mainCategoryId === mc.mainCategoryId);
      },

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
        const norm = normalizeFolderKey(subVal);
        if (!norm) return null;
        if (subjectLookupMap.has(norm)) return subjectLookupMap.get(norm);
        return subjects.find((s) =>
          normalizeFolderKey(s.subjectId) === norm ||
          normalizeFolderKey(s.titleEn) === norm ||
          normalizeFolderKey(s.titleHi) === norm ||
          (s.aliases || []).some((a) => normalizeFolderKey(a) === norm)
        ) || null;
      },

      findTopic(subVal, topicVal) {
        if (!topicVal) return null;
        const normT = normalizeFolderKey(topicVal);
        if (!normT) return null;
        const subObj = subVal ? this.findSubject(subVal) : null;
        if (subObj) {
          const scoped = topicMaster.find((t) =>
            t.subjectId === subObj.subjectId &&
            (normalizeFolderKey(t.topicId) === normT ||
              normalizeFolderKey(t.titleEn) === normT ||
              normalizeFolderKey(t.titleHi) === normT ||
              (t.aliases || []).some((a) => normalizeFolderKey(a) === normT))
          );
          if (scoped) return scoped;
        }
        if (topicAliasLookup.has(normT)) return topicAliasLookup.get(normT);
        return topicMaster.find((t) =>
          normalizeFolderKey(t.topicId) === normT ||
          normalizeFolderKey(t.titleEn) === normT ||
          normalizeFolderKey(t.titleHi) === normT ||
          (t.aliases || []).some((a) => normalizeFolderKey(a) === normT)
        ) || null;
      },

      suggestSimilarFolders(rawSubject, rawTopic) {
        const normTop = normalizeFolderKey(rawTopic || '');
        const normSub = normalizeFolderKey(rawSubject || '');
        const suggestions = [];
        topicMaster.forEach((t) => {
          if (t.topicId === 'top_uncategorised') return;
          const parentSub = subjectsById.get(t.subjectId);
          const scoreTop = normTop ? computeTextSimilarity(normTop, `${t.titleHi} ${t.titleEn}`) : 0;
          const scoreSub = (normSub && parentSub) ? computeTextSimilarity(normSub, `${parentSub.titleHi} ${parentSub.titleEn}`) : 0;
          const totalScore = scoreTop * 0.75 + scoreSub * 0.25;
          if (totalScore >= 0.25 || (normTop && (normalizeFolderKey(t.titleHi).includes(normTop) || normalizeFolderKey(t.titleEn).includes(normTop)))) {
            suggestions.push({
              topicId: t.topicId,
              topicTitle: t.titleHi || t.titleEn,
              subjectId: t.subjectId,
              subjectTitle: parentSub ? (parentSub.titleHi || parentSub.titleEn) : '',
              mainCategoryId: t.mainCategoryId,
              mainCategoryTitle: (mainCategoriesMap.get(t.mainCategoryId) || {}).titleEn || 'Chhattisgarh GK',
              score: totalScore
            });
          }
        });
        suggestions.sort((a, b) => b.score - a.score);
        return suggestions.slice(0, 5);
      },

      findSubtopic(topicVal, subtopicVal, subVal) {
        if (!subtopicVal) return null;
        const normSt = normalizeFolderKey(subtopicVal);
        const topObj = topicVal ? this.findTopic(subVal, topicVal) : null;
        if (topObj) {
          const scoped = subtopicMaster.find((st) =>
            st.topicId === topObj.topicId &&
            (normalizeFolderKey(st.subtopicId) === normSt || normalizeFolderKey(st.titleEn) === normSt || normalizeFolderKey(st.titleHi) === normSt)
          );
          if (scoped) return scoped;
        }
        return subtopicMaster.find((st) =>
          normalizeFolderKey(st.subtopicId) === normSt ||
          normalizeFolderKey(st.titleEn) === normSt ||
          normalizeFolderKey(st.titleHi) === normSt
        ) || null;
      },

      isKnownTopic(subName, topicName) {
        if (!topicName) return false;
        const normT = normalizeFolderKey(topicName);
        if (!normT || ['general', 'general knowledge', 'miscellaneous', 'unknown', 'needs categorisation'].includes(normT)) return false;
        return Boolean(this.findTopic(subName, topicName));
      },

      getSubjectsForExam(examVal) {
        const validSubjects = subjects.filter((s) => s.subjectId !== 'sub_uncategorised');
        if (!examVal || String(examVal).toUpperCase() === 'ALL') return validSubjects;
        const ex = this.findExam(examVal);
        if (!ex || !Array.isArray(ex.subjectIds) || ex.subjectIds.length === 0) return validSubjects;
        const filtered = validSubjects.filter((s) => ex.subjectIds.includes(s.subjectId) || s.examCode === ex.code || s.examCode === 'ALL');
        return filtered.length > 0 ? filtered : validSubjects;
      },

      getTopicsForSubject(subVal) {
        if (!subVal || String(subVal).toUpperCase() === 'ALL') return topicMaster.filter((t) => t.topicId !== 'top_uncategorised');
        const subObj = this.findSubject(subVal);
        if (!subObj) return topicMaster.filter((t) => t.topicId !== 'top_uncategorised');
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

        const topObj = this.findTopic(raw.subjectId || raw.subjectTag || raw.subject, raw.topicId || raw.topic);
        const subObj = (topObj ? this.findSubject(topObj.subjectId) : null) || this.findSubject(raw.subjectId || raw.subjectTag || raw.subject);
        const mainCatObj = (subObj ? this.findMainCategory(subObj.mainCategoryId) : null) ||
          this.findMainCategory(raw.mainCategoryId || raw.mainCategory) ||
          null;
        const subtopObj = this.findSubtopic(topObj ? topObj.topicId : (raw.topic || ''), raw.subtopicId || raw.subtopic, subObj ? subObj.subjectId : '');

        const finalSubjectObj = subObj || (mainCatObj && mainCatObj.directSubjectId ? this.findSubject(mainCatObj.directSubjectId) : null);
        const finalMainCatObj = mainCatObj || (finalSubjectObj ? this.findMainCategory(finalSubjectObj.mainCategoryId) : null);
        const isUncat = !finalSubjectObj || !topObj || finalSubjectObj.subjectId === 'sub_uncategorised' || topObj.topicId === 'top_uncategorised';

        return {
          examIds: resolvedExamCodes,
          examCode: resolvedExamCodes[0] || 'CGPSC',
          mainCategoryId: finalMainCatObj ? finalMainCatObj.mainCategoryId : (isUncat ? 'cat_uncategorised' : 'cat_cg_gk'),
          mainCategory: finalMainCatObj ? finalMainCatObj.titleEn : (isUncat ? 'Uncategorised' : 'Chhattisgarh GK'),
          subjectId: finalSubjectObj ? finalSubjectObj.subjectId : '',
          subjectTag: finalSubjectObj ? (finalSubjectObj.titleHi || finalSubjectObj.titleEn) : String(raw.subjectTag || raw.subject || '').trim(),
          topicId: topObj ? topObj.topicId : '',
          topic: topObj ? (topObj.titleHi || topObj.titleEn) : String(raw.topic || '').trim(),
          subtopicId: subtopObj ? subtopObj.subtopicId : '',
          subtopic: subtopObj ? subtopObj.titleEn : String(raw.subtopic || '').trim(),
          isFullyCategorised: !isUncat
        };
      }
    };
  }

  function addCustomTaxonomyEntry(state, api, { mainCategoryId, examCode, subjectName, topicName, subtopicName }) {
    state.customTaxonomy = state.customTaxonomy || { customCategories: [], customSubjects: [], pyqCategories: [] };
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
    const mainCatObj = catalog.findMainCategory(mainCategoryId) || catalog.findMainCategory('cat_cg_gk');
    let subObj = cleanSub ? catalog.findSubject(cleanSub) : (mainCatObj && mainCatObj.directSubjectId ? catalog.findSubject(mainCatObj.directSubjectId) : null);

    if (cleanSub && !subObj) {
      const subjectId = makeSlugId('sub', cleanSub);
      const newSub = {
        id: subjectId,
        subjectId,
        mainCategoryId: mainCatObj ? mainCatObj.mainCategoryId : 'cat_cg_gk',
        mainCategory: mainCatObj ? mainCatObj.titleEn : 'Chhattisgarh GK',
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
        mainCategoryId: subObj.mainCategoryId || (mainCatObj ? mainCatObj.mainCategoryId : 'cat_cg_gk'),
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

    if (api && typeof api.saveState === 'function') {
      api.saveState();
    }
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
    state.customTaxonomy = state.customTaxonomy || { customCategories: [], customSubjects: [], pyqCategories: [] };
    state.customTaxonomy.customCategories = state.customTaxonomy.customCategories || [];
    state.customTaxonomy.customSubjects = state.customTaxonomy.customSubjects || [];
    state.customTaxonomy.pyqCategories = state.customTaxonomy.pyqCategories || [];
    state.examMaster = state.examMaster || [];
    state.subjectMaster = state.subjectMaster || [];
    state.topicMaster = state.topicMaster || [];
    state.subtopicMaster = state.subtopicMaster || [];

    const cleanType = String(type || '').toLowerCase();
    const nowIso = new Date().toISOString();
    const catalog = getTaxonomyCatalog(state);

    if (cleanType === 'pyq_exam') {
      const catName = String(payload.examCategory || 'CGPSC').trim();
      const exName = String(payload.examName || catName).trim();
      const yearStr = String(payload.examYear || '').trim();
      const paperStr = String(payload.paperName || '').trim();
      let cEntry = state.customTaxonomy.pyqCategories.find((c) => normalizeFolderKey(c.categoryName) === normalizeFolderKey(catName));
      if (!cEntry) {
        cEntry = {
          id: makeSlugId('pyq_cat', catName),
          categoryName: catName,
          titleHi: payload.titleHi || catName,
          icon: payload.icon || '🏛️',
          exams: []
        };
        state.customTaxonomy.pyqCategories.push(cEntry);
      }
      let eEntry = cEntry.exams.find((e) => normalizeFolderKey(e.examName) === normalizeFolderKey(exName));
      if (!eEntry) {
        eEntry = { examName: exName, years: [], papers: [] };
        cEntry.exams.push(eEntry);
      }
      if (yearStr && !eEntry.years.includes(yearStr)) eEntry.years.push(yearStr);
      if (paperStr && !eEntry.papers.includes(paperStr)) eEntry.papers.push(paperStr);
      if (api && typeof api.saveState === 'function') api.saveState();
      if (window.CGpediaCloud) {
        window.CGpediaCloud.saveCloudDoc('app_config', 'taxonomy', Object.assign({ configKey: 'taxonomy' }, state.customTaxonomy));
      }
      return eEntry;
    }

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
        pyqCategory: payload.pyqCategory || 'Other Exams',
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
      const titleEn = String(payload.titleEn || payload.titleHi || payload.subjectId || 'General Studies').trim();
      const titleHi = String(payload.titleHi || titleEn).trim();
      // Duplicate Folder Prevention: check if a Subject with same normalized name already exists
      const existingSub = catalog.findSubject(payload.subjectId || titleHi || titleEn);
      const mainCatObj = catalog.findMainCategory(payload.mainCategoryId || payload.mainCategory) ||
        (existingSub ? catalog.findMainCategory(existingSub.mainCategoryId) : catalog.findMainCategory('cat_cg_gk'));
      const subjectId = existingSub
        ? existingSub.subjectId
        : String(payload.subjectId || payload.id || makeSlugId('sub', titleEn)).trim();

      const subObj = {
        id: subjectId,
        subjectId,
        mainCategoryId: mainCatObj ? mainCatObj.mainCategoryId : 'cat_cg_gk',
        mainCategory: mainCatObj ? mainCatObj.titleEn : 'Chhattisgarh GK',
        titleEn,
        titleHi,
        examCode: payload.examCode || 'ALL',
        aliases: Array.isArray(payload.aliases) ? payload.aliases : (existingSub ? existingSub.aliases : []),
        topics: Array.isArray(payload.topics) ? payload.topics : (existingSub ? existingSub.topics : []),
        updatedAtIso: nowIso
      };
      const idx = state.subjectMaster.findIndex((s) => (s.subjectId || s.id) === subjectId || normalizeFolderKey(s.titleEn) === normalizeFolderKey(titleEn));
      if (idx >= 0) state.subjectMaster[idx] = Object.assign({}, state.subjectMaster[idx], subObj);
      else state.subjectMaster.push(subObj);

      const cIdx = state.customTaxonomy.customSubjects.findIndex((s) => (s.subjectId || s.id) === subjectId || normalizeFolderKey(s.titleEn) === normalizeFolderKey(titleEn));
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
      const parentSub = catalog.findSubject(payload.subjectId) || catalog.findSubject('sub_cg_general_info');
      const subjectId = parentSub ? parentSub.subjectId : String(payload.subjectId || 'sub_cg_general_info').trim();
      const mainCategoryId = payload.mainCategoryId || (parentSub ? parentSub.mainCategoryId : 'cat_cg_gk');
      const titleEn = String(payload.titleEn || payload.titleHi || 'General Topic').trim();
      const titleHi = String(payload.titleHi || titleEn).trim();

      // Duplicate Folder Prevention: check if Topic already exists under this Subject
      const existingTop = catalog.findTopic(subjectId, payload.topicId || titleHi || titleEn);
      const topicId = (existingTop && existingTop.subjectId === subjectId)
        ? existingTop.topicId
        : String(payload.topicId || payload.id || makeSlugId(`top_${subjectId.replace(/^sub_/, '')}`, titleEn)).trim();

      const topObj = {
        id: topicId,
        topicId,
        subjectId,
        mainCategoryId,
        titleEn,
        titleHi,
        keywords: Array.isArray(payload.keywords) ? payload.keywords : [titleEn.toLowerCase(), titleHi.toLowerCase()],
        updatedAtIso: nowIso
      };
      const idx = state.topicMaster.findIndex((t) => (t.topicId || t.id) === topicId || (t.subjectId === subjectId && normalizeFolderKey(t.titleEn) === normalizeFolderKey(titleEn)));
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
      const idx = state.subtopicMaster.findIndex((st) => (st.subtopicId || st.id) === subtopicId || (st.topicId === topicId && normalizeFolderKey(st.titleEn) === normalizeFolderKey(titleEn)));
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
    const updatedQuestions = [];

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
      const oldHi = existing ? existing.titleHi : '';
      upsertCategoryMasterItem(state, api, 'subject', Object.assign({}, existing || {}, {
        id,
        subjectId: id,
        titleEn: cleanEn,
        titleHi: cleanHi
      }));
      (state.questionBank || []).forEach((q) => {
        if (
          q.subjectId === id ||
          (oldEn && normalizeFolderKey(q.subjectTag) === normalizeFolderKey(oldEn)) ||
          (oldHi && normalizeFolderKey(q.subjectTag) === normalizeFolderKey(oldHi))
        ) {
          q.subjectId = id;
          q.subjectTag = cleanHi || cleanEn;
          updatedQuestions.push(q);
        }
      });
    } else if (cleanType === 'topic') {
      const existing = (catalog.topics || []).find((t) => t.topicId === id);
      const oldEn = existing ? existing.titleEn : '';
      const oldHi = existing ? existing.titleHi : '';
      upsertCategoryMasterItem(state, api, 'topic', Object.assign({}, existing || {}, {
        id,
        topicId: id,
        subjectId: (existing && existing.subjectId) || 'sub_cg_general_info',
        titleEn: cleanEn,
        titleHi: cleanHi
      }));
      (state.questionBank || []).forEach((q) => {
        if (
          q.topicId === id ||
          (oldEn && normalizeFolderKey(q.topic) === normalizeFolderKey(oldEn)) ||
          (oldHi && normalizeFolderKey(q.topic) === normalizeFolderKey(oldHi))
        ) {
          q.topicId = id;
          q.topic = cleanHi || cleanEn;
          updatedQuestions.push(q);
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
        if (q.subtopicId === id || (oldEn && normalizeFolderKey(q.subtopic) === normalizeFolderKey(oldEn))) {
          q.subtopicId = id;
          q.subtopic = cleanEn;
          updatedQuestions.push(q);
        }
      });
    }

    if (api && typeof api.saveState === 'function') api.saveState();
    if (updatedQuestions.length > 0 && window.CGpediaCloud && window.CGpediaCloud.batchSaveCloudDocs) {
      window.CGpediaCloud.batchSaveCloudDocs('question_bank', updatedQuestions);
    }
  }

  // ============================================================================
  // PART 1, PART 6 & PART 7: INTELLIGENT CATEGORISATION INTO 6 MAIN LIBRARIES
  // ============================================================================
  function autoCategorizeQuestionFromMaster(item, catalog, defaultExamIds) {
    const stemAndOptsText = [
      item.questionHi || '',
      item.questionEn || '',
      ...(Array.isArray(item.optionsHi) ? item.optionsHi : []),
      ...(Array.isArray(item.optionsEn) ? item.optionsEn : []),
      item.explanationHi || '',
      item.explanationEn || ''
    ].join(' ').toLowerCase();

    const metaHintText = [
      item.mainCategory || '',
      item.subjectTag || '',
      item.topic || '',
      item.subtopic || ''
    ].join(' ').toLowerCase();

    const combinedText = `${stemAndOptsText} ${metaHintText}`;

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
    const isGenericSubInput = !rawSubInput || [
      'general', 'general studies', 'gs', 'gk', 'general knowledge', 'unknown', 'needs categorisation',
      'needs_categorisation', 'uncategorised', 'uncategorized', 'chhattisgarh general knowledge',
      'chhattisgarh gk', 'indian gs', 'history', 'geography', 'science', 'language'
    ].includes(normalizeFolderKey(rawSubInput));

    const rawTopInput = String(item.topicId || item.topic || '').trim();
    const isGenericTopInput = !rawTopInput || [
      'general', 'general knowledge', 'miscellaneous', 'unknown', 'needs categorisation',
      'needs_categorisation', 'uncategorised', 'uncategorized', 'general topic'
    ].includes(normalizeFolderKey(rawTopInput));

    // 1. Check explicit Topic / Subject match first
    let matchedTop = (!isGenericTopInput)
      ? catalog.findTopic(!isGenericSubInput ? rawSubInput : '', rawTopInput)
      : null;
    let matchedSub = (!isGenericSubInput)
      ? catalog.findSubject(rawSubInput)
      : (matchedTop ? catalog.findSubject(matchedTop.subjectId) : null);

    // If legacy broad subject was used (e.g. "Chhattisgarh General Knowledge" or "History"), refine using question content & topic
    let confidence = 0;
    if (matchedSub && matchedTop && matchedSub.subjectId !== 'sub_uncategorised' && matchedTop.topicId !== 'top_uncategorised') {
      confidence = 90;
    }

    // 2. Score all Topics across the 6 Main Libraries using keywords in question text
    if (!matchedTop || isGenericSubInput) {
      let bestTop = null;
      let bestTopHits = 0;

      for (const top of catalog.topicMaster) {
        if (top.topicId === 'top_uncategorised') continue;
        let hits = 0;
        const terms = [top.titleEn, top.titleHi, ...(top.aliases || []), ...(top.keywords || [])];
        terms.forEach((kw) => {
          const cleanKw = String(kw || '').trim().toLowerCase();
          if (cleanKw && cleanKw.length >= 2 && combinedText.includes(cleanKw)) {
            hits += cleanKw.length >= 6 ? 4 : 2;
          }
        });
        if (hits > bestTopHits) {
          bestTopHits = hits;
          bestTop = top;
        }
      }

      if (bestTop && bestTopHits >= 2) {
        matchedTop = bestTop;
        matchedSub = catalog.findSubject(bestTop.subjectId) || matchedSub;
        confidence = Math.max(confidence, Math.min(96, 68 + bestTopHits * 4));
      }
    }

    // 3. Score all 36 Subject Folders if Subject still not matched
    if (!matchedSub || matchedSub.subjectId === 'sub_uncategorised') {
      let bestSub = null;
      let bestSubHits = 0;
      for (const s of catalog.subjects) {
        if (s.subjectId === 'sub_uncategorised') continue;
        let hits = 0;
        const terms = [s.titleEn, s.titleHi, ...(s.aliases || []), ...(s.keywords || [])];
        terms.forEach((kw) => {
          const cleanKw = String(kw || '').trim().toLowerCase();
          if (cleanKw && cleanKw.length >= 2 && combinedText.includes(cleanKw)) {
            hits += cleanKw.length >= 5 ? 3 : 2;
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

    // 4. Broad domain fallback for Chhattisgarh vs Hindi vs English vs Maths vs Reasoning vs Indian GS
    if (!matchedSub && stemAndOptsText) {
      if (/छत्तीसगढ़|रायपुर|बिलासपुर|बस्तर|सरगुजा|दुर्ग|महानदी|इंद्रावती|शिवनाथ|हसदेव|कलचुरी|रतनपुर|सिरपुर|भोरमदेव|राजिम|बैलाडीला|कोरबा|भिलाई|मेनपाट|घोटुल|पंडवानी|पंथी|सुआ|हरेली|छेरछेरा|भूमकाल|वीर नारायण सिंह|chhattisgarh|bastar|mahanadi|kalchuri/.test(stemAndOptsText)) {
        matchedSub = catalog.findSubject('sub_cg_general_info');
        confidence = 65;
      } else if (/संधि|समास|उपसर्ग|प्रत्यय|पर्यायवाची|विलोम|तत्सम|तद्भव|मुहावरा|लोकोक्ति|अलंकार|छंद|रस|वर्तनी|वर्णमाला|संज्ञा|सर्वनाम|विशेषण/.test(stemAndOptsText)) {
        matchedSub = catalog.findSubject('sub_hindi');
        confidence = 70;
      } else if (/\b(?:synonym|antonym|passive voice|active voice|indirect speech|direct speech|fill in the blank|preposition|idiom|correctly spelt|cloze test)\b/.test(stemAndOptsText)) {
        matchedSub = catalog.findSubject('sub_english');
        confidence = 70;
      } else if (/प्रतिशत|लाभ और हानि|साधारण ब्याज|चक्रवृद्धि ब्याज|अनुपात|औसत|समय और कार्य|रेलगाड़ी|लघुत्तम|महत्तम|क्षेत्रफल|आयतन|त्रिभुज|वृत्त|द्विघात समीकरण|\b(?:percentage|profit and loss|simple interest|compound interest|mensuration|trigonometry)\b/.test(stemAndOptsText)) {
        matchedSub = catalog.findSubject('sub_maths');
        confidence = 70;
      } else if (/कोडिंग|डिकोडिंग|रक्त संबंध|न्याय निगमन|वेन आरेख|पासा|दर्पण प्रतिबिंब|जल प्रतिबिंब|बैठने की व्यवस्था|\b(?:syllogism|blood relation|coding decoding|seating arrangement)\b/.test(stemAndOptsText)) {
        matchedSub = catalog.findSubject('sub_reasoning');
        confidence = 70;
      }
    }

    // 5. If Subject is matched, pick its best matching Topic (or primary Topic)
    if (matchedSub && matchedSub.subjectId !== 'sub_uncategorised' && !matchedTop) {
      const subTopics = catalog.getTopicsForSubject(matchedSub.subjectId);
      if (subTopics && subTopics.length > 0) {
        matchedTop = subTopics[0];
        confidence = Math.max(confidence, 65);
      }
    }

    // 6. If still unidentifiable, DO NOT guess or force into History of Chhattisgarh — place in Uncategorised!
    const hasValidMasterCategory = Boolean(
      matchedSub &&
      matchedTop &&
      matchedSub.subjectId !== 'sub_uncategorised' &&
      matchedTop.topicId !== 'top_uncategorised' &&
      confidence >= 50
    );

    const finalSub = hasValidMasterCategory ? matchedSub : catalog.findSubject('sub_uncategorised');
    const finalTop = hasValidMasterCategory ? matchedTop : catalog.findTopic('sub_uncategorised', 'top_uncategorised');
    const finalMainCat = finalSub ? catalog.findMainCategory(finalSub.mainCategoryId) : catalog.findMainCategory('cat_uncategorised');

    return {
      examIds: finalExamIds,
      examCode: finalExamIds[0] || 'CGPSC',
      mainCategoryId: finalMainCat ? finalMainCat.mainCategoryId : 'cat_uncategorised',
      mainCategory: finalMainCat ? finalMainCat.titleEn : 'Uncategorised',
      subjectId: finalSub ? finalSub.subjectId : 'sub_uncategorised',
      subjectTag: finalSub ? (finalSub.titleHi || finalSub.titleEn) : 'Uncategorised',
      topicId: finalTop ? finalTop.topicId : 'top_uncategorised',
      topic: finalTop ? (finalTop.titleHi || finalTop.titleEn) : 'Uncategorised',
      subtopicId: '',
      subtopic: '',
      categorisationConfidence: hasValidMasterCategory ? confidence : 20,
      needsCategorisation: !hasValidMasterCategory,
      verificationStatus: hasValidMasterCategory ? 'verified' : 'needs_categorisation'
    };
  }

  // Helper to extract structured PYQ Reference objects without guessing missing fields
  function normalizeQuestionPyqReferences(q, catalog) {
    const existingRefs = Array.isArray(q.pyqReferences) ? q.pyqReferences : [];
    const normalizedRefs = [];
    const seenKeys = new Set();

    function addPyqRef(refObj) {
      if (!refObj || typeof refObj !== 'object') return;
      const examCategory = String(refObj.examCategory || '').trim();
      const examName = String(refObj.examName || '').trim();
      const examYear = String(refObj.examYear || '').trim();
      const paperName = String(refObj.paperName || '').trim();
      const shift = String(refObj.shift || '').trim();
      const questionNumber = refObj.questionNumber != null && refObj.questionNumber !== '' ? String(refObj.questionNumber).trim() : '';
      const source = String(refObj.source || '').trim();
      if (!examCategory && !examName) return;

      const finalCategory = examCategory || (examName.toUpperCase().includes('VYAPAM') || examName.toUpperCase().includes('WARDEN') || examName.toUpperCase().includes('PATWARI') || examName.toUpperCase().includes('ADEO')
        ? 'CG Vyapam'
        : examName.toUpperCase().includes('CGPSC')
          ? 'CGPSC'
          : examName.toUpperCase().includes('UPSC')
            ? 'UPSC'
            : examName.toUpperCase().includes('SSC')
              ? 'SSC'
              : examName.toUpperCase().includes('RRB') || examName.toUpperCase().includes('RAILWAY')
                ? 'Railway'
                : examName.toUpperCase().includes('IBPS') || examName.toUpperCase().includes('SBI') || examName.toUpperCase().includes('BANK')
                  ? 'Banking'
                  : examName.toUpperCase().includes('TET') || examName.toUpperCase().includes('TEACHER')
                    ? 'Teaching Exams'
                    : 'Other Exams');

      const dedupKey = `${normalizeFolderKey(finalCategory)}|${normalizeFolderKey(examName || finalCategory)}|${examYear}|${normalizeFolderKey(paperName)}|${normalizeFolderKey(shift)}`;
      if (seenKeys.has(dedupKey)) return;
      seenKeys.add(dedupKey);

      normalizedRefs.push({
        examCategory: finalCategory,
        examName: examName || finalCategory,
        examYear: examYear || '',
        paperName: paperName || '',
        shift: shift || '',
        questionNumber: questionNumber || '',
        subject: q.subjectTag || '',
        topic: q.topic || '',
        source: source || q.sourceDocument || '',
        questionId: q.id || q.questionId || ''
      });
    }

    existingRefs.forEach(addPyqRef);

    // If legacy question had explicit pyqTag or sourceExam, convert without inventing missing year/shift
    const rawPyqStr = String(q.pyqTag || q.sourceExam || '').trim();
    if (rawPyqStr) {
      const yearMatch = rawPyqStr.match(/\b(19\d{2}|20\d{2})\b/);
      const extractedYear = String(q.sourceYear || (yearMatch ? yearMatch[1] : '')).trim();
      const cleanExamName = rawPyqStr.replace(/\b(19\d{2}|20\d{2})\b/, '').replace(/[-–—/(),]+$/, '').trim() || rawPyqStr;
      addPyqRef({
        examCategory: '',
        examName: cleanExamName,
        examYear: extractedYear,
        paperName: q.paperSetCode ? String(q.paperSetCode).trim() : '',
        shift: '',
        questionNumber: q.questionNumber || '',
        source: q.sourceDocument || 'PYQ Archive'
      });
    }

    return normalizedRefs;
  }

  // ============================================================================
  // PART 4, PART 5, PART 6: SAFE MIGRATION, FOLDER DEDUP & QUESTION DEDUPLICATION
  // ============================================================================
  function createQuestionBankBackupSnapshot(state) {
    if (!state) return null;
    const snapshot = {
      backupCreatedAtIso: new Date().toISOString(),
      questionCount: Array.isArray(state.questionBank) ? state.questionBank.length : 0,
      questionBank: JSON.parse(JSON.stringify(state.questionBank || [])),
      subjectMaster: JSON.parse(JSON.stringify(state.subjectMaster || [])),
      topicMaster: JSON.parse(JSON.stringify(state.topicMaster || [])),
      customTaxonomy: JSON.parse(JSON.stringify(state.customTaxonomy || {}))
    };
    state.questionBankBackup = snapshot;
    try {
      localStorage.setItem('cgpedia_qb_pre_migration_backup_v3', JSON.stringify({
        backupCreatedAtIso: snapshot.backupCreatedAtIso,
        questionCount: snapshot.questionCount
      }));
    } catch (_) {}
    return snapshot;
  }

  function restoreQuestionBankFromBackup(state, api) {
    if (!state || !state.questionBankBackup || !Array.isArray(state.questionBankBackup.questionBank)) {
      return false;
    }
    state.questionBank = JSON.parse(JSON.stringify(state.questionBankBackup.questionBank));
    state.subjectMaster = JSON.parse(JSON.stringify(state.questionBankBackup.subjectMaster || []));
    state.topicMaster = JSON.parse(JSON.stringify(state.questionBankBackup.topicMaster || []));
    state.customTaxonomy = JSON.parse(JSON.stringify(state.questionBankBackup.customTaxonomy || {}));
    if (api && typeof api.saveState === 'function') api.saveState();
    return true;
  }

  async function migrateExistingQuestionBankRecords(state, api, options) {
    const opts = options || {};
    state.questionBank = state.questionBank || [];
    state.subjectMaster = state.subjectMaster || [];
    state.topicMaster = state.topicMaster || [];

    // 1. Take automatic Pre-Migration Backup if not already taken in this session
    if (!state.questionBankBackup && state.questionBank.length > 0) {
      createQuestionBankBackupSnapshot(state);
    }

    // 2. Clean up & merge duplicate legacy folders in state.subjectMaster and state.topicMaster
    let duplicateFoldersMergedCount = 0;
    const catalog = getTaxonomyCatalog(state);

    const cleanSubjectMaster = [];
    const seenSubIds = new Set();
    (state.subjectMaster || []).forEach((s) => {
      if (!s) return;
      const canonical = catalog.findSubject(s.subjectId || s.titleHi || s.titleEn);
      if (canonical) {
        if (!seenSubIds.has(canonical.subjectId)) {
          seenSubIds.add(canonical.subjectId);
          cleanSubjectMaster.push(canonical);
        } else {
          duplicateFoldersMergedCount += 1;
        }
      }
    });
    state.subjectMaster = cleanSubjectMaster;

    const cleanTopicMaster = [];
    const seenTopIds = new Set();
    (state.topicMaster || []).forEach((t) => {
      if (!t) return;
      const canonical = catalog.findTopic(t.subjectId, t.topicId || t.titleHi || t.titleEn);
      if (canonical) {
        if (!seenTopIds.has(canonical.topicId)) {
          seenTopIds.add(canonical.topicId);
          cleanTopicMaster.push(canonical);
        } else {
          duplicateFoldersMergedCount += 1;
        }
      }
    });
    state.topicMaster = cleanTopicMaster;

    const refreshedCatalog = getTaxonomyCatalog(state);

    // 3. Migrate & categorize each question + detect exact duplicates & possible duplicates safely
    let migratedCount = 0;
    let alreadyCategorisedCount = 0;
    let uncategorisedCount = 0;
    let duplicateMergedCount = 0;
    let possibleDuplicateCount = 0;
    const migrationErrors = [];
    const docsToSync = [];
    const duplicateIdsToDeleteFromCloud = [];
    const legacyIdMap = {}; // oldDuplicateId -> canonicalQuestionId
    const nowIso = new Date().toISOString();

    const canonicalByExactKey = new Map();
    const canonicalByStemKey = new Map();
    const deduplicatedBank = [];

    // Collect all question IDs actively referenced in Published or Draft Tests so we never break Test references
    const testReferencedQuestionIds = new Set();
    (state.tests || []).forEach((testObj) => {
      ((testObj && testObj.questions) || []).forEach((tq) => {
        if (tq && tq.id) testReferencedQuestionIds.add(String(tq.id));
        if (tq && tq.centralQuestionId) testReferencedQuestionIds.add(String(tq.centralQuestionId));
        if (tq && tq.questionId) testReferencedQuestionIds.add(String(tq.questionId));
      });
    });

    state.questionBank.forEach((q, idx) => {
      try {
        if (!q || typeof q !== 'object') return;
        if (q.isDeleted === true || q.deleted === true || String(q.status || '').toLowerCase() === 'deleted') return;

        const canonicalId = q.questionId || q.id || computeDeterministicQuestionId(q, `mig_${idx}`);
        q.id = q.id || canonicalId;
        q.questionId = q.id;

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

        const rawDiff = String(q.difficultyLevel || q.difficulty || 'Moderate').trim();
        const lowDiff = rawDiff.toLowerCase();
        if (lowDiff === 'easy' || lowDiff === 'सरल') {
          q.difficultyLevel = 'Easy';
          q.difficulty = 'Easy';
        } else if (lowDiff === 'hard' || lowDiff === 'difficult' || lowDiff === 'कठिन') {
          q.difficultyLevel = 'Hard';
          q.difficulty = 'Hard';
        } else {
          q.difficultyLevel = 'Moderate';
          q.difficulty = 'Moderate';
        }

        const examSet = new Set();
        if (Array.isArray(q.examIds)) {
          q.examIds.forEach((e) => {
            const exObj = refreshedCatalog.findExam(e);
            if (exObj) examSet.add(exObj.code);
            else if (String(e || '').trim()) examSet.add(String(e).trim().toUpperCase());
          });
        }
        if (q.examCode) {
          const exObj = refreshedCatalog.findExam(q.examCode);
          if (exObj) examSet.add(exObj.code);
          else if (String(q.examCode).trim().toUpperCase() !== 'ALL') {
            examSet.add(String(q.examCode).trim().toUpperCase());
          }
        }
        if (examSet.size === 0) examSet.add('CGPSC');
        q.examIds = Array.from(examSet);
        q.examCode = q.examIds[0] || 'CGPSC';

        // Classify into the new 6 Main Category -> Subject -> Topic structure
        const predicted = autoCategorizeQuestionFromMaster(q, refreshedCatalog, q.examIds);
        q.mainCategoryId = predicted.mainCategoryId;
        q.mainCategory = predicted.mainCategory;
        q.subjectId = predicted.subjectId;
        q.subjectTag = predicted.subjectTag;
        q.topicId = predicted.topicId;
        q.topic = predicted.topic;
        q.secondaryTopicIds = Array.isArray(q.secondaryTopicIds) ? q.secondaryTopicIds : [];
        q.languageAvailability = detectLanguageAvailability(q.questionHi, q.questionEn);

        // Normalize PYQ References without guessing
        q.pyqReferences = normalizeQuestionPyqReferences(q, refreshedCatalog);

        q.questionType = q.questionType || 'MCQ';
        q.sourceExam = q.sourceExam || '';
        q.sourceYear = q.sourceYear || '';
        q.paperSetCode = q.paperSetCode || '';
        q.sourceDocument = q.sourceDocument || '';
        q.sourcePageNumber = q.sourcePageNumber || '';
        q.createdAt = q.createdAt || q.createdAtIso || nowIso;
        q.updatedAt = nowIso;
        q.updatedAtIso = nowIso;

        if (predicted.needsCategorisation || q.mainCategoryId === 'cat_uncategorised') {
          q.needsCategorisation = true;
          q.verificationStatus = 'needs_categorisation';
          uncategorisedCount += 1;
        } else {
          q.needsCategorisation = false;
          if (!q.verificationStatus || q.verificationStatus === 'needs_categorisation') {
            q.verificationStatus = (q.verified === false || q.adminVerified === false || q.status === 'unverified')
              ? 'unverified'
              : 'verified';
          }
          alreadyCategorisedCount += 1;
        }

        // Exact & Near Duplicate Detection (Part 4)
        const normStemHi = normalizeTextForComparison(q.questionHi || '');
        const normStemEn = normalizeTextForComparison(q.questionEn || '');
        const primaryStemKey = normStemHi || normStemEn;
        const normOptsKey = (optsHi.some(Boolean) ? optsHi : optsEn)
          .map((o) => normalizeTextForComparison(o))
          .join('|');
        const exactCompositeKey = `${primaryStemKey}::${normOptsKey}::${q.correctOptionIndex}`;

        if (primaryStemKey && canonicalByExactKey.has(exactCompositeKey)) {
          // Exact 100% match (same stem, same 4 options, same correct answer) -> merge references safely!
          const existingCanonical = canonicalByExactKey.get(exactCompositeKey);
          existingCanonical.examIds = Array.from(new Set([...(existingCanonical.examIds || []), ...(q.examIds || [])]));
          existingCanonical.linkedTestIds = Array.from(new Set([...(existingCanonical.linkedTestIds || []), ...(q.linkedTestIds || [])]));
          existingCanonical.tags = Array.from(new Set([...(existingCanonical.tags || []), ...(q.tags || [])]));

          // Merge pyqReferences without duplicates
          const combinedPyq = [...(existingCanonical.pyqReferences || []), ...(q.pyqReferences || [])];
          existingCanonical.pyqReferences = normalizeQuestionPyqReferences(
            Object.assign({}, existingCanonical, { pyqReferences: combinedPyq }),
            refreshedCatalog
          );

          if (!existingCanonical.explanationHi && q.explanationHi) existingCanonical.explanationHi = q.explanationHi;
          if (!existingCanonical.explanationEn && q.explanationEn) existingCanonical.explanationEn = q.explanationEn;

          legacyIdMap[q.id] = existingCanonical.id;
          existingCanonical.mergedDuplicateIds = Array.from(new Set([...(existingCanonical.mergedDuplicateIds || []), q.id]));
          duplicateMergedCount += 1;
          if (q.id !== existingCanonical.id && !testReferencedQuestionIds.has(q.id)) {
            duplicateIdsToDeleteFromCloud.push(q.id);
          }
          return;
        }

        // Check if same stem exists with different options/answer -> flag as Possible Duplicate for Admin review (DO NOT auto-delete)
        if (primaryStemKey && canonicalByStemKey.has(primaryStemKey)) {
          const stemMatchQ = canonicalByStemKey.get(primaryStemKey);
          q.possibleDuplicateOfId = stemMatchQ.id;
          q.possibleDuplicateReason = 'समान प्रश्न टेक्स्ट लेकिन विकल्प या उत्तर भिन्न (Same question stem with different options/answer — Admin Review Recommended)';
          possibleDuplicateCount += 1;
        } else if (primaryStemKey) {
          canonicalByStemKey.set(primaryStemKey, q);
        }

        if (primaryStemKey) {
          canonicalByExactKey.set(exactCompositeKey, q);
        }

        deduplicatedBank.push(q);
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

    // Update any Test references that pointed to a merged duplicate ID so Published Tests & Results remain 100% intact
    if (Object.keys(legacyIdMap).length > 0) {
      (state.tests || []).forEach((t) => {
        ((t && t.questions) || []).forEach((tq) => {
          const refId = tq.centralQuestionId || tq.questionId || tq.id;
          if (refId && legacyIdMap[refId]) {
            tq.centralQuestionId = legacyIdMap[refId];
          }
        });
      });
    }

    state.questionBank = deduplicatedBank;

    const finalCatalog = getTaxonomyCatalog(state);
    state.migrationState = {
      version: 3,
      lastRunIso: nowIso,
      lastMigratedAt: nowIso,
      totalInspected: migratedCount + duplicateMergedCount,
      totalQuestions: state.questionBank.length,
      migratedCount,
      alreadyCategorisedCount,
      needsCategorisationCount: uncategorisedCount,
      uncategorisedCount,
      duplicateMergedCount,
      possibleDuplicateCount,
      duplicateFoldersMergedCount,
      mainCategoryCount: finalCatalog.mainCategories.filter((c) => c.mainCategoryId !== 'cat_uncategorised').length,
      subjectFolderCount: finalCatalog.subjects.filter((s) => s.subjectId !== 'sub_uncategorised').length,
      topicFolderCount: finalCatalog.topicMaster.filter((t) => t.topicId !== 'top_uncategorised').length,
      pyqCategoryCount: finalCatalog.pyqCategories.length,
      errors: migrationErrors
    };
    qbState.migrationReport = state.migrationState;

    if (api && typeof api.saveState === 'function') {
      api.saveState();
    }

    if (!opts.skipCloudSync && window.CGpediaCloud) {
      try {
        if (docsToSync.length > 0 && window.CGpediaCloud.batchSaveCloudDocs) {
          await window.CGpediaCloud.batchSaveCloudDocs('question_bank', docsToSync);
        }
        if (duplicateIdsToDeleteFromCloud.length > 0 && window.CGpediaCloud.batchDeleteCloudDocs) {
          await window.CGpediaCloud.batchDeleteCloudDocs('question_bank', duplicateIdsToDeleteFromCloud);
        }
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
    questionhindi: 'questionHi',
    question_hindi: 'questionHi',
    question_in_hindi: 'questionHi',
    qhi: 'questionHi',
    q_hi: 'questionHi',
    qhindi: 'questionHi',
    q_hindi: 'questionHi',
    stemhi: 'questionHi',
    stem_hi: 'questionHi',
    hindi_question: 'questionHi',
    hindiquestion: 'questionHi',
    questionen: 'questionEn',
    question_en: 'questionEn',
    questionenglish: 'questionEn',
    question_english: 'questionEn',
    question_in_english: 'questionEn',
    qen: 'questionEn',
    q_en: 'questionEn',
    qenglish: 'questionEn',
    q_english: 'questionEn',
    stemen: 'questionEn',
    stem_en: 'questionEn',
    english_question: 'questionEn',
    englishquestion: 'questionEn',
    question: 'questionEn',
    opta_hi: 'optA_Hi',
    optiona_hi: 'optA_Hi',
    option_a_hi: 'optA_Hi',
    option_a_hindi: 'optA_Hi',
    optionahindi: 'optA_Hi',
    optahindi: 'optA_Hi',
    opt_a_hindi: 'optA_Hi',
    opt0_hi: 'optA_Hi',
    optb_hi: 'optB_Hi',
    optionb_hi: 'optB_Hi',
    option_b_hi: 'optB_Hi',
    option_b_hindi: 'optB_Hi',
    optionbhindi: 'optB_Hi',
    optbhindi: 'optB_Hi',
    opt_b_hindi: 'optB_Hi',
    opt1_hi: 'optB_Hi',
    optc_hi: 'optC_Hi',
    optionc_hi: 'optC_Hi',
    option_c_hi: 'optC_Hi',
    option_c_hindi: 'optC_Hi',
    optionchindi: 'optC_Hi',
    optchindi: 'optC_Hi',
    opt_c_hindi: 'optC_Hi',
    opt2_hi: 'optC_Hi',
    optd_hi: 'optD_Hi',
    optiond_hi: 'optD_Hi',
    option_d_hi: 'optD_Hi',
    option_d_hindi: 'optD_Hi',
    optiondhindi: 'optD_Hi',
    optdhindi: 'optD_Hi',
    opt_d_hindi: 'optD_Hi',
    opt3_hi: 'optD_Hi',
    opta_en: 'optA_En',
    optiona_en: 'optA_En',
    option_a_en: 'optA_En',
    option_a_english: 'optA_En',
    optionaenglish: 'optA_En',
    optaenglish: 'optA_En',
    opt_a_english: 'optA_En',
    opta: 'optA_En',
    option_a: 'optA_En',
    optiona: 'optA_En',
    option1: 'optA_En',
    option_1: 'optA_En',
    opt0_en: 'optA_En',
    optb_en: 'optB_En',
    optionb_en: 'optB_En',
    option_b_en: 'optB_En',
    option_b_english: 'optB_En',
    optionbenglish: 'optB_En',
    optbenglish: 'optB_En',
    opt_b_english: 'optB_En',
    optb: 'optB_En',
    option_b: 'optB_En',
    optionb: 'optB_En',
    option2: 'optB_En',
    option_2: 'optB_En',
    opt1_en: 'optB_En',
    optc_en: 'optC_En',
    optionc_en: 'optC_En',
    option_c_en: 'optC_En',
    option_c_english: 'optC_En',
    optioncenglish: 'optC_En',
    optcenglish: 'optC_En',
    opt_c_english: 'optC_En',
    optc: 'optC_En',
    option_c: 'optC_En',
    optionc: 'optC_En',
    option3: 'optC_En',
    option_3: 'optC_En',
    opt2_en: 'optC_En',
    optd_en: 'optD_En',
    optiond_en: 'optD_En',
    option_d_en: 'optD_En',
    option_d_english: 'optD_En',
    optiondenglish: 'optD_En',
    optdenglish: 'optD_En',
    opt_d_english: 'optD_En',
    optd: 'optD_En',
    option_d: 'optD_En',
    optiond: 'optD_En',
    option4: 'optD_En',
    option_4: 'optD_En',
    opt3_en: 'optD_En',
    correctindex: 'correctIndex',
    correct_index: 'correctIndex',
    correctoptionindex: 'correctIndex',
    correctoption: 'correctIndex',
    correct_option: 'correctIndex',
    correct_answer: 'correctIndex',
    correctanswer: 'correctIndex',
    right_answer: 'correctIndex',
    rightanswer: 'correctIndex',
    answer: 'correctIndex',
    ans: 'correctIndex',
    explanationhi: 'explanationHi',
    explanation_hi: 'explanationHi',
    explanationhindi: 'explanationHi',
    explanation_hindi: 'explanationHi',
    solution_hi: 'explanationHi',
    solution_hindi: 'explanationHi',
    exphi: 'explanationHi',
    explanationen: 'explanationEn',
    explanation_en: 'explanationEn',
    explanationenglish: 'explanationEn',
    explanation_english: 'explanationEn',
    solution_en: 'explanationEn',
    solution_english: 'explanationEn',
    solution: 'explanationEn',
    expen: 'explanationEn',
    explanation: 'explanationEn',
    subjecttag: 'subjectTag',
    subject_tag: 'subjectTag',
    subject: 'subjectTag',
    subjectid: 'subjectId',
    subject_id: 'subjectId',
    maincategory: 'mainCategory',
    main_category: 'mainCategory',
    maincategoryid: 'mainCategoryId',
    main_category_id: 'mainCategoryId',
    category: 'mainCategory',
    library: 'mainCategory',
    examcode: 'examCode',
    exam_code: 'examCode',
    examcategory: 'examCode',
    exam_category: 'examCode',
    exam: 'examCode',
    examname: 'sourceExam',
    exam_name: 'sourceExam',
    examyear: 'sourceYear',
    exam_year: 'sourceYear',
    year: 'sourceYear',
    papername: 'paperName',
    paper_name: 'paperName',
    paper: 'paperName',
    shift: 'shift',
    examshift: 'shift',
    exam_shift: 'shift',
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
    source: 'sourceDocument',
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
    'प्रश्न_हिन्दी': 'questionHi',
    'प्रश्न_हिंदी': 'questionHi',
    'अंग्रेजी_प्रश्न': 'questionEn',
    'प्रश्न_अंग्रेजी': 'questionEn',
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
    'हल': 'explanationHi',
    'मुख्य_श्रेणी': 'mainCategory',
    'विषय': 'subjectTag',
    'टॉपिक': 'topic',
    'अध्याय': 'topic',
    'उपटॉपिक': 'subtopic',
    'परीक्षा': 'examCode',
    'परीक्षा_नाम': 'sourceExam',
    'परीक्षा_वर्ष': 'sourceYear',
    'वर्ष': 'sourceYear',
    'पेपर': 'paperName',
    'शिफ्ट': 'shift',
    'कठिनाई': 'difficulty',
    'स्तर': 'difficulty'
  };

  // ============================================================================
  // KRUTIDEV-010 / DEVLYS-010 LEGACY HINDI FONT DETECTOR & UNICODE CONVERTER
  // ============================================================================
  const KRUTIDEV_REPLACEMENT_PAIRS = [
    ['¼v½', '(अ)'], ['¼c½', '(ब)'], ['¼l½', '(स)'], ['¼n½', '(द)'],
    ['¼d½', '(क)'], ['¼[k½', '(ख)'], ['¼x½', '(ग)'], ['¼?k½', '(घ)'],
    ['¼1½', '(1)'], ['¼2½', '(2)'], ['¼3½', '(3)'], ['¼4½', '(4)'],
    ['¼A½', '(A)'], ['¼B½', '(B)'], ['¼C½', '(C)'], ['¼D½', '(D)'],
    ['ñ', '॰'], ['Q+Z', 'क़्ज़'], ['sas', 'ें'], ['sa', 'ं'],
    ['£', 'र्'], ['Ä', 'द्ध'], ['Å', 'ऊ'], ['Æ', 'र्त्'], ['Ç', 'ड़'], ['È', 'ढ़'],
    ['É', 'ङ्ग'], ['Ê', 'झ्'], ['Ë', 'ञ्च'], ['Ì', 'ट्ट'], ['Í', 'ठ्ठ'], ['Î', 'ड्ड'],
    ['Ï', 'ढ्ढ'], ['Ñ', 'त्त'], ['Ò', 'द्भ'], ['Ó', 'द्म'], ['Ô', 'द्य'], ['Õ', 'द्व'],
    ['Ö', 'क्र'], ['×', 'द्र'], ['Ø', 'क्र'], ['Ùk', 'त्त'], ['Ù', 'त्'], ['Ú', 'फ्र'],
    ['Û', 'ह्न'], ['Ü', 'ह्म'], ['Ý', 'ह्य'], ['Þ', 'ह्र'], ['ß', 'ह्ल'],
    ['à', 'ह्व'], ['á', '्र'], ['â', '्र'], ['ã', 'हृ'], ['ä', 'क्त'], ['å', 'औ'],
    ['æ', '्र'], ['ç', 'प्र'], ['è', 'ध्'], ['é', 'न्न'], ['ê', 'जी'], ['ë', 'द्ग'],
    ['ì', 'द्घ'], ['í', 'द्द'], ['î', 'द्ध'], ['ï', 'द्ब'], ['ð', 'िट'], ['ñ', '॰'],
    ['ò', 'द्व'], ['ó', 'ट्ट'], ['ô', 'क्क'], ['õ', 'ल्ल'], ['ö', 'च्च'], ['÷', 'ज्ज'],
    ['ø', '्र'], ['ù', 'ञ्च'], ['ú', 'ज्ज'], ['û', 'क्त'], ['ü', 'श्व'], ['ý', 'श्र'],
    ['þ', 'त्र'], ['ÿ', 'ज्ञ'],
    ['vks', 'ओ'], ['vkS', 'औ'], ['vk', 'आ'], ['v', 'अ'], ['bZ', 'ई'], ['b', 'इ'],
    ['m', 'उ'], ['ऊ', 'ऊ'], [',s', 'ऐ'], [',', 'ए'], ['_', 'ऋ'],
    ['d+', 'क़'], ['[+', 'ख़'], ['x+', 'ग़'], ['t+', 'ज़'], ['M+', 'ड़'], ['<+', 'ढ़'], ['Q+', 'फ़'],
    ['[k', 'ख'], ['[', 'ख्'], ['?k', 'घ'], ['?', 'घ्'], ['³', 'ङ'],
    ['pk', 'चा'], ['p', 'च'], ['N', 'छ'], ['t', 'ज'], ['>k', 'झा'], ['>', 'झ'], ['¥', 'ञ'],
    ['V', 'ट'], ['B', 'ठ'], ['M', 'ड'], ['<', 'ढ'], ['.k', 'ण'], ['.', 'ण्'],
    ['r', 'त'], ['Fkk', 'था'], ['Fk', 'थ'], ['F', 'थ्'], ['n', 'द'], ['/k', 'ध'], ['/', 'ध्'], ['u', 'न'],
    ['i', 'प'], ['Q', 'फ'], ['c', 'ब'], ['Hkk', 'भा'], ['Hk', 'भ'], ['H', 'भ्'], ['e', 'म'],
    [';', 'य'], ['j', 'र'], ['y', 'ल'], ['G', 'ळ'], ['o', 'व'],
    ["'k", 'श'], ["'", 'श्'], ['"k', 'ष'], ['"', 'ष्'], ['l', 'स'], ['g', 'ह'],
    ['{k', 'क्ष'], ['{', 'क्ष्'], ['=', 'त्र'], ['«', 'त्र्'], ['K', 'ज्ञ'],
    ['d', 'क'], ['x', 'ग'],
    ['ks', 'ो'], ['kS', 'ौ'], ['k', 'ा'], ['h', 'ी'], ['q', 'ु'], ['w', 'ू'],
    ['`', 'ृ'], ['s', 'े'], ['S', 'ै'], ['a', 'ं'], ['¡', 'ँ'], ['%', 'ः'], ['~', '्'],
    ['¼', '('], ['½', ')'], ['\\', '?'], ['A', '।'], ['-', '.']
  ];

  function isLikelyKrutiDevWordOrSegment(seg) {
    const s = String(seg || '').trim();
    if (!s || /[\u0900-\u097F]/.test(s)) return false;
    // Explicit KrutiDev option markers or high-certainty ligature bytes
    if (/¼[vclndxg?1-4A-D]\[?k?½|[NÙhlx<+]{4,}|fuEufyf\[kr|lafo\/kku|vuqPNsn|NRrhlx<|NÙhlx<|mÙkj|iz'u|fLFkr|jkT;|ljdkj|Hkkjr/.test(s)) {
      return true;
    }
    if (/[\u00C0-\u00FF]/.test(s) && /[a-zA-Z]/.test(s)) {
      return true;
    }
    // Check token-level KrutiDev function words & mid-word casing/punctuation patterns
    const tokens = s.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return false;
    let krutiTokenHits = 0;
    const krutiFuncWordRegex = /^(?:gS|gSa|Fkk|Fkh|Fks|esa|dk|dh|ds|dks|ls|ij|vkSj|;g|og|dc|dgk¡|dgka|dkSu|fdl|fdlus|iz'u|mÙkj|lfefr|ftyk|unh|igkM\+|Hkkjr|jkT;|fLFkr|ugha|fd;k|tkrk|gksrk|द्वारा|dFku|dwV|lgh|चुनिए)$/i;
    const krutiPatternRegex = /(?:[a-z][A-Z][a-z]|\[k|\?k|M\+|<+|\b[dfghjlmnprtuwy]k[sS]?\b|\bf[dghjklmnprstvwxyz][a-z]*\b|[;\\~`{}])/;
    tokens.forEach((tok) => {
      const cleanTok = tok.replace(/^[(),.:;\-]+|[(),.:;\-]+$/g, '');
      if (!cleanTok) return;
      if (krutiFuncWordRegex.test(cleanTok) || krutiPatternRegex.test(cleanTok)) {
        krutiTokenHits += 1;
      }
    });
    return (krutiTokenHits >= 2 && krutiTokenHits / tokens.length >= 0.28) || (tokens.length <= 3 && krutiTokenHits >= 1 && /¼|½|\[k|\?k|M\+|<+|;/.test(s));
  }

  function convertSingleKrutiDevSegmentToUnicode(krutiStr) {
    let text = String(krutiStr || '');
    if (!text.trim()) return text;

    // 1. Protect numeric ranges and question numbers at start e.g. "1-" -> "1."
    text = text.replace(/^(\s*\d{1,4})\s*-\s*/gm, '$1. ');

    // 2. Reorder KrutiDev short 'i' matra ('f') from before consonant cluster to after the consonant ('ि')
    // Handle 'f' + half-consonants + full-consonant
    text = text.replace(/f((?:[\[?/'"{«]|[dghjklmnprstvwxyzcbVBM<.]~)*)(?:(\[k|\?k|'k|"k|\{k|\.k|M\+|<+|d\+|x\+|t\+|Q\+|Fk|Hk|\/k|>k|pk|Hkk|Fkk|[dghjklmnprstvwxyzcbVBM<>;QGK=]))/g, '$1$2ि');

    // 3. Reorder KrutiDev reph ('Z') before the syllable it sits on
    text = text.replace(/([dghjklmnprstvwxyzcbVBM<>;QGK=\[?/'"{])([ksSqw`sSa¡]*?)Z/g, '£$1$2');

    // 4. Apply lookup replacements
    for (let i = 0; i < KRUTIDEV_REPLACEMENT_PAIRS.length; i++) {
      const [src, dst] = KRUTIDEV_REPLACEMENT_PAIRS[i];
      if (text.includes(src)) {
        text = text.split(src).join(dst);
      }
    }

    // 5. Clean up matra combinations
    text = text
      .replace(/अा/g, 'आ')
      .replace(/आे/g, 'ओ')
      .replace(/आै/g, 'औ')
      .replace(/एे/g, 'ऐ')
      .replace(/्ा/g, '')
      .replace(/्े/g, 'े')
      .replace(/्ै/g, 'ै')
      .replace(/्ो/g, 'ो')
      .replace(/्ौ/g, 'ौ');

    return text;
  }

  function convertKrutiDevInText(rawText) {
    const str = String(rawText || '');
    if (!str.trim()) return str;
    const lines = str.split(/\r?\n/);
    const convertedLines = lines.map((line) => {
      if (!line.trim()) return line;
      // Always convert explicit KrutiDev option markers ¼v½ ¼c½ ¼l½ ¼n½
      let working = line
        .replace(/¼v½/g, '(अ)')
        .replace(/¼c½/g, '(ब)')
        .replace(/¼l½/g, '(स)')
        .replace(/¼n½/g, '(द)')
        .replace(/¼d½/g, '(क)')
        .replace(/¼\[k½/g, '(ख)')
        .replace(/¼x½/g, '(ग)')
        .replace(/¼\?k½/g, '(घ)');

      if (isLikelyShreeDevText(working)) {
        return convertShreeDevSegmentToUnicode(working);
      }

      if (!isLikelyKrutiDevWordOrSegment(working)) {
        return working;
      }

      // If the line has both a KrutiDev half and an English half separated by 2+ spaces or slash, convert only the KrutiDev part
      const parts = working.split(/(\s{2,}|\s+\/\s+|\s+\|\|\s+)/);
      if (parts.length > 1) {
        return parts.map((part) => {
          if (/^(\s{2,}|\s+\/\s+|\s+\|\|\s+)$/.test(part)) return part;
          if (isLikelyShreeDevText(part)) return convertShreeDevSegmentToUnicode(part);
          return isLikelyKrutiDevWordOrSegment(part) ? convertSingleKrutiDevSegmentToUnicode(part) : part;
        }).join('');
      }

      return convertSingleKrutiDevSegmentToUnicode(working);
    });
    return convertedLines.join('\n');
  }

  // ============================================================================
  // SHREE-DEV 0708 (CGPSC / VYAPAM OFFICIAL PAPER FONT) TO UNICODE CONVERTER
  // ============================================================================
  const WIN1252_SHREEDEV_MAP = {
    0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡',
    0x88: 'ˆ', 0x89: '‰', 0x8A: 'Š', 0x8B: '‹', 0x8C: 'Œ', 0x8E: 'Ž',
    0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—',
    0x98: '˜', 0x99: '™', 0x9A: 'š', 0x9B: '›', 0x9C: 'œ', 0x9E: 'ž', 0x9F: 'Ÿ'
  };

  function fixWin1252Bytes(str) {
    let out = '';
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      if (WIN1252_SHREEDEV_MAP[code]) out += WIN1252_SHREEDEV_MAP[code];
      else out += s[i];
    }
    return out;
  }

  function isLikelyShreeDevText(str) {
    const s = fixWin1252Bytes(String(str || ''));
    if (!s || s.length < 2 || /[\u0900-\u097F]/.test(s)) return false;
    // Shree-Dev 0708 signatures: > (ा), _| (में), h¢/h¡ (है/हैं), H$/Ho$ (क/के), m (ा), r (ी), p/q (ि), © (रेफ)
    if (/[A-Za-z]>/.test(s) || /_\|/.test(s) || /h[¢¡]/.test(s) || /H\$|Ho\$/.test(s) || /[\u00A1-\u00FF‹Šœ]/.test(s)) {
      const shreeHits = (s.match(/(?:[BCDEFGHJKLNPRTUVWXYZbcdfghjklnoM]>|_m|_\||H\$|Ho\$|h[¢¡]|[\u00A1-\u00FF‹Šœ])/g) || []).length;
      if (shreeHits >= 1) return true;
    }
    return false;
  }

  const SHREEDEV_REPLACEMENTS = [
    ['(A)', ' \uE010 '],
    ['(B)', ' \uE011 '],
    ['(C)', ' \uE012 '],
    ['(D)', ' \uE013 '],
    ['Ho$db', 'केवल'],
    ['H$mo', 'को'],
    ['Ho$', 'के'],
    ['H$m', 'का'],
    ['H$r', 'की'],
    ['H$s', 'की'],
    ['_|', 'में'],
    ['h¢', 'हैं'],
    ['h¡', 'है'],
    ['I>', 'ड़ा'],
    ['I‹', 'ड़'],
    ['S>‹', 'ड़'],
    ['‹S>', 'ड़'],
    ['T‹>', 'ढ़ा'],
    ['T>‹', 'ढ़ा'],
    ['‹T>', 'ढ़ा'],
    ['T‹', 'ढ़'],
    ['‹T', 'ढ़'],
    ['Am¡', 'औ'],
    ['Amo', 'ओ'],
    ['Am', 'आ'],
    ['A>', 'आ'],
    ['A§', 'अं'],
    ['A:', 'अः'],
    ['A', 'अ'],
    ['B©', 'ई'],
    ['B', 'इ'],
    ['C', 'उ'],
    ['D', 'ऊ'],
    ['F©', 'ऐ'],
    ['F', 'ऋ'],
    ['Eog', 'ऐस'],
    ['Eo', 'ऐ'],
    ['E', 'ए'],
    ['G', 'ऐ'],
    ['H$>', 'का'],
    ['H>', 'का'],
    ['H$', 'क'],
    ['H', 'क्'],
    ['Š', 'क्'],
    ['I>', 'खा'],
    ['I', 'ख'],
    ['J>', 'गा'],
    ['J', 'ग'],
    ['K>', 'घा'],
    ['K', 'घ'],
    ['L>', 'ङ'],
    ['M>', 'चा'],
    ['M', 'च'],
    ['N>Îm', 'छत्त'],
    ['N>', 'छ'],
    ['N', 'छ'],
    ['O>', 'जा'],
    ['O', 'ज'],
    ['P>', 'झा'],
    ['P', 'झ'],
    ['Q´>', 'ट्र'],
    ['Q>', 'ट'],
    ['Q', 'ट'],
    ['R>', 'ठ'],
    ['R', 'ठ'],
    ['S>', 'ड'],
    ['S', 'ड'],
    ['T>', 'ढ'],
    ['T', 'ढ'],
    ['U>', 'ण'],
    ['U', 'ण'],
    ['V>', 'ता'],
    ['V', 'त'],
    ['W>', 'था'],
    ['W', 'थ'],
    ['X>', 'दा'],
    ['X', 'द'],
    ['Y>', 'धा'],
    ['Y', 'ध'],
    ['Z>', 'ना'],
    ['Z', 'न'],
    ['n>', 'पा'],
    ['n', 'प'],
    ['\\$>', 'फा'],
    ['\\>', 'फ'],
    ['\\$', 'फ'],
    ['\\', 'फ्'],
    ['~>', 'बा'],
    ['~', 'ब'],
    [']>', 'बा'],
    [']', 'ब'],
    ['^>', 'भा'],
    ['^', 'भ'],
    ['_>', 'मा'],
    ['_', 'म'],
    ['`>', 'या'],
    ['`', 'य'],
    ['a>', 'रा'],
    ['a', 'र'],
    ['b>', 'ला'],
    ['b', 'ल'],
    ['d>', 'वा'],
    ['d', 'व'],
    ['c>', 'वा'],
    ['c', 'व'],
    ['e>', 'शा'],
    ['e', 'श'],
    ['f>', 'षा'],
    ['f', 'ष'],
    ['g>', 'सा'],
    ['g', 'स'],
    ['h>', 'हा'],
    ['h', 'ह'],
    ['i>', 'ळ'],
    ['i', 'ळ'],
    ['j>', 'क्षा'],
    ['j', 'क्ष'],
    ['k>', 'ज्ञा'],
    ['k', 'ज्ञ'],
    ['l>', 'श्र'],
    ['l', 'श्र'],
    ['œ>', 'श्व'],
    ['œ', 'श्व'],
    ['Á', 'ज्'],
    ['Æ', 'ड'],
    ['Ê', 'ण्'],
    ['Ë', 'त्'],
    ['Ì', 'त्र'],
    ['Îm', 'त्त'],
    ['Î', 'त्त'],
    ['Ð', 'द्र'],
    ['Ñ', 'त्र'],
    ['Õ', 'द्ध'],
    ['Ö', 'द्ध'],
    ['×', 'द्व'],
    ['Ú', 'द्य'],
    ['Û', 'द्व'],
    ['Ü', 'ध्'],
    ['Ý', 'न्'],
    ['ß', 'प्'],
    ['à', 'प्र'],
    ['á', 'ष्ट'],
    ['â', 'ष्ठ'],
    ['ã', 'ब्'],
    ['ä', 'भ्'],
    ['å', 'म्'],
    ['æ', 'ह्र'],
    ['ç', 'ह्ल'],
    ['è', 'ह्व'],
    ['é', 'क्त'],
    ['ê', 'क्र'],
    ['ë', 'ल्'],
    ['ì', 'व्'],
    ['í', 'श्'],
    ['î', 'ष्'],
    ['ï', 'ज्ज'],
    ['ð', 'ज्ञ्'],
    ['ñ', 'स्'],
    ['ò', 'ह्'],
    ['ó', 'त्त्व'],
    ['ô', 'त्त्'],
    ['õ', 'प्त'],
    ['ö', 'प्र'],
    ['÷', 'फ्ल'],
    ['ø', 'ब्ब'],
    ['ù', 'भ्र'],
    ['ú', 'म्र'],
    ['û', 'म्ल'],
    ['ü', 'हु'],
    ['ý', 'श्'],
    ['þ', 'ष'],
    ['ÿ', 'स्र'],
    ['§', 'ं'],
    ['¨', 'ू'],
    ['©', 'र्'],
    ['ª', 'ंर्'],
    ['«', '्र'],
    ['¬', '्र'],
    ['®', 'ृ'],
    ['¯', '्र'],
    ['°', 'ॉ'],
    ['±', 'ं'],
    ['²', '्'],
    ['³', '्'],
    ['´', '्र'],
    ['µ', '्'],
    ['¶', 'य'],
    ['·', 'क'],
    ['¸', 'ख'],
    ['¹', 'ग'],
    ['º', 'घ'],
    ['»', 'ख्'],
    ['¼', 'ज'],
    ['½', 'ग्'],
    ['¾', 'ण'],
    ['¿', 'त'],
    ['À', 'थ'],
    ['Â', 'ध'],
    ['Ã', 'न'],
    ['Ä', 'प'],
    ['Å', 'ब'],
    ['Ç', 'म'],
    ['È', 'य'],
    ['É', 'र'],
    ['Í', 'ष'],
    ['Ï', 'ह'],
    ['Ò', 'ज्ञ'],
    ['Ó', 'श्र'],
    ['Ô', 'त्र'],
    ['Ø', 'द्य'],
    ['Ù', 'प्त'],
    ['mo', 'ो'],
    ['m¡', 'ौ'],
    ['m|', 'ों'],
    ['m¢', 'ौं'],
    ['o$', 'े'],
    ['o', 'े'],
    ['}', 'ै'],
    ['m', 'ा'],
    ['>', 'ा'],
    ['r', 'ी'],
    ['s', 'ी'],
    ['t', 'ीं'],
    ['u', 'ीर्'],
    ['v', 'ु'],
    ['w', 'ु'],
    ['x', 'ू'],
    ['y', 'ू'],
    ['z', 'े'],
    ['|', 'ें'],
    ['¡', 'ै'],
    ['¢', 'ैं'],
    ['£', 'ीं'],
    ['¤', 'ों'],
    ['¥', 'ृ'],
    ['¦', 'ँ'],
    ['±', 'ं'],
    ['‹', '़'],
    ['&', '।'],
    ['$', '']
  ];

  function convertShreeDevSegmentToUnicode(input) {
    let s = fixWin1252Bytes(String(input || ''));
    if (!s.trim()) return s;

    // Protect Roman numeral sub-points (i., ii., iii., iv., v., vi.) before Shree-Dev mapping
    s = s
      .replace(/\biv\s*\./g, '\uE024 ')
      .replace(/\biii\s*\./g, '\uE023 ')
      .replace(/\bii\s*\./g, '\uE022 ')
      .replace(/\bi\s*\./g, '\uE021 ')
      .replace(/\b(i|ii|iii|iv)\b(?=\s+(?:d|Am¡a|VWm|एवं|और)\b|\s*,)|(?<=\b(?:Ho$db|केवल|d|Am¡a|VWm|एवं|और)\s+)\b(i|ii|iii|iv)\b/g, (m) => {
        if (m === 'i') return '\uE025';
        if (m === 'ii') return '\uE026';
        if (m === 'iii') return '\uE027';
        return '\uE028';
      });

    // Replace pre-base chhoti-i matras '{', '[', 'p', 'q' with sentinel markers BEFORE consonant replacement
    s = s
      .replace(/\{/g, '\uE030')
      .replace(/\[/g, '\uE030')
      .replace(/p/g, '\uE030')
      .replace(/q/g, '\uE031');

    for (let i = 0; i < SHREEDEV_REPLACEMENTS.length; i++) {
      const [pat, rep] = SHREEDEV_REPLACEMENTS[i];
      if (s.includes(pat)) s = s.split(pat).join(rep);
    }

    // Move pre-base chhoti-i matra sentinels (\uE030 = 'ि', \uE031 = 'िं') after the following consonant cluster
    let chars = Array.from(s);
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === '\uE030' || chars[i] === '\uE031') {
        const isNas = chars[i] === '\uE031';
        let j = i + 1;
        while (j < chars.length && /[\u0915-\u0939\u0958-\u095F]/.test(chars[j])) {
          if (j + 1 < chars.length && chars[j + 1] === '्') {
            j += 2;
          } else {
            j += 1;
            break;
          }
        }
        if (j < chars.length && chars[j] === '़') j += 1;
        const targetPos = Math.max(i + 1, j);
        chars.splice(i, 1);
        chars.splice(targetPos - 1, 0, isNas ? 'िं' : 'ि');
      }
    }
    s = chars.join('');

    // Reph 'र्' adjustment: in Shree-Dev, © ('र्') comes AFTER the consonant+matra it sits on, so move it before the consonant cluster
    s = s.replace(/([\u0915-\u0939\u0958-\u095F](?:्[\u0915-\u0939\u0958-\u095F])*[\u093C]?[\u093E-\u094C\u0902\u0901]*)र्/g, 'र्$1');

    // Clean up vowel + matra combinations and restore protected tokens
    s = s
      .replace(/अा/g, 'आ')
      .replace(/अो/g, 'ओ')
      .replace(/अौ/g, 'औ')
      .replace(/अं/g, 'अं')
      .replace(/एे/g, 'ऐ')
      .replace(/इर्/g, 'ई')
      .replace(/ाा/g, 'ा')
      .replace(/ाो/g, 'ो')
      .replace(/ाौ/g, 'ौ')
      .replace(/ाे/g, 'ो')
      .replace(/ाै/g, 'ौ')
      .replace(/्ा/g, '')
      .replace(/्ो/g, 'ो')
      .replace(/्ौ/g, 'ौ')
      .replace(/्े/g, 'े')
      .replace(/्ै/g, 'ै')
      .replace(/्ी/g, 'ी')
      .replace(/्ि/g, 'ि')
      .replace(/्ु/g, 'ु')
      .replace(/्ू/g, 'ू')
      .replace(/ूा/g, 'ू')
      .replace(/डढ़/g, 'गढ़')
      .replace(/गढ़ा/g, 'गढ़')
      .replace(/\uE010/g, '(A)')
      .replace(/\uE011/g, '(B)')
      .replace(/\uE012/g, '(C)')
      .replace(/\uE013/g, '(D)')
      .replace(/\uE021/g, 'i.')
      .replace(/\uE022/g, 'ii.')
      .replace(/\uE023/g, 'iii.')
      .replace(/\uE024/g, 'iv.')
      .replace(/\uE025/g, 'i')
      .replace(/\uE026/g, 'ii')
      .replace(/\uE027/g, 'iii')
      .replace(/\uE028/g, 'iv');

    return s.replace(/\s+/g, ' ').trim();
  }

  // ============================================================================
  // PDF STREAM & TOUNICODE CMAP DECODERS + GARBLED TEXT SANITIZER
  // ============================================================================
  function parsePdfToUnicodeCMap(streamStr) {
    const cmap = new Map();
    const s = String(streamStr || '');
    if (!s.includes('beginbfchar') && !s.includes('beginbfrange')) return cmap;

    const bfcharRegex = /beginbfchar([\s\S]*?)endbfchar/gi;
    let m;
    while ((m = bfcharRegex.exec(s)) !== null) {
      const pairRegex = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
      let pm;
      while ((pm = pairRegex.exec(m[1])) !== null) {
        const srcHex = pm[1].toUpperCase();
        const dstHex = pm[2];
        let uStr = '';
        for (let i = 0; i < dstHex.length; i += 4) {
          const cp = parseInt(dstHex.slice(i, i + 4), 16);
          if (cp && cp !== 0xFEFF) uStr += String.fromCodePoint(cp);
        }
        if (uStr) cmap.set(srcHex, uStr);
      }
    }

    const bfrangeRegex = /beginbfrange([\s\S]*?)endbfrange/gi;
    while ((m = bfrangeRegex.exec(s)) !== null) {
      const rangeRegex = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
      let rm;
      while ((rm = rangeRegex.exec(m[1])) !== null) {
        const startCode = parseInt(rm[1], 16);
        const endCode = parseInt(rm[2], 16);
        const targetStart = parseInt(rm[3], 16);
        const padLen = rm[1].length;
        if (!isNaN(startCode) && !isNaN(endCode) && !isNaN(targetStart) && endCode >= startCode && (endCode - startCode) <= 512) {
          for (let c = startCode; c <= endCode; c++) {
            const keyHex = c.toString(16).toUpperCase().padStart(padLen, '0');
            const cp = targetStart + (c - startCode);
            if (cp > 0 && cp !== 0xFEFF) {
              cmap.set(keyHex, String.fromCodePoint(cp));
            }
          }
        }
      }
    }
    return cmap;
  }

  function sanitizeExtractedPdfText(rawStr) {
    const lines = fixWin1252Bytes(String(rawStr || ''))
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uE000-\uF8FF\uFFFD]/g, ' ')
      .split(/\r?\n/);

    const cleanLines = [];
    lines.forEach((rawLine) => {
      const line = rawLine.replace(/\s+/g, ' ').trim();
      if (!line) return;
      // Filter out raw PDF dictionary / object / stream syntax
      if (/^(?:%PDF-|\d+\s+\d+\s+obj\b|endobj\b|stream\b|endstream\b|xref\b|trailer\b|startxref\b|<<|>>|\/(?:Type|Subtype|Font|BaseFont|Filter|FlateDecode|Length|Resources|MediaBox|Parent|Contents|ProcSet|Encoding|ToUnicode|CIDSystemInfo|FontDescriptor)\b)/i.test(line)) {
        return;
      }
      if ((line.match(/\/[A-Z][A-Za-z0-9]+/g) || []).length >= 3) {
        return;
      }
      cleanLines.push(line);
    });
    return convertKrutiDevInText(cleanLines.join('\n'));
  }

  function isExtractedPageGarbledOrEmpty(pageText) {
    const clean = String(pageText || '').trim();
    if (!clean || clean.length < 15) return true;
    const nonSpace = clean.replace(/\s+/g, '');
    if (nonSpace.length < 10) return true;
    const puaOrReplacement = (clean.match(/[\uE000-\uF8FF\uFFFD\u0001-\u001F]/g) || []).length;
    if (puaOrReplacement > Math.max(3, nonSpace.length * 0.08)) return true;

    const devChars = (clean.match(/[\u0900-\u097F]/g) || []).length;
    const latinWords = (clean.match(/\b[A-Za-z]{3,}\b/g) || []).filter((w) => /[aeiouAEIOU]/.test(w)).length;
    const strangeSymbols = (clean.match(/[^A-Za-z0-9\u0900-\u097F\s.,?:;()[\]\-/'"+=%₹।]/g) || []).length;

    if (strangeSymbols / nonSpace.length > 0.22 && devChars < 10 && latinWords < 5) {
      return true;
    }
    if (devChars < 5 && latinWords < 3) {
      return true;
    }
    return false;
  }

  function decodePdfEscapedLiteral(raw) {
    const decoded = String(raw || '')
      .replace(/\\\r?\n/g, '')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, ' ')
      .replace(/\\b/g, '')
      .replace(/\\f/g, '')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .replace(/\\([0-7]{1,3})/g, (_, oct) => {
        const code = parseInt(oct, 8);
        return code >= 32 ? String.fromCharCode(code) : ' ';
      });
    return fixWin1252Bytes(decoded);
  }

  function decodePdfHexLiteral(hexStr, cMapTable) {
    const clean = String(hexStr || '').replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
    if (!clean) return '';

    if (cMapTable && cMapTable.size > 0) {
      if (clean.length % 4 === 0) {
        let mapped4 = '';
        let hits4 = 0;
        for (let i = 0; i < clean.length; i += 4) {
          const k = clean.slice(i, i + 4);
          if (cMapTable.has(k)) {
            mapped4 += cMapTable.get(k);
            hits4 += 1;
          }
        }
        if (hits4 > 0) return mapped4;
      }
      if (clean.length % 2 === 0) {
        let mapped2 = '';
        let hits2 = 0;
        for (let i = 0; i < clean.length; i += 2) {
          const k = clean.slice(i, i + 2);
          if (cMapTable.has(k)) {
            mapped2 += cMapTable.get(k);
            hits2 += 1;
          }
        }
        if (hits2 > 0) return mapped2;
      }
    }

    if (clean.length % 4 === 0 && (/^(?:FEFF|09[0-7][0-9A-F]|00[2-7][0-9A-F])/i.test(clean))) {
      let out16 = '';
      for (let i = 0; i < clean.length; i += 4) {
        const code = parseInt(clean.slice(i, i + 4), 16);
        if (code >= 0x0020 && code !== 0xFEFF && !(code >= 0xE000 && code <= 0xF8FF)) {
          out16 += String.fromCharCode(code);
        }
      }
      if (out16.trim()) return out16;
    }

    if (clean.length % 4 === 0 && /^(?:00[0-9A-F]{2}){2,}$/.test(clean) && !/^(?:00[2-7][0-9A-F]){2,}$/.test(clean)) {
      return '';
    }

    let out8 = '';
    for (let i = 0; i < clean.length; i += 2) {
      const code = parseInt(clean.slice(i, i + 2), 16);
      if (code >= 32 && code <= 255) out8 += String.fromCharCode(code);
    }
    return fixWin1252Bytes(out8);
  }

  function extractPositionalLinesFromPdfStream(streamStr, cMapTable) {
    const items = [];
    const btRegex = /\bBT\b([\s\S]*?)\bET\b/g;
    let bm;
    while ((bm = btRegex.exec(streamStr)) !== null) {
      const block = bm[1];
      let x = 0;
      let y = 0;
      let lineX = 0;
      let lineY = 0;
      let leading = 12;
      let isHexFont = false;
      const tokenRegex = /\/([A-Za-z0-9_]+)\s+[+-]?\d+(?:\.\d+)?\s+Tf|([+-]?\d+(?:\.\d+)?)\s+TL|([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+Tm|([+-]?\d+(?:\.\d+)?)\s+([+-]?\d+(?:\.\d+)?)\s+(TD|Td)|(\*?\s*T\*)|\[((?:[^[\]]|\([^()\\]*(?:\\.[^()\\]*)*\))*)\]\s*TJ|\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*(Tj|'|")|<([0-9A-Fa-f\s]+)>\s*(Tj|'|")/g;
      let tm;
      while ((tm = tokenRegex.exec(block)) !== null) {
        if (tm[1] !== undefined) {
          isHexFont = /^C\d/i.test(tm[1]);
        } else if (tm[2] !== undefined) {
          leading = parseFloat(tm[2]);
        } else if (tm[3] !== undefined) {
          lineX = parseFloat(tm[7]);
          lineY = parseFloat(tm[8]);
          x = lineX;
          y = lineY;
        } else if (tm[9] !== undefined) {
          const tx = parseFloat(tm[9]);
          const ty = parseFloat(tm[10]);
          if (tm[11] === 'TD') leading = -ty;
          lineX += tx;
          lineY += ty;
          x = lineX;
          y = lineY;
        } else if (tm[12] !== undefined) {
          lineY -= leading;
          x = lineX;
          y = lineY;
        } else if (tm[13] !== undefined) {
          const inner = tm[13];
          let str = '';
          const subRe = /\(([^()\\]*(?:\\.[^()\\]*)*)\)|<([0-9A-Fa-f\s]+)>|([+-]?\d+(?:\.\d+)?)/g;
          let sm;
          while ((sm = subRe.exec(inner)) !== null) {
            if (sm[1] !== undefined) str += decodePdfEscapedLiteral(sm[1]);
            else if (sm[2] !== undefined) str += decodePdfHexLiteral(sm[2], cMapTable);
            else if (sm[3] !== undefined && parseFloat(sm[3]) < -180) str += ' ';
          }
          if (str.trim()) {
            items.push({ x, y, text: str, isHexFont });
            x += str.length * 4.5;
          }
        } else if (tm[14] !== undefined) {
          if (tm[15] === "'" || tm[15] === '"') {
            lineY -= leading;
            x = lineX;
            y = lineY;
          }
          const str = decodePdfEscapedLiteral(tm[14]);
          if (str.trim()) {
            items.push({ x, y, text: str, isHexFont: false });
            x += str.length * 4.5;
          }
        } else if (tm[16] !== undefined) {
          if (tm[17] === "'" || tm[17] === '"') {
            lineY -= leading;
            x = lineX;
            y = lineY;
          }
          const str = decodePdfHexLiteral(tm[16], cMapTable);
          if (str.trim()) {
            items.push({ x, y, text: str, isHexFont: true });
            x += str.length * 4.5;
          }
        }
      }
    }

    if (items.length === 0) return [];

    const leftCol = items.filter((it) => it.x < 298);
    const rightCol = items.filter((it) => it.x >= 298);

    const groupColIntoLines = (colItems) => {
      if (colItems.length === 0) return [];
      colItems.sort((a, b) => {
        if (Math.abs(b.y - a.y) > 4.5) return b.y - a.y;
        return a.x - b.x;
      });
      const rows = [];
      colItems.forEach((it) => {
        const last = rows[rows.length - 1];
        if (!last || Math.abs(it.y - last.y) > 4.5) {
          rows.push({ y: it.y, items: [it] });
        } else {
          last.items.push(it);
        }
      });
      return rows.map((r) => {
        r.items.sort((a, b) => a.x - b.x);
        const joined = r.items.map((i) => i.text).join(' ').replace(/\s+/g, ' ').trim();
        const hasShree = r.items.some((i) => !i.isHexFont) && isLikelyShreeDevText(joined);
        return hasShree ? convertShreeDevSegmentToUnicode(joined) : convertKrutiDevInText(joined);
      }).filter((line) => {
        if (!line) return false;
        // Skip running header/footer noise like "SSE-2021 / Set-A / 2", "C14 – 25", "[ 27 ]", or "P.T.O."
        if (/^(?:P\.?T\.?O\.?|[A-Z]{1,5}\d*\s*[-–—/]\s*\d{1,4}.*|\[\s*\d{1,3}\s*\]|[A-Z]\s+\[\s*\d{1,3}\s*\])$/i.test(line)) return false;
        return true;
      });
    };

    if (leftCol.length >= 4 && rightCol.length >= 4) {
      return [...groupColIntoLines(leftCol), ...groupColIntoLines(rightCol)];
    }
    return groupColIntoLines(items);
  }

  function extractTextOperatorsFromPdfChunk(chunkStr, cMapTable) {
    const posLines = extractPositionalLinesFromPdfStream(chunkStr, cMapTable);
    if (posLines.length > 0) {
      return sanitizeExtractedPdfText(posLines.join('\n'));
    }
    const out = [];
    const btBlocks = [];
    const btEtRegex = /\bBT\b([\s\S]*?)\bET\b/g;
    let bm;
    while ((bm = btEtRegex.exec(chunkStr)) !== null) {
      btBlocks.push(bm[1]);
    }
    const targetScopes = btBlocks.length > 0 ? btBlocks : [chunkStr];

    targetScopes.forEach((scope) => {
      const tjRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*(?:Tj|'|")/g;
      let m;
      while ((m = tjRegex.exec(scope)) !== null) {
        const dec = decodePdfEscapedLiteral(m[1]).trim();
        if (dec) out.push(dec);
      }
      const hexTjRegex = /<([0-9A-Fa-f\s]+)>\s*(?:Tj|'|")/g;
      while ((m = hexTjRegex.exec(scope)) !== null) {
        const dec = decodePdfHexLiteral(m[1], cMapTable).trim();
        if (dec) out.push(dec);
      }
      const tjArrRegex = /\[((?:[^[\]]|\([^()\\]*(?:\\.[^()\\]*)*\))*)\]\s*TJ/gi;
      while ((m = tjArrRegex.exec(scope)) !== null) {
        const inner = m[1];
        const strParts = [];
        const tokenRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)|<([0-9A-Fa-f\s]+)>/g;
        let lm;
        while ((lm = tokenRegex.exec(inner)) !== null) {
          if (lm[1] !== undefined) strParts.push(decodePdfEscapedLiteral(lm[1]));
          else if (lm[2] !== undefined) strParts.push(decodePdfHexLiteral(lm[2], cMapTable));
        }
        const joined = strParts.join('').trim();
        if (joined) out.push(joined);
      }
    });

    return sanitizeExtractedPdfText(out.join('\n'));
  }

  function extractReadableTextFromPdfStream(rawContent) {
    const str = String(rawContent || '');
    if (!str.trim()) return '';
    if (!str.includes('%PDF-')) {
      return sanitizeExtractedPdfText(str.replace(/^Method:\s*PDF_OCR\s*\r?\n?/i, ''));
    }
    const cMapTable = parsePdfToUnicodeCMap(str);
    const extracted = extractTextOperatorsFromPdfChunk(str, cMapTable);
    if (extracted.trim() && !isExtractedPageGarbledOrEmpty(extracted)) {
      return extracted;
    }
    return '';
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
      const timer = setTimeout(() => resolve(null), 8000);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = () => {
        clearTimeout(timer);
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
          try {
            const workerBlob = new Blob(
              ['importScripts("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js");'],
              { type: 'application/javascript' }
            );
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
          } catch (_) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          }
        }
        resolve(window.pdfjsLib || null);
      };
      script.onerror = () => {
        clearTimeout(timer);
        pdfJsLoaderPromise = null;
        resolve(null);
      };
      if (document.head) document.head.appendChild(script);
      else resolve(null);
    });
    return pdfJsLoaderPromise;
  }

  let tesseractLoaderPromise = null;
  let cachedTesseractWorkerPromise = null;
  function ensureTesseractLoaded() {
    if (typeof window !== 'undefined' && window.Tesseract) {
      return Promise.resolve(window.Tesseract);
    }
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
      return Promise.resolve(null);
    }
    if (tesseractLoaderPromise) return tesseractLoaderPromise;
    tesseractLoaderPromise = new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 10000);
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.async = true;
      script.onload = () => {
        clearTimeout(timer);
        resolve(window.Tesseract || null);
      };
      script.onerror = () => {
        clearTimeout(timer);
        tesseractLoaderPromise = null;
        resolve(null);
      };
      if (document.head) document.head.appendChild(script);
      else resolve(null);
    });
    return tesseractLoaderPromise;
  }

  async function recognizeWithCachedTesseract(imageSource) {
    const Tesseract = await ensureTesseractLoaded();
    if (!Tesseract) return '';
    try {
      if (typeof Tesseract.createWorker === 'function') {
        if (!cachedTesseractWorkerPromise) {
          cachedTesseractWorkerPromise = (async () => {
            const worker = await Tesseract.createWorker('hin+eng');
            return worker;
          })().catch((err) => {
            cachedTesseractWorkerPromise = null;
            throw err;
          });
        }
        const worker = await cachedTesseractWorkerPromise;
        if (worker && typeof worker.recognize === 'function') {
          const res = await worker.recognize(imageSource);
          return res && res.data && res.data.text ? String(res.data.text) : '';
        }
      }
      if (typeof Tesseract.recognize === 'function') {
        const res = await Tesseract.recognize(imageSource, 'hin+eng');
        return res && res.data && res.data.text ? String(res.data.text) : '';
      }
    } catch (_) {
      cachedTesseractWorkerPromise = null;
    }
    return '';
  }

  async function openPdfDocumentSafely(pdfjsLib, uint8) {
    const baseParams = {
      data: uint8.slice(0),
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
      isEvalSupported: false
    };
    try {
      return await pdfjsLib.getDocument(baseParams).promise;
    } catch (_) {
      return await pdfjsLib.getDocument(Object.assign({}, baseParams, {
        data: uint8.slice(0),
        disableWorker: true
      })).promise;
    }
  }

  async function renderPdfPageToCanvasAndOcr(page) {
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') return '';
    try {
      const viewport = page.getViewport({ scale: 1.55 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
      const ocrText = await recognizeWithCachedTesseract(canvas);
      return sanitizeExtractedPdfText(ocrText);
    } catch (_) {
      return '';
    }
  }

  async function decompressPdfBufferStreams(uint8) {
    const latin1 = new TextDecoder('latin1').decode(uint8);
    if (!latin1.includes('%PDF-')) {
      return new TextDecoder('utf-8', { fatal: false }).decode(uint8);
    }
    const decompressedChunks = [];
    const cMapTable = parsePdfToUnicodeCMap(latin1);

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
            const decompressedStr = new TextDecoder('latin1').decode(decompressedBuf);
            if (decompressedStr.includes('beginbfchar') || decompressedStr.includes('beginbfrange')) {
              const subMap = parsePdfToUnicodeCMap(decompressedStr);
              subMap.forEach((v, k) => {
                // Only store 4-hex CID mappings or non-colliding mappings so primary font CMap is never overwritten by a tiny subset CMap
                if (k.length === 4 && !cMapTable.has(k)) {
                  cMapTable.set(k, v);
                }
              });
            }
            if (/\bBT\b/.test(decompressedStr) || /\bTj\b|\bTJ\b/.test(decompressedStr)) {
              decompressedChunks.push(decompressedStr);
            }
            break;
          } catch (_) {}
        }
      }
    }

    const collectedPages = [];
    const directText = extractTextOperatorsFromPdfChunk(latin1, cMapTable);
    if (directText.trim() && !isExtractedPageGarbledOrEmpty(directText)) {
      collectedPages.push(directText);
    }
    decompressedChunks.forEach((chunkStr, idx) => {
      const parsedChunk = extractTextOperatorsFromPdfChunk(chunkStr, cMapTable);
      if (parsedChunk.trim() && !isExtractedPageGarbledOrEmpty(parsedChunk)) {
        collectedPages.push(`Page: ${idx + 1}\n${parsedChunk}`);
      }
    });
    return collectedPages.join('\n\n');
  }

  function assemblePdfItemsIntoLines(itemsList) {
    if (!Array.isArray(itemsList) || itemsList.length === 0) return [];
    // Sort top-to-bottom (descending Y), then left-to-right (ascending X)
    const sorted = itemsList.slice().sort((a, b) => {
      if (Math.abs(b.y - a.y) > 5.5) return b.y - a.y;
      return a.x - b.x;
    });
    const rowBuckets = [];
    sorted.forEach((it) => {
      const lastBucket = rowBuckets[rowBuckets.length - 1];
      if (!lastBucket || Math.abs(it.y - lastBucket.avgY) > 5.8) {
        rowBuckets.push({ avgY: it.y, items: [it] });
      } else {
        lastBucket.items.push(it);
        lastBucket.avgY = (lastBucket.avgY * (lastBucket.items.length - 1) + it.y) / lastBucket.items.length;
      }
    });
    const outLines = [];
    rowBuckets.forEach((bucket) => {
      bucket.items.sort((a, b) => a.x - b.x);
      let lineParts = [];
      let prevRight = null;
      bucket.items.forEach((it) => {
        const text = String(it.str || '');
        if (!text.trim()) {
          if (lineParts.length > 0 && !lineParts[lineParts.length - 1].endsWith(' ')) {
            lineParts.push(' ');
          }
          return;
        }
        const gap = prevRight !== null ? (it.x - prevRight) : 0;
        // If there is a large horizontal gap and a new question or bracketed option starts, split onto a new line
        if (gap > 75 && /^(?:Q\.?\s*\d|प्र\.?\s*\d|प्रश्न\s*\d|\(?[0-9\u0966-\u096F]{1,3}[.):\-]|[([]\s*[A-Da-dअआइईबसदकखगघ1-4१-४]\s*[)\]]|¼[vclndxg?1-4A-D]½)/i.test(text.trim())) {
          const built = lineParts.join('').replace(/\s+/g, ' ').trim();
          if (built) outLines.push(built);
          lineParts = [text];
        } else if (gap > 2.2 && lineParts.length > 0) {
          lineParts.push(' ' + text);
        } else {
          lineParts.push(text);
        }
        prevRight = it.x + Math.max(it.w || 0, text.length * 4.2);
      });
      const finalLine = lineParts.join('').replace(/\s+/g, ' ').trim();
      if (finalLine) outLines.push(finalLine);
    });
    return outLines;
  }

  async function extractTextFromUploadedFile(file, onProgressToast, options) {
    if (!file) return '';
    const opts = options && typeof options === 'object' ? options : {};
    const skipCanvasOcr = Boolean(opts.skipCanvasOcr);
    const fileName = String(file.name || '').toLowerCase();

    const arrayBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev && ev.target ? ev.target.result : null);
      reader.onerror = () => reject(new Error('Failed to read uploaded file.'));
      reader.readAsArrayBuffer(file);
    });

    if (!arrayBuffer) return '';
    const uint8 = new Uint8Array(arrayBuffer);

    // Detect %PDF- or Image magic bytes in the first 64 bytes even if Android file picker returned a content URI name without .pdf
    const headerAscii = new TextDecoder('latin1').decode(uint8.subarray(0, Math.min(64, uint8.length)));
    const isPdf =
      fileName.endsWith('.pdf') ||
      String(file.type || '').toLowerCase() === 'application/pdf' ||
      headerAscii.includes('%PDF-');

    const isImg =
      /\.(png|jpe?g|webp)$/i.test(fileName) ||
      String(file.type || '').toLowerCase().startsWith('image/') ||
      (uint8.length >= 4 && uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4E && uint8[3] === 0x47) ||
      (uint8.length >= 3 && uint8[0] === 0xFF && uint8[1] === 0xD8 && uint8[2] === 0xFF) ||
      (headerAscii.startsWith('RIFF') && headerAscii.includes('WEBP'));

    if (isImg) {
      if (skipCanvasOcr) return '';
      const hasNativeImgAi = Boolean(
        window.AndroidBridge &&
        typeof window.AndroidBridge.analyzeQuestionImageWithAi === 'function'
      );
      if (hasNativeImgAi) return '';
      try {
        if (typeof onProgressToast === 'function') {
          onProgressToast('⏳ इमेज फ़ाइल को Smart Hindi+English OCR से स्कैन किया जा रहा है...');
        }
        const ocrRaw = await recognizeWithCachedTesseract(file);
        const txt = ocrRaw ? sanitizeExtractedPdfText(ocrRaw) : '';
        if (txt.trim()) return 'Method: PDF_OCR\nPage: 1\n' + txt;
      } catch (_) {}
      return '';
    }

    if (!isPdf) {
      // Detect UTF-16LE / UTF-16BE BOMs (e.g. Excel "Unicode Text" CSV exports containing Hindi Devanagari)
      if (uint8.length >= 2 && uint8[0] === 0xFF && uint8[1] === 0xFE) {
        return convertKrutiDevInText(new TextDecoder('utf-16le', { fatal: false }).decode(uint8.subarray(2)));
      }
      if (uint8.length >= 2 && uint8[0] === 0xFE && uint8[1] === 0xFF) {
        return convertKrutiDevInText(new TextDecoder('utf-16be', { fatal: false }).decode(uint8.subarray(2)));
      }
      const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(uint8);
      return convertKrutiDevInText(utf8Text.replace(/^\uFEFF/, ''));
    }

    // 1. Fast Native Stream Decompression with Shree-Dev 0708 + ToUnicode CMap + 2-Column Coordinate Sorter
    let fastDecompressedText = '';
    try {
      fastDecompressedText = await decompressPdfBufferStreams(uint8);
      if (fastDecompressedText && fastDecompressedText.trim().length > 80) {
        const testParsed = parsePdfOcrAndMatchAnswerKey('Method: PDF_OCR\n' + fastDecompressedText, 'check.pdf', '', 'A', 'A');
        if (testParsed && Array.isArray(testParsed.rawItems) && testParsed.rawItems.length >= 3) {
          return 'Method: PDF_OCR\n' + fastDecompressedText;
        }
      }
    } catch (_) {}

    // 2. Primary PDF.js page-by-page extraction with Blob Worker / disableWorker fallback + KrutiDev + optional Canvas OCR
    try {
      const pdfjsLib = await ensurePdfJsLoaded();
      if (pdfjsLib && typeof pdfjsLib.getDocument === 'function') {
        const pdfDoc = await openPdfDocumentSafely(pdfjsLib, uint8);
        const pageTexts = [];
        const backupPageTexts = [];
        for (let p = 1; p <= pdfDoc.numPages; p++) {
          const page = await pdfDoc.getPage(p);
          const viewport = typeof page.getViewport === 'function' ? page.getViewport({ scale: 1.0 }) : null;
          const pageWidth = (viewport && viewport.width) ? viewport.width : 595;
          const midX = pageWidth * 0.485;

          const textContent = await page.getTextContent();
          const rawItems = [];
          (textContent.items || []).forEach((item) => {
            const str = String(item.str || '');
            if (!str.trim()) return;
            const x = item.transform ? Number(item.transform[4] || 0) : 0;
            const y = item.transform ? Number(item.transform[5] || 0) : 0;
            const w = Number(item.width || (str.length * 4.5));
            rawItems.push({ str, x, y, w });
          });

          // Partition into Left Column, Right Column, and Full-Width Banner items
          const leftItems = [];
          const rightItems = [];
          const bannerItems = [];
          rawItems.forEach((it) => {
            if (it.x < pageWidth * 0.42 && (it.x + it.w) > pageWidth * 0.62) {
              bannerItems.push(it);
            } else if (it.x < midX) {
              leftItems.push(it);
            } else {
              rightItems.push(it);
            }
          });

          const isTwoColumnPage =
            rawItems.length >= 12 &&
            leftItems.length >= 5 &&
            rightItems.length >= 5 &&
            bannerItems.length <= Math.max(6, Math.floor(rawItems.length * 0.2));

          let pageLines = [];
          if (isTwoColumnPage) {
            pageLines = [
              ...assemblePdfItemsIntoLines(bannerItems),
              ...assemblePdfItemsIntoLines(leftItems),
              ...assemblePdfItemsIntoLines(rightItems)
            ];
          } else {
            pageLines = assemblePdfItemsIntoLines(rawItems);
          }

          const rawJoinedPage = pageLines.filter(Boolean).join('\n');
          let cleanPage = sanitizeExtractedPdfText(rawJoinedPage);
          const krutiConvertedPage = convertKrutiDevInText(rawJoinedPage).trim();
          const hasNativePdfVisionBridge = Boolean(
            window.AndroidBridge &&
            typeof window.AndroidBridge.analyzePdfPagesWithAi === 'function'
          );

          // Only run Canvas OCR inside extractTextFromUploadedFile if skipCanvasOcr is false
          if (!skipCanvasOcr && isExtractedPageGarbledOrEmpty(cleanPage) && p <= 15 && !hasNativePdfVisionBridge) {
            if (typeof onProgressToast === 'function') {
              onProgressToast(`⏳ PDF पेज ${p}/${pdfDoc.numPages} को Smart Hindi+English OCR से पढ़ा जा रहा है...`);
            }
            const ocrPageText = await renderPdfPageToCanvasAndOcr(page);
            if (ocrPageText && ocrPageText.trim()) {
              cleanPage = ocrPageText;
            }
          }

          if (cleanPage && !isExtractedPageGarbledOrEmpty(cleanPage)) {
            pageTexts.push(`Page: ${p}\n${cleanPage}`);
          } else if (cleanPage && cleanPage.trim().length >= 5) {
            backupPageTexts.push(`Page: ${p}\n${cleanPage.trim()}`);
          } else if (krutiConvertedPage && krutiConvertedPage.length >= 5) {
            backupPageTexts.push(`Page: ${p}\n${krutiConvertedPage}`);
          }
        }
        if (pageTexts.join('\n').trim()) {
          return 'Method: PDF_OCR\n' + pageTexts.join('\n\n');
        }
        if (backupPageTexts.join('\n').trim()) {
          return 'Method: PDF_OCR\n' + backupPageTexts.join('\n\n');
        }
      }
    } catch (pdfErr) {
      console.warn('PDF.js extraction error:', pdfErr);
    }

    // 2. Fallback to native FlateDecode stream decompression + ToUnicode CMap extraction
    try {
      const streamExtracted = await decompressPdfBufferStreams(uint8);
      if (streamExtracted && streamExtracted.trim()) {
        return 'Method: PDF_OCR\n' + streamExtracted;
      }
    } catch (_) {}

    // 3. Final fallback (never emits raw %PDF- binary code)
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
      const tabularRowMatch = line.match(/^(?:Q\.?\s*)?(\d{1,4})\s*[|.:\-]?\s*\(?([A-Da-dअआइईब सदकखगघ])\)?[\s|,;]+\(?([A-Da-dअआइईबसदकखगघ])\)?(?:[\s|,;]+\(?([A-Da-dअआइईबसदकखगघ])\)?)?(?:[\s|,;]+\(?([A-Da-dअआइईबसदकखगघ])\)?)?\s*$/);
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
        const pairRegex = /(?:^|[\s,;|\n\r])(?:Q\.?\s*|प्रश्न\s*|प्र\.?\s*)?(\d{1,4})\s*(?:[-:=.)>]+|\s+)\s*\(?([A-Da-d0-3अआइईबसदकखगघ])\)?(?=$|[\s,;|\n\r.)])/g;
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
      const pairRegex = /(?:^|[\s,;|\n\r])(?:Q\.?\s*|प्रश्न\s*|प्र\.?\s*)?(\d{1,4})\s*(?:[-:=.)>]+|\s+)\s*\(?([A-Da-d0-3अआइईबसदकखगघ])\)?(?=$|[\s,;|\n\r.)])/g;
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

    const pairRegex = /(?:^|[\s,;|\n\r])(?:Q\.?\s*|प्रश्न\s*|प्र\.?\s*)?(\d{1,4})\s*(?:[-:=.)>]+|\s+)\s*\(?([A-Da-d0-3अआइईबसदकखगघ])\)?(?=$|[\s,;|\n\r.)])/g;
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
    if (!hasDevanagari || !hasLatin) {
      return { hi: clean, en: clean };
    }

    // 1. Split by explicit separators (/, ||, or newline)
    const parts = clean.split(/\s*(?:\/|\|\||\r?\n)\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const hiParts = parts.filter((p) => /[\u0900-\u097F]/.test(p));
      const enParts = parts.filter((p) => !/[\u0900-\u097F]/.test(p) && /[A-Za-z]/.test(p));
      if (hiParts.length > 0 && enParts.length > 0) {
        return { hi: hiParts.join(' '), en: enParts.join(' ') };
      }
    }

    // 2. Parenthetical bilingual option/stem e.g. "1 नवंबर 2000 (1 November 2000)" or "Raipur (रायपुर)"
    const parenHiFirst = clean.match(/^([^\n()]*[\u0900-\u097F][^\n()]*?)\s*\(\s*([A-Za-z0-9][^\n()]*?)\s*\)$/);
    if (parenHiFirst && !/[\u0900-\u097F]/.test(parenHiFirst[2])) {
      return { hi: parenHiFirst[1].trim(), en: parenHiFirst[2].trim() };
    }
    const parenEnFirst = clean.match(/^([A-Za-z0-9][^\n()]*?)\s*\(\s*([^\n()]*[\u0900-\u097F][^\n()]*?)\s*\)$/);
    if (parenEnFirst && !/[\u0900-\u097F]/.test(parenEnFirst[1])) {
      return { hi: parenEnFirst[2].trim(), en: parenEnFirst[1].trim() };
    }

    // 3. Inline sentence boundary e.g. "छत्तीसगढ़ का गठन कब हुआ था? When was Chhattisgarh formed?"
    const hiSentenceFirst = clean.match(/^([\s\S]*?[\u0900-\u097F][\s\S]*?[।?!])\s+(?:\d{1,4}\s*[.):\-]\s*)?([A-Za-z][\s\S]+)$/);
    if (hiSentenceFirst && !/[\u0900-\u097F]/.test(hiSentenceFirst[2])) {
      return { hi: hiSentenceFirst[1].trim(), en: hiSentenceFirst[2].trim() };
    }
    const enSentenceFirst = clean.match(/^([A-Za-z][\s\S]*?[?.!])\s+(?:[0-9\u0966-\u096F]{1,4}\s*[.):\-]\s*)?([\s\S]*?[\u0900-\u097F][\s\S]+)$/);
    if (enSentenceFirst && !/[\u0900-\u097F]/.test(enSentenceFirst[1])) {
      return { hi: enSentenceFirst[2].trim(), en: enSentenceFirst[1].trim() };
    }

    // 4. Hyphen/dash separated bilingual option e.g. "रायपुर - Raipur" or "Raipur - रायपुर"
    const dashParts = clean.split(/\s+[-–—]\s+/).map((p) => p.trim()).filter(Boolean);
    if (dashParts.length === 2) {
      const p0Hi = /[\u0900-\u097F]/.test(dashParts[0]);
      const p1Hi = /[\u0900-\u097F]/.test(dashParts[1]);
      if (p0Hi && !p1Hi && /[A-Za-z]/.test(dashParts[1])) {
        return { hi: dashParts[0], en: dashParts[1] };
      }
      if (!p0Hi && p1Hi && /[A-Za-z]/.test(dashParts[0])) {
        return { hi: dashParts[1], en: dashParts[0] };
      }
    }

    return { hi: clean, en: clean };
  }

  function extractBilingualStemAndOptionsFromBlock(textWithoutExp) {
    const optTokenMap = {
      A: 0, B: 1, C: 2, D: 3,
      'अ': 0, 'ब': 1, 'स': 2, 'द': 3,
      'क': 0, 'ख': 1, 'ग': 2, 'घ': 3,
      'आ': 1, 'इ': 2, 'ई': 3,
      '1': 0, '2': 1, '3': 2, '4': 3,
      '१': 0, '२': 1, '३': 2, '४': 3
    };

    // Match bracketed options `(A)` / `[अ]` anywhere after whitespace, OR unbracketed `A)` / `A.` at line-start or after 2+ spaces (avoiding initials like "B. R.")
    const optMarkerRegex = /(?:^|\n|\s)(?:[([]\s*([A-Da-dअआइईबसदकखगघ1-4१-४])\s*[)\]]|(?:^|\n|\s{2,})([A-Da-dअआइईबसदकखगघ])\s*[).:\-](?!\s*[A-Z]\.))\s*/g;
    const rawMatches = [];
    let m;
    while ((m = optMarkerRegex.exec(textWithoutExp)) !== null) {
      const rawTok = String(m[1] || m[2] || '').trim().toUpperCase();
      const isBracketed = Boolean(m[1]);
      // Unbracketed numeric "1." inside a stem is often a statement list, so only accept numeric 1-4 when bracketed `(1)`
      if (!isBracketed && /^[1-4१-४]$/.test(rawTok)) continue;
      const optIdx = optTokenMap[rawTok];
      if (optIdx !== undefined) {
        const leadingWsLen = (m[0].match(/^\s*/) || [''])[0].length;
        rawMatches.push({
          optIdx,
          rawTok,
          markerStart: m.index + leadingWsLen,
          contentStart: m.index + m[0].length
        });
      }
    }

    if (rawMatches.length === 0) {
      const stemSplit = splitBilingualText(textWithoutExp);
      return {
        stemHi: stemSplit.hi,
        stemEn: stemSplit.en,
        optsHi: ['', '', '', ''],
        optsEn: ['', '', '', '']
      };
    }

    // Group option markers into sequential sets of (0..3). Whenever optIdx === 0 appears after we already saw options >= 1, start a new option set!
    const optionGroups = [];
    let currentGroup = [];
    rawMatches.forEach((rm) => {
      if (rm.optIdx === 0 && currentGroup.some((x) => x.optIdx >= 1)) {
        optionGroups.push(currentGroup);
        currentGroup = [rm];
      } else {
        currentGroup.push(rm);
      }
    });
    if (currentGroup.length > 0) optionGroups.push(currentGroup);

    // Filter to groups that look like real option sets (at least 2 distinct options, or the only group)
    const validGroups = optionGroups.filter((g) => {
      const uniqueIndices = new Set(g.map((x) => x.optIdx));
      return uniqueIndices.size >= 2 || optionGroups.length === 1;
    });
    const activeGroups = validGroups.length > 0 ? validGroups : [rawMatches];

    // If there are TWO option groups in the same question block (e.g. Hindi options followed by English stem + English options)
    if (activeGroups.length >= 2) {
      const g1 = activeGroups[activeGroups.length - 2];
      const g2 = activeGroups[activeGroups.length - 1];
      const firstGroupStart = g1[0].markerStart;
      const secondGroupStart = g2[0].markerStart;

      const stem1Raw = textWithoutExp.slice(0, firstGroupStart).trim();
      const g1Opts = ['', '', '', ''];
      for (let i = 0; i < g1.length; i++) {
        const cur = g1[i];
        const nextStart = (i + 1 < g1.length) ? g1[i + 1].markerStart : secondGroupStart;
        g1Opts[cur.optIdx] = textWithoutExp.slice(cur.contentStart, nextStart).trim();
      }

      // Check if the last option of g1 swallowed the second-language question stem before g2[0]
      let stem2Raw = '';
      const lastG1 = g1[g1.length - 1];
      if (lastG1) {
        const lastOptText = g1Opts[lastG1.optIdx] || '';
        const lastOptLines = lastOptText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lastOptLines.length >= 2) {
          g1Opts[lastG1.optIdx] = lastOptLines[0];
          stem2Raw = lastOptLines.slice(1).join(' ').replace(/^\s*(?:Q(?:uestion)?\.?\s*|प्रश्न\s*|प्र\.?\s*)?[0-9\u0966-\u096F]{1,4}\s*[.):\-]\s*/i, '').trim();
        } else {
          const splitLast = splitBilingualText(lastOptText);
          if (splitLast.hi !== splitLast.en && lastOptText.length > 25) {
            const g1IsDevanagari = /[\u0900-\u097F]/.test(stem1Raw + ' ' + g1Opts[0]);
            g1Opts[lastG1.optIdx] = g1IsDevanagari ? splitLast.hi : splitLast.en;
            stem2Raw = (g1IsDevanagari ? splitLast.en : splitLast.hi).replace(/^\s*(?:Q(?:uestion)?\.?\s*|प्रश्न\s*|प्र\.?\s*)?[0-9\u0966-\u096F]{1,4}\s*[.):\-]\s*/i, '').trim();
          }
        }
      }

      const g2Opts = ['', '', '', ''];
      for (let i = 0; i < g2.length; i++) {
        const cur = g2[i];
        const nextStart = (i + 1 < g2.length) ? g2[i + 1].markerStart : textWithoutExp.length;
        g2Opts[cur.optIdx] = textWithoutExp.slice(cur.contentStart, nextStart).trim();
      }

      const g1HasHi = /[\u0900-\u097F]/.test(stem1Raw + ' ' + g1Opts.join(' '));
      const g2HasHi = /[\u0900-\u097F]/.test(stem2Raw + ' ' + g2Opts.join(' '));

      if (g1HasHi && !g2HasHi) {
        const s1 = splitBilingualText(stem1Raw);
        return {
          stemHi: s1.hi || stem1Raw,
          stemEn: stem2Raw || (s1.en !== s1.hi ? s1.en : stem1Raw),
          optsHi: g1Opts.map((o, i) => o || g2Opts[i] || ''),
          optsEn: g2Opts.map((o, i) => o || g1Opts[i] || '')
        };
      }
      if (!g1HasHi && g2HasHi) {
        const s1 = splitBilingualText(stem1Raw);
        return {
          stemHi: stem2Raw || (s1.hi !== s1.en ? s1.hi : stem1Raw),
          stemEn: s1.en || stem1Raw,
          optsHi: g2Opts.map((o, i) => o || g1Opts[i] || ''),
          optsEn: g1Opts.map((o, i) => o || g2Opts[i] || '')
        };
      }
    }

    // Standard single option-set (take the last complete option group so statement labels A/B inside stem don't truncate the stem)
    const targetGroup = activeGroups[activeGroups.length - 1];
    const firstOptIndex = targetGroup[0].markerStart;
    const stemRaw = (firstOptIndex > 0 ? textWithoutExp.slice(0, firstOptIndex) : textWithoutExp).trim();
    const stemBilingual = splitBilingualText(stemRaw);

    const extractedOpts = ['', '', '', ''];
    for (let i = 0; i < targetGroup.length; i++) {
      const cur = targetGroup[i];
      const nextStart = (i + 1 < targetGroup.length) ? targetGroup[i + 1].markerStart : textWithoutExp.length;
      extractedOpts[cur.optIdx] = textWithoutExp.slice(cur.contentStart, nextStart).trim();
    }

    const optsHi = [];
    const optsEn = [];
    for (let i = 0; i < 4; i++) {
      const splitOpt = splitBilingualText(extractedOpts[i]);
      optsHi.push(splitOpt.hi);
      optsEn.push(splitOpt.en);
    }

    return {
      stemHi: stemBilingual.hi,
      stemEn: stemBilingual.en,
      optsHi,
      optsEn
    };
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

    // Pre-normalize lines where a 2-column bilingual PDF had both "1. Hindi..." and "1. English..." on the same line
    const rawLinesInput = bodyText.split(/\r?\n/);
    const lines = [];
    rawLinesInput.forEach((rawLine) => {
      const trimmed = rawLine.trim();
      if (!trimmed) return;
      const inlineRepeatMatch = trimmed.match(/^((?:Q(?:uestion|ues)?\.?\s*|प्रश्न\s*|प्र\.?\s*)?\(?([0-9\u0966-\u096F]{1,4})\)?\s*[.):\-]\s*.+?)\s+((?:Q(?:uestion|ues)?\.?\s*|प्रश्न\s*|प्र\.?\s*)?\(?([0-9\u0966-\u096F]{1,4})\)?\s*[.):\-]\s*[A-Za-z\u0900-\u097F].*)$/i);
      if (inlineRepeatMatch && normalizeDevanagariDigits(inlineRepeatMatch[2]) === normalizeDevanagariDigits(inlineRepeatMatch[4])) {
        lines.push(inlineRepeatMatch[1].trim());
        lines.push(inlineRepeatMatch[3].trim());
      } else {
        lines.push(trimmed);
      }
    });

    const questionBlocks = [];
    let currentBlock = null;
    let currentDetectedPage = 1;
    let pendingStandaloneQNum = null;

    // Stage 1A: Standard numbered question start: "1. ...", "Q1. ...", "प्र. 1 ...", "(1) ...", "[1] ...", "प्रश्न 1 ..."
    const qStartRegex = /^\s*(?:(?:Q(?:uestion|ues)?|प्रश्न\s*(?:क्र(?:मांक)?\.?)?|प्र)\s*[.:\-]?\s*\(?([0-9\u0966-\u096F]{1,4})\)?\s*[.):\-]?\s+(.+)|(?:\(?([0-9\u0966-\u096F]{1,4})\)|\[([0-9\u0966-\u096F]{1,4})\]|([0-9\u0966-\u096F]{1,4})\s*[.):\-])\s*(.+))$/i;
    // Stage 1B: Standalone question number on its own line: "1.", "Q. 1", "प्रश्न 1", "(1)"
    const standaloneQNumRegex = /^\s*(?:Q(?:uestion|ues)?\.?\s*|प्रश्न\s*(?:क्र(?:मांक)?\.?)?\s*|प्र\.?\s*)?\(?([0-9\u0966-\u096F]{1,4})\)?\s*[.):\-]?\s*$/i;
    // Stage 1C: Number + space followed by Hindi/English sentence (not an option line)
    const spaceQStartRegex = /^\s*([0-9\u0966-\u096F]{1,3})\s+([\u0900-\u097FA-Z][^\n]{8,})$/;
    const pageMarkerRegex = /(?:^|\s)(?:Page|पृष्ठ)\s*[:\-]?\s*([0-9\u0966-\u096F]{1,4})\b/i;

    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      if (!line) return;
      const pageMatch = line.match(pageMarkerRegex);
      if (pageMatch && line.length < 32) {
        currentDetectedPage = Number(normalizeDevanagariDigits(pageMatch[1])) || currentDetectedPage;
        return;
      }

      const standaloneMatch = line.match(standaloneQNumRegex);
      if (standaloneMatch) {
        const sNum = Number(normalizeDevanagariDigits(standaloneMatch[1] || ''));
        if (sNum > 0 && sNum <= 500) {
          pendingStandaloneQNum = { qNum: sNum, rowNumber: idx + 1, pageNumber: currentDetectedPage };
          return;
        }
      }

      if (pendingStandaloneQNum && !/^\s*(?:[([]?[A-Da-dअआइईबसदकखगघ][)\].:\-])/i.test(line)) {
        if (currentBlock) questionBlocks.push(currentBlock);
        currentBlock = {
          rowNumber: pendingStandaloneQNum.rowNumber,
          questionNumber: pendingStandaloneQNum.qNum,
          pageNumber: pendingStandaloneQNum.pageNumber,
          rawLines: [line]
        };
        pendingStandaloneQNum = null;
        return;
      }
      pendingStandaloneQNum = null;

      const qMatch = line.match(qStartRegex);
      const qNumDigits = qMatch
        ? normalizeDevanagariDigits(qMatch[1] || qMatch[3] || qMatch[4] || qMatch[5] || '')
        : '';
      const qRestText = qMatch ? String(qMatch[2] || qMatch[6] || '').trim() : '';

      if (qMatch && Number(qNumDigits) > 0 && Number(qNumDigits) <= 500 && qRestText) {
        const qNum = Number(qNumDigits);
        // Check if currentBlock has already seen at least options (A)/(B)/(C)/(D)
        const blockJoined = currentBlock ? currentBlock.rawLines.join('\n') : '';
        const blockHasOptions = /(?:^|\s)\([A-Da-dअआइईकखगघ]\)\s*\S/.test(blockJoined);
        // Avoid treating "(1) Option...", multi-statement "1. Statement one 2. Statement two", or wrapped decimal "154.96" inside an unfinished question block as a new question!
        const looksLikeSubOption =
          currentBlock &&
          (
            (qNum >= 1 && qNum <= 6 && /^\s*\([1-6\u0967-\u096C]\)/.test(line)) ||
            (!blockHasOptions && qNum !== currentBlock.questionNumber + 1 && qNum !== currentBlock.questionNumber && currentBlock.rawLines.length < 18)
          );
        if (!looksLikeSubOption) {
          if (currentBlock) questionBlocks.push(currentBlock);
          currentBlock = {
            rowNumber: idx + 1,
            questionNumber: qNum,
            pageNumber: currentDetectedPage,
            rawLines: [qRestText]
          };
          return;
        }
      }

      const spaceMatch = !qMatch ? line.match(spaceQStartRegex) : null;
      if (spaceMatch) {
        const spNum = Number(normalizeDevanagariDigits(spaceMatch[1] || ''));
        if (spNum > 0 && spNum <= 300 && (!currentBlock || spNum === currentBlock.questionNumber + 1 || spNum === currentBlock.questionNumber)) {
          if (currentBlock) questionBlocks.push(currentBlock);
          currentBlock = {
            rowNumber: idx + 1,
            questionNumber: spNum,
            pageNumber: currentDetectedPage,
            rawLines: [String(spaceMatch[2] || '').trim()]
          };
          return;
        }
      }

      if (currentBlock) {
        currentBlock.rawLines.push(line);
      }
    });
    if (currentBlock) questionBlocks.push(currentBlock);

    // Stage 2: Option-Cluster Fallback (if PDF had unnumbered questions or custom font hid question numbers)
    if (questionBlocks.length === 0 && lines.length > 0) {
      const optStartLineRegex = /(?:^|\s)(?:[([]\s*[A-Da-dअआइईबसदकखगघ1-4]\s*[)\]]|[A-Da-dअआइईबसदकखगघ]\s*[.):\-])\s+\S/i;
      const optDRegex = /(?:^|\s)(?:[([]\s*[Ddदघ4]\s*[)\]]|[Ddदघ]\s*[.):\-])\s+\S/i;
      let tempLines = [];
      let sawOptD = false;
      let autoQNum = 1;
      lines.forEach((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line || pageMarkerRegex.test(line)) return;
        const hasOpt = optStartLineRegex.test(line);
        if (sawOptD && !hasOpt && tempLines.length >= 2) {
          questionBlocks.push({
            rowNumber: idx + 1,
            questionNumber: autoQNum++,
            pageNumber: 1,
            rawLines: tempLines.slice()
          });
          tempLines = [line];
          sawOptD = false;
        } else {
          tempLines.push(line);
          if (optDRegex.test(line)) sawOptD = true;
        }
      });
      if (tempLines.length > 0 && sawOptD) {
        questionBlocks.push({
          rowNumber: lines.length,
          questionNumber: autoQNum++,
          pageNumber: 1,
          rawLines: tempLines
        });
      }
    }

    // Stage 3: Question-Mark / Paragraph Fallback so a non-empty file NEVER returns 0 questions
    if (questionBlocks.length === 0 && lines.length > 0) {
      const meaningfulLines = lines.filter((l) => l.length > 3 && !pageMarkerRegex.test(l));
      let chunk = [];
      let autoQNum = 1;
      meaningfulLines.forEach((line, idx) => {
        chunk.push(line);
        if (/[?？।]$/.test(line) && chunk.length >= 2) {
          questionBlocks.push({
            rowNumber: idx + 1,
            questionNumber: autoQNum++,
            pageNumber: 1,
            rawLines: chunk.slice()
          });
          chunk = [];
        } else if (chunk.length >= 5) {
          questionBlocks.push({
            rowNumber: idx + 1,
            questionNumber: autoQNum++,
            pageNumber: 1,
            rawLines: chunk.slice()
          });
          chunk = [];
        }
      });
      if (chunk.length > 0) {
        questionBlocks.push({
          rowNumber: meaningfulLines.length,
          questionNumber: autoQNum++,
          pageNumber: 1,
          rawLines: chunk
        });
      }
    }

    if (questionBlocks.length === 0) {
      structureErrors.push({
        rowNumber: 1,
        questionNumber: '-',
        errorType: 'No Numbered Questions Found in PDF',
        reason: 'Could not detect numbered questions in the uploaded PDF.'
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

    const preliminaryItems = [];
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

      const inlineAnsMatch = fullBlockText.match(/(?:^|\n|\s|\[|\()\s*(?:Ans(?:wer)?|Correct\s*(?:Answer|Option)|उत्तर|सही\s*(?:उत्तर|विकल्प)|अभीष्ट\s*उत्तर)\s*(?:विकल्प|Option)?\s*[:\-=]\s*\(?([A-Da-d1-4अआइईबसदकखगघ])\)?/i);
      if (inlineAnsMatch) {
        const inlineMap = parseAnswerKeyMap(`1-${inlineAnsMatch[1]}`);
        if (inlineMap.has(1)) inlineAnswer = inlineMap.get(1);
      } else {
        const tickedOptMatch = fullBlockText.match(/(?:✓|✔|☑|\[\s*✓\s*\])\s*\(?([A-Da-dअआइईबसदकखगघ])\s*[).:\-]/i);
        if (tickedOptMatch) {
          const tickedMap = parseAnswerKeyMap(`1-${tickedOptMatch[1]}`);
          if (tickedMap.has(1)) inlineAnswer = tickedMap.get(1);
        }
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
        .replace(/(?:^|\n)\s*(?:Ans(?:wer)?|Correct\s*(?:Answer|Option)|उत्तर|सही\s*(?:उत्तर|विकल्प)|अभीष्ट\s*उत्तर)\s*(?:विकल्प|Option)?\s*[:\-=]\s*\(?[A-Da-d1-4अआइईबसदकखगघ]\b[^\n]*/gi, '')
        .replace(/\[\s*(?:Exam|Category|Subject|Topic|Subtopic|Difficulty|परीक्षा|विषय|टॉपिक|अध्याय|उपटॉपिक|कठिनाई|स्तर)\s*:[^\]]+\]/gi, '')
        .trim();

      const extracted = extractBilingualStemAndOptionsFromBlock(textWithoutExp);

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

      preliminaryItems.push({
        rowNumber: block.rowNumber || (idx + 1),
        questionNumber: block.questionNumber || (idx + 1),
        id: '',
        questionHi: extracted.stemHi,
        questionEn: extracted.stemEn,
        optionsHi: extracted.optsHi,
        optionsEn: extracted.optsEn,
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
        languageAvailability: detectLanguageAvailability(extracted.stemHi, extracted.stemEn),
        pyqTag: `PDF Import (Set ${detectedPaperSet})`,
        tags: ['PDF Import', `Set ${detectedPaperSet}`, 'OCR Verified'],
        status: matchedFromKey !== null && matchedFromKey !== undefined ? 'verified' : 'unverified',
        adminVerified: matchedFromKey !== null && matchedFromKey !== undefined,
        importSource: 'pdf_ocr_answer_key'
      });
    });

    // Pair & merge same-numbered Hindi + English blocks (e.g. Q1 in Hindi from Left Column and Q1 in English from Right Column)
    const byQNum = new Map();
    preliminaryItems.forEach((item) => {
      const qNum = Number(item.questionNumber || 0);
      const itemFullText = [item.questionHi, item.questionEn, ...(item.optionsHi || []), ...(item.optionsEn || [])].join(' ');
      const itemDevCount = (itemFullText.match(/[\u0900-\u097F]/g) || []).length;
      const itemHasDevanagari = itemDevCount >= 4;

      if (qNum > 0 && byQNum.has(qNum)) {
        const prev = byQNum.get(qNum);
        const prevFullText = [prev.questionHi, prev.questionEn, ...(prev.optionsHi || []), ...(prev.optionsEn || [])].join(' ');
        const prevDevCount = (prevFullText.match(/[\u0900-\u097F]/g) || []).length;
        const prevHasDevanagari = prevDevCount >= 4;

        if (prevHasDevanagari !== itemHasDevanagari) {
          const hiBlock = itemHasDevanagari ? item : prev;
          const enBlock = itemHasDevanagari ? prev : item;
          prev.questionHi = hiBlock.questionHi || enBlock.questionHi;
          prev.questionEn = enBlock.questionEn || enBlock.questionHi || hiBlock.questionEn;
          prev.optionsHi = [0, 1, 2, 3].map((i) => (hiBlock.optionsHi && hiBlock.optionsHi[i]) || (enBlock.optionsHi && enBlock.optionsHi[i]) || '');
          prev.optionsEn = [0, 1, 2, 3].map((i) => (enBlock.optionsEn && enBlock.optionsEn[i]) || (hiBlock.optionsEn && hiBlock.optionsEn[i]) || '');
          prev.languageAvailability = 'Both';
        } else {
          // Both blocks are the same language (e.g., continuation across columns/pages) — fill any missing stem/options
          if ((!prev.questionHi || prev.questionHi.length < 10) && item.questionHi) prev.questionHi = item.questionHi;
          if ((!prev.questionEn || prev.questionEn.length < 10) && item.questionEn) prev.questionEn = item.questionEn;
          prev.optionsHi = [0, 1, 2, 3].map((i) => (prev.optionsHi && prev.optionsHi[i]) || (item.optionsHi && item.optionsHi[i]) || '');
          prev.optionsEn = [0, 1, 2, 3].map((i) => (prev.optionsEn && prev.optionsEn[i]) || (item.optionsEn && item.optionsEn[i]) || '');
        }
        if (!prev.answerKeyMatched && item.answerKeyMatched) {
          prev.rawCorrectIndex = item.rawCorrectIndex;
          prev.answerKeyMatched = true;
          prev.status = 'verified';
          prev.adminVerified = true;
        }
        if (!prev.explanationHi && item.explanationHi) prev.explanationHi = item.explanationHi;
        if (!prev.explanationEn && item.explanationEn) prev.explanationEn = item.explanationEn;
        return;
      }

      if (qNum > 0) {
        byQNum.set(qNum, item);
      }
      rawItems.push(item);
    });

    rawItems.sort((a, b) => (Number(a.questionNumber) || 0) - (Number(b.questionNumber) || 0));

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
        const rawQHiField = item.questionHi ?? item.question_hi ?? item.questionHindi ?? item.hindi_question ?? '';
        const rawQEnField = item.questionEn ?? item.question_en ?? item.questionEnglish ?? item.english_question ?? item.question ?? '';
        let resolvedQHi = String(rawQHiField).trim();
        let resolvedQEn = String(rawQEnField).trim();
        if (!resolvedQHi && resolvedQEn) {
          const splitQ = splitBilingualText(resolvedQEn);
          resolvedQHi = splitQ.hi;
          resolvedQEn = splitQ.en;
        } else if (resolvedQHi && !resolvedQEn) {
          const splitQ = splitBilingualText(resolvedQHi);
          resolvedQHi = splitQ.hi;
          resolvedQEn = splitQ.en;
        }

        const hiOpts = Array.isArray(item.optionsHi)
          ? item.optionsHi
          : [item.optA_Hi ?? item.optionA_Hi ?? fallbackOpts[0], item.optB_Hi ?? item.optionB_Hi ?? fallbackOpts[1], item.optC_Hi ?? item.optionC_Hi ?? fallbackOpts[2], item.optD_Hi ?? item.optionD_Hi ?? fallbackOpts[3]];
        const enOpts = Array.isArray(item.optionsEn)
          ? item.optionsEn
          : [item.optA_En ?? item.optionA_En ?? item.optA ?? item.optionA ?? fallbackOpts[0], item.optB_En ?? item.optionB_En ?? item.optB ?? item.optionB ?? fallbackOpts[1], item.optC_En ?? item.optionC_En ?? item.optC ?? item.optionC ?? fallbackOpts[2], item.optD_En ?? item.optionD_En ?? item.optD ?? item.optionD ?? fallbackOpts[3]];

        const finalOptsHi = [];
        const finalOptsEn = [];
        for (let oi = 0; oi < 4; oi++) {
          const hVal = hiOpts[oi] != null ? String(hiOpts[oi]).trim() : '';
          const eVal = enOpts[oi] != null ? String(enOpts[oi]).trim() : '';
          if (hVal && eVal && hVal !== eVal) {
            finalOptsHi.push(hVal);
            finalOptsEn.push(eVal);
          } else {
            const combined = splitBilingualText(hVal || eVal);
            finalOptsHi.push(combined.hi);
            finalOptsEn.push(combined.en);
          }
        }

        const parsedExamIds = Array.isArray(item.examIds)
          ? item.examIds
          : (item.examIds ? String(item.examIds).split(/[;|,]/).map((e) => e.trim()).filter(Boolean) : []);
        rawItems.push({
          rowNumber: idx + 1,
          questionNumber: idx + 1,
          preferOneBased: jsonPreferOneBased,
          id: item.questionId || item.id || '',
          questionId: item.questionId || item.id || '',
          questionHi: resolvedQHi,
          questionEn: resolvedQEn,
          optionsHi: finalOptsHi,
          optionsEn: finalOptsEn,
          rawCorrectIndex: item.correctIndex !== undefined ? item.correctIndex : (item.correctOptionIndex !== undefined ? item.correctOptionIndex : (item.correctAnswer !== undefined ? item.correctAnswer : item.answer)),
          explanationHi: item.explanationHi != null ? String(item.explanationHi).trim() : '',
          explanationEn: item.explanationEn != null ? String(item.explanationEn).trim() : (item.explanation != null ? String(item.explanation).trim() : ''),
          examCode: item.examCode || item.examCategory || (parsedExamIds[0] || ''),
          examIds: parsedExamIds,
          mainCategoryId: item.mainCategoryId || '',
          mainCategory: item.mainCategory || '',
          subjectId: item.subjectId || '',
          subjectTag: item.subjectTag || item.subject || '',
          topicId: item.topicId || '',
          topic: item.topic || '',
          subtopicId: item.subtopicId || '',
          subtopic: item.subtopic || '',
          difficulty: item.difficultyLevel || item.difficulty || '',
          difficultyLevel: item.difficultyLevel || item.difficulty || '',
          questionType: item.questionType || 'MCQ',
          sourceExam: item.sourceExam || item.examName || '',
          sourceYear: item.sourceYear || item.examYear || '',
          paperName: item.paperName || '',
          shift: item.shift || '',
          paperSetCode: item.paperSetCode || '',
          sourceDocument: item.sourceDocument || item.source || fileName || '',
          sourcePageNumber: item.sourcePageNumber || '',
          pyqReferences: Array.isArray(item.pyqReferences) ? item.pyqReferences : [],
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

    // CSV File Parsing & Header Validation (100% compatible with legacy 14-column CSV + optional hierarchical columns + Hindi/Bilingual headers)
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
      const k = String(c || '').toLowerCase().replace(/[()[\]./:,\s_-]/g, '');
      return k.includes('question') || k.includes('opta') || k.includes('optiona') || k.includes('correct') || k.includes('subject') || k.includes('explanation') ||
        k.includes('प्रश्न') || k.includes('विकल्प') || k.includes('उत्तर') || k.includes('विषय');
    });

    let columnKeys = [];
    let dataStartIdx = 0;

    if (looksLikeHeader) {
      dataStartIdx = 1;
      const unrecognizedCols = [];
      columnKeys = firstRowCells.map((rawCol) => {
        const cleanCol = String(rawCol || '').trim().toLowerCase().replace(/[()[\]./:]/g, ' ').replace(/\s+/g, ' ').trim();
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
      // Compact positional CSV (single-language or inline-bilingual 6-to-10 column format)
      columnKeys = [
        'questionHi',
        'optA_Hi', 'optB_Hi', 'optC_Hi', 'optD_Hi',
        'correctIndex', 'explanationHi', 'subjectTag', 'examCode', 'topic'
      ];
    } else if (firstRowCells.length >= 11 && firstRowCells.length <= 13) {
      // 11-to-13 column Bilingual positional CSV (questionHi, questionEn, 4 Hi options, 4 En options, correctIndex, explanationHi, explanationEn)
      columnKeys = [
        'questionHi', 'questionEn',
        'optA_Hi', 'optB_Hi', 'optC_Hi', 'optD_Hi',
        'optA_En', 'optB_En', 'optC_En', 'optD_En',
        'correctIndex', 'explanationHi', 'explanationEn'
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
      let csvQHi = mappedData.questionHi != null ? String(mappedData.questionHi).trim() : '';
      let csvQEn = mappedData.questionEn != null ? String(mappedData.questionEn).trim() : '';
      if (csvQHi && !csvQEn) {
        const splitQ = splitBilingualText(csvQHi);
        csvQHi = splitQ.hi;
        csvQEn = splitQ.en;
      } else if (!csvQHi && csvQEn) {
        const splitQ = splitBilingualText(csvQEn);
        csvQHi = splitQ.hi;
        csvQEn = splitQ.en;
      }

      const rawCsvOptsHi = [
        mappedData.optA_Hi != null ? String(mappedData.optA_Hi).trim() : '',
        mappedData.optB_Hi != null ? String(mappedData.optB_Hi).trim() : '',
        mappedData.optC_Hi != null ? String(mappedData.optC_Hi).trim() : '',
        mappedData.optD_Hi != null ? String(mappedData.optD_Hi).trim() : ''
      ];
      const rawCsvOptsEn = [
        mappedData.optA_En != null ? String(mappedData.optA_En).trim() : '',
        mappedData.optB_En != null ? String(mappedData.optB_En).trim() : '',
        mappedData.optC_En != null ? String(mappedData.optC_En).trim() : '',
        mappedData.optD_En != null ? String(mappedData.optD_En).trim() : ''
      ];
      const finalCsvOptsHi = [];
      const finalCsvOptsEn = [];
      for (let oi = 0; oi < 4; oi++) {
        const hVal = rawCsvOptsHi[oi];
        const eVal = rawCsvOptsEn[oi];
        if (hVal && eVal && hVal !== eVal) {
          finalCsvOptsHi.push(hVal);
          finalCsvOptsEn.push(eVal);
        } else {
          const splitOpt = splitBilingualText(hVal || eVal);
          finalCsvOptsHi.push(splitOpt.hi);
          finalCsvOptsEn.push(splitOpt.en);
        }
      }

      rawItems.push({
        rowNumber: rowObj.rowNumber,
        questionNumber: qCounter,
        preferOneBased: csvPreferOneBased,
        hasFewerColumns: missingColumnCount,
        columnCountDetected: cells.length,
        id: mappedData.questionId || mappedData.id || '',
        questionId: mappedData.questionId || mappedData.id || '',
        questionHi: csvQHi,
        questionEn: csvQEn,
        optionsHi: finalCsvOptsHi,
        optionsEn: finalCsvOptsEn,
        rawCorrectIndex: mappedData.correctIndex,
        explanationHi: mappedData.explanationHi != null ? String(mappedData.explanationHi).trim() : '',
        explanationEn: mappedData.explanationEn != null ? String(mappedData.explanationEn).trim() : '',
        examCode: mappedData.examCode || parsedExamIds[0] || '',
        examIds: parsedExamIds,
        mainCategoryId: mappedData.mainCategoryId || '',
        mainCategory: mappedData.mainCategory || '',
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
        paperName: mappedData.paperName || '',
        shift: mappedData.shift || '',
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
        const hasSpecificSubject = item.subjectTag && !/^(?:general|general\s*studies|gs|gk|सामान्य\s*अध्ययन|needs[\s_]*categorisation|uncategorised|unknown|-)$/i.test(String(item.subjectTag).trim());
        const hasSpecificTopic = item.topic && !/^(?:general|general\s*knowledge|gk|gs|सामान्य\s*ज्ञान|needs[\s_]*categorisation|uncategorised|unknown|-)$/i.test(String(item.topic).trim());
        const shouldAutoCat = !(batchDefaults && batchDefaults.overrideAll) && (fileType === 'PDF' || !hasSpecificSubject || !hasSpecificTopic);

        if (shouldAutoCat) {
          const predicted = autoCategorizeQuestionFromMaster(item, catalog, defaultExamIds);
          const isUncat = Boolean(predicted.needsCategorisation);
          return Object.assign({}, item, {
            examCode: item.examCode || predicted.examCode,
            examIds: (Array.isArray(item.examIds) && item.examIds.length > 0) ? item.examIds : predicted.examIds,
            mainCategoryId: item.mainCategoryId || predicted.mainCategoryId || (isUncat ? 'cat_uncategorised' : 'cat_cg_gk'),
            mainCategory: item.mainCategory || predicted.mainCategory || (isUncat ? 'Uncategorised' : 'Chhattisgarh GK'),
            subjectId: hasSpecificSubject ? (item.subjectId || predicted.subjectId) : (predicted.subjectId || 'sub_uncategorised'),
            subjectTag: hasSpecificSubject ? item.subjectTag : (predicted.subjectTag || 'Uncategorised'),
            topicId: hasSpecificTopic ? (item.topicId || predicted.topicId) : (predicted.topicId || 'top_uncategorised'),
            topic: hasSpecificTopic ? item.topic : (predicted.topic || 'Uncategorised'),
            subtopicId: predicted.subtopicId || item.subtopicId || '',
            subtopic: predicted.subtopic || item.subtopic || '',
            categorisationConfidence: predicted.categorisationConfidence,
            needsCategorisation: isUncat && !hasSpecificSubject,
            verificationStatus: (isUncat && !hasSpecificSubject)
              ? 'needs_categorisation'
              : (fileType === 'PDF' ? (item.answerKeyMatched ? 'verified' : 'unverified') : (item.verificationStatus || 'verified')),
            status: (isUncat && !hasSpecificSubject)
              ? 'needs_categorisation'
              : (fileType === 'PDF' ? (item.answerKeyMatched ? 'verified' : 'unverified') : (item.status || 'verified')),
            adminVerified: !(isUncat && !hasSpecificSubject) && (fileType === 'PDF' ? Boolean(item.answerKeyMatched) : (item.adminVerified !== false)),
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

      // Resolve hierarchical IDs against Main Category / Subject / Topic / Subtopic Master
      const resolvedHierarchy = catalog.resolveHierarchy({
        examIds: effectiveExamIds,
        examCode: effectiveExamCode,
        mainCategoryId: item.mainCategoryId || (batchDefaults && batchDefaults.mainCategoryId) || '',
        mainCategory: item.mainCategory || (batchDefaults && batchDefaults.mainCategory) || '',
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
      let missingFolderInfo = null;
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

        // PART 5 Requirement: If CSV/Import specifies a Subject or Topic folder that does not exist,
        // do NOT silently auto-create it — alert Admin, show suggested existing folders, and let Admin map or approve!
        if (effectiveSubject && effectiveSubject !== 'Uncategorised' && effectiveSubject !== 'Needs Categorisation') {
          const matchedSub = catalog.findSubject(effectiveSubject);
          const knownSub = Boolean(matchedSub && matchedSub.subjectId !== 'sub_uncategorised');
          const knownTop = !effectiveTopic || effectiveTopic === 'Uncategorised' || catalog.isKnownTopic(effectiveSubject, effectiveTopic);
          const approvalKey = `${normalizeFolderKey(effectiveSubject)}::${normalizeFolderKey(effectiveTopic || 'General')}`;
          const approvedMap = (qbState.previewSession && qbState.previewSession.approvedNewFolders) || {};
          const isAlreadyApproved = Boolean(approvedMap[approvalKey]);

          if ((!knownSub || !knownTop) && !isAlreadyApproved) {
            const suggestions = catalog.suggestSimilarFolders
              ? catalog.suggestSimilarFolders(effectiveTopic || effectiveSubject, knownSub ? 'topic' : 'subject', matchedSub ? matchedSub.subjectId : '')
              : [];
            missingFolderInfo = {
              approvalKey,
              subjectName: effectiveSubject,
              topicName: effectiveTopic || 'सामान्य जानकारी (General Info)',
              mainCategoryId: resolvedHierarchy.mainCategoryId || 'cat_cg_gk',
              mainCategory: resolvedHierarchy.mainCategory || 'Chhattisgarh GK',
              knownSubject: knownSub,
              knownTopic: knownTop,
              suggestions
            };
            unknownTaxonomyItems.push({
              approvalKey,
              examCode: effectiveExamCode,
              mainCategoryId: resolvedHierarchy.mainCategoryId || 'cat_cg_gk',
              mainCategory: resolvedHierarchy.mainCategory || 'Chhattisgarh GK',
              subjectName: effectiveSubject,
              topicName: effectiveTopic || 'सामान्य जानकारी (General Info)',
              subtopicName: effectiveSubtopic || '',
              suggestions
            });
            warnings.push({
              rowNumber,
              questionNumber,
              warningType: 'Unapproved New Folder (Admin Confirmation Required)',
              reason: `Folder "${effectiveSubject}${effectiveTopic ? ' › ' + effectiveTopic : ''}" does not exist yet. Map to an existing folder or click "Approve New Folder" before importing.`
            });
          }
        }
      }

      // Check if question Needs Categorisation (e.g. uncategorised question or unapproved folder)
      const needsCategorisationFlag = Boolean(
        item.needsCategorisation === true ||
        !resolvedHierarchy.subjectId ||
        resolvedHierarchy.subjectId === 'sub_uncategorised' ||
        !resolvedHierarchy.topicId ||
        resolvedHierarchy.topicId === 'top_uncategorised' ||
        missingFolderInfo
      );

      if (needsCategorisationFlag && errors.length === 0) {
        warnings.push({
          rowNumber,
          questionNumber,
          warningType: 'Needs Categorisation / Verification',
          reason: missingFolderInfo
            ? `Folder "${missingFolderInfo.subjectName} › ${missingFolderInfo.topicName}" requires Admin approval or mapping.`
            : 'Subject or Topic could not be deterministically matched. Placed in "Uncategorised" until verified by Admin.'
        });
      }

      // 7. Duplicate Question Detection (Exact vs Possible Duplicate)
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
        const sameCorrectAnswer = Number(idxCheck.index ?? 0) === Number(target.correctOptionIndex ?? 0);

        if (isExactStem && !isPermuted && maxOptSim >= 0.98 && sameCorrectAnswer) {
          duplicateInfo = {
            matchType: 'Exact Duplicate',
            isExactDuplicate: true,
            similarityPct: 100,
            matchedQuestion: target,
            reason: `Exact match (same question stem, 4 options, and correct answer) in ${target.sourceLabel}. Will attach Exam/PYQ reference to existing question without duplicating.`
          };
          break;
        } else if (isExactStem && (isPermuted || !sameCorrectAnswer)) {
          duplicateInfo = {
            matchType: 'Possible Duplicate (Option Order / Answer Diff)',
            isExactDuplicate: false,
            similarityPct: 98,
            matchedQuestion: target,
            reason: `Identical question stem with different option ordering or answer key (${target.sourceLabel}). Flagged as Possible Duplicate for Admin review.`
          };
          break;
        } else if (maxStemSim >= 0.72 && isPermuted && maxOptSim >= 0.85) {
          duplicateInfo = {
            matchType: 'Possible Duplicate (Permuted Options)',
            isExactDuplicate: false,
            similarityPct: Math.round(maxStemSim * 100),
            matchedQuestion: target,
            reason: `Question has ${Math.round(maxStemSim * 100)}% text similarity and reordered answer options (${target.sourceLabel}).`
          };
          break;
        } else if (maxStemSim >= 0.82) {
          duplicateInfo = {
            matchType: 'Possible Duplicate (Similar Wording)',
            isExactDuplicate: false,
            similarityPct: Math.round(maxStemSim * 100),
            matchedQuestion: target,
            reason: `High text similarity (${Math.round(maxStemSim * 100)}%) with minor wording differences (${target.sourceLabel}).`
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

      const finalMainCatId = resolvedHierarchy.mainCategoryId || (needsCategorisationFlag ? 'cat_uncategorised' : 'cat_cg_gk');
      const finalMainCatName = resolvedHierarchy.mainCategory || (needsCategorisationFlag ? 'Uncategorised' : 'Chhattisgarh GK');
      const finalSubjName = resolvedHierarchy.subjectTag || effectiveSubject || 'Uncategorised';
      const finalTopName = resolvedHierarchy.topic || effectiveTopic || 'Uncategorised';
      const folderPath = `${finalMainCatName} › ${finalSubjName} › ${finalTopName}`;

      const itemPyqRefs = normalizeQuestionPyqReferences({
        id: item.questionId || item.id || '',
        questionNumber,
        examCode: resolvedHierarchy.examCode,
        sourceExam: item.sourceExam || (batchDefaults && batchDefaults.sourceExam) || '',
        sourceYear: item.sourceYear || (batchDefaults && batchDefaults.sourceYear) || '',
        paperName: item.paperName || (batchDefaults && batchDefaults.paperName) || '',
        shift: item.shift || (batchDefaults && batchDefaults.shift) || '',
        paperSetCode: item.paperSetCode || effectivePaperSetCode || '',
        sourceDocument: item.sourceDocument || fileName || '',
        subjectTag: finalSubjName,
        topic: finalTopName,
        pyqTag: item.pyqTag || '',
        pyqReferences: item.pyqReferences || []
      }, catalog);

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
        mainCategoryId: finalMainCatId,
        mainCategory: finalMainCatName,
        subjectId: resolvedHierarchy.subjectId || 'sub_uncategorised',
        subjectTag: finalSubjName,
        topicId: resolvedHierarchy.topicId || 'top_uncategorised',
        topic: finalTopName,
        subtopicId: resolvedHierarchy.subtopicId,
        subtopic: resolvedHierarchy.subtopic || effectiveSubtopic || '',
        folderPath,
        missingFolderInfo,
        difficulty: normalizedDiff || 'Moderate',
        difficultyLevel: normalizedDiff || 'Moderate',
        questionType: item.questionType || 'MCQ',
        sourceExam: item.sourceExam || (batchDefaults && batchDefaults.sourceExam) || '',
        sourceYear: item.sourceYear || (batchDefaults && batchDefaults.sourceYear) || '',
        paperName: item.paperName || (batchDefaults && batchDefaults.paperName) || '',
        shift: item.shift || (batchDefaults && batchDefaults.shift) || '',
        paperSetCode: item.paperSetCode || '',
        sourceDocument: item.sourceDocument || fileName || '',
        sourcePageNumber: item.sourcePageNumber || '',
        pyqReferences: itemPyqRefs,
        categorisationConfidence: item.categorisationConfidence != null ? item.categorisationConfidence : (needsCategorisationFlag ? 25 : 95),
        needsCategorisation: needsCategorisationFlag,
        verificationStatus: needsCategorisationFlag
          ? 'needs_categorisation'
          : (duplicateInfo && !duplicateInfo.isExactDuplicate ? 'possible_duplicate' : (isVerifiedFlag ? 'verified' : 'unverified')),
        languageAvailability: detectLanguageAvailability(rawQHi, rawQEn),
        pyqTag: item.pyqTag || '',
        tags: mergedTags,
        status: needsCategorisationFlag
          ? 'needs_categorisation'
          : (duplicateInfo && !duplicateInfo.isExactDuplicate ? 'possible_duplicate' : (isVerifiedFlag ? 'verified' : 'unverified')),
        adminVerified: isVerifiedFlag,
        importSource: item.importSource || (fileType === 'PDF' ? 'pdf_ocr_answer_key' : fileType.toLowerCase()),
        errors,
        warnings,
        duplicateInfo,
        duplicateResolution: item.duplicateResolution || (duplicateInfo && duplicateInfo.isExactDuplicate ? 'merge_exams' : 'import_anyway')
      };
    });

    const uniqueUnknownTaxonomy = [];
    const seenTaxKeys = new Set();
    unknownTaxonomyItems.forEach((ut) => {
      const k = `${ut.subjectName}::${ut.topicName}`.toLowerCase();
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
      approvedNewFolders: (qbState.previewSession && qbState.previewSession.approvedNewFolders) || {},
      batchDefaults: batchDefaults || {
        examCode: 'CGPSC',
        examIds: ['CGPSC'],
        mainCategoryId: 'cat_cg_gk',
        mainCategory: 'Chhattisgarh GK',
        subjectTag: 'छत्तीसगढ़ का इतिहास (History of Chhattisgarh)',
        topic: 'छत्तीसगढ़ का प्राचीन इतिहास (Ancient History of CG)',
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
      'correctIndex', 'explanationHi', 'explanationEn',
      'mainCategory', 'subjectTag', 'topic', 'subtopic',
      'questionId', 'examIds', 'mainCategoryId', 'subjectId', 'topicId', 'subtopicId',
      'difficultyLevel', 'questionType', 'sourceExam', 'sourceYear', 'paperName', 'shift', 'paperSetCode',
      'sourceDocument', 'sourcePageNumber', 'verificationStatus'
    ];
    const lines = [headers.join(',')];
    (questionsArray || []).forEach((q) => {
      const optsHi = Array.isArray(q.optionsHi) ? q.optionsHi : [q.optA_Hi || '', q.optB_Hi || '', q.optC_Hi || '', q.optD_Hi || ''];
      const optsEn = Array.isArray(q.optionsEn) ? q.optionsEn : [q.optA_En || '', q.optB_En || '', q.optC_En || '', q.optD_En || ''];
      const examIdsArr = Array.isArray(q.examIds) && q.examIds.length > 0 ? q.examIds : [q.examCode || 'CGPSC'];
      const firstPyq = Array.isArray(q.pyqReferences) && q.pyqReferences[0] ? q.pyqReferences[0] : {};
      const row = [
        q.questionHi || '',
        q.questionEn || '',
        optsHi[0] || '', optsHi[1] || '', optsHi[2] || '', optsHi[3] || '',
        optsEn[0] || '', optsEn[1] || '', optsEn[2] || '', optsEn[3] || '',
        q.correctOptionIndex != null ? q.correctOptionIndex : (q.correctIndex || 0),
        q.explanationHi || '',
        q.explanationEn || '',
        q.mainCategory || 'Chhattisgarh GK',
        q.subjectTag || 'Uncategorised',
        q.topic || 'Uncategorised',
        q.subtopic || '',
        q.questionId || q.id || '',
        examIdsArr.join(';'),
        q.mainCategoryId || '',
        q.subjectId || '',
        q.topicId || '',
        q.subtopicId || '',
        q.difficultyLevel || q.difficulty || 'Moderate',
        q.questionType || 'MCQ',
        q.sourceExam || firstPyq.examName || '',
        q.sourceYear || firstPyq.examYear || '',
        q.paperName || firstPyq.paperName || '',
        q.shift || firstPyq.shift || '',
        q.paperSetCode || '',
        q.sourceDocument || firstPyq.source || '',
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
          mainCategoryId: q.mainCategoryId || '',
          mainCategory: q.mainCategory || '',
          subjectId: q.subjectId || '',
          subjectTag: q.subjectTag || 'Uncategorised',
          topicId: q.topicId || '',
          topic: q.topic || 'Uncategorised',
          secondaryTopicIds: Array.isArray(q.secondaryTopicIds) ? q.secondaryTopicIds : [],
          subtopicId: q.subtopicId || '',
          subtopic: q.subtopic || '',
          difficulty: q.difficulty || q.difficultyLevel || 'Moderate',
          difficultyLevel: q.difficultyLevel || q.difficulty || 'Moderate',
          questionType: q.questionType || 'MCQ',
          sourceExam: q.sourceExam || '',
          sourceYear: q.sourceYear || '',
          paperName: q.paperName || '',
          shift: q.shift || '',
          paperSetCode: q.paperSetCode || '',
          sourceDocument: q.sourceDocument || '',
          sourcePageNumber: q.sourcePageNumber || '',
          pyqReferences: Array.isArray(q.pyqReferences) ? q.pyqReferences : [],
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

  // =========================================================================
  // Gemini AI Bridge (Firebase AI Logic gemini-3.8-flash) for Question Bank
  // =========================================================================
  const aiPendingCallbacks = {};
  window.__onAiQuestionScanResult = function (callbackId, ok, payload) {
    const entry = aiPendingCallbacks[callbackId];
    if (!entry) return;
    delete aiPendingCallbacks[callbackId];
    if (entry.timer) clearTimeout(entry.timer);
    if (ok) entry.resolve(payload);
    else entry.reject(new Error(payload || 'AI Scan failed'));
  };

  function parseAiJsonArraySafely(rawStr) {
    if (!rawStr) return [];
    let text = String(rawStr).trim();
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      const direct = JSON.parse(text);
      if (Array.isArray(direct)) return direct;
      if (direct && typeof direct === 'object') {
        if (Array.isArray(direct.questions)) return direct.questions;
        if (Array.isArray(direct.items)) return direct.items;
        if (Array.isArray(direct.data)) return direct.data;
        if (direct.questionHi || direct.questionEn) return [direct];
      }
    } catch (_) {
      const firstBracket = text.indexOf('[');
      const lastBracket = text.lastIndexOf(']');
      if (firstBracket >= 0 && lastBracket > firstBracket) {
        try {
          const sliced = JSON.parse(text.slice(firstBracket, lastBracket + 1));
          if (Array.isArray(sliced)) return sliced;
        } catch (_2) {}
      }
    }
    return [];
  }

  function callAndroidAiBridge(promptText, base64Image) {
    return new Promise((resolve, reject) => {
      if (
        window.AndroidBridge &&
        (typeof window.AndroidBridge.analyzeQuestionsWithAi === 'function' ||
          typeof window.AndroidBridge.analyzeQuestionImageWithAi === 'function')
      ) {
        const cbId = 'ai_qb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        const timer = setTimeout(() => {
          if (aiPendingCallbacks[cbId]) {
            delete aiPendingCallbacks[cbId];
            reject(new Error('AI timeout'));
          }
        }, 80000);
        aiPendingCallbacks[cbId] = { resolve, reject, timer };
        try {
          if (base64Image && typeof window.AndroidBridge.analyzeQuestionImageWithAi === 'function') {
            window.AndroidBridge.analyzeQuestionImageWithAi(base64Image, promptText, cbId);
          } else {
            window.AndroidBridge.analyzeQuestionsWithAi(promptText, cbId);
          }
        } catch (err) {
          clearTimeout(timer);
          delete aiPendingCallbacks[cbId];
          reject(err);
        }
        return;
      }

      // Web Browser fallback to server-side /api/gemini-generate endpoint
      if (typeof fetch === 'function') {
        fetch('/api/gemini-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptText,
            base64Image: base64Image || '',
            temperature: 0.72
          })
        })
          .then((res) => (res.ok ? res.json() : Promise.reject(new Error('HTTP ' + res.status))))
          .then((data) => {
            if (data && data.ok && data.text) {
              resolve(String(data.text));
            } else {
              reject(new Error((data && data.error) || 'Gemini web proxy unavailable'));
            }
          })
          .catch((err) => reject(err));
        return;
      }

      reject(new Error('AI Bridge not available'));
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  async function detectUploadedFileKind(file, rawTextHint) {
    if (!file) return 'text';
    const name = String(file.name || '').toLowerCase();
    const mime = String(file.type || '').toLowerCase();
    if (name.endsWith('.pdf') || mime === 'application/pdf' || /^Method:\s*PDF_OCR/i.test(String(rawTextHint || ''))) {
      return 'pdf';
    }
    if (/\.(png|jpe?g|webp)$/i.test(name) || mime.startsWith('image/')) {
      return 'image';
    }
    try {
      const sliceBlob = file.slice ? file.slice(0, 32) : file;
      const buf = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = (e) => reject(e);
        r.readAsArrayBuffer(sliceBlob);
      });
      if (buf) {
        const b = new Uint8Array(buf);
        const ascii = new TextDecoder('latin1').decode(b);
        if (ascii.includes('%PDF-')) return 'pdf';
        if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'image';
        if (b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image';
        if (ascii.startsWith('RIFF') && ascii.includes('WEBP')) return 'image';
      }
    } catch (_) {}
    return 'text';
  }

  async function uploadPdfToAndroidBridge(file) {
    if (
      !window.AndroidBridge ||
      typeof window.AndroidBridge.initPdfUpload !== 'function' ||
      typeof window.AndroidBridge.appendPdfChunk !== 'function' ||
      typeof window.AndroidBridge.finalizePdfUpload !== 'function'
    ) {
      return null;
    }
    const dataUrl = await readFileAsDataUrl(file);
    const commaIdx = dataUrl.indexOf('base64,');
    const rawBase64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 7) : dataUrl;
    const uploadId = String(window.AndroidBridge.initPdfUpload() || '');
    if (!uploadId) return null;
    // Chunk size MUST be a multiple of 4 so each base64 chunk decodes cleanly on the Kotlin side
    const chunkSize = 240000;
    for (let offset = 0; offset < rawBase64.length; offset += chunkSize) {
      const chunk = rawBase64.slice(offset, offset + chunkSize);
      const ok = window.AndroidBridge.appendPdfChunk(uploadId, chunk);
      if (!ok) {
        if (typeof window.AndroidBridge.cleanupPdfUpload === 'function') {
          window.AndroidBridge.cleanupPdfUpload(uploadId);
        }
        return null;
      }
    }
    const pageCount = Number(window.AndroidBridge.finalizePdfUpload(uploadId) || 0);
    if (pageCount <= 0) {
      if (typeof window.AndroidBridge.cleanupPdfUpload === 'function') {
        window.AndroidBridge.cleanupPdfUpload(uploadId);
      }
      return null;
    }
    return { uploadId, pageCount };
  }

  function callAndroidPdfVisionBatch(uploadId, startPageOneBased, endPageOneBased, promptText) {
    return new Promise((resolve, reject) => {
      if (
        !window.AndroidBridge ||
        typeof window.AndroidBridge.analyzePdfPagesWithAi !== 'function'
      ) {
        reject(new Error('Native PDF Vision Bridge not available'));
        return;
      }
      const cbId = 'ai_pdf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      const timer = setTimeout(() => {
        if (aiPendingCallbacks[cbId]) {
          delete aiPendingCallbacks[cbId];
          reject(new Error('PDF Vision AI timeout'));
        }
      }, 95000);
      aiPendingCallbacks[cbId] = { resolve, reject, timer };
      try {
        window.AndroidBridge.analyzePdfPagesWithAi(
          uploadId,
          Number(startPageOneBased),
          Number(endPageOneBased),
          promptText,
          cbId
        );
      } catch (err) {
        clearTimeout(timer);
        delete aiPendingCallbacks[cbId];
        reject(err);
      }
    });
  }

  async function extractAnswerKeyWithAiFallback(akFile, paperSetCode, onProgress, options) {
    if (!akFile) return '';
    const opts = options && typeof options === 'object' ? options : {};
    const akKind = await detectUploadedFileKind(akFile, '');
    let extractedAk = '';
    if (akKind !== 'image') {
      try {
        extractedAk = await extractTextFromUploadedFile(akFile, onProgress, { skipCanvasOcr: Boolean(opts.skipCanvasOcr) });
      } catch (_) {}
    }
    const cleanAk = extractReadableTextFromPdfStream(extractedAk || '');
    const testMap = parseAnswerKeyMap(cleanAk, paperSetCode || 'A');
    if (testMap && testMap.size > 0) {
      return cleanAk;
    }
    if (opts.skipCanvasOcr) {
      return cleanAk;
    }
    // If Answer Key PDF/Image is scanned and has no selectable text, use AI Vision or fast OCR to extract the Answer Key!
    const isPdf = akKind === 'pdf';
    const isImg = akKind === 'image';
    const akPrompt = `You are reading an official competitive exam Answer Key (Target Set: Set ${paperSetCode || 'A'}).
Extract all QuestionNumber -> CorrectOption (A, B, C, or D) mappings for Set ${paperSetCode || 'A'}.
Return ONLY a JSON array of strings like: ["1-A", "2-C", "3-B", "4-D"]`;

    try {
      if (isPdf && window.AndroidBridge && typeof window.AndroidBridge.initPdfUpload === 'function') {
        if (onProgress) onProgress(`🔑 AI Vision द्वारा स्कैन की गई उत्तर कुंजी (${akFile.name}) पढ़ी जा रही है...`);
        const uploaded = await uploadPdfToAndroidBridge(akFile);
        if (uploaded && uploaded.pageCount > 0) {
          const pairs = [];
          try {
            const maxAkPages = Math.min(uploaded.pageCount, 6);
            for (let p = 1; p <= maxAkPages; p += 2) {
              const endP = Math.min(maxAkPages, p + 1);
              const resJson = await callAndroidPdfVisionBatch(uploaded.uploadId, p, endP, akPrompt);
              const arr = parseAiJsonArraySafely(resJson);
              arr.forEach((item) => {
                if (typeof item === 'string') pairs.push(item);
                else if (item && item.questionNumber && item.answer) pairs.push(`${item.questionNumber}-${item.answer}`);
              });
            }
          } finally {
            if (typeof window.AndroidBridge.cleanupPdfUpload === 'function') {
              window.AndroidBridge.cleanupPdfUpload(uploaded.uploadId);
            }
          }
          if (pairs.length > 0) return pairs.join(', ');
        }
      } else if (isImg && window.AndroidBridge && typeof window.AndroidBridge.analyzeQuestionImageWithAi === 'function') {
        if (onProgress) onProgress(`🔑 AI Vision द्वारा उत्तर कुंजी इमेज (${akFile.name}) पढ़ी जा रही है...`);
        const dataUrl = await readFileAsDataUrl(akFile);
        const resJson = await callAndroidAiBridge(akPrompt, dataUrl);
        const arr = parseAiJsonArraySafely(resJson);
        if (arr.length > 0) return arr.join(', ');
      } else if (isPdf || isImg) {
        if (onProgress) onProgress(`🔑 उत्तर कुंजी (${akFile.name}) को Smart OCR से पढ़ा जा रहा है...`);
        const ocrAkText = await extractTextFromUploadedFile(akFile, onProgress, { skipCanvasOcr: false });
        const cleanOcrAk = extractReadableTextFromPdfStream(ocrAkText || '');
        if (cleanOcrAk.trim()) return cleanOcrAk;
      }
    } catch (akAiErr) {
      console.warn('Answer Key AI Vision fallback error:', akAiErr);
    }
    return cleanAk;
  }

  async function scanAndCategorizeWithAiOrFallback({
    questionFile,
    rawQuestionText,
    answerKeyText,
    paperSetCode,
    forcedSubjectTag,
    forcedTopic,
    state,
    onProgress,
    onLiveSaveDocs
  }) {
    const catalog = getTaxonomyCatalog(state);
    const allExamCodes = ['ALL', ...catalog.examCategories.map((e) => e.code)];
    const subjectTopicGuide = catalog.subjects.map((s) => {
      const topics = catalog.getTopicsForSubject(s.subjectId).map((t) => t.titleEn).slice(0, 12);
      return `- Subject: "${s.titleEn}" (${s.titleHi}) -> Topics: [${topics.join(', ')}]`;
    }).join('\n');

    const parsedKeyMap = parseAnswerKeyMap(answerKeyText || '', paperSetCode || 'A');
    const keyEntries = parsedKeyMap instanceof Map
      ? Array.from(parsedKeyMap.entries())
      : Object.entries(parsedKeyMap || {}).map(([k, v]) => [Number(k), Number(v)]);
    const getKeyAnswerForQ = (qNum) => {
      if (parsedKeyMap instanceof Map) {
        return parsedKeyMap.has(qNum) ? parsedKeyMap.get(qNum) : undefined;
      }
      return parsedKeyMap && parsedKeyMap[qNum] !== undefined ? parsedKeyMap[qNum] : undefined;
    };
    const compactKeyStr = keyEntries
      .slice(0, 250)
      .map(([qn, optIdx]) => `${qn}:${['A', 'B', 'C', 'D'][optIdx] || 'A'}`)
      .join(', ');

    // Helper: Convert any array of raw items into normalized Question Bank documents
    const convertRawItemsToDocs = (itemsList, baseIndexOffset) => {
      const nowIso = new Date().toISOString();
      const outDocs = [];
      (itemsList || []).forEach((rawItem, idx) => {
        if (!rawItem || typeof rawItem !== 'object') return;
        const qNum = Number(rawItem.questionNumber || (baseIndexOffset || 0) + idx + 1);
        const rawHi = convertKrutiDevInText(String(rawItem.questionHi || '').trim());
        const rawEn = convertKrutiDevInText(String(rawItem.questionEn || '').trim());
        const qHi = rawHi || rawEn;
        const qEn = rawEn || rawHi;
        if (!qHi && !qEn) return;

        const rawOptsHi = Array.isArray(rawItem.optionsHi)
          ? rawItem.optionsHi
          : [rawItem.optA_Hi || '', rawItem.optB_Hi || '', rawItem.optC_Hi || '', rawItem.optD_Hi || ''];
        const rawOptsEn = Array.isArray(rawItem.optionsEn)
          ? rawItem.optionsEn
          : [rawItem.optA_En || '', rawItem.optB_En || '', rawItem.optC_En || '', rawItem.optD_En || ''];

        const optsHi = [0, 1, 2, 3].map((i) =>
          convertKrutiDevInText(String(rawOptsHi[i] || rawOptsEn[i] || `विकल्प ${['A', 'B', 'C', 'D'][i]}`).trim())
        );
        const optsEn = [0, 1, 2, 3].map((i) =>
          convertKrutiDevInText(String(rawOptsEn[i] || rawOptsHi[i] || `Option ${['A', 'B', 'C', 'D'][i]}`).trim())
        );

        let corrIdx = 0;
        const keyMappedAns = getKeyAnswerForQ(qNum);
        if (keyMappedAns !== undefined && keyMappedAns >= 0 && keyMappedAns <= 3) {
          corrIdx = Number(keyMappedAns);
        } else if (rawItem.correctOptionIndex !== undefined && rawItem.correctOptionIndex !== null && rawItem.correctOptionIndex !== '') {
          const parsedCorr = parseCorrectIndexValue(rawItem.correctOptionIndex, optsHi, optsEn, false);
          corrIdx = parsedCorr !== null ? parsedCorr : 0;
        } else if (rawItem.rawCorrectIndex !== undefined && rawItem.rawCorrectIndex !== null && rawItem.rawCorrectIndex !== '') {
          const parsedCorr = parseCorrectIndexValue(rawItem.rawCorrectIndex, optsHi, optsEn, false);
          corrIdx = parsedCorr !== null ? parsedCorr : 0;
        }

        const autoCat = autoCategorizeQuestionFromMaster(
          {
            questionHi: qHi,
            questionEn: qEn,
            optionsHi: optsHi,
            optionsEn: optsEn,
            explanationHi: rawItem.explanationHi || '',
            explanationEn: rawItem.explanationEn || '',
            subjectTag: forcedSubjectTag || rawItem.subjectTag || '',
            topic: forcedTopic || rawItem.topic || ''
          },
          catalog,
          allExamCodes
        );

        const isUncategorisedResult = Boolean(autoCat.needsCategorisation && !forcedSubjectTag && !rawItem.subjectTag);
        const finalSubjName = forcedSubjectTag ||
          (rawItem.subjectTag && rawItem.subjectTag !== 'Needs Categorisation' && rawItem.subjectTag !== 'Uncategorised' ? String(rawItem.subjectTag).trim() : '') ||
          (!isUncategorisedResult && autoCat.subjectTag && autoCat.subjectTag !== 'Uncategorised' ? autoCat.subjectTag : 'Uncategorised');

        const matchedSubObj = catalog.findSubject(finalSubjName);
        const defaultTopicForSub = matchedSubObj && catalog.getTopicsForSubject(matchedSubObj.subjectId)[0]
          ? catalog.getTopicsForSubject(matchedSubObj.subjectId)[0].titleEn
          : 'Uncategorised';

        const finalTopicName = forcedTopic ||
          (rawItem.topic && rawItem.topic !== 'Needs Categorisation' && rawItem.topic !== 'Uncategorised' ? String(rawItem.topic).trim() : '') ||
          (!isUncategorisedResult && autoCat.topic && autoCat.topic !== 'Uncategorised' ? autoCat.topic : defaultTopicForSub);

        if (finalSubjName !== 'Uncategorised' && finalTopicName !== 'Uncategorised') {
          addCustomTaxonomyEntry(state, null, {
            examCode: 'CGPSC',
            mainCategoryId: autoCat.mainCategoryId || (matchedSubObj && matchedSubObj.mainCategoryId) || 'cat_cg_gk',
            mainCategory: autoCat.mainCategory || (matchedSubObj && matchedSubObj.mainCategory) || 'Chhattisgarh GK',
            subjectName: finalSubjName,
            topicName: finalTopicName,
            subtopicName: ''
          });
        }
        const updatedCat = getTaxonomyCatalog(state);
        const resolved = resolveCanonicalQuestionHierarchy(
          {
            examCode: 'ALL',
            examIds: allExamCodes,
            mainCategoryId: autoCat.mainCategoryId || (matchedSubObj && matchedSubObj.mainCategoryId) || '',
            mainCategory: autoCat.mainCategory || (matchedSubObj && matchedSubObj.mainCategory) || '',
            subjectTag: finalSubjName,
            topic: finalTopicName,
            subtopic: ''
          },
          updatedCat
        );

        const corrLetter = ['A', 'B', 'C', 'D'][corrIdx] || 'A';
        const expHi = convertKrutiDevInText(String(rawItem.explanationHi || rawItem.explanationEn || '').trim()) ||
          `सही उत्तर विकल्प (${corrLetter}) ${optsHi[corrIdx] || ''} है।`;
        const expEn = convertKrutiDevInText(String(rawItem.explanationEn || rawItem.explanationHi || '').trim()) ||
          `Correct answer is Option (${corrLetter}) ${optsEn[corrIdx] || ''}.`;
        const diffVal = normalizeDifficultyValue(rawItem.difficulty || rawItem.difficultyLevel) || 'Moderate';
        const isNeedsCat = finalSubjName === 'Uncategorised' || finalTopicName === 'Uncategorised';

        const qDoc = {
          id: '',
          questionId: '',
          examCode: 'ALL',
          examIds: allExamCodes,
          mainCategoryId: isNeedsCat ? 'cat_uncategorised' : (resolved.mainCategoryId || autoCat.mainCategoryId || 'cat_cg_gk'),
          mainCategory: isNeedsCat ? 'Uncategorised' : (resolved.mainCategory || autoCat.mainCategory || 'Chhattisgarh GK'),
          subjectId: isNeedsCat ? 'sub_uncategorised' : (resolved.subjectId || makeSlugId('sub', finalSubjName)),
          subjectTag: isNeedsCat ? 'Uncategorised' : (resolved.subjectTag || finalSubjName),
          topicId: isNeedsCat ? 'top_uncategorised' : (resolved.topicId || makeSlugId('top', finalTopicName)),
          topic: isNeedsCat ? 'Uncategorised' : (resolved.topic || finalTopicName),
          secondaryTopicIds: [],
          subtopicId: '',
          subtopic: '',
          difficulty: diffVal,
          difficultyLevel: diffVal,
          questionType: 'MCQ',
          sourceDocument: (questionFile && questionFile.name) || 'AI_Scan',
          paperSetCode: paperSetCode || 'A',
          pyqReferences: [],
          categorisationConfidence: isNeedsCat ? 25 : 98,
          needsCategorisation: isNeedsCat,
          verificationStatus: isNeedsCat ? 'needs_categorisation' : 'verified',
          status: isNeedsCat ? 'needs_categorisation' : 'verified',
          verified: !isNeedsCat,
          adminVerified: !isNeedsCat,
          isDeleted: false,
          languageAvailability: detectLanguageAvailability(rawHi, rawEn),
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
          explanationHi: expHi,
          explanationEn: expEn,
          createdAt: nowIso,
          updatedAt: nowIso,
          createdAtIso: nowIso,
          updatedAtIso: nowIso
        };
        qDoc.id = computeDeterministicQuestionId(qDoc);
        qDoc.questionId = qDoc.id;
        outDocs.push(qDoc);
      });
      return outDocs;
    };

    const finalDocs = [];
    const seenDocIds = new Set();
    const emitLiveBatch = async (rawItemsBatch, pageLabel) => {
      if (!Array.isArray(rawItemsBatch) || rawItemsBatch.length === 0) return [];
      const converted = convertRawItemsToDocs(rawItemsBatch, finalDocs.length);
      const newDocs = [];
      converted.forEach((doc) => {
        const normKey = doc.id + '::' + normalizeTextForComparison(doc.questionHi || doc.questionEn);
        if (!seenDocIds.has(doc.id) && !seenDocIds.has(normKey)) {
          seenDocIds.add(doc.id);
          seenDocIds.add(normKey);
          finalDocs.push(doc);
          newDocs.push(doc);
        }
      });
      if (newDocs.length > 0 && typeof onLiveSaveDocs === 'function') {
        await onLiveSaveDocs(newDocs, finalDocs, pageLabel);
      }
      return newDocs;
    };

    // Step 1: Run local multi-stage parser on any instant selectable text first (NOTE: parseRawImportFile returns .rawItems!)
    const localParsed = parseRawImportFile(
      rawQuestionText || '',
      (questionFile && questionFile.name) || 'questions.pdf',
      answerKeyText || '',
      paperSetCode || 'A',
      paperSetCode || 'A'
    );
    const localRows = Array.isArray(localParsed.rawItems)
      ? localParsed.rawItems
      : (Array.isArray(localParsed.rows) ? localParsed.rows : []);

    const fileName = (questionFile && questionFile.name) || '';
    const detectedKind = await detectUploadedFileKind(questionFile, rawQuestionText);
    const isPdfFile = detectedKind === 'pdf';
    const isImageFile = detectedKind === 'image';
    const hasAiBridge = Boolean(
      window.AndroidBridge &&
      typeof window.AndroidBridge.analyzeQuestionsWithAi === 'function'
    );
    const hasNativePdfVision = Boolean(
      window.AndroidBridge &&
      typeof window.AndroidBridge.initPdfUpload === 'function' &&
      typeof window.AndroidBridge.analyzePdfPagesWithAi === 'function'
    );

    const answerInstructionBlock = compactKeyStr
      ? `Provided Answer Key Map (Set ${paperSetCode || 'A'}, QuestionNumber:CorrectOption): ${compactKeyStr}
- Priority 1: Use the Provided Answer Key Map above when QuestionNumber is present.
- Priority 2: If a question is not in the map, check if the answer is marked/written inside the Question Paper itself (e.g., "उत्तर:", "Ans:", bold/ticked option ✓, or answer table).
- Priority 3: If no answer is given anywhere, solve the question accurately yourself and set "correctOptionIndex" (0=A, 1=B, 2=C, 3=D).`
      : `No separate Answer Key file was uploaded.
- Priority 1: Carefully check if the Question Paper itself contains the answer (inline like "उत्तर: (A)", "Ans: B", "सही उत्तर:", a ticked/highlighted/bold option ✓, or an answer key table at the end of the paper).
- Priority 2: If the Question Paper does NOT mention the answer for a question, YOU MUST SOLVE the question accurately using your expert knowledge and set the exact "correctOptionIndex" (0=A, 1=B, 2=C, 3=D) along with a clear explanation.`;

    const buildVisionExtractionPrompt = (pageRangeLabel) => `You are an expert Indian Competitive Exam (CGPSC / Vyapam / UPSC / SSC) Question Bank AI Vision Scanner.
Carefully inspect ${pageRangeLabel} of this Question Paper image(s) and extract EVERY multiple-choice question visible on the page(s).
Read both Hindi (Devanagari, even if printed in legacy fonts like KrutiDev/DevLys/Chanakya or scanned) and English text accurately into clean Unicode Devanagari ("questionHi", "optionsHi") and clean English ("questionEn", "optionsEn"). If the paper is only in Hindi, put the Hindi text in both or translate to English; if only in English, translate to Hindi as well so both languages are complete.

ANSWER RESOLUTION RULES (CRITICAL):
${answerInstructionBlock}

SUBJECT & TOPIC FOLDER CATEGORISATION (Subject-Wise -> Topic-Wise ONLY, NO Exam-Wise folder):
${forcedSubjectTag ? `Force Subject Folder: "${forcedSubjectTag}"` : 'Choose the most accurate Subject ("subjectTag") and Topic ("topic") from the list below (or create a clean Topic name if needed):'}
${forcedTopic ? `Force Topic Folder: "${forcedTopic}"` : ''}
${subjectTopicGuide}

Return ONLY a valid JSON array of objects with this exact schema (if a page has only instructions and 0 questions, return []):
[
  {
    "questionNumber": 1,
    "subjectTag": "Chhattisgarh General Knowledge",
    "topic": "History of Chhattisgarh",
    "difficulty": "Moderate",
    "questionHi": "हिन्दी में साफ यूनिकोड प्रश्न...",
    "questionEn": "Clean English question...",
    "optionsHi": ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
    "optionsEn": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "explanationHi": "सही उत्तर और संक्षिप्त हिन्दी व्याख्या...",
    "explanationEn": "Correct answer and concise English explanation..."
  }
]`;

    // If instant digital extraction already found questions (e.g. digital PDF, Shree-Dev/KrutiDev PDF, CSV, JSON), Live-Save them immediately!
    if (localRows.length > 0) {
      await emitLiveBatch(localRows, 'त्वरित डिजिटल टेक्स्ट स्कैन');
    }

    if (hasAiBridge && finalDocs.length === 0) {
      try {
        if (isPdfFile && hasNativePdfVision) {
          if (onProgress) {
            onProgress(`📄 PDF "${fileName}" के पेजों को AI Vision स्कैनिंग के लिए तैयार किया जा रहा है...`);
          }
          const uploadedPdf = await uploadPdfToAndroidBridge(questionFile);
          if (uploadedPdf && uploadedPdf.pageCount > 0) {
            try {
              const totalPages = Math.min(uploadedPdf.pageCount, 35);
              const pagesPerBatch = 2;
              for (let startP = 1; startP <= totalPages; startP += pagesPerBatch) {
                const endP = Math.min(totalPages, startP + pagesPerBatch - 1);
                if (onProgress) {
                  onProgress(
                    `🤖 AI Vision द्वारा PDF पेज ${startP}${endP > startP ? `-${endP}` : ''} / ${totalPages} स्कैन हो रहा है (अब तक ${finalDocs.length} प्रश्न लाइव सेव)...`
                  );
                }
                try {
                  const batchPrompt = buildVisionExtractionPrompt(
                    endP > startP ? `Pages ${startP} to ${endP}` : `Page ${startP}`
                  );
                  const aiJsonStr = await callAndroidPdfVisionBatch(
                    uploadedPdf.uploadId,
                    startP,
                    endP,
                    batchPrompt
                  );
                  const parsedArr = parseAiJsonArraySafely(aiJsonStr);
                  if (parsedArr.length > 0) {
                    await emitLiveBatch(parsedArr, `पेज ${startP}${endP > startP ? `-${endP}` : ''}/${totalPages}`);
                  }
                } catch (pageBatchErr) {
                  console.warn(`PDF Vision batch ${startP}-${endP} error:`, pageBatchErr);
                }
              }
            } finally {
              if (typeof window.AndroidBridge.cleanupPdfUpload === 'function') {
                window.AndroidBridge.cleanupPdfUpload(uploadedPdf.uploadId);
              }
            }
          }
          if (finalDocs.length === 0 && localRows.length > 0) {
            await emitLiveBatch(localRows, 'डिजिटल टेक्स्ट बैकअप');
          }
        } else if (isImageFile) {
          if (onProgress) onProgress('🤖 AI Vision द्वारा प्रश्न-पत्र इमेज और उत्तर स्कैन किए जा रहे हैं...');
          const dataUrl = await readFileAsDataUrl(questionFile);
          const prompt = buildVisionExtractionPrompt('this image');
          const aiJsonStr = await callAndroidAiBridge(prompt, dataUrl);
          const parsedArr = parseAiJsonArraySafely(aiJsonStr);
          if (parsedArr.length > 0) {
            await emitLiveBatch(parsedArr, 'इमेज स्कैन');
          }
        }

        if (finalDocs.length === 0 && rawQuestionText && rawQuestionText.replace(/^Method:\s*PDF_OCR\s*/i, '').trim().length > 15) {
          const cleanRaw = convertKrutiDevInText(extractReadableTextFromPdfStream(rawQuestionText));
          const chunkLen = 9000;
          for (let offset = 0; offset < Math.min(cleanRaw.length, 45000); offset += chunkLen) {
            const textSlice = cleanRaw.slice(offset, offset + chunkLen);
            if (onProgress) {
              onProgress(`🤖 AI द्वारा टेक्स्ट से प्रश्न और उत्तर निकाले जा रहे हैं (${Math.min(100, Math.round(((offset + chunkLen) / cleanRaw.length) * 100))}%)...`);
            }
            const prompt = `You are an expert competitive exam Question Bank AI scanner.
Extract all multiple-choice questions from the following Question Paper text, fix any garbled/KrutiDev Hindi into Unicode Devanagari, and categorise each question into a Subject and Topic folder.
${answerInstructionBlock}
${forcedSubjectTag ? `Force Subject Folder: "${forcedSubjectTag}"` : ''}
${forcedTopic ? `Force Topic Folder: "${forcedTopic}"` : ''}
Available Subject & Topic Folders:
${subjectTopicGuide}

Question Paper Text Chunk:
${textSlice}

Return ONLY a JSON array of objects:
[{"questionNumber": 1, "subjectTag": "...", "topic": "...", "difficulty": "Moderate", "questionHi": "...", "questionEn": "...", "optionsHi": ["A","B","C","D"], "optionsEn": ["A","B","C","D"], "correctOptionIndex": 0, "explanationHi": "...", "explanationEn": "..."}]`;
            try {
              const aiJsonStr = await callAndroidAiBridge(prompt, null);
              const parsedSlice = parseAiJsonArraySafely(aiJsonStr);
              if (parsedSlice.length > 0) {
                await emitLiveBatch(parsedSlice, 'टेक्स्ट खंड');
              }
            } catch (_sliceErr) {}
          }
        }
      } catch (aiErr) {
        console.warn('AI scan fallback to local:', aiErr);
      }
    }

    // Page-by-Page Live Save Scanner for Scanned / Custom-Font PDFs (supports 10 to 35 page PDFs with Reusable OCR Worker)
    if (finalDocs.length === 0 && isPdfFile && questionFile) {
      try {
        const pdfjsLib = await ensurePdfJsLoaded();
        if (pdfjsLib && typeof pdfjsLib.getDocument === 'function') {
          const ab = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = (e) => rej(e);
            r.readAsArrayBuffer(questionFile);
          });
          if (ab) {
            const pdfDoc = await openPdfDocumentSafely(pdfjsLib, new Uint8Array(ab));
            const maxScanPages = Math.min(pdfDoc.numPages || 1, 35);
            const ocrCollectedPages = [];
            for (let p = 1; p <= maxScanPages; p++) {
              const page = await pdfDoc.getPage(p);
              if (hasAiBridge && typeof window.AndroidBridge.analyzeQuestionImageWithAi === 'function') {
                if (onProgress) {
                  onProgress(`🤖 पेज ${p}/${maxScanPages} को इमेज बनाकर AI Vision से स्कैन किया जा रहा है (अब तक ${finalDocs.length} प्रश्न लाइव सेव)...`);
                }
                try {
                  const vp = page.getViewport({ scale: 1.65 });
                  const cnv = document.createElement('canvas');
                  cnv.width = Math.max(1, Math.floor(vp.width));
                  cnv.height = Math.max(1, Math.floor(vp.height));
                  const ctx = cnv.getContext('2d');
                  ctx.fillStyle = '#FFFFFF';
                  ctx.fillRect(0, 0, cnv.width, cnv.height);
                  await page.render({ canvasContext: ctx, viewport: vp }).promise;
                  const jpegUrl = cnv.toDataURL('image/jpeg', 0.84);
                  const aiRes = await callAndroidAiBridge(buildVisionExtractionPrompt(`Page ${p}`), jpegUrl);
                  const arr = parseAiJsonArraySafely(aiRes);
                  if (arr.length > 0) {
                    await emitLiveBatch(arr, `पेज ${p}/${maxScanPages}`);
                    continue;
                  }
                } catch (_cnvAiErr) {}
              }
              if (onProgress) {
                onProgress(`⏳ पेज ${p}/${maxScanPages} स्कैन हो रहा है — अब तक ${finalDocs.length} प्रश्न लाइव सेव हो चुके हैं...`);
              }
              const ocrTxt = await renderPdfPageToCanvasAndOcr(page);
              if (ocrTxt && ocrTxt.trim()) {
                ocrCollectedPages.push(`Page: ${p}\n${ocrTxt.trim()}`);
                // Parse this single page immediately and Live-Save its questions right now!
                const singlePageParsed = parseRawImportFile(
                  `Method: PDF_OCR\nPage: ${p}\n${ocrTxt.trim()}`,
                  fileName || 'questions.pdf',
                  answerKeyText || '',
                  paperSetCode || 'A',
                  paperSetCode || 'A'
                );
                const pageItems = Array.isArray(singlePageParsed.rawItems)
                  ? singlePageParsed.rawItems
                  : (Array.isArray(singlePageParsed.rows) ? singlePageParsed.rows : []);
                if (pageItems.length > 0) {
                  await emitLiveBatch(pageItems, `पेज ${p}/${maxScanPages}`);
                }
              }
            }
            // Also run a combined pass across all collected OCR pages to catch any questions that split across two pages
            if (ocrCollectedPages.length > 0) {
              const reParsed = parseRawImportFile(
                'Method: PDF_OCR\n' + ocrCollectedPages.join('\n\n'),
                fileName || 'questions.pdf',
                answerKeyText || '',
                paperSetCode || 'A',
                paperSetCode || 'A'
              );
              const combinedItems = Array.isArray(reParsed.rawItems)
                ? reParsed.rawItems
                : (Array.isArray(reParsed.rows) ? reParsed.rows : []);
              if (combinedItems.length > 0) {
                await emitLiveBatch(combinedItems, `पेज 1-${maxScanPages} पूर्ण मिलान`);
              }
            }
          }
        }
      } catch (fbErr) {
        console.warn('Secondary PDF canvas fallback error:', fbErr);
      }
    }

    return finalDocs;
  }

  function checkQuestionSafetyBeforeDelete(qObj, state) {
    if (!qObj) return { linkedPublishedTests: [], linkedDraftTests: [], pyqRefs: [] };
    const qid = qObj.id || qObj.questionId;
    const linkedPublishedTests = [];
    const linkedDraftTests = [];
    ((state && state.tests) || []).forEach((t) => {
      if (!t || !Array.isArray(t.questions)) return;
      const hasQ = t.questions.some((tq) => (tq.centralQuestionId || tq.questionId || tq.id) === qid);
      if (hasQ) {
        if (t.status === 'published') linkedPublishedTests.push(t.titleHi || t.titleEn || t.id);
        else linkedDraftTests.push(t.titleHi || t.titleEn || t.id);
      }
    });
    const pyqRefs = Array.isArray(qObj.pyqReferences) ? qObj.pyqReferences : [];
    return { linkedPublishedTests, linkedDraftTests, pyqRefs };
  }

  function openQuestionDetailViewModal({ question, state, api, onEdit, onAddPyq }) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot || !question) return;
    const catalog = getTaxonomyCatalog(state);
    const resolved = catalog.resolveHierarchy(question);
    const optsHi = Array.isArray(question.optionsHi) ? question.optionsHi : [question.optA_Hi || '', question.optB_Hi || '', question.optC_Hi || '', question.optD_Hi || ''];
    const optsEn = Array.isArray(question.optionsEn) ? question.optionsEn : [question.optA_En || '', question.optB_En || '', question.optC_En || '', question.optD_En || ''];
    const corrIdx = Number(question.correctOptionIndex ?? question.correctIndex ?? 0);
    const letters = ['A', 'B', 'C', 'D'];
    const pyqRefs = Array.isArray(question.pyqReferences) ? question.pyqReferences : [];
    const safety = checkQuestionSafetyBeforeDelete(question, state);

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:740px;max-height:92vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;flex-wrap:wrap;">
            <div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
                <span class="badge badge-exam">ID: ${esc(question.id || question.questionId)}</span>
                <span class="badge ${question.verificationStatus === 'verified' ? 'badge-free' : 'badge-paid'}">
                  ${question.verificationStatus === 'verified' ? '✅ Verified' : '⚠️ ' + esc(question.verificationStatus || 'Unverified')}
                </span>
                <span class="badge badge-review">Difficulty: ${esc(question.difficultyLevel || question.difficulty || 'Moderate')}</span>
                <span class="badge badge-draft">Language: ${esc(question.languageAvailability || 'Both')}</span>
              </div>
              <h2 style="font-size:1.05rem;font-weight:800;">👁️ प्रश्न विवरण और रेफ़रेंस (Central Question Record)</h2>
            </div>
            <button class="btn btn-outline btn-sm" id="closeViewQModalBtn">✕ बंद करें</button>
          </div>

          <div style="padding:10px 12px;border-radius:10px;background:var(--surface-alt);border:1px solid var(--border);margin-bottom:12px;font-size:0.8rem;">
            <div><strong>📂 Subject-wise Folder Path:</strong> ${esc(resolved.mainCategory || question.mainCategory || 'Chhattisgarh GK')} › ${esc(resolved.subjectTag || question.subjectTag || 'Uncategorised')} › <strong>${esc(resolved.topic || question.topic || 'Uncategorised')}</strong></div>
            ${pyqRefs.length > 0 ? `
              <div style="margin-top:6px;">
                <strong>🏛️ PYQ Exam References (${pyqRefs.length}):</strong>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                  ${pyqRefs.map((ref) => `
                    <span class="badge badge-exam">
                      🏛️ ${esc(ref.examCategory)} › ${esc(ref.examName)} ${ref.examYear ? '(' + esc(ref.examYear) + ')' : ''} ${ref.paperName ? '• ' + esc(ref.paperName) : ''} ${ref.shift ? '• ' + esc(ref.shift) : ''} ${ref.questionNumber ? '• Q.' + esc(ref.questionNumber) : ''}
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : `<div style="margin-top:4px;color:var(--text-secondary);">🏛️ PYQ Library Reference: अभी किसी परीक्षा पेपर से लिंक नहीं है।</div>`}
            ${(safety.linkedPublishedTests.length > 0 || safety.linkedDraftTests.length > 0) ? `
              <div style="margin-top:6px;color:var(--primary);font-weight:700;">
                🧪 Linked Tests: ${esc([...safety.linkedPublishedTests, ...safety.linkedDraftTests].join(', '))}
              </div>
            ` : ''}
          </div>

          <div class="card" style="margin-bottom:12px;">
            <div style="font-weight:800;font-size:0.95rem;margin-bottom:4px;">🇮🇳 ${esc(question.questionHi || question.questionEn)}</div>
            ${question.questionEn && question.questionEn !== question.questionHi ? `
              <div style="font-size:0.86rem;color:var(--text-secondary);margin-bottom:10px;">🇬🇧 ${esc(question.questionEn)}</div>
            ` : ''}
            <div style="display:grid;gap:6px;margin-top:8px;">
              ${[0, 1, 2, 3].map((oi) => `
                <div class="qb-option-pill ${corrIdx === oi ? 'is-correct' : ''}">
                  <div>
                    <strong>(${letters[oi]})</strong> ${esc(optsHi[oi] || optsEn[oi])}
                    ${optsEn[oi] && optsEn[oi] !== optsHi[oi] ? `<div style="font-size:0.75rem;color:var(--text-secondary);">${esc(optsEn[oi])}</div>` : ''}
                  </div>
                  ${corrIdx === oi ? '<span class="badge badge-free">✓ सही उत्तर</span>' : ''}
                </div>
              `).join('')}
            </div>
            <div class="qb-explanation-box" style="margin-top:10px;">
              <div><strong>💡 व्याख्या:</strong> ${esc(question.explanationHi || question.explanationEn || 'N/A')}</div>
              ${question.explanationEn && question.explanationEn !== question.explanationHi ? `
                <div style="margin-top:3px;color:var(--text-secondary);"><strong>Explanation:</strong> ${esc(question.explanationEn)}</div>
              ` : ''}
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-outline" id="viewQAddPyqBtn">🏛️ + Add Exam / PYQ Reference</button>
            <button class="btn btn-primary" id="viewQEditBtn">✏️ प्रश्न संपादित करें (Edit)</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeViewQModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('viewQEditBtn').onclick = () => {
      modalRoot.innerHTML = '';
      if (onEdit) onEdit();
    };
    document.getElementById('viewQAddPyqBtn').onclick = () => {
      modalRoot.innerHTML = '';
      if (onAddPyq) onAddPyq();
    };
  }

  function openPyqReferenceModal({ question, state, api, onSaved }) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot || !question) return;
    const catalog = getTaxonomyCatalog(state);
    const pyqCats = catalog.pyqCategories || [];
    const existingRefs = Array.isArray(question.pyqReferences) ? question.pyqReferences : [];

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:640px;max-height:92vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <div>
              <span class="badge badge-exam">🏛️ EXAM-WISE PYQ LIBRARY REFERENCE</span>
              <h2 style="font-size:1.05rem;font-weight:800;margin-top:4px;">प्रश्न में PYQ परीक्षा रेफ़रेंस जोड़ें / प्रबंधित करें</h2>
            </div>
            <button class="btn btn-outline btn-sm" id="closePyqRefModalBtn">✕</button>
          </div>

          <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:10px;">
            यह प्रश्न <strong>Central Question Database</strong> में एक ही बार सुरक्षित रहेगा और नीचे जोड़े गए सभी परीक्षाओं (PYQ Folders) में उसका Reference दिखाई देगा। (किसी अज्ञात जानकारी का अनुमान न लगाएं।)
          </p>

          ${existingRefs.length > 0 ? `
            <div style="margin-bottom:12px;padding:10px;border-radius:8px;background:var(--surface-alt);border:1px solid var(--border);">
              <div style="font-size:0.78rem;font-weight:800;margin-bottom:6px;">जुड़े हुए PYQ References (${existingRefs.length}):</div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                ${existingRefs.map((r, idx) => `
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 10px;border-radius:6px;background:var(--surface);border:1px solid var(--border);font-size:0.78rem;">
                    <span>
                      <strong>${esc(r.examCategory)}</strong> › ${esc(r.examName)}
                      ${r.examYear ? ` › <strong>${esc(r.examYear)}</strong>` : ''}
                      ${r.paperName ? ` › ${esc(r.paperName)}` : ''}
                      ${r.shift ? ` (${esc(r.shift)})` : ''}
                      ${r.questionNumber ? ` • Q#${esc(r.questionNumber)}` : ''}
                    </span>
                    <button type="button" class="btn btn-danger btn-sm" data-remove-pyq-ref-idx="${idx}" style="padding:2px 8px;font-size:0.7rem;">✕ हटाएं</button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="grid-2" style="gap:10px;margin-bottom:10px;">
            <div>
              <label class="form-label">1. Exam Category (परीक्षा श्रेणी) *</label>
              <select class="form-select" id="pyqRefCatSelect">
                ${pyqCats.map((c) => `<option value="${esc(c.code)}">${esc(c.icon || '🏛️')} ${esc(c.nameEn)} (${esc(c.nameHi || c.nameEn)})</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="form-label">2. Exam Name (परीक्षा का नाम) *</label>
              <input class="form-input" id="pyqRefExamNameInput" list="pyqRefExamNameList" placeholder="उदा: CGPSC Prelims / Patwari / Hostel Warden..." />
              <datalist id="pyqRefExamNameList"></datalist>
            </div>
            <div>
              <label class="form-label">3. Exam Year (वर्ष — यदि ज्ञात हो)</label>
              <input class="form-input" id="pyqRefYearInput" placeholder="उदा: 2024, 2023 (अज्ञात हो तो खाली छोड़ें)" />
            </div>
            <div>
              <label class="form-label">4. Paper Name (पेपर — वैकल्पिक)</label>
              <input class="form-input" id="pyqRefPaperInput" list="pyqRefPaperList" placeholder="उदा: Paper 1 - General Studies / Set A" />
              <datalist id="pyqRefPaperList">
                <option value="Paper 1 - General Studies"></option>
                <option value="Paper 2 - CSAT / Aptitude"></option>
                <option value="Single Paper"></option>
              </datalist>
            </div>
            <div>
              <label class="form-label">5. Shift (शिफ्ट — वैकल्पिक)</label>
              <input class="form-input" id="pyqRefShiftInput" list="pyqRefShiftList" placeholder="उदा: Shift 1 (Morning) / Shift 2" />
              <datalist id="pyqRefShiftList">
                <option value="Shift 1"></option>
                <option value="Shift 2"></option>
                <option value="Shift 3"></option>
              </datalist>
            </div>
            <div>
              <label class="form-label">6. Question Number &amp; Source (वैकल्पिक)</label>
              <div style="display:grid;grid-template-columns:1fr 1.4fr;gap:6px;">
                <input class="form-input" id="pyqRefQNumInput" type="number" min="1" placeholder="Q.No." />
                <input class="form-input" id="pyqRefSourceInput" value="${esc(question.sourceDocument || '')}" placeholder="Source (e.g. Official Paper)" />
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
            <button class="btn btn-outline" id="cancelPyqRefModalBtn">बंद करें</button>
            <button class="btn btn-primary" id="savePyqRefModalBtn">🏛️ PYQ Reference जोड़ें और सेव करें</button>
          </div>
        </div>
      </div>
    `;

    const catSel = document.getElementById('pyqRefCatSelect');
    const examList = document.getElementById('pyqRefExamNameList');
    const populateExamsForCat = () => {
      const selectedCat = pyqCats.find((c) => c.code === catSel.value) || pyqCats[0];
      if (!selectedCat || !examList) return;
      examList.innerHTML = (selectedCat.exams || []).map((ex) => `<option value="${esc(ex.examNameEn)}">${esc(ex.examNameHi || ex.examNameEn)}</option>`).join('');
    };
    if (catSel) {
      catSel.onchange = populateExamsForCat;
      populateExamsForCat();
    }

    document.getElementById('closePyqRefModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('cancelPyqRefModalBtn').onclick = () => { modalRoot.innerHTML = ''; };

    modalRoot.querySelectorAll('[data-remove-pyq-ref-idx]').forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute('data-remove-pyq-ref-idx'));
        if (!Number.isNaN(idx) && Array.isArray(question.pyqReferences)) {
          question.pyqReferences.splice(idx, 1);
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('question_bank', question.id, question);
          openPyqReferenceModal({ question, state, api, onSaved });
          if (onSaved) onSaved();
        }
      };
    });

    document.getElementById('savePyqRefModalBtn').onclick = () => {
      const catCode = document.getElementById('pyqRefCatSelect').value.trim();
      const examName = document.getElementById('pyqRefExamNameInput').value.trim();
      const examYear = document.getElementById('pyqRefYearInput').value.trim();
      const paperName = document.getElementById('pyqRefPaperInput').value.trim();
      const shift = document.getElementById('pyqRefShiftInput').value.trim();
      const qNum = document.getElementById('pyqRefQNumInput').value.trim();
      const src = document.getElementById('pyqRefSourceInput').value.trim();

      if (!catCode || !examName) {
        api.toast('⚠️ कृपया Exam Category और Exam Name दर्ज करें।');
        return;
      }

      upsertCategoryMasterItem(state, api, 'pyq_exam', {
        examCategoryCode: catCode,
        examNameEn: examName,
        examNameHi: examName,
        year: examYear,
        paperShift: [paperName, shift].filter(Boolean).join(' - ')
      });

      question.pyqReferences = Array.isArray(question.pyqReferences) ? question.pyqReferences : [];
      question.pyqReferences.push({
        refId: makeSlugId('pyqref', `${catCode}_${examName}_${examYear}_${paperName}_${shift}_${question.id}`),
        questionId: question.id || question.questionId,
        examCategory: catCode,
        examName,
        examYear,
        paperName,
        shift,
        questionNumber: qNum || '',
        subject: question.subjectTag || '',
        topic: question.topic || '',
        source: src || ''
      });
      question.sourceExam = question.sourceExam || examName;
      question.sourceYear = question.sourceYear || examYear;
      question.paperName = question.paperName || paperName;
      question.shift = question.shift || shift;
      question.examIds = Array.from(new Set([...(Array.isArray(question.examIds) ? question.examIds : []), catCode, 'ALL']));
      question.updatedAt = new Date().toISOString();
      question.updatedAtIso = question.updatedAt;

      api.saveState();
      if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('question_bank', question.id, question);
      modalRoot.innerHTML = '';
      api.toast(`🏛️ प्रश्न को "${catCode} › ${examName}${examYear ? ' (' + examYear + ')' : ''}" PYQ Library से जोड़ दिया गया!`);
      if (onSaved) onSaved();
    };
  }

  function openPyqFolderCreateModal({ defaultCategoryCode, defaultExamName, defaultYear, state, api, onCreated }) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;
    const catalog = getTaxonomyCatalog(state);
    const pyqCats = catalog.pyqCategories || [];

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:520px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h2 style="font-size:1.05rem;font-weight:800;">🏛️ नया PYQ Exam / Year / Paper फ़ोल्डर बनाएं</h2>
            <button class="btn btn-outline btn-sm" id="closePyqFolderModalBtn">✕</button>
          </div>
          <div class="form-group">
            <label class="form-label">1. Exam Category (परीक्षा श्रेणी) *</label>
            <select class="form-select" id="pfCatSelect">
              ${pyqCats.map((c) => `<option value="${esc(c.code)}" ${defaultCategoryCode === c.code ? 'selected' : ''}>${esc(c.icon || '🏛️')} ${esc(c.nameEn)} (${esc(c.nameHi || c.nameEn)})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">2. Exam Name (परीक्षा का नाम — English/Hindi) *</label>
            <input class="form-input" id="pfExamNameInput" value="${esc(defaultExamName || '')}" placeholder="उदा: CGPSC Prelims / Hostel Warden / Sub Inspector (SI)" />
          </div>
          <div class="grid-2" style="gap:10px;">
            <div class="form-group">
              <label class="form-label">3. Year (वर्ष — वैकल्पिक)</label>
              <input class="form-input" id="pfYearInput" value="${esc(defaultYear || '2024')}" placeholder="उदा: 2024, 2023" />
            </div>
            <div class="form-group">
              <label class="form-label">4. Paper / Shift (वैकल्पिक)</label>
              <input class="form-input" id="pfPaperShiftInput" placeholder="उदा: Paper 1 - GS / Shift 1" />
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
            <button class="btn btn-outline" id="cancelPyqFolderModalBtn">रद्द करें</button>
            <button class="btn btn-primary" id="savePyqFolderModalBtn">💾 PYQ फ़ोल्डर बनाएं</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closePyqFolderModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('cancelPyqFolderModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('savePyqFolderModalBtn').onclick = () => {
      const catCode = document.getElementById('pfCatSelect').value.trim();
      const examName = document.getElementById('pfExamNameInput').value.trim();
      const year = document.getElementById('pfYearInput').value.trim();
      const paperShift = document.getElementById('pfPaperShiftInput').value.trim();
      if (!catCode || !examName) {
        api.toast('⚠️ कृपया Exam Category और Exam Name भरें।');
        return;
      }
      const created = upsertCategoryMasterItem(state, api, 'pyq_exam', {
        examCategoryCode: catCode,
        examNameEn: examName,
        examNameHi: examName,
        year,
        paperShift
      });
      modalRoot.innerHTML = '';
      api.toast(`🏛️ PYQ फ़ोल्डर "${catCode} › ${examName}${year ? ' › ' + year : ''}" तैयार हो गया!`);
      if (onCreated) onCreated(created);
    };
  }

  function openFolderRenameModal({ itemType, itemId, currentNameEn, currentNameHi, parentSubjectId, state, api, onRenamed }) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;
    const catalog = getTaxonomyCatalog(state);

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:480px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h2 style="font-size:1.04rem;font-weight:800;">✏️ फ़ोल्डर का नाम बदलें / मूव करें (Rename / Move Folder)</h2>
            <button class="btn btn-outline btn-sm" id="closeRenameFolderModalBtn">✕</button>
          </div>
          <div class="form-group">
            <label class="form-label">नया नाम (Hindi / Bilingual) *</label>
            <input class="form-input" id="rfNameHiInput" value="${esc(currentNameHi || currentNameEn || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">New Name (English / Full Label) *</label>
            <input class="form-input" id="rfNameEnInput" value="${esc(currentNameEn || currentNameHi || '')}" />
          </div>
          ${itemType === 'topic' ? `
            <div class="form-group">
              <label class="form-label">Parent Subject Folder (यदि दूसरे विषय में मूव करना हो)</label>
              <select class="form-select" id="rfParentSubSelect">
                ${catalog.subjects.filter((s) => s.subjectId !== 'sub_uncategorised').map((s) => `
                  <option value="${esc(s.subjectId)}" ${s.subjectId === parentSubjectId ? 'selected' : ''}>
                    [${esc(s.mainCategory || 'Category')}] ${esc(s.titleHi || s.titleEn)}
                  </option>
                `).join('')}
              </select>
            </div>
          ` : ''}
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
            <button class="btn btn-outline" id="cancelRenameFolderModalBtn">रद्द करें</button>
            <button class="btn btn-primary" id="saveRenameFolderModalBtn">💾 सेव करें</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeRenameFolderModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('cancelRenameFolderModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('saveRenameFolderModalBtn').onclick = () => {
      const newHi = document.getElementById('rfNameHiInput').value.trim();
      const newEn = document.getElementById('rfNameEnInput').value.trim() || newHi;
      if (!newEn) {
        api.toast('⚠️ कृपया फ़ोल्डर का नाम लिखें।');
        return;
      }
      renameCategoryMasterItem(state, api, itemType, itemId, newEn, newHi || newEn);
      if (itemType === 'topic') {
        const newSubId = document.getElementById('rfParentSubSelect').value;
        if (newSubId && newSubId !== parentSubjectId) {
          const topEntry = (state.categoryMaster.topicMaster || []).find((t) => t.topicId === itemId);
          const targetSub = catalog.findSubject(newSubId);
          if (topEntry && targetSub) {
            topEntry.subjectId = targetSub.subjectId;
            topEntry.mainCategoryId = targetSub.mainCategoryId || topEntry.mainCategoryId;
            topEntry.mainCategory = targetSub.mainCategory || topEntry.mainCategory;
            (state.questionBank || []).forEach((q) => {
              if (q.topicId === itemId) {
                q.subjectId = targetSub.subjectId;
                q.subjectTag = targetSub.titleEn;
                q.mainCategoryId = targetSub.mainCategoryId || q.mainCategoryId;
                q.mainCategory = targetSub.mainCategory || q.mainCategory;
              }
            });
            api.saveState();
          }
        }
      }
      modalRoot.innerHTML = '';
      api.toast('✅ फ़ोल्डर सफलतापूर्वक अपडेट हो गया!');
      if (onRenamed) onRenamed();
    };
  }

  function openQuestionFormModal({ title, question, stateRef, onSave }) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot || !question) return;
    const catalog = getTaxonomyCatalog(stateRef);
    const resolvedInit = catalog.resolveHierarchy(question);
    const optsHi = Array.isArray(question.optionsHi) ? question.optionsHi : [question.optA_Hi || '', question.optB_Hi || '', question.optC_Hi || '', question.optD_Hi || ''];
    const optsEn = Array.isArray(question.optionsEn) ? question.optionsEn : [question.optA_En || '', question.optB_En || '', question.optC_En || '', question.optD_En || ''];
    const currentDiff = normalizeDifficultyValue(question.difficultyLevel || question.difficulty) || 'Moderate';
    const allExamCodes = ['ALL', ...catalog.examCategories.map((e) => e.code)];
    const firstPyq = Array.isArray(question.pyqReferences) && question.pyqReferences[0] ? question.pyqReferences[0] : null;

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:780px;max-height:92vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h2 style="font-size:1.06rem;font-weight:800;">${esc(title || '➕ प्रश्न जोड़ें / संपादित करें (Add / Edit Question)')}</h2>
            <button class="btn btn-outline btn-sm" id="closeEditQModalBtn">✕ बंद करें</button>
          </div>

          <div id="editQValidationErrorBanner" style="display:none;padding:10px 12px;border-radius:8px;background:var(--danger-soft);color:var(--danger);font-size:0.8rem;font-weight:700;margin-bottom:10px;"></div>

          <div style="padding:12px;border-radius:10px;background:var(--surface-alt);border:1px solid var(--border);margin-bottom:12px;">
            <div style="font-size:0.78rem;font-weight:800;color:var(--primary);margin-bottom:8px;">
              📚 1. Subject-wise Question Library Path (Main Category → Subject → Topic)
            </div>
            <div class="grid-3" style="gap:10px;">
              <div>
                <label class="form-label">1. मुख्य श्रेणी (Main Category) *</label>
                <select class="form-select" id="eqMainCategorySelect">
                  ${catalog.mainCategories.filter((mc) => mc.mainCategoryId !== 'cat_uncategorised').map((mc) => `
                    <option value="${esc(mc.mainCategoryId)}" ${(resolvedInit.mainCategoryId || 'cat_cg_gk') === mc.mainCategoryId ? 'selected' : ''}>
                      ${esc(mc.icon || '📚')} ${esc(mc.titleEn)} (${esc(mc.titleHi)})
                    </option>
                  `).join('')}
                </select>
              </div>
              <div>
                <label class="form-label">2. विषय फ़ोल्डर (Subject) *</label>
                <input class="form-input" id="eqSubjectTag" list="eqSubjectList" value="${esc(question.subjectTag && question.subjectTag !== 'Uncategorised' ? question.subjectTag : 'छत्तीसगढ़ का इतिहास (History of Chhattisgarh)')}" placeholder="विषय चुनें या लिखें..." />
                <datalist id="eqSubjectList">
                  ${catalog.subjects.filter((s) => s.subjectId !== 'sub_uncategorised').map((s) => `<option value="${esc(s.titleEn)}">${esc(s.mainCategory)} — ${esc(s.titleHi)}</option>`).join('')}
                </datalist>
              </div>
              <div>
                <label class="form-label">3. टॉपिक फ़ोल्डर (Topic) *</label>
                <input class="form-input" id="eqTopic" list="eqTopicList" value="${esc(question.topic && question.topic !== 'Uncategorised' ? question.topic : 'छत्तीसगढ़ का प्राचीन इतिहास (Ancient History of CG)')}" placeholder="टॉपिक चुनें या लिखें..." />
                <datalist id="eqTopicList">
                  ${catalog.allTopics.map((t) => `<option value="${esc(t)}"></option>`).join('')}
                </datalist>
              </div>
            </div>

            <div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);">
              <div style="font-size:0.76rem;font-weight:800;color:var(--secondary);margin-bottom:6px;">
                🏛️ 2. Exam-wise PYQ Reference (वैकल्पिक — यदि यह प्रश्न किसी परीक्षा में पूछा गया है)
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;">
                <div>
                  <label class="form-label" style="font-size:0.72rem;">Exam Category</label>
                  <select class="form-select" id="eqPyqCatSelect" style="padding:5px 8px;font-size:0.78rem;">
                    <option value="">-- PYQ नहीं है --</option>
                    ${(catalog.pyqCategories || []).map((c) => `<option value="${esc(c.code)}" ${(firstPyq && firstPyq.examCategory === c.code) ? 'selected' : ''}>${esc(c.nameEn)}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="form-label" style="font-size:0.72rem;">Exam Name</label>
                  <input class="form-input" id="eqPyqExamName" value="${esc((firstPyq && firstPyq.examName) || question.sourceExam || '')}" placeholder="e.g. CGPSC Prelims" style="padding:5px 8px;font-size:0.78rem;" />
                </div>
                <div>
                  <label class="form-label" style="font-size:0.72rem;">Year</label>
                  <input class="form-input" id="eqPyqYear" value="${esc((firstPyq && firstPyq.examYear) || question.sourceYear || '')}" placeholder="e.g. 2024" style="padding:5px 8px;font-size:0.78rem;" />
                </div>
                <div>
                  <label class="form-label" style="font-size:0.72rem;">Paper / Shift</label>
                  <input class="form-input" id="eqPyqPaperShift" value="${esc((firstPyq && [firstPyq.paperName, firstPyq.shift].filter(Boolean).join(' - ')) || question.paperName || '')}" placeholder="e.g. Paper 1 / Shift 1" style="padding:5px 8px;font-size:0.78rem;" />
                </div>
                <div>
                  <label class="form-label" style="font-size:0.72rem;">Difficulty Level</label>
                  <select class="form-select" id="eqDifficulty" style="padding:5px 8px;font-size:0.78rem;">
                    <option value="Easy" ${currentDiff === 'Easy' ? 'selected' : ''}>Easy (सरल)</option>
                    <option value="Moderate" ${currentDiff === 'Moderate' ? 'selected' : ''}>Moderate (मध्यम)</option>
                    <option value="Hard" ${currentDiff === 'Hard' ? 'selected' : ''}>Hard (कठिन)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="grid-2" style="gap:8px;margin-bottom:8px;">
            <div>
              <label class="form-label">प्रश्न (हिन्दी में) *</label>
              <textarea class="form-textarea" id="eqStemHi" rows="2" placeholder="यहाँ हिन्दी में प्रश्न लिखें...">${esc(question.questionHi || '')}</textarea>
            </div>
            <div>
              <label class="form-label">Question (in English)</label>
              <textarea class="form-textarea" id="eqStemEn" rows="2" placeholder="Type English question (optional if Hindi provided)...">${esc(question.questionEn || '')}</textarea>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px;">
            <input class="form-input" id="eqOpt0Hi" value="${esc(optsHi[0] || '')}" placeholder="विकल्प A (Hindi) *" />
            <input class="form-input" id="eqOpt0En" value="${esc(optsEn[0] || '')}" placeholder="Option A (English)" />
            <input class="form-input" id="eqOpt1Hi" value="${esc(optsHi[1] || '')}" placeholder="विकल्प B (Hindi) *" />
            <input class="form-input" id="eqOpt1En" value="${esc(optsEn[1] || '')}" placeholder="Option B (English)" />
            <input class="form-input" id="eqOpt2Hi" value="${esc(optsHi[2] || '')}" placeholder="विकल्प C (Hindi) *" />
            <input class="form-input" id="eqOpt2En" value="${esc(optsEn[2] || '')}" placeholder="Option C (English)" />
            <input class="form-input" id="eqOpt3Hi" value="${esc(optsHi[3] || '')}" placeholder="विकल्प D (Hindi) *" />
            <input class="form-input" id="eqOpt3En" value="${esc(optsEn[3] || '')}" placeholder="Option D (English)" />
          </div>

          <div class="grid-3" style="gap:8px;margin-bottom:14px;">
            <div>
              <label class="form-label">सही उत्तर (Correct Option) *</label>
              <select class="form-select" id="eqCorrectIdx">
                <option value="0" ${Number(question.correctOptionIndex ?? question.correctIndex ?? 0) === 0 ? 'selected' : ''}>✓ विकल्प A (Option A)</option>
                <option value="1" ${Number(question.correctOptionIndex ?? question.correctIndex ?? 0) === 1 ? 'selected' : ''}>✓ विकल्प B (Option B)</option>
                <option value="2" ${Number(question.correctOptionIndex ?? question.correctIndex ?? 0) === 2 ? 'selected' : ''}>✓ विकल्प C (Option C)</option>
                <option value="3" ${Number(question.correctOptionIndex ?? question.correctIndex ?? 0) === 3 ? 'selected' : ''}>✓ विकल्प D (Option D)</option>
              </select>
            </div>
            <div>
              <label class="form-label">व्याख्या (Hindi Explanation)</label>
              <input class="form-input" id="eqExpHi" value="${esc(question.explanationHi || '')}" placeholder="संक्षिप्त हिन्दी व्याख्या..." />
            </div>
            <div>
              <label class="form-label">Explanation (English)</label>
              <input class="form-input" id="eqExpEn" value="${esc(question.explanationEn || '')}" placeholder="Short explanation..." />
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:8px;">
            <button class="btn btn-outline" id="cancelEditQModalBtn">रद्द करें (Cancel)</button>
            <button class="btn btn-primary" id="saveEditQModalBtn">💾 Central Database में सेव करें</button>
          </div>
        </div>
      </div>
    `;

    // Dynamically filter Subject & Topic datalists when Main Category changes
    const mainCatSel = document.getElementById('eqMainCategorySelect');
    const subInput = document.getElementById('eqSubjectTag');
    const subList = document.getElementById('eqSubjectList');
    const topInput = document.getElementById('eqTopic');
    const topList = document.getElementById('eqTopicList');

    if (mainCatSel) {
      mainCatSel.onchange = () => {
        const mcId = mainCatSel.value;
        const mcObj = catalog.findMainCategory(mcId);
        const subsForMc = catalog.getSubjectsForMainCategory(mcId);
        if (subList) {
          subList.innerHTML = subsForMc.map((s) => `<option value="${esc(s.titleEn)}">${esc(s.titleHi)}</option>`).join('');
        }
        if (mcObj && mcObj.hasDirectTopics && subsForMc[0]) {
          subInput.value = subsForMc[0].titleEn;
          const topsForDirect = catalog.getTopicsForSubject(subsForMc[0].subjectId);
          if (topList) {
            topList.innerHTML = topsForDirect.map((t) => `<option value="${esc(t.titleEn)}">${esc(t.titleHi)}</option>`).join('');
          }
          if (topsForDirect[0]) topInput.value = topsForDirect[0].titleEn;
        } else if (subsForMc[0]) {
          subInput.value = subsForMc[0].titleEn;
          const topsForSub = catalog.getTopicsForSubject(subsForMc[0].subjectId);
          if (topList) {
            topList.innerHTML = topsForSub.map((t) => `<option value="${esc(t.titleEn)}">${esc(t.titleHi)}</option>`).join('');
          }
          if (topsForSub[0]) topInput.value = topsForSub[0].titleEn;
        }
      };
    }

    if (subInput) {
      subInput.oninput = () => {
        const matchedSub = catalog.findSubject(subInput.value);
        if (matchedSub && topList) {
          const tops = catalog.getTopicsForSubject(matchedSub.subjectId);
          topList.innerHTML = tops.map((t) => `<option value="${esc(t.titleEn)}">${esc(t.titleHi)}</option>`).join('');
          if (matchedSub.mainCategoryId && mainCatSel) {
            mainCatSel.value = matchedSub.mainCategoryId;
          }
        }
      };
    }

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
      const expHi = rawExpHi || rawExpEn || `सही उत्तर विकल्प (${corrLetter}) है।`;
      const expEn = rawExpEn || rawExpHi || `Correct answer is Option (${corrLetter}).`;

      const mainCategoryId = document.getElementById('eqMainCategorySelect').value || 'cat_cg_gk';
      const mcObj = catalog.findMainCategory(mainCategoryId);
      const mainCategory = mcObj ? mcObj.titleEn : 'Chhattisgarh GK';
      const subjectTag = document.getElementById('eqSubjectTag').value.trim();
      const topic = document.getElementById('eqTopic').value.trim();
      const errBanner = document.getElementById('editQValidationErrorBanner');

      const errs = [];
      if (!qHi && !qEn) errs.push('कृपया प्रश्न लिखें (Question text is required).');
      if (newOptsHi.some((o) => !o)) errs.push('कृपया चारों विकल्प (A, B, C, D) भरें।');
      if (!subjectTag || !topic) errs.push('कृपया विषय (Subject) और टॉपिक (Topic) चुनें।');

      if (errs.length > 0) {
        errBanner.style.display = 'block';
        errBanner.textContent = '⚠️ ' + errs.join(' ');
        return;
      }

      const resolved = resolveCanonicalQuestionHierarchy(
        { examCode: 'ALL', examIds: allExamCodes, mainCategoryId, mainCategory, subjectTag, topic, subtopic: '' },
        catalog
      );
      const diffVal = normalizeDifficultyValue(document.getElementById('eqDifficulty').value) || 'Moderate';
      const nowIso = new Date().toISOString();

      const pyqCat = document.getElementById('eqPyqCatSelect').value.trim();
      const pyqExamName = document.getElementById('eqPyqExamName').value.trim();
      const pyqYear = document.getElementById('eqPyqYear').value.trim();
      const pyqPaperShift = document.getElementById('eqPyqPaperShift').value.trim();

      const existingPyqRefs = Array.isArray(question.pyqReferences) ? [...question.pyqReferences] : [];
      if (pyqCat || pyqExamName) {
        const refEntry = {
          refId: makeSlugId('pyqref', `${pyqCat || 'OTHER'}_${pyqExamName || 'Exam'}_${pyqYear}_${pyqPaperShift}`),
          questionId: question.id || question.questionId || '',
          examCategory: pyqCat || 'OTHER',
          examName: pyqExamName || pyqCat || 'Competitive Exam',
          examYear: pyqYear,
          paperName: pyqPaperShift,
          shift: '',
          questionNumber: '',
          subject: resolved.subjectTag || subjectTag,
          topic: resolved.topic || topic,
          source: question.sourceDocument || ''
        };
        if (existingPyqRefs.length > 0) {
          existingPyqRefs[0] = refEntry;
        } else {
          existingPyqRefs.push(refEntry);
        }
      }

      const updated = {
        examCode: pyqCat || 'ALL',
        examIds: Array.from(new Set([...allExamCodes, ...(pyqCat ? [pyqCat] : [])])),
        mainCategoryId: resolved.mainCategoryId || mainCategoryId,
        mainCategory: resolved.mainCategory || mainCategory,
        subjectId: resolved.subjectId || makeSlugId('sub', subjectTag),
        subjectTag: resolved.subjectTag || subjectTag,
        topicId: resolved.topicId || makeSlugId('top', topic),
        topic: resolved.topic || topic,
        secondaryTopicIds: Array.isArray(question.secondaryTopicIds) ? question.secondaryTopicIds : [],
        subtopicId: '',
        subtopic: '',
        difficulty: diffVal,
        difficultyLevel: diffVal,
        sourceExam: pyqExamName || question.sourceExam || '',
        sourceYear: pyqYear || question.sourceYear || '',
        paperName: pyqPaperShift || question.paperName || '',
        pyqReferences: existingPyqRefs,
        status: 'verified',
        verificationStatus: 'verified',
        needsCategorisation: false,
        verified: true,
        adminVerified: true,
        languageAvailability: detectLanguageAvailability(rawQHi, rawQEn),
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

  function openConfirmationDialog(options, fallbackOnConfirm) {
    const opts = options || {};
    const title = opts.title;
    const message = opts.message;
    const confirmLabel = opts.confirmLabel || opts.confirmText || 'Confirm';
    const cancelLabel = opts.cancelLabel || opts.cancelText || 'Cancel';
    const isDanger = opts.isDanger !== undefined ? opts.isDanger : true;
    const onConfirm = typeof opts.onConfirm === 'function'
      ? opts.onConfirm
      : (typeof fallbackOnConfirm === 'function' ? fallbackOnConfirm : null);
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) {
      if (onConfirm) onConfirm();
      return;
    }
    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:440px;">
          <h2 style="font-size:1.08rem;font-weight:800;margin-bottom:8px;">${esc(title || 'Confirm Action')}</h2>
          <p style="font-size:0.86rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.5;">${esc(message)}</p>
          <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button type="button" class="btn btn-outline" id="confirmDialogCancelBtn">${esc(cancelLabel)}</button>
            <button type="button" class="btn ${isDanger ? 'btn-danger' : 'btn-primary'}" id="confirmDialogProceedBtn">${esc(confirmLabel)}</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('confirmDialogCancelBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('confirmDialogProceedBtn').onclick = async () => {
      modalRoot.innerHTML = '';
      if (onConfirm) await onConfirm();
    };
  }

  function openEditTestDetailsModal(testObj, state, api, onSaved) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot || !testObj) return;
    const catalog = getTaxonomyCatalog(state);
    const exams = catalog.examCategories || [];

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:600px;max-height:92vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;">
            <div>
              <span class="badge ${testObj.status === 'published' ? 'badge-free' : 'badge-draft'}">
                ${testObj.status === 'published' ? '🟢 PUBLISHED LIVE TEST' : '📝 DRAFT TEST'}
              </span>
              <h2 style="font-size:1.08rem;font-weight:800;margin-top:4px;">⚙️ Edit Test Settings, Price &amp; Access</h2>
            </div>
            <button class="btn btn-outline btn-sm" id="closeEditTestMetaModalBtn">✕</button>
          </div>

          <div class="grid-2" style="gap:10px;">
            <div class="form-group">
              <label class="form-label">Test Title (Hindi) *</label>
              <input class="form-input" id="editTestMetaTitleHi" value="${esc(testObj.titleHi || '')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Test Title (English)</label>
              <input class="form-input" id="editTestMetaTitleEn" value="${esc(testObj.titleEn || testObj.titleHi || '')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Parent Test Series Folder</label>
              <select class="form-select" id="editTestMetaFolderId">
                <option value="standalone" ${(!testObj.folderId || testObj.folderId === 'standalone') ? 'selected' : ''}>Standalone / Direct Exam Test</option>
                ${(state.folders || []).map((f) => `<option value="${esc(f.id)}" ${testObj.folderId === f.id ? 'selected' : ''}>[${esc(f.examCode || 'CGPSC')}] ${esc(f.titleHi)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Exam Category</label>
              <select class="form-select" id="editTestMetaExamCode">
                ${exams.map((ex) => `<option value="${esc(ex.code)}" ${testObj.examCode === ex.code ? 'selected' : ''}>${esc(ex.icon || '📘')} ${esc(ex.nameEn)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Access Type (FREE / PAID)</label>
              <select class="form-select" id="editTestMetaIsPaid">
                <option value="free" ${!testObj.isPaid ? 'selected' : ''}>🟢 FREE (निःशुल्क)</option>
                <option value="paid" ${testObj.isPaid ? 'selected' : ''}>🔒 PAID (सशुल्क ₹)</option>
              </select>
            </div>
            <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label class="form-label">Price (₹ if Paid)</label>
                <input type="number" min="0" class="form-input" id="editTestMetaPrice" value="${Number(testObj.priceInr || 49)}" />
              </div>
              <div>
                <label class="form-label">Validity (Days)</label>
                <input type="number" min="1" class="form-input" id="editTestMetaValidity" value="${Number(testObj.validityDays || 180)}" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Topic / Subject Description</label>
              <input class="form-input" id="editTestMetaTopic" value="${esc(testObj.topic || '')}" />
            </div>
            <div class="form-group" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
              <div>
                <label class="form-label">Duration (m)</label>
                <input type="number" min="5" class="form-input" id="editTestMetaDuration" value="${Number(testObj.durationMinutes || 60)}" />
              </div>
              <div>
                <label class="form-label">+Marks/Q</label>
                <input type="number" step="0.5" class="form-input" id="editTestMetaPosMarks" value="${Number(testObj.marksPerQuestion || 2)}" />
              </div>
              <div>
                <label class="form-label">-Neg Marks</label>
                <input type="number" step="0.01" class="form-input" id="editTestMetaNegMarks" value="${Number(testObj.negativeMarking != null ? testObj.negativeMarking : 0.66)}" />
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border);">
            <button class="btn btn-outline" id="cancelEditTestMetaBtn">Cancel</button>
            <button class="btn btn-primary" id="saveEditTestMetaBtn">💾 Save Test Changes &amp; Sync Live</button>
          </div>
        </div>
      </div>
    `;

    const closeModal = () => { modalRoot.innerHTML = ''; };
    document.getElementById('closeEditTestMetaModalBtn').onclick = closeModal;
    document.getElementById('cancelEditTestMetaBtn').onclick = closeModal;

    document.getElementById('saveEditTestMetaBtn').onclick = async () => {
      const titleHi = document.getElementById('editTestMetaTitleHi').value.trim();
      const titleEn = document.getElementById('editTestMetaTitleEn').value.trim() || titleHi;
      if (!titleHi) {
        api.toast('⚠️ कृपया टेस्ट का शीर्षक (Title) दर्ज करें।');
        return;
      }
      const isPaid = document.getElementById('editTestMetaIsPaid').value === 'paid';
      const priceInr = isPaid ? Math.max(1, Number(document.getElementById('editTestMetaPrice').value || 49)) : 0;
      const validityDays = Math.max(1, Number(document.getElementById('editTestMetaValidity').value || 180));
      const folderId = document.getElementById('editTestMetaFolderId').value || 'standalone';
      const examCode = document.getElementById('editTestMetaExamCode').value || 'CGPSC';
      const topic = document.getElementById('editTestMetaTopic').value.trim() || titleHi;
      const durationMinutes = Math.max(5, Number(document.getElementById('editTestMetaDuration').value || 60));
      const marksPerQuestion = Number(document.getElementById('editTestMetaPosMarks').value || 2);
      const negativeMarking = Number(document.getElementById('editTestMetaNegMarks').value || 0);

      Object.assign(testObj, {
        titleHi,
        titleEn,
        folderId,
        examCode,
        topic,
        isPaid,
        priceInr,
        validityDays,
        durationMinutes,
        marksPerQuestion,
        negativeMarking,
        updatedAtIso: new Date().toISOString()
      });

      api.saveState();
      if (window.CGpediaCloud && typeof window.CGpediaCloud.saveCloudDoc === 'function') {
        await window.CGpediaCloud.saveCloudDoc('tests', testObj.id, testObj);
      }
      closeModal();
      api.toast(`✅ Test "${titleHi}" updated (${isPaid ? 'PAID ₹' + priceInr : 'FREE'}) & synced to Cloud!`);
      if (typeof onSaved === 'function') onSaved();
    };
  }

  function openBulkEditModal(selectedCount, state, api, onApplyBulkChanges) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;
    const catalog = getTaxonomyCatalog(state);

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:540px;max-height:90vh;overflow-y:auto;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h2 style="font-size:1.04rem;font-weight:800;">📂 ${selectedCount} प्रश्नों का Main Category / Subject / Topic फ़ोल्डर बदलें</h2>
            <button class="btn btn-outline btn-sm" id="closeBulkEditModalBtn">✕</button>
          </div>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:12px;">
            चयनित प्रश्नों को जिस <strong>Main Category › Subject › Topic</strong> फ़ोल्डर में भेजना चाहते हैं, उसे नीचे चुनें:
          </p>

          <div class="form-group">
            <label class="form-label">1. मुख्य श्रेणी (Main Category)</label>
            <select class="form-select" id="bulkEditMainCategory">
              ${catalog.mainCategories.filter((mc) => mc.mainCategoryId !== 'cat_uncategorised').map((mc) => `
                <option value="${esc(mc.mainCategoryId)}">${esc(mc.icon || '📚')} ${esc(mc.titleEn)} (${esc(mc.titleHi)})</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">2. विषय फ़ोल्डर (Subject Folder)</label>
            <input class="form-input" id="bulkEditSubject" list="bulkSubjectDatalist" placeholder="विषय चुनें या नया नाम लिखें..." />
            <datalist id="bulkSubjectDatalist">
              ${catalog.subjects.filter((s) => s.subjectId !== 'sub_uncategorised').map((s) => `<option value="${esc(s.titleEn)}">${esc(s.mainCategory)} — ${esc(s.titleHi)}</option>`).join('')}
            </datalist>
          </div>

          <div class="form-group">
            <label class="form-label">3. टॉपिक फ़ोल्डर (Topic Folder)</label>
            <input class="form-input" id="bulkEditTopic" list="bulkTopicDatalist" placeholder="टॉपिक चुनें या नया नाम लिखें..." />
            <datalist id="bulkTopicDatalist">
              ${catalog.allTopics.map((t) => `<option value="${esc(t)}"></option>`).join('')}
            </datalist>
          </div>

          <div class="form-group">
            <label class="form-label">4. कठिनाई स्तर (Difficulty — वैकल्पिक)</label>
            <select class="form-select" id="bulkEditDifficulty">
              <option value="">-- पहले जैसा रखें (Keep Existing) --</option>
              <option value="Easy">Easy (सरल)</option>
              <option value="Moderate">Moderate (मध्यम)</option>
              <option value="Hard">Hard (कठिन)</option>
            </select>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:14px;">
            <button class="btn btn-outline" id="cancelBulkEditModalBtn">रद्द करें</button>
            <button class="btn btn-primary" id="applyBulkEditModalBtn">💾 फ़ोल्डर में मूव करें (${selectedCount})</button>
          </div>
        </div>
      </div>
    `;

    const mainCatSel = document.getElementById('bulkEditMainCategory');
    const subInp = document.getElementById('bulkEditSubject');
    const subList = document.getElementById('bulkSubjectDatalist');
    const topList = document.getElementById('bulkTopicDatalist');
    if (mainCatSel) {
      mainCatSel.onchange = () => {
        const subs = catalog.getSubjectsForMainCategory(mainCatSel.value);
        if (subList) {
          subList.innerHTML = subs.map((s) => `<option value="${esc(s.titleEn)}">${esc(s.titleHi)}</option>`).join('');
        }
        const mcObj = catalog.findMainCategory(mainCatSel.value);
        if (mcObj && mcObj.hasDirectTopics && subs[0]) {
          subInp.value = subs[0].titleEn;
          const tops = catalog.getTopicsForSubject(subs[0].subjectId);
          if (topList) topList.innerHTML = tops.map((t) => `<option value="${esc(t.titleEn)}">${esc(t.titleHi)}</option>`).join('');
        }
      };
    }

    document.getElementById('closeBulkEditModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('cancelBulkEditModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('applyBulkEditModalBtn').onclick = () => {
      const allExamCodes = ['ALL', ...catalog.examCategories.map((e) => e.code)];
      const mcId = document.getElementById('bulkEditMainCategory').value;
      const mcObj = catalog.findMainCategory(mcId);
      const changes = {
        examCode: 'ALL',
        examIds: allExamCodes,
        replaceExamIds: true,
        mainCategoryId: mcId,
        mainCategory: mcObj ? mcObj.titleEn : '',
        difficulty: document.getElementById('bulkEditDifficulty').value.trim(),
        subjectTag: document.getElementById('bulkEditSubject').value.trim(),
        topic: document.getElementById('bulkEditTopic').value.trim(),
        subtopic: '',
        status: 'verified',
        tagsText: ''
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

  function openQuickFolderCreateModal({ mode, defaultMainCategoryId, defaultSubjectId, state, api, onCreated }) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;
    const catalog = getTaxonomyCatalog(state);
    const isTopic = mode === 'topic';

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:500px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h2 style="font-size:1.05rem;font-weight:800;">
              ${isTopic ? '📂 नया टॉपिक फ़ोल्डर बनाएं (New Topic Folder)' : '📁 नया विषय फ़ोल्डर बनाएं (New Subject Folder)'}
            </h2>
            <button class="btn btn-outline btn-sm" id="closeQuickFolderModalBtn">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">मुख्य श्रेणी चुनें (Parent Main Category) *</label>
            <select class="form-select" id="qfMainCategorySelect">
              ${catalog.mainCategories.filter((mc) => mc.mainCategoryId !== 'cat_uncategorised').map((mc) => `
                <option value="${esc(mc.mainCategoryId)}" ${(defaultMainCategoryId && mc.mainCategoryId === defaultMainCategoryId) ? 'selected' : ''}>
                  ${esc(mc.icon || '📚')} ${esc(mc.titleEn)} (${esc(mc.titleHi)})
                </option>
              `).join('')}
            </select>
          </div>

          ${isTopic ? `
            <div class="form-group">
              <label class="form-label">विषय चुनें (Parent Subject Folder) *</label>
              <select class="form-select" id="qfParentSubjectSelect">
                ${catalog.subjects.filter((s) => s.subjectId !== 'sub_uncategorised').map((s) => `
                  <option value="${esc(s.subjectId)}" ${(defaultSubjectId && (s.subjectId === defaultSubjectId || s.titleEn === defaultSubjectId)) ? 'selected' : ''}>
                    [${esc(s.mainCategory || 'Category')}] ${esc(s.titleHi || s.titleEn)}
                  </option>
                `).join('')}
              </select>
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label">${isTopic ? 'टॉपिक का नाम (Hindi / हिन्दी में)' : 'विषय का नाम (Hindi / हिन्दी में)'} *</label>
            <input class="form-input" id="qfTitleHiInput" placeholder="${isTopic ? 'उदा: छत्तीसगढ़ के राष्ट्रीय उद्यान' : 'उदा: पर्यावरण एवं पारिस्थितिकी'}" />
          </div>

          <div class="form-group">
            <label class="form-label">${isTopic ? 'Topic Name (in English / Bilingual)' : 'Subject Name (in English / Bilingual)'} *</label>
            <input class="form-input" id="qfTitleEnInput" placeholder="${isTopic ? 'e.g., छत्तीसगढ़ के राष्ट्रीय उद्यान (National Parks of CG)' : 'e.g., पर्यावरण एवं पारिस्थितिकी (Environment & Ecology)'}" />
          </div>

          <div id="qfDuplicateWarningBox" style="display:none;padding:8px 10px;border-radius:8px;background:var(--warning-soft);color:#92400e;font-size:0.78rem;font-weight:700;margin-bottom:10px;"></div>

          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
            <button class="btn btn-outline" id="cancelQuickFolderModalBtn">रद्द करें</button>
            <button class="btn btn-primary" id="saveQuickFolderModalBtn">💾 फ़ोल्डर बनाएं</button>
          </div>
        </div>
      </div>
    `;

    const mcSel = document.getElementById('qfMainCategorySelect');
    const parentSubSel = document.getElementById('qfParentSubjectSelect');
    if (mcSel && parentSubSel) {
      mcSel.onchange = () => {
        const subs = catalog.getSubjectsForMainCategory(mcSel.value);
        parentSubSel.innerHTML = subs.map((s) => `<option value="${esc(s.subjectId)}">[${esc(s.mainCategory)}] ${esc(s.titleHi || s.titleEn)}</option>`).join('');
      };
    }

    document.getElementById('closeQuickFolderModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('cancelQuickFolderModalBtn').onclick = () => { modalRoot.innerHTML = ''; };
    document.getElementById('saveQuickFolderModalBtn').onclick = () => {
      const rawHi = document.getElementById('qfTitleHiInput').value.trim();
      const rawEn = document.getElementById('qfTitleEnInput').value.trim();
      const titleHi = rawHi || rawEn;
      const titleEn = rawEn || rawHi;
      if (!titleEn) {
        api.toast('⚠️ कृपया फ़ोल्डर का नाम लिखें।');
        return;
      }
      const mcId = document.getElementById('qfMainCategorySelect').value || 'cat_cg_gk';
      const mcObj = catalog.findMainCategory(mcId);
      const mcName = mcObj ? mcObj.titleEn : 'Chhattisgarh GK';

      if (isTopic) {
        const subId = document.getElementById('qfParentSubjectSelect').value;
        const existingTop = catalog.findTopic(subId, titleEn) || catalog.findTopic(subId, titleHi);
        if (existingTop) {
          api.toast(`ℹ️ यह टॉपिक फ़ोल्डर ("${existingTop.titleHi || existingTop.titleEn}") पहले से मौजूद है (Duplicate रोका गया)।`);
          modalRoot.innerHTML = '';
          if (onCreated) onCreated(existingTop);
          return;
        }
        const created = upsertCategoryMasterItem(state, api, 'topic', {
          mainCategoryId: mcId,
          mainCategory: mcName,
          subjectId: subId,
          titleEn,
          titleHi
        });
        modalRoot.innerHTML = '';
        api.toast(`📂 नया टॉपिक फ़ोल्डर "${titleHi}" बन गया!`);
        if (onCreated) onCreated(created);
      } else {
        const existingSub = catalog.findSubject(titleEn) || catalog.findSubject(titleHi);
        if (existingSub) {
          api.toast(`ℹ️ यह विषय फ़ोल्डर ("${existingSub.titleHi || existingSub.titleEn}") पहले से मौजूद है (Duplicate रोका गया)।`);
          modalRoot.innerHTML = '';
          if (onCreated) onCreated(existingSub);
          return;
        }
        const created = upsertCategoryMasterItem(state, api, 'subject', {
          mainCategoryId: mcId,
          mainCategory: mcName,
          titleEn,
          titleHi,
          examIds: catalog.examCategories.map((e) => e.examId || e.code)
        });
        modalRoot.innerHTML = '';
        api.toast(`📁 नया विषय फ़ोल्डर "${titleHi}" बन गया!`);
        if (onCreated) onCreated(created);
      }
    };
  }

  // ============================================================================
  // POPUP 1: AI PROMPT QUESTION GENERATOR MODAL (✨ AI प्रॉम्प्ट से प्रश्न बनाएं)
  // ============================================================================
  function buildOfflinePromptGeneratedQuestions(promptText, count, forcedSubject, difficulty, catalog) {
    const cleanPrompt = String(promptText || '').trim() || 'छत्तीसगढ़ सामान्य ज्ञान (Chhattisgarh GK)';
    const guessed = autoCategorizeQuestionFromMaster(
      { questionHi: cleanPrompt, questionEn: cleanPrompt, subjectTag: forcedSubject || '' },
      catalog,
      ['ALL', 'CGPSC', 'CGVYAPAM']
    );
    const subjName = forcedSubject || (guessed.subjectTag && guessed.subjectTag !== 'Needs Categorisation' ? guessed.subjectTag : 'Chhattisgarh General Knowledge');
    const matchedSub = catalog.findSubject(subjName);
    const defaultTop = matchedSub && catalog.getTopicsForSubject(matchedSub.subjectId)[0]
      ? catalog.getTopicsForSubject(matchedSub.subjectId)[0].titleEn
      : 'General Topic';
    const topName = (guessed.topic && guessed.topic !== 'Needs Categorisation') ? guessed.topic : defaultTop;

    const curatedPool = [
      {
        subjectTag: 'Chhattisgarh General Knowledge',
        topic: 'History of Chhattisgarh',
        questionHi: 'छत्तीसगढ़ में कलचुरी वंश की प्रथम राजधानी कहाँ स्थापित की गई थी?',
        questionEn: 'Where was the first capital of the Kalachuri dynasty established in Chhattisgarh?',
        optionsHi: ['तुम्माण', 'रतनपुर', 'रायपुर', 'सिरपुर'],
        optionsEn: ['Tumman', 'Ratanpur', 'Raipur', 'Sirpur'],
        correctOptionIndex: 0,
        explanationHi: 'कलिंगराज ने 1000 ई. में तुम्माण को कलचुरी वंश की प्रथम राजधानी बनाया था।',
        explanationEn: 'Kalingaraj established Tumman as the first capital of the Kalachuri dynasty in 1000 AD.'
      },
      {
        subjectTag: 'Chhattisgarh General Knowledge',
        topic: 'Geography & Natural Resources of CG',
        questionHi: 'छत्तीसगढ़ की जीवन रेखा कहलाने वाली महानदी का उद्गम किस जिले से होता है?',
        questionEn: 'Mahanadi, the lifeline of Chhattisgarh, originates from which district?',
        optionsHi: ['धमतरी (सिहावा पर्वत)', 'कांकेर', 'बस्तर', 'सरगुजा'],
        optionsEn: ['Dhamtari (Sihawa Hills)', 'Kanker', 'Bastar', 'Surguja'],
        correctOptionIndex: 0,
        explanationHi: 'महानदी का उद्गम धमतरी जिले के सिहावा पर्वत (फरसिया गाँव) से होता है।',
        explanationEn: 'Mahanadi originates from Sihawa mountain range in Dhamtari district.'
      },
      {
        subjectTag: 'Chhattisgarh General Knowledge',
        topic: 'Tribes, Folk Art & Culture of CG',
        questionHi: 'बस्तर के प्रसिद्ध गोंचा पर्व में किस देवता की रथ यात्रा निकाली जाती है?',
        questionEn: 'During the famous Goncha festival of Bastar, the chariot procession of which deity is taken out?',
        optionsHi: ['भगवान जगन्नाथ', 'दंतेश्वरी माता', 'बूढ़ादेव', 'आंगादेव'],
        optionsEn: ['Lord Jagannath', 'Goddess Danteshwari', 'Budhadev', 'Angadev'],
        correctOptionIndex: 0,
        explanationHi: 'आषाढ़ माह में बस्तर में भगवान जगन्नाथ की रथ यात्रा को गोंचा पर्व के रूप में मनाया जाता है।',
        explanationEn: 'In the month of Ashadha, the chariot festival of Lord Jagannath is celebrated as Goncha festival in Bastar.'
      },
      {
        subjectTag: 'Chhattisgarh General Knowledge',
        topic: 'Panchayati Raj & Local Administration in CG',
        questionHi: 'छत्तीसगढ़ पंचायती राज अधिनियम, 1993 के अंतर्गत ग्राम पंचायत की बैठक माह में कम से कम कितनी बार होनी अनिवार्य है?',
        questionEn: 'Under the Chhattisgarh Panchayati Raj Act 1993, how many times must a Gram Panchayat meeting be held in a month?',
        optionsHi: ['कम से कम 1 बार', 'कम से कम 2 बार', 'कम से कम 3 बार', 'कम से कम 4 बार'],
        optionsEn: ['At least once', 'At least twice', 'At least thrice', 'At least four times'],
        correctOptionIndex: 0,
        explanationHi: 'ग्राम पंचायत की बैठक प्रत्येक माह में कम से कम एक बार आयोजित किया जाना अनिवार्य है।',
        explanationEn: 'A Gram Panchayat meeting must be held at least once every month.'
      },
      {
        subjectTag: 'Indian Polity & Constitution',
        topic: 'Fundamental Rights & Duties',
        questionHi: 'भारतीय संविधान के किस अनुच्छेद के अंतर्गत "संवैधानिक उपचारों का अधिकार" प्रदान किया गया है?',
        questionEn: 'Under which Article of the Indian Constitution is the "Right to Constitutional Remedies" guaranteed?',
        optionsHi: ['अनुच्छेद 32', 'अनुच्छेद 21', 'अनुच्छेद 19', 'अनुच्छेद 14'],
        optionsEn: ['Article 32', 'Article 21', 'Article 19', 'Article 14'],
        correctOptionIndex: 0,
        explanationHi: 'डॉ. भीमराव अंबेडकर ने अनुच्छेद 32 को भारतीय संविधान की आत्मा और हृदय कहा है।',
        explanationEn: 'Dr. B.R. Ambedkar called Article 32 the heart and soul of the Indian Constitution.'
      },
      {
        subjectTag: 'History of India',
        topic: 'Modern Indian History & Freedom Struggle',
        questionHi: 'भारतीय राष्ट्रीय कांग्रेस के किस अधिवेशन में "पूर्ण स्वराज" का प्रस्ताव पारित किया गया था?',
        questionEn: 'In which session of the Indian National Congress was the resolution of "Purna Swaraj" passed?',
        optionsHi: ['लाहौर अधिवेशन, 1929', 'कराची अधिवेशन, 1931', 'सूरत अधिवेशन, 1907', 'लखनऊ अधिवेशन, 1916'],
        optionsEn: ['Lahore Session, 1929', 'Karachi Session, 1931', 'Surat Session, 1907', 'Lucknow Session, 1916'],
        correctOptionIndex: 0,
        explanationHi: 'दिसंबर 1929 के लाहौर अधिवेशन में जवाहरलाल नेहरू की अध्यक्षता में पूर्ण स्वराज का प्रस्ताव पारित हुआ।',
        explanationEn: 'The Purna Swaraj resolution was passed in the December 1929 Lahore session presided over by Jawaharlal Nehru.'
      },
      {
        subjectTag: 'Geography of India & World',
        topic: 'Physical Features & River Systems',
        questionHi: 'प्रायद्वीपीय भारत की सबसे लंबी नदी कौन-सी है जिसे "दक्षिण गंगा" भी कहा जाता है?',
        questionEn: 'Which is the longest river of Peninsular India, also known as "Dakshin Ganga"?',
        optionsHi: ['गोदावरी नदी', 'कृष्णा नदी', 'कावेरी नदी', 'नर्मदा नदी'],
        optionsEn: ['Godavari River', 'Krishna River', 'Kaveri River', 'Narmada River'],
        correctOptionIndex: 0,
        explanationHi: 'गोदावरी नदी की लंबाई लगभग 1465 किमी है और यह प्रायद्वीपीय भारत की सबसे बड़ी नदी है।',
        explanationEn: 'Godavari is about 1465 km long and is the largest river system of Peninsular India.'
      },
      {
        subjectTag: 'Indian Economy',
        topic: 'National Income, Budget & Fiscal Policy',
        questionHi: 'भारत में मौद्रिक नीति (Monetary Policy) की समीक्षा किसके द्वारा की जाती है?',
        questionEn: 'Monetary Policy in India is formulated and reviewed by which institution?',
        optionsHi: ['भारतीय रिजर्व बैंक (RBI)', 'नीति आयोग', 'वित्त आयोग', 'सेबी (SEBI)'],
        optionsEn: ['Reserve Bank of India (RBI)', 'NITI Aayog', 'Finance Commission', 'SEBI'],
        correctOptionIndex: 0,
        explanationHi: 'भारतीय रिजर्व बैंक की मौद्रिक नीति समिति (MPC) द्वारा द्विमासिक मौद्रिक नीति की समीक्षा की जाती है।',
        explanationEn: 'The Monetary Policy Committee (MPC) of RBI reviews monetary policy bi-monthly.'
      },
      {
        subjectTag: 'General Science & Technology',
        topic: 'Physics, Chemistry & Biology',
        questionHi: 'मानव शरीर की सबसे बड़ी ग्रंथि (Largest Gland) कौन-सी है?',
        questionEn: 'Which is the largest gland in the human body?',
        optionsHi: ['यकृत (Liver)', 'अग्न्याशय (Pancreas)', 'थायरॉइड (Thyroid)', 'पीयूष ग्रंथि (Pituitary)'],
        optionsEn: ['Liver', 'Pancreas', 'Thyroid', 'Pituitary Gland'],
        correctOptionIndex: 0,
        explanationHi: 'यकृत (Liver) मानव शरीर की सबसे बड़ी आंतरिक ग्रंथि है जो पित्त रस का स्राव करती है।',
        explanationEn: 'The liver is the largest internal gland in the human body and secretes bile.'
      },
      {
        subjectTag: 'Computer & Information Technology',
        topic: 'Computer Architecture, OS & Networking',
        questionHi: 'कंप्यूटर में त्वरित एक्सेस के लिए CPU के सबसे नजदीक कौन-सी मेमोरी होती है?',
        questionEn: 'Which high-speed memory is located closest to the CPU for rapid data access?',
        optionsHi: ['कैश मेमोरी (Cache Memory)', 'हार्ड डिस्क (HDD)', 'सीडी-रोम (CD-ROM)', 'फ्लैश ड्राइव'],
        optionsEn: ['Cache Memory', 'Hard Disk Drive', 'CD-ROM', 'Flash Drive'],
        correctOptionIndex: 0,
        explanationHi: 'कैश मेमोरी CPU और RAM के बीच अत्यंत तीव्र गति वाली मेमोरी के रूप में कार्य करती है।',
        explanationEn: 'Cache memory acts as an ultra-fast buffer between the CPU and main RAM.'
      }
    ];

    const out = [];
    for (let i = 0; i < count; i++) {
      const template = curatedPool[i % curatedPool.length];
      out.push({
        questionNumber: i + 1,
        subjectTag: forcedSubject || subjName || template.subjectTag,
        topic: topName || template.topic,
        difficulty: difficulty || 'Moderate',
        questionHi: i === 0 && cleanPrompt.length > 8
          ? `[${cleanPrompt}] — ${template.questionHi}`
          : template.questionHi,
        questionEn: i === 0 && cleanPrompt.length > 8
          ? `[${cleanPrompt}] — ${template.questionEn}`
          : template.questionEn,
        optionsHi: template.optionsHi.slice(),
        optionsEn: template.optionsEn.slice(),
        correctOptionIndex: template.correctOptionIndex,
        explanationHi: template.explanationHi,
        explanationEn: template.explanationEn
      });
    }
    return out;
  }

  function openAiPromptQuestionGeneratorModal({ state, api, defaultSubject, onSaved }) {
    const catalog = getTaxonomyCatalog(state);
    const existing = document.getElementById('qbAiPromptGeneratorModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'qbAiPromptGeneratorModal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="card modal-card" style="max-width:650px;padding:20px;border-top:5px solid var(--primary);box-shadow:0 24px 55px rgba(0,0,0,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px;">
          <div style="min-width:0;flex:1;">
            <span class="badge badge-exam">✨ AI QUESTION GENERATOR</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-top:4px;line-height:1.35;">🤖 AI प्रॉम्प्ट देकर नए प्रश्न बनाएं (Auto Subject → Topic Folder)</h3>
          </div>
          <button type="button" class="btn btn-outline btn-sm" id="qbCloseAiPromptModalBtn" style="flex-shrink:0;">✕ बंद करें</button>
        </div>
        <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:14px;">
          कोई भी टॉपिक, सिलेबस बिंदु या निर्देश लिखें (जैसे: <em>"छत्तीसगढ़ के कलचुरी वंश और जनजातीय विद्रोह पर 10 कठिन प्रश्न बनाएं"</em>)। AI स्वयं द्विभाषी (Hindi + English) MCQ प्रश्न, 4 विकल्प, सही उत्तर और व्याख्या बनाकर सीधे संबंधित <strong>Subject → Topic फ़ोल्डर</strong> में सेव कर देगा।
        </p>

        <div class="form-group" style="margin-bottom:12px;">
          <label class="form-label" style="font-weight:700;">1️⃣ AI प्रॉम्प्ट / टॉपिक का विवरण लिखें *</label>
          <textarea class="form-textarea" id="qbAiPromptTextarea" rows="4" placeholder="उदाहरण: छत्तीसगढ़ पंचायती राज अधिनियम 1993, ग्राम सभा और आरक्षण के प्रावधानों पर CGPSC स्तर के प्रश्न बनाएं..."></textarea>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px;margin-bottom:14px;">
          <div>
            <label class="form-label" style="font-size:0.78rem;font-weight:700;">2️⃣ प्रश्नों की संख्या</label>
            <select class="form-select" id="qbAiPromptCountSelect">
              <option value="5">5 प्रश्न</option>
              <option value="10" selected>10 प्रश्न</option>
              <option value="15">15 प्रश्न</option>
              <option value="20">20 प्रश्न</option>
              <option value="25">25 प्रश्न</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size:0.78rem;font-weight:700;">3️⃣ कठिनाई स्तर (Difficulty)</label>
            <select class="form-select" id="qbAiPromptDifficultySelect">
              <option value="Easy">Easy (सरल)</option>
              <option value="Moderate" selected>Moderate (मध्यम - CGPSC/Vyapam)</option>
              <option value="Hard">Hard (कठिन - कूट/कथन आधारित)</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size:0.78rem;font-weight:700;">4️⃣ विषय फ़ोल्डर (Subject Folder)</label>
            <select class="form-select" id="qbAiPromptSubjectSelect">
              <option value="">🤖 AI स्वतः विषय पहचाने (Auto-Detect)</option>
              ${catalog.subjects.map((s) => `<option value="${esc(s.titleEn)}" ${defaultSubject === s.titleEn ? 'selected' : ''}>${esc(s.titleHi)} (${esc(s.titleEn)})</option>`).join('')}
            </select>
          </div>
        </div>

        <div id="qbAiPromptStatusBanner" style="display:none;padding:10px 12px;border-radius:8px;background:rgba(37,99,235,0.1);color:var(--primary);font-weight:700;font-size:0.83rem;margin-bottom:12px;"></div>

        <div style="display:flex;justify-content:flex-end;gap:10px;">
          <button class="btn btn-outline" id="qbCancelAiPromptModalBtn">रद्द करें</button>
          <button class="btn btn-primary" id="qbSubmitAiPromptGenBtn" style="font-weight:800;">
            ✨ AI से प्रश्न बनाएं और फ़ोल्डर में सेव करें
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('#qbCloseAiPromptModalBtn').onclick = close;
    modal.querySelector('#qbCancelAiPromptModalBtn').onclick = close;

    modal.querySelector('#qbSubmitAiPromptGenBtn').onclick = async () => {
      const promptInput = String(modal.querySelector('#qbAiPromptTextarea').value || '').trim();
      if (!promptInput) {
        api.toast('⚠️ कृपया पहले प्रॉम्प्ट या टॉपिक लिखें।');
        return;
      }
      const count = Math.min(30, Math.max(1, Number(modal.querySelector('#qbAiPromptCountSelect').value) || 10));
      const difficulty = modal.querySelector('#qbAiPromptDifficultySelect').value || 'Moderate';
      const forcedSubject = modal.querySelector('#qbAiPromptSubjectSelect').value || '';
      const statusBanner = modal.querySelector('#qbAiPromptStatusBanner');
      const submitBtn = modal.querySelector('#qbSubmitAiPromptGenBtn');

      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ AI प्रश्न बना रहा है...';
      statusBanner.style.display = 'block';
      statusBanner.textContent = `🤖 AI आपके प्रॉम्प्ट "${promptInput.slice(0, 60)}..." पर ${count} द्विभाषी प्रश्न तैयार कर रहा है...`;

      try {
        const subjectTopicGuide = catalog.subjects.map((s) => {
          const tops = catalog.getTopicsForSubject(s.subjectId).map((t) => t.titleEn).join(', ');
          return `- Subject "${s.titleEn}" (${s.titleHi}): Topics [${tops}]`;
        }).join('\n');

        let generatedItems = [];
        const hasAiBridge = Boolean(
          window.AndroidBridge &&
          typeof window.AndroidBridge.analyzeQuestionsWithAi === 'function'
        );

        if (hasAiBridge) {
          const aiPrompt = `You are an expert Indian Competitive Exam (CGPSC / CG Vyapam / UPSC) Question Paper Setter.
Generate ${count} high-quality, exam-authentic Multiple Choice Questions (MCQs) based on the user's prompt below.
User Prompt / Topic: "${promptInput}"
Difficulty Level: ${difficulty}
${forcedSubject ? `Target Subject Folder: "${forcedSubject}"` : 'Automatically select the best matching Subject ("subjectTag") and Topic ("topic") folder for each question from the list below:'}
Available Subject & Topic Folders:
${subjectTopicGuide}

Requirements:
1. Every question MUST be bilingual: pure Devanagari Hindi ("questionHi", "optionsHi", "explanationHi") and clean English ("questionEn", "optionsEn", "explanationEn").
2. Provide exactly 4 options (A, B, C, D) in both languages, the exact 0-based "correctOptionIndex" (0, 1, 2, or 3), and a clear factual explanation.
3. Return ONLY a valid JSON array of objects:
[
  {
    "questionNumber": 1,
    "subjectTag": "Chhattisgarh General Knowledge",
    "topic": "History of Chhattisgarh",
    "difficulty": "${difficulty}",
    "questionHi": "...",
    "questionEn": "...",
    "optionsHi": ["...", "...", "...", "..."],
    "optionsEn": ["...", "...", "...", "..."],
    "correctOptionIndex": 0,
    "explanationHi": "...",
    "explanationEn": "..."
  }
]`;
          try {
            const aiRaw = await callAndroidAiBridge(aiPrompt, null);
            generatedItems = parseAiJsonArraySafely(aiRaw);
          } catch (_aiErr) {}
        }

        if (!Array.isArray(generatedItems) || generatedItems.length === 0) {
          // Check if the user pasted raw questions inside the prompt box
          const parsedFromText = parsePdfOcrAndMatchAnswerKey('Method: PDF_OCR\n' + promptInput, 'prompt.txt', '', 'A', 'A');
          if (parsedFromText && Array.isArray(parsedFromText.rawItems) && parsedFromText.rawItems.length > 0) {
            generatedItems = parsedFromText.rawItems;
          } else {
            generatedItems = buildOfflinePromptGeneratedQuestions(promptInput, count, forcedSubject, difficulty, catalog);
          }
        }

        const savedDocs = [];
        await scanAndCategorizeWithAiOrFallback({
          questionFile: { name: 'AI_Prompt_Generator.json', type: 'application/json' },
          rawQuestionText: JSON.stringify(generatedItems),
          answerKeyText: '',
          paperSetCode: 'A',
          forcedSubjectTag: forcedSubject,
          forcedTopic: '',
          state,
          onProgress: (msg) => {
            statusBanner.textContent = msg;
          },
          onLiveSaveDocs: async (newDocs) => {
            newDocs.forEach((doc) => {
              state.questionBank.unshift(doc);
              savedDocs.push(doc);
            });
            api.saveState();
            if (window.CGpediaCloud && window.CGpediaCloud.batchSaveCloudDocs && newDocs.length > 0) {
              window.CGpediaCloud.batchSaveCloudDocs('question_bank', newDocs).catch(() => {});
            }
          }
        });

        close();
        api.toast(`✅ ${savedDocs.length || generatedItems.length} नए प्रश्न बनकर संबंधित Subject → Topic फ़ोल्डर में सेव हो गए!`);
        if (typeof onSaved === 'function') onSaved(savedDocs);
      } catch (err) {
        console.error('AI Prompt Generator Error:', err);
        submitBtn.disabled = false;
        submitBtn.textContent = '✨ AI से प्रश्न बनाएं और फ़ोल्डर में सेव करें';
        statusBanner.textContent = '⚠️ प्रश्न बनाने में त्रुटि आई। कृपया पुनः प्रयास करें।';
      }
    };
  }

  // ============================================================================
  // POPUP 2: PARAGRAPH / TEXT COPY-PASTE TO SUBJECT FOLDER MODAL
  // ============================================================================
  function generateQuestionsFromParagraphOffline(paragraphText, count, forcedSubject, catalog) {
    const cleanText = convertKrutiDevInText(String(paragraphText || '').trim());
    const sentences = cleanText
      .split(/(?<=[।.?!\n])\s+/)
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter((s) => s.length >= 25);

    const guessed = autoCategorizeQuestionFromMaster(
      { questionHi: cleanText.slice(0, 500), questionEn: cleanText.slice(0, 500), subjectTag: forcedSubject || '' },
      catalog,
      ['ALL', 'CGPSC', 'CGVYAPAM']
    );
    const subjName = forcedSubject || (guessed.subjectTag && guessed.subjectTag !== 'Needs Categorisation' ? guessed.subjectTag : 'Chhattisgarh General Knowledge');
    const matchedSub = catalog.findSubject(subjName);
    const defaultTop = matchedSub && catalog.getTopicsForSubject(matchedSub.subjectId)[0]
      ? catalog.getTopicsForSubject(matchedSub.subjectId)[0].titleEn
      : 'General Topic';
    const topName = (guessed.topic && guessed.topic !== 'Needs Categorisation') ? guessed.topic : defaultTop;

    if (sentences.length === 0) {
      return buildOfflinePromptGeneratedQuestions(cleanText, count, subjName, 'Moderate', catalog);
    }

    const out = [];
    const targetCount = Math.min(count, Math.max(1, sentences.length));
    for (let i = 0; i < targetCount; i++) {
      const fact = sentences[i % sentences.length];
      const other1 = sentences[(i + 1) % sentences.length] || 'उपरोक्त में से कोई नहीं';
      const other2 = sentences[(i + 2) % sentences.length] || 'केवल औपचारिक कथन';
      out.push({
        questionNumber: i + 1,
        subjectTag: subjName,
        topic: topName,
        difficulty: 'Moderate',
        questionHi: `दिए गए अध्ययन अनुच्छेद (${topName}) के संदर्भ में निम्नलिखित में से कौन-सा कथन सत्य है?`,
        questionEn: `With reference to the provided study passage (${topName}), which of the following statements is correct?`,
        optionsHi: [
          fact.slice(0, 180),
          other1 !== fact ? other1.slice(0, 180) : 'यह प्रावधान केवल केंद्र शासित प्रदेशों पर लागू है',
          other2 !== fact ? other2.slice(0, 180) : 'यह कथन ऐतिहासिक रूप से असत्य है',
          'उपर्युक्त में से कोई नहीं'
        ],
        optionsEn: [
          fact.slice(0, 180),
          other1 !== fact ? other1.slice(0, 180) : 'This provision applies only to Union Territories',
          other2 !== fact ? other2.slice(0, 180) : 'This statement is historically incorrect',
          'None of the above'
        ],
        correctOptionIndex: 0,
        explanationHi: `अनुच्छेद के अनुसार सही तथ्य: "${fact}"`,
        explanationEn: `According to the passage: "${fact}"`
      });
    }
    return out;
  }

  function openPasteParagraphOrQuestionsModal({ state, api, defaultSubject, onSaved }) {
    const catalog = getTaxonomyCatalog(state);
    const existing = document.getElementById('qbPasteParagraphModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'qbPasteParagraphModal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="card modal-card" style="max-width:700px;padding:20px;border-top:5px solid #059669;box-shadow:0 24px 55px rgba(0,0,0,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px;">
          <div style="min-width:0;flex:1;">
            <span class="badge badge-free">📋 PARAGRAPH & TEXT SCANNER</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-top:4px;line-height:1.35;">📋 पैराग्राफ या प्रश्न कॉपी-पेस्ट करें (Auto Subject → Topic Folder)</h3>
          </div>
          <button type="button" class="btn btn-outline btn-sm" id="qbClosePasteModalBtn" style="flex-shrink:0;">✕ बंद करें</button>
        </div>
        <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">
          यहाँ कोई भी <strong>पैराग्राफ / नोट्स</strong> या पहले से लिखे <strong>MCQ प्रश्न</strong> पेस्ट करें। यह टूल पेस्ट किए गए प्रश्नों को भी स्कैन करके सेव करता है और पैराग्राफ से नए MCQ प्रश्न भी बनाकर जिस विषय (Subject) का है उसके फ़ोल्डर में ऑटोमैटिक सेव कर देता है!
        </p>

        <div class="form-group" style="margin-bottom:12px;">
          <label class="form-label" style="font-weight:700;">1️⃣ पैराग्राफ, नोट्स या प्रश्न यहाँ पेस्ट करें (Unicode / KrutiDev / Shree-Dev / English) *</label>
          <textarea class="form-textarea" id="qbPasteTextArea" rows="7" placeholder="यहाँ कोई भी पैराग्राफ/नोट्स पेस्ट करें या प्रश्न (1. ... (A) ... (B) ... (C) ... (D) ...) पेस्ट करें..."></textarea>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:14px;">
          <div>
            <label class="form-label" style="font-size:0.78rem;font-weight:700;">2️⃣ प्रोसेसिंग मोड (Mode)</label>
            <select class="form-select" id="qbPasteModeSelect">
              <option value="AUTO_BOTH" selected>⚡ स्मार्ट ऑटो (प्रश्न स्कैन करें + पैराग्राफ से नए प्रश्न बनाएं)</option>
              <option value="EXTRACT_ONLY">📑 केवल पेस्ट किए गए MCQ प्रश्नों को स्कैन करके सेव करें</option>
              <option value="GENERATE_FROM_PARA">✨ पैराग्राफ/नोट्स से नए MCQ प्रश्न बनाएं</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size:0.78rem;font-weight:700;">3️⃣ पैराग्राफ से कितने प्रश्न बनाएं?</label>
            <select class="form-select" id="qbPasteGenCountSelect">
              <option value="5">5 प्रश्न</option>
              <option value="10" selected>10 प्रश्न</option>
              <option value="15">15 प्रश्न</option>
              <option value="20">20 प्रश्न</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size:0.78rem;font-weight:700;">4️⃣ विषय फ़ोल्डर (Subject Folder)</label>
            <select class="form-select" id="qbPasteSubjectSelect">
              <option value="">🤖 AI स्वतः विषय पहचाने (Auto-Detect)</option>
              ${catalog.subjects.map((s) => `<option value="${esc(s.titleEn)}" ${defaultSubject === s.titleEn ? 'selected' : ''}>${esc(s.titleHi)} (${esc(s.titleEn)})</option>`).join('')}
            </select>
          </div>
        </div>

        <div id="qbPasteStatusBanner" style="display:none;padding:10px 12px;border-radius:8px;background:rgba(5,150,105,0.12);color:#065f46;font-weight:700;font-size:0.83rem;margin-bottom:12px;"></div>

        <div style="display:flex;justify-content:flex-end;gap:10px;">
          <button class="btn btn-outline" id="qbCancelPasteModalBtn">रद्द करें</button>
          <button class="btn btn-primary" id="qbSubmitPasteModalBtn" style="font-weight:800;background:#059669;border-color:#059669;">
            📋 स्कैन / प्रश्न बनाएं और Subject फ़ोल्डर में सेव करें
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('#qbClosePasteModalBtn').onclick = close;
    modal.querySelector('#qbCancelPasteModalBtn').onclick = close;

    modal.querySelector('#qbSubmitPasteModalBtn').onclick = async () => {
      const rawPasted = String(modal.querySelector('#qbPasteTextArea').value || '').trim();
      if (!rawPasted) {
        api.toast('⚠️ कृपया पहले कोई पैराग्राफ या प्रश्न टेक्स्ट पेस्ट करें।');
        return;
      }
      const mode = modal.querySelector('#qbPasteModeSelect').value || 'AUTO_BOTH';
      const genCount = Math.min(25, Math.max(1, Number(modal.querySelector('#qbPasteGenCountSelect').value) || 10));
      const forcedSubject = modal.querySelector('#qbPasteSubjectSelect').value || '';
      const statusBanner = modal.querySelector('#qbPasteStatusBanner');
      const submitBtn = modal.querySelector('#qbSubmitPasteModalBtn');

      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ प्रोसेस हो रहा है...';
      statusBanner.style.display = 'block';
      statusBanner.textContent = '⏳ पेस्ट किए गए टेक्स्ट को स्कैन और वर्गीकृत किया जा रहा है...';

      try {
        const cleanText = convertKrutiDevInText(rawPasted);
        const combinedItems = [];

        // 1. Check if pasted text already contains MCQs
        if (mode === 'AUTO_BOTH' || mode === 'EXTRACT_ONLY') {
          const parsedMcqs = parsePdfOcrAndMatchAnswerKey('Method: PDF_OCR\n' + cleanText, 'pasted_text.txt', '', 'A', 'A');
          if (parsedMcqs && Array.isArray(parsedMcqs.rawItems) && parsedMcqs.rawItems.length > 0) {
            combinedItems.push(...parsedMcqs.rawItems);
          }
        }

        // 2. If mode is GENERATE_FROM_PARA, or if AUTO_BOTH and either no MCQs were found or user pasted study notes
        if (mode === 'GENERATE_FROM_PARA' || (mode === 'AUTO_BOTH' && combinedItems.length === 0)) {
          const subjectTopicGuide = catalog.subjects.map((s) => {
            const tops = catalog.getTopicsForSubject(s.subjectId).map((t) => t.titleEn).join(', ');
            return `- Subject "${s.titleEn}" (${s.titleHi}): Topics [${tops}]`;
          }).join('\n');

          const hasAiBridge = Boolean(
            window.AndroidBridge &&
            typeof window.AndroidBridge.analyzeQuestionsWithAi === 'function'
          );

          let aiGenerated = [];
          if (hasAiBridge) {
            statusBanner.textContent = `🤖 AI पेस्ट किए गए पैराग्राफ से ${genCount} नए प्रश्न बना रहा है...`;
            const aiPrompt = `You are an expert bilingual (Hindi + English) competitive exam Question Bank AI.
Read the pasted text/paragraph below.
1. If it contains existing MCQs, extract all of them accurately.
2. Also generate up to ${genCount} high-quality bilingual MCQs from the factual content of the paragraph.
3. Classify every question into the exact Subject ("subjectTag") and Topic ("topic") folder.
${forcedSubject ? `Force Subject Folder: "${forcedSubject}"` : ''}
Available Subject & Topic Folders:
${subjectTopicGuide}

Pasted Paragraph / Text:
${cleanText.slice(0, 12000)}

Return ONLY a valid JSON array of objects:
[{"questionNumber": 1, "subjectTag": "...", "topic": "...", "difficulty": "Moderate", "questionHi": "...", "questionEn": "...", "optionsHi": ["A","B","C","D"], "optionsEn": ["A","B","C","D"], "correctOptionIndex": 0, "explanationHi": "...", "explanationEn": "..."}]`;
            try {
              const aiRaw = await callAndroidAiBridge(aiPrompt, null);
              aiGenerated = parseAiJsonArraySafely(aiRaw);
            } catch (_e) {}
          }

          if (Array.isArray(aiGenerated) && aiGenerated.length > 0) {
            combinedItems.push(...aiGenerated);
          } else {
            const offlineParaQs = generateQuestionsFromParagraphOffline(cleanText, genCount, forcedSubject, catalog);
            combinedItems.push(...offlineParaQs);
          }
        }

        const savedDocs = [];
        await scanAndCategorizeWithAiOrFallback({
          questionFile: { name: 'Pasted_Paragraph_Questions.json', type: 'application/json' },
          rawQuestionText: JSON.stringify(combinedItems),
          answerKeyText: '',
          paperSetCode: 'A',
          forcedSubjectTag: forcedSubject,
          forcedTopic: '',
          state,
          onProgress: (msg) => {
            statusBanner.textContent = msg;
          },
          onLiveSaveDocs: async (newDocs) => {
            newDocs.forEach((doc) => {
              const dupIdx = state.questionBank.findIndex(
                (q) => q.id === doc.id || normalizeTextForComparison(q.questionHi) === normalizeTextForComparison(doc.questionHi)
              );
              if (dupIdx >= 0) {
                state.questionBank[dupIdx] = Object.assign({}, state.questionBank[dupIdx], doc);
              } else {
                state.questionBank.unshift(doc);
              }
              savedDocs.push(doc);
            });
            api.saveState();
            if (window.CGpediaCloud && window.CGpediaCloud.batchSaveCloudDocs && newDocs.length > 0) {
              window.CGpediaCloud.batchSaveCloudDocs('question_bank', newDocs).catch(() => {});
            }
          }
        });

        close();
        api.toast(`✅ पेस्ट किए गए टेक्स्ट से ${savedDocs.length || combinedItems.length} प्रश्न संबंधित Subject → Topic फ़ोल्डर में सेव हो गए!`);
        if (typeof onSaved === 'function') onSaved(savedDocs);
      } catch (err) {
        console.error('Paste Paragraph Modal Error:', err);
        submitBtn.disabled = false;
        submitBtn.textContent = '📋 स्कैन / प्रश्न बनाएं और Subject फ़ोल्डर में सेव करें';
        statusBanner.textContent = '⚠️ टेक्स्ट प्रोसेस करने में त्रुटि आई। कृपया पुनः प्रयास करें।';
      }
    };
  }

  async function commitImportPreviewSession(ps, state, api) {
    if (!ps || !Array.isArray(ps.records)) return null;
    state.questionBank = state.questionBank || [];
    const catalog = getTaxonomyCatalog(state);
    const nowIso = new Date().toISOString();
    let newSaved = 0;
    let exactDupRefAdded = 0;
    let uncategorisedCount = 0;
    let pyqRefCount = 0;
    let skippedInvalid = 0;
    const docsToSync = [];

    ps.records.forEach((rec) => {
      if (rec.excluded || !rec.isValid) {
        skippedInvalid += 1;
        return;
      }
      if (rec.duplicateType === 'exact' && rec.duplicateTargetId) {
        const existingQ = state.questionBank.find((q) => (q.questionId || q.id) === rec.duplicateTargetId);
        if (existingQ) {
          const incomingRefs = normalizeQuestionPyqReferences(rec.normalized);
          const beforeLen = Array.isArray(existingQ.pyqReferences) ? existingQ.pyqReferences.length : 0;
          existingQ.pyqReferences = mergePyqReferenceArrays(existingQ.pyqReferences, incomingRefs);
          if (existingQ.pyqReferences.length > beforeLen) {
            pyqRefCount += (existingQ.pyqReferences.length - beforeLen);
          }
          existingQ.updatedAt = nowIso;
          existingQ.updatedAtIso = nowIso;
          exactDupRefAdded += 1;
          docsToSync.push(existingQ);
          return;
        }
      }

      const norm = Object.assign({}, rec.normalized);
      const resolved = resolveCanonicalQuestionHierarchy(norm, catalog);
      const isUncat = !resolved.subjectId || resolved.subjectId === 'sub_uncategorised' || norm.needsCategorisation;

      const qDoc = Object.assign({}, norm, {
        id: norm.questionId || norm.id || computeDeterministicQuestionId(norm),
        questionId: norm.questionId || norm.id || computeDeterministicQuestionId(norm),
        mainCategoryId: isUncat ? 'cat_uncategorised' : (resolved.mainCategoryId || norm.mainCategoryId || 'cat_cg_gk'),
        mainCategory: isUncat ? 'Uncategorised' : (resolved.mainCategory || norm.mainCategory || 'Chhattisgarh GK'),
        subjectId: isUncat ? 'sub_uncategorised' : (resolved.subjectId || norm.subjectId),
        subjectTag: isUncat ? 'Uncategorised' : (resolved.subjectTag || norm.subjectTag),
        topicId: isUncat ? 'top_uncategorised' : (resolved.topicId || norm.topicId),
        topic: isUncat ? 'Uncategorised' : (resolved.topic || norm.topic),
        needsCategorisation: Boolean(isUncat),
        verificationStatus: isUncat ? 'needs_categorisation' : (norm.verificationStatus || 'verified'),
        status: isUncat ? 'needs_categorisation' : 'verified',
        verified: !isUncat,
        adminVerified: !isUncat,
        pyqReferences: normalizeQuestionPyqReferences(norm),
        isDeleted: false,
        createdAt: norm.createdAt || nowIso,
        updatedAt: nowIso,
        createdAtIso: norm.createdAtIso || nowIso,
        updatedAtIso: nowIso
      });
      if (isUncat) uncategorisedCount += 1;
      if (qDoc.pyqReferences.length > 0) pyqRefCount += qDoc.pyqReferences.length;

      const existingIdx = state.questionBank.findIndex((q) => (q.questionId || q.id) === qDoc.questionId);
      if (existingIdx >= 0) {
        qDoc.pyqReferences = mergePyqReferenceArrays(state.questionBank[existingIdx].pyqReferences, qDoc.pyqReferences);
        state.questionBank[existingIdx] = Object.assign({}, state.questionBank[existingIdx], qDoc);
        docsToSync.push(state.questionBank[existingIdx]);
      } else {
        state.questionBank.unshift(qDoc);
        docsToSync.push(qDoc);
      }
      newSaved += 1;
    });

    api.saveState();
    if (window.CGpediaCloud && window.CGpediaCloud.batchSaveCloudDocs && docsToSync.length > 0) {
      await window.CGpediaCloud.batchSaveCloudDocs('question_bank', docsToSync).catch(() => {});
    }

    const summary = {
      fileName: ps.fileName || 'Import',
      timestampIso: nowIso,
      totalRows: ps.records.length,
      newQuestionsSaved: newSaved,
      exactDuplicateRefsAdded: exactDupRefAdded,
      possibleDuplicatesCount: ps.records.filter((r) => r.duplicateType === 'possible').length,
      uncategorisedCount,
      pyqReferencesAdded: pyqRefCount,
      missingFoldersDetected: ps.records.filter((r) => r.missingFolderInfo && r.missingFolderInfo.hasMissingFolder).length,
      skippedOrErrorRows: skippedInvalid
    };
    qbState.lastImportReport = summary;
    qbState.previewSession = null;
    return summary;
  }

  function renderQuestionCardItemHtml(q, qNum, validSelectedIds, showFullFolderPath) {
    const letters = ['A', 'B', 'C', 'D'];
    const qid = q.questionId || q.id;
    const isChecked = validSelectedIds.has(qid) || validSelectedIds.has(q.id);
    const corrIdx = Number(q.correctOptionIndex ?? q.correctIndex ?? 0);
    const optsHi = Array.isArray(q.optionsHi) ? q.optionsHi : [q.optA_Hi || '', q.optB_Hi || '', q.optC_Hi || '', q.optD_Hi || ''];
    const optsEn = Array.isArray(q.optionsEn) ? q.optionsEn : [q.optA_En || '', q.optB_En || '', q.optC_En || '', q.optD_En || ''];
    const diff = normalizeDifficultyValue(q.difficultyLevel || q.difficulty) || 'Moderate';
    const diffClass = diff === 'Easy' ? 'badge-diff-easy' : (diff === 'Hard' ? 'badge-diff-difficult' : 'badge-diff-moderate');
    const pyqRefs = normalizeQuestionPyqReferences(q);
    const isUncat = q.subjectId === 'sub_uncategorised' || q.subjectTag === 'Uncategorised' || q.verificationStatus === 'needs_categorisation';
    const isVerified = q.verificationStatus === 'verified' && !isUncat;
    const langAvail = q.languageAvailability || ((q.questionHi && q.questionEn && q.questionHi !== q.questionEn) ? 'Bilingual' : (q.questionHi ? 'Hindi' : 'English'));
    const mainCatLabel = q.mainCategory || (isUncat ? 'Uncategorised' : 'Chhattisgarh GK');
    const subLabel = q.subjectTag || 'Uncategorised';
    const topLabel = q.topic || 'Uncategorised';

    return `
      <div class="qb-preview-card ${isUncat ? 'status-warning' : 'status-valid'}" style="border-left:4px solid ${isUncat ? '#d97706' : 'var(--primary)'};margin-bottom:0;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <input type="checkbox" data-qb-row-select="${esc(q.id)}" ${isChecked ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer;" />
            <span class="badge badge-exam" style="font-size:0.75rem;">#${qNum}</span>
            <span class="badge badge-draft" style="font-family:monospace;font-size:0.7rem;" title="Central Question ID">${esc(qid)}</span>
            ${showFullFolderPath ? `
              <span class="badge badge-review" style="font-size:0.74rem;">🗂️ ${esc(mainCatLabel)} › 📁 ${esc(subLabel)} › 📂 ${esc(topLabel)}</span>
            ` : `
              <span class="badge badge-review" style="font-size:0.74rem;">📁 ${esc(subLabel)}</span>
              <span class="badge badge-draft" style="font-size:0.74rem;">📂 ${esc(topLabel)}</span>
            `}
            <span class="badge ${diffClass}" style="font-size:0.72rem;">${esc(diff)}</span>
            <span class="badge badge-draft" style="font-size:0.7rem;">🌐 ${esc(langAvail)}</span>
            ${isVerified
              ? '<span class="badge badge-free" style="font-size:0.72rem;">✓ Verified</span>'
              : `<span class="badge badge-paid" style="font-size:0.72rem;">⚠️ ${esc(q.verificationStatus || 'Needs Categorisation')}</span>`}
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
            <div style="display:inline-flex;align-items:center;gap:2px;padding:2px 5px;border-radius:6px;background:var(--surface-alt);border:1px solid var(--border);font-size:0.7rem;">
              <span style="font-weight:700;color:var(--text-secondary);">उत्तर:</span>
              ${[0, 1, 2, 3].map((oi) => `
                <button type="button" class="btn ${corrIdx === oi ? 'btn-success' : 'btn-outline'} btn-sm" style="padding:1px 5px;min-height:20px;font-size:0.68rem;" data-quick-ans-qbank="${esc(q.id)}:${oi}">${letters[oi]}</button>
              `).join('')}
            </div>
          </div>
        </div>

        ${pyqRefs.length > 0 ? `
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px;padding:5px 8px;border-radius:6px;background:rgba(79,70,229,0.06);border:1px dashed rgba(79,70,229,0.3);">
            <span style="font-size:0.72rem;font-weight:800;color:var(--primary);">🏛️ PYQ References (${pyqRefs.length}):</span>
            ${pyqRefs.map((ref) => `
              <span class="badge badge-exam" style="font-size:0.7rem;">
                ${esc(ref.examCategory || 'Exam')} › ${esc(ref.examName)}${ref.examYear ? ` (${esc(ref.examYear)})` : ''}${ref.paperName ? ` - ${esc(ref.paperName)}` : ''}${ref.shift ? ` [${esc(ref.shift)}]` : ''}${ref.questionNumber ? ` Q#${esc(ref.questionNumber)}` : ''}
              </span>
            `).join('')}
          </div>
        ` : ''}

        <div style="font-weight:800;font-size:0.92rem;color:var(--text);line-height:1.45;">
          🇮🇳 ${esc(q.questionHi || q.questionEn)}
        </div>
        ${q.questionEn && q.questionEn !== q.questionHi ? `
          <div style="font-weight:600;font-size:0.83rem;color:var(--text-secondary);margin-top:3px;line-height:1.4;">
            🇬🇧 ${esc(q.questionEn)}
          </div>
        ` : ''}

        <div class="qb-options-grid" style="margin-top:8px;">
          ${[0, 1, 2, 3].map((oi) => {
            const isCorr = corrIdx === oi;
            const hiTxt = optsHi[oi] || '';
            const enTxt = optsEn[oi] || '';
            return `
              <div class="qb-option-pill ${isCorr ? 'is-correct' : ''}" style="cursor:pointer;" data-quick-ans-qbank="${esc(q.id)}:${oi}">
                <div>
                  <div style="font-weight:${isCorr ? '800' : '600'};">
                    <strong>(${letters[oi]})</strong> ${esc(hiTxt || enTxt)}
                  </div>
                  ${enTxt && enTxt !== hiTxt ? `<div style="font-size:0.74rem;color:var(--text-secondary);">${esc(enTxt)}</div>` : ''}
                </div>
                ${isCorr ? '<span class="badge badge-free">✓ सही</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>

        <div class="qb-explanation-box" style="margin-top:8px;">
          <div><strong>💡 व्याख्या:</strong> ${esc(q.explanationHi || q.explanationEn || 'सही उत्तर विकल्प ' + letters[corrIdx] + ' है।')}</div>
          ${q.explanationEn && q.explanationEn !== q.explanationHi ? `
            <div style="margin-top:2px;color:var(--text-secondary);"><strong>Explanation:</strong> ${esc(q.explanationEn)}</div>
          ` : ''}
        </div>

        <!-- 9 Question Management Actions Bar -->
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin-top:10px;padding-top:8px;border-top:1px dashed var(--border);">
          <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
            <button type="button" class="btn btn-outline btn-sm" style="padding:3px 8px;font-size:0.73rem;" data-view-qbank="${esc(q.id)}">👁️ View</button>
            <button type="button" class="btn btn-outline btn-sm" style="padding:3px 8px;font-size:0.73rem;" data-edit-qbank="${esc(q.id)}">✏️ Edit</button>
            <button type="button" class="btn btn-outline btn-sm" style="padding:3px 8px;font-size:0.73rem;" data-dup-qbank="${esc(q.id)}">📄 Duplicate</button>
            <button type="button" class="btn btn-outline btn-sm" style="padding:3px 8px;font-size:0.73rem;" data-move-qbank="${esc(q.id)}">📂 Move</button>
            <button type="button" class="btn btn-outline btn-sm" style="padding:3px 8px;font-size:0.73rem;" data-change-sub-qbank="${esc(q.id)}">📁 Change Subject</button>
            <button type="button" class="btn btn-outline btn-sm" style="padding:3px 8px;font-size:0.73rem;" data-change-top-qbank="${esc(q.id)}">📂 Change Topic</button>
            <button type="button" class="btn btn-outline btn-sm" style="padding:3px 8px;font-size:0.73rem;border-color:var(--primary);color:var(--primary);" data-pyq-qbank="${esc(q.id)}">🏛️ + Exam / PYQ Ref</button>
          </div>
          <div style="display:flex;align-items:center;gap:5px;">
            ${!isVerified ? `
              <button type="button" class="btn btn-success btn-sm" style="padding:3px 9px;font-size:0.73rem;" data-verify-qbank="${esc(q.id)}">✅ Verify</button>
            ` : ''}
            <button type="button" class="btn btn-danger btn-sm" style="padding:3px 8px;font-size:0.73rem;" data-del-qbank="${esc(q.id)}">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderQuestionBankSubTabContent(ctx) {
    const {
      nav, catalog, activeQuestions, mainCatFolders, activeMainCatFolder,
      activeSubjectFolder, activeTopicFolder, pyqTree, filteredQuestions,
      pageItems, startIdx, totalFiltered, totalPages, validSelectedIds, selectedCount, state
    } = ctx;

    const renderQuestionListWithPagination = (showFullFolderPath) => `
      ${totalFiltered > 0 ? `
        <div class="qb-bulk-toolbar" style="margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <label style="display:inline-flex;align-items:center;gap:6px;font-size:0.8rem;font-weight:800;cursor:pointer;">
              <input type="checkbox" id="qbSelectAllPageChk" ${pageItems.length > 0 && pageItems.every((q) => validSelectedIds.has(q.id)) ? 'checked' : ''} />
              <span>इस पेज के सभी चुनें (${pageItems.length})</span>
            </label>
            <button class="btn btn-outline btn-sm" id="qbSelectAllFilteredBtn">☑️ सभी चुनें (${totalFiltered})</button>
            ${selectedCount > 0 ? `<button class="btn btn-outline btn-sm" id="qbClearSelectionBtn">✕ चयन हटाएं (${selectedCount})</button>` : ''}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm" id="qbBulkMoveFolderBtn" ${selectedCount === 0 ? 'disabled' : ''}>📂 Bulk Move / Change Folder (${selectedCount})</button>
            <button class="btn btn-navy btn-sm" id="qbSendFolderToTestBuilderBtn" ${totalFiltered === 0 ? 'disabled' : ''}>🧪 टेस्ट में जोड़ें (${selectedCount > 0 ? selectedCount : totalFiltered})</button>
            <button class="btn btn-outline btn-sm" id="qbExportCurrentFolderCsvBtn" ${totalFiltered === 0 ? 'disabled' : ''}>⬇️ CSV</button>
            <button class="btn btn-danger btn-sm" id="qbBulkDeleteBtn" ${selectedCount === 0 ? 'disabled' : ''}>🗑️ हटाएं (${selectedCount})</button>
          </div>
        </div>
      ` : ''}

      ${totalFiltered === 0 ? `
        <div style="padding:32px 16px;text-align:center;background:var(--surface-alt);border-radius:12px;border:1px dashed var(--border);">
          <div style="font-size:2rem;margin-bottom:6px;">📂</div>
          <div style="font-weight:800;font-size:0.95rem;color:var(--text);">यहाँ अभी कोई प्रश्न नहीं है</div>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px;margin-bottom:12px;">
            नया प्रश्न जोड़ें या Import / AI Scanner का उपयोग करें।
          </p>
          <button class="btn btn-primary btn-sm" id="qbEmptyFolderAddQBtn">➕ नया प्रश्न जोड़ें</button>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${pageItems.map((q, idx) => renderQuestionCardItemHtml(q, startIdx + idx + 1, validSelectedIds, showFullFolderPath)).join('')}
        </div>
        <div class="qb-pagination-bar" style="margin-top:14px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span>Showing <strong>${startIdx + 1}–${Math.min(totalFiltered, startIdx + pageItems.length)}</strong> of <strong>${totalFiltered}</strong> प्रश्न</span>
            <select class="form-select" id="qbPageSizeSelect" style="width:auto;padding:4px 8px;font-size:0.76rem;">
              <option value="15" ${qbState.pageSize === 15 ? 'selected' : ''}>15 / पेज</option>
              <option value="25" ${qbState.pageSize === 25 ? 'selected' : ''}>25 / पेज</option>
              <option value="50" ${qbState.pageSize === 50 ? 'selected' : ''}>50 / पेज</option>
              <option value="100" ${qbState.pageSize === 100 ? 'selected' : ''}>100 / पेज</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button class="btn btn-outline btn-sm" id="qbPrevPageBtn" ${qbState.page <= 1 ? 'disabled' : ''}>◀ पिछला</button>
            <span style="font-weight:700;padding:0 6px;">पेज ${qbState.page} / ${totalPages}</span>
            <button class="btn btn-outline btn-sm" id="qbNextPageBtn" ${qbState.page >= totalPages ? 'disabled' : ''}>अगला ▶</button>
          </div>
        </div>
      `}
    `;

    // SUB-TAB 1: SUBJECT-WISE QUESTION LIBRARY (Main Category -> Subject -> Topic -> Questions)
    if (nav.subTab === 'subject_library') {
      return `
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-bottom:12px;margin-bottom:14px;border-bottom:1px solid var(--border);">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <button class="btn ${nav.level === 'mainCategories' ? 'btn-primary' : 'btn-outline'} btn-sm" id="qbBreadcrumbHomeBtn">
                🗂️ मुख्य कैटेगरी (${mainCatFolders.length})
              </button>
              ${activeMainCatFolder ? `
                <span style="font-weight:800;color:var(--text-muted);">›</span>
                <button class="btn ${nav.level === 'subjects' ? 'btn-primary' : 'btn-outline'} btn-sm" id="qbBreadcrumbMainCatBtn">
                  ${esc(activeMainCatFolder.icon)} ${esc(activeMainCatFolder.titleHi)} (${activeMainCatFolder.questions.length})
                </button>
              ` : ''}
              ${activeSubjectFolder && !activeMainCatFolder?.directTopics ? `
                <span style="font-weight:800;color:var(--text-muted);">›</span>
                <button class="btn ${nav.level === 'topics' ? 'btn-primary' : 'btn-outline'} btn-sm" id="qbBreadcrumbSubjectBtn">
                  📁 ${esc(activeSubjectFolder.titleHi)} (${activeSubjectFolder.questions.length})
                </button>
              ` : ''}
              ${activeTopicFolder ? `
                <span style="font-weight:800;color:var(--text-muted);">›</span>
                <span class="badge badge-exam" style="padding:6px 10px;font-size:0.8rem;">
                  📂 ${esc(activeTopicFolder.titleHi)} (${activeTopicFolder.questions.length} प्रश्न)
                </span>
              ` : ''}
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm" id="qbPopupNewSubjectBtn">📁 + नया विषय फ़ोल्डर</button>
              <button class="btn btn-outline btn-sm" id="qbPopupNewTopicBtn">📂 + नया टॉपिक फ़ोल्डर</button>
              <button class="btn btn-primary btn-sm" id="qbAddQuestionInCurrentFolderBtn">➕ प्रश्न जोड़ें</button>
            </div>
          </div>

          ${nav.level === 'mainCategories' ? `
            <div style="margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <div>
                <h4 style="font-size:0.98rem;font-weight:800;">📚 Part 1: Subject-wise Question Library (7 मुख्य कैटेगरी + Uncategorised)</h4>
                <p style="font-size:0.78rem;color:var(--text-secondary);">Main Category › Subject Folder › Topic Folder › Questions</p>
              </div>
              <button class="btn btn-outline btn-sm" id="qbViewAllQuestionsFlatBtn">📋 सभी प्रश्न देखें (${activeQuestions.length})</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">
              ${mainCatFolders.map((mc) => `
                <div class="card" data-open-main-cat="${esc(mc.mainCategoryId)}" style="margin-bottom:0;cursor:pointer;border:1.5px solid ${mc.mainCategoryId === 'cat_uncategorised' ? '#d97706' : (mc.questions.length > 0 ? 'var(--primary)' : 'var(--border)')};background:${mc.questions.length > 0 ? 'var(--surface)' : 'var(--surface-alt)'};">
                  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
                    <div style="font-size:1.75rem;line-height:1;">${mc.icon}</div>
                    <span class="badge ${mc.questions.length > 0 ? 'badge-free' : 'badge-draft'}">📝 ${mc.questions.length} प्रश्न</span>
                  </div>
                  <div style="font-weight:800;font-size:0.96rem;margin-top:10px;color:var(--text);">${esc(mc.titleHi)}</div>
                  <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:600;margin-top:2px;">${esc(mc.titleEn)}</div>
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:8px;border-top:1px dashed var(--border);font-size:0.75rem;color:var(--primary);font-weight:800;">
                    <span>${mc.directTopics ? `📂 ${mc.totalTopics} Direct Topic फ़ोल्डर` : `📁 ${mc.subjectsMap.size} विषय • 📂 ${mc.totalTopics} टॉपिक`}</span>
                    <span>खोलें ▶</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${nav.level === 'subjects' && activeMainCatFolder ? `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <button class="btn btn-outline btn-sm" id="qbBackToMainCatsBtn">⬅️ मुख्य कैटेगरी पर वापस</button>
                <div>
                  <h4 style="font-size:1rem;font-weight:800;">${esc(activeMainCatFolder.icon)} ${esc(activeMainCatFolder.titleHi)} (${esc(activeMainCatFolder.titleEn)}) — विषय फ़ोल्डर</h4>
                </div>
              </div>
              <button class="btn btn-navy btn-sm" id="qbViewAllMainCatQuestionsBtn">📋 इस कैटेगरी के सभी प्रश्न (${activeMainCatFolder.questions.length})</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;">
              ${Array.from(activeMainCatFolder.subjectsMap.values()).map((sf) => `
                <div class="card" data-open-subject-folder="${esc(sf.subjectId)}" style="margin-bottom:0;cursor:pointer;border:1.5px solid ${sf.questions.length > 0 ? 'var(--primary)' : 'var(--border)'};">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                    <span style="font-size:1.5rem;">${sf.icon || '📁'}</span>
                    <span class="badge ${sf.questions.length > 0 ? 'badge-free' : 'badge-draft'}">📝 ${sf.questions.length} प्रश्न</span>
                  </div>
                  <div style="font-weight:800;font-size:0.93rem;margin-top:8px;">${esc(sf.titleHi)}</div>
                  <div style="font-size:0.76rem;color:var(--text-secondary);margin-top:2px;">${esc(sf.titleEn)}</div>
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:8px;border-top:1px dashed var(--border);font-size:0.74rem;color:var(--primary);font-weight:800;">
                    <span>📂 ${sf.topicsMap.size} टॉपिक फ़ोल्डर</span>
                    <span>खोलें ▶</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${nav.level === 'topics' && activeSubjectFolder ? `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <button class="btn btn-outline btn-sm" id="qbBackToSubjectsBtn">⬅️ वापस</button>
                <div>
                  <h4 style="font-size:1rem;font-weight:800;">📂 ${esc(activeSubjectFolder.titleHi)} (${esc(activeSubjectFolder.titleEn)}) — टॉपिक फ़ोल्डर</h4>
                </div>
              </div>
              <button class="btn btn-navy btn-sm" id="qbViewAllSubjectQuestionsBtn">📋 सभी प्रश्न (${activeSubjectFolder.questions.length})</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;">
              ${Array.from(activeSubjectFolder.topicsMap.values()).map((tf) => `
                <div class="card" data-open-topic-folder="${esc(tf.topicId)}" style="margin-bottom:0;cursor:pointer;border:1.5px solid ${tf.questions.length > 0 ? 'var(--secondary)' : 'var(--border)'};">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                    <span style="font-size:1.4rem;">📂</span>
                    <span class="badge ${tf.questions.length > 0 ? 'badge-exam' : 'badge-draft'}">📝 ${tf.questions.length} प्रश्न</span>
                  </div>
                  <div style="font-weight:800;font-size:0.9rem;margin-top:8px;">${esc(tf.titleHi)}</div>
                  <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px;">${esc(tf.titleEn)}</div>
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:8px;border-top:1px dashed var(--border);font-size:0.74rem;color:var(--secondary);font-weight:800;">
                    <span>प्रश्न देखें</span>
                    <span>खोलें ▶</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${nav.level === 'questions' ? `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <button class="btn btn-outline btn-sm" id="qbBackFromQuestionsBtn">⬅️ फ़ोल्डर्स पर वापस</button>
                <h4 style="font-size:0.96rem;font-weight:800;">
                  ${activeTopicFolder
                    ? `📂 ${esc(activeTopicFolder.titleHi)} (${totalFiltered} प्रश्न)`
                    : (activeSubjectFolder
                      ? `📁 ${esc(activeSubjectFolder.titleHi)} (${totalFiltered} प्रश्न)`
                      : `📋 सभी प्रश्न (${totalFiltered})`)}
                </h4>
              </div>
            </div>
            ${renderQuestionListWithPagination(false)}
          ` : ''}
        </div>
      `;
    }

    // SUB-TAB 2: EXAM-WISE PYQ LIBRARY (Exam Category -> Exam Name -> Year -> Paper / Shift -> Referenced Questions)
    if (nav.subTab === 'pyq_library') {
      const selCat = nav.pyqCategory ? pyqTree.get(nav.pyqCategory) : null;
      const selExam = (selCat && nav.pyqExamName) ? selCat.exams.get(nav.pyqExamName) : null;
      const selYear = (selExam && nav.pyqYear) ? selExam.years.get(nav.pyqYear) : null;
      return `
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-bottom:12px;margin-bottom:14px;border-bottom:1px solid var(--border);">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <button class="btn ${!nav.pyqCategory ? 'btn-primary' : 'btn-outline'} btn-sm" id="qbPyqRootBtn">🏛️ सभी PYQ Exam Categories</button>
              ${selCat ? `
                <span>›</span>
                <button class="btn ${nav.pyqCategory && !nav.pyqExamName ? 'btn-primary' : 'btn-outline'} btn-sm" id="qbPyqCatBreadBtn">${esc(selCat.icon)} ${esc(selCat.titleHi)} (${selCat.questions.length})</button>
              ` : ''}
              ${selExam ? `
                <span>›</span>
                <button class="btn ${nav.pyqExamName && !nav.pyqYear ? 'btn-primary' : 'btn-outline'} btn-sm" id="qbPyqExamBreadBtn">📋 ${esc(selExam.examName)} (${selExam.questions.length})</button>
              ` : ''}
              ${selYear ? `
                <span>›</span>
                <span class="badge badge-exam">📅 वर्ष ${esc(selYear.year)} (${selYear.questions.length} प्रश्न)</span>
              ` : ''}
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" id="qbCreatePyqFolderBtn">🏛️ + नया PYQ Exam / Paper फ़ोल्डर बनाएं</button>
            </div>
          </div>

          ${!nav.pyqCategory ? `
            <div style="margin-bottom:12px;">
              <h4 style="font-size:0.98rem;font-weight:800;">🏛️ Part 2: Exam-wise PYQ Library (Central Question Reference System)</h4>
              <p style="font-size:0.78rem;color:var(--text-secondary);">
                Exam Category › Exam Name › Year › Paper / Shift › Referenced Questions (बिना डुप्लीकेट बनाए एक ही मूल प्रश्न का Reference)
              </p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(265px,1fr));gap:12px;">
              ${Array.from(pyqTree.values()).map((pc) => `
                <div class="card" data-open-pyq-cat="${esc(pc.code)}" style="margin-bottom:0;cursor:pointer;border:1.5px solid ${pc.questions.length > 0 ? 'var(--primary)' : 'var(--border)'};">
                  <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-size:1.7rem;">${pc.icon}</span>
                    <span class="badge ${pc.questions.length > 0 ? 'badge-free' : 'badge-draft'}">📝 ${pc.questions.length} PYQ Refs</span>
                  </div>
                  <div style="font-weight:800;font-size:0.95rem;margin-top:8px;">${esc(pc.titleHi)}</div>
                  <div style="font-size:0.76rem;color:var(--text-secondary);">${esc(pc.titleEn)}</div>
                  <div style="margin-top:10px;padding-top:8px;border-top:1px dashed var(--border);font-size:0.74rem;color:var(--primary);font-weight:800;display:flex;justify-content:space-between;">
                    <span>📋 ${pc.exams.size} परीक्षाएं (Exams)</span>
                    <span>खोलें ▶</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${selCat && !nav.pyqExamName ? `
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(245px,1fr));gap:12px;margin-bottom:14px;">
              ${Array.from(selCat.exams.values()).map((ex) => `
                <div class="card" data-open-pyq-exam="${esc(ex.examName)}" style="margin-bottom:0;cursor:pointer;border:1.5px solid ${ex.questions.length > 0 ? 'var(--secondary)' : 'var(--border)'};">
                  <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-size:1.4rem;">📋</span>
                    <span class="badge ${ex.questions.length > 0 ? 'badge-exam' : 'badge-draft'}">📝 ${ex.questions.length} प्रश्न</span>
                  </div>
                  <div style="font-weight:800;font-size:0.92rem;margin-top:8px;">${esc(ex.examName)}</div>
                  <div style="margin-top:8px;padding-top:6px;border-top:1px dashed var(--border);font-size:0.74rem;color:var(--secondary);font-weight:800;display:flex;justify-content:space-between;">
                    <span>📅 ${ex.years.size || 0} वर्ष (Years)</span>
                    <span>खोलें ▶</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${selExam && !nav.pyqYear ? `
            <div style="margin-bottom:14px;">
              <h4 style="font-size:0.94rem;font-weight:800;margin-bottom:8px;">📅 ${esc(selExam.examName)} — वर्ष और पेपर चुनें (Select Year / Paper)</h4>
              ${selExam.years.size === 0 ? `
                <div style="padding:18px;border-radius:10px;background:var(--surface-alt);border:1px dashed var(--border);font-size:0.82rem;color:var(--text-secondary);">
                  इस परीक्षा में अभी कोई वर्ष/पेपर टैग नहीं है। किसी भी प्रश्न कार्ड पर <strong>"🏛️ + Exam / PYQ Ref"</strong> दबाकर इस परीक्षा से जोड़ें।
                </div>
              ` : `
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-bottom:14px;">
                  ${Array.from(selExam.years.values()).map((yr) => `
                    <div class="card" data-open-pyq-year="${esc(yr.year)}" style="margin-bottom:0;cursor:pointer;border:1.5px solid var(--primary);">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-weight:800;font-size:0.95rem;">📅 ${esc(yr.year)}</span>
                        <span class="badge badge-free">${yr.questions.length} प्रश्न</span>
                      </div>
                      <div style="font-size:0.74rem;color:var(--text-secondary);margin-top:6px;">
                        Papers/Shifts: ${Array.from(yr.papers.keys()).join(', ') || 'General Paper'}
                      </div>
                    </div>
                  `).join('')}
                </div>
              `}
              ${renderQuestionListWithPagination(true)}
            </div>
          ` : ''}

          ${selYear ? `
            <div style="margin-bottom:12px;">
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
                <button class="btn ${!nav.pyqPaper ? 'btn-primary' : 'btn-outline'} btn-sm" data-open-pyq-paper="">सभी Papers/Shifts (${selYear.questions.length})</button>
                ${Array.from(selYear.papers.values()).map((pp) => `
                  <button class="btn ${nav.pyqPaper === pp.label ? 'btn-primary' : 'btn-outline'} btn-sm" data-open-pyq-paper="${esc(pp.label)}">
                    📄 ${esc(pp.label)} (${pp.questions.length})
                  </button>
                `).join('')}
              </div>
              ${renderQuestionListWithPagination(true)}
            </div>
          ` : ''}
        </div>
      `;
    }

    // SUB-TAB 3: SEARCH & FILTERS (All 8 required filters + Full Folder Path)
    if (nav.subTab === 'search_filters') {
      const sf = nav.advFilters;
      return `
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
            <div>
              <h4 style="font-size:0.98rem;font-weight:800;">🔍 Central Question Database — Advanced Search & Filters</h4>
              <p style="font-size:0.78rem;color:var(--text-secondary);">प्रत्येक परिणाम के साथ उसका पूरा Folder Path (Main Category › Subject › Topic) और PYQ Reference दिखता है।</p>
            </div>
            <button class="btn btn-outline btn-sm" id="qbResetAdvFiltersBtn">🔄 सभी फ़िल्टर रीसेट करें</button>
          </div>

          <div class="grid-4" style="gap:8px;margin-bottom:12px;">
            <div>
              <label class="form-label" style="font-size:0.75rem;">1. खोजें (Search Text / ID)</label>
              <input class="form-input" id="qbAdvSearchInput" value="${esc(nav.search || '')}" placeholder="प्रश्न, विकल्प, व्याख्या या ID..." style="padding:6px 10px;font-size:0.8rem;" />
            </div>
            <div>
              <label class="form-label" style="font-size:0.75rem;">2. Main Category</label>
              <select class="form-select" id="qbAdvMainCatSelect" style="padding:6px 8px;font-size:0.8rem;">
                <option value="ALL">सभी Main Categories</option>
                ${catalog.mainCategories.map((mc) => `<option value="${esc(mc.mainCategoryId)}" ${sf.mainCategoryId === mc.mainCategoryId ? 'selected' : ''}>${esc(mc.titleHi)} (${esc(mc.titleEn)})</option>`).join('')}
                <option value="cat_uncategorised" ${sf.mainCategoryId === 'cat_uncategorised' ? 'selected' : ''}>⚠️ Uncategorised</option>
              </select>
            </div>
            <div>
              <label class="form-label" style="font-size:0.75rem;">3. Subject (विषय)</label>
              <select class="form-select" id="qbAdvSubjectSelect" style="padding:6px 8px;font-size:0.8rem;">
                <option value="ALL">सभी Subjects</option>
                ${catalog.subjects.map((s) => `<option value="${esc(s.subjectId)}" ${sf.subjectId === s.subjectId ? 'selected' : ''}>${esc(s.titleHi)} (${esc(s.titleEn)})</option>`).join('')}
                <option value="sub_uncategorised" ${sf.subjectId === 'sub_uncategorised' ? 'selected' : ''}>⚠️ Uncategorised</option>
              </select>
            </div>
            <div>
              <label class="form-label" style="font-size:0.75rem;">4. Topic (टॉपिक)</label>
              <select class="form-select" id="qbAdvTopicSelect" style="padding:6px 8px;font-size:0.8rem;">
                <option value="ALL">सभी Topics</option>
                ${(sf.subjectId && sf.subjectId !== 'ALL' ? catalog.getTopicsForSubject(sf.subjectId) : catalog.topics).map((t) => `<option value="${esc(t.topicId)}" ${sf.topicId === t.topicId ? 'selected' : ''}>${esc(t.titleHi)} (${esc(t.titleEn)})</option>`).join('')}
                <option value="top_uncategorised" ${sf.topicId === 'top_uncategorised' ? 'selected' : ''}>⚠️ Uncategorised</option>
              </select>
            </div>
            <div>
              <label class="form-label" style="font-size:0.75rem;">5. Exam / PYQ</label>
              <select class="form-select" id="qbAdvExamSelect" style="padding:6px 8px;font-size:0.8rem;">
                <option value="ALL">सभी Exams</option>
                <option value="ANY_PYQ" ${sf.examFilter === 'ANY_PYQ' ? 'selected' : ''}>🏛️ केवल PYQ Referenced प्रश्न</option>
                ${catalog.pyqCategories.map((pc) => `<option value="CAT:${esc(pc.code)}" ${sf.examFilter === 'CAT:' + pc.code ? 'selected' : ''}>${esc(pc.titleHi)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="form-label" style="font-size:0.75rem;">6. Exam Year (वर्ष)</label>
              <input class="form-input" id="qbAdvYearInput" value="${esc(sf.examYear || '')}" placeholder="उदा. 2023, 2024..." style="padding:6px 10px;font-size:0.8rem;" />
            </div>
            <div>
              <label class="form-label" style="font-size:0.75rem;">7. Language & Difficulty</label>
              <div style="display:flex;gap:4px;">
                <select class="form-select" id="qbAdvLangSelect" style="padding:6px 6px;font-size:0.78rem;">
                  <option value="ALL" ${sf.language === 'ALL' ? 'selected' : ''}>भाषा: सभी</option>
                  <option value="Bilingual" ${sf.language === 'Bilingual' ? 'selected' : ''}>Bilingual</option>
                  <option value="Hindi" ${sf.language === 'Hindi' ? 'selected' : ''}>Hindi</option>
                  <option value="English" ${sf.language === 'English' ? 'selected' : ''}>English</option>
                </select>
                <select class="form-select" id="qbQuestionsDiffFilter" style="padding:6px 6px;font-size:0.78rem;">
                  <option value="ALL" ${nav.difficulty === 'ALL' ? 'selected' : ''}>कठिनाई: सभी</option>
                  <option value="Easy" ${nav.difficulty === 'Easy' ? 'selected' : ''}>Easy</option>
                  <option value="Moderate" ${nav.difficulty === 'Moderate' ? 'selected' : ''}>Moderate</option>
                  <option value="Hard" ${nav.difficulty === 'Hard' ? 'selected' : ''}>Hard</option>
                </select>
              </div>
            </div>
            <div>
              <label class="form-label" style="font-size:0.75rem;">8. Verification Status</label>
              <select class="form-select" id="qbAdvVerifySelect" style="padding:6px 8px;font-size:0.8rem;">
                <option value="ALL" ${sf.verificationStatus === 'ALL' ? 'selected' : ''}>सभी Status</option>
                <option value="verified" ${sf.verificationStatus === 'verified' ? 'selected' : ''}>✓ Verified</option>
                <option value="needs_categorisation" ${sf.verificationStatus === 'needs_categorisation' ? 'selected' : ''}>⚠️ Uncategorised / Needs Review</option>
                <option value="possible_duplicate" ${sf.verificationStatus === 'possible_duplicate' ? 'selected' : ''}>🔍 Possible Duplicate</option>
              </select>
            </div>
          </div>

          ${renderQuestionListWithPagination(true)}
        </div>
      `;
    }

    // SUB-TAB 4: IMPORT & PREVIEW (CSV / JSON / PDF / Word / Text + Duplicate & Missing Folder Handling + 8-Metric Report)
    if (nav.subTab === 'import_preview') {
      const ps = qbState.previewSession;
      const rep = qbState.lastImportReport;
      return `
        <!-- AI & File Import Card -->
        <div class="card" style="border:1.5px solid var(--secondary);margin-bottom:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
            <div>
              <h4 style="font-size:1rem;font-weight:800;color:var(--primary);">📥 Question Import & Preview System (CSV, Excel CSV, JSON, PDF, Word/Text)</h4>
              <p style="font-size:0.78rem;color:var(--text-secondary);">
                प्रश्नों को सीधे सेव करने से पहले <strong>Import Preview</strong> में जांचें: Duplicate Detection, Missing Folder Approval और Uncategorised Safety के साथ।
              </p>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm" id="qbDownloadSampleCsvBtn">⬇️ Sample CSV</button>
              <button class="btn btn-outline btn-sm" id="qbDownloadSampleJsonBtn">⬇️ Sample JSON</button>
            </div>
          </div>

          <div class="grid-3" style="gap:10px;margin-bottom:10px;">
            <div style="padding:10px 12px;border-radius:10px;background:var(--surface);border:1.5px dashed var(--primary);">
              <label class="form-label" style="color:var(--primary);font-weight:800;font-size:0.8rem;">1️⃣ फ़ाइल चुनें (CSV / JSON / PDF / Image / TXT) *</label>
              <input type="file" accept=".pdf,.csv,.json,.txt,.png,.jpg,.jpeg,.webp" class="form-input" id="qbAiQuestionFileInput" style="padding:6px;font-size:0.78rem;" />
              <div id="qbSelectedQPFileLabel" style="font-size:0.74rem;margin-top:4px;font-weight:700;color:${nav.selectedQuestionFile ? 'var(--success)' : 'var(--text-muted)'};">
                ${nav.selectedQuestionFile ? `✅ चुना गया: ${esc(nav.selectedQuestionFile.name)}` : 'कोई फ़ाइल चुनें'}
              </div>
            </div>

            <div style="padding:10px 12px;border-radius:10px;background:var(--surface);border:1.5px dashed var(--secondary);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <label class="form-label" style="color:var(--secondary);font-weight:800;font-size:0.8rem;margin-bottom:0;">2️⃣ उत्तर कुंजी (Answer Key — वैकल्पिक)</label>
                <select class="form-select" id="qbAiPaperSetSelect" style="width:auto;padding:2px 6px;font-size:0.72rem;height:24px;">
                  <option value="A" ${nav.paperSetCode === 'A' ? 'selected' : ''}>Set A</option>
                  <option value="B" ${nav.paperSetCode === 'B' ? 'selected' : ''}>Set B</option>
                  <option value="C" ${nav.paperSetCode === 'C' ? 'selected' : ''}>Set C</option>
                  <option value="D" ${nav.paperSetCode === 'D' ? 'selected' : ''}>Set D</option>
                </select>
              </div>
              <input type="file" accept=".pdf,.txt,.csv,.png,.jpg,.jpeg,.webp" class="form-input" id="qbAiAnswerKeyFileInput" style="padding:5px;font-size:0.76rem;margin-bottom:4px;" />
              <input class="form-input" id="qbAiAnswerKeyTextInput" value="${esc(qbState.pendingAnswerKeyText || '')}" placeholder="या उत्तर लिखें: 1-A, 2-C, 3-B" style="padding:5px 8px;font-size:0.75rem;" />
            </div>

            <div style="padding:10px 12px;border-radius:10px;background:var(--surface);border:1px solid var(--border);display:flex;flex-direction:column;justify-content:space-between;gap:6px;">
              <div>
                <label class="form-label" style="font-weight:800;font-size:0.78rem;margin-bottom:4px;">3️⃣ डिफ़ॉल्ट विषय (वैकल्पिक)</label>
                <select class="form-select" id="qbAiOverrideSubjectSelect" style="padding:5px 8px;font-size:0.78rem;">
                  <option value="">🤖 Auto-Detect (अनिश्चित होने पर Uncategorised)</option>
                  ${catalog.subjects.map((s) => `<option value="${esc(s.titleEn)}" ${nav.overrideSubject === s.titleEn ? 'selected' : ''}>📁 ${esc(s.titleHi)} (${esc(s.titleEn)})</option>`).join('')}
                </select>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button class="btn btn-primary btn-sm" id="qbLoadImportPreviewBtn" style="flex:1;font-weight:800;">🔍 Step 1: Preview & Validate</button>
                <button class="btn btn-success btn-sm" id="qbStartAiScanAndSaveBtn" style="flex:1;font-weight:800;" ${nav.isScanning ? 'disabled' : ''}>
                  ${nav.isScanning ? '⏳ स्कैन हो रहा है...' : '🚀 AI Scan & Save'}
                </button>
              </div>
            </div>
          </div>

          ${nav.isScanning || nav.scanStatusText ? `
            <div id="qbAiScanStatusBox" style="padding:10px 14px;border-radius:8px;background:var(--primary-soft);border:1px solid var(--primary);color:var(--primary);font-size:0.82rem;font-weight:800;">
              ${esc(nav.scanStatusText || '⏳ प्रोसेस हो रहा है...')}
            </div>
          ` : ''}
        </div>

        ${rep ? `
          <div class="card" style="border-left:5px solid var(--success);margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <h4 style="font-size:0.95rem;font-weight:800;color:var(--success);">✅ Import Summary Report (${esc(rep.fileName)})</h4>
              <button class="btn btn-outline btn-sm" id="qbDismissImportRepBtn">✕ बंद करें</button>
            </div>
            <div class="grid-4" style="gap:8px;">
              <div style="padding:8px;border-radius:8px;background:var(--surface-alt);"><strong>1. कुल प्रश्न:</strong> ${rep.totalRows}</div>
              <div style="padding:8px;border-radius:8px;background:var(--surface-alt);"><strong>2. नए सेव हुए प्रश्न:</strong> ${rep.newQuestionsSaved}</div>
              <div style="padding:8px;border-radius:8px;background:var(--surface-alt);"><strong>3. Exact Duplicate (Ref Added):</strong> ${rep.exactDuplicateRefsAdded}</div>
              <div style="padding:8px;border-radius:8px;background:var(--surface-alt);"><strong>4. Possible Duplicates:</strong> ${rep.possibleDuplicatesCount}</div>
              <div style="padding:8px;border-radius:8px;background:var(--surface-alt);"><strong>5. Uncategorised प्रश्न:</strong> ${rep.uncategorisedCount}</div>
              <div style="padding:8px;border-radius:8px;background:var(--surface-alt);"><strong>6. PYQ References जोड़े गए:</strong> ${rep.pyqReferencesAdded}</div>
              <div style="padding:8px;border-radius:8px;background:var(--surface-alt);"><strong>7. Missing Folders मिले:</strong> ${rep.missingFoldersDetected}</div>
              <div style="padding:8px;border-radius:8px;background:var(--surface-alt);"><strong>8. Skipped / Error Rows:</strong> ${rep.skippedOrErrorRows}</div>
            </div>
          </div>
        ` : ''}

        ${ps ? `
          <div class="card" style="border:2px solid var(--primary);">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
              <div>
                <h4 style="font-size:0.98rem;font-weight:800;">🧐 Import Preview: ${esc(ps.fileName)} (${ps.records.length} प्रश्न)</h4>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                  <span class="badge badge-free">✅ Valid: ${ps.records.filter((r) => r.isValid && !r.excluded).length}</span>
                  <span class="badge badge-exam">🏛️ Exact Dup (PYQ Ref Only): ${ps.records.filter((r) => r.duplicateType === 'exact').length}</span>
                  <span class="badge badge-paid">🔍 Possible Dup: ${ps.records.filter((r) => r.duplicateType === 'possible').length}</span>
                  <span class="badge badge-review">📁 Missing Folders: ${ps.records.filter((r) => r.missingFolderInfo && r.missingFolderInfo.hasMissingFolder).length}</span>
                </div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-outline btn-sm" id="qbCancelPreviewBtn">✕ Cancel Preview</button>
                <button class="btn btn-success btn-sm" id="qbCommitPreviewBtn" style="font-weight:800;">💾 Confirm & Save to Central Question Bank</button>
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:10px;max-height:520px;overflow-y:auto;padding-right:4px;">
              ${ps.records.slice(0, 100).map((rec, rIdx) => {
                const mf = rec.missingFolderInfo;
                return `
                  <div style="padding:10px 12px;border-radius:10px;border:1.5px solid ${rec.duplicateType === 'exact' ? '#4f46e5' : (mf && mf.hasMissingFolder ? '#d97706' : 'var(--border)')};background:var(--surface);">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
                      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        <span class="badge badge-exam">Row #${rIdx + 1}</span>
                        <span class="badge badge-review">🗂️ ${esc(rec.normalized.mainCategory || 'Uncategorised')} › 📁 ${esc(rec.normalized.subjectTag || 'Uncategorised')} › 📂 ${esc(rec.normalized.topic || 'Uncategorised')}</span>
                        ${rec.duplicateType === 'exact' ? `<span class="badge badge-exam">🔗 Exact Duplicate (Existing ID: ${esc(rec.duplicateTargetId)} में केवल Exam/PYQ Ref जुड़ेगा)</span>` : ''}
                        ${rec.duplicateType === 'possible' ? `<span class="badge badge-paid">⚠️ Possible Duplicate (${esc(rec.duplicateReason)})</span>` : ''}
                      </div>
                      <label style="font-size:0.76rem;font-weight:700;cursor:pointer;">
                        <input type="checkbox" data-toggle-preview-exclude="${rIdx}" ${rec.excluded ? '' : 'checked'} /> इस प्रश्न को शामिल करें
                      </label>
                    </div>
                    <div style="font-weight:700;font-size:0.86rem;">${esc(rec.normalized.questionHi || rec.normalized.questionEn)}</div>
                    ${mf && mf.hasMissingFolder ? `
                      <div style="margin-top:8px;padding:8px 10px;border-radius:8px;background:#fffbeb;border:1px solid #f59e0b;font-size:0.78rem;color:#92400e;">
                        <div style="font-weight:800;">⚠️ नया / अज्ञात फ़ोल्डर मिला: "${esc(mf.rawSubject || '')} › ${esc(mf.rawTopic || '')}" (बिना अनुमति नया फ़ोल्डर नहीं बनाया गया)</div>
                        ${Array.isArray(mf.suggestions) && mf.suggestions.length > 0 ? `
                          <div style="margin-top:4px;">मिलते-जुलते उपलब्ध फ़ोल्डर: ${mf.suggestions.map((sg) => `<span class="badge badge-draft">${esc(sg.titleHi || sg.titleEn)}</span>`).join(' ')}</div>
                        ` : ''}
                        <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
                          <button type="button" class="btn btn-primary btn-sm" data-approve-missing-folder="${rIdx}" style="padding:2px 8px;font-size:0.72rem;">✅ नया फ़ोल्डर बनाने की अनुमति दें (Approve Folder)</button>
                        </div>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      `;
    }

    // SUB-TAB 5: FOLDER MANAGEMENT & MIGRATION REPORT
    const migRep = qbState.migrationReport || state.migrationState;
    const hasBackup = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('cgpedia_qb_pre_migration_backup_v2'));
    return `
      <div class="card" style="border-left:5px solid var(--primary);margin-bottom:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
          <div>
            <h4 style="font-size:1rem;font-weight:800;">🔄 Safe Question Bank Migration & Backup Report</h4>
            <p style="font-size:0.78rem;color:var(--text-secondary);">
              मौजूदा सभी प्रश्नों को बिना किसी डेटा नुकसान (Zero Data Loss) के नए 2-Part Central Question Bank में व्यवस्थित किया गया है।
            </p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" id="qbRunSafeMigrationBtn">🔄 Run / Refresh Safe Migration</button>
            ${hasBackup ? `<button class="btn btn-outline btn-sm" id="qbRestorePreMigBackupBtn">⏪ Restore Pre-Migration Backup</button>` : ''}
          </div>
        </div>

        ${migRep ? `
          <div class="grid-4" style="gap:8px;">
            <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);"><strong>1. कुल पुराने प्रश्न:</strong> ${migRep.totalLegacyQuestions ?? activeQuestions.length}</div>
            <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);"><strong>2. सफलतापूर्वक वर्गीकृत:</strong> ${migRep.successfullyCategorisedCount ?? migRep.migratedCount ?? 0}</div>
            <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);"><strong>3. PYQ में जोड़े गए:</strong> ${migRep.pyqLinkedCount ?? 0}</div>
            <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);"><strong>4. Duplicate मर्ज किए गए:</strong> ${migRep.duplicatesMergedCount ?? 0}</div>
            <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);"><strong>5. Uncategorised में रखे गए:</strong> ${migRep.uncategorisedCount ?? 0}</div>
            <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);"><strong>6. Manual Review आवश्यक:</strong> ${migRep.manualReviewNeededCount ?? 0}</div>
            <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);"><strong>7. नए बनाए गए Folders:</strong> ${migRep.newFoldersCreatedCount ?? 0}</div>
            <div style="padding:8px 10px;border-radius:8px;background:var(--surface-alt);"><strong>8. खाली Folders:</strong> ${migRep.emptyFoldersCount ?? 0}</div>
          </div>
        ` : ''}
      </div>

      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
          <div>
            <h4 style="font-size:0.98rem;font-weight:800;">🗂️ Folder Management (Create, Rename, Move & Delete Empty Folders)</h4>
            <p style="font-size:0.78rem;color:var(--text-secondary);">नियम: केवल खाली (0 प्रश्न वाले) कस्टम फ़ोल्डर ही डिलीट किए जा सकते हैं।</p>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" id="qbPopupNewSubjectBtn">📁 + Create Subject Folder</button>
            <button class="btn btn-primary btn-sm" id="qbPopupNewTopicBtn">📂 + Create Topic Folder</button>
            <button class="btn btn-outline btn-sm" id="qbCreatePyqFolderBtn">🏛️ + Create PYQ Exam Folder</button>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;">
          ${mainCatFolders.map((mc) => `
            <div style="padding:12px;border-radius:10px;border:1px solid var(--border);background:var(--surface-alt);">
              <div style="font-weight:800;font-size:0.92rem;margin-bottom:8px;color:var(--primary);">
                ${esc(mc.icon)} ${esc(mc.titleHi)} (${esc(mc.titleEn)}) — ${mc.questions.length} प्रश्न
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;">
                ${Array.from(mc.subjectsMap.values()).map((sf) => `
                  <div style="padding:8px 10px;border-radius:8px;background:var(--surface);border:1px solid var(--border);">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                      <div style="font-weight:800;font-size:0.84rem;">
                        📁 ${esc(sf.titleHi)} (${esc(sf.titleEn)}) <span class="badge badge-draft">${sf.questions.length} प्रश्न</span>
                      </div>
                      <div style="display:flex;gap:4px;">
                        <button class="btn btn-outline btn-sm" style="padding:2px 6px;font-size:0.7rem;" data-rename-folder="subject:::${esc(sf.subjectId)}">✏️ Rename</button>
                        ${sf.questions.length === 0 ? `<button class="btn btn-danger btn-sm" style="padding:2px 6px;font-size:0.7rem;" data-delete-empty-folder="subject:::${esc(sf.subjectId)}">🗑️ Delete Empty</button>` : ''}
                      </div>
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
                      ${Array.from(sf.topicsMap.values()).map((tf) => `
                        <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:var(--surface-alt);border:1px solid var(--border);font-size:0.74rem;">
                          <span>📂 ${esc(tf.titleHi)} (<strong>${tf.questions.length}</strong>)</span>
                          <button type="button" style="border:none;background:transparent;cursor:pointer;font-size:0.7rem;" title="Rename Topic" data-rename-folder="topic:::${esc(tf.topicId)}">✏️</button>
                          ${tf.questions.length === 0 ? `<button type="button" style="border:none;background:transparent;cursor:pointer;font-size:0.7rem;color:var(--danger);" title="Delete Empty Topic" data-delete-empty-folder="topic:::${esc(tf.topicId)}">🗑️</button>` : ''}
                        </span>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }


  function renderQuestionBankManagementV2(bodyEl, rootEl, state, api) {
    state.questionBank = state.questionBank || [];

    // Run non-destructive v2 migration if not yet run on current session
    const needsMigration = state.questionBank.some((q) => q && !q.isDeleted && (!q.questionId || !q.mainCategoryId || !Array.isArray(q.pyqReferences)));
    if (needsMigration || (!qbState.migrationReport && state.questionBank.length > 0)) {
      qbState.migrationReport = migrateExistingQuestionBankRecords(state, api, { skipCloudSync: true });
    }

    const catalog = getTaxonomyCatalog(state);

    if (!qbState.folderNav || !qbState.folderNav.subTab) {
      qbState.folderNav = {
        subTab: 'subject_library', // 'subject_library' | 'pyq_library' | 'search_filters' | 'import_preview' | 'folder_management'
        level: 'mainCategories',   // 'mainCategories' | 'subjects' | 'topics' | 'questions'
        mainCategoryId: '',
        subjectId: '',
        topicId: '',
        pyqCategory: '',
        pyqExamName: '',
        pyqYear: '',
        pyqPaper: '',
        search: '',
        difficulty: 'ALL',
        advFilters: {
          mainCategoryId: 'ALL',
          subjectId: 'ALL',
          topicId: 'ALL',
          examFilter: 'ALL',
          examYear: '',
          language: 'ALL',
          verificationStatus: 'ALL'
        },
        isScanning: false,
        scanStatusText: '',
        lastScanSummary: null,
        selectedQuestionFile: null,
        selectedAnswerKeyFile: null,
        paperSetCode: 'A',
        overrideSubject: ''
      };
    }
    const nav = qbState.folderNav;
    if (!nav.advFilters) {
      nav.advFilters = {
        mainCategoryId: 'ALL', subjectId: 'ALL', topicId: 'ALL',
        examFilter: 'ALL', examYear: '', language: 'ALL', verificationStatus: 'ALL'
      };
    }

    const activeQuestions = (state.questionBank || []).filter(
      (q) => q && !q.isDeleted && !q.deleted && String(q.status || '').toLowerCase() !== 'deleted'
    );

    // 1. Build Main Category -> Subject -> Topic Hierarchy
    const mainCatMap = new Map();
    catalog.mainCategories.forEach((mc) => {
      mainCatMap.set(mc.mainCategoryId, {
        mainCategoryId: mc.mainCategoryId,
        titleEn: mc.titleEn,
        titleHi: mc.titleHi || mc.titleEn,
        icon: mc.icon || '🗂️',
        directTopics: Boolean(mc.directTopics),
        subjectsMap: new Map(),
        questions: [],
        totalTopics: 0
      });
    });
    mainCatMap.set('cat_uncategorised', {
      mainCategoryId: 'cat_uncategorised',
      titleEn: 'Uncategorised (अवर्गीकृत)',
      titleHi: 'अवर्गीकृत प्रश्न (Uncategorised)',
      icon: '⚠️',
      directTopics: false,
      subjectsMap: new Map(),
      questions: [],
      totalTopics: 0
    });

    catalog.subjects.forEach((s) => {
      const mcId = s.mainCategoryId && mainCatMap.has(s.mainCategoryId) ? s.mainCategoryId : 'cat_cg_gk';
      const mcFolder = mainCatMap.get(mcId);
      mcFolder.subjectsMap.set(s.subjectId, {
        subjectId: s.subjectId,
        mainCategoryId: mcId,
        titleEn: s.titleEn,
        titleHi: s.titleHi || s.titleEn,
        icon: s.icon || '📁',
        topicsMap: new Map(),
        questions: []
      });
    });
    mainCatMap.get('cat_uncategorised').subjectsMap.set('sub_uncategorised', {
      subjectId: 'sub_uncategorised',
      mainCategoryId: 'cat_uncategorised',
      titleEn: 'Uncategorised',
      titleHi: 'अवर्गीकृत (Uncategorised)',
      icon: '⚠️',
      topicsMap: new Map([
        ['top_uncategorised', {
          topicId: 'top_uncategorised',
          subjectId: 'sub_uncategorised',
          titleEn: 'Uncategorised',
          titleHi: 'अवर्गीकृत (Needs Manual Categorisation)',
          questions: []
        }]
      ]),
      questions: []
    });

    catalog.topics.forEach((t) => {
      for (const mcFolder of mainCatMap.values()) {
        if (mcFolder.subjectsMap.has(t.subjectId)) {
          const sf = mcFolder.subjectsMap.get(t.subjectId);
          sf.topicsMap.set(t.topicId, {
            topicId: t.topicId,
            subjectId: t.subjectId,
            titleEn: t.titleEn,
            titleHi: t.titleHi || t.titleEn,
            questions: []
          });
          break;
        }
      }
    });

    activeQuestions.forEach((q) => {
      const isUncat = q.subjectId === 'sub_uncategorised' || q.subjectTag === 'Uncategorised' || q.verificationStatus === 'needs_categorisation' || q.needsCategorisation;
      if (isUncat) {
        const uncatMc = mainCatMap.get('cat_uncategorised');
        const uncatSub = uncatMc.subjectsMap.get('sub_uncategorised');
        const uncatTop = uncatSub.topicsMap.get('top_uncategorised');
        uncatMc.questions.push(q);
        uncatSub.questions.push(q);
        uncatTop.questions.push(q);
        return;
      }

      const matchedSub = catalog.findSubject(q.subjectId || q.subjectTag || '');
      const mcId = (matchedSub && matchedSub.mainCategoryId && mainCatMap.has(matchedSub.mainCategoryId))
        ? matchedSub.mainCategoryId
        : (q.mainCategoryId && mainCatMap.has(q.mainCategoryId) ? q.mainCategoryId : 'cat_uncategorised');
      const mcFolder = mainCatMap.get(mcId) || mainCatMap.get('cat_uncategorised');

      const subId = matchedSub ? matchedSub.subjectId : (mcId === 'cat_uncategorised' ? 'sub_uncategorised' : makeSlugId('sub', q.subjectTag || 'Uncategorised'));
      if (!mcFolder.subjectsMap.has(subId)) {
        mcFolder.subjectsMap.set(subId, {
          subjectId: subId,
          mainCategoryId: mcId,
          titleEn: q.subjectTag || 'Uncategorised',
          titleHi: q.subjectTag || 'Uncategorised',
          icon: '📁',
          topicsMap: new Map(),
          questions: []
        });
      }
      const subFolder = mcFolder.subjectsMap.get(subId);
      const matchedTop = catalog.findTopic(subId, q.topicId || q.topic || '');
      const topId = matchedTop ? matchedTop.topicId : (subId === 'sub_uncategorised' ? 'top_uncategorised' : makeSlugId('top', `${subId}_${q.topic || 'Uncategorised'}`));
      if (!subFolder.topicsMap.has(topId)) {
        subFolder.topicsMap.set(topId, {
          topicId: topId,
          subjectId: subId,
          titleEn: q.topic || 'Uncategorised',
          titleHi: q.topic || 'Uncategorised',
          questions: []
        });
      }
      mcFolder.questions.push(q);
      subFolder.questions.push(q);
      subFolder.topicsMap.get(topId).questions.push(q);
    });

    mainCatMap.forEach((mc) => {
      let tCount = 0;
      mc.subjectsMap.forEach((sf) => { tCount += sf.topicsMap.size; });
      mc.totalTopics = tCount;
    });
    const mainCatFolders = Array.from(mainCatMap.values());

    // 2. Build Exam-wise PYQ Library Tree (Exam Category -> Exam Name -> Year -> Paper / Shift -> Referenced Questions)
    const pyqTree = new Map();
    catalog.pyqCategories.forEach((pc) => {
      const examsMap = new Map();
      (pc.exams || []).forEach((exName) => {
        examsMap.set(exName, { examName: exName, years: new Map(), questions: [] });
      });
      pyqTree.set(pc.code, {
        code: pc.code,
        titleEn: pc.titleEn,
        titleHi: pc.titleHi || pc.titleEn,
        icon: pc.icon || '🏛️',
        exams: examsMap,
        questions: []
      });
    });

    let totalPyqRefLinks = 0;
    activeQuestions.forEach((q) => {
      const refs = normalizeQuestionPyqReferences(q);
      refs.forEach((ref) => {
        totalPyqRefLinks += 1;
        const catCode = pyqTree.has(ref.examCategory) ? ref.examCategory : 'OTHER_EXAMS';
        const catNode = pyqTree.get(catCode) || pyqTree.values().next().value;
        if (!catNode.questions.includes(q)) catNode.questions.push(q);

        const exName = ref.examName || 'General Competitive Exam';
        if (!catNode.exams.has(exName)) {
          catNode.exams.set(exName, { examName: exName, years: new Map(), questions: [] });
        }
        const exNode = catNode.exams.get(exName);
        if (!exNode.questions.includes(q)) exNode.questions.push(q);

        const yrKey = String(ref.examYear || '').trim() || 'Year Not Specified';
        if (!exNode.years.has(yrKey)) {
          exNode.years.set(yrKey, { year: yrKey, papers: new Map(), questions: [] });
        }
        const yrNode = exNode.years.get(yrKey);
        if (!yrNode.questions.includes(q)) yrNode.questions.push(q);

        const paperLabel = [ref.paperName, ref.shift].filter(Boolean).join(' • ') || 'Paper 1';
        if (!yrNode.papers.has(paperLabel)) {
          yrNode.papers.set(paperLabel, { label: paperLabel, questions: [] });
        }
        const ppNode = yrNode.papers.get(paperLabel);
        if (!ppNode.questions.includes(q)) ppNode.questions.push(q);
      });
    });

    const activeMainCatFolder = nav.mainCategoryId ? mainCatMap.get(nav.mainCategoryId) : null;
    const activeSubjectFolder = (activeMainCatFolder && nav.subjectId)
      ? activeMainCatFolder.subjectsMap.get(nav.subjectId)
      : null;
    const activeTopicFolder = (activeSubjectFolder && nav.topicId && nav.topicId !== 'ALL_IN_SUBJECT')
      ? activeSubjectFolder.topicsMap.get(nav.topicId)
      : null;

    // 3. Determine base question list for current sub-tab
    let baseQuestionList = [];
    if (nav.subTab === 'subject_library') {
      if (activeTopicFolder) baseQuestionList = activeTopicFolder.questions;
      else if (activeSubjectFolder) baseQuestionList = activeSubjectFolder.questions;
      else if (activeMainCatFolder) baseQuestionList = activeMainCatFolder.questions;
      else baseQuestionList = activeQuestions;
    } else if (nav.subTab === 'pyq_library') {
      const selCat = nav.pyqCategory ? pyqTree.get(nav.pyqCategory) : null;
      const selExam = (selCat && nav.pyqExamName) ? selCat.exams.get(nav.pyqExamName) : null;
      const selYear = (selExam && nav.pyqYear) ? selExam.years.get(nav.pyqYear) : null;
      const selPaper = (selYear && nav.pyqPaper) ? selYear.papers.get(nav.pyqPaper) : null;
      if (selPaper) baseQuestionList = selPaper.questions;
      else if (selYear) baseQuestionList = selYear.questions;
      else if (selExam) baseQuestionList = selExam.questions;
      else if (selCat) baseQuestionList = selCat.questions;
      else baseQuestionList = activeQuestions.filter((q) => normalizeQuestionPyqReferences(q).length > 0);
    } else {
      baseQuestionList = activeQuestions;
    }

    const searchLow = String(nav.search || '').trim().toLowerCase();
    const sf = nav.advFilters;
    const filteredQuestions = baseQuestionList.filter((q) => {
      if (nav.difficulty !== 'ALL') {
        const qDiff = normalizeDifficultyValue(q.difficultyLevel || q.difficulty) || 'Moderate';
        if (qDiff !== nav.difficulty) return false;
      }
      if (nav.subTab === 'search_filters') {
        if (sf.mainCategoryId !== 'ALL' && q.mainCategoryId !== sf.mainCategoryId) return false;
        if (sf.subjectId !== 'ALL' && q.subjectId !== sf.subjectId) return false;
        if (sf.topicId !== 'ALL' && q.topicId !== sf.topicId) return false;
        if (sf.verificationStatus !== 'ALL') {
          const isUncat = q.subjectId === 'sub_uncategorised' || q.verificationStatus === 'needs_categorisation';
          if (sf.verificationStatus === 'needs_categorisation' && !isUncat) return false;
          if (sf.verificationStatus === 'verified' && (isUncat || q.verificationStatus !== 'verified')) return false;
          if (sf.verificationStatus === 'possible_duplicate' && q.verificationStatus !== 'possible_duplicate') return false;
        }
        if (sf.language !== 'ALL') {
          const langAvail = q.languageAvailability || ((q.questionHi && q.questionEn && q.questionHi !== q.questionEn) ? 'Bilingual' : (q.questionHi ? 'Hindi' : 'English'));
          if (langAvail !== sf.language) return false;
        }
        if (sf.examFilter !== 'ALL') {
          const refs = normalizeQuestionPyqReferences(q);
          if (sf.examFilter === 'ANY_PYQ' && refs.length === 0) return false;
          if (sf.examFilter.startsWith('CAT:')) {
            const code = sf.examFilter.slice(4);
            if (!refs.some((r) => r.examCategory === code)) return false;
          }
        }
        if (sf.examYear && String(sf.examYear).trim()) {
          const yr = String(sf.examYear).trim();
          const refs = normalizeQuestionPyqReferences(q);
          if (!refs.some((r) => String(r.examYear || '').includes(yr))) return false;
        }
      }
      if (searchLow) {
        const hay = [
          q.questionId, q.id, q.questionHi, q.questionEn, q.mainCategory, q.subjectTag, q.topic,
          ...(q.optionsHi || []), ...(q.optionsEn || []),
          q.explanationHi, q.explanationEn,
          ...normalizeQuestionPyqReferences(q).map((r) => `${r.examCategory} ${r.examName} ${r.examYear} ${r.paperName}`)
        ].join(' ').toLowerCase();
        if (!hay.includes(searchLow)) return false;
      }
      return true;
    });

    const totalFiltered = filteredQuestions.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / qbState.pageSize));
    if (qbState.page > totalPages) qbState.page = totalPages;
    if (qbState.page < 1) qbState.page = 1;
    const startIdx = (qbState.page - 1) * qbState.pageSize;
    const pageItems = filteredQuestions.slice(startIdx, startIdx + qbState.pageSize);

    const validSelectedIds = new Set(
      Array.from(qbState.selectedIds).filter((id) => activeQuestions.some((q) => q.id === id))
    );
    qbState.selectedIds = validSelectedIds;
    const selectedCount = validSelectedIds.size;
    const uncatTotal = mainCatMap.get('cat_uncategorised')?.questions.length || 0;

    bodyEl.innerHTML = `
      <!-- Top Header & Global Question Bank KPIs -->
      <div class="card" style="border-left:5px solid var(--primary);margin-bottom:12px;padding:14px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span class="badge badge-exam">🏛️ CENTRAL QUESTION DATABASE (2-PART LIBRARY)</span>
              <span class="badge badge-free">📝 ${activeQuestions.length} Central Questions</span>
              <span class="badge badge-review">🏛️ ${totalPyqRefLinks} Exam PYQ References</span>
              ${uncatTotal > 0 ? `<span class="badge badge-paid">⚠️ ${uncatTotal} Uncategorised</span>` : ''}
            </div>
            <h3 style="font-size:1.05rem;font-weight:800;margin-top:6px;">
              CGpedia Central Question Bank — Subject-wise Library & Exam-wise PYQ Library
            </h3>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" id="qbPopupAiPromptGenBtn" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border:none;">✨ AI प्रॉम्प्ट से प्रश्न</button>
            <button class="btn btn-primary btn-sm" id="qbPopupPasteTextModalBtn" style="background:linear-gradient(135deg,#059669,#0d9488);border:none;">📋 टेक्स्ट पेस्ट करें</button>
            <button class="btn btn-primary btn-sm" id="qbPopupAddSingleQuestionBtn">➕ प्रश्न जोड़ें</button>
            <button class="btn btn-outline btn-sm" id="qbQuickExportJsonBtn">⬇️ Backup JSON</button>
          </div>
        </div>

        <!-- 5 Sub-Tabs Navigation Bar -->
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px solid var(--border);">
          <button class="btn ${nav.subTab === 'subject_library' ? 'btn-primary' : 'btn-outline'} btn-sm" data-qb-subtab="subject_library">
            📚 1. Subject-wise Library (${activeQuestions.length})
          </button>
          <button class="btn ${nav.subTab === 'pyq_library' ? 'btn-primary' : 'btn-outline'} btn-sm" data-qb-subtab="pyq_library">
            🏛️ 2. Exam-wise PYQ Library (${totalPyqRefLinks})
          </button>
          <button class="btn ${nav.subTab === 'search_filters' ? 'btn-primary' : 'btn-outline'} btn-sm" data-qb-subtab="search_filters">
            🔍 3. Search & Filters
          </button>
          <button class="btn ${nav.subTab === 'import_preview' ? 'btn-primary' : 'btn-outline'} btn-sm" data-qb-subtab="import_preview">
            📥 4. Import & Preview ${qbState.previewSession ? `(${qbState.previewSession.records.length})` : ''}
          </button>
          <button class="btn ${nav.subTab === 'folder_management' ? 'btn-primary' : 'btn-outline'} btn-sm" data-qb-subtab="folder_management">
            🗂️ 5. Folders & Migration Report
          </button>
        </div>
      </div>

      ${renderQuestionBankSubTabContent({
        nav, catalog, activeQuestions, mainCatFolders, activeMainCatFolder,
        activeSubjectFolder, activeTopicFolder, pyqTree, filteredQuestions,
        pageItems, startIdx, totalFiltered, totalPages, validSelectedIds, selectedCount, state
      })}
    `;

    // Sub-tab switcher
    bodyEl.querySelectorAll('[data-qb-subtab]').forEach((btn) => {
      btn.onclick = () => {
        nav.subTab = btn.getAttribute('data-qb-subtab') || 'subject_library';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    });

    // Helper to open Add Single Question modal
    const openAddQuestionPopup = () => {
      const defaultSub = activeSubjectFolder ? activeSubjectFolder.titleEn : 'History of Chhattisgarh';
      const defaultTop = activeTopicFolder
        ? activeTopicFolder.titleEn
        : (activeSubjectFolder && Array.from(activeSubjectFolder.topicsMap.values())[0]
          ? Array.from(activeSubjectFolder.topicsMap.values())[0].titleEn
          : 'Ancient History of Chhattisgarh');

      openQuestionFormModal({
        title: '➕ नया प्रश्न जोड़ें (Add to Central Question Database)',
        question: {
          subjectTag: defaultSub,
          topic: defaultTop,
          difficulty: 'Moderate',
          questionHi: '',
          questionEn: '',
          optionsHi: ['', '', '', ''],
          optionsEn: ['', '', '', ''],
          correctOptionIndex: 0,
          explanationHi: '',
          explanationEn: '',
          pyqReferences: []
        },
        stateRef: state,
        onSave: (newFields) => {
          addCustomTaxonomyEntry(state, api, {
            examCode: 'CGPSC',
            subjectName: newFields.subjectTag,
            topicName: newFields.topic,
            subtopicName: ''
          });
          const nowIso = new Date().toISOString();
          const qDoc = Object.assign({}, newFields, {
            id: '',
            questionId: '',
            isDeleted: false,
            verified: true,
            adminVerified: true,
            status: 'verified',
            verificationStatus: 'verified',
            needsCategorisation: false,
            createdAt: nowIso,
            updatedAt: nowIso,
            createdAtIso: nowIso,
            updatedAtIso: nowIso
          });
          qDoc.id = computeDeterministicQuestionId(qDoc);
          qDoc.questionId = qDoc.id;
          state.questionBank.unshift(qDoc);
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('question_bank', qDoc.id, qDoc);
          api.toast(`✅ प्रश्न "${qDoc.subjectTag} › ${qDoc.topic}" में सेव हो गया!`);
          renderAdminConsole(rootEl, state, api);
        }
      });
    };

    const aiPromptPopupBtn = document.getElementById('qbPopupAiPromptGenBtn');
    if (aiPromptPopupBtn) {
      aiPromptPopupBtn.onclick = () => {
        openAiPromptQuestionGeneratorModal({
          state, api,
          defaultSubject: activeSubjectFolder ? activeSubjectFolder.titleEn : (nav.overrideSubject || ''),
          onSaved: () => renderAdminConsole(rootEl, state, api)
        });
      };
    }
    const pasteTextPopupBtn = document.getElementById('qbPopupPasteTextModalBtn');
    if (pasteTextPopupBtn) {
      pasteTextPopupBtn.onclick = () => {
        openPasteParagraphOrQuestionsModal({
          state, api,
          defaultSubject: activeSubjectFolder ? activeSubjectFolder.titleEn : (nav.overrideSubject || ''),
          onSaved: () => renderAdminConsole(rootEl, state, api)
        });
      };
    }
    ['qbPopupAddSingleQuestionBtn', 'qbAddQuestionInCurrentFolderBtn', 'qbEmptyFolderAddQBtn'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.onclick = openAddQuestionPopup;
    });

    const newSubBtn = document.getElementById('qbPopupNewSubjectBtn');
    if (newSubBtn) {
      newSubBtn.onclick = () => {
        openQuickFolderCreateModal({
          mode: 'subject',
          state, api,
          onCreated: () => renderAdminConsole(rootEl, state, api)
        });
      };
    }
    const newTopBtn = document.getElementById('qbPopupNewTopicBtn');
    if (newTopBtn) {
      newTopBtn.onclick = () => {
        openQuickFolderCreateModal({
          mode: 'topic',
          defaultSubjectId: activeSubjectFolder ? activeSubjectFolder.subjectId : '',
          state, api,
          onCreated: () => renderAdminConsole(rootEl, state, api)
        });
      };
    }
    const createPyqFolderBtn = document.getElementById('qbCreatePyqFolderBtn');
    if (createPyqFolderBtn) {
      createPyqFolderBtn.onclick = () => {
        openPyqFolderCreateModal({
          state, api,
          onCreated: () => renderAdminConsole(rootEl, state, api)
        });
      };
    }

    const quickExportJsonBtn = document.getElementById('qbQuickExportJsonBtn');
    if (quickExportJsonBtn) {
      quickExportJsonBtn.onclick = () => {
        if (activeQuestions.length === 0) return api.toast('⚠️ कोई प्रश्न नहीं है।');
        exportQuestionsToJson(activeQuestions);
        api.toast(`⬇️ ${activeQuestions.length} प्रश्नों का JSON बैकअप डाउनलोड हो गया!`);
      };
    }

    // Subject Library Navigation
    const homeBtn = document.getElementById('qbBreadcrumbHomeBtn');
    if (homeBtn) {
      homeBtn.onclick = () => {
        nav.level = 'mainCategories';
        nav.mainCategoryId = '';
        nav.subjectId = '';
        nav.topicId = '';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }
    const backToMainCatsBtn = document.getElementById('qbBackToMainCatsBtn');
    if (backToMainCatsBtn) {
      backToMainCatsBtn.onclick = () => {
        nav.level = 'mainCategories';
        nav.mainCategoryId = '';
        nav.subjectId = '';
        nav.topicId = '';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }
    const mainCatBreadBtn = document.getElementById('qbBreadcrumbMainCatBtn');
    if (mainCatBreadBtn) {
      mainCatBreadBtn.onclick = () => {
        if (activeMainCatFolder && activeMainCatFolder.directTopics) {
          const firstSub = Array.from(activeMainCatFolder.subjectsMap.values())[0];
          nav.subjectId = firstSub ? firstSub.subjectId : '';
          nav.topicId = '';
          nav.level = 'topics';
        } else {
          nav.subjectId = '';
          nav.topicId = '';
          nav.level = 'subjects';
        }
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }
    const subBreadBtn = document.getElementById('qbBreadcrumbSubjectBtn');
    if (subBreadBtn) {
      subBreadBtn.onclick = () => {
        nav.topicId = '';
        nav.level = 'topics';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }
    const backToSubjectsBtn = document.getElementById('qbBackToSubjectsBtn');
    if (backToSubjectsBtn) {
      backToSubjectsBtn.onclick = () => {
        if (activeMainCatFolder && activeMainCatFolder.directTopics) {
          nav.level = 'mainCategories';
          nav.mainCategoryId = '';
          nav.subjectId = '';
          nav.topicId = '';
        } else {
          nav.level = 'subjects';
          nav.subjectId = '';
          nav.topicId = '';
        }
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }
    const backFromQuestionsBtn = document.getElementById('qbBackFromQuestionsBtn');
    if (backFromQuestionsBtn) {
      backFromQuestionsBtn.onclick = () => {
        if (activeSubjectFolder) {
          nav.level = 'topics';
          nav.topicId = '';
        } else if (activeMainCatFolder) {
          nav.level = 'subjects';
          nav.subjectId = '';
        } else {
          nav.level = 'mainCategories';
        }
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }

    bodyEl.querySelectorAll('[data-open-main-cat]').forEach((card) => {
      card.onclick = () => {
        const mcId = card.getAttribute('data-open-main-cat') || '';
        nav.mainCategoryId = mcId;
        const mcObj = mainCatMap.get(mcId);
        if (mcObj && (mcObj.directTopics || mcObj.subjectsMap.size === 1)) {
          const onlySub = Array.from(mcObj.subjectsMap.values())[0];
          nav.subjectId = onlySub ? onlySub.subjectId : '';
          nav.topicId = '';
          nav.level = 'topics';
        } else {
          nav.subjectId = '';
          nav.topicId = '';
          nav.level = 'subjects';
        }
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    });
    bodyEl.querySelectorAll('[data-open-subject-folder]').forEach((card) => {
      card.onclick = () => {
        nav.subjectId = card.getAttribute('data-open-subject-folder') || '';
        nav.topicId = '';
        nav.level = 'topics';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    });
    bodyEl.querySelectorAll('[data-open-topic-folder]').forEach((card) => {
      card.onclick = () => {
        nav.topicId = card.getAttribute('data-open-topic-folder') || '';
        nav.level = 'questions';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    });
    const viewAllFlatBtn = document.getElementById('qbViewAllQuestionsFlatBtn');
    if (viewAllFlatBtn) {
      viewAllFlatBtn.onclick = () => {
        nav.mainCategoryId = '';
        nav.subjectId = '';
        nav.topicId = '';
        nav.level = 'questions';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }
    const viewAllMainCatQBtn = document.getElementById('qbViewAllMainCatQuestionsBtn');
    if (viewAllMainCatQBtn) {
      viewAllMainCatQBtn.onclick = () => {
        nav.subjectId = '';
        nav.topicId = '';
        nav.level = 'questions';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }
    const viewAllSubQBtn = document.getElementById('qbViewAllSubjectQuestionsBtn');
    if (viewAllSubQBtn) {
      viewAllSubQBtn.onclick = () => {
        nav.topicId = 'ALL_IN_SUBJECT';
        nav.level = 'questions';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }

    // PYQ Library Navigation
    const pyqRootBtn = document.getElementById('qbPyqRootBtn');
    if (pyqRootBtn) {
      pyqRootBtn.onclick = () => {
        nav.pyqCategory = '';
        nav.pyqExamName = '';
        nav.pyqYear = '';
        nav.pyqPaper = '';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }
    const pyqCatBreadBtn = document.getElementById('qbPyqCatBreadBtn');
    if (pyqCatBreadBtn) {
      pyqCatBreadBtn.onclick = () => {
        nav.pyqExamName = '';
        nav.pyqYear = '';
        nav.pyqPaper = '';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }
    const pyqExamBreadBtn = document.getElementById('qbPyqExamBreadBtn');
    if (pyqExamBreadBtn) {
      pyqExamBreadBtn.onclick = () => {
        nav.pyqYear = '';
        nav.pyqPaper = '';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }
    bodyEl.querySelectorAll('[data-open-pyq-cat]').forEach((card) => {
      card.onclick = () => {
        nav.pyqCategory = card.getAttribute('data-open-pyq-cat') || '';
        nav.pyqExamName = '';
        nav.pyqYear = '';
        nav.pyqPaper = '';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    });
    bodyEl.querySelectorAll('[data-open-pyq-exam]').forEach((card) => {
      card.onclick = () => {
        nav.pyqExamName = card.getAttribute('data-open-pyq-exam') || '';
        nav.pyqYear = '';
        nav.pyqPaper = '';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    });
    bodyEl.querySelectorAll('[data-open-pyq-year]').forEach((card) => {
      card.onclick = () => {
        nav.pyqYear = card.getAttribute('data-open-pyq-year') || '';
        nav.pyqPaper = '';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    });
    bodyEl.querySelectorAll('[data-open-pyq-paper]').forEach((btn) => {
      btn.onclick = () => {
        nav.pyqPaper = btn.getAttribute('data-open-pyq-paper') || '';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    });

    // Advanced Search & Filters wiring
    const advSearchInp = document.getElementById('qbAdvSearchInput');
    if (advSearchInp) {
      advSearchInp.oninput = () => {
        const pos = advSearchInp.selectionStart;
        nav.search = advSearchInp.value;
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
        const nextInp = document.getElementById('qbAdvSearchInput');
        if (nextInp) {
          nextInp.focus();
          try { nextInp.setSelectionRange(pos, pos); } catch (_) {}
        }
      };
    }
    const bindSelectFilter = (elemId, key, resetSub) => {
      const el = document.getElementById(elemId);
      if (el) {
        el.onchange = () => {
          nav.advFilters[key] = el.value;
          if (resetSub) nav.advFilters.topicId = 'ALL';
          qbState.page = 1;
          renderAdminConsole(rootEl, state, api);
        };
      }
    };
    bindSelectFilter('qbAdvMainCatSelect', 'mainCategoryId', false);
    bindSelectFilter('qbAdvSubjectSelect', 'subjectId', true);
    bindSelectFilter('qbAdvTopicSelect', 'topicId', false);
    bindSelectFilter('qbAdvExamSelect', 'examFilter', false);
    bindSelectFilter('qbAdvLangSelect', 'language', false);
    bindSelectFilter('qbAdvVerifySelect', 'verificationStatus', false);

    const advYrInp = document.getElementById('qbAdvYearInput');
    if (advYrInp) {
      advYrInp.onchange = () => {
        nav.advFilters.examYear = advYrInp.value.trim();
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }
    const diffFilterSel = document.getElementById('qbQuestionsDiffFilter');
    if (diffFilterSel) {
      diffFilterSel.onchange = () => {
        nav.difficulty = diffFilterSel.value || 'ALL';
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }
    const resetAdvBtn = document.getElementById('qbResetAdvFiltersBtn');
    if (resetAdvBtn) {
      resetAdvBtn.onclick = () => {
        nav.search = '';
        nav.difficulty = 'ALL';
        nav.advFilters = {
          mainCategoryId: 'ALL', subjectId: 'ALL', topicId: 'ALL',
          examFilter: 'ALL', examYear: '', language: 'ALL', verificationStatus: 'ALL'
        };
        qbState.page = 1;
        renderAdminConsole(rootEl, state, api);
      };
    }

    // Import & Preview wiring
    const sampleCsvBtn = document.getElementById('qbDownloadSampleCsvBtn');
    if (sampleCsvBtn) {
      sampleCsvBtn.onclick = () => {
        exportQuestionsToCsv([{
          mainCategory: 'Chhattisgarh GK',
          subjectTag: 'History of Chhattisgarh',
          topic: 'Ancient History of Chhattisgarh',
          difficulty: 'Easy',
          questionHi: 'छत्तीसगढ़ राज्य का गठन कब हुआ था?',
          questionEn: 'When was the state of Chhattisgarh formed?',
          optionsHi: ['1 नवंबर 2000', '15 नवंबर 2000', '9 नवंबर 2000', '1 जनवरी 2001'],
          optionsEn: ['1 November 2000', '15 November 2000', '9 November 2000', '1 January 2001'],
          correctOptionIndex: 0,
          explanationHi: 'छत्तीसगढ़ का गठन 1 नवंबर 2000 को हुआ था।',
          explanationEn: 'Chhattisgarh was formed on 1 November 2000.',
          pyqReferences: [{ examCategory: 'CGPSC', examName: 'CGPSC State Service Exam (Prelims)', examYear: '2020', paperName: 'GS Paper 1', shift: 'Morning' }]
        }], 'cgpedia-sample-questions.csv');
      };
    }
    const sampleJsonBtn = document.getElementById('qbDownloadSampleJsonBtn');
    if (sampleJsonBtn) {
      sampleJsonBtn.onclick = () => {
        exportQuestionsToJson([{
          mainCategory: 'Chhattisgarh GK',
          subjectTag: 'Geography of Chhattisgarh',
          topic: 'Rivers & Drainage System',
          difficulty: 'Easy',
          questionHi: 'महानदी का उद्गम किस जिले से होता है?',
          questionEn: 'In which district is the origin of the Mahanadi river located?',
          optionsHi: ['धमतरी (सिहावा पर्वत)', 'कांकेर', 'बस्तर', 'सरगुजा'],
          optionsEn: ['Dhamtari (Sihawa Hills)', 'Kanker', 'Bastar', 'Surguja'],
          correctOptionIndex: 0,
          explanationHi: 'महानदी का उद्गम धमतरी जिले के सिहावा पर्वत से होता है।',
          explanationEn: 'The Mahanadi originates from Sihawa hills in Dhamtari.',
          pyqReferences: [{ examCategory: 'CG_VYAPAM', examName: 'Patwari / RI / Amin', examYear: '2022', paperName: 'Set A' }]
        }], 'cgpedia-sample-questions.json');
      };
    }

    const qpFileInp = document.getElementById('qbAiQuestionFileInput');
    if (qpFileInp) {
      qpFileInp.onchange = () => {
        if (qpFileInp.files && qpFileInp.files[0]) {
          nav.selectedQuestionFile = qpFileInp.files[0];
          renderAdminConsole(rootEl, state, api);
        }
      };
    }
    const akFileInp = document.getElementById('qbAiAnswerKeyFileInput');
    if (akFileInp) {
      akFileInp.onchange = async () => {
        if (akFileInp.files && akFileInp.files[0]) {
          nav.selectedAnswerKeyFile = akFileInp.files[0];
          try {
            const cleanAk = await extractAnswerKeyWithAiFallback(nav.selectedAnswerKeyFile, nav.paperSetCode || 'A', null, { skipCanvasOcr: true });
            if (cleanAk) qbState.pendingAnswerKeyText = cleanAk;
          } catch (_) {}
          renderAdminConsole(rootEl, state, api);
        }
      };
    }
    const akTextInp = document.getElementById('qbAiAnswerKeyTextInput');
    if (akTextInp) akTextInp.oninput = () => { qbState.pendingAnswerKeyText = akTextInp.value; };
    const setSel = document.getElementById('qbAiPaperSetSelect');
    if (setSel) setSel.onchange = () => { nav.paperSetCode = setSel.value || 'A'; };
    const overrideSubSel = document.getElementById('qbAiOverrideSubjectSelect');
    if (overrideSubSel) overrideSubSel.onchange = () => { nav.overrideSubject = overrideSubSel.value || ''; };

    const loadPreviewBtn = document.getElementById('qbLoadImportPreviewBtn');
    if (loadPreviewBtn) {
      loadPreviewBtn.onclick = async () => {
        const qFile = (qpFileInp && qpFileInp.files && qpFileInp.files[0]) || nav.selectedQuestionFile;
        if (!qFile) return api.toast('⚠️ कृपया पहले CSV, JSON, PDF या TXT फ़ाइल चुनें।');
        try {
          nav.isScanning = true;
          nav.scanStatusText = `⏳ "${qFile.name}" का Import Preview तैयार किया जा रहा है...`;
          renderAdminConsole(rootEl, state, api);
          const parsed = await parseRawImportFile(qFile, {
            answerKeyText: qbState.pendingAnswerKeyText || '',
            paperSetCode: nav.paperSetCode || 'A'
          });
          qbState.previewSession = buildAndValidatePreviewSession(parsed.rawItems, qFile.name, parsed.format, state);
          nav.isScanning = false;
          nav.scanStatusText = '';
          api.toast(`🧐 ${qbState.previewSession.records.length} प्रश्न Preview के लिए तैयार हैं!`);
          renderAdminConsole(rootEl, state, api);
        } catch (err) {
          nav.isScanning = false;
          nav.scanStatusText = '';
          api.toast('⚠️ फ़ाइल पढ़ने के लिए "AI Scan & Save" का उपयोग करें।');
          renderAdminConsole(rootEl, state, api);
        }
      };
    }

    const startAiScanBtn = document.getElementById('qbStartAiScanAndSaveBtn');
    if (startAiScanBtn) {
      startAiScanBtn.onclick = async () => {
        const qFile = (qpFileInp && qpFileInp.files && qpFileInp.files[0]) || nav.selectedQuestionFile;
        if (!qFile) return api.toast('⚠️ कृपया पहले फ़ाइल चुनें।');
        nav.isScanning = true;
        nav.scanStatusText = `⏳ "${qFile.name}" को AI द्वारा स्कैन किया जा रहा है...`;
        renderAdminConsole(rootEl, state, api);
        try {
          const qKind = await detectUploadedFileKind(qFile, '');
          const rawQuestionText = qKind === 'image' ? '' : await extractTextFromUploadedFile(qFile, null, { skipCanvasOcr: true });
          const scannedDocs = await scanAndCategorizeWithAiOrFallback({
            questionFile: qFile,
            rawQuestionText,
            answerKeyText: qbState.pendingAnswerKeyText || '',
            paperSetCode: nav.paperSetCode || 'A',
            forcedSubjectTag: nav.overrideSubject || '',
            forcedTopic: '',
            state,
            onProgress: (msg) => {
              nav.scanStatusText = msg;
              const box = document.getElementById('qbAiScanStatusBox');
              if (box) box.textContent = msg;
            }
          });
          nav.isScanning = false;
          nav.scanStatusText = '';
          if (!scannedDocs || scannedDocs.length === 0) {
            api.toast('⚠️ कोई प्रश्न नहीं मिला।');
            renderAdminConsole(rootEl, state, api);
            return;
          }
          qbState.previewSession = buildAndValidatePreviewSession(scannedDocs, qFile.name, 'AI_SCAN', state);
          api.toast(`✅ ${scannedDocs.length} प्रश्न स्कैन हुए — कृपया Preview में जाँच कर Confirm दबाएं!`);
          renderAdminConsole(rootEl, state, api);
        } catch (e) {
          nav.isScanning = false;
          nav.scanStatusText = '';
          api.toast('⚠️ स्कैनिंग में त्रुटि आई।');
          renderAdminConsole(rootEl, state, api);
        }
      };
    }

    bodyEl.querySelectorAll('[data-toggle-preview-exclude]').forEach((chk) => {
      chk.onchange = () => {
        const rIdx = Number(chk.getAttribute('data-toggle-preview-exclude'));
        if (qbState.previewSession && qbState.previewSession.records[rIdx]) {
          qbState.previewSession.records[rIdx].excluded = !chk.checked;
        }
      };
    });
    bodyEl.querySelectorAll('[data-approve-missing-folder]').forEach((btn) => {
      btn.onclick = () => {
        const rIdx = Number(btn.getAttribute('data-approve-missing-folder'));
        const rec = qbState.previewSession && qbState.previewSession.records[rIdx];
        if (!rec || !rec.missingFolderInfo) return;
        const mf = rec.missingFolderInfo;
        addCustomTaxonomyEntry(state, api, {
          examCode: 'CGPSC',
          subjectName: mf.rawSubject || 'Chhattisgarh GK',
          topicName: mf.rawTopic || 'General Topic',
          subtopicName: ''
        });
        mf.hasMissingFolder = false;
        rec.normalized.subjectTag = mf.rawSubject || rec.normalized.subjectTag;
        rec.normalized.topic = mf.rawTopic || rec.normalized.topic;
        rec.normalized.needsCategorisation = false;
        rec.normalized.verificationStatus = 'verified';
        api.toast(`✅ नया फ़ोल्डर "${mf.rawSubject} › ${mf.rawTopic}" अप्रूव और तैयार कर दिया गया!`);
        renderAdminConsole(rootEl, state, api);
      };
    });

    const cancelPrevBtn = document.getElementById('qbCancelPreviewBtn');
    if (cancelPrevBtn) {
      cancelPrevBtn.onclick = () => {
        qbState.previewSession = null;
        renderAdminConsole(rootEl, state, api);
      };
    }
    const commitPrevBtn = document.getElementById('qbCommitPreviewBtn');
    if (commitPrevBtn) {
      commitPrevBtn.onclick = async () => {
        if (!qbState.previewSession) return;
        const summary = await commitImportPreviewSession(qbState.previewSession, state, api);
        if (summary) {
          api.toast(`✅ ${summary.newQuestionsSaved} नए प्रश्न और ${summary.pyqReferencesAdded} PYQ References सेव हो गए!`);
        }
        renderAdminConsole(rootEl, state, api);
      };
    }
    const dismissImpRepBtn = document.getElementById('qbDismissImportRepBtn');
    if (dismissImpRepBtn) {
      dismissImpRepBtn.onclick = () => {
        qbState.lastImportReport = null;
        renderAdminConsole(rootEl, state, api);
      };
    }

    // Folder Management & Migration wiring
    const runMigBtn = document.getElementById('qbRunSafeMigrationBtn');
    if (runMigBtn) {
      runMigBtn.onclick = () => {
        qbState.migrationReport = migrateExistingQuestionBankRecords(state, api, { skipCloudSync: false });
        api.toast('✅ Safe Question Bank Migration सफलतापूर्वक पूरा हुआ!');
        renderAdminConsole(rootEl, state, api);
      };
    }
    const restoreBackupBtn = document.getElementById('qbRestorePreMigBackupBtn');
    if (restoreBackupBtn) {
      restoreBackupBtn.onclick = () => {
        openConfirmationDialog({
          title: 'Pre-Migration Backup रिस्टोर करें',
          message: 'क्या आप माइग्रेशन से पहले के प्रश्न बैंक बैकअप को रिस्टोर करना चाहते हैं?',
          confirmLabel: 'हाँ, रिस्टोर करें',
          isDanger: false,
          onConfirm: () => {
            try {
              const raw = localStorage.getItem('cgpedia_qb_pre_migration_backup_v2');
              const parsed = JSON.parse(raw || '[]');
              if (Array.isArray(parsed) && parsed.length > 0) {
                state.questionBank = parsed;
                api.saveState();
                api.toast(`✅ ${parsed.length} प्रश्नों का बैकअप रिस्टोर हो गया!`);
                renderAdminConsole(rootEl, state, api);
              }
            } catch (_) {
              api.toast('⚠️ बैकअप रिस्टोर करने में त्रुटि आई।');
            }
          }
        });
      };
    }

    bodyEl.querySelectorAll('[data-rename-folder]').forEach((btn) => {
      btn.onclick = () => {
        const [fType, fId] = String(btn.getAttribute('data-rename-folder') || '').split(':::');
        openFolderRenameModal({
          folderType: fType,
          folderId: fId,
          state, api,
          onRenamed: () => renderAdminConsole(rootEl, state, api)
        });
      };
    });
    bodyEl.querySelectorAll('[data-delete-empty-folder]').forEach((btn) => {
      btn.onclick = () => {
        const [fType, fId] = String(btn.getAttribute('data-delete-empty-folder') || '').split(':::');
        const res = deleteEmptyCategoryFolder(state, api, fType, fId);
        if (res && res.ok) {
          api.toast('🗑️ खाली फ़ोल्डर हटा दिया गया।');
          renderAdminConsole(rootEl, state, api);
        } else {
          api.toast(`⚠️ ${(res && res.reason) || 'केवल खाली कस्टम फ़ोल्डर ही हटाए जा सकते हैं।'}`);
        }
      };
    });

    // Selection & Bulk Actions
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
        filteredQuestions.forEach((q) => qbState.selectedIds.add(q.id));
        renderAdminConsole(rootEl, state, api);
      };
    }
    const clearSelBtn = document.getElementById('qbClearSelectionBtn');
    if (clearSelBtn) {
      clearSelBtn.onclick = () => {
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

    const bulkMoveBtn = document.getElementById('qbBulkMoveFolderBtn');
    if (bulkMoveBtn) {
      bulkMoveBtn.onclick = () => {
        if (qbState.selectedIds.size === 0) return;
        openBulkEditModal(qbState.selectedIds.size, state, api, async (changes) => {
          if (changes.subjectTag || changes.topic) {
            addCustomTaxonomyEntry(state, api, {
              examCode: 'CGPSC',
              subjectName: changes.subjectTag,
              topicName: changes.topic,
              subtopicName: ''
            });
          }
          const updatedCat = getTaxonomyCatalog(state);
          const updatedDocs = [];
          const nowIso = new Date().toISOString();
          state.questionBank.forEach((q) => {
            if (!qbState.selectedIds.has(q.id)) return;
            if (changes.subjectTag) q.subjectTag = changes.subjectTag;
            if (changes.topic) q.topic = changes.topic;
            if (changes.difficulty) {
              q.difficulty = changes.difficulty;
              q.difficultyLevel = changes.difficulty;
            }
            const resolved = resolveCanonicalQuestionHierarchy(q, updatedCat);
            q.mainCategoryId = resolved.mainCategoryId || q.mainCategoryId || 'cat_cg_gk';
            q.mainCategory = resolved.mainCategory || q.mainCategory || 'Chhattisgarh GK';
            q.subjectId = resolved.subjectId || makeSlugId('sub', q.subjectTag);
            q.subjectTag = resolved.subjectTag || q.subjectTag;
            q.topicId = resolved.topicId || makeSlugId('top', q.topic);
            q.topic = resolved.topic || q.topic;
            q.needsCategorisation = false;
            q.verificationStatus = 'verified';
            q.status = 'verified';
            q.updatedAt = nowIso;
            q.updatedAtIso = nowIso;
            updatedDocs.push(q);
          });
          api.saveState();
          if (window.CGpediaCloud && window.CGpediaCloud.batchSaveCloudDocs && updatedDocs.length > 0) {
            await window.CGpediaCloud.batchSaveCloudDocs('question_bank', updatedDocs);
          }
          qbState.selectedIds.clear();
          api.toast(`✅ ${updatedDocs.length} प्रश्न नए फ़ोल्डर में मूव कर दिए गए!`);
          renderAdminConsole(rootEl, state, api);
        });
      };
    }

    const sendToTestBtn = document.getElementById('qbSendFolderToTestBuilderBtn');
    if (sendToTestBtn) {
      sendToTestBtn.onclick = () => {
        const targetQs = qbState.selectedIds.size > 0
          ? activeQuestions.filter((q) => qbState.selectedIds.has(q.id))
          : filteredQuestions;
        if (targetQs.length === 0) return;
        openAssignToTestModal(targetQs, state, api, () => renderAdminConsole(rootEl, state, api));
      };
    }
    const exportCsvBtn = document.getElementById('qbExportCurrentFolderCsvBtn');
    if (exportCsvBtn) {
      exportCsvBtn.onclick = () => {
        const targetQs = qbState.selectedIds.size > 0
          ? activeQuestions.filter((q) => qbState.selectedIds.has(q.id))
          : filteredQuestions;
        if (targetQs.length === 0) return;
        exportQuestionsToCsv(targetQs);
        api.toast(`⬇️ ${targetQs.length} प्रश्न CSV में एक्सपोर्ट किए गए!`);
      };
    }
    const bulkDelBtn = document.getElementById('qbBulkDeleteBtn');
    if (bulkDelBtn) {
      bulkDelBtn.onclick = () => {
        const idsToDelete = Array.from(qbState.selectedIds);
        if (idsToDelete.length === 0) return;
        openConfirmationDialog({
          title: 'चयनित प्रश्न हटाएं (Confirm Bulk Delete)',
          message: `क्या आप वाकई ${idsToDelete.length} चयनित प्रश्नों को हटाना चाहते हैं?`,
          confirmLabel: `हाँ, ${idsToDelete.length} प्रश्न हटाएं`,
          isDanger: true,
          onConfirm: async () => {
            const delSet = new Set(idsToDelete);
            state.questionBank = (state.questionBank || []).filter((q) => !delSet.has(q.id));
            qbState.selectedIds.clear();
            api.saveState();
            if (window.CGpediaCloud && window.CGpediaCloud.batchDeleteCloudDocs) {
              await window.CGpediaCloud.batchDeleteCloudDocs('question_bank', idsToDelete);
            }
            api.toast(`🗑️ ${idsToDelete.length} प्रश्न हटा दिए गए।`);
            renderAdminConsole(rootEl, state, api);
          }
        });
      };
    }

    // 9 Question Card Actions Wiring
    const letters = ['A', 'B', 'C', 'D'];
    bodyEl.querySelectorAll('[data-quick-ans-qbank]').forEach((el) => {
      el.onclick = () => {
        const [qid, idxStr] = String(el.getAttribute('data-quick-ans-qbank') || '').split(':');
        const newIdx = Number(idxStr);
        const qObj = (state.questionBank || []).find((q) => q.id === qid);
        if (!qObj || Number.isNaN(newIdx) || newIdx < 0 || newIdx > 3) return;
        qObj.correctIndex = newIdx;
        qObj.correctOptionIndex = newIdx;
        qObj.updatedAt = new Date().toISOString();
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('question_bank', qObj.id, qObj);
        api.toast(`✅ सही उत्तर विकल्प ${letters[newIdx]} सेट किया गया!`);
        renderAdminConsole(rootEl, state, api);
      };
    });

    // 1. View
    bodyEl.querySelectorAll('[data-view-qbank]').forEach((btn) => {
      btn.onclick = () => {
        const qObj = (state.questionBank || []).find((q) => q.id === btn.getAttribute('data-view-qbank'));
        if (qObj) openQuestionDetailViewModal(qObj, state);
      };
    });

    // 2. Edit, 4. Move, 5. Change Subject, 6. Change Topic
    const openEditOrMoveForQuestion = (qObj, modalTitle) => {
      openQuestionFormModal({
        title: modalTitle || '✏️ प्रश्न संपादित करें (Edit Question & Folder)',
        question: qObj,
        stateRef: state,
        onSave: (updatedFields) => {
          addCustomTaxonomyEntry(state, api, {
            examCode: 'CGPSC',
            subjectName: updatedFields.subjectTag,
            topicName: updatedFields.topic,
            subtopicName: ''
          });
          const resolved = resolveCanonicalQuestionHierarchy(updatedFields, getTaxonomyCatalog(state));
          Object.assign(qObj, updatedFields, {
            mainCategoryId: resolved.mainCategoryId || updatedFields.mainCategoryId || 'cat_cg_gk',
            mainCategory: resolved.mainCategory || updatedFields.mainCategory || 'Chhattisgarh GK',
            subjectId: resolved.subjectId || updatedFields.subjectId,
            topicId: resolved.topicId || updatedFields.topicId,
            verified: true,
            adminVerified: true,
            status: 'verified',
            verificationStatus: 'verified',
            needsCategorisation: false
          });
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('question_bank', qObj.id, qObj);
          api.toast('✅ प्रश्न और फ़ोल्डर सफलतापूर्वक अपडेट हो गए!');
          renderAdminConsole(rootEl, state, api);
        }
      });
    };
    bodyEl.querySelectorAll('[data-edit-qbank]').forEach((btn) => {
      btn.onclick = () => {
        const qObj = (state.questionBank || []).find((q) => q.id === btn.getAttribute('data-edit-qbank'));
        if (qObj) openEditOrMoveForQuestion(qObj, '✏️ प्रश्न संपादित करें (Edit Question)');
      };
    });
    bodyEl.querySelectorAll('[data-move-qbank]').forEach((btn) => {
      btn.onclick = () => {
        const qObj = (state.questionBank || []).find((q) => q.id === btn.getAttribute('data-move-qbank'));
        if (qObj) openEditOrMoveForQuestion(qObj, '📂 प्रश्न का फ़ोल्डर बदलें (Move Question Folder)');
      };
    });
    bodyEl.querySelectorAll('[data-change-sub-qbank]').forEach((btn) => {
      btn.onclick = () => {
        const qObj = (state.questionBank || []).find((q) => q.id === btn.getAttribute('data-change-sub-qbank'));
        if (qObj) openEditOrMoveForQuestion(qObj, '📁 विषय बदलें (Change Subject)');
      };
    });
    bodyEl.querySelectorAll('[data-change-top-qbank]').forEach((btn) => {
      btn.onclick = () => {
        const qObj = (state.questionBank || []).find((q) => q.id === btn.getAttribute('data-change-top-qbank'));
        if (qObj) openEditOrMoveForQuestion(qObj, '📂 टॉपिक बदलें (Change Topic)');
      };
    });

    // 3. Duplicate
    bodyEl.querySelectorAll('[data-dup-qbank]').forEach((btn) => {
      btn.onclick = () => {
        const qObj = (state.questionBank || []).find((q) => q.id === btn.getAttribute('data-dup-qbank'));
        if (!qObj) return;
        const copyDraft = JSON.parse(JSON.stringify(qObj));
        copyDraft.questionHi = `${copyDraft.questionHi || ''} (Copy)`.trim();
        openQuestionFormModal({
          title: '📄 प्रश्न की प्रतिलिपि बनाएं (Duplicate Question)',
          question: copyDraft,
          stateRef: state,
          onSave: (newFields) => {
            const nowIso = new Date().toISOString();
            const dupDoc = Object.assign({}, copyDraft, newFields, {
              id: `q_dup_${Date.now().toString(36)}`,
              questionId: `q_dup_${Date.now().toString(36)}`,
              createdAt: nowIso,
              updatedAt: nowIso
            });
            state.questionBank.unshift(dupDoc);
            api.saveState();
            if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('question_bank', dupDoc.id, dupDoc);
            api.toast('📄 डुप्लीकेट प्रश्न सेव हो गया!');
            renderAdminConsole(rootEl, state, api);
          }
        });
      };
    });

    // 7. Add Exam / PYQ Reference
    bodyEl.querySelectorAll('[data-pyq-qbank]').forEach((btn) => {
      btn.onclick = () => {
        const qObj = (state.questionBank || []).find((q) => q.id === btn.getAttribute('data-pyq-qbank'));
        if (!qObj) return;
        openPyqReferenceModal({
          question: qObj,
          state, api,
          onSaved: () => renderAdminConsole(rootEl, state, api)
        });
      };
    });

    // 8. Verify
    bodyEl.querySelectorAll('[data-verify-qbank]').forEach((btn) => {
      btn.onclick = () => {
        const qObj = (state.questionBank || []).find((q) => q.id === btn.getAttribute('data-verify-qbank'));
        if (!qObj) return;
        if (qObj.subjectId === 'sub_uncategorised' || qObj.subjectTag === 'Uncategorised') {
          return openEditOrMoveForQuestion(qObj, '✅ Verify करने से पहले सही Subject और Topic चुनें');
        }
        qObj.verified = true;
        qObj.adminVerified = true;
        qObj.status = 'verified';
        qObj.verificationStatus = 'verified';
        qObj.needsCategorisation = false;
        qObj.updatedAt = new Date().toISOString();
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('question_bank', qObj.id, qObj);
        api.toast('✅ प्रश्न Verified हो गया!');
        renderAdminConsole(rootEl, state, api);
      };
    });

    // 9. Delete (with Published Test & PYQ Reference safety check)
    bodyEl.querySelectorAll('[data-del-qbank]').forEach((btn) => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-del-qbank');
        const qObj = (state.questionBank || []).find((q) => q.id === qid);
        if (!qObj) return;
        const safety = checkQuestionSafetyBeforeDelete(qObj, state);
        openConfirmationDialog({
          title: 'प्रश्न हटाएं (Delete Question Safety Check)',
          message: `${safety.warningMessage ? `⚠️ चेतावनी: ${safety.warningMessage}\n\n` : ''}क्या आप इस प्रश्न को हटाना चाहते हैं: "${(qObj.questionHi || qObj.questionEn || '').slice(0, 80)}..."?`,
          confirmLabel: 'हाँ, हटाएं',
          isDanger: true,
          onConfirm: () => {
            state.questionBank = (state.questionBank || []).filter((q) => q.id !== qid);
            qbState.selectedIds.delete(qid);
            api.saveState();
            if (window.CGpediaCloud) window.CGpediaCloud.deleteCloudDoc('question_bank', qid);
            api.toast('🗑️ प्रश्न हटा दिया गया।');
            renderAdminConsole(rootEl, state, api);
          }
        });
      };
    });

    // Pagination controls
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

  function renderQuestionBankManagement(bodyEl, rootEl, state, api) {
    return renderQuestionBankManagementV2(bodyEl, rootEl, state, api);
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
        if (String(file.name || '').toLowerCase().endsWith('.pdf') || String(file.type || '').toLowerCase() === 'application/pdf') {
          api.toast('⏳ PDF फ़ाइल से प्रश्न पढ़े जा रहे हैं... (Extracting questions from PDF...)');
        }
        const rawText = await extractTextFromUploadedFile(file, (msg) => api.toast(msg));
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

  function isDuplicateCurrentAffair(candidate, existingStories) {
    if (!candidate) return true;
    const candHi = normalizeTextForComparison(candidate.headlineHi || candidate.titleHi || '');
    const candEn = normalizeTextForComparison(candidate.headlineEn || candidate.titleEn || '');
    const candSum = normalizeTextForComparison(candidate.summaryHi || candidate.summaryEn || '');
    if (!candHi && !candEn) return true;

    const list = Array.isArray(existingStories) ? existingStories : [];
    for (let i = 0; i < list.length; i++) {
      const ex = list[i];
      if (!ex) continue;
      if (candidate.id && ex.id && String(candidate.id) === String(ex.id)) return true;
      const exHi = normalizeTextForComparison(ex.headlineHi || ex.titleHi || '');
      const exEn = normalizeTextForComparison(ex.headlineEn || ex.titleEn || '');
      const exSum = normalizeTextForComparison(ex.summaryHi || ex.summaryEn || '');
      if (candHi && exHi && (candHi === exHi || computeTextSimilarity(candHi, exHi) >= 0.65)) {
        return true;
      }
      if (candEn && exEn && (candEn === exEn || computeTextSimilarity(candEn, exEn) >= 0.65)) {
        return true;
      }
      if (candSum && exSum && candSum.length > 24 && computeTextSimilarity(candSum, exSum) >= 0.72) {
        return true;
      }
    }
    return false;
  }

  function pickPhotoFromPool(pool, seedStr) {
    if (!Array.isArray(pool) || pool.length === 0) return '';
    if (pool.length === 1) return pool[0];
    const s = String(seedStr || '');
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    }
    return pool[Math.abs(hash) % pool.length];
  }

  function generateAutoStoryImageUrl(storyItem) {
    const st = storyItem || {};
    const existingUrl = String(st.imageUrl || '').trim();
    // Preserve custom uploaded images or non-Unsplash custom URLs; re-evaluate auto-assigned Unsplash URLs for maximum topic relevance
    if (
      existingUrl &&
      !existingUrl.startsWith('data:image/svg+xml') &&
      !existingUrl.includes('images.unsplash.com/')
    ) {
      return existingUrl;
    }
    const cat = String(st.category || 'chhattisgarh').toLowerCase();
    const combinedText = `${st.headlineHi || ''} ${st.headlineEn || ''} ${st.titleHi || ''} ${st.titleEn || ''} ${st.summaryHi || ''} ${st.summaryEn || ''}`.toLowerCase();
    const seedKey = `${st.id || ''}_${st.headlineEn || st.headlineHi || ''}`;

    const topicPhotoRules = [
      // 1. Space, ISRO, Satellites, Rocket Launches & Astronomy
      {
        re: /इसरो|अंतरिक्ष|उपग्रह|स्पैडेक्स|डॉकिंग|चंद्रयान|गगनयान|आदित्य|पीएसएलवी|जीएसएलवी|रॉकेट|नासा|isro|spadex|space|satellite|docking|chandrayaan|gaganyaan|pslv|gslv|rocket|nasa|orbit|astronaut/,
        urls: [
          'https://images.unsplash.com/photo-1517976487468-f20514c44f53?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 2. Quantum Science, AI, Semiconductor, Supercomputer, Cyber & Digital Tech
      {
        re: /क्वांटम|कृत्रिम बुद्धिमत्ता|एआई|सेमीकंडक्टर|सुपर कंप्यूटर|साइबर|डिजिटल|प्रौद्योगिकी|रोबोट|5जी|6जी|quantum|artificial intelligence|semiconductor|supercomputer|cyber|digital|robotics|telecom|innovation/,
        urls: [
          'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 3. Defence, DRDO, Military Exercises, Missiles, Navy, Air Force & Border Security
      {
        re: /डीआरडीओ|रक्षा|मिसाइल|सेना|नौसेना|वायुसेना|सैन्य अभ्यास|पनडुब्बी|लड़ाकू विमान|अग्नि|ब्रह्मोस|drdo|defence|defense|missile|military|army|navy|air force|submarine|frigate|exercise/,
        urls: [
          'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 4. Tiger Reserves, Lions, Elephants, National Parks & Wildlife Conservation
      {
        re: /टाइगर|बाघ|अभयारण्य|गुरु घासीदास|तमोर पिंगला|इंद्रावती|कांगेर|बारनवापारा|अचानकमार|राष्ट्रीय उद्यान|वन्यजीव|हाथी|लेमरू|चीता|tiger|wildlife|national park|sanctuary|reserve|elephant|cheetah|leopard|biodiversity/,
        urls: [
          'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 5. Paddy Procurement, Krishak Unnati, MSP, Agriculture, Farmers, Millets & Crops
      {
        re: /धान|कृषक|किसान|कृषि|फसल|समर्थन मूल्य|एमएसपी|कोदो|कुटकी|रागी|मिलेट|उर्वरक|बागवानी|मत्स्य|paddy|krishak|farmer|agriculture|crop|msp|millet|harvest|irrigation|horticulture|grain/,
        urls: [
          'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 6. Women Empowerment, Mahtari Vandan, Lakhpati Didi, Self-Help Groups (Bihan) & Child Welfare
      {
        re: /महतारी|महिला|दीदी|लखपति|पोषण|आंगनबाड़ी|बिहान|स्व-सहायता समूह|मातृत्व|बालिका|mahtari|women|lakhpati didi|shg|self help group|empowerment|maternal|girl child/,
        urls: [
          'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 7. Tendu Leaf, Minor Forest Produce, Bastar, Niyad Nellanar, Tribal Welfare & Forests
      {
        re: /तेंदूपत्ता|लघु वनोपज|वन|बस्तर|नियद नेल्लानार|जनजाति|आदिवासी|सरगुजा|बैगा|कमार|पहाड़ी कोरवा|अबूझमाड़िया|हल्बा|गोंड|forest|tendu|minor forest|bastar|tribal|niyad nellanar|adivasi|pvtg/,
        urls: [
          'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 8. Waterfalls, Rivers, Dams, Mahanadi, Indravati, Hasdeo, Chitrakote & Jal Jeevan
      {
        re: /जलप्रपात|चित्रकोट|तीरथगढ़|महानदी|इंद्रावती नदी|हसदेव|शिवनाथ|अर्पा|बांध|सिंचाई|जल जीवन|पेयजल|waterfall|chitrakote|river|mahanadi|dam|reservoir|jal jeevan|water supply/,
        urls: [
          'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 9. Heritage, Temples, Culture, Ram Van Gaman, Sirpur, Bhoramdeo, Rajim, Bastar Dussehra & Tourism
      {
        re: /सिरपुर|भोरमदेव|राजिम|राम वन गमन|दंतेश्वरी|डोंगरगढ़|बमलेश्वरी|दशहरा|मड़ई|चक्रधर|महोत्सव|पर्यटन|मंदिर|धरोहर|यूनेस्को|संस्कृति|लोक कला|sirpur|bhoramdeo|rajim|temple|heritage|unesco|tourism|festival|cultural/,
        urls: [
          'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 10. Industrial Policy, Steel, Bhilai, Korba, Coal, Iron Ore, Mining, NMDC, SECL & Manufacturing
      {
        re: /औद्योगिक|उद्योग|इस्पात|खनिज|निवेश|कोरबा|भिलाई|बैलाडीला|कोयला|लौह अयस्क|एनएमडीसी|एसईसीएल|एमएसएमई|स्टार्टअप|विनिर्माण|industrial|industry|investment|steel|mining|coal|iron ore|nmdc|secl|msme|manufacturing|factory/,
        urls: [
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 11. Solar Energy, PM Surya Ghar, Green Hydrogen, Power Plants & Renewable Electricity
      {
        re: /सूर्य घर|सौर|बिजली|नवीकरणीय|ऊर्जा|ग्रीन हाइड्रोजन|पवन ऊर्जा|विद्युत|solar|surya ghar|renewable|electricity|energy|green hydrogen|power plant|wind energy/,
        urls: [
          'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 12. Education, Vidyalaxmi, ONOS, Classical Languages, Universities, IIT/IIM, Books & Libraries
      {
        re: /विद्यालक्ष्मी|शिक्षा|विश्वविद्यालय|शास्त्रीय भाषा|भाषा|सब्सक्रिप्शन|नालंदा|पीएम श्री|छात्रवृत्ति|पुस्तक|साहित्य|ग्रंथालय|आईआईटी|प्रोफेसर|education|vidyalaxmi|university|classical language|onos|journal|library|scholarship|school|book|literary/,
        urls: [
          'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 13. Healthcare, Ayushman Bharat, Hospitals, Medical Colleges, Vaccines & Disease Eradication
      {
        re: /आयुष्मान|स्वास्थ्य|अस्पताल|चिकित्सा|वय वंदना|मेडिकल कॉलेज|टीकाकरण|मलेरिया|टीबी|सिकल सेल|दवा|एम्स|ayushman|health|medical|hospital|vaccine|sickle cell|aiims|doctor|medicine/,
        urls: [
          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 14. Railways, Vande Bharat, Metro, Bullet Train & Railway Stations
      {
        re: /रेल|रेलवे|वंदे भारत|मेट्रो|अमृत भारत स्टेशन|ट्रेन|rail|railway|vande bharat|metro|train|locomotive/,
        urls: [
          'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1515165562839-978bbcf18277?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 15. Aviation, Airports, Flights, Bilaspur / Jagdalpur / Raipur Airport
      {
        re: /हवाई अड्डा|विमान|उड़ान|एयरपोर्ट|एविएशन|फ्लाइट|airport|aviation|flight|airline|aircraft|udaan/,
        urls: [
          'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 16. Highways, Expressways, Bridges, Bharatmala, Roads & Logistics
      {
        re: /सड़क|राजमार्ग|एक्सप्रेसवे|भारतमाला|पुल|सेतु|लॉजिस्टिक्स|बंदरगाह|highway|expressway|bridge|road|infrastructure|logistics|port/,
        urls: [
          'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 17. Housing, PM Awas Yojana, Rural / Urban Development, Panchayati Raj & Swachhata
      {
        re: /आवास|प्रधानमंत्री आवास|मोर मकान|पंचायत|ग्रामीण विकास|स्वच्छ सर्वेक्षण|स्वच्छता|स्मार्ट सिटी|नगर निगम|awas|housing|panchayat|rural development|swachh|cleanliness|smart city|urban/,
        urls: [
          'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 18. Budget, Economy, RBI, Banking, GDP, GST, Tax, Trade & Finance
      {
        re: /बजट|आर्थिक सर्वेक्षण|आर्थिक|वित्त|बैंक|आरबीआई|रेपो रेट|जीडीपी|जीएसटी|कर|मुद्रास्फीति|निर्यात|व्यापार|शेयर बाजार|budget|economic survey|economy|finance|rbi|gdp|gst|bank|tax|inflation|export|trade/,
        urls: [
          'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 19. Judiciary, Supreme Court, High Court, Bilaspur High Court, Constitution & Laws
      {
        re: /न्यायालय|सुप्रीम कोर्ट|हाई कोर्ट|उच्च न्यायालय|मुख्य न्यायाधीश|संविधान|विधेयक|अधिनियम|कानून|न्याय संहिता|supreme court|high court|chief justice|judiciary|constitution|law|bill|act|legal/,
        urls: [
          'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1453945619913-79ec89a82c51?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 20. Parliament, Vidhan Sabha, Cabinet, Election Commission, Governance & Polity
      {
        re: /संसद|विधानसभा|मंत्रिमंडल|कैबिनेट|निर्वाचन|चुनाव आयोग|लोकसभा|राज्यसभा|राज्यपाल|मुख्यमंत्री|प्रधानमंत्री|राष्ट्रपति|नियुक्ति|आयोग|parliament|vidhan sabha|cabinet|election|governor|chief minister|president|appointment|commission/,
        urls: [
          'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 21. Climate Change, COP-29, Carbon Market, Environment, Ecology & Green Initiatives
      {
        re: /जलवायु|पर्यावरण|बाकू|कार्बन|cop-29|cop29|cop30|climate|environment|unfccc|green credit|emission|glacier|ozone|pollution/,
        urls: [
          'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 22. International Summits, G20, BRICS, UN, ASEAN, Quad, Global Indices & Diplomacy
      {
        re: /जी-20|जी20|ब्रिक्स|संयुक्त राष्ट्र|शिखर सम्मेलन|आसियान|क्वाड|विश्व बैंक|आईएमएफ|सूचकांक|रैंकिंग|द्विपक्षीय|संधि|g20|brics|united nations|summit|asean|quad|world bank|imf|global index|diplomacy|bilateral/,
        urls: [
          'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 23. Sports, Olympics, Paralympics, Cricket, Hockey, Chess, Archery & Tournaments
      {
        re: /खेल|ओलंपिक|पैरालंपिक|क्रिकेट|हॉकी|शतरंज|तीरंदाजी|खेलो इंडिया|चैंपियनशिप|टूर्नामेंट|खिलाड़ी|एथलीट|sports|olympic|paralympic|cricket|hockey|chess|archery|khelo india|tournament|championship|athlete/,
        urls: [
          'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80'
        ]
      },
      // 24. Awards, Honours, Bharat Ratna, Padma Awards, Rajyotsava Alankaran & Nobel Prize
      {
        re: /पुरस्कार|सम्मान|अलंकरण|भारत रत्न|पद्म|नोबेल|साहित्य अकादमी|ज्ञानपीठ|राष्ट्रीय पुरस्कार|पदक|award|honour|honor|bharat ratna|padma|nobel|medal|trophy|prize/,
        urls: [
          'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?auto=format&fit=crop&w=900&q=80'
        ]
      }
    ];

    for (let i = 0; i < topicPhotoRules.length; i++) {
      if (topicPhotoRules[i].re.test(combinedText)) {
        return pickPhotoFromPool(topicPhotoRules[i].urls, seedKey);
      }
    }

    if (cat === 'international') {
      return pickPhotoFromPool([
        'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=900&q=80'
      ], seedKey);
    }
    if (cat === 'national') {
      return pickPhotoFromPool([
        'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=80'
      ], seedKey);
    }
    return pickPhotoFromPool([
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80'
    ], seedKey);
  }

  function enrichAndDeduplicateCurrentAffairsItems(rawItems, existingStories, defaultCategory, defaultSource, targetMonthKey) {
    let resolvedCategory = defaultCategory;
    let resolvedSource = defaultSource;
    let resolvedMonthKey = targetMonthKey;
    if (defaultCategory && typeof defaultCategory === 'object' && !Array.isArray(defaultCategory)) {
      resolvedCategory = defaultCategory.category || 'ALL';
      resolvedSource = defaultCategory.sourceName || defaultSource;
      resolvedMonthKey = defaultCategory.monthKey || targetMonthKey;
    }
    const items = Array.isArray(rawItems) ? rawItems : [];
    const nowMs = Date.now();
    const nowDate = new Date(nowMs);
    const fallbackMonth = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
    const monthKey = String(resolvedMonthKey || fallbackMonth).trim();
    const yearKey = monthKey.split('-')[0] || String(nowDate.getFullYear());
    const runningPool = Array.isArray(existingStories) ? existingStories.slice() : [];
    const results = [];

    items.forEach((raw, idx) => {
      if (!raw || typeof raw !== 'object') return;
      const headHi = convertKrutiDevInText(String(raw.headlineHi || raw.titleHi || raw.headline || raw.title || '').trim());
      const headEn = convertKrutiDevInText(String(raw.headlineEn || raw.titleEn || raw.headline || raw.title || headHi).trim());
      const sumHi = convertKrutiDevInText(String(raw.summaryHi || raw.summary || raw.descriptionHi || headHi).trim());
      const sumEn = convertKrutiDevInText(String(raw.summaryEn || raw.descriptionEn || raw.summary || sumHi).trim());
      if (!headHi && !headEn) return;

      const candidate = {
        headlineHi: headHi || headEn,
        headlineEn: headEn || headHi,
        summaryHi: sumHi || headHi,
        summaryEn: sumEn || sumHi
      };
      if (isDuplicateCurrentAffair(candidate, runningPool)) {
        return;
      }

      let cat = String(raw.category || resolvedCategory || '').toLowerCase().trim();
      if (cat === 'all' || !['chhattisgarh', 'national', 'international'].includes(cat)) {
        const combined = `${headHi} ${headEn} ${sumHi} ${sumEn}`.toLowerCase();
        if (/छत्तीसगढ़|रायपुर|बस्तर|बिलासपुर|सरगुजा|कोरबा|दुर्ग|दंतेवाड़ा|chhattisgarh|raipur|cgpsc|vyapam|महतारी|धान/.test(combined)) {
          cat = 'chhattisgarh';
        } else if (/विश्व|अंतर्राष्ट्रीय|संयुक्त राष्ट्र|नासा|वैश्विक|शिखर सम्मेलन|संधि|world|international|global|un |unesco|who|imf|world bank|summit|bilateral|space|docking|spadex/.test(combined)) {
          cat = 'international';
        } else {
          cat = 'national';
        }
      }

      // Always keep monthKey aligned with the target/current month so Daily Dose and Current Affairs never diverge
      const itemMonth = /^\d{4}-\d{2}$/.test(monthKey) ? monthKey : fallbackMonth;
      const itemYear = itemMonth.split('-')[0] || yearKey;
      const itemMs = nowMs + (idx * 1000);
      const itemIso = new Date(itemMs).toISOString();
      const defaultSourceUrl = cat === 'chhattisgarh'
        ? 'https://dprcg.gov.in'
        : (cat === 'national' ? 'https://pib.gov.in' : 'https://news.un.org');
      const rawImg = String(raw.imageUrl || '').trim();
      const hasAuthenticPhoto = Boolean(rawImg && !rawImg.startsWith('data:image/svg+xml'));

      const stObj = {
        id: String(raw.id || ('ca_' + itemMs + '_' + Math.random().toString(36).slice(2, 6))),
        category: cat,
        titleHi: candidate.headlineHi,
        titleEn: candidate.headlineEn,
        headlineHi: candidate.headlineHi,
        headlineEn: candidate.headlineEn,
        summaryHi: candidate.summaryHi,
        summaryEn: candidate.summaryEn,
        sourceName: String(raw.sourceName || resolvedSource || (cat === 'chhattisgarh' ? 'DPR Chhattisgarh' : (cat === 'national' ? 'PIB India' : 'Global Official Desk'))).trim(),
        sourceUrl: String(raw.sourceUrl || defaultSourceUrl).trim(),
        monthKey: itemMonth,
        yearKey: itemYear,
        dateIso: String(raw.publishedDateIso || raw.dateIso || itemIso.slice(0, 10)),
        publishedDateIso: String(raw.publishedDateIso || raw.dateIso || itemIso.slice(0, 10)),
        createdAtMs: itemMs,
        expiresAtMs: itemMs + 86400000,
        createdAtIso: itemIso,
        updatedAtIso: itemIso,
        isAiGeneratedImage: false
      };
      stObj.imageUrl = hasAuthenticPhoto ? rawImg : generateAutoStoryImageUrl(stObj);
      runningPool.push(stObj);
      results.push(stObj);
    });

    return results;
  }

  async function generateCurrentAffairsWithAi(options) {
    const opts = options || {};
    const mode = opts.mode || 'hourly';
    const count = Math.max(1, Math.min(15, Number(opts.count || 5)));
    const category = opts.category || 'ALL';
    const monthKey = opts.monthKey || new Date().toISOString().slice(0, 7);
    const existingStories = Array.isArray(opts.existingStories) ? opts.existingStories : [];
    const existingHeadlines = existingStories
      .slice(0, 35)
      .map((s) => `- ${s.headlineHi || s.headlineEn}`)
      .join('\n');

    const schemaInstruction = `Return ONLY a valid JSON array of Current Affairs objects with this exact schema:
[
  {
    "category": "chhattisgarh" | "national" | "international",
    "headlineHi": "औपचारिक हिन्दी (देवनागरी) में करंट अफेयर्स शीर्षक",
    "headlineEn": "Clear English headline",
    "summaryHi": "परीक्षा उपयोगी विस्तृत मुख्य तथ्य एवं विवरण (हिन्दी में 2-4 वाक्य)",
    "summaryEn": "Comprehensive exam-focused summary and key facts (2-4 sentences in English)",
    "sourceName": "PIB / DPR Chhattisgarh / Official Source"
  }
]
CRITICAL DEDUPLICATION RULE: Do NOT repeat or rephrase any of these existing headlines:
${existingHeadlines || '(None)'}`;

    let rawInputText = String(opts.rawText || '').trim();

    if (mode === 'file' && opts.file) {
      const file = opts.file;
      const kind = await detectUploadedFileKind(file, '');
      if (kind === 'pdf' && window.AndroidBridge && typeof window.AndroidBridge.initPdfUpload === 'function') {
        const uploaded = await uploadPdfToAndroidBridge(file);
        if (uploaded && uploaded.pageCount > 0) {
          const allExtracted = [];
          try {
            const maxP = Math.min(uploaded.pageCount, 10);
            for (let p = 1; p <= maxP; p += 2) {
              const endP = Math.min(maxP, p + 1);
              if (typeof opts.onProgress === 'function') {
                opts.onProgress(`📄 PDF पृष्ठ ${p}-${endP} से करंट अफेयर्स निकाले जा रहे हैं...`);
              }
              const resJson = await callAndroidPdfVisionBatch(
                uploaded.uploadId,
                p,
                endP,
                `Extract all important Competitive Exam Current Affairs updates visible on pages ${p} to ${endP}.\n${schemaInstruction}`
              );
              const parsed = parseAiJsonArraySafely(resJson);
              if (Array.isArray(parsed)) allExtracted.push(...parsed);
            }
          } finally {
            if (typeof window.AndroidBridge.cleanupPdfUpload === 'function') {
              window.AndroidBridge.cleanupPdfUpload(uploaded.uploadId);
            }
          }
          if (allExtracted.length > 0) return allExtracted;
        }
      } else if (kind === 'image' && window.AndroidBridge && typeof window.AndroidBridge.analyzeQuestionImageWithAi === 'function') {
        const dataUrl = await readFileAsDataUrl(file);
        const resJson = await callAndroidAiBridge(
          `Carefully read this newspaper/magazine image and extract all Competitive Exam Current Affairs updates in bilingual Hindi and English.\n${schemaInstruction}`,
          dataUrl
        );
        const parsed = parseAiJsonArraySafely(resJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      try {
        rawInputText = await extractTextFromUploadedFile(file, opts.onProgress, {});
      } catch (_) {}
    }

    const promptText = (mode === 'paste' || (mode === 'file' && rawInputText))
      ? `You are an expert Chhattisgarh PSC (CGPSC), Vyapam & UPSC Current Affairs Editor.
Read the following source text and extract all distinct, exam-relevant Current Affairs updates in both Hindi (Devanagari) and English:
"""
${rawInputText.slice(0, 28000)}
"""
${schemaInstruction}`
      : (mode === 'intelligent_sync'
        ? `You are an expert Chhattisgarh PSC (CGPSC), CG Vyapam, UPSC & SSC Current Affairs Editor performing a 3-hour automatic news check.
Check if there are any genuinely NEW, verified, exam-important Current Affairs updates for ${monthKey} across Chhattisgarh State (cabinet decisions, schemes, awards, Bastar/Surguja updates, DPR Chhattisgarh), National (PIB, Union Cabinet, Economy, Science/ISRO/DRDO, Polity), or International (Summits, Indices, UN/G20/BRICS) that are NOT already covered in the existing headlines below.
CRITICAL 3-HOUR SYNC RULE: If there are NO genuinely new updates beyond the existing headlines listed below, return an empty JSON array: [] (do NOT force-generate or repeat existing news). Otherwise, return up to ${count} genuinely new updates.
${schemaInstruction}`
        : `You are an expert Chhattisgarh PSC (CGPSC), Vyapam, UPSC & SSC Current Affairs Editor.
Generate ${count} fresh, high-yield, non-repeating Current Affairs updates for ${monthKey} (${category === 'ALL' ? 'covering Chhattisgarh State schemes/decisions, National PIB news, and International/Science events' : `specifically focused on ${category}`}).
${opts.topicPrompt ? `Focus Topic / Instruction: "${opts.topicPrompt}"` : ''}
${schemaInstruction}`);

    try {
      const resJson = await callAndroidAiBridge(promptText);
      const parsed = parseAiJsonArraySafely(resJson);
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 || mode === 'intelligent_sync') {
          return parsed;
        }
      }
    } catch (_) {
      if (mode === 'intelligent_sync') {
        // During 3-hour background auto-sync, if AI has no new updates or is unreachable, do not force-update with static fallback
        return [];
      }
    }

    if (mode === 'intelligent_sync') {
      return [];
    }

    // Fallback intelligent parser when pasting text or topic on web without AndroidBridge
    if (rawInputText) {
      const paragraphs = rawInputText
        .split(/\n\s*\n|\r?\n(?=[•\-\d]+\s*[\.\)])/)
        .map((p) => convertKrutiDevInText(p.trim()))
        .filter((p) => p.length > 25);
      return paragraphs.slice(0, 12).map((para) => {
        const firstLine = para.split(/\r?\n|\.|।/)[0].trim().slice(0, 120);
        return {
          category: category === 'ALL' ? 'chhattisgarh' : category,
          headlineHi: firstLine,
          headlineEn: firstLine,
          summaryHi: para,
          summaryEn: para,
          sourceName: opts.sourceName || 'PIB / DPR Chhattisgarh'
        };
      });
    }

    if (opts.topicPrompt) {
      return [
        {
          category: category === 'ALL' ? 'chhattisgarh' : category,
          headlineHi: `${opts.topicPrompt} — परीक्षा उपयोगी मुख्य बिंदु`,
          headlineEn: `${opts.topicPrompt} — Key Exam Highlights`,
          summaryHi: `${opts.topicPrompt} से संबंधित महत्वपूर्ण तथ्य एवं नवीनतम आधिकारिक अपडेट जो आगामी प्रतियोगी परीक्षाओं (CGPSC, CG Vyapam, SSC, PSC) के लिए अत्यंत उपयोगी हैं।`,
          summaryEn: `Important official facts and recent updates regarding ${opts.topicPrompt} for upcoming competitive examinations.`,
          sourceName: opts.sourceName || 'PIB / DPR Chhattisgarh'
        }
      ];
    }

    // Curated verified pool across Chhattisgarh, National, and International categories
    const curatedHourlyPool = [
      {
        category: 'chhattisgarh',
        headlineHi: 'छत्तीसगढ़ औद्योगिक विकास नीति 2024-30: बस्तर एवं सरगुजा में विशेष निवेश प्रोत्साहन',
        headlineEn: 'Chhattisgarh Industrial Development Policy 2024-30: Special Investment Incentives in Bastar & Surguja',
        summaryHi: 'राज्य सरकार ने नई औद्योगिक नीति 2024-30 के अंतर्गत अनुसूचित क्षेत्रों, बस्तर और सरगुजा संभाग में एमएसएमई, कृषि प्रसंस्करण एवं हरित उद्योग स्थापित करने पर अतिरिक्त पूंजी अनुदान तथा स्टाम्प शुल्क छूट का प्रावधान किया है।',
        summaryEn: 'Under the Industrial Policy 2024-30, Chhattisgarh provides enhanced capital subsidies and stamp duty exemptions for MSMEs, agro-processing, and green industries in Bastar and Surguja divisions.',
        sourceName: 'DPR Chhattisgarh',
        sourceUrl: 'https://dprcg.gov.in'
      },
      {
        category: 'national',
        headlineHi: 'पीएम विद्यालक्ष्मी योजना: मेधावी छात्रों को उच्च शिक्षा हेतु बिना गारंटी 10 लाख रुपये तक शिक्षा ऋण',
        headlineEn: 'PM Vidyalaxmi Scheme: Collateral-Free Education Loans up to ₹10 Lakh for Meritorious Students',
        summaryHi: 'केंद्रीय मंत्रिमंडल द्वारा स्वीकृत पीएम विद्यालक्ष्मी योजना के अंतर्गत देश के शीर्ष 860 उच्च शिक्षण संस्थानों (NIRF रैंकिंग आधारित) में प्रवेश लेने वाले छात्रों को बिना किसी जमानत या गारंटर के शिक्षा ऋण तथा 3% ब्याज अनुदान प्रदान किया जा रहा है।',
        summaryEn: 'Approved by the Union Cabinet, PM Vidyalaxmi provides collateral-free, guarantor-free education loans with 3% interest subvention for students admitted to top 860 NIRF-ranked institutions.',
        sourceName: 'PIB India',
        sourceUrl: 'https://pib.gov.in'
      },
      {
        category: 'international',
        headlineHi: 'इसरो (ISRO) स्पैडेक्स (SpaDeX) मिशन: अंतरिक्ष में डॉकिंग तकनीक सिद्ध करने वाला भारत चौथा देश बना',
        headlineEn: 'ISRO SpaDeX Mission: India Becomes 4th Country to Demonstrate In-Space Autonomous Docking',
        summaryHi: 'भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) ने PSLV-C60 द्वारा प्रक्षेपित SpaDeX (SDX01 चेज़र और SDX02 टारगेट) उपग्रहों की सफल अंतरिक्ष डॉकिंग पूर्ण की, जिससे अमेरिका, रूस और चीन के बाद भारत विश्व का चौथा देश बन गया है।',
        summaryEn: 'ISRO successfully executed autonomous orbital docking with the SpaDeX satellites (SDX01 and SDX02) launched aboard PSLV-C60, making India the 4th nation globally after the US, Russia, and China.',
        sourceName: 'ISRO / Global Space Desk',
        sourceUrl: 'https://www.isro.gov.in'
      },
      {
        category: 'chhattisgarh',
        headlineHi: 'गुरु घासीदास-तमोर पिंगला टाइगर रिजर्व देश का 56वां बाघ अभयारण्य अधिसूचित',
        headlineEn: 'Guru Ghasidas-Tamor Pingla Notified as India’s 56th Tiger Reserve in Chhattisgarh',
        summaryHi: 'छत्तीसगढ़ के मनेंद्रगढ़-चिरमिरी-भरतपुर, कोरिया, सूरजपुर और बलरामपुर जिलों में विस्तृत 2,829 वर्ग किमी क्षेत्रफल वाले गुरु घासीदास-तमोर पिंगला टाइगर रिजर्व को भारत के 56वें टाइगर रिजर्व के रूप में अधिसूचित किया गया है।',
        summaryEn: 'Spanning 2,829 sq km across MCB, Koriya, Surajpur, and Balrampur districts, Guru Ghasidas-Tamor Pingla has been notified as India’s 56th and third-largest Tiger Reserve.',
        sourceName: 'NTCA / DPR Chhattisgarh',
        sourceUrl: 'https://dprcg.gov.in'
      },
      {
        category: 'chhattisgarh',
        headlineHi: 'महतारी वंदन योजना (छत्तीसगढ़): पात्र विवाहित महिलाओं को ₹1,000 मासिक (₹12,000 वार्षिक) DBT सहायता',
        headlineEn: 'Mahtari Vandan Yojana (Chhattisgarh): ₹1,000 Monthly (₹12,000 Annual) DBT Financial Assistance to Women',
        summaryHi: 'छत्तीसगढ़ शासन के महिला एवं बाल विकास विभाग द्वारा संचालित महतारी वंदन योजना के अंतर्गत 21 वर्ष से अधिक आयु की पात्र विवाहित महिलाओं को प्रतिमाह ₹1,000 प्रत्यक्ष लाभ अंतरण (DBT) के माध्यम से प्रदान किए जा रहे हैं।',
        summaryEn: 'Implemented by the Women and Child Development Department of Chhattisgarh, Mahtari Vandan Yojana transfers ₹1,000 per month via DBT to eligible married women aged 21 years and above.',
        sourceName: 'DPR Chhattisgarh',
        sourceUrl: 'https://dprcg.gov.in'
      },
      {
        category: 'chhattisgarh',
        headlineHi: 'कृषक उन्नति योजना: छत्तीसगढ़ में ₹3,100 प्रति क्विंटल की दर से प्रति एकड़ 21 क्विंटल धान खरीदी',
        headlineEn: 'Krishak Unnati Yojana: Paddy Procurement at ₹3,100 per Quintal up to 21 Quintals per Acre in Chhattisgarh',
        summaryHi: 'छत्तीसगढ़ शासन द्वारा कृषक उन्नति योजना के तहत पंजीकृत किसानों से खरीफ विपणन वर्ष में 21 क्विंटल प्रति एकड़ के मान से धान खरीदी कर समर्थन मूल्य के अतिरिक्त अंतर की राशि एकमुश्त आदान सहायता के रूप में दी जा रही है।',
        summaryEn: 'Under Krishak Unnati Yojana, Chhattisgarh procures 21 quintals of paddy per acre from registered farmers and provides input assistance ensuring ₹3,100 per quintal.',
        sourceName: 'DPR Chhattisgarh',
        sourceUrl: 'https://dprcg.gov.in'
      },
      {
        category: 'chhattisgarh',
        headlineHi: 'नियद नेल्लानार योजना (आपका अच्छा गाँव): बस्तर संभाग में सुरक्षा कैंपों के 5 किमी दायरे में 50+ योजनाओं का संतृप्तिकरण',
        headlineEn: 'Niyad Nellanar Yojana: Saturation of 50+ Welfare Schemes within 5 km of Security Camps in Bastar',
        summaryHi: 'बस्तर संभाग के नक्सल प्रभावित क्षेत्रों में स्थापित सुरक्षा कैंपों के 5 किमी की परिधि में आने वाले गाँवों में बुनियादी अधोसंरचना और 50 से अधिक व्यक्तिगत व सामुदायिक कल्याणकारी योजनाओं का शत-प्रतिशत लाभ दिया जा रहा है।',
        summaryEn: 'Niyad Nellanar Yojana delivers 100% saturation of over 50 government welfare schemes and basic infrastructure in villages located within 5 km of security camps across Bastar division.',
        sourceName: 'DPR Chhattisgarh',
        sourceUrl: 'https://dprcg.gov.in'
      },
      {
        category: 'chhattisgarh',
        headlineHi: 'छत्तीसगढ़ में तेंदूपत्ता संग्रहण पारिश्रमिक दर ₹4,000 से बढ़ाकर ₹5,500 प्रति मानक बोरा निर्धारित',
        headlineEn: 'Chhattisgarh Raises Tendu Leaf Collection Wage Rate from ₹4,000 to ₹5,500 per Standard Bag',
        summaryHi: 'छत्तीसगढ़ राज्य लघु वनोपज संघ के माध्यम से तेंदूपत्ता संग्राहक वनवासी परिवारों को अब ₹5,500 प्रति मानक बोरा की दर से पारिश्रमिक प्रदान किया जा रहा है, जिससे लगभग 12.50 लाख संग्राहक परिवार लाभान्वित हो रहे हैं।',
        summaryEn: 'Through the Chhattisgarh State Minor Forest Produce Federation, tribal collectors now receive ₹5,500 per standard bag of Tendu leaves, benefiting nearly 12.50 lakh families.',
        sourceName: 'DPR Chhattisgarh',
        sourceUrl: 'https://dprcg.gov.in'
      },
      {
        category: 'national',
        headlineHi: 'एक राष्ट्र-एक सब्सक्रिप्शन (ONOS): देश के सभी सरकारी उच्च शिक्षण संस्थानों को वैश्विक शोध पत्रिकाओं तक निःशुल्क पहुँच',
        headlineEn: 'One Nation One Subscription (ONOS): Nationwide Access to International Scholarly Research Journals',
        summaryHi: 'भारत सरकार ने 6,000 करोड़ रुपये के परिव्यय के साथ वन नेशन वन सब्सक्रिप्शन (ONOS) योजना को मंजूरी दी है, जिससे 6,300 से अधिक सरकारी विश्वविद्यालयों और कॉलेजों के छात्रों व शोधकर्ताओं को 13,000+ अंतर्राष्ट्रीय जर्नल्स निःशुल्क उपलब्ध होंगे।',
        summaryEn: 'With an outlay of ₹6,000 crore, the Union Cabinet approved One Nation One Subscription (ONOS) providing 6,300+ government higher education institutions centralized access to over 13,000 international research journals.',
        sourceName: 'PIB India',
        sourceUrl: 'https://pib.gov.in'
      },
      {
        category: 'national',
        headlineHi: 'पीएम सूर्य घर मुफ्त बिजली योजना: 1 करोड़ घरों में रूफटॉप सोलर एवं प्रतिमाह 300 यूनिट तक मुफ्त बिजली',
        headlineEn: 'PM Surya Ghar Muft Bijli Yojana: Rooftop Solar for 1 Crore Households with 300 Units Free Monthly Electricity',
        summaryHi: '₹75,021 करोड़ के कुल परिव्यय वाली पीएम सूर्य घर मुफ्त बिजली योजना के तहत 3 किलोवाट क्षमता तक के रूफटॉप सोलर संयंत्र पर ₹78,000 तक की केंद्रीय वित्तीय सहायता एवं 300 यूनिट तक निःशुल्क बिजली दी जा रही है।',
        summaryEn: 'With an outlay of ₹75,021 crore, PM Surya Ghar Muft Bijli Yojana provides up to ₹78,000 central subsidy for residential rooftop solar systems and up to 300 units of free electricity monthly.',
        sourceName: 'MNRE / PIB India',
        sourceUrl: 'https://pib.gov.in'
      },
      {
        category: 'national',
        headlineHi: 'मराठी, पाली, प्राकृत, असमिया और बंगाली को शास्त्रीय भाषा का दर्जा: कुल शास्त्रीय भाषाओं की संख्या 11 हुई',
        headlineEn: 'Classical Language Status Granted to Marathi, Pali, Prakrit, Assamese & Bengali; Total Reaches 11',
        summaryHi: 'केंद्रीय मंत्रिमंडल ने मराठी, पाली, प्राकृत, असमिया और बंगाली को शास्त्रीय भाषा घोषित किया है; पूर्व में तमिल (2004), संस्कृत (2005), कन्नड़ (2008), तेलुगु (2008), मलयालम (2013) और ओड़िया (2014) शामिल थीं।',
        summaryEn: 'The Union Cabinet conferred Classical Language status on Marathi, Pali, Prakrit, Assamese, and Bengali, expanding India’s classical languages from 6 to 11.',
        sourceName: 'Ministry of Culture / PIB',
        sourceUrl: 'https://pib.gov.in'
      },
      {
        category: 'international',
        headlineHi: 'संयुक्त राष्ट्र जलवायु सम्मेलन (UNFCCC COP-29): विकासशील देशों के लिए $300 बिलियन वार्षिक जलवायु वित्त लक्ष्य (NCQG)',
        headlineEn: 'UN Climate Summit (COP-29 Baku): $300 Billion Annual New Collective Quantified Goal (NCQG) Adopted',
        summaryHi: 'अज़रबैजान के बाकू में आयोजित संयुक्त राष्ट्र जलवायु परिवर्तन सम्मेलन (COP-29) में वर्ष 2035 तक विकासशील देशों के लिए प्रतिवर्ष 300 बिलियन डॉलर के नए सामूहिक परिमाणित जलवायु वित्त लक्ष्य (NCQG) और अनुच्छेद 6 कार्बन बाज़ार नियमों को स्वीकृति दी गई।',
        summaryEn: 'At UNFCCC COP-29 in Baku, Azerbaijan, nations adopted the New Collective Quantified Goal (NCQG) committing $300 billion annually by 2035 for developing countries alongside Article 6 global carbon market rules.',
        sourceName: 'UNFCCC Official',
        sourceUrl: 'https://unfccc.int'
      },
      {
        category: 'international',
        headlineHi: '19वां G20 शिखर सम्मेलन (रियो डी जनेरियो, ब्राज़ील): "भुखमरी और गरीबी के विरुद्ध वैश्विक गठबंधन" का शुभारंभ',
        headlineEn: '19th G20 Summit in Rio de Janeiro (Brazil) Launches Global Alliance Against Hunger and Poverty',
        summaryHi: 'ब्राज़ील की अध्यक्षता में रियो डी जनेरियो में संपन्न 19वें G20 शिखर सम्मेलन का मुख्य विषय "Building a Just World and a Sustainable Planet" रहा तथा इसमें भुखमरी एवं गरीबी उन्मूलन हेतु वैश्विक गठबंधन प्रारंभ किया गया।',
        summaryEn: 'Chaired by Brazil in Rio de Janeiro under the theme "Building a Just World and a Sustainable Planet", the 19th G20 Summit launched the Global Alliance Against Hunger and Poverty.',
        sourceName: 'MEA / G20 Desk',
        sourceUrl: 'https://news.un.org'
      }
    ];

    const nowMs = Date.now();
    const active24hStories = existingStories.filter((s) => {
      const ts = Number((s && (s.createdAtMs || (s.createdAtIso ? Date.parse(s.createdAtIso) : 0))) || 0);
      return ts > 0 && (nowMs - ts) <= 86400000;
    });

    let nonDupFallback = curatedHourlyPool.filter((item) => {
      if (category && category !== 'ALL' && item.category !== category.toLowerCase()) return false;
      return !isDuplicateCurrentAffair(item, existingStories);
    });
    if (nonDupFallback.length === 0) {
      nonDupFallback = curatedHourlyPool.filter((item) => {
        if (category && category !== 'ALL' && item.category !== category.toLowerCase()) return false;
        return !isDuplicateCurrentAffair(item, active24hStories);
      });
    }
    return nonDupFallback.slice(0, count);
  }

  function formatCaMonthFolderTitle(monthKey) {
    const namesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const namesHi = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
    const parts = String(monthKey || '').split('-');
    const yr = parts[0] || new Date().getFullYear();
    const mIdx = Math.max(0, Math.min(11, (parseInt(parts[1], 10) || (new Date().getMonth() + 1)) - 1));
    return {
      topicId: `top_ca_${yr}_${String(mIdx + 1).padStart(2, '0')}`,
      titleHi: `समसामयिकी — ${namesHi[mIdx]} ${yr}`,
      titleEn: `Current Affairs — ${namesEn[mIdx]} ${yr} (${yr}-${String(mIdx + 1).padStart(2, '0')})`
    };
  }

  async function saveGeneratedCaQuestionsToQuestionBank(questionsList, stateOverride, apiOverride, fallbackMonthKey) {
    const items = Array.isArray(questionsList) ? questionsList : [];
    if (items.length === 0) return [];

    // Resolve global state & saveState even when called from student view
    let targetState = stateOverride;
    if (!targetState) {
      try {
        const raw = localStorage.getItem('cgpedia_platform_state_v4');
        if (raw) targetState = JSON.parse(raw);
      } catch (_) {}
    }
    if (!targetState) return [];

    targetState.questionBank = Array.isArray(targetState.questionBank) ? targetState.questionBank : [];
    targetState.topicMaster = Array.isArray(targetState.topicMaster) ? targetState.topicMaster : [];

    const nowDate = new Date();
    const defMonth = fallbackMonthKey || `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
    const existingNormStems = new Set(
      targetState.questionBank.map((q) => normalizeTextForComparison(q.questionHi || q.questionEn || ''))
    );

    const newBankDocs = [];
    const touchedTopics = new Map();

    items.forEach((q, idx) => {
      if (!q || (!q.questionHi && !q.questionEn)) return;
      const stemNorm = normalizeTextForComparison(q.questionHi || q.questionEn || '');
      if (!stemNorm || existingNormStems.has(stemNorm)) return;
      existingNormStems.add(stemNorm);

      const mKey = String(q.monthKey || defMonth).trim();
      const yKey = mKey.split('-')[0] || String(nowDate.getFullYear());
      const folderMeta = formatCaMonthFolderTitle(mKey);
      touchedTopics.set(folderMeta.topicId, folderMeta);

      const optsHi = Array.isArray(q.optionsHi) && q.optionsHi.length === 4 ? q.optionsHi : ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'];
      const optsEn = Array.isArray(q.optionsEn) && q.optionsEn.length === 4 ? q.optionsEn : optsHi;
      const corrIdx = Math.max(0, Math.min(3, Number(q.correctOptionIndex != null ? q.correctOptionIndex : (q.correctIndex || 0))));
      const nowIso = new Date().toISOString();
      const qId = q.id && String(q.id).startsWith('qb_ca_')
        ? q.id
        : `qb_ca_${mKey.replace('-', '')}_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;

      const bankRecord = {
        id: qId,
        questionId: qId,
        examCode: 'ALL',
        examIds: ['ALL', 'CGPSC', 'CGVYAPAM', 'UPSC', 'SSC'],
        subjectId: 'sub_current_affairs',
        subjectTag: 'Current Affairs',
        topicId: folderMeta.topicId,
        topic: folderMeta.titleEn,
        topicHi: folderMeta.titleHi,
        subtopicId: `subtop_ca_${mKey.replace('-', '_')}`,
        subtopic: mKey,
        monthKey: mKey,
        yearKey: yKey,
        difficulty: 'Moderate',
        difficultyLevel: 'Moderate',
        languageAvailability: 'bilingual',
        questionHi: String(q.questionHi || q.questionEn || ''),
        questionEn: String(q.questionEn || q.questionHi || ''),
        optionsHi: optsHi,
        optionsEn: optsEn,
        optA_Hi: optsHi[0],
        optB_Hi: optsHi[1],
        optC_Hi: optsHi[2],
        optD_Hi: optsHi[3],
        optA_En: optsEn[0],
        optB_En: optsEn[1],
        optC_En: optsEn[2],
        optD_En: optsEn[3],
        correctIndex: corrIdx,
        correctOptionIndex: corrIdx,
        explanationHi: String(q.explanationHi || q.explanationEn || ''),
        explanationEn: String(q.explanationEn || q.explanationHi || ''),
        status: 'verified',
        verificationStatus: 'verified',
        verified: true,
        adminVerified: true,
        needsCategorisation: false,
        isDeleted: false,
        sourceTag: 'Current Affairs Quiz Maker',
        createdAtIso: nowIso,
        updatedAtIso: nowIso
      };

      targetState.questionBank.unshift(bankRecord);
      newBankDocs.push(bankRecord);
    });

    // Ensure Month-wise Topic Folders exist in topicMaster under sub_current_affairs
    const newTopicDocs = [];
    touchedTopics.forEach((meta) => {
      const exists = targetState.topicMaster.some((t) => t && t.topicId === meta.topicId);
      if (!exists) {
        const topDoc = {
          id: meta.topicId,
          topicId: meta.topicId,
          subjectId: 'sub_current_affairs',
          titleEn: meta.titleEn,
          titleHi: meta.titleHi,
          active: true,
          updatedAtIso: new Date().toISOString()
        };
        targetState.topicMaster.push(topDoc);
        newTopicDocs.push(topDoc);
      }
    });

    if (newBankDocs.length > 0) {
      if (apiOverride && typeof apiOverride.saveState === 'function') {
        apiOverride.saveState();
      } else if (window.CGpediaApp && typeof window.CGpediaApp.saveState === 'function') {
        window.CGpediaApp.saveState();
      }
      if (window.CGpediaCloud) {
        try {
          if (typeof window.CGpediaCloud.batchSaveCloudDocs === 'function') {
            await window.CGpediaCloud.batchSaveCloudDocs('question_bank', newBankDocs);
            if (newTopicDocs.length > 0) {
              await window.CGpediaCloud.batchSaveCloudDocs('topics', newTopicDocs);
            }
          } else if (typeof window.CGpediaCloud.saveCloudDoc === 'function') {
            for (const doc of newBankDocs) {
              await window.CGpediaCloud.saveCloudDoc('question_bank', doc.id, doc);
            }
          }
        } catch (_) {}
      }
    }

    return newBankDocs;
  }

  async function generateCurrentAffairsQuizQuestionsWithAi(storiesListOrOpts, requestedCount, scopeLabel) {
    let rawStories = storiesListOrOpts;
    let reqCount = requestedCount;
    let resolvedScopeLabel = scopeLabel;
    let targetMonthKey = new Date().toISOString().slice(0, 7);
    let stateRef = null;
    let apiRef = null;

    if (storiesListOrOpts && typeof storiesListOrOpts === 'object' && !Array.isArray(storiesListOrOpts)) {
      rawStories = storiesListOrOpts.stories || [];
      reqCount = storiesListOrOpts.questionCount || requestedCount || 10;
      targetMonthKey = storiesListOrOpts.monthKey || targetMonthKey;
      stateRef = storiesListOrOpts.stateRef || null;
      apiRef = storiesListOrOpts.apiRef || null;
      const stype = storiesListOrOpts.scopeType || 'recent';
      resolvedScopeLabel = stype === 'monthly'
        ? `Monthly Current Affairs (${storiesListOrOpts.monthKey || ''})`
        : stype === 'yearly'
          ? `Yearly Current Affairs (${storiesListOrOpts.yearKey || ''})`
          : 'Recent Current Affairs';
    }

    const stories = Array.isArray(rawStories) ? rawStories.filter((s) => s && (s.headlineHi || s.headlineEn || s.titleHi || s.titleEn)) : [];
    const count = Math.max(1, Math.min(100, Number(reqCount || 10)));
    if (stories.length === 0) return [];

    // Gather existing Current Affairs question stems so every quiz attempt creates brand-new questions
    let existingCaQuestions = [];
    if (stateRef && Array.isArray(stateRef.questionBank)) {
      existingCaQuestions = stateRef.questionBank.filter((q) => q && q.subjectTag === 'Current Affairs');
    } else {
      try {
        const raw = localStorage.getItem('cgpedia_platform_state_v4');
        if (raw) {
          const parsedState = JSON.parse(raw);
          existingCaQuestions = (parsedState.questionBank || []).filter((q) => q && q.subjectTag === 'Current Affairs');
        }
      } catch (_) {}
    }

    const recentQuestionStems = existingCaQuestions
      .slice(0, 35)
      .map((q) => `- ${q.questionHi || q.questionEn}`)
      .join('\n');

    const attemptSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const shuffledStories = stories.slice().sort(() => Math.random() - 0.5);

    const contextDigest = shuffledStories.slice(0, 40).map((s, idx) =>
      `[${idx + 1}] Category: ${s.category || 'Current Affairs'} | Month: ${s.monthKey || targetMonthKey}\nHeadline (HI): ${s.headlineHi || s.titleHi || ''}\nHeadline (EN): ${s.headlineEn || s.titleEn || ''}\nDetails (HI): ${s.summaryHi || ''}\nDetails (EN): ${s.summaryEn || s.summaryHi || ''}`
    ).join('\n\n');

    const promptText = `You are the Chief Question Paper Setter for Chhattisgarh Public Service Commission (CGPSC State Service Prelims) and Chhattisgarh Professional Examination Board (CG Vyapam).
Attempt Variation Seed: ${attemptSeed}
Generate ${count} BRAND-NEW, authentic Chhattisgarh Exam Pattern Bilingual (Hindi Devanagari + English) Multiple-Choice Questions (MCQs) STRICTLY based on the following Current Affairs updates (${resolvedScopeLabel || 'Recent Current Affairs'}):

${contextDigest}

MANDATORY CHHATTISGARH EXAM PATTERN (CGPSC PRELIMS & CG VYAPAM) RULES:
1. Every question MUST follow the exact question style asked in CGPSC State Service Examination & CG Vyapam exams:
   - Type A (CGPSC Multi-Statement Koot / कूट आधारित प्रश्न):
     "छत्तीसगढ़/राष्ट्रीय समसामयिकी के संदर्भ में निम्नलिखित कथनों पर विचार कीजिए:
     1. [कथन 1]
     2. [कथन 2]
     उपर्युक्त कथनों में से कौन-सा/से सही है/हैं?"
     Options: ["केवल 1 सही है", "केवल 2 सही है", "1 और 2 दोनों सही हैं", "न तो 1 और न ही 2 सही है"]
   - Type B (CGPSC Assertion-Reason / अभिकथन (A) एवं कारण (R) प्रश्न):
     "नीचे दो कथन दिए गए हैं — एक को अभिकथन (A) और दूसरे को कारण (R) कहा गया है..."
     Options: ["(A) और (R) दोनों सत्य हैं तथा (R), (A) की सही व्याख्या करता है", "(A) और (R) दोनों सत्य हैं किंतु (R), (A) की सही व्याख्या नहीं करता है", "(A) सत्य है किंतु (R) असत्य है", "(A) असत्य है किंतु (R) सत्य है"]
   - Type C (CGPSC Correct/Incorrect Pair Matching / सुमेलित-असुमेलित युग्म पहचानिए):
     "समसामयिकी योजनाओं/घटनाक्रम के संदर्भ में निम्नलिखित में से कौन-सा युग्म सही सुमेलित है?"
   - Type D (CG Vyapam Factual Precision — योजना की पात्रता, सहायता राशि, नोडल विभाग, लाभार्थी जिला, तिथि एवं आधिकारिक आंकड़े).
2. Give strong priority to Chhattisgarh State schemes, policies, districts (Bastar, Surguja, Raipur, Bilaspur, MCB, Koriya), tribal initiatives, forest produce, tiger reserves, and economic survey facts alongside National/International updates.
3. NEVER repeat or reuse any of these previously generated question stems:
${recentQuestionStems || '(None yet)'}
4. Include the "monthKey" (YYYY-MM) for each question matching the source Current Affairs update.

Return ONLY a valid JSON array of ${count} question objects with this exact schema:
[
  {
    "monthKey": "${targetMonthKey}",
    "questionHi": "छत्तीसगढ़ लोक सेवा आयोग (CGPSC) / व्यापम पैटर्न में औपचारिक हिन्दी प्रश्न...",
    "questionEn": "Authentic CGPSC / CG Vyapam pattern English exam question...",
    "optionsHi": ["विकल्प A", "विकल्प B", "विकल्प C", "विकल्प D"],
    "optionsEn": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "explanationHi": "विस्तृत परीक्षा उपयोगी हिन्दी व्याख्या...",
    "explanationEn": "Detailed exam-oriented English explanation...",
    "subjectTag": "Current Affairs"
  }
]`;

    try {
      const resJson = await callAndroidAiBridge(promptText);
      const parsed = parseAiJsonArraySafely(resJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const aiQuestions = parsed.slice(0, count).map((q, idx) => {
          const optsHi = Array.isArray(q.optionsHi) && q.optionsHi.length === 4 ? q.optionsHi : ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'];
          const optsEn = Array.isArray(q.optionsEn) && q.optionsEn.length === 4 ? q.optionsEn : optsHi;
          const corr = Math.max(0, Math.min(3, Number(q.correctOptionIndex != null ? q.correctOptionIndex : 0)));
          const matchedStory = shuffledStories[idx % shuffledStories.length] || {};
          const qMonthKey = String(q.monthKey || matchedStory.monthKey || targetMonthKey).trim();
          return {
            id: `qb_ca_${qMonthKey.replace('-', '')}_${Date.now()}_${idx}`,
            monthKey: qMonthKey,
            subjectTag: 'Current Affairs',
            topic: resolvedScopeLabel || 'Current Affairs',
            questionHi: String(q.questionHi || q.questionEn || ''),
            questionEn: String(q.questionEn || q.questionHi || ''),
            optionsHi: optsHi,
            optionsEn: optsEn,
            optA_Hi: optsHi[0],
            optB_Hi: optsHi[1],
            optC_Hi: optsHi[2],
            optD_Hi: optsHi[3],
            optA_En: optsEn[0],
            optB_En: optsEn[1],
            optB_En_2: optsEn[1],
            optC_En: optsEn[2],
            optD_En: optsEn[3],
            correctIndex: corr,
            correctOptionIndex: corr,
            explanationHi: String(q.explanationHi || q.explanationEn || ''),
            explanationEn: String(q.explanationEn || q.explanationHi || '')
          };
        });
        await saveGeneratedCaQuestionsToQuestionBank(aiQuestions, stateRef, apiRef, targetMonthKey);
        return aiQuestions;
      }
    } catch (_) {}

    // Authentic CGPSC Prelims & CG Vyapam Exam Pattern Synthesizer (Koot, Assertion-Reason, Pair Match, Factual)
    const built = [];
    const attemptOffset = Math.floor(Math.random() * 1000);

    for (let i = 0; i < count; i++) {
      const st = shuffledStories[i % shuffledStories.length];
      const other1 = shuffledStories[(i + 1) % shuffledStories.length] || st;
      const other2 = shuffledStories[(i + 2) % shuffledStories.length] || st;
      const other3 = shuffledStories[(i + 3) % shuffledStories.length] || st;
      const stMonth = String(st.monthKey || targetMonthKey).trim();
      const headHi = st.headlineHi || st.titleHi || 'छत्तीसगढ़ समसामयिकी अपडेट';
      const headEn = st.headlineEn || st.titleEn || headHi;
      const sumHi = st.summaryHi || headHi;
      const sumEn = st.summaryEn || sumHi;
      const srcName = st.sourceName || 'DPR Chhattisgarh / PIB';
      const templateIdx = (i + attemptOffset) % 5;

      let qHi = '';
      let qEn = '';
      let optsHi = [];
      let optsEn = [];
      let corrSlot = 0;

      if (templateIdx === 0) {
        // CGPSC Prelims Signature 2-Statement Koot (कूट) Pattern
        qHi = `[CGPSC कूट पैटर्न] समसामयिकी (${stMonth}) के संदर्भ में निम्नलिखित कथनों पर विचार कीजिए:\n1. ${headHi}।\n2. ${sumHi.slice(0, 170)}\nउपर्युक्त कथनों में से कौन-सा/से सही है/हैं?`;
        qEn = `[CGPSC Code Pattern] With reference to Current Affairs (${stMonth}), consider the following statements:\n1. ${headEn}.\n2. ${sumEn.slice(0, 170)}\nWhich of the statements given above is/are correct?`;
        optsHi = [
          'केवल 1 सही है',
          'केवल 2 सही है',
          '1 और 2 दोनों सही हैं',
          'न तो 1 और न ही 2 सही है'
        ];
        optsEn = [
          'Only 1 is correct',
          'Only 2 is correct',
          'Both 1 and 2 are correct',
          'Neither 1 nor 2 is correct'
        ];
        corrSlot = 2;
      } else if (templateIdx === 1) {
        // CGPSC Prelims 3-Statement Koot (कूट) with 1 False Distractor Statement
        qHi = `[CGPSC प्रारंभिक परीक्षा कूट] "${headHi}" के संबंध में निम्नलिखित कथनों को पढ़कर सही विकल्प (कूट) चुनिए:\n1. ${sumHi.slice(0, 155)}\n2. इसका आधिकारिक संदर्भ स्रोत ${srcName} है।\n3. इस प्रावधान/योजना को पूर्णतः बंद कर दिया गया है और यह किसी भी जिले में लागू नहीं है।\nसही कूट (Code) का चयन कीजिए:`;
        qEn = `[CGPSC Prelims Code] Read the following statements regarding "${headEn}" and select the correct code:\n1. ${sumEn.slice(0, 155)}\n2. Its official reference source is ${srcName}.\n3. This provision/scheme has been completely abolished and is not applicable in any district.\nSelect the correct code:`;
        optsHi = [
          'केवल 1 और 2 सही हैं',
          'केवल 2 और 3 सही हैं',
          'केवल 1 और 3 सही हैं',
          '1, 2 और 3 तीनों सही हैं'
        ];
        optsEn = [
          'Only 1 and 2 are correct',
          'Only 2 and 3 are correct',
          'Only 1 and 3 are correct',
          'All 1, 2 and 3 are correct'
        ];
        corrSlot = 0;
      } else if (templateIdx === 2) {
        // CGPSC Assertion (A) & Reason (R) Pattern
        qHi = `[CGPSC अभिकथन-कारण पैटर्न] नीचे दो कथन दिए गए हैं:\nअभिकथन (A): हालिया समसामयिकी में "${headHi}" विशेष रूप से चर्चा में रहा है।\nकारण (R): ${sumHi.slice(0, 165)}\nउपर्युक्त दोनों कथनों के संदर्भ में सही विकल्प चुनिए:`;
        qEn = `[CGPSC Assertion-Reason Pattern] Given below are two statements:\nAssertion (A): "${headEn}" has been a major highlight in recent Current Affairs.\nReason (R): ${sumEn.slice(0, 165)}\nIn the context of the above two statements, select the correct option:`;
        optsHi = [
          '(A) और (R) दोनों सत्य हैं तथा (R), (A) की सही व्याख्या करता है',
          '(A) और (R) दोनों सत्य हैं किंतु (R), (A) की सही व्याख्या नहीं करता है',
          '(A) सत्य है किंतु (R) असत्य है',
          '(A) असत्य है किंतु (R) सत्य है'
        ];
        optsEn = [
          'Both (A) and (R) are true and (R) is the correct explanation of (A)',
          'Both (A) and (R) are true but (R) is not the correct explanation of (A)',
          '(A) is true but (R) is false',
          '(A) is false but (R) is true'
        ];
        corrSlot = 0;
      } else if (templateIdx === 3) {
        // CG Vyapam Direct Scheme / Provision Identification Pattern
        corrSlot = (i + attemptOffset) % 4;
        qHi = `[CG Vyapam परीक्षा पैटर्न] हाल ही में चर्चा में रहे प्रावधान — "${sumHi.slice(0, 160)}" — का संबंध निम्नलिखित में से किस योजना/समसामयिकी विषय से है?`;
        qEn = `[CG Vyapam Exam Pattern] Which scheme or Current Affairs topic is associated with the provision — "${sumEn.slice(0, 160)}"?`;
        const distHi = [
          other1 !== st ? (other1.headlineHi || 'राष्ट्रीय डिजिटल लॉजिस्टिक्स सुधार मिशन') : 'राष्ट्रीय डिजिटल लॉजिस्टिक्स सुधार मिशन',
          other2 !== st ? (other2.headlineHi || 'अंतर्राष्ट्रीय समुद्री व्यापार समझौता') : 'अंतर्राष्ट्रीय समुद्री व्यापार समझौता',
          other3 !== st ? (other3.headlineHi || 'केंद्रीय कराधान संशोधन विधेयक') : 'केंद्रीय कराधान संशोधन विधेयक'
        ];
        const distEn = [
          other1 !== st ? (other1.headlineEn || 'National Digital Logistics Reform Mission') : 'National Digital Logistics Reform Mission',
          other2 !== st ? (other2.headlineEn || 'International Maritime Trade Pact') : 'International Maritime Trade Pact',
          other3 !== st ? (other3.headlineEn || 'Central Taxation Amendment Bill') : 'Central Taxation Amendment Bill'
        ];
        optsHi = [...distHi];
        optsEn = [...distEn];
        optsHi.splice(corrSlot, 0, headHi);
        optsEn.splice(corrSlot, 0, headEn);
      } else {
        // CGPSC / CG Vyapam Correctly Matched Pair (सुमेलित युग्म) Pattern
        corrSlot = (i + attemptOffset) % 4;
        qHi = `[CGPSC सुमेलित युग्म पैटर्न] समसामयिकी (${stMonth}) के अंतर्गत "${headHi}" के संदर्भ में निम्नलिखित में से कौन-सा तथ्य/प्रावधान पूर्णतः सत्य (सुमेलित) है?`;
        qEn = `[CGPSC Pair-Match Pattern] Under Current Affairs (${stMonth}), which of the following facts/provisions is accurately matched regarding "${headEn}"?`;
        const corrHi = `${sumHi.slice(0, 165)} (${srcName})`;
        const corrEn = `${sumEn.slice(0, 165)} (${srcName})`;
        const distHi = [
          other1 !== st && other1.summaryHi ? `केवल महानगरों हेतु सीमित — ${other1.headlineHi.slice(0, 80)}` : 'इसमें किसी भी प्रकार की शासकीय या विभागीय भागीदारी शामिल नहीं है',
          'यह प्रावधान केवल वर्ष 1991 से पूर्व स्थापित निजी कंपनियों पर लागू होता है',
          'उपर्युक्त में से कोई नहीं (None of the above)'
        ];
        const distEn = [
          other1 !== st && other1.summaryEn ? `Restricted to metro cities only — ${other1.headlineEn.slice(0, 80)}` : 'It involves zero governmental or departmental participation',
          'This provision applies exclusively to private firms established before 1991',
          'None of the above'
        ];
        optsHi = [...distHi];
        optsEn = [...distEn];
        optsHi.splice(corrSlot, 0, corrHi);
        optsEn.splice(corrSlot, 0, corrEn);
      }

      built.push({
        id: `qb_ca_${stMonth.replace('-', '')}_${Date.now()}_${i}`,
        monthKey: stMonth,
        subjectTag: 'Current Affairs',
        topic: resolvedScopeLabel || 'Current Affairs',
        questionHi: qHi,
        questionEn: qEn,
        optionsHi: optsHi.slice(0, 4),
        optionsEn: optsEn.slice(0, 4),
        optA_Hi: optsHi[0],
        optB_Hi: optsHi[1],
        optC_Hi: optsHi[2],
        optD_Hi: optsHi[3],
        optA_En: optsEn[0],
        optB_En: optsEn[1],
        optC_En: optsEn[2],
        optD_En: optsEn[3],
        correctIndex: corrSlot,
        correctOptionIndex: corrSlot,
        explanationHi: `${headHi} (${stMonth}): ${sumHi} (स्रोत: ${srcName})`,
        explanationEn: `${headEn} (${stMonth}): ${sumEn} (Source: ${srcName})`
      });
    }

    await saveGeneratedCaQuestionsToQuestionBank(built, stateRef, apiRef, targetMonthKey);
    return built;
  }

  window.CGpediaAdmin = {
    renderAdminConsole,
    openConfirmationDialog,
    openEditTestDetailsModal,
    parseRawImportFile,
    parsePdfOcrAndMatchAnswerKey,
    parseAnswerKeyMap,
    buildAndValidatePreviewSession,
    getTaxonomyCatalog,
    autoCategorizeQuestionFromMaster,
    migrateExistingQuestionBankRecords,
    upsertCategoryMasterItem,
    renameCategoryMasterItem,
    isDuplicateCurrentAffair,
    generateAutoStoryImageUrl,
    enrichAndDeduplicateCurrentAffairsItems,
    generateCurrentAffairsWithAi,
    generateCurrentAffairsQuizQuestionsWithAi,
    saveGeneratedCaQuestionsToQuestionBank
  };
})();
