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

  function renderAdminConsole(rootEl, state, api) {
    const activeSection = state.adminSection || 'overview';
    const totalStudents = Math.max(1, (state.registeredStudents || []).length);
    const publishedTests = (state.tests || []).filter((t) => t.status === 'published').length;
    const draftTests = (state.tests || []).filter((t) => t.status !== 'published').length;
    const totalQBank = (state.questionBank || []).length + (state.tests || []).reduce((acc, t) => acc + ((t.questions || []).length), 0);
    const totalRevenue = (state.activations || []).reduce((acc, a) => acc + Number(a.amountPaid || 0), 0);

    const subTabs = [
      { id: 'overview', label: '📊 Dashboard KPIs' },
      { id: 'folders', label: '🏛️ Exams & Series' },
      { id: 'tests', label: '📝 Test Builder (Draft/Publish)' },
      { id: 'qbank', label: '🧠 Question Bank (CSV/AI)' },
      { id: 'payments', label: '💳 UPI QR, Coupons & Unlocks' },
      { id: 'stories', label: '⚡ Current Affairs & PDFs' },
      { id: 'broadcast', label: '📢 Announcements & Queries' },
      { id: 'branding', label: '⚙️ Branding & Roles' }
    ];

    const existingNavRow = rootEl.querySelector('#adminSubTabNavRow');
    const existingBodyEl = rootEl.querySelector('#adminSubSectionBody');

    if (existingNavRow) {
      savedAdminNavScrollLeft = existingNavRow.scrollLeft;
    }

    if (!existingNavRow || !existingBodyEl) {
      rootEl.innerHTML = `
        <div class="hero-banner" style="padding:18px 20px;margin-bottom:16px;">
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
              <button class="btn btn-header-chip" id="adminExportBackupBtn">⬇️ Export JSON Backup</button>
              <button class="btn btn-header-chip" id="adminLockBtn">🔒 Exit Admin</button>
            </div>
          </div>
        </div>

        <div class="chip-row" id="adminSubTabNavRow" style="margin-bottom:16px;">
          ${subTabs.map((t) => `
            <button class="filter-chip ${activeSection === t.id ? 'active' : ''}" data-admin-subtab="${t.id}">
              ${t.label}
            </button>
          `).join('')}
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
        ownerBadge.textContent = `Owner: ${state.student.email || ''}`;
      }
      existingNavRow.querySelectorAll('[data-admin-subtab]').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-admin-subtab') === activeSection);
      });
      existingNavRow.scrollLeft = savedAdminNavScrollLeft;
    }

    const navRowEl = rootEl.querySelector('#adminSubTabNavRow');
    if (navRowEl) {
      navRowEl.querySelectorAll('[data-admin-subtab]').forEach((btn) => {
        btn.onclick = () => {
          savedAdminNavScrollLeft = navRowEl.scrollLeft;
          state.adminSection = btn.getAttribute('data-admin-subtab');
          api.saveState();
          renderAdminConsole(rootEl, state, api);
          navRowEl.scrollLeft = savedAdminNavScrollLeft;
        };
      });
    }

    const lockBtn = document.getElementById('adminLockBtn');
    if (lockBtn) {
      lockBtn.onclick = () => {
        state.adminUnlocked = false;
        state.activeTab = 'dashboard';
        api.saveState();
        api.renderApp();
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

    if (activeSection === 'overview') {
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
            <div class="kpi-value">${(state.attempts || []).length}</div>
            <div class="kpi-label">Total Exam Attempts</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-value" style="color:var(--secondary);">₹${totalRevenue}</div>
            <div class="kpi-label">Activated Revenue (${(state.activations || []).length} unlocks)</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">🚀 Quick Actions</h3>
            <div style="display:grid;gap:8px;">
              <button class="btn btn-primary" data-quick-jump="folders">➕ Create New Exam Package / Test Series</button>
              <button class="btn btn-navy" data-quick-jump="tests">📝 Create Manual or AI Bilingual Test (Draft)</button>
              <button class="btn btn-outline" data-quick-jump="qbank">📂 Bulk Import Questions (CSV / JSON)</button>
              <button class="btn btn-success" data-quick-jump="payments">🔓 Unlock Paid Package for Student (Email/UID)</button>
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
          state.adminSection = btn.getAttribute('data-quick-jump');
          api.saveState();
          renderAdminConsole(rootEl, state, api);
        };
      });
      return;
    }

    if (activeSection === 'folders') {
      const exams = window.CGpediaCloud ? window.CGpediaCloud.EXAM_CATEGORIES : [];
      bodyEl.innerHTML = `
        <div class="card">
          <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:12px;">🏛️ Create Exam Package / Test Series Folder</h3>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Exam Category / परीक्षा श्रेणी</label>
              <select class="form-select" id="admFolderExamCat">
                ${exams.map((ex) => `<option value="${esc(ex.code)}">${esc(ex.icon)} ${esc(ex.nameHi)} (${esc(ex.nameEn)})</option>`).join('')}
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
          <button class="btn btn-primary" id="admCreateFolderBtn">➕ Save &amp; Publish Test Series Folder</button>
        </div>

        <div class="card">
          <h3 style="font-size:1rem;font-weight:800;margin-bottom:12px;">📂 Existing Test Series Folders (${(state.folders || []).length})</h3>
          ${(state.folders || []).length === 0 ? `
            <p style="font-size:0.86rem;color:var(--text-muted);">No Test Series Folders created yet. Create one above.</p>
          ` : `
            <div style="display:grid;gap:10px;">
              ${state.folders.map((f) => `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--border);border-radius:10px;flex-wrap:wrap;">
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
          `}
        </div>
      `;

      document.getElementById('admCreateFolderBtn').onclick = () => {
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

    if (activeSection === 'tests') {
      bodyEl.innerHTML = `
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
            <h3 style="font-size:1.05rem;font-weight:800;">📝 3-Stage Test Builder (Create as Draft → Review/Edit → Publish)</h3>
            <span class="badge badge-review">Step 1: Saves as DRAFT</span>
          </div>

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
                ${(window.CGpediaCloud ? window.CGpediaCloud.EXAM_CATEGORIES : []).map((ex) => `<option value="${esc(ex.code)}">${esc(ex.icon)} ${esc(ex.nameEn)}</option>`).join('')}
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
              <label class="form-label">Subject / Syllabus Topic</label>
              <input class="form-input" id="admTestTopic" placeholder="Chhattisgarh GS, Polity, History & Current Affairs" />
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
              <label class="form-label">AI Auto-Generate Bilingual Questions (Optional Count: 0 for Manual)</label>
              <div style="display:grid;grid-template-columns:110px 1fr;gap:8px;">
                <input type="number" class="form-input" id="admTestAiCount" value="10" min="0" max="100" />
                <input class="form-input" id="admTestAiPrompt" placeholder="Custom AI instructions (e.g., Statement-based CGPSC Prelims level)" />
              </div>
            </div>
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-primary" id="admCreateDraftTestBtn">💾 Create Test as DRAFT (With AI / Manual Questions)</button>
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
      `;

      document.getElementById('admCreateDraftTestBtn').onclick = () => {
        const titleHi = document.getElementById('admTestTitleHi').value.trim();
        const titleEn = document.getElementById('admTestTitleEn').value.trim() || titleHi;
        const topic = document.getElementById('admTestTopic').value.trim() || titleHi;
        if (!titleHi) {
          api.toast('कृपया टेस्ट का शीर्षक (Title) दर्ज करें।');
          return;
        }
        const aiCount = Math.max(0, Math.min(100, Number(document.getElementById('admTestAiCount').value || 0)));
        const customPrompt = document.getElementById('admTestAiPrompt').value.trim();
        const isPaid = document.getElementById('admTestIsPaid').value === 'paid';
        const testId = 'test_' + Date.now();

        const generatedQuestions = aiCount > 0 ? api.generateHighYieldBilingualQuestions(testId, topic, aiCount, customPrompt) : [];

        const newTest = {
          id: testId,
          folderId: document.getElementById('admTestFolderId').value || 'standalone',
          examCode: document.getElementById('admTestExamCode').value || 'CGPSC',
          titleHi,
          titleEn,
          topic,
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
        api.toast(`📝 Test saved as DRAFT with ${generatedQuestions.length} bilingual questions. Review & click Publish when ready!`);
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
      return;
    }

    if (activeSection === 'qbank') {
      bodyEl.innerHTML = `
        <div class="grid-2">
          <div class="card">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">📂 Bulk Question Upload (CSV or JSON)</h3>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:10px;">
              Upload a <code>.json</code> or <code>.csv</code> file with columns: <code>questionHi, questionEn, optA_Hi, optB_Hi, optC_Hi, optD_Hi, optA_En, optB_En, optC_En, optD_En, correctIndex (0-3), explanationHi, explanationEn, subjectTag</code>
            </p>
            <div class="form-group">
              <label class="form-label">Target Test (or Central Question Bank)</label>
              <select class="form-select" id="admBulkTargetTest">
                <option value="central_bank">Central Reusable Question Bank</option>
                ${(state.tests || []).map((t) => `<option value="${esc(t.id)}">${esc(t.titleHi)} (${t.status.toUpperCase()})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Select CSV / JSON File from Device</label>
              <input type="file" accept=".csv,.json,text/csv,application/json" class="form-input" id="admBulkFileInput" />
            </div>
            <button class="btn btn-primary" id="admProcessBulkUploadBtn">📥 Import Questions</button>
          </div>

          <div class="card">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">➕ Add Single Question to Central Question Bank</h3>
            <div class="form-group">
              <input class="form-input" id="qbSubjectTag" placeholder="Subject / Topic Tag (e.g., Chhattisgarh History, Indian Polity)" style="margin-bottom:8px;" />
              <input class="form-input" id="qbPyqTag" placeholder="Optional PYQ Tag (e.g., CGPSC Pre 2024)" style="margin-bottom:8px;" />
              <textarea class="form-textarea" id="qbStemHi" rows="2" placeholder="प्रश्न (हिन्दी में)..." style="margin-bottom:8px;"></textarea>
              <textarea class="form-textarea" id="qbStemEn" rows="2" placeholder="Question (in English)..." style="margin-bottom:8px;"></textarea>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">
                <input class="form-input" id="qbOpt0Hi" placeholder="विकल्प A (Hi)" />
                <input class="form-input" id="qbOpt0En" placeholder="Option A (En)" />
                <input class="form-input" id="qbOpt1Hi" placeholder="विकल्प B (Hi)" />
                <input class="form-input" id="qbOpt1En" placeholder="Option B (En)" />
                <input class="form-input" id="qbOpt2Hi" placeholder="विकल्प C (Hi)" />
                <input class="form-input" id="qbOpt2En" placeholder="Option C (En)" />
                <input class="form-input" id="qbOpt3Hi" placeholder="विकल्प D (Hi)" />
                <input class="form-input" id="qbOpt3En" placeholder="Option D (En)" />
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                <select class="form-select" id="qbCorrectIdx">
                  <option value="0">Correct: Option A</option>
                  <option value="1">Correct: Option B</option>
                  <option value="2">Correct: Option C</option>
                  <option value="3">Correct: Option D</option>
                </select>
                <input class="form-input" id="qbExplanationHi" placeholder="व्याख्या / Explanation (Hi & En)" />
              </div>
              <button class="btn btn-success" id="qbSaveSingleBtn">💾 Save to Central Question Bank</button>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">🧠 Central Question Bank Repository (${(state.questionBank || []).length} Questions)</h3>
          ${(state.questionBank || []).length === 0 ? `
            <p style="font-size:0.84rem;color:var(--text-muted);">No questions in Central Question Bank yet. Add above or import via CSV/JSON.</p>
          ` : `
            <div style="display:grid;gap:8px;max-height:360px;overflow-y:auto;">
              ${state.questionBank.slice(0, 40).map((q, idx) => `
                <div style="padding:10px 12px;border-radius:8px;border:1px solid var(--border);background:var(--surface-alt);display:flex;justify-content:space-between;gap:10px;">
                  <div>
                    <span class="badge badge-exam">${esc(q.subjectTag || 'General Studies')}</span>
                    ${q.pyqTag ? `<span class="badge badge-paid">${esc(q.pyqTag)}</span>` : ''}
                    <div style="font-weight:700;font-size:0.88rem;margin-top:4px;">Q${idx + 1}. ${esc(q.questionHi)}</div>
                    <div style="font-size:0.78rem;color:var(--text-secondary);">${esc(q.questionEn)}</div>
                  </div>
                  <button class="btn btn-danger btn-sm" data-del-qbank="${esc(q.id)}">🗑️</button>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;

      document.getElementById('qbSaveSingleBtn').onclick = () => {
        const qHi = document.getElementById('qbStemHi').value.trim();
        const qEn = document.getElementById('qbStemEn').value.trim() || qHi;
        if (!qHi) {
          api.toast('कृपया प्रश्न दर्ज करें।');
          return;
        }
        const exp = document.getElementById('qbExplanationHi').value.trim();
        const qObj = {
          id: 'qb_' + Date.now(),
          subjectTag: document.getElementById('qbSubjectTag').value.trim() || 'General Studies',
          pyqTag: document.getElementById('qbPyqTag').value.trim(),
          questionHi: qHi,
          questionEn: qEn,
          optionsHi: [
            document.getElementById('qbOpt0Hi').value.trim() || 'विकल्प A',
            document.getElementById('qbOpt1Hi').value.trim() || 'विकल्प B',
            document.getElementById('qbOpt2Hi').value.trim() || 'विकल्प C',
            document.getElementById('qbOpt3Hi').value.trim() || 'विकल्प D'
          ],
          optionsEn: [
            document.getElementById('qbOpt0En').value.trim() || 'Option A',
            document.getElementById('qbOpt1En').value.trim() || 'Option B',
            document.getElementById('qbOpt2En').value.trim() || 'Option C',
            document.getElementById('qbOpt3En').value.trim() || 'Option D'
          ],
          correctOptionIndex: Number(document.getElementById('qbCorrectIdx').value || 0),
          explanationHi: exp || 'विस्तृत व्याख्या उपलब्ध है।',
          explanationEn: exp || 'Detailed explanation available.'
        };
        state.questionBank = state.questionBank || [];
        state.questionBank.unshift(qObj);
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('question_bank', qObj.id, qObj);
        api.toast('✅ Question added to Central Question Bank!');
        renderAdminConsole(rootEl, state, api);
      };

      document.getElementById('admProcessBulkUploadBtn').onclick = () => {
        const fileInput = document.getElementById('admBulkFileInput');
        const targetId = document.getElementById('admBulkTargetTest').value;
        if (!fileInput.files || !fileInput.files[0]) {
          api.toast('कृपया पहले CSV या JSON फ़ाइल चुनें।');
          return;
        }
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = String(ev.target.result || '');
          const imported = api.parseBulkQuestionsText(text, file.name);
          if (imported.length === 0) {
            api.toast('⚠️ फ़ाइल में कोई मान्य प्रश्न नहीं मिला।');
            return;
          }
          if (targetId === 'central_bank') {
            state.questionBank = [...imported, ...(state.questionBank || [])];
            imported.forEach((iq) => {
              if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('question_bank', iq.id, iq);
            });
          } else {
            const targetTest = state.tests.find((t) => t.id === targetId);
            if (targetTest) {
              targetTest.questions = [...(targetTest.questions || []), ...imported];
              if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('tests', targetTest.id, targetTest);
            }
          }
          api.saveState();
          api.toast(`✅ Successfully imported ${imported.length} bilingual questions!`);
          renderAdminConsole(rootEl, state, api);
        };
        reader.readAsText(file);
      };

      bodyEl.querySelectorAll('[data-del-qbank]').forEach((btn) => {
        btn.onclick = () => {
          const qid = btn.getAttribute('data-del-qbank');
          state.questionBank = (state.questionBank || []).filter((q) => q.id !== qid);
          api.saveState();
          if (window.CGpediaCloud) window.CGpediaCloud.deleteCloudDoc('question_bank', qid);
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

      bodyEl.innerHTML = `
        <div class="grid-2">
          <!-- UPI QR Upload from Gallery + WhatsApp Config -->
          <div class="card">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">📲 Admin UPI QR Upload (Gallery + URL) &amp; WhatsApp Payment Setup</h3>
            <div class="form-group">
              <label class="form-label">Upload UPI QR Code Image Directly from Device Gallery</label>
              <input type="file" accept="image/*" class="form-input" id="admQrGalleryFileInput" />
            </div>
            <div class="form-group">
              <label class="form-label">Or Paste UPI QR Image URL</label>
              <input class="form-input" id="admQrUrlInput" value="${esc(state.config.upiQrImage || '')}" placeholder="https://..." />
            </div>
            <div class="grid-2" style="gap:8px;">
              <div class="form-group">
                <label class="form-label">Official UPI ID</label>
                <input class="form-input" id="admUpiIdInput" value="${esc(state.config.upiId || '9238810070@upi')}" />
              </div>
              <div class="form-group">
                <label class="form-label">WhatsApp Verification Number</label>
                <input class="form-input" id="admWhatsappInput" value="${esc(state.config.whatsappNumber || '9238810070')}" />
              </div>
            </div>
            <button class="btn btn-primary" id="admSavePaymentConfigBtn">💾 Save UPI QR &amp; Payment Settings</button>
          </div>

          <!-- Strict Activation-Based Validity Unlock for Student -->
          <div class="card">
            <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">🔓 Activate Paid Package for Student (Countdown Starts Now)</h3>
            <div class="form-group">
              <label class="form-label">Student Registered Email ID or User ID</label>
              <input class="form-input" id="admUnlockStudentIdentifier" placeholder="student@gmail.com or STU-XXXX" />
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
            <button class="btn btn-success" id="admActivateStudentAccessBtn">✅ Activate Student Access Now</button>
          </div>
        </div>

        <!-- Discount Coupons Manager -->
        <div class="card">
          <h3 style="font-size:1rem;font-weight:800;margin-bottom:10px;">🎟️ Discount Coupons Manager</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:end;margin-bottom:12px;">
            <div>
              <label class="form-label">Coupon Code</label>
              <input class="form-input" id="admCouponCode" placeholder="CGPSC50" />
            </div>
            <div>
              <label class="form-label">Discount %</label>
              <input type="number" class="form-input" id="admCouponPercent" value="25" min="1" max="100" />
            </div>
            <div>
              <label class="form-label">Description</label>
              <input class="form-input" id="admCouponDesc" placeholder="Festive Aspirant Scholarship Offer" />
            </div>
            <button class="btn btn-navy" id="admCreateCouponBtn">➕ Add Coupon</button>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${(state.coupons || []).map((c) => `
              <span class="badge badge-paid" style="padding:6px 12px;font-size:0.78rem;">
                🎟️ <strong>${esc(c.code)}</strong> (${c.discountPercent}% OFF)
                <button data-del-coupon="${esc(c.id)}" style="background:none;border:none;color:var(--danger);cursor:pointer;margin-left:6px;font-weight:800;">✕</button>
              </span>
            `).join('')}
          </div>
        </div>

        <!-- Active Student Unlocks Table -->
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
                        Student: <strong>${esc(act.studentIdentifier)}</strong> • Activated: ${new Date(act.activatedAtMs).toLocaleString()} • Expires: ${new Date(act.expiresAtMs).toLocaleDateString()}
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
            document.getElementById('admQrUrlInput').value = state.config.upiQrImage;
            api.saveState();
            api.toast('📷 QR Code image loaded from device gallery! Click Save to publish.');
          };
          reader.readAsDataURL(qrFileInput.files[0]);
        };
      }

      document.getElementById('admSavePaymentConfigBtn').onclick = () => {
        state.config.upiQrImage = document.getElementById('admQrUrlInput').value.trim();
        state.config.upiId = document.getElementById('admUpiIdInput').value.trim() || '9238810070@upi';
        state.config.whatsappNumber = document.getElementById('admWhatsappInput').value.trim() || '9238810070';
        api.saveState();
        if (window.CGpediaCloud) window.CGpediaCloud.saveCloudDoc('app_config', 'global', state.config);
        api.toast('✅ UPI QR Code & WhatsApp Payment Settings saved!');
      };

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
  }

  window.CGpediaAdmin = {
    renderAdminConsole
  };
})();
