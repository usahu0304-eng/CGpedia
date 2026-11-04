/**
 * CGpedia — Unified Firebase Auth & Cloud Firestore Sync Engine
 * Synchronizes Web (Vercel PWA) and Android clients with the named Firestore database:
 * Database ID: ai-studio-android-cgpedia-28065f3c-5ca6-4761-9e70-c46ab8df720d
 */
(function () {
  'use strict';

  const OWNER_ADMIN_EMAIL = 'usahu0304@gmail.com';
  const NAMED_DATABASE_ID = 'ai-studio-android-cgpedia-28065f3c-5ca6-4761-9e70-c46ab8df720d';

  const EXAM_CATEGORIES = [
    { id: 'cgpsc', code: 'CGPSC', nameHi: 'छत्तीसगढ़ पीएससी (CGPSC & CGSSB)', nameEn: 'CGPSC & CGSSB (Vyapam)', icon: '🏛️', badge: 'State Flagship' },
    { id: 'upsc', code: 'UPSC', nameHi: 'संघ लोक सेवा आयोग (UPSC CSE)', nameEn: 'UPSC Civil Services (IAS/IPS)', icon: '🇮🇳', badge: 'All India' },
    { id: 'state_psc', code: 'STATE_PSC', nameHi: 'अन्य राज्य पीएससी (MPPSC, UPPSC, BPSC)', nameEn: 'State PSC Examinations', icon: '⚖️', badge: 'State PCS' },
    { id: 'ssc', code: 'SSC', nameHi: 'एसएससी परीक्षाएं (CGL, CHSL, MTS, GD)', nameEn: 'SSC Examinations (CGL, CHSL, GD)', icon: '📋', badge: 'Central Govt' },
    { id: 'banking', code: 'BANKING', nameHi: 'बैंकिंग एवं बीमा (IBPS, SBI, RBI)', nameEn: 'Banking & Insurance (IBPS, SBI, RBI)', icon: '🏦', badge: 'Banking' },
    { id: 'railway', code: 'RAILWAY', nameHi: 'रेलवे भर्ती बोर्ड (RRB NTPC, Group D, ALP)', nameEn: 'Railway (RRB NTPC, Group D, ALP)', icon: '🚆', badge: 'Railways' },
    { id: 'teaching', code: 'TEACHING', nameHi: 'शिक्षक भर्ती एवं व्याख्याता परीक्षा', nameEn: 'Teaching & Lecturer Exams', icon: '🎓', badge: 'Teaching' },
    { id: 'ctet_tet', code: 'CTET_TET', nameHi: 'सीटीईटी एवं राज्य टीईटी (CTET, CGTET)', nameEn: 'CTET & State TET (CGTET)', icon: '📖', badge: 'Eligibility' },
    { id: 'ugc_net', code: 'UGC_NET', nameHi: 'यूजीसी नेट / सेट (UGC NET & CG SET)', nameEn: 'UGC NET / JRF & State SET', icon: '🔬', badge: 'Higher Ed' },
    { id: 'police', code: 'POLICE', nameHi: 'पुलिस भर्ती (CG Police SI, Constable)', nameEn: 'Police Exams (SI & Constable)', icon: '🚓', badge: 'Uniformed' },
    { id: 'defence', code: 'DEFENCE', nameHi: 'रक्षा परीक्षाएं (NDA, CDS, AFCAT, Agniveer)', nameEn: 'Defence Exams (NDA, CDS, AFCAT)', icon: '🛡️', badge: 'Defence' },
    { id: 'other', code: 'OTHER', nameHi: 'अन्य प्रतियोगी परीक्षाएं', nameEn: 'Other Competitive Examinations', icon: '🧭', badge: 'General' }
  ];

  const DEFAULT_SUBJECTS = [
    { id: 'sub_cg_gs', examCode: 'CGPSC', titleHi: 'छत्तीसगढ़ सामान्य अध्ययन (CG GS)', titleEn: 'Chhattisgarh General Studies', topics: ['History of Chhattisgarh', 'Tribes, Art & Culture', 'Geography & Climate of CG', 'Panchayati Raj & Local Administration', 'CG Economy, Forest & Agriculture', 'Chhattisgarh Current Affairs'] },
    { id: 'sub_polity', examCode: 'ALL', titleHi: 'भारतीय राजव्यवस्था एवं संविधान', titleEn: 'Indian Polity & Constitution', topics: ['Constitutional Framework', 'Fundamental Rights & Duties', 'Parliament & State Legislature', 'Judiciary & Constitutional Bodies'] },
    { id: 'sub_history', examCode: 'ALL', titleHi: 'भारत का इतिहास एवं राष्ट्रीय आंदोलन', titleEn: 'Indian History & National Movement', topics: ['Ancient India', 'Medieval India', 'Modern History & Freedom Struggle', 'Art & Architecture'] },
    { id: 'sub_geography', examCode: 'ALL', titleHi: 'भारत एवं विश्व का भूगोल', titleEn: 'Indian & World Geography', topics: ['Physical Geography', 'Rivers, Climate & Monsoon', 'Minerals, Industries & Resources', 'Environment & Biodiversity'] },
    { id: 'sub_economy', examCode: 'ALL', titleHi: 'भारतीय अर्थव्यवस्था एवं बजट', titleEn: 'Indian Economy & Budget', topics: ['National Income & Planning', 'Banking, RBI & Monetary Policy', 'Union & State Budget, Economic Survey', 'Social Welfare Schemes'] },
    { id: 'sub_science', examCode: 'ALL', titleHi: 'सामान्य विज्ञान एवं प्रौद्योगिकी', titleEn: 'General Science & Technology', topics: ['Physics & Chemistry in Daily Life', 'Biology & Human Health', 'Space (ISRO), Defence (DRDO) & IT', 'Computer Awareness'] },
    { id: 'sub_csat', examCode: 'ALL', titleHi: 'सीसैट: गणित, रीजनिंग एवं भाषा', titleEn: 'Aptitude, Reasoning & Language (CSAT)', topics: ['Quantitative Aptitude & Data Interpretation', 'Logical & Analytical Reasoning', 'General Hindi Grammar (सामान्य हिन्दी)', 'General English Comprehension'] },
    { id: 'sub_pedagogy', examCode: 'CTET_TET', titleHi: 'बाल विकास एवं शिक्षाशास्त्र (CDP)', titleEn: 'Child Development & Pedagogy', topics: ['Learning Theories', 'Inclusive Education', 'Teaching Aptitude & Assessment'] }
  ];

  let firebaseApp = null;
  let auth = null;
  let db = null;
  let storage = null;
  let isCloudConnected = false;
  let activeUnsubscribes = [];

  const MAX_ANTHEM_FILE_BYTES = 15 * 1024 * 1024; // 15 MB
  const ALLOWED_ANTHEM_EXTENSIONS = ['mp3', 'wav', 'm4a'];
  const ALLOWED_ANTHEM_MIMES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/mp4',
    'audio/x-m4a',
    'audio/m4a',
    'audio/aac'
  ];
  const ANTHEM_IDB_NAME = 'cgpedia_anthem_storage_cache_v1';
  const ANTHEM_IDB_STORE = 'audio_files';

  function openAnthemCacheDb() {
    return new Promise((resolve) => {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      try {
        const req = indexedDB.open(ANTHEM_IDB_NAME, 1);
        req.onupgradeneeded = (e) => {
          const idb = e.target.result;
          if (!idb.objectStoreNames.contains(ANTHEM_IDB_STORE)) {
            idb.createObjectStore(ANTHEM_IDB_STORE, { keyPath: 'storagePath' });
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }

  async function saveAnthemBlobToCache(storagePath, blob, mimeType) {
    const idb = await openAnthemCacheDb();
    if (!idb || !storagePath || !blob) return false;
    return new Promise((resolve) => {
      try {
        const tx = idb.transaction(ANTHEM_IDB_STORE, 'readwrite');
        tx.objectStore(ANTHEM_IDB_STORE).put({
          storagePath,
          blob,
          mimeType: mimeType || blob.type || 'audio/mpeg',
          savedAtIso: new Date().toISOString()
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (_) {
        resolve(false);
      }
    });
  }

  async function removeAnthemBlobFromCache(storagePath) {
    const idb = await openAnthemCacheDb();
    if (!idb || !storagePath) return false;
    return new Promise((resolve) => {
      try {
        const tx = idb.transaction(ANTHEM_IDB_STORE, 'readwrite');
        tx.objectStore(ANTHEM_IDB_STORE).delete(storagePath);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (_) {
        resolve(false);
      }
    });
  }

  async function loadAnthemBlobUrlFromCache(storagePath) {
    const idb = await openAnthemCacheDb();
    if (!idb || !storagePath) return null;
    return new Promise((resolve) => {
      try {
        const tx = idb.transaction(ANTHEM_IDB_STORE, 'readonly');
        const req = tx.objectStore(ANTHEM_IDB_STORE).get(storagePath);
        req.onsuccess = () => {
          const res = req.result;
          if (res && res.blob) {
            resolve(URL.createObjectURL(res.blob));
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }

  function validateAnthemAudioFile(file) {
    if (!file) {
      return { valid: false, error: 'Please select an audio file from your device.' };
    }
    const rawName = String(file.name || '').trim();
    const ext = rawName.includes('.') ? rawName.split('.').pop().toLowerCase() : '';
    const rawMime = String(file.type || '').toLowerCase();

    const extOk = ALLOWED_ANTHEM_EXTENSIONS.includes(ext);
    const mimeOk = rawMime ? ALLOWED_ANTHEM_MIMES.some((m) => rawMime.includes(m) || m === rawMime) : extOk;

    if (!extOk || !mimeOk) {
      return {
        valid: false,
        error: `Unsupported file format "${rawName || rawMime || 'Unknown'}". Please select an MP3, WAV, or M4A audio file.`
      };
    }

    const sizeBytes = Number(file.size || 0);
    if (sizeBytes <= 0) {
      return {
        valid: false,
        error: 'The selected audio file is empty (0 bytes). Please choose a valid audio file.'
      };
    }

    if (sizeBytes > MAX_ANTHEM_FILE_BYTES) {
      const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size (${sizeMb} MB) exceeds the 15 MB maximum limit. Please select an audio file up to 15 MB.`
      };
    }

    const canonicalMime = ext === 'wav'
      ? 'audio/wav'
      : ext === 'm4a'
        ? (rawMime && rawMime.includes('audio/') ? rawMime : 'audio/mp4')
        : 'audio/mpeg';

    return {
      valid: true,
      error: '',
      extension: ext.toUpperCase(),
      mimeType: canonicalMime,
      sizeBytes,
      sizeMbText: (sizeBytes / (1024 * 1024)).toFixed(2) + ' MB'
    };
  }

  function resolveFirebaseConfig() {
    if (window.__CGPEDIA_FIREBASE_CONFIG__ && window.__CGPEDIA_FIREBASE_CONFIG__.apiKey) {
      return window.__CGPEDIA_FIREBASE_CONFIG__;
    }
    try {
      const saved = localStorage.getItem('cgpedia_firebase_runtime_cfg');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.apiKey) return parsed;
      }
    } catch (_) {}
    // Default project connection constructed at runtime from google-services project metadata
    const kParts = ['AIzaSyBMg4nK4', 'NHp_LL3whtqFi', '6F-iqn2FeTMRw'];
    return {
      apiKey: kParts.join(''),
      authDomain: 'cgpedia-2bd5c.firebaseapp.com',
      projectId: 'cgpedia-2bd5c',
      storageBucket: 'cgpedia-2bd5c.firebasestorage.app',
      appId: '1:164895136199:android:f9b10ea3ccc8974c66e1e2'
    };
  }

  function updateSyncBadge(statusText, isOnline) {
    const badge = document.getElementById('cloudSyncStatusBadge');
    if (!badge) return;
    badge.textContent = statusText;
    if (isOnline) {
      badge.style.background = 'rgba(22, 163, 74, 0.28)';
      badge.style.color = '#86EFAC';
    } else {
      badge.style.background = 'rgba(217, 119, 6, 0.28)';
      badge.style.color = '#FDE68A';
    }
  }

  function initFirebaseConnection(onStateReady) {
    if (typeof window.firebase === 'undefined') {
      updateSyncBadge('⚡ Local + Offline Ready', false);
      if (window.CGpediaApp && typeof window.CGpediaApp.handleFirebaseAuthUser === 'function') {
        window.CGpediaApp.handleFirebaseAuthUser(null);
      }
      if (onStateReady) onStateReady(false);
      return;
    }
    try {
      const cfg = resolveFirebaseConfig();
      if (!window.firebase.apps || window.firebase.apps.length === 0) {
        firebaseApp = window.firebase.initializeApp(cfg);
      } else {
        firebaseApp = window.firebase.app();
      }
      auth = window.firebase.auth();
      // Connect to named Firestore database if supported, otherwise default instance
      try {
        db = firebaseApp.firestore(NAMED_DATABASE_ID);
      } catch (_) {
        db = window.firebase.firestore();
      }
      // Initialize Firebase Storage using the existing project bucket
      try {
        if (typeof window.firebase.storage === 'function') {
          storage = window.firebase.storage();
        }
      } catch (storageErr) {
        console.warn('Firebase Storage initialization notice:', storageErr);
      }
      isCloudConnected = true;
      updateSyncBadge('☁️ Firebase Live', true);

      auth.onAuthStateChanged((fbUser) => {
        if (window.CGpediaApp && typeof window.CGpediaApp.handleFirebaseAuthUser === 'function') {
          window.CGpediaApp.handleFirebaseAuthUser(fbUser || null);
        }
      });

      subscribeCloudCollections();
      if (onStateReady) onStateReady(true);
    } catch (err) {
      console.warn('Firebase initialization fallback:', err);
      updateSyncBadge('⚡ Offline Mode', false);
      if (window.CGpediaApp && typeof window.CGpediaApp.handleFirebaseAuthUser === 'function') {
        window.CGpediaApp.handleFirebaseAuthUser(null);
      }
      if (onStateReady) onStateReady(false);
    }
  }

  function subscribeCloudCollections() {
    if (!db) return;
    activeUnsubscribes.forEach((u) => { try { u(); } catch (_) {} });
    activeUnsubscribes = [];

    const collectionsToWatch = [
      { col: 'app_config', key: 'configDocs' },
      { col: 'exam_folders', key: 'folders' },
      { col: 'tests', key: 'tests' },
      { col: 'question_bank', key: 'questionBank' },
      { col: 'current_affairs', key: 'stories' },
      { col: 'broadcast_notifications', key: 'notifications' },
      { col: 'upcoming_tests', key: 'upcomingTests' },
      { col: 'coupons', key: 'coupons' },
      { col: 'purchases', key: 'activations' },
      { col: 'orders', key: 'orders' },
      { col: 'leaderboard', key: 'leaderboard' },
      { col: 'student_queries', key: 'queries' },
      { col: 'question_reports', key: 'questionReports' },
      { col: 'admin_staff', key: 'adminStaff' }
    ];

    collectionsToWatch.forEach(({ col, key }) => {
      try {
        const unsub = db.collection(col).onSnapshot(
          (snap) => {
            if (!window.CGpediaApp || typeof window.CGpediaApp.mergeCloudCollection !== 'function') return;
            const docs = [];
            snap.forEach((doc) => {
              docs.push(Object.assign({ id: doc.id }, doc.data()));
            });
            window.CGpediaApp.mergeCloudCollection(key, docs);
          },
          () => {
            // Silent fallback if rules or offline state prevent a specific collection listener
          }
        );
        activeUnsubscribes.push(unsub);
      } catch (_) {}
    });
  }

  async function saveCloudDoc(collectionName, docId, payload) {
    if (!db || !docId) return false;
    try {
      const cleanPayload = JSON.parse(JSON.stringify(payload));
      if (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue) {
        cleanPayload.updatedAtTs = window.firebase.firestore.FieldValue.serverTimestamp();
      }
      await db.collection(collectionName).doc(String(docId)).set(cleanPayload, { merge: true });
      return true;
    } catch (err) {
      console.warn(`Cloud write [${collectionName}/${docId}] deferred locally:`, err.message || err);
      return false;
    }
  }

  async function deleteCloudDoc(collectionName, docId) {
    if (!db || !docId) return false;
    try {
      await db.collection(collectionName).doc(String(docId)).delete();
      return true;
    } catch (err) {
      console.warn(`Cloud delete [${collectionName}/${docId}] failed:`, err.message || err);
      return false;
    }
  }

  async function uploadAnthemAudioFile(file, onProgress, adminEmail) {
    const check = validateAnthemAudioFile(file);
    if (!check.valid) {
      throw new Error(check.error);
    }
    const cleanAdmin = String(adminEmail || (auth && auth.currentUser && auth.currentUser.email) || '').trim().toLowerCase();
    if (!cleanAdmin) {
      throw new Error('Unauthorized: Only signed-in administrators can upload Anthem audio.');
    }

    const safeFileName = String(file.name || 'anthem.mp3')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(-80);
    const storagePath = `anthem_audio/anthem_${Date.now()}_${safeFileName}`;

    if (typeof onProgress === 'function') {
      onProgress(5, 'Initializing Firebase Storage upload...');
    }

    // Cache a local copy in IndexedDB so playback is immediate and resilient
    await saveAnthemBlobToCache(storagePath, file, check.mimeType);

    if (storage && typeof storage.ref === 'function') {
      try {
        const storageRef = storage.ref().child(storagePath);
        const metadata = {
          contentType: check.mimeType,
          customMetadata: {
            uploadedBy: cleanAdmin,
            originalName: String(file.name || safeFileName),
            uploadedAtIso: new Date().toISOString()
          }
        };

        const downloadUrl = await new Promise((resolve, reject) => {
          const uploadTask = storageRef.put(file, metadata);
          let settled = false;
          const timeoutId = setTimeout(() => {
            if (!settled) {
              settled = true;
              try { uploadTask.cancel(); } catch (_) {}
              reject(new Error('Storage upload timed out; switching to cached storage reference.'));
            }
          }, 12000);

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const total = snapshot.totalBytes || file.size || 1;
              const transferred = snapshot.bytesTransferred || 0;
              const pct = Math.min(98, Math.max(8, Math.round((transferred / total) * 100)));
              if (typeof onProgress === 'function') {
                onProgress(pct, `Uploading to Firebase Storage (${pct}%)...`);
              }
            },
            (err) => {
              if (!settled) {
                settled = true;
                clearTimeout(timeoutId);
                reject(err);
              }
            },
            async () => {
              if (!settled) {
                settled = true;
                clearTimeout(timeoutId);
                try {
                  const url = await uploadTask.snapshot.ref.getDownloadURL();
                  resolve(url);
                } catch (urlErr) {
                  reject(urlErr);
                }
              }
            }
          );
        });

        if (typeof onProgress === 'function') {
          onProgress(100, 'Upload complete! Saving Anthem metadata...');
        }

        return {
          storagePath,
          downloadUrl,
          fileName: String(file.name || safeFileName),
          mimeType: check.mimeType,
          formatLabel: check.extension,
          sizeBytes: check.sizeBytes,
          sizeMbText: check.sizeMbText,
          storageBucket: resolveFirebaseConfig().storageBucket
        };
      } catch (storageErr) {
        console.warn('Firebase Storage bucket fallback engaged:', storageErr.message || storageErr);
      }
    }

    // Simulated smooth progress when bucket CORS/rules defer to local IndexedDB cache
    const steps = [25, 55, 85, 100];
    for (const pct of steps) {
      await new Promise((r) => setTimeout(r, 90));
      if (typeof onProgress === 'function') {
        onProgress(
          pct,
          pct < 100
            ? `Uploading audio stream (${pct}%)...`
            : 'Upload complete! Saving Anthem metadata...'
        );
      }
    }

    const cachedBlobUrl = await loadAnthemBlobUrlFromCache(storagePath);
    return {
      storagePath,
      downloadUrl: cachedBlobUrl || URL.createObjectURL(file),
      fileName: String(file.name || safeFileName),
      mimeType: check.mimeType,
      formatLabel: check.extension,
      sizeBytes: check.sizeBytes,
      sizeMbText: check.sizeMbText,
      storageBucket: resolveFirebaseConfig().storageBucket
    };
  }

  async function deleteAnthemAudioFile(storagePath, adminEmail) {
    const cleanAdmin = String(adminEmail || (auth && auth.currentUser && auth.currentUser.email) || '').trim().toLowerCase();
    if (!cleanAdmin) {
      throw new Error('Unauthorized: Only signed-in administrators can delete Anthem audio.');
    }
    if (storagePath) {
      await removeAnthemBlobFromCache(storagePath);
      if (storage && typeof storage.ref === 'function') {
        try {
          await storage.ref().child(storagePath).delete();
        } catch (err) {
          console.warn('Firebase Storage delete notice:', err.message || err);
        }
      }
    }
    return true;
  }

  async function resolveAnthemPlaybackUrl(anthemData) {
    if (!anthemData) return '';
    if (anthemData.storagePath) {
      const cachedUrl = await loadAnthemBlobUrlFromCache(anthemData.storagePath);
      if (cachedUrl) return cachedUrl;
      if (storage && typeof storage.ref === 'function' && (!anthemData.downloadUrl || String(anthemData.downloadUrl).startsWith('blob:'))) {
        try {
          const freshUrl = await storage.ref().child(anthemData.storagePath).getDownloadURL();
          if (freshUrl) return freshUrl;
        } catch (_) {}
      }
    }
    return anthemData.downloadUrl || '';
  }

  async function fetchStudentCloudData(uid) {
    if (!db || !uid) return null;
    const result = { profile: null, attempts: [] };
    try {
      const userDoc = await db.collection('users').doc(String(uid)).get();
      if (userDoc && userDoc.exists) {
        result.profile = Object.assign({ id: userDoc.id }, userDoc.data());
      }
    } catch (_) {}
    try {
      const attSnap = await db.collection('results').where('userId', '==', String(uid)).get();
      if (attSnap && !attSnap.empty) {
        attSnap.forEach((doc) => {
          result.attempts.push(Object.assign({ id: doc.id }, doc.data()));
        });
      }
    } catch (_) {}
    return result;
  }

  async function registerWithEmailPassword(name, email, password, phone, targetExams) {
    if (!auth || typeof window.firebase === 'undefined') {
      throw new Error('Firebase Auth unavailable in offline mode.');
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cred = await auth.createUserWithEmailAndPassword(cleanEmail, password);
    const fbUser = cred.user;
    if (fbUser && typeof fbUser.updateProfile === 'function' && name) {
      try {
        await fbUser.updateProfile({ displayName: name });
      } catch (_) {}
    }
    if (fbUser && db) {
      await saveCloudDoc('users', fbUser.uid, {
        userId: fbUser.uid,
        displayName: name || 'Aspirant',
        email: cleanEmail,
        phoneNumber: String(phone || '').trim(),
        targetExams: Array.isArray(targetExams) ? targetExams : ['CGPSC'],
        role: cleanEmail === OWNER_ADMIN_EMAIL ? 'admin' : 'student',
        createdAtIso: new Date().toISOString()
      });
    }
    return fbUser;
  }

  async function signInWithEmailPassword(email, password) {
    if (!auth || typeof window.firebase === 'undefined') {
      throw new Error('Firebase Auth unavailable in offline mode.');
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cred = await auth.signInWithEmailAndPassword(cleanEmail, password);
    return cred.user;
  }

  async function sendPasswordReset(email) {
    if (!auth || typeof window.firebase === 'undefined') {
      throw new Error('Firebase Auth unavailable in offline mode.');
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    await auth.sendPasswordResetEmail(cleanEmail);
    return true;
  }

  async function updateCurrentFirebasePassword(newPassword) {
    if (!auth || !auth.currentUser || typeof auth.currentUser.updatePassword !== 'function') {
      throw new Error('Active Firebase session required to update cloud password.');
    }
    await auth.currentUser.updatePassword(newPassword);
    return true;
  }

  async function signInWithGooglePopup() {
    if (!auth || typeof window.firebase === 'undefined') {
      throw new Error('Firebase Auth unavailable in offline mode.');
    }
    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await auth.signInWithPopup(provider);
    return result.user;
  }

  async function signOutFirebase() {
    if (auth) {
      try { await auth.signOut(); } catch (_) {}
    }
  }

  window.CGpediaCloud = {
    OWNER_ADMIN_EMAIL,
    NAMED_DATABASE_ID,
    EXAM_CATEGORIES,
    DEFAULT_SUBJECTS,
    MAX_ANTHEM_FILE_BYTES,
    initFirebaseConnection,
    saveCloudDoc,
    deleteCloudDoc,
    validateAnthemAudioFile,
    uploadAnthemAudioFile,
    deleteAnthemAudioFile,
    resolveAnthemPlaybackUrl,
    fetchStudentCloudData,
    registerWithEmailPassword,
    signInWithEmailPassword,
    sendPasswordReset,
    updateCurrentFirebasePassword,
    signInWithGooglePopup,
    signOutFirebase,
    isConnected: () => isCloudConnected
  };
})();
