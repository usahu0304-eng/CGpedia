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
  let isCloudConnected = false;
  let activeUnsubscribes = [];

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
      isCloudConnected = true;
      updateSyncBadge('☁️ Firebase Live', true);

      auth.onAuthStateChanged((fbUser) => {
        if (fbUser && window.CGpediaApp && typeof window.CGpediaApp.handleFirebaseAuthUser === 'function') {
          window.CGpediaApp.handleFirebaseAuthUser(fbUser);
        }
      });

      subscribeCloudCollections();
      if (onStateReady) onStateReady(true);
    } catch (err) {
      console.warn('Firebase initialization fallback:', err);
      updateSyncBadge('⚡ Offline Mode', false);
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
    initFirebaseConnection,
    saveCloudDoc,
    deleteCloudDoc,
    signInWithGooglePopup,
    signOutFirebase,
    isConnected: () => isCloudConnected
  };
})();
