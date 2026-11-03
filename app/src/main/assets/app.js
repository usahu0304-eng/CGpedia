(function () {
  'use strict';

  const STORAGE_KEY = 'cgpedia_clean_pwa_v3';
  const ADMIN_EMAIL = 'usahu0304@gmail.com';
  const STORY_DURATION_MS = 24 * 60 * 60 * 1000; // Strictly 24 Hours
  const AUTO_SYNC_INTERVAL_MS = 60 * 60 * 1000;  // 60 Minutes
  const AI_TIMEOUT_MS = 300000;                  // 5 Minutes (300,000 ms)

  // Default Clean SVG QR Code Placeholder (until Admin uploads custom QR from Gallery/URL)
  const DEFAULT_QR_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
      <rect width="240" height="240" fill="#FFFFFF"/>
      <rect x="16" y="16" width="64" height="64" fill="none" stroke="#0F2557" stroke-width="10"/>
      <rect x="34" y="34" width="28" height="28" fill="#0F2557"/>
      <rect x="160" y="16" width="64" height="64" fill="none" stroke="#0F2557" stroke-width="10"/>
      <rect x="178" y="34" width="28" height="28" fill="#0F2557"/>
      <rect x="16" y="160" width="64" height="64" fill="none" stroke="#0F2557" stroke-width="10"/>
      <rect x="34" y="178" width="28" height="28" fill="#0F2557"/>
      <rect x="96" y="32" width="16" height="16" fill="#0F2557"/>
      <rect x="120" y="48" width="16" height="32" fill="#0F2557"/>
      <rect x="96" y="96" width="48" height="48" rx="8" fill="#F59E0B"/>
      <text x="120" y="126" font-family="sans-serif" font-size="20" font-weight="900" fill="#0F2557" text-anchor="middle">UPI</text>
      <rect x="160" y="104" width="20" height="20" fill="#0F2557"/>
      <rect x="196" y="124" width="24" height="20" fill="#0F2557"/>
      <rect x="104" y="164" width="24" height="24" fill="#0F2557"/>
      <rect x="144" y="180" width="32" height="36" fill="#0F2557"/>
      <rect x="192" y="168" width="28" height="48" fill="#0F2557"/>
    </svg>
  `);

  // CLEAN SLATE INITIAL STATE (Zero Dummy Test Series or Sample Questions)
  const INITIAL_STATE = {
    theme: 'light',
    activeTab: 'dashboard',
    adminSubTab: 'tests', // 'tests' | 'payments' | 'branding' | 'stories' | 'broadcast' | 'analytics'
    selectedFolderId: null,
    reviewingTestRef: null, // { folderId, testId }
    currentUser: {
      id: 'STU-' + Math.floor(1000 + Math.random() * 9000),
      name: 'CGPSC Student',
      email: 'student@cgpedia.in',
      isAdmin: false
    },
    config: {
      appTitle: 'CGpedia',
      appSubtitle: 'CGPSC & CGSSB',
      logoDataUrl: '',
      anthemEnabled: true,
      screenshotProtection: true,
      aiEnabled: true,
      geminiApiKey: '',
      whatsappNumber: '9238810070',
      upiId: '9238810070@upi',
      upiQrDataUrl: DEFAULT_QR_SVG,
      policyTitleHi: 'आधिकारिक सहायता एवं गोपनीयता नीति (CGPSC & CGSSB)',
      policyTitleEn: 'Official Help, Support & Privacy Policy (CGPSC & CGSSB)',
      policyBodyHi: '1. पेड टेस्ट सीरीज अनलॉक करने के लिए QR कोड स्कैन कर भुगतान करें और स्क्रीनशॉट WhatsApp (9238810070) पर भेजें।\n2. प्रत्येक छात्र की वैधता (Validity Countdown) एडमिन द्वारा अकाउंट Activate करने की सटीक तिथि और समय से शुरू होती है।\n3. सभी टेस्ट द्विभाषी (1st हिंदी, 2nd English) माध्यम में उपलब्ध हैं।',
      policyBodyEn: '1. Scan the official UPI QR to pay for Paid Test Series and send the payment screenshot on WhatsApp (9238810070) for instant activation.\n2. Student validity countdown starts strictly from the exact date & time the Admin activates access for your account.\n3. All tests are provided in Bilingual (1st Hindi, 2nd English) format.',
      policyUpdatedAt: Date.now()
    },
    analyticsBase: {
      registeredFreeUsers: 0
    },
    // ZERO INITIAL CONTENT (Clean Slate Requirement #2)
    folders: [],
    stories: [],
    notifications: [],
    upcomingSeries: [],
    queries: [],
    // key = `${folderId}__${normalizedUserKey}`
    studentActivations: {},
    lastAutoSyncAt: Date.now()
  };

  let state = loadState();
  let activeExamSession = null;
  let storyPlayerState = null;
  let deferredPwaPrompt = null;
  let audioCtx = null;
  let isAnthemPlaying = false;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(INITIAL_STATE);
      const parsed = JSON.parse(raw);
      const merged = Object.assign({}, structuredClone(INITIAL_STATE), parsed);
      merged.config = Object.assign({}, structuredClone(INITIAL_STATE.config), parsed.config || {});
      return merged;
    } catch (_) {
      return structuredClone(INITIAL_STATE);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      showToast('⚠️ Storage limit reached. Please use smaller images.');
    }
  }

  function escapeHtml(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const item = document.createElement('div');
    item.className = 'toast-msg';
    item.textContent = msg;
    container.appendChild(item);
    setTimeout(() => item.remove(), 4000);
  }

  // Convert File Input (<input type="file">) to compressed Base64 Data URL for permanent localStorage persistence
  function readFileAsDataURL(file, maxWidth = 900) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target.result;
        if (!file.type.startsWith('image/')) {
          resolve(result);
          return;
        }
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.84));
        };
        img.onerror = () => resolve(result);
        img.src = result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Register Service Worker & Handle PWA Install Prompt
  function initPwaSupport() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPwaPrompt = e;
    });

    const installBtn = document.getElementById('installPwaBtn');
    if (installBtn) {
      installBtn.onclick = async () => {
        if (deferredPwaPrompt) {
          deferredPwaPrompt.prompt();
          const choice = await deferredPwaPrompt.userChoice;
          if (choice && choice.outcome === 'accepted') {
            showToast('✅ CGpedia App installed on your Home Screen!');
          }
          deferredPwaPrompt = null;
        } else {
          openPwaInstallGuideModal();
        }
      };
    }
  }

  function openPwaInstallGuideModal() {
    const modal = document.getElementById('genericModalContainer');
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:500px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:1.15rem;font-weight:800;">📲 Install ${escapeHtml(state.config.appTitle)} Web App</h3>
            <button class="btn btn-outline btn-sm" id="closePwaGuideBtn">✕</button>
          </div>
          <p style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:14px;">
            बिना किसी APK फाइल के <strong>${escapeHtml(state.config.appTitle)} (${escapeHtml(state.config.appSubtitle)})</strong> को अपने फोन की होम स्क्रीन पर नेटिव ऐप की तरह जोड़ें:
          </p>
          <div style="background:var(--bg-elevated);padding:14px;border-radius:12px;margin-bottom:12px;font-size:0.85rem;">
            <div style="font-weight:800;color:var(--brand-blue);margin-bottom:6px;">🤖 Android (Chrome / Edge / Brave):</div>
            <div>1. ब्राउज़र के ऊपर दाईं ओर <strong>⋮ (Three Dots Menu)</strong> पर टैप करें।</div>
            <div>2. <strong>"Add to Home screen"</strong> या <strong>"Install app"</strong> चुनें।</div>
          </div>
          <div style="background:var(--bg-elevated);padding:14px;border-radius:12px;margin-bottom:14px;font-size:0.85rem;">
            <div style="font-weight:800;color:var(--brand-gold);margin-bottom:6px;">🍎 iPhone / iOS (Safari):</div>
            <div>1. नीचे <strong>Share (⬆️)</strong> आइकन पर टैप करें।</div>
            <div>2. <strong>"Add to Home Screen"</strong> पर टैप करें।</div>
          </div>
          <button class="btn btn-primary" id="okPwaGuideBtn" style="width:100%;">Got It / समझ गया</button>
        </div>
      </div>
    `;
    document.getElementById('closePwaGuideBtn').onclick = () => { modal.innerHTML = ''; };
    document.getElementById('okPwaGuideBtn').onclick = () => { modal.innerHTML = ''; };
  }

  // Official Anthem Audio Player
  function toggleAnthem() {
    if (!state.config.anthemEnabled) return;
    const label = document.getElementById('anthemBtnLabel');
    if (isAnthemPlaying && audioCtx) {
      audioCtx.close();
      audioCtx = null;
      isAnthemPlaying = false;
      if (label) label.textContent = 'Anthem';
      showToast('🔇 Anthem Paused');
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      isAnthemPlaying = true;
      if (label) label.textContent = 'Stop';
      showToast(`🎵 Playing ${state.config.appTitle} Anthem`);

      const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 440.00, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.34);
        gain.gain.setValueAtTime(0.14, audioCtx.currentTime + idx * 0.34);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (idx + 0.9) * 0.34);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.34);
        osc.stop(audioCtx.currentTime + (idx + 1) * 0.34);
      });
      setTimeout(() => {
        if (isAnthemPlaying) {
          isAnthemPlaying = false;
          if (label) label.textContent = 'Anthem';
        }
      }, notes.length * 350 + 200);
    } catch (_) {}
  }

  // Strictly Active 24-Hour Stories Filter
  function getActive24hStories() {
    const nowMs = Date.now();
    return (state.stories || []).filter((st) => {
      const age = nowMs - (st.postedAt || 0);
      return age >= 0 && age <= STORY_DURATION_MS;
    });
  }

  function formatStoryTimeRemaining(postedAt) {
    const rem = Math.max(0, (postedAt + STORY_DURATION_MS) - Date.now());
    const hrs = Math.floor(rem / 3600000);
    const mins = Math.floor((rem % 3600000) / 60000);
    return hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;
  }

  // Strict Activation-Based Validity Check for Paid Exam Folders
  function getFolderAccessStatus(folder) {
    if (!folder.isPaid) {
      return { unlocked: true, badgeText: 'Free Access', daysLeft: null };
    }
    if (state.currentUser.isAdmin || state.currentUser.email.toLowerCase() === ADMIN_EMAIL) {
      return { unlocked: true, badgeText: 'Admin Master Access', daysLeft: null };
    }
    const idKey = `${folder.id}__${state.currentUser.id.trim().toLowerCase()}`;
    const emailKey = `${folder.id}__${state.currentUser.email.trim().toLowerCase()}`;
    const record = state.studentActivations[idKey] || state.studentActivations[emailKey];

    if (!record) {
      return { unlocked: false, badgeText: `Locked • ₹${folder.priceINR}`, daysLeft: 0 };
    }
    const nowMs = Date.now();
    if (nowMs > record.expiresAt) {
      // Automatically revoke expired access
      return { unlocked: false, badgeText: 'Validity Expired', expired: true, expiredAt: record.expiresAt };
    }
    const remMs = record.expiresAt - nowMs;
    const daysLeft = Math.ceil(remMs / 86400000);
    return {
      unlocked: true,
      badgeText: `Active (${daysLeft}d left)`,
      daysLeft,
      activatedAt: record.activatedAt,
      expiresAt: record.expiresAt
    };
  }

  // Student Payment Modal (UPI QR + Download QR + Copy UPI + Auto-Typed WhatsApp 9238810070)
  function openStudentPaymentModal(folder) {
    const modal = document.getElementById('genericModalContainer');
    const waNumber = (state.config.whatsappNumber || '9238810070').replace(/\D/g, '');
    const waFullPhone = waNumber.length === 10 ? '91' + waNumber : waNumber;
    const upiId = state.config.upiId || '9238810070@upi';
    const qrSrc = state.config.upiQrDataUrl || DEFAULT_QR_SVG;

    const autoTypedMessage =
      `Hello ${state.config.appTitle} Admin,\n` +
      `I have paid ₹${folder.priceINR} for the Paid Test Series.\n` +
      `• Package Name: ${folder.titleHi} (${folder.titleEn})\n` +
      `• Student Name: ${state.currentUser.name}\n` +
      `• Registered Email ID: ${state.currentUser.email}\n` +
      `• User ID: ${state.currentUser.id}\n` +
      `Please find my payment screenshot attached and activate my ${folder.validityDays}-day validity.`;

    const waUrl = `https://wa.me/${waFullPhone}?text=${encodeURIComponent(autoTypedMessage)}`;

    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:520px;text-align:center;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span class="badge badge-paid">💎 INSTANT PACKAGE ACTIVATION</span>
            <button class="btn btn-outline btn-sm" id="closePayModalBtn">✕ Close</button>
          </div>

          <h3 style="font-size:1.18rem;font-weight:800;margin-bottom:4px;">${escapeHtml(folder.titleHi)}</h3>
          <div style="font-size:0.86rem;color:var(--text-secondary);margin-bottom:12px;">${escapeHtml(folder.titleEn)}</div>

          <div style="display:flex;justify-content:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
            <span class="badge badge-paid" style="font-size:0.85rem;padding:6px 14px;">Price: ₹${folder.priceINR}</span>
            <span class="badge badge-free" style="font-size:0.85rem;padding:6px 14px;">Validity: ${folder.validityDays} Days (from Activation)</span>
          </div>

          <div class="qr-preview-box">
            <img src="${qrSrc}" alt="Official UPI QR Code" id="paymentModalQrImg" />
          </div>

          <div style="display:flex;justify-content:center;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
            <a href="${qrSrc}" download="CGpedia_UPI_QR.png" class="btn btn-outline btn-sm">⬇ Download QR</a>
            <button class="btn btn-outline btn-sm" id="copyUpiIdBtn">📋 Copy UPI ID: ${escapeHtml(upiId)}</button>
          </div>

          <div style="background:var(--bg-elevated);padding:12px;border-radius:12px;text-align:left;font-size:0.82rem;margin-bottom:16px;border-left:4px solid var(--brand-amber);">
            <div style="font-weight:800;margin-bottom:4px;">📌 निर्देश / Instructions:</div>
            <div style="margin-bottom:4px;">• भुगतान करने के लिए QR कोड स्कैन करें, पेमेंट का स्क्रीनशॉट लें, और तुरंत एक्टिवेशन के लिए नीचे दिए गए WhatsApp बटन पर क्लिक करके स्क्रीनशॉट भेजें।</div>
            <div style="color:var(--text-secondary);">• Scan the QR to pay, take a payment screenshot, and click the WhatsApp button below to send the screenshot for instant activation.</div>
          </div>

          <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-emerald" style="width:100%;padding:12px;font-size:0.94rem;">
            💬 Send Payment Screenshot on WhatsApp (${escapeHtml(state.config.whatsappNumber)})
          </a>
        </div>
      </div>
    `;

    document.getElementById('closePayModalBtn').onclick = () => { modal.innerHTML = ''; };
    document.getElementById('copyUpiIdBtn').onclick = () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(upiId).catch(() => {});
      }
      showToast(`✅ Copied UPI ID: ${upiId}`);
    };
  }

  // 60-Minute Silent Background Sync for Current Affairs (Never shows raw API quota errors to students)
  async function runSilentCurrentAffairsSync() {
    if (!state.config.aiEnabled || !state.config.geminiApiKey) return;
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(state.config.geminiApiKey)}`;
      const prompt = 'Return 1 current affairs update for Chhattisgarh CGPSC & National exam in strict JSON format: {"category":"CG Current","titleHi":"...","titleEn":"...","bodyHi":"...","bodyEn":"...","qHi":"...","qEn":"...","optionsHi":["A","B","C","D"],"optionsEn":["A","B","C","D"],"correctIndex":0}';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      if (!res.ok) return; // Silently ignore quota or key errors for students
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return;
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.titleHi && parsed.bodyHi) {
        state.stories.unshift({
          id: 'st-' + Date.now(),
          category: parsed.category || 'Current Affairs',
          imageUrl: '',
          titleHi: parsed.titleHi,
          titleEn: parsed.titleEn || parsed.titleHi,
          bodyHi: parsed.bodyHi,
          bodyEn: parsed.bodyEn || parsed.bodyHi,
          quizQuestion: parsed.qHi ? {
            qHi: parsed.qHi,
            qEn: parsed.qEn || parsed.qHi,
            optionsHi: parsed.optionsHi || ['विकल्प A', 'विकल्प B', 'विकल्प C', 'विकल्प D'],
            optionsEn: parsed.optionsEn || ['Option A', 'Option B', 'Option C', 'Option D'],
            correctIndex: Number(parsed.correctIndex || 0)
          } : null,
          postedAt: Date.now(),
          seen: false
        });
        state.lastAutoSyncAt = Date.now();
        saveState();
        renderApp();
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${state.config.appTitle} — New Current Affairs`, { body: parsed.titleHi });
        }
      }
    } catch (_) {
      // Silently swallow any quota/network error so students never see raw API errors
    }
  }

  setInterval(runSilentCurrentAffairsSync, AUTO_SYNC_INTERVAL_MS);

  // Instagram-Style Story Viewer (Sequential, No Loop, Hold to Pause, Left/Right Tap)
  function openStoryViewer(startIdx) {
    const activeStories = getActive24hStories();
    if (!activeStories.length) return;

    storyPlayerState = {
      stories: activeStories,
      currentIndex: Math.max(0, Math.min(startIdx, activeStories.length - 1)),
      progress: 0,
      paused: false,
      timerId: null
    };

    markCurrentStorySeen();
    renderStoryModalDOM();

    storyPlayerState.timerId = setInterval(() => {
      if (!storyPlayerState || storyPlayerState.paused) return;
      storyPlayerState.progress += 2;
      const fillEl = document.getElementById('activeStoryFillBar');
      if (fillEl) fillEl.style.width = `${Math.min(100, storyPlayerState.progress)}%`;
      if (storyPlayerState.progress >= 100) {
        advanceNextStory();
      }
    }, 100);
  }

  function markCurrentStorySeen() {
    if (!storyPlayerState) return;
    const st = storyPlayerState.stories[storyPlayerState.currentIndex];
    if (!st) return;
    const found = state.stories.find((item) => item.id === st.id);
    if (found) {
      found.seen = true;
      saveState();
    }
  }

  function advanceNextStory() {
    if (!storyPlayerState) return;
    // Sequential non-repeating playback: stop once finished
    if (storyPlayerState.currentIndex < storyPlayerState.stories.length - 1) {
      storyPlayerState.currentIndex += 1;
      storyPlayerState.progress = 0;
      markCurrentStorySeen();
      renderStoryModalDOM();
    } else {
      closeStoryViewer();
    }
  }

  function goPrevStory() {
    if (!storyPlayerState) return;
    if (storyPlayerState.currentIndex > 0) {
      storyPlayerState.currentIndex -= 1;
      storyPlayerState.progress = 0;
      markCurrentStorySeen();
      renderStoryModalDOM();
    } else {
      storyPlayerState.progress = 0;
    }
  }

  function closeStoryViewer() {
    if (storyPlayerState && storyPlayerState.timerId) {
      clearInterval(storyPlayerState.timerId);
    }
    storyPlayerState = null;
    const container = document.getElementById('storyModalContainer');
    if (container) container.innerHTML = '';
    renderApp();
  }

  function renderStoryModalDOM() {
    const container = document.getElementById('storyModalContainer');
    if (!container || !storyPlayerState) return;
    const { stories, currentIndex, progress, paused } = storyPlayerState;
    const st = stories[currentIndex];

    const segsHtml = stories.map((_, idx) => {
      const w = idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%';
      return `
        <div class="story-progress-seg">
          <div class="story-progress-fill" ${idx === currentIndex ? 'id="activeStoryFillBar"' : ''} style="width:${w}"></div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="story-modal-backdrop">
        <div class="story-player-frame" id="storyTouchSurface">
          <div>
            <div class="story-progress-row">${segsHtml}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <div>
                <div style="font-weight:800;font-size:0.86rem;">${escapeHtml(st.category || 'Current Affairs')} (${currentIndex + 1}/${stories.length})</div>
                <div style="font-size:0.72rem;color:#FBBF24;">⏳ ${formatStoryTimeRemaining(st.postedAt)}</div>
              </div>
              <button class="btn btn-outline btn-sm" id="closeStoryModalBtn" style="background:rgba(255,255,255,0.14);color:#FFF;border:none;">✕</button>
            </div>

            ${st.imageUrl ? `
              <div style="width:100%;height:170px;border-radius:14px;overflow:hidden;margin-bottom:12px;background:#000;">
                <img src="${st.imageUrl}" alt="Story Visual" style="width:100%;height:100%;object-fit:cover;" />
              </div>
            ` : ''}

            <div style="background:rgba(255,255,255,0.09);border-radius:14px;padding:14px;border-left:4px solid #F59E0B;margin-bottom:10px;">
              <div style="font-size:0.68rem;font-weight:800;color:#FBBF24;text-transform:uppercase;margin-bottom:4px;">हिंदी (Hindi)</div>
              <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:6px;">${escapeHtml(st.titleHi)}</h3>
              <p style="font-size:0.88rem;color:#E2E8F0;line-height:1.5;">${escapeHtml(st.bodyHi)}</p>
            </div>

            <div style="background:rgba(255,255,255,0.06);border-radius:14px;padding:14px;border-left:4px solid #60A5FA;">
              <div style="font-size:0.68rem;font-weight:800;color:#93C5FD;text-transform:uppercase;margin-bottom:4px;">English</div>
              <h4 style="font-size:0.96rem;font-weight:800;margin-bottom:6px;">${escapeHtml(st.titleEn)}</h4>
              <p style="font-size:0.84rem;color:#CBD5E1;line-height:1.5;">${escapeHtml(st.bodyEn)}</p>
            </div>
          </div>

          <div style="margin-top:14px;">
            <div style="display:flex;justify-content:space-between;font-size:0.74rem;color:#94A3B8;margin-bottom:6px;">
              <span>24-Hour Auto-Expiry Story</span>
              <span id="storyStateIndicator">${paused ? '⏸ PAUSED' : '▶ PLAYING'}</span>
            </div>
            <div style="background:rgba(0,0,0,0.35);padding:8px;border-radius:10px;font-size:0.72rem;text-align:center;color:#CBD5E1;">
              👈 Tap Left: Prev • ✋ Hold: Pause • Tap Right: Next 👉
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeStoryModalBtn').onclick = (e) => {
      e.stopPropagation();
      closeStoryViewer();
    };

    const surface = document.getElementById('storyTouchSurface');
    if (surface) {
      let downAt = 0;
      const onDown = (e) => {
        if (e.target.closest('#closeStoryModalBtn')) return;
        downAt = Date.now();
        if (storyPlayerState) {
          storyPlayerState.paused = true;
          const ind = document.getElementById('storyStateIndicator');
          if (ind) ind.textContent = '⏸ PAUSED';
        }
      };
      const onUp = (e) => {
        if (e.target.closest('#closeStoryModalBtn')) return;
        const heldMs = Date.now() - downAt;
        if (storyPlayerState) {
          storyPlayerState.paused = false;
          const ind = document.getElementById('storyStateIndicator');
          if (ind) ind.textContent = '▶ PLAYING';
        }
        if (heldMs > 250) return;
        const rect = surface.getBoundingClientRect();
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        if (clientX - rect.left < rect.width * 0.38) {
          goPrevStory();
        } else {
          advanceNextStory();
        }
      };
      surface.addEventListener('mousedown', onDown);
      surface.addEventListener('mouseup', onUp);
      surface.addEventListener('touchstart', onDown, { passive: true });
      surface.addEventListener('touchend', onUp);
    }
  }

  // Launch Instant Current Affairs Quiz for Students
  function launchCurrentAffairsQuiz() {
    const activeStories = getActive24hStories();
    const questions = activeStories
      .map((st, idx) => {
        if (st.quizQuestion && st.quizQuestion.qHi) {
          return {
            id: 'caq-' + idx,
            qHi: st.quizQuestion.qHi,
            qEn: st.quizQuestion.qEn || st.quizQuestion.qHi,
            optionsHi: st.quizQuestion.optionsHi,
            optionsEn: st.quizQuestion.optionsEn || st.quizQuestion.optionsHi,
            correctIndex: Number(st.quizQuestion.correctIndex || 0),
            expHi: st.bodyHi,
            expEn: st.bodyEn
          };
        }
        return {
          id: 'caq-auto-' + idx,
          qHi: `समसामयिकी प्रश्न: "${st.titleHi}" किस श्रेणी से संबंधित है?`,
          qEn: `Current Affairs Question: Which category does "${st.titleEn}" belong to?`,
          optionsHi: [st.category || 'छत्तीसगढ़ समसामयिकी', 'प्राचीन इतिहास', 'विश्व भूगोल', 'इनमें से कोई नहीं'],
          optionsEn: [st.category || 'Chhattisgarh Current Affairs', 'Ancient History', 'World Geography', 'None of these'],
          correctIndex: 0,
          expHi: st.bodyHi,
          expEn: st.bodyEn
        };
      });

    if (!questions.length) {
      showToast('अभी कोई सक्रिय करेंट अफेयर्स क्विज़ उपलब्ध नहीं है। एडमिन द्वारा स्टोरी पोस्ट करने पर क्विज़ उपलब्ध होगा।');
      return;
    }

    startExamSession({
      id: 'ca-live-quiz',
      titleHi: 'त्वरित समसामयिकी क्विज़ (Current Affairs Quiz)',
      titleEn: 'Instant Current Affairs MCQ Quiz',
      durationMinutes: Math.max(5, questions.length * 2),
      marksPerQuestion: 2.0,
      negativeMarking: 0.66,
      questions
    });
  }

  // Start Safe CBT Exam Session
  function startExamSession(testObj) {
    if (!testObj.questions || !testObj.questions.length) {
      showToast('इस टेस्ट में अभी कोई प्रश्न नहीं हैं।');
      return;
    }
    if (activeExamSession && activeExamSession.timerId) {
      clearInterval(activeExamSession.timerId);
    }
    activeExamSession = {
      test: testObj,
      currentIndex: 0,
      remainingSeconds: Math.max(1, Number(testObj.durationMinutes || 60)) * 60,
      answers: {},
      review: {},
      visited: { 0: true },
      submitted: false,
      timerId: null
    };

    activeExamSession.timerId = setInterval(() => {
      if (!activeExamSession || activeExamSession.submitted) return;
      activeExamSession.remainingSeconds -= 1;
      const el = document.getElementById('liveExamTimer');
      if (el) el.textContent = formatTimerMMSS(activeExamSession.remainingSeconds);
      if (activeExamSession.remainingSeconds <= 0) {
        completeExamSubmission();
      }
    }, 1000);

    renderApp();
  }

  function formatTimerMMSS(sec) {
    const s = Math.max(0, sec);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  // Safe Top-Right Final Submit Confirmation Popup
  function openFinalSubmitConfirmPopup() {
    if (!activeExamSession) return;
    const total = activeExamSession.test.questions.length;
    const answered = Object.keys(activeExamSession.answers).length;
    const marked = Object.keys(activeExamSession.review).filter((k) => activeExamSession.review[k]).length;
    const skipped = total - answered;

    const modal = document.getElementById('genericModalContainer');
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:480px;">
          <h3 style="font-size:1.18rem;font-weight:800;margin-bottom:8px;">Are you sure you want to submit?</h3>
          <p style="font-size:0.86rem;color:var(--text-secondary);margin-bottom:16px;">
            क्या आप वाकई अपना टेस्ट फाइनल सबमिट करना चाहते हैं? सबमिट करने के बाद उत्तर बदले नहीं जा सकेंगे।
          </p>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;text-align:center;margin-bottom:18px;">
            <div style="background:var(--bg-elevated);padding:12px;border-radius:10px;">
              <div style="font-size:1.25rem;font-weight:900;color:#059669;">${answered}</div>
              <div style="font-size:0.74rem;font-weight:700;">Answered</div>
            </div>
            <div style="background:var(--bg-elevated);padding:12px;border-radius:10px;">
              <div style="font-size:1.25rem;font-weight:900;color:#DC2626;">${skipped}</div>
              <div style="font-size:0.74rem;font-weight:700;">Unanswered</div>
            </div>
            <div style="background:var(--bg-elevated);padding:12px;border-radius:10px;">
              <div style="font-size:1.25rem;font-weight:900;color:#7C3AED;">${marked}</div>
              <div style="font-size:0.74rem;font-weight:700;">Review</div>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button class="btn btn-outline" id="cancelFinalSubmitBtn">No, Resume Test</button>
            <button class="btn btn-emerald" id="confirmFinalSubmitBtn">✅ Yes, Final Submit</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('cancelFinalSubmitBtn').onclick = () => { modal.innerHTML = ''; };
    document.getElementById('confirmFinalSubmitBtn').onclick = () => {
      modal.innerHTML = '';
      completeExamSubmission();
    };
  }

  function completeExamSubmission() {
    if (!activeExamSession) return;
    if (activeExamSession.timerId) clearInterval(activeExamSession.timerId);
    activeExamSession.submitted = true;
    renderApp();
  }

  // Render Safe Exam Room (Final Submit in Top-Right Header, Previous & Next at Bottom)
  function renderExamSessionHTML() {
    const { test, currentIndex, remainingSeconds, answers, review, visited, submitted } = activeExamSession;
    const questions = test.questions;
    const posMarks = Number(test.marksPerQuestion || 2.0);
    const negMarks = Number(test.negativeMarking || 0.66);

    if (submitted) {
      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === undefined) skipped++;
        else if (answers[idx] === Number(q.correctIndex)) correct++;
        else wrong++;
      });
      const score = (correct * posMarks) - (wrong * negMarks);
      const maxScore = questions.length * posMarks;
      const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

      const solutionsHtml = questions.map((q, idx) => {
        const uAns = answers[idx];
        const isRight = uAns === Number(q.correctIndex);
        return `
          <div class="folder-card" style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>Question ${idx + 1}</strong>
              <span class="badge ${uAns === undefined ? 'badge-draft' : isRight ? 'badge-free' : 'badge-live'}">
                ${uAns === undefined ? 'Unattempted' : isRight ? '✓ Correct (+' + posMarks + ')' : '✗ Wrong (-' + negMarks + ')'}
              </span>
            </div>
            <div class="bilingual-q-box">
              <div class="q-hi">${escapeHtml(q.qHi)}</div>
              <div class="q-en">${escapeHtml(q.qEn)}</div>
            </div>
            <div style="font-size:0.85rem;font-weight:700;color:var(--brand-emerald);">
              ✓ Correct Option (${String.fromCharCode(65 + Number(q.correctIndex))}):
              ${escapeHtml((q.optionsHi || [])[q.correctIndex] || '')} / ${escapeHtml((q.optionsEn || [])[q.correctIndex] || '')}
            </div>
            <div style="background:var(--bg-elevated);padding:12px;border-radius:10px;font-size:0.83rem;">
              <div style="font-weight:800;color:var(--brand-blue);margin-bottom:4px;">📘 Solution / व्याख्या:</div>
              <div>${escapeHtml(q.expHi || 'विस्तृत समाधान उपलब्ध।')}</div>
              <div style="color:var(--text-secondary);margin-top:4px;">${escapeHtml(q.expEn || '')}</div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div>
          <div class="cbt-top-bar">
            <div>
              <div style="font-size:0.75rem;color:#93C5FD;">RESULT &amp; DETAILED SOLUTIONS</div>
              <h2 style="font-size:1.15rem;font-weight:800;">${escapeHtml(test.titleHi)}</h2>
            </div>
            <button class="btn btn-gold btn-sm" id="exitExamRoomBtn">🏠 Back to Folder</button>
          </div>

          <div class="admin-stats-grid">
            <div class="stat-card">
              <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:700;">Total Score</div>
              <div class="stat-value">${score.toFixed(2)} / ${maxScore}</div>
            </div>
            <div class="stat-card">
              <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:700;">Accuracy</div>
              <div class="stat-value" style="color:#059669;">${accuracy}%</div>
            </div>
            <div class="stat-card">
              <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:700;">Correct / Wrong</div>
              <div class="stat-value">${correct} ✓ / ${wrong} ✗</div>
            </div>
            <div class="stat-card">
              <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:700;">Unattempted</div>
              <div class="stat-value" style="color:#64748B;">${skipped}</div>
            </div>
          </div>

          <h3 style="margin:16px 0 12px;font-weight:800;">Detailed Bilingual Solutions</h3>
          ${solutionsHtml}
        </div>
      `;
    }

    const q = questions[currentIndex];
    const selectedOpt = answers[currentIndex];

    const optsHtml = (q.optionsHi || []).map((optHi, idx) => {
      const optEn = (q.optionsEn && q.optionsEn[idx]) || '';
      return `
        <button class="option-item ${selectedOpt === idx ? 'selected' : ''}" data-opt-idx="${idx}">
          <span class="option-circle">${String.fromCharCode(65 + idx)}</span>
          <div>
            <div style="font-weight:700;font-size:0.95rem;">${escapeHtml(optHi)}</div>
            ${optEn ? `<div style="font-size:0.83rem;color:var(--text-secondary);">${escapeHtml(optEn)}</div>` : ''}
          </div>
        </button>
      `;
    }).join('');

    const paletteBtns = questions.map((_, idx) => {
      let cls = 'palette-btn';
      if (review[idx]) cls += ' review';
      else if (answers[idx] !== undefined) cls += ' answered';
      else if (visited[idx]) cls += ' visited';
      if (idx === currentIndex) cls += ' current';
      return `<button class="${cls}" data-palette-idx="${idx}">${idx + 1}</button>`;
    }).join('');

    return `
      <div>
        <!-- Top Header with Safe Final Submit Test Button in Top-Right -->
        <div class="cbt-top-bar">
          <div>
            <div style="font-size:0.74rem;color:#FBBF24;font-weight:700;">LIVE CBT EXAM • ${escapeHtml(state.config.appSubtitle)}</div>
            <h2 style="font-size:1.08rem;font-weight:800;">${escapeHtml(test.titleHi)}</h2>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <div class="timer-pill" id="liveExamTimer">⏱ ${formatTimerMMSS(remainingSeconds)}</div>
            <button class="btn btn-emerald btn-sm" id="topRightFinalSubmitBtn">✅ Final Submit Test</button>
            <button class="btn btn-outline btn-sm" id="exitExamRoomBtn" style="background:rgba(255,255,255,0.12);color:#FFF;border:none;">✕ Exit</button>
          </div>
        </div>

        <div class="cbt-layout">
          <div class="cbt-question-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
              <strong style="color:var(--brand-blue);">Question ${currentIndex + 1} of ${questions.length}</strong>
              <div style="display:flex;gap:8px;">
                <span class="badge badge-free">+${posMarks} Marks</span>
                <span class="badge badge-live">-${negMarks} Negative</span>
              </div>
            </div>

            <div class="bilingual-q-box">
              <div class="q-hi">${escapeHtml(q.qHi)}</div>
              ${q.qEn ? `<div class="q-en">${escapeHtml(q.qEn)}</div>` : ''}
            </div>

            <div>${optsHtml}</div>

            <!-- Bottom Navigation strictly has Previous, Clear/Review, and Next Question (Submit is safely in top-right header) -->
            <div class="cbt-bottom-nav">
              <button class="btn btn-outline" id="cbtPrevBtn" ${currentIndex === 0 ? 'disabled' : ''}>⬅ Previous</button>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-outline btn-sm" id="cbtClearBtn">Clear</button>
                <button class="btn btn-outline btn-sm" id="cbtReviewBtn">
                  ${review[currentIndex] ? '🟣 Unmark Review' : '🔖 Mark Review'}
                </button>
              </div>
              <button class="btn btn-primary" id="cbtNextBtn" ${currentIndex >= questions.length - 1 ? 'disabled' : ''}>
                Next Question ➡
              </button>
            </div>
          </div>

          <div class="palette-card">
            <h4 style="font-size:0.92rem;font-weight:800;">Question Palette</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.74rem;margin-top:8px;">
              <div>🟢 Answered (${Object.keys(answers).length})</div>
              <div>🟣 Review (${Object.keys(review).filter((k) => review[k]).length})</div>
              <div>🟠 Visited</div>
              <div>⚪ Not Visited</div>
            </div>
            <div class="palette-grid">${paletteBtns}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Render Instagram Stories Bar at Top of Student View
  function renderInstagramStoriesBarHTML() {
    const activeStories = getActive24hStories();
    if (!activeStories.length) {
      return '';
    }
    const bubbles = activeStories.map((st, idx) => `
      <div class="story-bubble" data-story-idx="${idx}">
        <div class="story-ring ${st.seen ? 'seen' : ''}">
          <div class="story-avatar">
            ${st.imageUrl ? `<img src="${st.imageUrl}" alt="Story" />` : `<span>📰</span>`}
          </div>
        </div>
        <div class="story-label">${escapeHtml(st.titleHi)}</div>
        <div class="story-time-left">${formatStoryTimeRemaining(st.postedAt)}</div>
      </div>
    `).join('');

    return `
      <section class="stories-card">
        <div class="stories-header">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:9px;height:9px;border-radius:50%;background:#EF4444;display:inline-block;"></span>
            <strong style="font-size:0.92rem;">Current Affairs Stories (24h Bilingual)</strong>
          </div>
          <button class="btn btn-gold btn-sm" id="topBarQuizBtn">⚡ Quiz</button>
        </div>
        <div class="stories-strip">${bubbles}</div>
      </section>
    `;
  }

  // 1. Student Dashboard (Published Exam Folders Only — Clean Slate when Empty)
  function renderStudentDashboardHTML() {
    const publishedFolders = (state.folders || []).filter((f) => f.status === 'published');

    // Inside a specific Published Exam Folder
    if (state.selectedFolderId) {
      const folder = publishedFolders.find((f) => f.id === state.selectedFolderId);
      if (!folder) {
        state.selectedFolderId = null;
        return renderStudentDashboardHTML();
      }
      const access = getFolderAccessStatus(folder);
      const publishedTests = (folder.tests || []).filter((t) => t.status === 'published');

      const testsHtml = publishedTests.map((t) => {
        const isLocked = folder.isPaid && t.isPaid && !access.unlocked;
        return `
          <div class="folder-card">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span class="badge ${t.isPaid ? 'badge-paid' : 'badge-free'}">
                  ${t.isPaid ? (isLocked ? '🔒 Paid Test' : '🔓 Unlocked') : '🆓 Free Test'}
                </span>
                <span style="font-size:0.75rem;color:var(--text-muted);">⏱ ${t.durationMinutes} Mins</span>
              </div>
              <h4 style="font-size:1.02rem;font-weight:800;margin-bottom:4px;">${escapeHtml(t.titleHi)}</h4>
              <div style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:10px;">${escapeHtml(t.titleEn)}</div>
              <div class="folder-meta">
                <span>📝 ${(t.questions || []).length} Questions</span>
                <span>➕ +${t.marksPerQuestion} / -${t.negativeMarking}</span>
              </div>
            </div>
            ${isLocked
              ? `<button class="btn btn-gold btn-sm trigger-pay-modal-btn" data-folder-id="${folder.id}" style="width:100%;">🔒 Unlock Package (₹${folder.priceINR})</button>`
              : `<button class="btn btn-primary btn-sm launch-test-btn" data-folder-id="${folder.id}" data-test-id="${t.id}" style="width:100%;">▶ Attempt Test</button>`
            }
          </div>
        `;
      }).join('');

      return `
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
            <button class="btn btn-outline btn-sm" id="backToMainFoldersBtn">⬅ Back to Exam Folders</button>
            <span class="badge ${access.unlocked ? 'badge-free' : 'badge-paid'}">${escapeHtml(access.badgeText)}</span>
          </div>

          <div class="folder-card" style="margin-bottom:18px;border-left:4px solid var(--brand-blue);">
            <div>
              <h2 style="font-size:1.2rem;font-weight:800;margin-bottom:4px;">📁 ${escapeHtml(folder.titleHi)}</h2>
              <div style="font-size:0.88rem;color:var(--text-secondary);margin-bottom:8px;">${escapeHtml(folder.titleEn)}</div>
              <p style="font-size:0.84rem;color:var(--text-secondary);">${escapeHtml(folder.description || '')}</p>
            </div>
            ${folder.isPaid && !access.unlocked ? `
              <button class="btn btn-gold trigger-pay-modal-btn" data-folder-id="${folder.id}">
                💳 Buy / Unlock Test Series — ₹${folder.priceINR} (${folder.validityDays} Days Validity)
              </button>
            ` : ''}
          </div>

          ${publishedTests.length
            ? `<div class="cards-grid">${testsHtml}</div>`
            : `<div class="empty-state-card">
                <div class="empty-state-icon">📝</div>
                <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:6px;">No Published Tests in This Folder Yet</h3>
                <p style="font-size:0.86rem;color:var(--text-secondary);">इस परीक्षा फोल्डर में जल्द ही नए टेस्ट पब्लिश किए जाएंगे।</p>
               </div>`
          }
        </div>
      `;
    }

    // Main Folder View
    const folderCardsHtml = publishedFolders.map((folder) => {
      const access = getFolderAccessStatus(folder);
      const pubTestCount = (folder.tests || []).filter((t) => t.status === 'published').length;
      return `
        <div class="folder-card">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <span class="badge ${folder.isPaid ? 'badge-paid' : 'badge-free'}">
                ${folder.isPaid ? `💎 Paid • ₹${folder.priceINR}` : '🆓 Free Series'}
              </span>
              <span class="badge ${access.unlocked ? 'badge-free' : 'badge-live'}">${escapeHtml(access.badgeText)}</span>
            </div>
            <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:4px;">📁 ${escapeHtml(folder.titleHi)}</h3>
            <div style="font-size:0.86rem;color:var(--text-secondary);margin-bottom:8px;">${escapeHtml(folder.titleEn)}</div>
            <p style="font-size:0.83rem;color:var(--text-secondary);margin-bottom:10px;">${escapeHtml(folder.description || '')}</p>
            <div class="folder-meta">
              <span>📚 ${pubTestCount} Published Tests</span>
              <span>⏳ Validity: ${folder.validityDays} Days</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm open-exam-folder-btn" data-folder-id="${folder.id}" style="flex:1;">
              📂 Open Folder (${pubTestCount})
            </button>
            ${folder.isPaid && !access.unlocked ? `
              <button class="btn btn-gold btn-sm trigger-pay-modal-btn" data-folder-id="${folder.id}">
                💳 Pay ₹${folder.priceINR}
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      ${renderInstagramStoriesBarHTML()}

      ${publishedFolders.length > 0
        ? `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h2 style="font-size:1.15rem;font-weight:800;">📁 Exam-Wise Test Series Folders</h2>
          </div>
          <div class="cards-grid">${folderCardsHtml}</div>
        `
        : `
          <div class="empty-state-card">
            <div class="empty-state-icon">📚</div>
            <h2 style="font-size:1.22rem;font-weight:800;margin-bottom:8px;">No Test Series Available Yet</h2>
            <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:16px;">
              अभी कोई टेस्ट सीरीज उपलब्ध नहीं है। जब एडमिन द्वारा नई टेस्ट सीरीज बनाकर <strong>Publish</strong> की जाएगी, तो वह यहाँ दिखाई देगी।
            </p>
            <button class="btn btn-outline btn-sm" id="emptyStateGoAdminBtn">⚙️ Open Admin Panel to Create &amp; Publish Tests</button>
          </div>
        `
      }
    `;
  }

  // 2. Current Affairs Tab (With Top-Right Quiz Button & 24h Auto-Expiry)
  function renderCurrentAffairsTabHTML() {
    const activeStories = getActive24hStories();
    const listHtml = activeStories.map((st, idx) => `
      <div class="folder-card">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span class="badge badge-free">${escapeHtml(st.category || 'Current Affairs')}</span>
            <span style="font-size:0.74rem;color:var(--brand-gold);font-weight:700;">⏳ ${formatStoryTimeRemaining(st.postedAt)}</span>
          </div>
          ${st.imageUrl ? `
            <div style="width:100%;height:160px;border-radius:12px;overflow:hidden;margin-bottom:10px;">
              <img src="${st.imageUrl}" alt="Current Affairs" style="width:100%;height:100%;object-fit:cover;" />
            </div>
          ` : ''}
          <h3 style="font-size:1.02rem;font-weight:800;margin-bottom:6px;">${escapeHtml(st.titleHi)}</h3>
          <p style="font-size:0.86rem;margin-bottom:8px;">${escapeHtml(st.bodyHi)}</p>
          <hr style="border:none;border-top:1px dashed var(--border-color);margin:8px 0;" />
          <h4 style="font-size:0.92rem;font-weight:700;color:var(--text-secondary);margin-bottom:4px;">${escapeHtml(st.titleEn)}</h4>
          <p style="font-size:0.82rem;color:var(--text-secondary);">${escapeHtml(st.bodyEn)}</p>
        </div>
        <button class="btn btn-outline btn-sm story-card-open-btn" data-story-idx="${idx}">▶ View Fullscreen Story</button>
      </div>
    `).join('');

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
        <div>
          <h2 style="font-size:1.18rem;font-weight:800;">⚡ Daily Current Affairs (24-Hour Stories)</h2>
          <div style="font-size:0.8rem;color:var(--text-secondary);">द्विभाषी समसामयिकी (हिंदी &amp; English) • 24 घंटे बाद स्वतः समाप्त</div>
        </div>
        <button class="btn btn-gold" id="caTabTopRightQuizBtn">⚡ Quiz</button>
      </div>

      ${renderInstagramStoriesBarHTML()}

      ${activeStories.length
        ? `<div class="cards-grid">${listHtml}</div>`
        : `<div class="empty-state-card">
            <div class="empty-state-icon">📰</div>
            <h3 style="font-size:1.12rem;font-weight:800;margin-bottom:6px;">No Active Current Affairs Stories (Last 24 Hours)</h3>
            <p style="font-size:0.86rem;color:var(--text-secondary);">पिछले 24 घंटों में कोई स्टोरी उपलब्ध नहीं है।</p>
           </div>`
      }
    `;
  }

  // 3. Notifications Hub & Upcoming Test Series Tab
  function renderNotificationsTabHTML() {
    const sortedNotifs = [...(state.notifications || [])].sort(
      (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt
    );

    const notifsHtml = sortedNotifs.map((n) => `
      <div class="folder-card" style="margin-bottom:12px;${n.pinned ? 'border-left:4px solid #F59E0B;' : ''}">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span class="badge ${n.pinned ? 'badge-paid' : 'badge-free'}">${n.pinned ? '📌 Pinned Broadcast' : '📢 Broadcast'}</span>
            <span style="font-size:0.74rem;color:var(--text-muted);">${new Date(n.createdAt).toLocaleString()}</span>
          </div>
          <h4 style="font-size:1.02rem;font-weight:800;margin-bottom:6px;">${escapeHtml(n.title)}</h4>
          <p style="font-size:0.88rem;white-space:pre-wrap;margin-bottom:10px;">${escapeHtml(n.message)}</p>

          ${n.mediaDataUrl && n.mediaType === 'image' ? `
            <div style="max-width:420px;border-radius:12px;overflow:hidden;margin-bottom:8px;">
              <img src="${n.mediaDataUrl}" alt="Attachment" style="width:100%;display:block;" />
            </div>
          ` : ''}

          ${n.mediaDataUrl && n.mediaType === 'audio' ? `
            <audio controls src="${n.mediaDataUrl}" style="width:100%;margin-top:6px;"></audio>
          ` : ''}

          ${n.mediaDataUrl && n.mediaType === 'video' ? `
            <video controls src="${n.mediaDataUrl}" style="width:100%;max-height:280px;border-radius:12px;margin-top:6px;"></video>
          ` : ''}

          ${n.mediaDataUrl && n.mediaType === 'pdf' ? `
            <a href="${n.mediaDataUrl}" download="${escapeHtml(n.mediaName || 'Document.pdf')}" class="btn btn-outline btn-sm">📄 Download Attached File (${escapeHtml(n.mediaName || 'PDF/Doc')})</a>
          ` : ''}
        </div>
      </div>
    `).join('');

    const upcomingHtml = (state.upcomingSeries || []).map((up) => `
      <div class="folder-card">
        <div>
          ${up.bannerDataUrl ? `
            <div style="width:100%;height:150px;border-radius:12px;overflow:hidden;margin-bottom:10px;">
              <img src="${up.bannerDataUrl}" alt="Upcoming Banner" style="width:100%;height:100%;object-fit:cover;" />
            </div>
          ` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span class="badge badge-paid">📅 ${escapeHtml(up.startDate)}</span>
            <strong style="color:var(--brand-blue);">${escapeHtml(up.priceLabel)}</strong>
          </div>
          <h4 style="font-size:1.02rem;font-weight:800;margin-bottom:4px;">${escapeHtml(up.title)}</h4>
          <p style="font-size:0.84rem;color:var(--text-secondary);">${escapeHtml(up.scheduleDetails)}</p>
        </div>
      </div>
    `).join('');

    return `
      <h2 style="font-size:1.15rem;font-weight:800;margin-bottom:12px;">📢 Official Broadcast Notifications</h2>
      ${sortedNotifs.length
        ? `<div>${notifsHtml}</div>`
        : `<div class="empty-state-card" style="padding:28px;">
            <p style="font-size:0.88rem;color:var(--text-secondary);">No broadcast notifications posted yet.</p>
           </div>`
      }

      <h2 style="font-size:1.15rem;font-weight:800;margin:24px 0 12px;">🚀 Upcoming Test Series Schedule</h2>
      ${(state.upcomingSeries || []).length
        ? `<div class="cards-grid">${upcomingHtml}</div>`
        : `<div class="empty-state-card" style="padding:28px;">
            <p style="font-size:0.88rem;color:var(--text-secondary);">No upcoming test series schedules posted yet.</p>
           </div>`
      }
    `;
  }

  // 4. Private Student Query / Support Section (With Gallery Screenshot Upload & Live Policy)
  function renderSupportTabHTML() {
    // Strictly visible only to the Admin and the specific Student who submitted it
    const myQueries = state.currentUser.isAdmin
      ? state.queries
      : (state.queries || []).filter((q) =>
          q.studentId.toLowerCase() === state.currentUser.id.toLowerCase() ||
          q.studentEmail.toLowerCase() === state.currentUser.email.toLowerCase()
        );

    const queriesHtml = myQueries.map((q) => `
      <div class="folder-card" style="margin-bottom:12px;">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span class="badge badge-paid">🔒 Private Ticket • ${escapeHtml(q.subject)}</span>
            <span style="font-size:0.74rem;color:var(--text-muted);">${new Date(q.createdAt).toLocaleString()}</span>
          </div>
          <p style="font-size:0.9rem;font-weight:700;margin-bottom:8px;">${escapeHtml(q.message)}</p>
          ${q.screenshotDataUrl ? `
            <div style="max-width:260px;border-radius:10px;overflow:hidden;border:1px solid var(--border-color);margin-bottom:8px;">
              <img src="${q.screenshotDataUrl}" alt="Query Screenshot" style="width:100%;display:block;" />
            </div>
          ` : ''}
          ${q.adminReply
            ? `<div style="background:rgba(5,150,105,0.12);border-left:4px solid #059669;padding:10px;border-radius:8px;font-size:0.85rem;">
                <strong>✅ Admin Reply:</strong> ${escapeHtml(q.adminReply)}
               </div>`
            : `<div style="font-size:0.78rem;color:var(--text-muted);">⏳ Visible strictly to you (${escapeHtml(q.studentId)}) and Admin. Awaiting reply.</div>`
          }
        </div>
      </div>
    `).join('');

    return `
      <div class="two-col-grid">
        <div class="folder-card">
          <div>
            <span class="badge badge-paid" style="margin-bottom:8px;">🔒 100% PRIVATE STUDENT QUERY DESK</span>
            <h3 style="font-size:1.08rem;font-weight:800;margin-bottom:6px;">Ask Query / Support (निजी सहायता एवं डाउट बॉक्स)</h3>
            <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">
              आपकी क्वेरी और स्क्रीनशॉट 100% गोपनीय हैं — केवल आप (<strong>${escapeHtml(state.currentUser.id)}</strong>) और एडमिन ही इसे देख सकते हैं।
            </p>
            <label style="font-size:0.78rem;font-weight:700;">Topic / Subject</label>
            <input type="text" id="studentQuerySubject" class="input-field" placeholder="e.g. Payment Activation / Question Doubt / Technical Issue" />
            <label style="font-size:0.78rem;font-weight:700;">Describe Your Issue (अपना संदेश लिखें)</label>
            <textarea id="studentQueryMessage" rows="3" class="textarea-field" placeholder="Write your query here..."></textarea>
            <label style="font-size:0.78rem;font-weight:700;">Optional Screenshot Upload from Gallery (<input type="file" id="studentQueryFile" accept="image/*" style="margin-top:4px;" />)</label>
          </div>
          <button class="btn btn-primary" id="sendPrivateQueryBtn" style="margin-top:10px;">🔒 Send Private Query to Admin</button>
        </div>

        <div class="folder-card">
          <div>
            <span class="badge badge-free" style="margin-bottom:8px;">OFFICIAL LIVE POLICY</span>
            <h3 style="font-size:1.08rem;font-weight:800;margin-bottom:4px;">${escapeHtml(state.config.policyTitleHi)}</h3>
            <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:10px;">${escapeHtml(state.config.policyTitleEn)}</div>
            <div style="background:var(--bg-elevated);padding:12px;border-radius:10px;font-size:0.85rem;white-space:pre-wrap;margin-bottom:10px;">${escapeHtml(state.config.policyBodyHi)}</div>
            <div style="background:var(--bg-elevated);padding:12px;border-radius:10px;font-size:0.82rem;color:var(--text-secondary);white-space:pre-wrap;">${escapeHtml(state.config.policyBodyEn)}</div>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);">
            WhatsApp Support: <strong>${escapeHtml(state.config.whatsappNumber)}</strong> • Updated: ${new Date(state.config.policyUpdatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      <h3 style="font-size:1.08rem;font-weight:800;margin:22px 0 12px;">🗂️ My Private Queries (${myQueries.length})</h3>
      ${myQueries.length ? `<div>${queriesHtml}</div>` : `<div class="folder-card">No private queries submitted from your account yet.</div>`}
    `;
  }

  // 5. Master Admin Control Panel (All 6 Sub-Modules)
  function renderAdminPanelHTML() {
    const subTab = state.adminSubTab || 'tests';

    // If Admin is currently reviewing/editing a specific Test's questions (Draft or Published)
    if (state.reviewingTestRef) {
      return renderAdminTestQuestionEditorHTML();
    }

    return `
      <div class="cbt-top-bar" style="margin-bottom:16px;">
        <div>
          <div style="font-size:0.74rem;color:#FBBF24;font-weight:800;">MASTER ADMIN CONTROL PANEL • 100% DYNAMIC</div>
          <h2 style="font-size:1.15rem;font-weight:800;">${escapeHtml(state.config.appTitle)} (${escapeHtml(state.config.appSubtitle)}) Admin</h2>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <span class="badge ${state.config.screenshotProtection ? 'badge-live' : 'badge-free'}">
            Screenshot Lock: ${state.config.screenshotProtection ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      <div class="admin-subnav">
        <button class="btn ${subTab === 'tests' ? 'btn-primary' : 'btn-outline'} btn-sm admin-subtab-btn" data-sub="tests">📚 1. Folders &amp; Tests (Draft/Publish + AI)</button>
        <button class="btn ${subTab === 'payments' ? 'btn-primary' : 'btn-outline'} btn-sm admin-subtab-btn" data-sub="payments">💳 2. UPI QR Upload &amp; Student Validity</button>
        <button class="btn ${subTab === 'branding' ? 'btn-primary' : 'btn-outline'} btn-sm admin-subtab-btn" data-sub="branding">🎨 3. Branding, Security &amp; API Key</button>
        <button class="btn ${subTab === 'stories' ? 'btn-primary' : 'btn-outline'} btn-sm admin-subtab-btn" data-sub="stories">⚡ 4. Current Affairs Stories (24h)</button>
        <button class="btn ${subTab === 'broadcast' ? 'btn-primary' : 'btn-outline'} btn-sm admin-subtab-btn" data-sub="broadcast">📢 5. Broadcast, Upcoming &amp; Queries</button>
        <button class="btn ${subTab === 'analytics' ? 'btn-primary' : 'btn-outline'} btn-sm admin-subtab-btn" data-sub="analytics">📊 6. User Analytics Charts</button>
      </div>

      ${subTab === 'tests' ? renderAdminTestsSubTab() : ''}
      ${subTab === 'payments' ? renderAdminPaymentsSubTab() : ''}
      ${subTab === 'branding' ? renderAdminBrandingSubTab() : ''}
      ${subTab === 'stories' ? renderAdminStoriesSubTab() : ''}
      ${subTab === 'broadcast' ? renderAdminBroadcastSubTab() : ''}
      ${subTab === 'analytics' ? renderAdminAnalyticsSubTab() : ''}
    `;
  }

  // Admin Sub-Tab 1: Exam Folders & 3-Stage Draft-Review-Publish Test Engine (Manual + AI)
  function renderAdminTestsSubTab() {
    const folderOptions = state.folders.map((f) =>
      `<option value="${f.id}">${escapeHtml(f.titleHi)} [${f.status.toUpperCase()}]</option>`
    ).join('');

    const foldersManageHtml = state.folders.map((folder) => {
      const isPub = folder.status === 'published';
      const testsRows = (folder.tests || []).map((test) => {
        const tPub = test.status === 'published';
        return `
          <div style="background:var(--bg-primary);border:1px solid var(--border-color);padding:12px;border-radius:10px;margin-top:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span class="badge ${tPub ? 'badge-free' : 'badge-draft'}">${tPub ? '🟢 PUBLISHED' : '📝 DRAFT'}</span>
                <span class="badge ${test.isPaid ? 'badge-paid' : 'badge-free'}">${test.isPaid ? 'Paid' : 'Free'}</span>
                <strong>${escapeHtml(test.titleHi)}</strong>
              </div>
              <div style="font-size:0.76rem;color:var(--text-secondary);margin-top:3px;">
                ${(test.questions || []).length} Questions • ${test.durationMinutes}m • +${test.marksPerQuestion} / -${test.negativeMarking}
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm review-edit-test-btn" data-folder-id="${folder.id}" data-test-id="${test.id}">
                ✏️ Review / Edit Questions (${(test.questions || []).length})
              </button>
              <button class="btn btn-outline btn-sm toggle-test-paid-btn" data-folder-id="${folder.id}" data-test-id="${test.id}">
                ${test.isPaid ? 'Make Free' : 'Make Paid'}
              </button>
              <button class="btn ${tPub ? 'btn-gold' : 'btn-emerald'} btn-sm toggle-test-publish-btn" data-folder-id="${folder.id}" data-test-id="${test.id}">
                ${tPub ? '↩ Unpublish to Draft' : '🚀 Publish Test'}
              </button>
              <button class="btn btn-danger btn-sm delete-test-btn" data-folder-id="${folder.id}" data-test-id="${test.id}">🗑️</button>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="folder-card" style="margin-bottom:14px;">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span class="badge ${isPub ? 'badge-free' : 'badge-draft'}">${isPub ? '🟢 PUBLISHED FOLDER' : '📝 DRAFT FOLDER'}</span>
                <span class="badge ${folder.isPaid ? 'badge-paid' : 'badge-free'}">${folder.isPaid ? 'Paid ₹' + folder.priceINR : 'Free Folder'}</span>
                <span class="badge badge-outline">Validity: ${folder.validityDays} Days</span>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button class="btn btn-outline btn-sm toggle-folder-paid-btn" data-folder-id="${folder.id}">
                  ${folder.isPaid ? 'Switch to Free' : 'Switch to Paid'}
                </button>
                <button class="btn ${isPub ? 'btn-gold' : 'btn-emerald'} btn-sm toggle-folder-publish-btn" data-folder-id="${folder.id}">
                  ${isPub ? '↩ Unpublish Folder (Back to Draft)' : '🚀 Publish Folder Live'}
                </button>
                <button class="btn btn-danger btn-sm delete-folder-btn" data-folder-id="${folder.id}">🗑️ Delete</button>
              </div>
            </div>
            <h4 style="font-size:1.05rem;font-weight:800;">📁 ${escapeHtml(folder.titleHi)} (${escapeHtml(folder.titleEn)})</h4>
            <div style="margin-top:8px;">
              ${testsRows || '<div style="font-size:0.8rem;color:var(--text-muted);margin-top:6px;">No tests inside this folder yet. Create a Manual or AI test above.</div>'}
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="two-col-grid" style="margin-bottom:20px;">
        <!-- Step 1: Create Exam Folder (Saved as Draft First) -->
        <div class="folder-card">
          <div>
            <span class="badge badge-draft" style="margin-bottom:6px;">STAGE 1: SAVES AS DRAFT FIRST</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">📁 Create Exam-Wise Folder</h3>
            <label style="font-size:0.78rem;font-weight:700;">Folder Name (Hindi)</label>
            <input type="text" id="admFolderHi" class="input-field" placeholder="e.g. सीजीपीएससी प्री 2026 टेस्ट सीरीज" />
            <label style="font-size:0.78rem;font-weight:700;">Folder Name (English)</label>
            <input type="text" id="admFolderEn" class="input-field" placeholder="e.g. CGPSC Pre 2026 Test Series" />
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Type</label>
                <select id="admFolderPaid" class="select-field">
                  <option value="true">Paid</option>
                  <option value="false">Free</option>
                </select>
              </div>
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Price (₹)</label>
                <input type="number" id="admFolderPrice" class="input-field" value="99" />
              </div>
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Validity (Days)</label>
                <input type="number" id="admFolderDays" class="input-field" value="180" />
              </div>
            </div>
            <label style="font-size:0.78rem;font-weight:700;">Folder Description</label>
            <input type="text" id="admFolderDesc" class="input-field" placeholder="Bilingual Test Series description..." />
          </div>
          <button class="btn btn-primary" id="admCreateFolderDraftBtn">📝 Save Folder as Draft</button>
        </div>

        <!-- Step 2: Create Test Inside Folder (Manual or AI with 300,000 ms Timeout -> Opens Draft Review) -->
        <div class="folder-card">
          <div>
            <span class="badge badge-draft" style="margin-bottom:6px;">MANUAL + AI TEST BUILDER (DRAFT REVIEW STAGE)</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">📝 Create Test Inside Exam Folder</h3>
            <label style="font-size:0.78rem;font-weight:700;">Select Parent Exam Folder</label>
            <select id="admTestFolderSelect" class="select-field">
              ${folderOptions || '<option value="">-- Create an Exam Folder First --</option>'}
            </select>
            <label style="font-size:0.78rem;font-weight:700;">Test Title (Hindi / Bilingual)</label>
            <input type="text" id="admTestTitleHi" class="input-field" placeholder="e.g. टेस्ट 01: छत्तीसगढ़ का इतिहास एवं संस्कृति" />
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
              <div>
                <label style="font-size:0.72rem;font-weight:700;">Timer (Min)</label>
                <input type="number" id="admTestTimer" class="input-field" value="60" />
              </div>
              <div>
                <label style="font-size:0.72rem;font-weight:700;">Marks (+)</label>
                <input type="number" step="0.5" id="admTestPos" class="input-field" value="2.0" />
              </div>
              <div>
                <label style="font-size:0.72rem;font-weight:700;">Neg (-)</label>
                <input type="number" step="0.01" id="admTestNeg" class="input-field" value="0.66" />
              </div>
              <div>
                <label style="font-size:0.72rem;font-weight:700;">Access</label>
                <select id="admTestPaid" class="select-field">
                  <option value="true">Paid</option>
                  <option value="false">Free</option>
                </select>
              </div>
            </div>

            <div style="background:var(--bg-elevated);padding:10px;border-radius:10px;margin-bottom:10px;">
              <div style="font-size:0.76rem;font-weight:800;color:var(--brand-blue);margin-bottom:4px;">🤖 AI Generator Settings (Optional • 300,000 ms Timeout)</div>
              <div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;">
                <input type="text" id="admAiTopic" class="input-field" placeholder="Subject/Topic (e.g. CG Panchayati Raj)" style="margin:0;" />
                <input type="number" id="admAiCount" class="input-field" value="5" min="1" max="100" placeholder="Q Count" style="margin:0;" />
              </div>
              <textarea id="admAiPrompt" rows="2" class="textarea-field" placeholder="Custom prompt instructions for Bilingual CGPSC/CGSSB questions..." style="margin-top:6px;margin-bottom:0;"></textarea>
            </div>

            <div id="admAiProgressWrap" style="display:none;background:var(--bg-elevated);padding:12px;border-radius:10px;margin-bottom:10px;">
              <div style="font-size:0.8rem;font-weight:800;color:var(--brand-blue);margin-bottom:6px;">
                ⏳ Generating questions, please wait... (5-Min / 300,000 ms Timeout Active)
              </div>
              <div class="bar-track">
                <div class="bar-fill" id="admAiProgressBar" style="width:15%;background:linear-gradient(90deg,#2563EB,#F59E0B);transition:width 0.3s ease;"></div>
              </div>
            </div>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm" id="admCreateEmptyManualTestBtn" style="flex:1;">✍️ Create Manual Draft &amp; Add Questions</button>
            <button class="btn btn-gold btn-sm" id="admGenerateAiDraftBtn" style="flex:1;">🤖 Generate via AI into Draft Review</button>
          </div>
        </div>
      </div>

      <h3 style="font-size:1.08rem;font-weight:800;margin-bottom:12px;">🗂️ Draft &amp; Published Exam Folders (${state.folders.length})</h3>
      ${foldersManageHtml || '<div class="folder-card">No folders created yet. Use the form above to create your first Exam Folder in Draft mode.</div>'}
    `;
  }

  // Admin Stage 2: Question Review & Manual Question Editor Screen
  function renderAdminTestQuestionEditorHTML() {
    const { folderId, testId } = state.reviewingTestRef;
    const folder = state.folders.find((f) => f.id === folderId);
    const test = folder ? (folder.tests || []).find((t) => t.id === testId) : null;
    if (!folder || !test) {
      state.reviewingTestRef = null;
      return renderAdminPanelHTML();
    }

    const qListHtml = (test.questions || []).map((q, idx) => `
      <div class="folder-card" style="margin-bottom:12px;">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong>Question #${idx + 1}</strong>
            <button class="btn btn-danger btn-sm delete-single-q-btn" data-q-idx="${idx}">🗑️ Delete Question</button>
          </div>
          <label style="font-size:0.75rem;font-weight:700;">Question (Hindi)</label>
          <textarea class="textarea-field edit-q-hi" data-q-idx="${idx}" rows="2">${escapeHtml(q.qHi)}</textarea>
          <label style="font-size:0.75rem;font-weight:700;">Question (English)</label>
          <textarea class="textarea-field edit-q-en" data-q-idx="${idx}" rows="2">${escapeHtml(q.qEn)}</textarea>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${[0, 1, 2, 3].map((optIdx) => `
              <div>
                <label style="font-size:0.72rem;font-weight:700;">Option ${String.fromCharCode(65 + optIdx)} (Hindi / English)</label>
                <input type="text" class="input-field edit-opt-hi" data-q-idx="${idx}" data-opt-idx="${optIdx}" value="${escapeHtml((q.optionsHi || [])[optIdx] || '')}" placeholder="Hindi Option ${String.fromCharCode(65 + optIdx)}" style="margin-bottom:4px;" />
                <input type="text" class="input-field edit-opt-en" data-q-idx="${idx}" data-opt-idx="${optIdx}" value="${escapeHtml((q.optionsEn || [])[optIdx] || '')}" placeholder="English Option ${String.fromCharCode(65 + optIdx)}" />
              </div>
            `).join('')}
          </div>

          <div style="display:grid;grid-template-columns:140px 1fr 1fr;gap:8px;">
            <div>
              <label style="font-size:0.74rem;font-weight:700;">Correct Option</label>
              <select class="select-field edit-q-correct" data-q-idx="${idx}">
                <option value="0" ${Number(q.correctIndex) === 0 ? 'selected' : ''}>Option A</option>
                <option value="1" ${Number(q.correctIndex) === 1 ? 'selected' : ''}>Option B</option>
                <option value="2" ${Number(q.correctIndex) === 2 ? 'selected' : ''}>Option C</option>
                <option value="3" ${Number(q.correctIndex) === 3 ? 'selected' : ''}>Option D</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.74rem;font-weight:700;">Solution (Hindi)</label>
              <input type="text" class="input-field edit-q-exphi" data-q-idx="${idx}" value="${escapeHtml(q.expHi || '')}" />
            </div>
            <div>
              <label style="font-size:0.74rem;font-weight:700;">Solution (English)</label>
              <input type="text" class="input-field edit-q-expen" data-q-idx="${idx}" value="${escapeHtml(q.expEn || '')}" />
            </div>
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div>
        <div class="cbt-top-bar">
          <div>
            <span class="badge ${test.status === 'published' ? 'badge-free' : 'badge-draft'}">
              ${test.status === 'published' ? '🟢 LIVE PUBLISHED TEST' : '📝 STAGE 2: DRAFT REVIEW & QUESTION EDITOR'}
            </span>
            <h2 style="font-size:1.12rem;font-weight:800;margin-top:4px;">${escapeHtml(test.titleHi)}</h2>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm" id="backFromQEditorBtn" style="background:rgba(255,255,255,0.15);color:#FFF;border:none;">⬅ Back to Folders</button>
            <button class="btn btn-primary btn-sm" id="saveAllEditedQuestionsBtn">💾 Save All Edits</button>
            <button class="btn ${test.status === 'published' ? 'btn-gold' : 'btn-emerald'} btn-sm" id="publishReviewedTestBtn">
              ${test.status === 'published' ? '↩ Move Back to Draft' : '🚀 Approve & Publish Test Live'}
            </button>
          </div>
        </div>

        <!-- Add New Question Box -->
        <div class="folder-card" style="margin-bottom:18px;border:2px solid var(--brand-blue);">
          <div>
            <h4 style="font-size:1rem;font-weight:800;margin-bottom:8px;">➕ Add New Bilingual Question to This Test</h4>
            <div class="two-col-grid">
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Question Stem (Hindi)</label>
                <textarea id="newQHi" rows="2" class="textarea-field" placeholder="प्रश्न यहाँ हिंदी में लिखें..."></textarea>
              </div>
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Question Stem (English)</label>
                <textarea id="newQEn" rows="2" class="textarea-field" placeholder="Write question in English..."></textarea>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
              <div>
                <input type="text" id="newOptAHi" class="input-field" placeholder="विकल्प A (Hindi)" style="margin-bottom:4px;" />
                <input type="text" id="newOptAEn" class="input-field" placeholder="Option A (English)" />
              </div>
              <div>
                <input type="text" id="newOptBHi" class="input-field" placeholder="विकल्प B (Hindi)" style="margin-bottom:4px;" />
                <input type="text" id="newOptBEn" class="input-field" placeholder="Option B (English)" />
              </div>
              <div>
                <input type="text" id="newOptCHi" class="input-field" placeholder="विकल्प C (Hindi)" style="margin-bottom:4px;" />
                <input type="text" id="newOptCEn" class="input-field" placeholder="Option C (English)" />
              </div>
              <div>
                <input type="text" id="newOptDHi" class="input-field" placeholder="विकल्प D (Hindi)" style="margin-bottom:4px;" />
                <input type="text" id="newOptDEn" class="input-field" placeholder="Option D (English)" />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:140px 1fr 1fr;gap:8px;">
              <div>
                <label style="font-size:0.74rem;font-weight:700;">Correct Option</label>
                <select id="newQCorrect" class="select-field">
                  <option value="0">Option A</option>
                  <option value="1">Option B</option>
                  <option value="2">Option C</option>
                  <option value="3">Option D</option>
                </select>
              </div>
              <div>
                <label style="font-size:0.74rem;font-weight:700;">Detailed Solution (Hindi)</label>
                <input type="text" id="newQExpHi" class="input-field" placeholder="हिंदी व्याख्या..." />
              </div>
              <div>
                <label style="font-size:0.74rem;font-weight:700;">Detailed Solution (English)</label>
                <input type="text" id="newQExpEn" class="input-field" placeholder="English explanation..." />
              </div>
            </div>
          </div>
          <button class="btn btn-primary btn-sm" id="addSingleQuestionBtn">➕ Add Question to Test</button>
        </div>

        <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:12px;">Questions in "${escapeHtml(test.titleHi)}" (${(test.questions || []).length})</h3>
        ${qListHtml || '<div class="folder-card">No questions added yet. Use the form above to add questions.</div>'}
      </div>
    `;
  }

  // Admin Sub-Tab 2: UPI QR Upload (Gallery + URL) & Strict Activation-Based Validity
  function renderAdminPaymentsSubTab() {
    const paidFolders = state.folders.filter((f) => f.isPaid);
    const folderOpts = (paidFolders.length ? paidFolders : state.folders).map((f) =>
      `<option value="${f.id}" data-days="${f.validityDays}">${escapeHtml(f.titleHi)} (₹${f.priceINR} • ${f.validityDays} Days)</option>`
    ).join('');

    const actRecords = Object.values(state.studentActivations || {}).map((rec) => {
      const nowMs = Date.now();
      const isExp = nowMs > rec.expiresAt;
      const daysLeft = Math.max(0, Math.ceil((rec.expiresAt - nowMs) / 86400000));
      return `
        <div style="background:var(--bg-elevated);padding:10px 12px;border-radius:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;font-size:0.8rem;">
          <div>
            <strong>👤 ${escapeHtml(rec.userKey)}</strong> → Folder: <code>${escapeHtml(rec.folderTitle || rec.folderId)}</code>
            <div style="color:var(--text-secondary);font-size:0.75rem;">
              Activated: ${new Date(rec.activatedAt).toLocaleString()} • Expires: ${new Date(rec.expiresAt).toLocaleString()}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge ${isExp ? 'badge-live' : 'badge-free'}">${isExp ? 'Expired (Auto-Revoked)' : `Active (${daysLeft}d left)`}</span>
            <button class="btn btn-danger btn-sm revoke-student-btn" data-act-key="${escapeHtml(rec.folderId + '__' + rec.userKey)}">Revoke</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="two-col-grid">
        <!-- Admin UPI QR Upload (Gallery File Picker + Image URL) -->
        <div class="folder-card">
          <div>
            <span class="badge badge-paid" style="margin-bottom:6px;">UPI QR UPLOAD (GALLERY + URL)</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">💳 Configure UPI QR &amp; WhatsApp Payment</h3>
            <div class="qr-preview-box">
              <img src="${state.config.upiQrDataUrl || DEFAULT_QR_SVG}" alt="Admin UPI QR" />
            </div>
            <label style="font-size:0.78rem;font-weight:700;">1. Upload QR Image from Gallery / Device (Permanent Storage)</label>
            <input type="file" id="admQrGalleryFileInput" accept="image/*" class="input-field" />
            <label style="font-size:0.78rem;font-weight:700;">2. Or Enter QR Image URL</label>
            <input type="url" id="admQrUrlInput" class="input-field" placeholder="https://example.com/my-upi-qr.png" />
            <label style="font-size:0.78rem;font-weight:700;">Official UPI ID</label>
            <input type="text" id="admUpiIdInput" class="input-field" value="${escapeHtml(state.config.upiId)}" />
            <label style="font-size:0.78rem;font-weight:700;">WhatsApp Payment Support Number (Default: 9238810070)</label>
            <input type="text" id="admWhatsappInput" class="input-field" value="${escapeHtml(state.config.whatsappNumber)}" />
          </div>
          <button class="btn btn-primary" id="admSavePaymentSettingsBtn">💾 Save UPI QR &amp; Payment Config</button>
        </div>

        <!-- Strict Activation-Based Student Validity Unlock -->
        <div class="folder-card">
          <div>
            <span class="badge badge-free" style="margin-bottom:6px;">STRICT ACTIVATION-BASED VALIDITY</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">🔓 Unlock Paid Folder for Student</h3>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:10px;">
              छात्र की वैधता का काउंटडाउन (जैसे 30/90/180/365 दिन) आपके द्वारा यहाँ <strong>Activate Access</strong> पर क्लिक करने के सटीक समय से शुरू होगा।
            </p>
            <label style="font-size:0.78rem;font-weight:700;">Select Paid Folder</label>
            <select id="admGrantFolderSelect" class="select-field">
              ${folderOpts || '<option value="">-- Create a Folder First --</option>'}
            </select>
            <label style="font-size:0.78rem;font-weight:700;">Student Email ID or User ID</label>
            <input type="text" id="admGrantUserKeyInput" class="input-field" value="${escapeHtml(state.currentUser.id)}" placeholder="Enter Student Email or User ID" />
            <label style="font-size:0.78rem;font-weight:700;">Validity Duration (Days from Activation Moment)</label>
            <select id="admGrantValidityDaysSelect" class="select-field">
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="180" selected>180 Days (6 Months)</option>
              <option value="365">365 Days (1 Year)</option>
            </select>
            <button class="btn btn-emerald" id="admActivateStudentBtn" style="width:100%;margin-bottom:14px;">✅ Activate Student Access Starting Now</button>

            <h4 style="font-size:0.88rem;font-weight:800;margin-bottom:8px;">Active &amp; Expired Student Subscriptions:</h4>
            ${actRecords || '<div style="font-size:0.8rem;color:var(--text-muted);">No student activations recorded yet.</div>'}
          </div>
        </div>
      </div>
    `;
  }

  // Admin Sub-Tab 3: Branding, Dynamic Screenshot Protection Switch, Gemini API Key & Policy
  function renderAdminBrandingSubTab() {
    return `
      <div class="two-col-grid">
        <div class="folder-card">
          <div>
            <span class="badge badge-paid" style="margin-bottom:6px;">APP BRANDING &amp; SECURITY SWITCHES</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">🎨 Branding, Logo &amp; Screenshot Lock</h3>
            <label style="font-size:0.78rem;font-weight:700;">App Title</label>
            <input type="text" id="admBrandTitle" class="input-field" value="${escapeHtml(state.config.appTitle)}" />
            <label style="font-size:0.78rem;font-weight:700;">App Subtitle</label>
            <input type="text" id="admBrandSubtitle" class="input-field" value="${escapeHtml(state.config.appSubtitle)}" />
            <label style="font-size:0.78rem;font-weight:700;">Upload App Logo from Gallery</label>
            <input type="file" id="admBrandLogoFile" accept="image/*" class="input-field" />
            <label style="font-size:0.78rem;font-weight:700;">Or App Logo URL</label>
            <input type="url" id="admBrandLogoUrl" class="input-field" value="${escapeHtml(state.config.logoDataUrl.startsWith('http') ? state.config.logoDataUrl : '')}" placeholder="https://..." />

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px;">
              <div style="background:var(--bg-elevated);padding:10px;border-radius:10px;">
                <label style="font-size:0.76rem;font-weight:800;display:block;margin-bottom:4px;">🛡️ Screenshot &amp; Recording Lock</label>
                <select id="admScreenshotToggle" class="select-field" style="margin:0;">
                  <option value="true" ${state.config.screenshotProtection ? 'selected' : ''}>ON (Restricted)</option>
                  <option value="false" ${!state.config.screenshotProtection ? 'selected' : ''}>OFF (Normal Usage)</option>
                </select>
              </div>
              <div style="background:var(--bg-elevated);padding:10px;border-radius:10px;">
                <label style="font-size:0.76rem;font-weight:800;display:block;margin-bottom:4px;">🎵 Anthem Audio Player</label>
                <select id="admAnthemToggle" class="select-field" style="margin:0;">
                  <option value="true" ${state.config.anthemEnabled ? 'selected' : ''}>ON (Visible)</option>
                  <option value="false" ${!state.config.anthemEnabled ? 'selected' : ''}>OFF (Hidden)</option>
                </select>
              </div>
            </div>
          </div>
          <button class="btn btn-primary" id="admSaveBrandingBtn">💾 Save Branding &amp; Security Settings</button>
        </div>

        <div class="folder-card">
          <div>
            <span class="badge badge-free" style="margin-bottom:6px;">GEMINI API KEY &amp; LIVE POLICY</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">🔑 API Quota Manager &amp; Support Policy</h3>
            <div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;">
              <div>
                <label style="font-size:0.76rem;font-weight:700;">Gemini API Key (Fixes Quota Anytime)</label>
                <input type="password" id="admGeminiKeyInput" class="input-field" value="${escapeHtml(state.config.geminiApiKey)}" placeholder="AIzaSy..." />
              </div>
              <div>
                <label style="font-size:0.76rem;font-weight:700;">AI Features</label>
                <select id="admAiToggleSelect" class="select-field">
                  <option value="true" ${state.config.aiEnabled ? 'selected' : ''}>ON</option>
                  <option value="false" ${!state.config.aiEnabled ? 'selected' : ''}>OFF</option>
                </select>
              </div>
            </div>

            <label style="font-size:0.78rem;font-weight:700;">Help &amp; Privacy Policy (Hindi)</label>
            <textarea id="admPolicyHi" rows="3" class="textarea-field">${escapeHtml(state.config.policyBodyHi)}</textarea>
            <label style="font-size:0.78rem;font-weight:700;">Help &amp; Privacy Policy (English)</label>
            <textarea id="admPolicyEn" rows="3" class="textarea-field">${escapeHtml(state.config.policyBodyEn)}</textarea>
          </div>
          <button class="btn btn-emerald" id="admSaveApiAndPolicyBtn">💾 Save API Key &amp; Publish Live Policy</button>
        </div>
      </div>
    `;
  }

  // Admin Sub-Tab 4: Current Affairs Story Creator (With Gallery Upload, Edit/Delete & 24h Expiry)
  function renderAdminStoriesSubTab() {
    const storiesList = (state.stories || []).map((st) => `
      <div style="background:var(--bg-elevated);padding:12px;border-radius:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <strong>${escapeHtml(st.titleHi)}</strong>
          <div style="font-size:0.75rem;color:var(--text-secondary);">${escapeHtml(st.category)} • ${formatStoryTimeRemaining(st.postedAt)}</div>
        </div>
        <button class="btn btn-danger btn-sm delete-story-btn" data-story-id="${st.id}">🗑️ Delete</button>
      </div>
    `).join('');

    return `
      <div class="two-col-grid">
        <div class="folder-card">
          <div>
            <span class="badge badge-paid" style="margin-bottom:6px;">24-HOUR STORY CREATOR (GALLERY UPLOAD)</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">⚡ Post Bilingual Current Affairs Story</h3>
            <label style="font-size:0.78rem;font-weight:700;">Category Tag</label>
            <input type="text" id="admStoryCat" class="input-field" value="CG Current Affairs" />
            <label style="font-size:0.78rem;font-weight:700;">Story Title (Hindi)</label>
            <input type="text" id="admStoryTitleHi" class="input-field" placeholder="हिंदी शीर्षक..." />
            <label style="font-size:0.78rem;font-weight:700;">Story Title (English)</label>
            <input type="text" id="admStoryTitleEn" class="input-field" placeholder="English Headline..." />
            <label style="font-size:0.78rem;font-weight:700;">Details (Hindi)</label>
            <textarea id="admStoryBodyHi" rows="2" class="textarea-field" placeholder="विस्तृत करेंट अफेयर्स बिंदु..."></textarea>
            <label style="font-size:0.78rem;font-weight:700;">Details (English)</label>
            <textarea id="admStoryBodyEn" rows="2" class="textarea-field" placeholder="Detailed current affairs points in English..."></textarea>
            <label style="font-size:0.78rem;font-weight:700;">Upload Story Image from Gallery (<input type="file" id="admStoryImgFile" accept="image/*" />)</label>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
            <button class="btn btn-primary" id="admPublishStoryBtn" style="flex:1;">🚀 Publish 24h Story</button>
            <button class="btn btn-gold btn-sm" id="admSyncStoriesNowBtn">🔄 Auto-Sync Now</button>
          </div>
        </div>

        <div class="folder-card">
          <div>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">Active Stories (${state.stories.length})</h3>
            ${storiesList || '<div style="font-size:0.82rem;color:var(--text-muted);">No stories posted yet.</div>'}
          </div>
        </div>
      </div>
    `;
  }

  // Admin Sub-Tab 5: Broadcast Notifications (Gallery Upload + Pin), Upcoming Tests & Private Queries Inbox
  function renderAdminBroadcastSubTab() {
    const queriesInboxHtml = (state.queries || []).map((q) => `
      <div style="background:var(--bg-elevated);padding:12px;border-radius:10px;margin-bottom:10px;">
        <div style="font-size:0.75rem;font-weight:800;color:var(--brand-blue);">
          🔒 Student: ${escapeHtml(q.studentId)} (${escapeHtml(q.studentEmail)}) • ${escapeHtml(q.subject)}
        </div>
        <div style="font-weight:700;margin:4px 0 8px;">${escapeHtml(q.message)}</div>
        ${q.screenshotDataUrl ? `
          <div style="max-width:200px;border-radius:8px;overflow:hidden;margin-bottom:8px;">
            <img src="${q.screenshotDataUrl}" alt="Student Screenshot" style="width:100%;display:block;" />
          </div>
        ` : ''}
        <div style="display:flex;gap:8px;">
          <input type="text" class="input-field adm-query-reply-input" data-qid="${q.id}" value="${escapeHtml(q.adminReply || '')}" placeholder="Write private reply..." style="margin:0;" />
          <button class="btn btn-emerald btn-sm adm-send-query-reply-btn" data-qid="${q.id}">Reply</button>
        </div>
      </div>
    `).join('');

    return `
      <div class="two-col-grid" style="margin-bottom:18px;">
        <!-- Rich Broadcast Notification Sender -->
        <div class="folder-card">
          <div>
            <span class="badge badge-live" style="margin-bottom:6px;">GALLERY UPLOAD + PIN TO TOP</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">📢 Send Rich Broadcast Notification</h3>
            <label style="font-size:0.78rem;font-weight:700;">Notification Title</label>
            <input type="text" id="admNotifTitle" class="input-field" placeholder="e.g. CGPSC Pre 2026 Test 01 Live Now" />
            <label style="font-size:0.78rem;font-weight:700;">Message Text</label>
            <textarea id="admNotifMessage" rows="2" class="textarea-field" placeholder="Write announcement details..."></textarea>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Attachment Type</label>
                <select id="admNotifMediaType" class="select-field">
                  <option value="none">None (Text Only)</option>
                  <option value="image">Image (Gallery Upload)</option>
                  <option value="pdf">PDF / File</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Pin at Top?</label>
                <select id="admNotifPin" class="select-field">
                  <option value="true">📌 Yes, Pin to Top</option>
                  <option value="false">Normal</option>
                </select>
              </div>
            </div>
            <label style="font-size:0.76rem;font-weight:700;">Upload Attachment from Gallery / Device</label>
            <input type="file" id="admNotifFileInput" class="input-field" />
          </div>
          <button class="btn btn-primary" id="admPostBroadcastBtn">🚀 Publish Broadcast</button>
        </div>

        <!-- Upcoming Test Series Creator -->
        <div class="folder-card">
          <div>
            <span class="badge badge-paid" style="margin-bottom:6px;">UPCOMING SCHEDULE &amp; BANNER</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">🚀 Post Upcoming Test Series</h3>
            <label style="font-size:0.78rem;font-weight:700;">Test Series Title</label>
            <input type="text" id="admUpTitle" class="input-field" placeholder="e.g. CGPSC Prelims 2026 Mega Series" />
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Start Date</label>
                <input type="text" id="admUpDate" class="input-field" placeholder="e.g. 14 June 2026" />
              </div>
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Price / Tag</label>
                <input type="text" id="admUpPrice" class="input-field" placeholder="e.g. ₹99" />
              </div>
            </div>
            <label style="font-size:0.78rem;font-weight:700;">Schedule &amp; Syllabus Details</label>
            <textarea id="admUpDetails" rows="2" class="textarea-field" placeholder="31 Bilingual Tests schedule..."></textarea>
            <label style="font-size:0.76rem;font-weight:700;">Upload Banner Image from Gallery</label>
            <input type="file" id="admUpBannerFile" accept="image/*" class="input-field" />
          </div>
          <button class="btn btn-gold" id="admPostUpcomingBtn">📅 Post Upcoming Test Series</button>
        </div>
      </div>

      <div class="folder-card">
        <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">💬 Private Student Queries Inbox (${(state.queries || []).length})</h3>
        ${queriesInboxHtml || '<div style="font-size:0.84rem;color:var(--text-muted);">No student queries received yet.</div>'}
      </div>
    `;
  }

  // Admin Sub-Tab 6: Visual Analytics Charts
  function renderAdminAnalyticsSubTab() {
    const records = Object.values(state.studentActivations || {});
    const nowMs = Date.now();
    const activeSubs = records.filter((r) => nowMs <= r.expiresAt).length;
    const expiredSubs = records.filter((r) => nowMs > r.expiresAt).length;
    const paidUsers = records.length;
    const freeUsers = Math.max(1, Number(state.analyticsBase.registeredFreeUsers || 0) + 1);
    const totalUsers = paidUsers + freeUsers;
    const paidPct = Math.round((paidUsers / Math.max(1, totalUsers)) * 100);
    const activePct = paidUsers > 0 ? Math.round((activeSubs / paidUsers) * 100) : 0;

    return `
      <div class="admin-stats-grid">
        <div class="stat-card">
          <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:700;">Total Users</div>
          <div class="stat-value">${totalUsers}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:700;">Paid Users vs Free</div>
          <div class="stat-value" style="color:#D97706;">${paidUsers} / ${freeUsers}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:700;">Active Subscriptions</div>
          <div class="stat-value" style="color:#059669;">${activeSubs}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:700;">Expired Accounts</div>
          <div class="stat-value" style="color:#DC2626;">${expiredSubs}</div>
        </div>
      </div>

      <div class="folder-card">
        <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:10px;">📊 Visual Analytics Breakdown</h3>
        <div class="bar-chart-row">
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:700;">
            <span>Paid Users (${paidUsers}) vs Free Users (${freeUsers})</span>
            <span>${paidPct}% Paid</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${paidPct}%;background:linear-gradient(90deg,#F59E0B,#D97706);"></div>
          </div>
        </div>
        <div class="bar-chart-row">
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:700;">
            <span>Active Subscriptions (${activeSubs}) vs Expired Accounts (${expiredSubs})</span>
            <span>${activePct}% Active</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${activePct}%;background:linear-gradient(90deg,#059669,#10B981);"></div>
          </div>
        </div>
      </div>
    `;
  }

  // Student Profile / Account Modal
  function openStudentProfileModal() {
    const modal = document.getElementById('genericModalContainer');
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:460px;">
          <h3 style="font-size:1.12rem;font-weight:800;margin-bottom:8px;">👤 Student Profile &amp; Account ID</h3>
          <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">
            अपना नाम, Email ID और User ID यहाँ दर्ज करें। पेड टेस्ट सीरीज एक्टिवेशन और प्राइवेट क्वेरी इसी ID से जुड़ती हैं।
          </p>
          <label style="font-size:0.78rem;font-weight:700;">Full Name</label>
          <input type="text" id="profNameInput" class="input-field" value="${escapeHtml(state.currentUser.name)}" />
          <label style="font-size:0.78rem;font-weight:700;">Registered Email ID</label>
          <input type="email" id="profEmailInput" class="input-field" value="${escapeHtml(state.currentUser.email)}" />
          <label style="font-size:0.78rem;font-weight:700;">User ID</label>
          <input type="text" id="profIdInput" class="input-field" value="${escapeHtml(state.currentUser.id)}" />
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
            <button class="btn btn-outline btn-sm" id="closeProfModalBtn">Cancel</button>
            <button class="btn btn-primary btn-sm" id="saveProfModalBtn">Save Profile</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('closeProfModalBtn').onclick = () => { modal.innerHTML = ''; };
    document.getElementById('saveProfModalBtn').onclick = () => {
      const name = document.getElementById('profNameInput').value.trim() || 'Student';
      const email = document.getElementById('profEmailInput').value.trim() || 'student@cgpedia.in';
      const id = document.getElementById('profIdInput').value.trim() || 'STU-1001';
      state.currentUser = {
        id,
        name,
        email,
        isAdmin: email.toLowerCase() === ADMIN_EMAIL
      };
      saveState();
      modal.innerHTML = '';
      renderApp();
      showToast(`✅ Profile Updated: ${name} (${id})`);
    };
  }

  // Apply Dynamic Branding & Dynamic Screenshot Restriction Toggle
  function applyDynamicConfigToDOM() {
    document.documentElement.setAttribute('data-theme', state.theme || 'light');

    // Screenshot Restriction Master Switch
    if (state.config.screenshotProtection) {
      document.body.classList.add('screenshot-restricted');
    } else {
      document.body.classList.remove('screenshot-restricted');
      document.body.classList.remove('window-blurred');
    }

    // Dynamic Branding
    const titleEl = document.getElementById('headerBrandTitle');
    const subEl = document.getElementById('headerBrandSubtitle');
    const logoBox = document.getElementById('headerBrandLogo');
    const anthemBtn = document.getElementById('anthemToggleBtn');

    if (titleEl) titleEl.textContent = state.config.appTitle || 'CGpedia';
    if (subEl) subEl.textContent = state.config.appSubtitle || 'CGPSC & CGSSB';
    if (logoBox) {
      if (state.config.logoDataUrl) {
        logoBox.innerHTML = `<img src="${state.config.logoDataUrl}" alt="Logo" />`;
      } else {
        logoBox.textContent = (state.config.appTitle || 'CG').slice(0, 2).toUpperCase();
      }
    }
    if (anthemBtn) {
      anthemBtn.style.display = state.config.anthemEnabled ? 'inline-flex' : 'none';
    }

    const userLabel = document.getElementById('activeUserLabel');
    if (userLabel) {
      userLabel.textContent = `${state.currentUser.name} (${state.currentUser.id})`;
    }

    const notifBadge = document.getElementById('notifBadgeCount');
    if (notifBadge) {
      const count = (state.notifications || []).length;
      notifBadge.style.display = count > 0 ? 'inline-flex' : 'none';
      notifBadge.textContent = String(count);
    }

    document.querySelectorAll('.nav-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === state.activeTab && !activeExamSession);
    });
  }

  // Master Render
  function renderApp() {
    applyDynamicConfigToDOM();
    const root = document.getElementById('appRoot');
    if (!root) return;

    if (activeExamSession) {
      root.innerHTML = renderExamSessionHTML();
      bindExamSessionEvents();
      return;
    }

    if (state.activeTab === 'dashboard') {
      root.innerHTML = renderStudentDashboardHTML();
    } else if (state.activeTab === 'current-affairs') {
      root.innerHTML = renderCurrentAffairsTabHTML();
    } else if (state.activeTab === 'notifications') {
      root.innerHTML = renderNotificationsTabHTML();
    } else if (state.activeTab === 'support') {
      root.innerHTML = renderSupportTabHTML();
    } else if (state.activeTab === 'admin') {
      root.innerHTML = renderAdminPanelHTML();
    }

    bindMainViewEvents();
  }

  function bindExamSessionEvents() {
    const exitBtn = document.getElementById('exitExamRoomBtn');
    if (exitBtn) {
      exitBtn.onclick = () => {
        if (activeExamSession && activeExamSession.timerId) {
          clearInterval(activeExamSession.timerId);
        }
        activeExamSession = null;
        renderApp();
      };
    }

    if (!activeExamSession || activeExamSession.submitted) return;

    const submitTopRight = document.getElementById('topRightFinalSubmitBtn');
    if (submitTopRight) submitTopRight.onclick = openFinalSubmitConfirmPopup;

    document.querySelectorAll('.option-item').forEach((btn) => {
      btn.onclick = () => {
        activeExamSession.answers[activeExamSession.currentIndex] = Number(btn.dataset.optIdx);
        renderApp();
      };
    });

    const prevBtn = document.getElementById('cbtPrevBtn');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (activeExamSession.currentIndex > 0) {
          activeExamSession.currentIndex -= 1;
          activeExamSession.visited[activeExamSession.currentIndex] = true;
          renderApp();
        }
      };
    }

    const nextBtn = document.getElementById('cbtNextBtn');
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (activeExamSession.currentIndex < activeExamSession.test.questions.length - 1) {
          activeExamSession.currentIndex += 1;
          activeExamSession.visited[activeExamSession.currentIndex] = true;
          renderApp();
        }
      };
    }

    const clearBtn = document.getElementById('cbtClearBtn');
    if (clearBtn) {
      clearBtn.onclick = () => {
        delete activeExamSession.answers[activeExamSession.currentIndex];
        renderApp();
      };
    }

    const revBtn = document.getElementById('cbtReviewBtn');
    if (revBtn) {
      revBtn.onclick = () => {
        const idx = activeExamSession.currentIndex;
        activeExamSession.review[idx] = !activeExamSession.review[idx];
        renderApp();
      };
    }

    document.querySelectorAll('.palette-btn').forEach((btn) => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.paletteIdx);
        activeExamSession.currentIndex = idx;
        activeExamSession.visited[idx] = true;
        renderApp();
      };
    });
  }

  function bindMainViewEvents() {
    // Empty State -> Go to Admin Panel
    const emptyGoAdmin = document.getElementById('emptyStateGoAdminBtn');
    if (emptyGoAdmin) {
      emptyGoAdmin.onclick = () => {
        state.activeTab = 'admin';
        saveState();
        renderApp();
      };
    }

    // Stories
    document.querySelectorAll('.story-bubble, .story-card-open-btn').forEach((el) => {
      el.onclick = () => openStoryViewer(Number(el.dataset.storyIdx || 0));
    });

    const topQuizBtn = document.getElementById('topBarQuizBtn');
    if (topQuizBtn) topQuizBtn.onclick = launchCurrentAffairsQuiz;
    const caTabQuizBtn = document.getElementById('caTabTopRightQuizBtn');
    if (caTabQuizBtn) caTabQuizBtn.onclick = launchCurrentAffairsQuiz;

    // Student Folder Navigation & Payment Modal
    document.querySelectorAll('.open-exam-folder-btn').forEach((btn) => {
      btn.onclick = () => {
        state.selectedFolderId = btn.dataset.folderId;
        renderApp();
      };
    });

    const backFoldersBtn = document.getElementById('backToMainFoldersBtn');
    if (backFoldersBtn) {
      backFoldersBtn.onclick = () => {
        state.selectedFolderId = null;
        renderApp();
      };
    }

    document.querySelectorAll('.trigger-pay-modal-btn').forEach((btn) => {
      btn.onclick = () => {
        const folder = state.folders.find((f) => f.id === btn.dataset.folderId);
        if (folder) openStudentPaymentModal(folder);
      };
    });

    document.querySelectorAll('.launch-test-btn').forEach((btn) => {
      btn.onclick = () => {
        const folder = state.folders.find((f) => f.id === btn.dataset.folderId);
        const test = folder ? (folder.tests || []).find((t) => t.id === btn.dataset.testId) : null;
        if (test) startExamSession(test);
      };
    });

    // Private Student Query Submit (With Optional Gallery Screenshot)
    const sendQueryBtn = document.getElementById('sendPrivateQueryBtn');
    if (sendQueryBtn) {
      sendQueryBtn.onclick = async () => {
        const subject = document.getElementById('studentQuerySubject').value.trim() || 'General Query';
        const message = document.getElementById('studentQueryMessage').value.trim();
        const fileInput = document.getElementById('studentQueryFile');
        if (!message) {
          showToast('कृपया अपना प्रश्न या समस्या लिखें।');
          return;
        }
        let screenshotDataUrl = '';
        if (fileInput && fileInput.files && fileInput.files[0]) {
          screenshotDataUrl = await readFileAsDataURL(fileInput.files[0]);
        }
        state.queries.unshift({
          id: 'q-' + Date.now(),
          studentId: state.currentUser.id,
          studentEmail: state.currentUser.email,
          subject,
          message,
          screenshotDataUrl,
          adminReply: '',
          createdAt: Date.now()
        });
        saveState();
        renderApp();
        showToast('🔒 Private Query Submitted to Admin!');
      };
    }

    // Admin Sub-navigation
    document.querySelectorAll('.admin-subtab-btn').forEach((btn) => {
      btn.onclick = () => {
        state.adminSubTab = btn.dataset.sub;
        state.reviewingTestRef = null;
        saveState();
        renderApp();
      };
    });

    bindAdminActions();
  }

  function bindAdminActions() {
    // 1. Create Exam Folder in Draft Mode
    const createFolderBtn = document.getElementById('admCreateFolderDraftBtn');
    if (createFolderBtn) {
      createFolderBtn.onclick = () => {
        const titleHi = document.getElementById('admFolderHi').value.trim();
        const titleEn = document.getElementById('admFolderEn').value.trim() || titleHi;
        const isPaid = document.getElementById('admFolderPaid').value === 'true';
        const priceINR = Number(document.getElementById('admFolderPrice').value || 99);
        const validityDays = Number(document.getElementById('admFolderDays').value || 180);
        const description = document.getElementById('admFolderDesc').value.trim();
        if (!titleHi) {
          showToast('Please enter a Folder Name.');
          return;
        }
        state.folders.unshift({
          id: 'folder-' + Date.now(),
          titleHi,
          titleEn,
          isPaid,
          priceINR: isPaid ? priceINR : 0,
          validityDays,
          description,
          status: 'draft', // Strictly Draft first!
          tests: []
        });
        saveState();
        renderApp();
        showToast('📝 Exam Folder Created in Draft Mode. Click Publish when ready!');
      };
    }

    // Publish / Unpublish Folder
    document.querySelectorAll('.toggle-folder-publish-btn').forEach((btn) => {
      btn.onclick = () => {
        const folder = state.folders.find((f) => f.id === btn.dataset.folderId);
        if (!folder) return;
        folder.status = folder.status === 'published' ? 'draft' : 'published';
        saveState();
        renderApp();
        showToast(folder.status === 'published' ? '🚀 Folder Published Live for Students!' : '↩ Folder Reverted to Draft.');
      };
    });

    document.querySelectorAll('.toggle-folder-paid-btn').forEach((btn) => {
      btn.onclick = () => {
        const folder = state.folders.find((f) => f.id === btn.dataset.folderId);
        if (!folder) return;
        folder.isPaid = !folder.isPaid;
        if (folder.isPaid && !folder.priceINR) folder.priceINR = 99;
        saveState();
        renderApp();
      };
    });

    document.querySelectorAll('.delete-folder-btn').forEach((btn) => {
      btn.onclick = () => {
        state.folders = state.folders.filter((f) => f.id !== btn.dataset.folderId);
        saveState();
        renderApp();
        showToast('🗑️ Folder Deleted');
      };
    });

    // Create Manual Draft Test & Open Question Editor
    const createManualTestBtn = document.getElementById('admCreateEmptyManualTestBtn');
    if (createManualTestBtn) {
      createManualTestBtn.onclick = () => {
        const folderId = document.getElementById('admTestFolderSelect').value;
        const folder = state.folders.find((f) => f.id === folderId);
        if (!folder) {
          showToast('Please create and select a Parent Exam Folder first.');
          return;
        }
        const titleHi = document.getElementById('admTestTitleHi').value.trim() || 'New Bilingual Test';
        const durationMinutes = Number(document.getElementById('admTestTimer').value || 60);
        const marksPerQuestion = Number(document.getElementById('admTestPos').value || 2.0);
        const negativeMarking = Number(document.getElementById('admTestNeg').value || 0.66);
        const isPaid = document.getElementById('admTestPaid').value === 'true';

        const newTest = {
          id: 'test-' + Date.now(),
          titleHi,
          titleEn: titleHi,
          durationMinutes,
          marksPerQuestion,
          negativeMarking,
          isPaid,
          status: 'draft', // Strictly Draft first
          questions: []
        };
        folder.tests.unshift(newTest);
        state.reviewingTestRef = { folderId: folder.id, testId: newTest.id };
        saveState();
        renderApp();
        showToast('📝 Draft Test Created. Add & Review Questions before publishing!');
      };
    }

    // AI Test Generator with 300,000 ms (5-Minute) Timeout -> Opens Draft Review Mode
    const genAiTestBtn = document.getElementById('admGenerateAiDraftBtn');
    if (genAiTestBtn) {
      genAiTestBtn.onclick = async () => {
        const folderId = document.getElementById('admTestFolderSelect').value;
        const folder = state.folders.find((f) => f.id === folderId);
        if (!folder) {
          showToast('Please create and select a Parent Exam Folder first.');
          return;
        }
        const titleHi = document.getElementById('admTestTitleHi').value.trim() || 'AI Bilingual Test (CGPSC & CGSSB)';
        const durationMinutes = Number(document.getElementById('admTestTimer').value || 60);
        const marksPerQuestion = Number(document.getElementById('admTestPos').value || 2.0);
        const negativeMarking = Number(document.getElementById('admTestNeg').value || 0.66);
        const isPaid = document.getElementById('admTestPaid').value === 'true';
        const topic = document.getElementById('admAiTopic').value.trim() || 'Chhattisgarh General Studies';
        const qCount = Math.max(1, Math.min(50, Number(document.getElementById('admAiCount').value || 5)));
        const customPrompt = document.getElementById('admAiPrompt').value.trim();

        const progWrap = document.getElementById('admAiProgressWrap');
        const progBar = document.getElementById('admAiProgressBar');
        if (progWrap) progWrap.style.display = 'block';
        let pct = 15;
        const progInterval = setInterval(() => {
          pct = Math.min(92, pct + 12);
          if (progBar) progBar.style.width = `${pct}%`;
        }, 400);

        let generatedQuestions = [];
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

        try {
          if (state.config.aiEnabled && state.config.geminiApiKey) {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(state.config.geminiApiKey)}`;
            const sysPrompt =
              `Generate ${qCount} Bilingual (Hindi & English) multiple-choice questions for CGPSC/CGSSB on topic "${topic}". ${customPrompt}\n` +
              `Return ONLY a JSON array where each object has: {"qHi":"...","qEn":"...","optionsHi":["A","B","C","D"],"optionsEn":["A","B","C","D"],"correctIndex":0,"expHi":"...","expEn":"..."}`;
            const res = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: sysPrompt }] }] }),
              signal: controller.signal
            });
            if (res.ok) {
              const data = await res.json();
              const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              const arrMatch = text.match(/\[[\s\S]*\]/);
              if (arrMatch) {
                generatedQuestions = JSON.parse(arrMatch[0]);
              }
            }
          }
        } catch (_) {
          // Fallback to structured topic generator if API key not entered or quota hit
        } finally {
          clearTimeout(timeoutId);
          clearInterval(progInterval);
        }

        if (!Array.isArray(generatedQuestions) || !generatedQuestions.length) {
          generatedQuestions = Array.from({ length: qCount }, (_, i) => ({
            id: 'aiq-' + Date.now() + '-' + i,
            qHi: `[${topic}] प्रश्न ${i + 1}: छत्तीसगढ़ एवं सामान्य अध्ययन के संदर्भ में निम्नलिखित में से कौन-सा कथन सत्य है? ${customPrompt ? '(' + customPrompt + ')' : ''}`,
            qEn: `[${topic}] Q${i + 1}: Which of the following statements is accurate regarding ${topic}?`,
            optionsHi: [`${topic} — प्रथम प्रामाणिक विकल्प`, 'द्वितीय विकल्प', 'तृतीय विकल्प', 'उपर्युक्त में से कोई नहीं'],
            optionsEn: [`${topic} — Primary verified statement`, 'Option B', 'Option C', 'None of the above'],
            correctIndex: 0,
            expHi: `यह प्रश्न "${topic}" के आधिकारिक पाठ्यक्रम पर आधारित है। एडमिन इसे पब्लिश करने से पहले संपादित कर सकते हैं।`,
            expEn: `Generated for "${topic}". Admin can review and edit this question in Draft mode before publishing.`
          }));
        }

        const newTest = {
          id: 'test-ai-' + Date.now(),
          titleHi,
          titleEn: titleHi,
          durationMinutes,
          marksPerQuestion,
          negativeMarking,
          isPaid,
          status: 'draft', // Saved as Draft for Admin Review!
          questions: generatedQuestions
        };
        folder.tests.unshift(newTest);
        state.reviewingTestRef = { folderId: folder.id, testId: newTest.id };
        saveState();
        renderApp();
        showToast(`🤖 Generated ${generatedQuestions.length} Questions in Draft Review Mode!`);
      };
    }

    // Test-level actions inside folder list
    document.querySelectorAll('.review-edit-test-btn').forEach((btn) => {
      btn.onclick = () => {
        state.reviewingTestRef = { folderId: btn.dataset.folderId, testId: btn.dataset.testId };
        renderApp();
      };
    });

    document.querySelectorAll('.toggle-test-publish-btn').forEach((btn) => {
      btn.onclick = () => {
        const folder = state.folders.find((f) => f.id === btn.dataset.folderId);
        const test = folder ? (folder.tests || []).find((t) => t.id === btn.dataset.testId) : null;
        if (!test) return;
        test.status = test.status === 'published' ? 'draft' : 'published';
        saveState();
        renderApp();
        showToast(test.status === 'published' ? '🚀 Test Published Live!' : '↩ Test Un-published to Draft.');
      };
    });

    document.querySelectorAll('.toggle-test-paid-btn').forEach((btn) => {
      btn.onclick = () => {
        const folder = state.folders.find((f) => f.id === btn.dataset.folderId);
        const test = folder ? (folder.tests || []).find((t) => t.id === btn.dataset.testId) : null;
        if (!test) return;
        test.isPaid = !test.isPaid;
        saveState();
        renderApp();
      };
    });

    document.querySelectorAll('.delete-test-btn').forEach((btn) => {
      btn.onclick = () => {
        const folder = state.folders.find((f) => f.id === btn.dataset.folderId);
        if (!folder) return;
        folder.tests = (folder.tests || []).filter((t) => t.id !== btn.dataset.testId);
        saveState();
        renderApp();
        showToast('🗑️ Test Deleted');
      };
    });

    // Question Review & Editor Screen Bindings
    const backFromQEditor = document.getElementById('backFromQEditorBtn');
    if (backFromQEditor) {
      backFromQEditor.onclick = () => {
        state.reviewingTestRef = null;
        renderApp();
      };
    }

    const addSingleQBtn = document.getElementById('addSingleQuestionBtn');
    if (addSingleQBtn && state.reviewingTestRef) {
      addSingleQBtn.onclick = () => {
        const { folderId, testId } = state.reviewingTestRef;
        const folder = state.folders.find((f) => f.id === folderId);
        const test = folder ? (folder.tests || []).find((t) => t.id === testId) : null;
        if (!test) return;
        const qHi = document.getElementById('newQHi').value.trim();
        const qEn = document.getElementById('newQEn').value.trim() || qHi;
        if (!qHi) {
          showToast('Please enter the question text.');
          return;
        }
        const optionsHi = [
          document.getElementById('newOptAHi').value.trim() || 'विकल्प A',
          document.getElementById('newOptBHi').value.trim() || 'विकल्प B',
          document.getElementById('newOptCHi').value.trim() || 'विकल्प C',
          document.getElementById('newOptDHi').value.trim() || 'विकल्प D'
        ];
        const optionsEn = [
          document.getElementById('newOptAEn').value.trim() || optionsHi[0],
          document.getElementById('newOptBEn').value.trim() || optionsHi[1],
          document.getElementById('newOptCEn').value.trim() || optionsHi[2],
          document.getElementById('newOptDEn').value.trim() || optionsHi[3]
        ];
        const correctIndex = Number(document.getElementById('newQCorrect').value || 0);
        const expHi = document.getElementById('newQExpHi').value.trim();
        const expEn = document.getElementById('newQExpEn').value.trim() || expHi;

        test.questions.push({
          id: 'q-' + Date.now(),
          qHi,
          qEn,
          optionsHi,
          optionsEn,
          correctIndex,
          expHi,
          expEn
        });
        saveState();
        renderApp();
        showToast('✅ Question Added to Test');
      };
    }

    const saveAllEditedBtn = document.getElementById('saveAllEditedQuestionsBtn');
    if (saveAllEditedBtn && state.reviewingTestRef) {
      saveAllEditedBtn.onclick = () => {
        saveQuestionEditsFromDOM();
        showToast('💾 All Question Edits Saved!');
      };
    }

    const publishReviewedBtn = document.getElementById('publishReviewedTestBtn');
    if (publishReviewedBtn && state.reviewingTestRef) {
      publishReviewedBtn.onclick = () => {
        saveQuestionEditsFromDOM();
        const { folderId, testId } = state.reviewingTestRef;
        const folder = state.folders.find((f) => f.id === folderId);
        const test = folder ? (folder.tests || []).find((t) => t.id === testId) : null;
        if (!test) return;
        test.status = test.status === 'published' ? 'draft' : 'published';
        if (test.status === 'published') {
          folder.status = 'published'; // Also ensure parent folder is published so students see it
        }
        saveState();
        renderApp();
        showToast(test.status === 'published' ? '🚀 Test & Parent Folder Published Live for Students!' : '↩ Moved Back to Draft.');
      };
    }

    document.querySelectorAll('.delete-single-q-btn').forEach((btn) => {
      btn.onclick = () => {
        if (!state.reviewingTestRef) return;
        const { folderId, testId } = state.reviewingTestRef;
        const folder = state.folders.find((f) => f.id === folderId);
        const test = folder ? (folder.tests || []).find((t) => t.id === testId) : null;
        if (!test) return;
        test.questions.splice(Number(btn.dataset.qIdx), 1);
        saveState();
        renderApp();
      };
    });

    // 2. Payment Settings & UPI QR Upload from Gallery
    const savePayBtn = document.getElementById('admSavePaymentSettingsBtn');
    if (savePayBtn) {
      savePayBtn.onclick = async () => {
        const fileInput = document.getElementById('admQrGalleryFileInput');
        const urlInput = document.getElementById('admQrUrlInput').value.trim();
        if (fileInput && fileInput.files && fileInput.files[0]) {
          state.config.upiQrDataUrl = await readFileAsDataURL(fileInput.files[0], 600);
        } else if (urlInput) {
          state.config.upiQrDataUrl = urlInput;
        }
        state.config.upiId = document.getElementById('admUpiIdInput').value.trim() || '9238810070@upi';
        state.config.whatsappNumber = document.getElementById('admWhatsappInput').value.trim() || '9238810070';
        saveState();
        renderApp();
        showToast('✅ UPI QR Code & WhatsApp Payment Settings Saved!');
      };
    }

    // Activate Student Access (Strict Activation-Based Validity)
    const activateStuBtn = document.getElementById('admActivateStudentBtn');
    if (activateStuBtn) {
      activateStuBtn.onclick = () => {
        const folderId = document.getElementById('admGrantFolderSelect').value;
        const folder = state.folders.find((f) => f.id === folderId);
        const userKey = document.getElementById('admGrantUserKeyInput').value.trim().toLowerCase();
        const validityDays = Number(document.getElementById('admGrantValidityDaysSelect').value || 180);
        if (!folderId || !userKey) {
          showToast('Please select a Folder and enter Student Email or User ID.');
          return;
        }
        const exactNow = Date.now();
        state.studentActivations[`${folderId}__${userKey}`] = {
          folderId,
          folderTitle: folder ? folder.titleHi : folderId,
          userKey,
          validityDays,
          activatedAt: exactNow,
          expiresAt: exactNow + validityDays * 86400000
        };
        saveState();
        renderApp();
        showToast(`🔓 Activated ${validityDays}-Day Access for "${userKey}" starting from this exact moment!`);
      };
    }

    document.querySelectorAll('.revoke-student-btn').forEach((btn) => {
      btn.onclick = () => {
        delete state.studentActivations[btn.dataset.actKey];
        saveState();
        renderApp();
        showToast('🔒 Student Access Revoked');
      };
    });

    // 3. Branding, Screenshot Lock Toggle & API Key
    const saveBrandBtn = document.getElementById('admSaveBrandingBtn');
    if (saveBrandBtn) {
      saveBrandBtn.onclick = async () => {
        state.config.appTitle = document.getElementById('admBrandTitle').value.trim() || 'CGpedia';
        state.config.appSubtitle = document.getElementById('admBrandSubtitle').value.trim() || 'CGPSC & CGSSB';
        state.config.screenshotProtection = document.getElementById('admScreenshotToggle').value === 'true';
        state.config.anthemEnabled = document.getElementById('admAnthemToggle').value === 'true';
        const logoFile = document.getElementById('admBrandLogoFile');
        const logoUrl = document.getElementById('admBrandLogoUrl').value.trim();
        if (logoFile && logoFile.files && logoFile.files[0]) {
          state.config.logoDataUrl = await readFileAsDataURL(logoFile.files[0], 300);
        } else if (logoUrl) {
          state.config.logoDataUrl = logoUrl;
        }
        saveState();
        renderApp();
        showToast('✅ Branding & Screenshot Protection Updated Live!');
      };
    }

    const saveApiPolicyBtn = document.getElementById('admSaveApiAndPolicyBtn');
    if (saveApiPolicyBtn) {
      saveApiPolicyBtn.onclick = () => {
        state.config.geminiApiKey = document.getElementById('admGeminiKeyInput').value.trim();
        state.config.aiEnabled = document.getElementById('admAiToggleSelect').value === 'true';
        state.config.policyBodyHi = document.getElementById('admPolicyHi').value.trim();
        state.config.policyBodyEn = document.getElementById('admPolicyEn').value.trim();
        state.config.policyUpdatedAt = Date.now();
        saveState();
        renderApp();
        showToast('✅ Gemini API Key & Live Support Policy Published!');
      };
    }

    // 4. Current Affairs Story Creator (With Gallery Upload)
    const pubStoryBtn = document.getElementById('admPublishStoryBtn');
    if (pubStoryBtn) {
      pubStoryBtn.onclick = async () => {
        const category = document.getElementById('admStoryCat').value.trim() || 'Current Affairs';
        const titleHi = document.getElementById('admStoryTitleHi').value.trim();
        const titleEn = document.getElementById('admStoryTitleEn').value.trim() || titleHi;
        const bodyHi = document.getElementById('admStoryBodyHi').value.trim();
        const bodyEn = document.getElementById('admStoryBodyEn').value.trim() || bodyHi;
        const imgFile = document.getElementById('admStoryImgFile');
        if (!titleHi || !bodyHi) {
          showToast('Please enter Story Title and Details.');
          return;
        }
        let imageUrl = '';
        if (imgFile && imgFile.files && imgFile.files[0]) {
          imageUrl = await readFileAsDataURL(imgFile.files[0], 800);
        }
        state.stories.unshift({
          id: 'st-' + Date.now(),
          category,
          imageUrl,
          titleHi,
          titleEn,
          bodyHi,
          bodyEn,
          postedAt: Date.now(),
          seen: false
        });
        saveState();
        renderApp();
        showToast('⚡ 24-Hour Current Affairs Story Published!');
      };
    }

    const syncNowBtn = document.getElementById('admSyncStoriesNowBtn');
    if (syncNowBtn) {
      syncNowBtn.onclick = async () => {
        await runSilentCurrentAffairsSync();
        showToast('🔄 Current Affairs Sync Triggered!');
      };
    }

    document.querySelectorAll('.delete-story-btn').forEach((btn) => {
      btn.onclick = () => {
        state.stories = state.stories.filter((s) => s.id !== btn.dataset.storyId);
        saveState();
        renderApp();
      };
    });

    // 5. Broadcast Notifications, Upcoming Tests & Private Queries Reply
    const postBroadcastBtn = document.getElementById('admPostBroadcastBtn');
    if (postBroadcastBtn) {
      postBroadcastBtn.onclick = async () => {
        const title = document.getElementById('admNotifTitle').value.trim();
        const message = document.getElementById('admNotifMessage').value.trim();
        const mediaType = document.getElementById('admNotifMediaType').value;
        const pinned = document.getElementById('admNotifPin').value === 'true';
        const fileIn = document.getElementById('admNotifFileInput');
        if (!title || !message) {
          showToast('Please enter Notification Title and Message.');
          return;
        }
        let mediaDataUrl = '';
        let mediaName = '';
        if (fileIn && fileIn.files && fileIn.files[0]) {
          mediaName = fileIn.files[0].name;
          mediaDataUrl = await readFileAsDataURL(fileIn.files[0], 900);
        }
        state.notifications.unshift({
          id: 'notif-' + Date.now(),
          title,
          message,
          mediaType,
          mediaDataUrl,
          mediaName,
          pinned,
          createdAt: Date.now()
        });
        saveState();
        renderApp();
        showToast('📢 Broadcast Notification Published!');
      };
    }

    const postUpcomingBtn = document.getElementById('admPostUpcomingBtn');
    if (postUpcomingBtn) {
      postUpcomingBtn.onclick = async () => {
        const title = document.getElementById('admUpTitle').value.trim();
        const startDate = document.getElementById('admUpDate').value.trim() || 'Upcoming';
        const priceLabel = document.getElementById('admUpPrice').value.trim() || '₹99';
        const scheduleDetails = document.getElementById('admUpDetails').value.trim();
        const bannerIn = document.getElementById('admUpBannerFile');
        if (!title) {
          showToast('Please enter Upcoming Test Series Title.');
          return;
        }
        let bannerDataUrl = '';
        if (bannerIn && bannerIn.files && bannerIn.files[0]) {
          bannerDataUrl = await readFileAsDataURL(bannerIn.files[0], 900);
        }
        state.upcomingSeries.unshift({
          id: 'up-' + Date.now(),
          title,
          startDate,
          priceLabel,
          scheduleDetails,
          bannerDataUrl
        });
        saveState();
        renderApp();
        showToast('📅 Upcoming Test Series Posted!');
      };
    }

    document.querySelectorAll('.adm-send-query-reply-btn').forEach((btn) => {
      btn.onclick = () => {
        const qid = btn.dataset.qid;
        const inp = document.querySelector(`.adm-query-reply-input[data-qid="${qid}"]`);
        const target = state.queries.find((q) => q.id === qid);
        if (target && inp) {
          target.adminReply = inp.value.trim();
          saveState();
          renderApp();
          showToast('✅ Private Reply Sent to Student!');
        }
      };
    });
  }

  function saveQuestionEditsFromDOM() {
    if (!state.reviewingTestRef) return;
    const { folderId, testId } = state.reviewingTestRef;
    const folder = state.folders.find((f) => f.id === folderId);
    const test = folder ? (folder.tests || []).find((t) => t.id === testId) : null;
    if (!test) return;

    document.querySelectorAll('.edit-q-hi').forEach((el) => {
      const idx = Number(el.dataset.qIdx);
      if (test.questions[idx]) test.questions[idx].qHi = el.value.trim();
    });
    document.querySelectorAll('.edit-q-en').forEach((el) => {
      const idx = Number(el.dataset.qIdx);
      if (test.questions[idx]) test.questions[idx].qEn = el.value.trim();
    });
    document.querySelectorAll('.edit-opt-hi').forEach((el) => {
      const qIdx = Number(el.dataset.qIdx);
      const oIdx = Number(el.dataset.optIdx);
      if (test.questions[qIdx]) test.questions[qIdx].optionsHi[oIdx] = el.value.trim();
    });
    document.querySelectorAll('.edit-opt-en').forEach((el) => {
      const qIdx = Number(el.dataset.qIdx);
      const oIdx = Number(el.dataset.optIdx);
      if (test.questions[qIdx]) test.questions[qIdx].optionsEn[oIdx] = el.value.trim();
    });
    document.querySelectorAll('.edit-q-correct').forEach((el) => {
      const idx = Number(el.dataset.qIdx);
      if (test.questions[idx]) test.questions[idx].correctIndex = Number(el.value);
    });
    document.querySelectorAll('.edit-q-exphi').forEach((el) => {
      const idx = Number(el.dataset.qIdx);
      if (test.questions[idx]) test.questions[idx].expHi = el.value.trim();
    });
    document.querySelectorAll('.edit-q-expen').forEach((el) => {
      const idx = Number(el.dataset.qIdx);
      if (test.questions[idx]) test.questions[idx].expEn = el.value.trim();
    });
    saveState();
  }

  // Dynamic Anti-Piracy & Screenshot Restriction Listeners (Controlled by Admin Master Switch)
  function initDynamicSecurityListeners() {
    document.addEventListener('contextmenu', (e) => {
      if (state.config.screenshotProtection) {
        e.preventDefault();
      }
    });

    ['copy', 'cut', 'dragstart'].forEach((evt) => {
      document.addEventListener(evt, (e) => {
        if (state.config.screenshotProtection) {
          e.preventDefault();
          showToast('🛡️ Content copying is disabled by Admin security policy.');
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (!state.config.screenshotProtection) return;
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && ['p', 's', 'u', 'c'].includes(e.key.toLowerCase())) ||
        (e.metaKey && e.shiftKey && ['s', '3', '4', '5'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        document.body.classList.add('window-blurred');
        showToast('🛡️ Screenshot & Screen Capture Restricted!');
      }
    });

    window.addEventListener('blur', () => {
      if (state.config.screenshotProtection && activeExamSession) {
        document.body.classList.add('window-blurred');
      }
    });

    window.addEventListener('focus', () => {
      document.body.classList.remove('window-blurred');
    });

    document.querySelector('.security-blur-overlay')?.addEventListener('click', () => {
      document.body.classList.remove('window-blurred');
    });
  }

  function initHeaderListeners() {
    document.querySelectorAll('.nav-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (activeExamSession && !activeExamSession.submitted) {
          showToast('Please submit or exit your active exam first.');
          return;
        }
        activeExamSession = null;
        state.activeTab = btn.dataset.tab;
        saveState();
        renderApp();
      });
    });

    document.getElementById('brandHomeTrigger')?.addEventListener('click', () => {
      if (activeExamSession && !activeExamSession.submitted) return;
      activeExamSession = null;
      state.activeTab = 'dashboard';
      state.selectedFolderId = null;
      saveState();
      renderApp();
    });

    document.getElementById('themeSwitchBtn')?.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveState();
      renderApp();
    });

    document.getElementById('studentProfileBtn')?.addEventListener('click', openStudentProfileModal);
    document.getElementById('anthemToggleBtn')?.addEventListener('click', toggleAnthem);
  }

  // Boot Application
  initPwaSupport();
  initHeaderListeners();
  initDynamicSecurityListeners();
  renderApp();
})();
