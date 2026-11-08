/**
 * CGpedia — NTA / PSC Standard Computer-Based Test (CBT) Examination Engine
 * Supports Pre-Test Instructions, 5-State Question Palette, Section Switching,
 * Bilingual Toggle, Per-Question Time Tracking, Auto-Save Recovery & Detailed Analytics.
 */
(function () {
  'use strict';

  const ACTIVE_SESSION_STORAGE_KEY = 'cgpedia_active_cbt_session_v4';
  let timerInterval = null;

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatClock(totalSeconds) {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function setNativeScreenshotProtection(enabled) {
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.setSecureScreen === 'function') {
        window.AndroidBridge.setSecureScreen(Boolean(enabled));
      }
    } catch (_) {}
  }

  function computeQuestionState(session, idx) {
    const visited = Boolean(session.visited && session.visited[idx]);
    const hasAns = session.answers && session.answers[idx] !== undefined && session.answers[idx] !== null;
    const isRev = Boolean(session.review && session.review[idx]);
    if (!visited && !hasAns && !isRev) return 'not-visited';
    if (hasAns && isRev) return 'answered-review';
    if (isRev) return 'review';
    if (hasAns) return 'answered';
    return 'not-answered';
  }

  function countPaletteStates(session) {
    const counts = {
      'answered': 0,
      'not-answered': 0,
      'review': 0,
      'answered-review': 0,
      'not-visited': 0
    };
    const total = (session.questions || []).length;
    for (let i = 0; i < total; i++) {
      const st = computeQuestionState(session, i);
      counts[st] = (counts[st] || 0) + 1;
    }
    return counts;
  }

  function getActiveSessionStorageKey() {
    try {
      if (window.CGpediaApp && typeof window.CGpediaApp.getCurrentStudentUid === 'function') {
        const uid = window.CGpediaApp.getCurrentStudentUid();
        if (uid) return `${ACTIVE_SESSION_STORAGE_KEY}_${uid}`;
      }
    } catch (_) {}
    return ACTIVE_SESSION_STORAGE_KEY;
  }

  function persistActiveSession(session) {
    try {
      const scopedKey = getActiveSessionStorageKey();
      if (!session) {
        localStorage.removeItem(scopedKey);
        localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      } else {
        if (window.CGpediaApp && typeof window.CGpediaApp.getCurrentStudentUid === 'function') {
          session.userId = window.CGpediaApp.getCurrentStudentUid() || session.userId || '';
        }
        localStorage.setItem(scopedKey, JSON.stringify(session));
      }
    } catch (_) {}
  }

  function getSavedActiveSession() {
    try {
      const currentUid = (window.CGpediaApp && typeof window.CGpediaApp.getCurrentStudentUid === 'function')
        ? window.CGpediaApp.getCurrentStudentUid()
        : '';
      const scopedKey = getActiveSessionStorageKey();
      const raw = localStorage.getItem(scopedKey) || localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0 && !parsed.submitted) {
        if (parsed.userId && currentUid && parsed.userId !== currentUid) {
          return null;
        }
        return parsed;
      }
    } catch (_) {}
    return null;
  }

  /**
   * Opens the Pre-Test Instructions Modal before starting the live CBT timer
   */
  function openPreTestInstructions(testObj, questions, appCallbacks) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;

    const marksPos = Number(testObj.marksPerQuestion || 2);
    const marksNeg = Number(testObj.negativeMarking !== undefined ? testObj.negativeMarking : 0.66);
    const totalMarks = (questions.length * marksPos).toFixed(0);
    const sections = Array.from(new Set(questions.map((q) => q.subjectTag || testObj.topic || 'General Studies')));

    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="preTestInstructionsBackdrop">
        <div class="modal-card" style="max-width:680px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <img src="assets/cgpedia-logo-clean.png" alt="CGpedia" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid var(--secondary);" />
              <div>
                <span class="badge badge-exam">${esc(testObj.examCode || 'CBT EXAM')}</span>
                <h2 style="font-size:1.15rem;font-weight:800;margin-top:2px;">${esc(testObj.titleHi)}</h2>
                <div style="font-size:0.8rem;color:var(--text-muted);">${esc(testObj.titleEn)}</div>
              </div>
            </div>
            <button class="btn btn-outline btn-sm" id="closePreTestModalBtn">✕ Close</button>
          </div>

          <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;">
            <div class="kpi-card" style="padding:10px;">
              <div class="kpi-value" style="font-size:1.2rem;">${questions.length}</div>
              <div class="kpi-label">Questions / प्रश्न</div>
            </div>
            <div class="kpi-card" style="padding:10px;">
              <div class="kpi-value" style="font-size:1.2rem;">${totalMarks}</div>
              <div class="kpi-label">Max Marks / पूर्णांक</div>
            </div>
            <div class="kpi-card" style="padding:10px;">
              <div class="kpi-value" style="font-size:1.2rem;">${testObj.durationMinutes || 60}m</div>
              <div class="kpi-label">Duration / समय</div>
            </div>
            <div class="kpi-card" style="padding:10px;">
              <div class="kpi-value" style="font-size:1.1rem;color:var(--success);">+${marksPos} <span style="color:var(--danger);font-size:0.9rem;">/-${marksNeg}</span></div>
              <div class="kpi-label">Marking / अंकन</div>
            </div>
          </div>

          <div class="card" style="background:var(--surface-alt);margin-bottom:14px;padding:14px;">
            <h3 style="font-size:0.9rem;font-weight:800;margin-bottom:8px;">📋 सामान्य निर्देश / Standard CBT Instructions</h3>
            <ul style="padding-left:18px;font-size:0.82rem;color:var(--text-secondary);display:grid;gap:6px;">
              <li>यह परीक्षा द्विभाषी (<strong>हिन्दी एवं English</strong>) है। आप परीक्षा के दौरान किसी भी समय भाषा बदल सकते हैं।</li>
              <li>प्रत्येक सही उत्तर के लिए <strong>+${marksPos} अंक</strong> दिए जाएंगे तथा प्रत्येक गलत उत्तर के लिए <strong>-${marksNeg} अंक</strong> काटे जाएंगे। अनुत्तरित प्रश्नों पर कोई ऋणात्मक अंक नहीं है।</li>
              <li><strong>Save &amp; Next</strong> पर क्लिक करने पर आपका उत्तर सुरक्षित होगा। <strong>Mark for Review</strong> किए गए उत्तर भी अंतिम मूल्यांकन में शामिल किए जाते हैं।</li>
              <li>समय समाप्त होने पर परीक्षा स्वतः सबमिट (Auto-Submit) हो जाएगी।</li>
            </ul>
            <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;font-size:0.75rem;font-weight:700;">
              <span class="badge" style="background:#16A34A;color:#fff;">■ Answered</span>
              <span class="badge" style="background:#DC2626;color:#fff;">■ Not Answered</span>
              <span class="badge" style="background:#7C3AED;color:#fff;">● Marked for Review</span>
              <span class="badge" style="background:#7C3AED;color:#fff;">●+✓ Answered &amp; Marked</span>
              <span class="badge" style="background:#94A3B8;color:#fff;">■ Not Visited</span>
            </div>
          </div>

          <div style="margin-bottom:14px;">
            <div class="form-label">Included Sections / विषय अनुभाग:</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${sections.map((sec) => `<span class="badge badge-exam">${esc(sec)}</span>`).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Select Default Question Display Language / डिफ़ॉल्ट भाषा चुनें:</label>
            <select class="form-select" id="preTestLangSelect">
              <option value="bilingual">Bilingual (हिन्दी + English दोनों साथ में) — Recommended</option>
              <option value="hi">केवल हिन्दी (Hindi Only)</option>
              <option value="en">English Only</option>
            </select>
          </div>

          <label style="display:flex;align-items:flex-start;gap:9px;font-size:0.82rem;cursor:pointer;padding:10px;border-radius:8px;background:var(--secondary-soft);margin-bottom:16px;">
            <input type="checkbox" id="preTestDeclarationCheck" checked style="margin-top:3px;width:17px;height:17px;" />
            <span>मैंने सभी निर्देशों को पढ़ और समझ लिया है। मैं परीक्षा के दौरान किसी भी अनुचित साधन या स्क्रीनशॉट का उपयोग नहीं करूँगा/करूँगी। (I have read and understood all instructions.)</span>
          </label>

          <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button class="btn btn-outline" id="cancelPreTestBtn">Cancel</button>
            <button class="btn btn-primary btn-lg" id="confirmStartCbtBtn">🚀 Start Live CBT Exam</button>
          </div>
        </div>
      </div>
    `;

    const closeFn = () => { modalRoot.innerHTML = ''; };
    document.getElementById('closePreTestModalBtn').onclick = closeFn;
    document.getElementById('cancelPreTestBtn').onclick = closeFn;
    document.getElementById('confirmStartCbtBtn').onclick = () => {
      const checked = document.getElementById('preTestDeclarationCheck').checked;
      if (!checked) {
        if (appCallbacks && appCallbacks.toast) {
          appCallbacks.toast('कृपया परीक्षा शुरू करने से पहले घोषणा (Declaration) बॉक्स को टिक करें।');
        }
        return;
      }
      const chosenLang = document.getElementById('preTestLangSelect').value || 'bilingual';
      closeFn();
      launchLiveCbtSession(testObj, questions, chosenLang, appCallbacks);
    };
  }

  /**
   * Launches or resumes the Fullscreen Live CBT Session
   */
  function launchLiveCbtSession(testObj, questions, chosenLang, appCallbacks, existingSession) {
    const currentUid = (window.CGpediaApp && typeof window.CGpediaApp.getCurrentStudentUid === 'function')
      ? (window.CGpediaApp.getCurrentStudentUid() || '')
      : '';
    const session = existingSession || {
      sessionId: 'cbt_' + Date.now(),
      attemptId: 'att_' + Date.now(),
      userId: currentUid,
      testId: testObj.id,
      testTitleHi: testObj.titleHi,
      testTitleEn: testObj.titleEn,
      examCode: testObj.examCode || 'CGPSC',
      marksPerQuestion: Number(testObj.marksPerQuestion || 2),
      negativeMarking: Number(testObj.negativeMarking !== undefined ? testObj.negativeMarking : 0.66),
      questions: questions,
      currentIndex: 0,
      activeSection: 'ALL',
      langMode: chosenLang || 'bilingual',
      answers: {},
      review: {},
      visited: { 0: true },
      questionTimeSec: {},
      remainingSeconds: Math.max(60, Number(testObj.durationMinutes || 30) * 60),
      totalDurationSeconds: Math.max(60, Number(testObj.durationMinutes || 30) * 60),
      startedAtIso: new Date().toISOString(),
      paletteOpen: false,
      paletteOpenMobile: false,
      status: 'in_progress',
      submitted: false
    };
    if (!session.attemptId) {
      session.attemptId = session.sessionId || ('att_' + Date.now());
    }
    if (!session.userId && currentUid) {
      session.userId = currentUid;
    }
    session.status = 'in_progress';
    session.submitted = false;
    if (typeof session.paletteOpen !== 'boolean') {
      session.paletteOpen = false;
    }

    setNativeScreenshotProtection(true);
    persistActiveSession(session);
    startSessionClock(session, appCallbacks);
    renderLiveCbtDom(session, appCallbacks);
  }

  function startSessionClock(session, appCallbacks) {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!session || session.submitted) {
        clearInterval(timerInterval);
        return;
      }
      session.remainingSeconds = Math.max(0, session.remainingSeconds - 1);
      const curIdx = session.currentIndex || 0;
      session.questionTimeSec[curIdx] = (session.questionTimeSec[curIdx] || 0) + 1;

      const clockEl = document.getElementById('cbtLiveClockDisplay');
      const timerBoxEl = document.getElementById('cbtTimerBox');
      if (clockEl) clockEl.textContent = formatClock(session.remainingSeconds);
      if (timerBoxEl) {
        if (session.remainingSeconds <= 300) {
          timerBoxEl.classList.add('low-time');
        } else {
          timerBoxEl.classList.remove('low-time');
        }
      }
      const qTimeEl = document.getElementById('cbtCurrentQuestionTime');
      if (qTimeEl) {
        qTimeEl.textContent = `${session.questionTimeSec[curIdx] || 0}s`;
      }

      if (session.remainingSeconds % 5 === 0) {
        persistActiveSession(session);
      }

      if (session.remainingSeconds <= 0) {
        clearInterval(timerInterval);
        if (appCallbacks && appCallbacks.toast) {
          appCallbacks.toast('⏰ समय समाप्त! आपका टेस्ट स्वतः सबमिट किया जा रहा है...');
        }
        finalizeCbtSubmission(session, appCallbacks);
      }
    }, 1000);
  }

  function renderLiveCbtDom(session, appCallbacks) {
    const container = document.getElementById('cbtExamContainer');
    if (!container) return;

    const questions = session.questions || [];
    const curIdx = Math.min(Math.max(0, session.currentIndex || 0), questions.length - 1);
    session.currentIndex = curIdx;
    session.visited[curIdx] = true;

    const q = questions[curIdx];
    const counts = countPaletteStates(session);
    const sections = ['ALL', ...Array.from(new Set(questions.map((item) => item.subjectTag || 'General Studies')))];
    const selectedOpt = session.answers[curIdx];
    const isBookmarked = appCallbacks && typeof appCallbacks.isBookmarked === 'function' ? appCallbacks.isBookmarked(q.id) : false;
    const isPaletteOpen = Boolean(session.paletteOpen);

    container.innerHTML = `
      <div class="cbt-fullscreen">
        <!-- Compact Top Exam Header -->
        <header class="cbt-topbar">
          <div class="cbt-topbar-title-group">
            <img src="assets/cgpedia-logo-clean.png" alt="CGpedia" class="cbt-topbar-logo" />
            <div class="cbt-topbar-title" title="${esc(session.testTitleHi || session.testTitleEn)}">
              ${esc(session.testTitleHi || session.testTitleEn)}
            </div>
          </div>

          <div class="cbt-topbar-controls">
            <select id="cbtInExamLangSelect" class="cbt-compact-select" aria-label="Language Selection">
              <option value="bilingual" ${session.langMode === 'bilingual' ? 'selected' : ''}>🌐 हिं + EN</option>
              <option value="hi" ${session.langMode === 'hi' ? 'selected' : ''}>🌐 हिन्दी</option>
              <option value="en" ${session.langMode === 'en' ? 'selected' : ''}>🌐 EN</option>
            </select>

            <div class="cbt-timer-box ${session.remainingSeconds <= 300 ? 'low-time' : ''}" id="cbtTimerBox" title="Remaining Time">
              ⏱️ <span id="cbtLiveClockDisplay">${formatClock(session.remainingSeconds)}</span>
            </div>

            <button class="btn cbt-palette-toggle-btn ${isPaletteOpen ? 'active' : ''}" id="cbtToggleMobilePaletteBtn" type="button" aria-expanded="${isPaletteOpen}" title="Toggle Question Palette">
              🔢 Question Palette (${counts.answered + counts['answered-review']}/${questions.length})
            </button>

            <button class="btn btn-danger cbt-submit-top-btn" id="cbtTopLeaveTestBtn" type="button">
              Leave Test
            </button>

            <button class="btn btn-success cbt-submit-top-btn" id="cbtOpenSubmitSummaryBtn" type="button">
              ✅ Submit Test
            </button>
          </div>
        </header>

        <!-- Compact Section Switcher Strip -->
        <div class="cbt-section-strip">
          <div class="cbt-section-chips">
            ${sections.map((sec) => `
              <button class="filter-chip ${session.activeSection === sec ? 'active' : ''}" data-cbt-section="${esc(sec)}" style="padding:2px 9px;font-size:0.71rem;">
                ${sec === 'ALL' ? 'All (' + questions.length + ')' : esc(sec)}
              </button>
            `).join('')}
          </div>
          <div class="cbt-marking-pill">
            <strong style="color:var(--success);">+${session.marksPerQuestion}</strong> / <strong style="color:var(--danger);">-${session.negativeMarking}</strong>
          </div>
        </div>

        <!-- Main Split Body: Question Area + Toggleable 5-State Palette Sidebar -->
        <div class="cbt-body ${isPaletteOpen ? 'palette-open' : ''}">
          <div class="cbt-question-pane">
            <div class="cbt-question-meta-bar">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span class="badge badge-exam" style="font-size:0.76rem;padding:2px 9px;">Q ${curIdx + 1} / ${questions.length}</span>
                <span class="badge badge-draft" style="font-size:0.7rem;padding:2px 8px;">${esc(q.subjectTag || 'General Studies')}</span>
                ${q.pyqTag ? `<span class="badge badge-paid" style="font-size:0.7rem;padding:2px 8px;">PYQ: ${esc(q.pyqTag)}</span>` : ''}
                ${session.review[curIdx] ? `<span class="badge badge-review" style="font-size:0.7rem;padding:2px 8px;">🟣 Marked for Review</span>` : ''}
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:0.72rem;color:var(--text-muted);">⏱️ <strong id="cbtCurrentQuestionTime">${session.questionTimeSec[curIdx] || 0}s</strong></span>
                <button class="btn btn-outline btn-sm" id="cbtBookmarkQBtn" title="Bookmark Question" style="padding:2px 8px;font-size:0.71rem;">
                  ${isBookmarked ? '🔖 Saved' : '🏷️ Save'}
                </button>
                <button class="btn btn-outline btn-sm" id="cbtReportErrorBtn" title="Report Error in Question" style="padding:2px 8px;font-size:0.71rem;">
                  🚩 Report
                </button>
              </div>
            </div>

            <!-- Question Stem Card -->
            <div class="card cbt-question-stem-card">
              ${(session.langMode === 'bilingual' || session.langMode === 'hi') ? `
                <div style="font-size:0.98rem;font-weight:700;color:var(--text);margin-bottom:${session.langMode === 'bilingual' ? '6px' : '0'};line-height:1.5;">
                  ${esc(q.questionHi)}
                </div>
              ` : ''}
              ${(session.langMode === 'bilingual' || session.langMode === 'en') ? `
                <div style="font-size:0.92rem;font-weight:600;color:${session.langMode === 'bilingual' ? 'var(--text-secondary)' : 'var(--text)'};line-height:1.45;">
                  ${esc(q.questionEn)}
                </div>
              ` : ''}
              ${q.imageUrl ? `
                <div style="margin-top:8px;">
                  <img src="${esc(q.imageUrl)}" alt="Question Diagram" style="max-width:100%;max-height:220px;border-radius:8px;border:1px solid var(--border);" />
                </div>
              ` : ''}
            </div>

            <!-- Options List -->
            <div class="cbt-options-list">
              ${[0, 1, 2, 3].map((optIdx) => {
                const letter = ['A', 'B', 'C', 'D'][optIdx];
                const optHi = (q.optionsHi && q.optionsHi[optIdx]) || '';
                const optEn = (q.optionsEn && q.optionsEn[optIdx]) || '';
                const isSelected = selectedOpt === optIdx;
                return `
                  <div class="cbt-option-card ${isSelected ? 'selected' : ''}" data-cbt-option="${optIdx}" role="button" tabindex="0">
                    <div class="cbt-option-letter">${letter}</div>
                    <div style="flex:1;">
                      ${(session.langMode === 'bilingual' || session.langMode === 'hi') ? `
                        <div style="font-weight:700;font-size:0.9rem;color:var(--text);line-height:1.35;">${esc(optHi)}</div>
                      ` : ''}
                      ${(session.langMode === 'bilingual' || session.langMode === 'en') ? `
                        <div style="font-size:0.83rem;color:${session.langMode === 'bilingual' ? 'var(--text-secondary)' : 'var(--text)'};margin-top:${session.langMode === 'bilingual' ? '2px' : '0'};line-height:1.35;">${esc(optEn)}</div>
                      ` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Mobile Backdrop for Question Palette Drawer -->
          <div class="cbt-palette-backdrop ${isPaletteOpen ? 'palette-open' : ''}" id="cbtPaletteBackdrop"></div>

          <!-- Toggleable Right Sidebar / Drawer: 5-State NTA Question Palette -->
          <aside class="cbt-palette-sidebar ${isPaletteOpen ? 'palette-open' : ''}" id="cbtPaletteSidebar" aria-hidden="${!isPaletteOpen}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border);">
              <div>
                <h3 style="font-size:0.88rem;font-weight:800;margin:0;">Question Palette</h3>
                <div style="font-size:0.7rem;color:var(--text-muted);">प्रश्न पैलेट • कुल ${questions.length} प्रश्न</div>
              </div>
              <button class="btn btn-outline btn-sm" id="cbtCloseMobilePaletteBtn" type="button" style="padding:3px 9px;font-weight:800;" title="Close Question Palette">✕ Close</button>
            </div>

            <!-- 5-State Summary Counters -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.72rem;font-weight:700;margin-bottom:10px;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="width:18px;height:18px;border-radius:4px;background:#16A34A;color:#fff;display:inline-flex;align-items:center;justify-content:center;">${counts.answered}</span>
                <span>Answered</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="width:18px;height:18px;border-radius:4px;background:#DC2626;color:#fff;display:inline-flex;align-items:center;justify-content:center;">${counts['not-answered']}</span>
                <span>Not Answered</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="width:18px;height:18px;border-radius:50%;background:#7C3AED;color:#fff;display:inline-flex;align-items:center;justify-content:center;">${counts.review}</span>
                <span>Marked Review</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="width:18px;height:18px;border-radius:4px;background:#94A3B8;color:#fff;display:inline-flex;align-items:center;justify-content:center;">${counts['not-visited']}</span>
                <span>Not Visited</span>
              </div>
              <div style="grid-column:1 / -1;display:flex;align-items:center;gap:6px;">
                <span style="width:18px;height:18px;border-radius:50%;background:#7C3AED;color:#fff;border:2px solid #22C55E;display:inline-flex;align-items:center;justify-content:center;">${counts['answered-review']}</span>
                <span>Answered &amp; Marked for Review (Evaluated)</span>
              </div>
            </div>

            <div class="palette-grid">
              ${questions.map((item, idx) => {
                if (session.activeSection !== 'ALL' && (item.subjectTag || 'General Studies') !== session.activeSection) {
                  return '';
                }
                const st = computeQuestionState(session, idx);
                return `
                  <button class="palette-btn state-${st} ${idx === curIdx ? 'current' : ''}" data-cbt-jump="${idx}" type="button" title="Question ${idx + 1}">
                    ${idx + 1}
                  </button>
                `;
              }).join('')}
            </div>

            <div style="margin-top:auto;padding-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-danger" style="flex:1;" id="cbtSidebarLeaveTestBtn" type="button">
                Leave Test
              </button>
              <button class="btn btn-success" style="flex:1;" id="cbtSidebarSubmitBtn" type="button">
                ✅ Review &amp; Submit Exam
              </button>
            </div>
          </aside>
        </div>

        <!-- Bottom Action Bar -->
        <footer class="cbt-bottom-bar">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm" id="cbtPrevBtn" ${curIdx === 0 ? 'disabled' : ''}>⬅️ Previous</button>
            <button class="btn btn-review btn-sm" id="cbtMarkReviewNextBtn">🟣 Mark for Review &amp; Next</button>
            <button class="btn btn-outline btn-sm" id="cbtClearResponseBtn">🧹 Clear Response</button>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary" id="cbtSaveNextBtn" type="button">
              💾 ${curIdx < questions.length - 1 ? 'Save & Next ➡️' : 'Save Response'}
            </button>
            <button class="btn btn-danger" id="cbtLeaveTestBtn" type="button">
              Leave Test
            </button>
            <button class="btn btn-success" id="cbtBottomSubmitBtn" type="button">
              ✅ Submit Test
            </button>
          </div>
        </footer>
      </div>
    `;

    bindLiveCbtEvents(session, appCallbacks);
  }

  function bindLiveCbtEvents(session, appCallbacks) {
    const questions = session.questions || [];
    const curIdx = session.currentIndex;
    const q = questions[curIdx];

    // Option selection
    document.querySelectorAll('[data-cbt-option]').forEach((card) => {
      card.onclick = () => {
        const optIdx = Number(card.getAttribute('data-cbt-option'));
        session.answers[curIdx] = optIdx;
        persistActiveSession(session);
        renderLiveCbtDom(session, appCallbacks);
      };
    });

    // Language switch
    const langSel = document.getElementById('cbtInExamLangSelect');
    if (langSel) {
      langSel.onchange = () => {
        session.langMode = langSel.value;
        persistActiveSession(session);
        renderLiveCbtDom(session, appCallbacks);
      };
    }

    // Section filter tabs
    document.querySelectorAll('[data-cbt-section]').forEach((btn) => {
      btn.onclick = () => {
        const sec = btn.getAttribute('data-cbt-section');
        session.activeSection = sec;
        if (sec !== 'ALL') {
          const firstIdx = questions.findIndex((item) => (item.subjectTag || 'General Studies') === sec);
          if (firstIdx >= 0) session.currentIndex = firstIdx;
        }
        persistActiveSession(session);
        renderLiveCbtDom(session, appCallbacks);
      };
    });

    // Palette jump buttons (auto-close on mobile <= 920px, stay open on desktop > 920px)
    document.querySelectorAll('[data-cbt-jump]').forEach((btn) => {
      btn.onclick = () => {
        session.currentIndex = Number(btn.getAttribute('data-cbt-jump'));
        if (window.innerWidth <= 920) {
          session.paletteOpen = false;
        }
        session.paletteOpenMobile = session.paletteOpen;
        persistActiveSession(session);
        renderLiveCbtDom(session, appCallbacks);
      };
    });

    // Question Palette toggle button (works on both desktop and mobile)
    const togglePalBtn = document.getElementById('cbtToggleMobilePaletteBtn');
    if (togglePalBtn) {
      togglePalBtn.onclick = () => {
        session.paletteOpen = !session.paletteOpen;
        session.paletteOpenMobile = session.paletteOpen;
        persistActiveSession(session);
        renderLiveCbtDom(session, appCallbacks);
      };
    }

    const closePaletteHandler = () => {
      session.paletteOpen = false;
      session.paletteOpenMobile = false;
      persistActiveSession(session);
      renderLiveCbtDom(session, appCallbacks);
    };

    const closePalBtn = document.getElementById('cbtCloseMobilePaletteBtn');
    if (closePalBtn) {
      closePalBtn.onclick = closePaletteHandler;
    }

    const backdropEl = document.getElementById('cbtPaletteBackdrop');
    if (backdropEl) {
      backdropEl.onclick = closePaletteHandler;
    }

    // Previous
    const prevBtn = document.getElementById('cbtPrevBtn');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (session.currentIndex > 0) {
          session.currentIndex--;
          persistActiveSession(session);
          renderLiveCbtDom(session, appCallbacks);
        }
      };
    }

    // Save & Next
    const saveNextBtn = document.getElementById('cbtSaveNextBtn');
    if (saveNextBtn) {
      saveNextBtn.onclick = () => {
        session.visited[curIdx] = true;
        if (session.currentIndex < questions.length - 1) {
          session.currentIndex++;
        }
        persistActiveSession(session);
        renderLiveCbtDom(session, appCallbacks);
      };
    }

    // Mark for Review & Next
    const markRevBtn = document.getElementById('cbtMarkReviewNextBtn');
    if (markRevBtn) {
      markRevBtn.onclick = () => {
        session.visited[curIdx] = true;
        session.review[curIdx] = !session.review[curIdx];
        if (session.currentIndex < questions.length - 1) {
          session.currentIndex++;
        }
        persistActiveSession(session);
        renderLiveCbtDom(session, appCallbacks);
      };
    }

    // Clear Response
    const clearBtn = document.getElementById('cbtClearResponseBtn');
    if (clearBtn) {
      clearBtn.onclick = () => {
        delete session.answers[curIdx];
        delete session.review[curIdx];
        persistActiveSession(session);
        renderLiveCbtDom(session, appCallbacks);
      };
    }

    // Bookmark Question
    const bmBtn = document.getElementById('cbtBookmarkQBtn');
    if (bmBtn && appCallbacks && typeof appCallbacks.toggleBookmark === 'function') {
      bmBtn.onclick = () => {
        appCallbacks.toggleBookmark(q, session.testId, session.testTitleHi);
        renderLiveCbtDom(session, appCallbacks);
      };
    }

    // Report Question Error
    const repBtn = document.getElementById('cbtReportErrorBtn');
    if (repBtn && appCallbacks && typeof appCallbacks.reportQuestionError === 'function') {
      repBtn.onclick = () => {
        appCallbacks.reportQuestionError(q, session.testId, session.testTitleHi);
      };
    }

    // Open Leave Test Confirmation Modal
    const leaveBtnBottom = document.getElementById('cbtLeaveTestBtn');
    const leaveBtnTop = document.getElementById('cbtTopLeaveTestBtn');
    const leaveBtnSidebar = document.getElementById('cbtSidebarLeaveTestBtn');
    const triggerLeaveModal = () => openLeaveTestModal(session, appCallbacks);
    if (leaveBtnBottom) leaveBtnBottom.onclick = triggerLeaveModal;
    if (leaveBtnTop) leaveBtnTop.onclick = triggerLeaveModal;
    if (leaveBtnSidebar) leaveBtnSidebar.onclick = triggerLeaveModal;

    // Open Submit Confirmation Summary Modal
    const openSub1 = document.getElementById('cbtOpenSubmitSummaryBtn');
    const openSub2 = document.getElementById('cbtSidebarSubmitBtn');
    const openSub3 = document.getElementById('cbtBottomSubmitBtn');
    const triggerSummary = () => openSubmitSummaryModal(session, appCallbacks);
    if (openSub1) openSub1.onclick = triggerSummary;
    if (openSub2) openSub2.onclick = triggerSummary;
    if (openSub3) openSub3.onclick = triggerSummary;
  }

  function openLeaveTestModal(session, appCallbacks) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="cbtLeaveTestModalBackdrop">
        <div class="modal-card" style="max-width:460px;">
          <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:8px;color:var(--danger);">🚪 Leave Test</h2>
          <p style="font-size:0.96rem;font-weight:700;color:var(--text);margin-bottom:4px;">
            Are you sure you want to leave this test?
          </p>
          <p style="font-size:0.94rem;font-weight:700;color:var(--text-secondary);margin-bottom:14px;">
            क्या आप वाकई यह टेस्ट छोड़ना चाहते हैं?
          </p>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:16px;">
            Your current attempt, answers, marked-for-review status, and remaining time (<strong>${formatClock(session.remainingSeconds)}</strong>) will be saved so you can resume from where you left off.
          </p>
          <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-outline" id="cbtContinueTestBtn" type="button">Continue Test</button>
            <button class="btn btn-danger" id="cbtConfirmLeaveTestBtn" type="button">Leave Test</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('cbtContinueTestBtn').onclick = () => {
      modalRoot.innerHTML = '';
    };
    document.getElementById('cbtConfirmLeaveTestBtn').onclick = () => {
      modalRoot.innerHTML = '';
      leaveAndPauseCbtSession(session, appCallbacks);
    };
  }

  function leaveAndPauseCbtSession(session, appCallbacks) {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    setNativeScreenshotProtection(false);
    session.submitted = false;
    session.status = 'paused';
    session.pausedAtIso = new Date().toISOString();
    persistActiveSession(session);

    const container = document.getElementById('cbtExamContainer');
    if (container) container.innerHTML = '';

    if (appCallbacks && typeof appCallbacks.onExamLeft === 'function') {
      appCallbacks.onExamLeft(session);
    }
  }

  function openSubmitSummaryModal(session, appCallbacks) {
    const modalRoot = document.getElementById('genericModalContainer');
    if (!modalRoot) return;
    const counts = countPaletteStates(session);
    const total = (session.questions || []).length;

    modalRoot.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-card" style="max-width:520px;">
          <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:6px;">📝 Confirm Exam Submission / परीक्षा सबमिट करें</h2>
          <p style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:14px;">
            कृपया सबमिट करने से पहले अपने प्रयासों का सारांश जांच लें। बचे हुए समय: <strong>${formatClock(session.remainingSeconds)}</strong>
          </p>

          <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">
            <div class="kpi-card" style="padding:10px;text-align:center;">
              <div class="kpi-value" style="font-size:1.3rem;">${total}</div>
              <div class="kpi-label">Total Questions</div>
            </div>
            <div class="kpi-card" style="padding:10px;text-align:center;border-color:var(--success);">
              <div class="kpi-value" style="font-size:1.3rem;color:var(--success);">${counts.answered + counts['answered-review']}</div>
              <div class="kpi-label">Answered</div>
            </div>
            <div class="kpi-card" style="padding:10px;text-align:center;border-color:var(--danger);">
              <div class="kpi-value" style="font-size:1.3rem;color:var(--danger);">${counts['not-answered']}</div>
              <div class="kpi-label">Not Answered</div>
            </div>
            <div class="kpi-card" style="padding:10px;text-align:center;">
              <div class="kpi-value" style="font-size:1.2rem;color:var(--review);">${counts.review}</div>
              <div class="kpi-label">Marked Review</div>
            </div>
            <div class="kpi-card" style="padding:10px;text-align:center;">
              <div class="kpi-value" style="font-size:1.2rem;color:var(--review);">${counts['answered-review']}</div>
              <div class="kpi-label">Ans + Review</div>
            </div>
            <div class="kpi-card" style="padding:10px;text-align:center;">
              <div class="kpi-value" style="font-size:1.2rem;color:var(--text-muted);">${counts['not-visited']}</div>
              <div class="kpi-label">Not Visited</div>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button class="btn btn-outline" id="cbtResumeExamBtn">⬅️ Back to Exam</button>
            <button class="btn btn-success btn-lg" id="cbtFinalConfirmSubmitBtn">✅ Final Submit &amp; View Result</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('cbtResumeExamBtn').onclick = () => {
      modalRoot.innerHTML = '';
    };
    document.getElementById('cbtFinalConfirmSubmitBtn').onclick = () => {
      modalRoot.innerHTML = '';
      finalizeCbtSubmission(session, appCallbacks);
    };
  }

  function finalizeCbtSubmission(session, appCallbacks) {
    if (timerInterval) clearInterval(timerInterval);
    session.submitted = true;
    persistActiveSession(null);

    const container = document.getElementById('cbtExamContainer');
    if (container) container.innerHTML = '';

    const questions = session.questions || [];
    const marksPos = Number(session.marksPerQuestion || 2);
    const marksNeg = Number(session.negativeMarking !== undefined ? session.negativeMarking : 0.66);

    let attempted = 0;
    let correct = 0;
    let incorrect = 0;
    const subjectStats = {};
    const wrongQuestions = [];

    questions.forEach((q, idx) => {
      const subj = q.subjectTag || 'General Studies';
      if (!subjectStats[subj]) {
        subjectStats[subj] = { total: 0, attempted: 0, correct: 0, incorrect: 0, timeSec: 0 };
      }
      subjectStats[subj].total++;
      subjectStats[subj].timeSec += Number(session.questionTimeSec[idx] || 0);

      const chosen = session.answers[idx];
      if (chosen !== undefined && chosen !== null) {
        attempted++;
        subjectStats[subj].attempted++;
        if (Number(chosen) === Number(q.correctOptionIndex)) {
          correct++;
          subjectStats[subj].correct++;
        } else {
          incorrect++;
          subjectStats[subj].incorrect++;
          wrongQuestions.push(q);
        }
      }
    });

    const unattempted = Math.max(0, questions.length - attempted);
    const positiveMarks = +(correct * marksPos).toFixed(2);
    const negativeDeduction = +(incorrect * marksNeg).toFixed(2);
    const netScore = +(positiveMarks - negativeDeduction).toFixed(2);
    const maxScore = +(questions.length * marksPos).toFixed(2);
    const accuracyPercent = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const timeTakenSeconds = Math.max(1, (session.totalDurationSeconds || 0) - (session.remainingSeconds || 0));

    const resultRecord = {
      id: session.attemptId || session.sessionId || ('res_' + Date.now()),
      attemptId: session.attemptId || session.sessionId || ('att_' + Date.now()),
      sessionId: session.sessionId || '',
      testId: session.testId,
      testTitleHi: session.testTitleHi,
      testTitleEn: session.testTitleEn,
      examCode: session.examCode || 'CGPSC',
      totalQuestions: questions.length,
      attemptedCount: attempted,
      correctCount: correct,
      incorrectCount: incorrect,
      unattemptedCount: unattempted,
      positiveMarks,
      negativeDeduction,
      score: netScore,
      maxScore,
      accuracyPercent,
      timeTakenSeconds,
      selectedAnswers: session.answers,
      questionTimeSec: session.questionTimeSec,
      subjectStats,
      questionsSnapshot: questions,
      submittedAtIso: new Date().toISOString()
    };

    if (appCallbacks && typeof appCallbacks.onExamCompleted === 'function') {
      appCallbacks.onExamCompleted(resultRecord, wrongQuestions);
    }
  }

  window.CGpediaCBT = {
    openPreTestInstructions,
    launchLiveCbtSession,
    getSavedActiveSession,
    clearSavedSession: () => persistActiveSession(null)
  };
})();
