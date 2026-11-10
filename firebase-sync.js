/**
 * CGpedia — Unified Firebase Auth & Cloud Firestore Sync Engine
 * Synchronizes Web (Vercel PWA) and Android clients with the named Firestore database:
 * Database ID: ai-studio-android-cgpedia-28065f3c-5ca6-4761-9e70-c46ab8df720d
 */
(function () {
  'use strict';

  const OWNER_ADMIN_EMAIL = 'usahu0304@gmail.com';
  const NAMED_DATABASE_ID = 'ai-studio-android-cgpedia-28065f3c-5ca6-4761-9e70-c46ab8df720d';

  // ============================================================================
  // PART 1 & PART 2: CANONICAL QUESTION BANK HIERARCHY & PYQ LIBRARY MASTER
  // ============================================================================
  const MAIN_CATEGORIES = [
    {
      id: 'cat_cg_gk',
      mainCategoryId: 'cat_cg_gk',
      code: 'CHHATTISGARH_GK',
      titleEn: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ सामान्य ज्ञान (Chhattisgarh GK)',
      icon: '🏛️',
      hasSubjectFolders: true,
      order: 1,
      aliases: ['chhattisgarh gk', 'cg gk', 'cg gs', 'chhattisgarh general knowledge', 'chhattisgarh general studies', 'छत्तीसगढ़ सामान्य ज्ञान', 'छत्तीसगढ़ जीके']
    },
    {
      id: 'cat_indian_gs',
      mainCategoryId: 'cat_indian_gs',
      code: 'INDIAN_GS',
      titleEn: 'Indian GS',
      titleHi: 'भारतीय सामान्य अध्ययन (Indian GS)',
      icon: '🇮🇳',
      hasSubjectFolders: true,
      order: 2,
      aliases: ['indian gs', 'india gs', 'general studies', 'indian general studies', 'भारतीय सामान्य अध्ययन', 'सामान्य अध्ययन', 'भारत का सामान्य ज्ञान']
    },
    {
      id: 'cat_maths',
      mainCategoryId: 'cat_maths',
      code: 'MATHS',
      titleEn: 'Maths',
      titleHi: 'गणित (Maths)',
      icon: '📐',
      hasSubjectFolders: false,
      directSubjectId: 'sub_maths',
      order: 3,
      aliases: ['maths', 'mathematics', 'quantitative aptitude', 'quant', 'गणित', 'अंकगणित']
    },
    {
      id: 'cat_english',
      mainCategoryId: 'cat_english',
      code: 'ENGLISH',
      titleEn: 'English',
      titleHi: 'अंग्रेजी (English)',
      icon: '🔤',
      hasSubjectFolders: false,
      directSubjectId: 'sub_english',
      order: 4,
      aliases: ['english', 'general english', 'english language', 'english grammar', 'अंग्रेजी', 'सामान्य अंग्रेजी']
    },
    {
      id: 'cat_hindi',
      mainCategoryId: 'cat_hindi',
      code: 'HINDI',
      titleEn: 'Hindi',
      titleHi: 'हिन्दी (Hindi)',
      icon: '🕉️',
      hasSubjectFolders: false,
      directSubjectId: 'sub_hindi',
      order: 5,
      aliases: ['hindi', 'general hindi', 'hindi grammar', 'हिन्दी', 'हिंदी', 'सामान्य हिन्दी', 'हिन्दी व्याकरण']
    },
    {
      id: 'cat_reasoning',
      mainCategoryId: 'cat_reasoning',
      code: 'REASONING',
      titleEn: 'Reasoning',
      titleHi: 'तर्कशक्ति (Reasoning)',
      icon: '🧠',
      hasSubjectFolders: false,
      directSubjectId: 'sub_reasoning',
      order: 6,
      aliases: ['reasoning', 'logical reasoning', 'general intelligence', 'mental ability', 'तर्कशक्ति', 'रीजनिंग', 'मानसिक योग्यता']
    },
    {
      id: 'cat_uncategorised',
      mainCategoryId: 'cat_uncategorised',
      code: 'UNCATEGORISED',
      titleEn: 'Uncategorised',
      titleHi: 'अवर्गीकृत प्रश्न (Uncategorised)',
      icon: '📂',
      hasSubjectFolders: false,
      directSubjectId: 'sub_uncategorised',
      order: 99,
      aliases: ['uncategorised', 'uncategorized', 'needs categorisation', 'needs_categorisation', 'अवर्गीकृत']
    }
  ];

  const EXAM_CATEGORIES = [
    { id: 'exam_cgpsc', examId: 'exam_cgpsc', code: 'CGPSC', nameHi: 'छत्तीसगढ़ पीएससी (CGPSC)', nameEn: 'CGPSC', icon: '🏛️', badge: 'State Flagship', pyqCategory: 'CGPSC' },
    { id: 'exam_cg_vyapam', examId: 'exam_cg_vyapam', code: 'CG_VYAPAM', nameHi: 'छत्तीसगढ़ व्यापम (CG Vyapam)', nameEn: 'CG Vyapam', icon: '🏢', badge: 'State Board', pyqCategory: 'CG Vyapam' },
    { id: 'exam_adeo', examId: 'exam_adeo', code: 'ADEO', nameHi: 'सहायक विकास विस्तार अधिकारी (ADEO)', nameEn: 'ADEO', icon: '🌾', badge: 'Rural Dev', pyqCategory: 'CG Vyapam' },
    { id: 'exam_patwari', examId: 'exam_patwari', code: 'PATWARI', nameHi: 'पटवारी भर्ती परीक्षा (Patwari)', nameEn: 'Patwari', icon: '📐', badge: 'Revenue', pyqCategory: 'CG Vyapam' },
    { id: 'exam_sub_inspector', examId: 'exam_sub_inspector', code: 'SUB_INSPECTOR', nameHi: 'उप निरीक्षक भर्ती (Sub Inspector / SI)', nameEn: 'Sub Inspector', icon: '👮', badge: 'Police SI', pyqCategory: 'CG Vyapam' },
    { id: 'exam_hostel_warden', examId: 'exam_hostel_warden', code: 'HOSTEL_WARDEN', nameHi: 'छात्रावास अधीक्षक (Hostel Warden)', nameEn: 'Hostel Warden', icon: '🏫', badge: 'Vyapam', pyqCategory: 'CG Vyapam' },
    { id: 'exam_teacher_recruitment', examId: 'exam_teacher_recruitment', code: 'TEACHER_RECRUITMENT', nameHi: 'शिक्षक भर्ती परीक्षा (Teacher Recruitment)', nameEn: 'Teacher Recruitment', icon: '🏫', badge: 'Teaching', pyqCategory: 'Teaching Exams' },
    { id: 'exam_tet', examId: 'exam_tet', code: 'TET', nameHi: 'शिक्षक पात्रता परीक्षा (TET / CGTET / CTET)', nameEn: 'TET', icon: '📖', badge: 'Eligibility', pyqCategory: 'Teaching Exams' },
    { id: 'upsc', examId: 'exam_upsc', code: 'UPSC', nameHi: 'संघ लोक सेवा आयोग (UPSC CSE)', nameEn: 'UPSC', icon: '🇮🇳', badge: 'All India', pyqCategory: 'UPSC' },
    { id: 'state_psc', examId: 'exam_state_psc', code: 'STATE_PSC', nameHi: 'अन्य राज्य पीएससी (MPPSC, UPPSC, BPSC)', nameEn: 'State PSC Examinations', icon: '⚖️', badge: 'State PCS', pyqCategory: 'Other Exams' },
    { id: 'ssc', examId: 'exam_ssc', code: 'SSC', nameHi: 'एसएससी परीक्षाएं (CGL, CHSL, MTS, GD)', nameEn: 'SSC', icon: '📋', badge: 'Central Govt', pyqCategory: 'SSC' },
    { id: 'banking', examId: 'exam_banking', code: 'BANKING', nameHi: 'बैंकिंग एवं बीमा (IBPS, SBI, RBI)', nameEn: 'Banking', icon: '🏦', badge: 'Banking', pyqCategory: 'Banking' },
    { id: 'railway', examId: 'exam_railway', code: 'RAILWAY', nameHi: 'रेलवे भर्ती बोर्ड (RRB NTPC, Group D, ALP)', nameEn: 'Railway', icon: '🚆', badge: 'Railways', pyqCategory: 'Railway' },
    { id: 'teaching', examId: 'exam_teaching', code: 'TEACHING', nameHi: 'शिक्षक भर्ती एवं व्याख्याता परीक्षा', nameEn: 'Teaching Exams', icon: '🎓', badge: 'Teaching', pyqCategory: 'Teaching Exams' },
    { id: 'ctet_tet', examId: 'exam_ctet_tet', code: 'CTET_TET', nameHi: 'सीटीईटी एवं राज्य टीईटी (CTET, CGTET)', nameEn: 'CTET & State TET (CGTET)', icon: '📖', badge: 'Eligibility', pyqCategory: 'Teaching Exams' },
    { id: 'ugc_net', examId: 'exam_ugc_net', code: 'UGC_NET', nameHi: 'यूजीसी नेट / सेट (UGC NET & CG SET)', nameEn: 'UGC NET / JRF & State SET', icon: '🔬', badge: 'Higher Ed', pyqCategory: 'Teaching Exams' },
    { id: 'police', examId: 'exam_police', code: 'POLICE', nameHi: 'पुलिस भर्ती (CG Police SI, Constable)', nameEn: 'Police Exams (SI & Constable)', icon: '🚓', badge: 'Uniformed', pyqCategory: 'Other Exams' },
    { id: 'defence', examId: 'exam_defence', code: 'DEFENCE', nameHi: 'रक्षा परीक्षाएं (NDA, CDS, AFCAT, Agniveer)', nameEn: 'Defence Exams (NDA, CDS, AFCAT)', icon: '🛡️', badge: 'Defence', pyqCategory: 'Other Exams' },
    { id: 'other', examId: 'exam_other', code: 'OTHER_EXAMS', nameHi: 'अन्य प्रतियोगी परीक्षाएं', nameEn: 'Other Exams', icon: '🧭', badge: 'General', pyqCategory: 'Other Exams' }
  ];

  const PYQ_EXAM_CATEGORIES = [
    {
      id: 'pyq_cat_cg_vyapam',
      categoryName: 'CG Vyapam',
      titleHi: 'CG Vyapam (छत्तीसगढ़ व्यावसायिक परीक्षा मंडल)',
      icon: '📋',
      exams: [
        { examName: 'Hostel Warden (छात्रावास अधीक्षक)', years: ['2024', '2023', '2016', '2014'], papers: ['Paper 1', 'Shift 1', 'Shift 2'] },
        { examName: 'ADEO (सहायक विकास विस्तार अधिकारी)', years: ['2024', '2017', '2012'], papers: ['Paper 1'] },
        { examName: 'Patwari (पटवारी प्रशिक्षण चयन परीक्षा)', years: ['2022', '2019', '2017', '2016'], papers: ['Paper 1'] },
        { examName: 'Revenue Inspector - RI (राजस्व निरीक्षक)', years: ['2023', '2017', '2015'], papers: ['Paper 1'] },
        { examName: 'Mandi Inspector & Sub-Inspector (मंडी निरीक्षक)', years: ['2024', '2021'], papers: ['Paper 1'] },
        { examName: 'Food Inspector (खाद्य नागरिक आपूर्ति निरीक्षक)', years: ['2022', '2017'], papers: ['Paper 1'] },
        { examName: 'Labour Inspector (श्रम निरीक्षक)', years: ['2023', '2018'], papers: ['Paper 1'] },
        { examName: 'Amin Patwari (अमीन पटवारी)', years: ['2023', '2017'], papers: ['Paper 1'] },
        { examName: 'Assistant Grade-3 & Data Entry Operator', years: ['2024', '2023', '2021', '2018'], papers: ['Paper 1', 'Shift 1', 'Shift 2'] },
        { examName: 'CG Police Sub-Inspector (SI)', years: ['2023', '2018'], papers: ['Prelims', 'Mains Paper 1', 'Mains Paper 2'] }
      ]
    },
    {
      id: 'pyq_cat_cgpsc',
      categoryName: 'CGPSC',
      titleHi: 'CGPSC (छत्तीसगढ़ लोक सेवा आयोग)',
      icon: '🏛️',
      exams: [
        { examName: 'CGPSC State Service Exam (SSE Prelims)', years: ['2024', '2023', '2022', '2021', '2020', '2019', '2018'], papers: ['GS Paper 1', 'CSAT Paper 2'] },
        { examName: 'CGPSC ACF / Forest Ranger', years: ['2021', '2017', '2016'], papers: ['Paper 1 (GS, Language & Aptitude)', 'Paper 2 (Science & Forestry)'] },
        { examName: 'CGPSC CMO (Chief Municipal Officer)', years: ['2022', '2019'], papers: ['Paper 1'] },
        { examName: 'CGPSC Assistant Professor / Lecturer', years: ['2024', '2020', '2019'], papers: ['Paper 1 (CG GK & GS)'] },
        { examName: 'CGPSC Civil Judge (ADPO / Law)', years: ['2024', '2023', '2022'], papers: ['Prelims'] },
        { examName: 'CGPSC State Engineering Service (SES)', years: ['2023', '2021', '2020'], papers: ['Paper 1 (GS & CG GK)'] },
        { examName: 'CGPSC Peon / भृत्य भर्ती परीक्षा', years: ['2022'], papers: ['Paper 1'] }
      ]
    },
    {
      id: 'pyq_cat_upsc',
      categoryName: 'UPSC',
      titleHi: 'UPSC (संघ लोक सेवा आयोग)',
      icon: '🇮🇳',
      exams: [
        { examName: 'UPSC Civil Services (CSE Prelims)', years: ['2024', '2023', '2022', '2021', '2020'], papers: ['GS Paper 1', 'CSAT Paper 2'] },
        { examName: 'UPSC CDS (Combined Defence Services)', years: ['2024', '2023', '2022'], papers: ['GK', 'English', 'Elementary Mathematics'] },
        { examName: 'UPSC CAPF (Assistant Commandants)', years: ['2024', '2023', '2022'], papers: ['Paper 1'] },
        { examName: 'UPSC NDA & NA', years: ['2024', '2023', '2022'], papers: ['GAT', 'Mathematics'] }
      ]
    },
    {
      id: 'pyq_cat_ssc',
      categoryName: 'SSC',
      titleHi: 'SSC (कर्मचारी चयन आयोग)',
      icon: '🏢',
      exams: [
        { examName: 'SSC CGL', years: ['2024', '2023', '2022', '2021'], papers: ['Tier-1 Shift 1', 'Tier-1 Shift 2', 'Tier-1 Shift 3', 'Tier-2'] },
        { examName: 'SSC CHSL', years: ['2024', '2023', '2022'], papers: ['Tier-1 Shift 1', 'Tier-1 Shift 2', 'Tier-2'] },
        { examName: 'SSC GD Constable', years: ['2024', '2023', '2021'], papers: ['Shift 1', 'Shift 2', 'Shift 3'] },
        { examName: 'SSC MTS & Havaldar', years: ['2024', '2023', '2022'], papers: ['Shift 1', 'Shift 2'] },
        { examName: 'SSC CPO (SI in Delhi Police & CAPF)', years: ['2024', '2023', '2022'], papers: ['Paper 1', 'Paper 2'] }
      ]
    },
    {
      id: 'pyq_cat_railway',
      categoryName: 'Railway',
      titleHi: 'Railway (रेलवे भर्ती बोर्ड - RRB)',
      icon: '🚆',
      exams: [
        { examName: 'RRB NTPC', years: ['2024', '2022', '2021', '2016'], papers: ['CBT-1 Shift 1', 'CBT-1 Shift 2', 'CBT-2'] },
        { examName: 'RRB Group D (Level-1)', years: ['2022', '2018'], papers: ['Shift 1', 'Shift 2', 'Shift 3'] },
        { examName: 'RRB ALP & Technician', years: ['2024', '2018'], papers: ['CBT-1', 'CBT-2'] },
        { examName: 'RRB RPF SI & Constable', years: ['2024', '2019'], papers: ['CBT Shift 1', 'CBT Shift 2'] }
      ]
    },
    {
      id: 'pyq_cat_banking',
      categoryName: 'Banking',
      titleHi: 'Banking (बैंकिंग परीक्षाएँ)',
      icon: '🏦',
      exams: [
        { examName: 'IBPS PO', years: ['2024', '2023', '2022'], papers: ['Prelims', 'Mains'] },
        { examName: 'IBPS Clerk', years: ['2024', '2023', '2022'], papers: ['Prelims', 'Mains'] },
        { examName: 'SBI PO', years: ['2024', '2023', '2022'], papers: ['Prelims', 'Mains'] },
        { examName: 'SBI Clerk (Junior Associates)', years: ['2024', '2023', '2022'], papers: ['Prelims', 'Mains'] },
        { examName: 'IBPS RRB Officer Scale-I & Office Assistant', years: ['2024', '2023', '2022'], papers: ['Prelims', 'Mains'] },
        { examName: 'Apex Bank / छ.ग. सहकारी बैंक भर्ती', years: ['2023'], papers: ['Paper 1'] }
      ]
    },
    {
      id: 'pyq_cat_teaching',
      categoryName: 'Teaching Exams',
      titleHi: 'Teaching Exams (शिक्षक भर्ती एवं पात्रता परीक्षा)',
      icon: '🎓',
      exams: [
        { examName: 'CG TET (छत्तीसगढ़ शिक्षक पात्रता परीक्षा)', years: ['2024', '2022', '2020', '2019', '2017'], papers: ['Paper 1 (Primary Class 1-5)', 'Paper 2 (Upper Primary Class 6-8)'] },
        { examName: 'CG Shikshak Bharti (व्याख्याता / शिक्षक / सहायक शिक्षक)', years: ['2023', '2019'], papers: ['Assistant Teacher', 'Teacher', 'Lecturer'] },
        { examName: 'CTET (Central Teacher Eligibility Test)', years: ['2024', '2023', '2022'], papers: ['Paper 1', 'Paper 2'] },
        { examName: 'CG SET (State Eligibility Test)', years: ['2024', '2019', '2018'], papers: ['Paper 1 (General Paper)'] }
      ]
    },
    {
      id: 'pyq_cat_other',
      categoryName: 'Other Exams',
      titleHi: 'Other Exams (अन्य राज्य एवं राष्ट्रीय परीक्षाएँ)',
      icon: '📚',
      exams: [
        { examName: 'CG Police Constable (आरक्षक संवर्ग)', years: ['2024', '2018'], papers: ['Written Exam'] },
        { examName: 'CG High Court / District Court Assistant Grade-3', years: ['2024', '2023'], papers: ['Prelims'] },
        { examName: 'MPPSC / UPPSC / BPSC State Prelims', years: ['2024', '2023', '2022'], papers: ['GS Paper 1'] },
        { examName: 'Other Competitive Exam', years: ['2025', '2024', '2023', '2022'], papers: ['Paper 1'] }
      ]
    }
  ];

  const ALL_EXAM_CODES = ['CGPSC', 'CG_VYAPAM', 'ADEO', 'PATWARI', 'SUB_INSPECTOR', 'HOSTEL_WARDEN', 'TEACHER_RECRUITMENT', 'TET', 'UPSC', 'STATE_PSC', 'SSC', 'BANKING', 'RAILWAY', 'TEACHING', 'CTET_TET', 'UGC_NET', 'POLICE', 'DEFENCE', 'OTHER_EXAMS'];

  // ============================================================================
  // PART 1.A: SUBJECT FOLDERS UNDER THE 6 MAIN LIBRARIES
  // ============================================================================
  const DEFAULT_SUBJECTS = [
    // --- 1. CHHATTISGARH GK (16 Subject Folders) ---
    {
      id: 'sub_cg_history', subjectId: 'sub_cg_history',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ का इतिहास', titleEn: 'छत्तीसगढ़ का इतिहास',
      aliases: ['History of Chhattisgarh', 'CG History', 'Chhattisgarh History', 'छत्तीसगढ़ का इतिहास'],
      examIds: ALL_EXAM_CODES,
      keywords: ['kalchuri', 'maratha', 'ratanpur', 'tumman', 'sirpur', 'sharabhapuriya', 'panduvamshi', 'somavamshi', 'nal dynasty', 'kakatiya', 'bastar revolt', 'halba rebellion', 'paralkot', 'bhumkal', 'gundadhur', 'veer narayan singh', 'sonakhan', 'savinay avagya in cg', 'kandel nahar', 'कलचुरी', 'रतनपुर', 'तुम्माण', 'सिरपुर', 'शरभपुरीय', 'पाण्डुवंश', 'सोमवंश', 'काकतीय', 'भूमकाल', 'गुण्डाधूर', 'वीर नारायण सिंह', 'सोनाखान', 'कंडेल नहर', 'बिंबाजी', 'सूबा शासन', 'छत्तीसगढ़ का इतिहास']
    },
    {
      id: 'sub_cg_geography', subjectId: 'sub_cg_geography',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ का भूगोल', titleEn: 'छत्तीसगढ़ का भूगोल',
      aliases: ['Geography of Chhattisgarh', 'Geography & Natural Resources of CG', 'CG Geography', 'Chhattisgarh Geography', 'Geography & Climate of CG', 'छत्तीसगढ़ का भूगोल'],
      examIds: ALL_EXAM_CODES,
      keywords: ['mahanadi', 'shivnath', 'indravati', 'hasdeo', 'arpa', 'pairi', 'jonk', 'sabari', 'rihand', 'kanhar', 'sihawa', 'maikal', 'pat region', 'mainpat', 'samripat', 'jaspur pat', 'gaurlata', 'bailadila', 'nandiraj', 'dandakaranya', 'chitrakote', 'tirathgarh', 'gangrel', 'minimata bango', 'महानदी', 'शिवनाथ', 'इंद्रावती', 'हसदेव', 'अर्पा', 'पैरी', 'जोंक', 'शबरी', 'रिहंद', 'कन्हार', 'सिहावा', 'मैकल', 'मेनपाट', 'सामरीपाट', 'गौरलाटा', 'बैलाडीला', 'नंदीराज', 'दण्डकारण्य', 'चित्रकोट', 'तीरथगढ़', 'गंगरेल', 'मिनीमाता बांगो', 'छत्तीसगढ़ का भूगोल']
    },
    {
      id: 'sub_cg_polity', subjectId: 'sub_cg_polity',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ की राजव्यवस्था एवं प्रशासन', titleEn: 'छत्तीसगढ़ की राजव्यवस्था एवं प्रशासन',
      aliases: ['Polity & Administration of CG', 'Panchayati Raj & Local Administration in CG', 'Panchayati Raj & Local Administration', 'Chhattisgarh Polity', 'छत्तीसगढ़ की राजव्यवस्था एवं प्रशासन', 'छत्तीसगढ़ में पंचायती राज एवं प्रशासन', 'sub_cg_panchayat_admin'],
      examIds: ALL_EXAM_CODES,
      keywords: ['cg panchayati raj', 'gram sabha', 'gram panchayat', 'janpad panchayat', 'jila panchayat', 'cg vidhan sabha', 'chief minister of chhattisgarh', 'governor of chhattisgarh', 'bilaspur high court', 'cg lokayukta', 'छत्तीसगढ़ पंचायती राज', 'ग्राम सभा', 'ग्राम पंचायत', 'जनपद पंचायत', 'जिला पंचायत', 'सरपंच', 'छत्तीसगढ़ विधानसभा', 'छत्तीसगढ़ उच्च न्यायालय', 'छत्तीसगढ़ की राजव्यवस्था']
    },
    {
      id: 'sub_cg_economy', subjectId: 'sub_cg_economy',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ की अर्थव्यवस्था', titleEn: 'छत्तीसगढ़ की अर्थव्यवस्था',
      aliases: ['Economy of Chhattisgarh', 'Economy, Budget & Schemes of CG', 'CG Economy, Forest & Agriculture', 'CG Economy', 'छत्तीसगढ़ की अर्थव्यवस्था'],
      examIds: ALL_EXAM_CODES,
      keywords: ['cg economic survey', 'cg gsdp', 'cg budget', 'paddy procurement cg', 'tendu patta', 'minor forest produce cg', 'छत्तीसगढ़ आर्थिक सर्वेक्षण', 'छत्तीसगढ़ बजट', 'सकल राज्य घरेलू उत्पाद', 'समर्थन मूल्य पर धान खरीदी', 'तेंदूपत्ता', 'लघु वनोपज', 'छत्तीसगढ़ की अर्थव्यवस्था']
    },
    {
      id: 'sub_cg_art_culture', subjectId: 'sub_cg_art_culture',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ की कला एवं संस्कृति', titleEn: 'छत्तीसगढ़ की कला एवं संस्कृति',
      aliases: ['Art & Culture of CG', 'Chhattisgarh Art and Culture', 'छत्तीसगढ़ की कला एवं संस्कृति'],
      examIds: ALL_EXAM_CODES,
      keywords: ['dhokra art', 'bell metal bastar', 'godna', 'tumba art', 'bhoramdeo temple', 'laxman temple sirpur', 'rajim lochan', 'deorani jethani', 'nachaa', 'rahas', 'maopata', 'ढोकरा कला', 'घड़वा कला', 'गोदना', 'तुम्बा कला', 'भोरमदेव', 'लक्ष्मण मंदिर सिरपुर', 'राजीव लोचन', 'देवरानी जेठानी', 'नाचा', 'रहस', 'छत्तीसगढ़ की कला एवं संस्कृति']
    },
    {
      id: 'sub_cg_tribes', subjectId: 'sub_cg_tribes',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ की जनजातियाँ', titleEn: 'छत्तीसगढ़ की जनजातियाँ',
      aliases: ['Tribes of Chhattisgarh', 'Tribes, Folk Art & Culture of CG', 'Tribes, Art & Culture', 'CG Tribes', 'छत्तीसगढ़ की जनजातियाँ', 'छत्तीसगढ़ की जनजातियाँ, लोक कला एवं संस्कृति'],
      examIds: ALL_EXAM_CODES,
      keywords: ['gond tribe', 'baiga', 'abujhmadia', 'kamar', 'birhor', 'pahadi korwa', 'bhunjia', 'pando', 'halba', 'bhatra', 'oraon', 'kanwar', 'binjhwar', 'ghotul', 'dhumkuria', 'chelik', 'motiari', 'budhadev', 'danteshwari', 'गोंड', 'बैगा', 'अबूझमाड़िया', 'कमार', 'बिरहोर', 'पहाड़ी कोरवा', 'भुंजिया', 'पंडो', 'हल्बा', 'भतरा', 'उरांव', 'कंवर', 'बिंझवार', 'घोटुल', 'धुमकुरिया', 'चेलिक', 'मोटियारी', 'बूढ़ादेव', 'छत्तीसगढ़ की जनजातियाँ']
    },
    {
      id: 'sub_cg_folk_dance_song', subjectId: 'sub_cg_folk_dance_song',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ के लोकनृत्य एवं लोकगीत', titleEn: 'छत्तीसगढ़ के लोकनृत्य एवं लोकगीत',
      aliases: ['Folk Dances & Folk Songs of CG', 'Folk Dances of Chhattisgarh', 'छत्तीसगढ़ के लोकनृत्य एवं लोकगीत'],
      examIds: ALL_EXAM_CODES,
      keywords: ['suwa dance', 'panthi dance', 'raut nacha', 'karma dance', 'kaksar', 'gaur dance', 'saila dance', 'dandami madia dance', 'pandavani', 'bharthari', 'chandaini gonda', 'dadariya', 'sohar geet', 'bihav geet', 'bhojali geet', 'सुआ नृत्य', 'पंथी नृत्य', 'राउत नाचा', 'कर्मा नृत्य', 'ककसार', 'गौर नृत्य', 'सैला नृत्य', 'पंडवानी', 'भरथरी', 'चंदैनी गोंदा', 'ददरिया', 'भोजली गीत', 'छत्तीसगढ़ के लोकनृत्य एवं लोकगीत']
    },
    {
      id: 'sub_cg_literature', subjectId: 'sub_cg_literature',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ का साहित्य एवं भाषा', titleEn: 'छत्तीसगढ़ का साहित्य एवं भाषा',
      aliases: ['Literature & Language of CG', 'Language, Literature & Personalities of CG', 'छत्तीसगढ़ का साहित्य एवं भाषा', 'छत्तीसगढ़ी भाषा, साहित्य एवं प्रमुख व्यक्तित्व'],
      examIds: ALL_EXAM_CODES,
      keywords: ['chhattisgarhi language', 'sundarlal sharma', 'lochan prasad pandey', 'mukutdhar pandey', 'padumlal punnalal bakshi', 'madhavrao sapre', 'chhattisgarh mitr', 'tokri bhar mitti', 'heeracrani', 'dharamdas', 'छत्तीसगढ़ी भाषा', 'सुंदरलाल शर्मा', 'लोचन प्रसाद पांडेय', 'मुकुटधर पांडेय', 'पदुमलाल पुन्नालाल बख्शी', 'माधवराव सप्रे', 'छत्तीसगढ़ मित्र', 'टोकरी भर मिट्टी', 'छत्तीसगढ़ का साहित्य']
    },
    {
      id: 'sub_cg_fairs_festivals', subjectId: 'sub_cg_fairs_festivals',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ के मेले एवं त्योहार', titleEn: 'छत्तीसगढ़ के मेले एवं त्योहार',
      aliases: ['Fairs & Festivals of CG', 'Fairs and Festivals of Chhattisgarh', 'छत्तीसगढ़ के मेले एवं त्योहार'],
      examIds: ALL_EXAM_CODES,
      keywords: ['hareli', 'pora', 'teej', 'cherchera', 'akti', 'bastar dussehra', 'goncha festival', 'madai', 'rajim kumbh', 'shivrinayaran fair', 'sirpur mahotsav', 'chakradhar samaroh', 'हरेली', 'पोरा', 'तीजा', 'छेरछेरा', 'अक्ती', 'बस्तर दशहरा', 'गोंचा पर्व', 'मड़ई मेला', 'राजिम कुंभ', 'शिवरीनारायण मेला', 'चक्रधर समारोह', 'छत्तीसगढ़ के मेले एवं त्योहार']
    },
    {
      id: 'sub_cg_schemes', subjectId: 'sub_cg_schemes',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ की प्रमुख योजनाएँ', titleEn: 'छत्तीसगढ़ की प्रमुख योजनाएँ',
      aliases: ['Major Schemes of CG', 'Chhattisgarh Schemes', 'छत्तीसगढ़ की प्रमुख योजनाएँ'],
      examIds: ALL_EXAM_CODES,
      keywords: ['mahtari vandan yojana', 'krishak unnati yojana', 'niyad nellanar', 'ramlala darshan yojana', 'charan paduka yojana', 'saraswati cycle yojana', 'मुख्यमंत्री योजना', 'महतारी वंदन योजना', 'कृषक उन्नति योजना', 'नियद नेल्लानार', 'रामलला दर्शन योजना', 'छत्तीसगढ़ की प्रमुख योजनाएँ']
    },
    {
      id: 'sub_cg_personalities', subjectId: 'sub_cg_personalities',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ के प्रमुख व्यक्तित्व', titleEn: 'छत्तीसगढ़ के प्रमुख व्यक्तित्व',
      aliases: ['Prominent Personalities of CG', 'Personalities of Chhattisgarh', 'छत्तीसगढ़ के प्रमुख व्यक्तित्व'],
      examIds: ALL_EXAM_CODES,
      keywords: ['guru ghasidas', 'veer narayan singh', 'thakur pyarelal singh', 'ravishankar shukla', 'wamanrao lakhe', 'e. raghavendra rao', 'barrister छेदीलाल', 'minimata', 'teejan bai', 'habib tanvir', 'देवदास बंजारे', 'गुरु घासीदास', 'ठाकुर प्यारेलाल सिंह', 'पंडित रविशंकर शुक्ल', 'वामनराव लाखे', 'मिनीमाता', 'तीजन बाई', 'हबीब तनवीर', 'छत्तीसगढ़ के प्रमुख व्यक्तित्व']
    },
    {
      id: 'sub_cg_awards', subjectId: 'sub_cg_awards',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ के पुरस्कार एवं सम्मान', titleEn: 'छत्तीसगढ़ के पुरस्कार एवं सम्मान',
      aliases: ['Awards & Honours of CG', 'Chhattisgarh Awards', 'छत्तीसगढ़ के पुरस्कार एवं सम्मान'],
      examIds: ALL_EXAM_CODES,
      keywords: ['rajya alankaran', 'shaheed veer narayan singh award', 'guru ghasidas award', 'minimata samman', 'gundadhur samman', 'chakradhar samman', 'dau mandraji samman', 'राज्य अलंकरण', 'शहीद वीर नारायण सिंह सम्मान', 'मिनीमाता सम्मान', 'गुण्डाधूर सम्मान', 'चक्रधर सम्मान', 'दाऊ मंदराजी सम्मान', 'छत्तीसगढ़ के पुरस्कार एवं सम्मान']
    },
    {
      id: 'sub_cg_districts', subjectId: 'sub_cg_districts',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ के जिले एवं संभाग', titleEn: 'छत्तीसगढ़ के जिले एवं संभाग',
      aliases: ['Districts & Divisions of CG', 'Chhattisgarh Districts', 'छत्तीसगढ़ के जिले एवं संभाग'],
      examIds: ALL_EXAM_CODES,
      keywords: ['33 districts of cg', '5 divisions of cg', 'raipur division', 'bilaspur division', 'bastar division', 'surguja division', 'durg division', 'manendragarh chirmiri bharatpur', 'mohla manpur', 'sarangarh bilaigarh', 'khairagarh chhuikhadan', 'shakti district', 'landlocked districts of cg', 'छत्तीसगढ़ के जिले', 'छत्तीसगढ़ के संभाग', 'भू-आवेष्ठित जिले', 'मनेन्द्रगढ़', 'सारंगढ़', 'खैरागढ़', 'सक्ती']
    },
    {
      id: 'sub_cg_minerals_industries', subjectId: 'sub_cg_minerals_industries',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ के खनिज एवं उद्योग', titleEn: 'छत्तीसगढ़ के खनिज एवं उद्योग',
      aliases: ['Minerals & Industries of CG', 'Chhattisgarh Minerals & Industries', 'छत्तीसगढ़ के खनिज एवं उद्योग'],
      examIds: ALL_EXAM_CODES,
      keywords: ['bailadila iron ore', 'korba coal', 'gevra', 'kusmunda', 'dipka', 'tin production cg', 'dantewada tin', 'bauxite mainpat', 'alexandrite', 'diamond payalikhand', 'bhilai steel plant', 'balco korba', 'ntpc korba', 'nmdc', 'secl bilaspur', 'बैलाडीला लौह अयस्क', 'कोरबा कोयला', 'गेवरा', 'कुसमुंडा', 'टिन उत्पादन', 'बॉक्साइट', 'भिलाई इस्पात संयंत्र', 'बाल्को', 'छत्तीसगढ़ के खनिज एवं उद्योग']
    },
    {
      id: 'sub_cg_national_parks', subjectId: 'sub_cg_national_parks',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ के राष्ट्रीय उद्यान एवं अभयारण्य', titleEn: 'छत्तीसगढ़ के राष्ट्रीय उद्यान एवं अभयारण्य',
      aliases: ['National Parks & Sanctuaries of CG', 'Forests, Wildlife & National Parks of CG', 'छत्तीसगढ़ के राष्ट्रीय उद्यान एवं अभयारण्य'],
      examIds: ALL_EXAM_CODES,
      keywords: ['indravati national park', 'kanger valley', 'guru ghasidas national park', 'achanakmar', 'barnawapara', 'sitanadi', 'udanti', 'tamor pingla', 'semarsot', 'badalkhol', 'gomarda', 'bhoramdeo sanctuary', 'pamed', 'bhairamgarh', 'lemru elephant reserve', 'इंद्रावती राष्ट्रीय उद्यान', 'कांगेर घाटी', 'गुरु घासीदास राष्ट्रीय उद्यान', 'अचानकमार', 'बारनवापारा', 'सीतानदी', 'उदंती', 'तमोर पिंगला', 'सेमरसोत', 'बादलखोल', 'गोमर्दा', 'लेमरू हाथी रिजर्व', 'छत्तीसगढ़ के राष्ट्रीय उद्यान एवं अभयारण्य']
    },
    {
      id: 'sub_cg_general_info', subjectId: 'sub_cg_general_info',
      mainCategoryId: 'cat_cg_gk', mainCategory: 'Chhattisgarh GK',
      titleHi: 'छत्तीसगढ़ सामान्य जानकारी', titleEn: 'छत्तीसगढ़ सामान्य जानकारी',
      aliases: ['Chhattisgarh General Information', 'Chhattisgarh General Knowledge', 'Chhattisgarh GK', 'CG GK', 'छत्तीसगढ़ सामान्य जानकारी', 'छत्तीसगढ़ सामान्य ज्ञान (CG GK)', 'छत्तीसगढ़ सामान्य ज्ञान (Chhattisgarh GK)', 'sub_cg_gs'],
      examIds: ALL_EXAM_CODES,
      keywords: ['state animal wild buffalo', 'pahari myna', 'sal tree', 'arpa pairi ke dhar', '1 november 2000', '26th state', 'chhattisgarh formation', 'cg census 2011', 'छत्तीसगढ़ राज्य पशु', 'पहाड़ी मैना', 'साल वृक्ष', 'अरपा पैरी के धार', '1 नवंबर 2000', 'छत्तीसगढ़ सामान्य जानकारी', 'छत्तीसगढ़ सामान्य ज्ञान']
    },

    // --- 2. INDIAN GS (16 Subject Folders) ---
    {
      id: 'sub_gs_ancient_history', subjectId: 'sub_gs_ancient_history',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'प्राचीन भारतीय इतिहास', titleEn: 'प्राचीन भारतीय इतिहास',
      aliases: ['Ancient Indian History', 'Ancient History of India', 'Ancient India', 'प्राचीन भारत का इतिहास', 'प्राचीन भारतीय इतिहास'],
      examIds: ALL_EXAM_CODES,
      keywords: ['indus valley', 'harappa', 'mohenjodaro', 'lothal', 'kalibangan', 'dholavira', 'rigveda', 'vedic', 'upanishad', 'gautama buddha', 'mahavira', 'jainism', 'buddhism', 'magadha', 'chandragupta maurya', 'ashoka', 'chanakya', 'arthashastra', 'samudragupta', 'gupta empire', 'harshavardhana', 'chola', 'pallava', 'संगम काल', 'सिंधु घाटी', 'हड़प्पा', 'मोहनजोदड़ो', 'लोथल', 'ऋग्वेद', 'वैदिक', 'उपनिषद', 'गौतम बुद्ध', 'महावीर स्वामी', 'बौद्ध धर्म', 'जैन धर्म', 'मौर्य साम्राज्य', 'अशोक', 'चाणक्य', 'गुप्त साम्राज्य', 'समुद्रगुप्त', 'हर्षवर्धन', 'प्राचीन भारतीय इतिहास']
    },
    {
      id: 'sub_gs_medieval_history', subjectId: 'sub_gs_medieval_history',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'मध्यकालीन भारतीय इतिहास', titleEn: 'मध्यकालीन भारतीय इतिहास',
      aliases: ['Medieval Indian History', 'Medieval History of India', 'Medieval India', 'मध्यकालीन भारत का इतिहास', 'मध्यकालीन भारतीय इतिहास'],
      examIds: ALL_EXAM_CODES,
      keywords: ['qutbuddin aibak', 'iltutmish', 'raziya sultan', 'balban', 'alauddin khilji', 'muhammad bin tughlaq', 'firoz shah tughlaq', 'babur', 'humayun', 'sher shah suri', 'akbar', 'jahangir', 'shah jahan', 'aurangzeb', 'mansabdari', 'vijayanagara', 'krishnadevaraya', 'shivaji', 'bhakti movement', 'sufi', 'कुतुबुद्दीन ऐबक', 'इल्तुतमिश', 'बलबन', 'अलाउद्दीन खिलजी', 'मुहम्मद बिन तुगलक', 'बाबर', 'हुमायूँ', 'शेरशाह सूरी', 'अकबर', 'जहाँगीर', 'शाहजहाँ', 'औरंगजेब', 'मनसबदारी', 'विजयनगर', 'कृष्णदेवराय', 'शिवाजी', 'भक्ति आंदोलन', 'सूफी', 'दिल्ली सल्तनत', 'मुगल साम्राज्य', 'मध्यकालीन भारतीय इतिहास']
    },
    {
      id: 'sub_gs_modern_history', subjectId: 'sub_gs_modern_history',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'आधुनिक भारतीय इतिहास', titleEn: 'आधुनिक भारतीय इतिहास',
      aliases: ['Modern Indian History', 'History of India', 'History', 'Indian History', 'Modern Indian History & Freedom Struggle', 'भारत का इतिहास (Indian History)', 'इतिहास (History)', 'आधुनिक भारतीय इतिहास', 'sub_history', 'sub_indian_history'],
      examIds: ALL_EXAM_CODES,
      keywords: ['battle of plassey', 'buxar', 'revolt of 1857', 'raja ram mohan roy', 'brahmo samaj', 'arya samaj', 'swami vivekananda', 'indian national congress', 'partition of bengal', 'swadeshi movement', 'mahatma gandhi', 'champaran', 'non cooperation', 'civil disobedience', 'dandi march', 'quit india', 'subhash chandra bose', 'bhagat singh', 'purna swaraj', 'lahore session', 'cabinet mission', 'mountbatten', 'प्लासी का युद्ध', 'बक्सर का युद्ध', '1857 की क्रांति', 'राजा राममोहन राय', 'ब्रह्म समाज', 'आर्य समाज', 'भारतीय राष्ट्रीय कांग्रेस', 'बंगाल विभाजन', 'असहयोग आंदोलन', 'सविनय अवज्ञा', 'दांडी मार्च', 'भारत छोड़ो आंदोलन', 'सुभाष चंद्र बोस', 'भगत सिंह', 'पूर्ण स्वराज', 'लाहौर अधिवेशन', 'कैबिनेट मिशन', 'आधुनिक भारतीय इतिहास']
    },
    {
      id: 'sub_gs_art_culture', subjectId: 'sub_gs_art_culture',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'भारतीय कला एवं संस्कृति', titleEn: 'भारतीय कला एवं संस्कृति',
      aliases: ['Indian Art & Culture', 'Art & Architecture', 'Art and Culture of India', 'भारतीय कला एवं संस्कृति'],
      examIds: ALL_EXAM_CODES,
      keywords: ['bharatanatyam', 'kathak', 'kathakali', 'kuchipudi', 'odissi', 'manipuri', 'mohiniyattam', 'sattriya', 'ajanta', 'ellora', 'khajuraho', 'konark', 'nagara style', 'dravida style', 'madhubani painting', 'hindustani music', 'carnatic music', 'unesco heritage india', 'भरतनाट्यम', 'कथक', 'कथकली', 'कुचिपुड़ी', 'ओडिसी', 'मोहिनीअट्टम', 'सत्रिया', 'अजंता', 'एलोरा', 'खजुराहो', 'कोणार्क', 'नागर शैली', 'द्रविड़ शैली', 'मधुबनी चित्रकला', 'भारतीय कला एवं संस्कृति']
    },
    {
      id: 'sub_gs_indian_geography', subjectId: 'sub_gs_indian_geography',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'भारतीय भूगोल', titleEn: 'भारतीय भूगोल',
      aliases: ['Indian Geography', 'Geography', 'Geography of India', 'Geography of India & World', 'भारत एवं विश्व का भूगोल (Geography)', 'भूगोल (Geography)', 'भारतीय भूगोल', 'sub_geography'],
      examIds: ALL_EXAM_CODES,
      keywords: ['himalaya', 'western ghats', 'eastern ghats', 'aravalli', 'vindhya', 'satpura', 'ganga river', 'brahmaputra', 'godavari', 'krishna river', 'kaveri', 'narmada', 'tapti', 'dakshin ganga', 'monsoon', 'black soil', 'alluvial soil', 'laterite', 'tropic of cancer india', 'हिमालय', 'पश्चिमी घाट', 'पूर्वी घाट', 'अरावली', 'विंध्य', 'सतपुड़ा', 'गंगा नदी', 'ब्रह्मपुत्र', 'गोदावरी', 'कृष्णा नदी', 'कावेरी', 'नर्मदा', 'दक्षिण गंगा', 'मानसून', 'काली मिट्टी', 'जलोढ़ मिट्टी', 'कर्क रेखा', 'भारतीय भूगोल']
    },
    {
      id: 'sub_gs_world_geography', subjectId: 'sub_gs_world_geography',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'विश्व भूगोल', titleEn: 'विश्व भूगोल',
      aliases: ['World Geography', 'Universe & World Geography', 'विश्व का भूगोल', 'विश्व भूगोल'],
      examIds: ALL_EXAM_CODES,
      keywords: ['solar system', 'planet', 'latitude', 'longitude', 'international date line', 'equator', 'troposphere', 'stratosphere', 'ozone layer', 'pacific ocean', 'atlantic ocean', 'mariana trench', 'andes', 'rockies', 'sahara desert', 'nile river', 'amazon river', 'ring of fire', 'सौरमंडल', 'अक्षांश', 'देशांतर', 'भूमध्य रेखा', 'क्षोभमंडल', 'समतापमंडल', 'प्रशांत महासागर', 'नील नदी', 'अमेज़न नदी', 'ज्वालामुखी', 'विश्व भूगोल']
    },
    {
      id: 'sub_gs_polity', subjectId: 'sub_gs_polity',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'भारतीय संविधान एवं राजव्यवस्था', titleEn: 'भारतीय संविधान एवं राजव्यवस्था',
      aliases: ['Indian Constitution & Polity', 'Indian Polity & Constitution', 'Indian Polity', 'Constitution', 'भारतीय संविधान एवं राजव्यवस्था (Polity)', 'भारतीय राजव्यवस्था एवं संविधान (Indian Polity)', 'sub_polity', 'sub_indian_polity'],
      examIds: ALL_EXAM_CODES,
      keywords: ['constitution', 'fundamental rights', 'fundamental duties', 'directive principles', 'dpsp', 'preamble', 'article 14', 'article 19', 'article 21', 'article 32', 'article 356', 'article 368', 'president of india', 'vice president', 'prime minister', 'parliament', 'lok sabha', 'rajya sabha', 'supreme court', 'election commission', 'cag', 'attorney general', '73rd amendment', '74th amendment', 'ambedkar', 'संविधान', 'मूल अधिकार', 'मौलिक अधिकार', 'मूल कर्तव्य', 'नीति निर्देशक तत्व', 'प्रस्तावना', 'अनुच्छेद', 'राष्ट्रपति', 'उपराष्ट्रपति', 'प्रधानमंत्री', 'संसद', 'लोकसभा', 'राज्यसभा', 'सर्वोच्च न्यायालय', 'निर्वाचन आयोग', 'नियंत्रक एवं महालेखा परीक्षक', 'संविधान संशोधन', 'भारतीय संविधान एवं राजव्यवस्था']
    },
    {
      id: 'sub_gs_economy', subjectId: 'sub_gs_economy',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'भारतीय अर्थव्यवस्था', titleEn: 'भारतीय अर्थव्यवस्था',
      aliases: ['Indian Economy', 'Economics', 'Economy', 'भारतीय अर्थव्यवस्था (Indian Economy)', 'अर्थव्यवस्था (Economics)', 'sub_economy', 'sub_indian_economy'],
      examIds: ALL_EXAM_CODES,
      keywords: ['gdp', 'gnp', 'national income', 'niti aayog', 'five year plan', 'reserve bank of india', 'rbi', 'monetary policy', 'repo rate', 'reverse repo', 'crr', 'slr', 'inflation', 'fiscal deficit', 'gst', 'union budget', 'sebi', 'nabard', 'financial inclusion', 'राष्ट्रीय आय', 'सकल घरेलू उत्पाद', 'नीति आयोग', 'पंचवर्षीय योजना', 'रिजर्व बैंक', 'मौद्रिक नीति', 'रेपो दर', 'मुद्रास्फीति', 'राजकोषीय घाटा', 'जीएसटी', 'नाबार्ड', 'सेबी', 'भारतीय अर्थव्यवस्था']
    },
    {
      id: 'sub_gs_general_science', subjectId: 'sub_gs_general_science',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'सामान्य विज्ञान', titleEn: 'सामान्य विज्ञान',
      aliases: ['General Science', 'General Science & Technology', 'सामान्य विज्ञान एवं प्रौद्योगिकी (Science & Tech)', 'सामान्य विज्ञान (General Science)', 'सामान्य विज्ञान', 'sub_science', 'sub_general_science'],
      examIds: ALL_EXAM_CODES,
      keywords: ['scientific instrument', 'barometer', 'hygrometer', 'seismograph', 'lactometer', 'everyday science', 'वैज्ञानिक उपकरण', 'बैरोमीटर', 'हाइग्रोमीटर', 'सीस्मोग्राफ', 'लैक्टोमीटर', 'सामान्य विज्ञान']
    },
    {
      id: 'sub_gs_physics', subjectId: 'sub_gs_physics',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'भौतिक विज्ञान', titleEn: 'भौतिक विज्ञान',
      aliases: ['Physics', 'भौतिकी', 'भौतिक विज्ञान'],
      examIds: ALL_EXAM_CODES,
      keywords: ['si unit', 'newton law', 'gravitation', 'kinetic energy', 'potential energy', 'refraction', 'total internal reflection', 'concave lens', 'convex mirror', 'myopia', 'hypermetropia', 'ohm law', 'electric current', 'transformer', 'doppler effect', 'मात्रक', 'न्यूटन के नियम', 'गुरुत्वाकर्षण', 'गतिज ऊर्जा', 'अपवर्तन', 'पूर्ण आंतरिक परावर्तन', 'अवतल लेंस', 'उत्तल दर्पण', 'ओम का नियम', 'विद्युत धारा', 'भौतिक विज्ञान']
    },
    {
      id: 'sub_gs_chemistry', subjectId: 'sub_gs_chemistry',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'रसायन विज्ञान', titleEn: 'रसायन विज्ञान',
      aliases: ['Chemistry', 'रसायन शास्त्र', 'रसायन विज्ञान'],
      examIds: ALL_EXAM_CODES,
      keywords: ['atomic number', 'mass number', 'isotope', 'periodic table', 'mendeleev', 'ph value', 'sodium bicarbonate', 'bleaching powder', 'plaster of paris', 'allotrope of carbon', 'bauxite', 'hematite', 'galena', 'polymer', 'परमाणु क्रमांक', 'समस्थानिक', 'आवर्त सारणी', 'पीएच मान', 'विरंजक चूर्ण', 'प्लास्टर ऑफ पेरिस', 'अम्ल', 'क्षार', 'लवण', 'रसायन विज्ञान']
    },
    {
      id: 'sub_gs_biology', subjectId: 'sub_gs_biology',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'जीव विज्ञान', titleEn: 'जीव विज्ञान',
      aliases: ['Biology', 'Botany & Zoology', 'जीव विज्ञान'],
      examIds: ALL_EXAM_CODES,
      keywords: ['mitochondria', 'ribosome', 'lysosome', 'cell wall', 'dna', 'rna', 'chromosome', 'photosynthesis', 'xylem', 'phloem', 'hemoglobin', 'red blood cell', 'liver', 'pancreas', 'insulin', 'pituitary gland', 'nephron', 'vitamin a', 'vitamin b', 'vitamin c', 'vitamin d', 'vitamin k', 'scurvy', 'rickets', 'malaria', 'dengue', 'tuberculosis', 'माइटोकॉन्ड्रिया', 'राइबोसोम', 'लाइसोसोम', 'कोशिका', 'प्रकाश संश्लेषण', 'जाइलम', 'फ्लोएम', 'हीमोग्लोबिन', 'यकृत', 'अग्न्याशय', 'इंसुलिन', 'पीयूष ग्रंथि', 'विटामिन', 'स्कर्वी', 'रिकेट्स', 'जीव विज्ञान']
    },
    {
      id: 'sub_gs_environment', subjectId: 'sub_gs_environment',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'पर्यावरण एवं पारिस्थितिकी', titleEn: 'पर्यावरण एवं पारिस्थितिकी',
      aliases: ['Environment & Ecology', 'Environment, Ecology & Biodiversity', 'पर्यावरण, पारिस्थितिकी एवं जैव-विविधता', 'पर्यावरण एवं पारिस्थितिकी', 'sub_environment'],
      examIds: ALL_EXAM_CODES,
      keywords: ['ecosystem', 'food chain', 'trophic level', 'biodiversity hotspot', 'red data book', 'iucn', 'ramsar site', 'project tiger', 'montreal protocol', 'kyoto protocol', 'paris agreement', 'greenhouse gas', 'global warming', 'acid rain', 'पारिस्थितिकी तंत्र', 'खाद्य श्रृंखला', 'जैव विविधता', 'रामसर स्थल', 'प्रोजेक्ट टाइगर', 'मॉन्ट्रियल प्रोटोकॉल', 'क्योटो प्रोटोकॉल', 'ग्रीनहाउस गैस', 'अम्ल वर्षा', 'पर्यावरण एवं पारिस्थितिकी']
    },
    {
      id: 'sub_gs_sci_tech', subjectId: 'sub_gs_sci_tech',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'विज्ञान एवं प्रौद्योगिकी', titleEn: 'विज्ञान एवं प्रौद्योगिकी',
      aliases: ['Science & Technology', 'Computer & Information Technology', 'Computer Knowledge', 'कंप्यूटर एवं सूचना प्रौद्योगिकी (Computer & IT)', 'कंप्यूटर ज्ञान (Computer Knowledge)', 'विज्ञान एवं प्रौद्योगिकी', 'sub_computer', 'sub_computer_it'],
      examIds: ALL_EXAM_CODES,
      keywords: ['isro', 'chandrayaan', 'gaganyaan', 'aditya l1', 'pslv', 'gslv', 'drdo', 'agni missile', 'brahmos', 'biotechnology', 'nanotechnology', 'artificial intelligence', 'cpu', 'cache memory', 'ram', 'rom', 'operating system', 'इसरो', 'चंद्रयान', 'गगनयान', 'डीआरडीओ', 'ब्रह्मोस', 'कंप्यूटर', 'कैश मेमोरी', 'रैम', 'रोम', 'ऑपरेटिंग सिस्टम', 'विज्ञान एवं प्रौद्योगिकी']
    },
    {
      id: 'sub_gs_intl_org', subjectId: 'sub_gs_intl_org',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'अंतरराष्ट्रीय संगठन एवं संबंध', titleEn: 'अंतरराष्ट्रीय संगठन एवं संबंध',
      aliases: ['International Organizations & Relations', 'International Organizations', 'अंतरराष्ट्रीय संगठन एवं संबंध'],
      examIds: ALL_EXAM_CODES,
      keywords: ['united nations', 'unsc', 'who', 'wto', 'imf', 'world bank', 'unesco', 'unicef', 'brics', 'g20', 'asean', 'saarc', 'bimstec', 'sco', 'nato', 'संयुक्त राष्ट्र', 'विश्व स्वास्थ्य संगठन', 'विश्व बैंक', 'अंतरराष्ट्रीय मुद्रा कोष', 'ब्रिक्स', 'जी-20', 'आसियान', 'सार्क', 'बिमस्टेक', 'अंतरराष्ट्रीय संगठन']
    },
    {
      id: 'sub_gs_gk', subjectId: 'sub_gs_gk',
      mainCategoryId: 'cat_indian_gs', mainCategory: 'Indian GS',
      titleHi: 'सामान्य ज्ञान', titleEn: 'सामान्य ज्ञान',
      aliases: ['General Knowledge', 'Current Affairs', 'Current Affairs (CG, National & International)', 'Pedagogy, Rural Dev & Dept. Acts', 'Child Development & Pedagogy', 'समसामयिकी (Current Affairs - CG, India & World)', 'समसामयिकी (Current Affairs)', 'सामान्य ज्ञान', 'sub_current_affairs', 'sub_pedagogy', 'sub_pedagogy_rural'],
      examIds: ALL_EXAM_CODES,
      keywords: ['current affairs', 'bharat ratna', 'padma vibhushan', 'nobel prize', 'olympics', 'asian games', 'important days', 'world environment day', 'yoga day', 'समसामयिकी', 'भारतरत्न', 'नोबेल पुरस्कार', 'ओलंपिक', 'महत्वपूर्ण दिवस', 'सामान्य ज्ञान']
    },

    // --- 3. MATHS (Direct Topic Library) ---
    {
      id: 'sub_maths', subjectId: 'sub_maths',
      mainCategoryId: 'cat_maths', mainCategory: 'Maths',
      titleHi: 'गणित (Maths)', titleEn: 'Maths',
      aliases: ['Mathematics', 'Quantitative Aptitude & Reasoning', 'Quantitative Aptitude', 'गणित एवं तर्कशक्ति (Maths & Reasoning)', 'गणित (Mathematics)', 'गणित', 'sub_mathematics', 'sub_aptitude_reasoning'],
      examIds: ALL_EXAM_CODES,
      keywords: ['number system', 'simplification', 'lcm', 'hcf', 'percentage', 'ratio', 'proportion', 'average', 'profit', 'loss', 'discount', 'simple interest', 'compound interest', 'time and work', 'pipe and cistern', 'speed distance', 'boat and stream', 'algebra', 'quadratic equation', 'geometry', 'mensuration', 'trigonometry', 'probability', 'permutation', 'संख्या पद्धति', 'सरलीकरण', 'लघुत्तम', 'महत्तम', 'प्रतिशत', 'अनुपात', 'औसत', 'लाभ', 'हानि', 'बट्टा', 'साधारण ब्याज', 'चक्रवृद्धि ब्याज', 'समय और कार्य', 'चाल समय दूरी', 'नाव एवं धारा', 'बीजगणित', 'ज्यामिति', 'क्षेत्रमिति', 'त्रिकोणमिति', 'प्रायिकता']
    },

    // --- 4. ENGLISH (Direct Topic Library) ---
    {
      id: 'sub_english', subjectId: 'sub_english',
      mainCategoryId: 'cat_english', mainCategory: 'English',
      titleHi: 'अंग्रेजी (English)', titleEn: 'English',
      aliases: ['General English', 'English Language', 'English Grammar', 'सामान्य अंग्रेजी (English)', 'सामान्य अंग्रेजी'],
      examIds: ALL_EXAM_CODES,
      keywords: ['parts of speech', 'noun', 'pronoun', 'verb', 'adjective', 'adverb', 'tense', 'articles', 'preposition', 'conjunction', 'subject verb agreement', 'active voice', 'passive voice', 'direct speech', 'indirect speech', 'synonym', 'antonym', 'one word substitution', 'idioms', 'phrases', 'spelling', 'error detection', 'sentence improvement', 'fill in the blanks', 'reading comprehension', 'cloze test']
    },

    // --- 5. HINDI (Direct Topic Library) ---
    {
      id: 'sub_hindi', subjectId: 'sub_hindi',
      mainCategoryId: 'cat_hindi', mainCategory: 'Hindi',
      titleHi: 'हिन्दी (Hindi)', titleEn: 'Hindi',
      aliases: ['General Hindi', 'Hindi & English Language', 'सामान्य हिन्दी एवं अंग्रेजी भाषा (Language)', 'सामान्य हिन्दी (Hindi)', 'सामान्य हिन्दी', 'हिन्दी व्याकरण', 'sub_languages'],
      examIds: ALL_EXAM_CODES,
      keywords: ['वर्णमाला', 'संधि', 'समास', 'उपसर्ग', 'प्रत्यय', 'संज्ञा', 'सर्वनाम', 'विशेषण', 'क्रिया', 'अव्यय', 'लिंग', 'वचन', 'कारक', 'काल', 'वाच्य', 'पर्यायवाची', 'विलोम', 'अनेकार्थी', 'मुहावरे', 'लोकोक्तियाँ', 'तत्सम', 'तद्भव', 'वर्तनी', 'वाक्य शुद्धि', 'रस', 'छंद', 'अलंकार', 'अपठित गद्यांश']
    },

    // --- 6. REASONING (Direct Topic Library) ---
    {
      id: 'sub_reasoning', subjectId: 'sub_reasoning',
      mainCategoryId: 'cat_reasoning', mainCategory: 'Reasoning',
      titleHi: 'तर्कशक्ति (Reasoning)', titleEn: 'Reasoning',
      aliases: ['Logical Reasoning', 'General Intelligence & Reasoning', 'Mental Ability', 'तर्कशक्ति एवं रीजनिंग (Reasoning)', 'रीजनिंग', 'तर्कशक्ति'],
      examIds: ALL_EXAM_CODES,
      keywords: ['analogy', 'classification', 'odd one out', 'number series', 'letter series', 'coding decoding', 'blood relation', 'direction sense', 'order and ranking', 'seating arrangement', 'puzzle', 'venn diagram', 'syllogism', 'statement and conclusion', 'clock', 'calendar', 'dice', 'cube', 'mirror image', 'water image', 'paper folding', 'सादृश्यता', 'वर्गीकरण', 'संख्या श्रृंखला', 'अक्षर श्रृंखला', 'कोडिंग-डिकोडिंग', 'रक्त संबंध', 'दिशा एवं दूरी', 'क्रम एवं रैंकिंग', 'बैठने की व्यवस्था', 'वेन आरेख', 'न्याय निगमन', 'कथन एवं निष्कर्ष', 'घड़ी', 'कैलेंडर', 'पासा', 'दर्पण प्रतिबिंब', 'जल प्रतिबिंब']
    },

    // --- UNCATEGORISED FALLBACK ---
    {
      id: 'sub_uncategorised', subjectId: 'sub_uncategorised',
      mainCategoryId: 'cat_uncategorised', mainCategory: 'Uncategorised',
      titleHi: 'अवर्गीकृत प्रश्न (Uncategorised)', titleEn: 'Uncategorised',
      aliases: ['Needs Categorisation', 'Uncategorized', 'अवर्गीकृत'],
      examIds: ALL_EXAM_CODES,
      keywords: []
    }
  ];

  // ============================================================================
  // PART 1.A: TOPIC FOLDERS FOR ALL 6 MAIN LIBRARIES
  // ============================================================================
  const DEFAULT_TOPICS = [
    // --- 1. Chhattisgarh GK Topic Folders ---
    { id: 'top_cg_hist_ancient', topicId: 'top_cg_hist_ancient', subjectId: 'sub_cg_history', mainCategoryId: 'cat_cg_gk', titleHi: 'प्राचीन छत्तीसगढ़ का इतिहास', titleEn: 'प्राचीन छत्तीसगढ़ का इतिहास', aliases: ['Ancient History of CG'], keywords: ['शरभपुरीय', 'पाण्डुवंश', 'सोमवंश', 'नल वंश', 'राजर्षितुल्यकुल', 'सिरपुर', 'sharabhapuriya', 'panduvamshi', 'ancient cg'] },
    { id: 'top_cg_hist_medieval', topicId: 'top_cg_hist_medieval', subjectId: 'sub_cg_history', mainCategoryId: 'cat_cg_gk', titleHi: 'कलचुरी एवं मराठा काल', titleEn: 'कलचुरी एवं मराठा काल', aliases: ['Kalchuri & Maratha Period'], keywords: ['कलचुरी', 'रतनपुर', 'तुम्माण', 'कलिंगराज', 'रत्नदेव', 'जाजल्लदेव', 'मराठा', 'बिंबाजी', 'सूबा शासन', 'काकतीय', 'kalchuri', 'maratha', 'ratanpur', 'tumman'] },
    { id: 'top_cg_hist_modern', topicId: 'top_cg_hist_modern', subjectId: 'sub_cg_history', mainCategoryId: 'cat_cg_gk', titleHi: 'आधुनिक छत्तीसगढ़ एवं स्वतंत्रता आंदोलन', titleEn: 'आधुनिक छत्तीसगढ़ एवं स्वतंत्रता आंदोलन', aliases: ['History of Chhattisgarh', 'top_cg_history'], keywords: ['वीर नारायण सिंह', 'सोनाखान', 'कंडेल नहर', 'जंगल सत्याग्रह', 'सविनय अवज्ञा', 'असहयोग', 'भूमकाल', 'गुण्डाधूर', 'परलकोट', 'हल्बा विद्रोह', 'History of Chhattisgarh', 'freedom struggle cg'] },

    { id: 'top_cg_geo_physical', topicId: 'top_cg_geo_physical', subjectId: 'sub_cg_geography', mainCategoryId: 'cat_cg_gk', titleHi: 'भौतिक विभाजन एवं भू-गर्भिक संरचना', titleEn: 'भौतिक विभाजन एवं भू-गर्भिक संरचना', aliases: ['Geography & Natural Resources of CG', 'Geography & Climate of CG', 'Chhattisgarh Geography', 'top_cg_geography'], keywords: ['मेनपाट', 'सामरीपाट', 'गौरलाटा', 'बैलाडीला', 'नंदीराज', 'दण्डकारण्य', 'मैकल', 'छत्तीसगढ़ का मैदान', 'कडप्पा', 'गोंडवाना', 'धारवाड़', 'Geography & Natural Resources of CG', 'physical division cg'] },
    { id: 'top_cg_geo_rivers', topicId: 'top_cg_geo_rivers', subjectId: 'sub_cg_geography', mainCategoryId: 'cat_cg_gk', titleHi: 'अपवाह तंत्र एवं प्रमुख नदियाँ', titleEn: 'अपवाह तंत्र एवं प्रमुख नदियाँ', aliases: ['Rivers & Waterfalls of CG'], keywords: ['महानदी', 'शिवनाथ', 'इंद्रावती', 'हसदेव', 'अर्पा', 'पैरी', 'जोंक', 'शबरी', 'रिहंद', 'कन्हार', 'सिहावा', 'गंगरेल', 'मिनीमाता बांगो', 'mahanadi', 'shivnath', 'indravati', 'hasdeo'] },
    { id: 'top_cg_geo_climate_soil', topicId: 'top_cg_geo_climate_soil', subjectId: 'sub_cg_geography', mainCategoryId: 'cat_cg_gk', titleHi: 'जलवायु, मिट्टी एवं सिंचाई परियोजनाएँ', titleEn: 'जलवायु, मिट्टी एवं सिंचाई परियोजनाएँ', aliases: [], keywords: ['मटासी', 'कन्हार मिट्टी', 'भाठा', 'डोरसा', 'जलवायु', 'सिंचाई परियोजना', 'matasi', 'dorsa', 'soil of cg'] },

    { id: 'top_cg_pol_exec', topicId: 'top_cg_pol_exec', subjectId: 'sub_cg_polity', mainCategoryId: 'cat_cg_gk', titleHi: 'राज्यपाल, मुख्यमंत्री, विधानसभा एवं न्यायपालिका', titleEn: 'राज्यपाल, मुख्यमंत्री, विधानसभा एवं न्यायपालिका', aliases: ['Urban Local Bodies & District Administration'], keywords: ['छत्तीसगढ़ विधानसभा', 'मुख्यमंत्री', 'राज्यपाल', 'बिलासपुर उच्च न्यायालय', 'लोकायुक्त', 'प्रशासनिक इकाइयाँ'] },
    { id: 'top_cg_pol_panchayat', topicId: 'top_cg_pol_panchayat', subjectId: 'sub_cg_polity', mainCategoryId: 'cat_cg_gk', titleHi: 'पंचायती राज एवं नगरीय निकाय', titleEn: 'पंचायती राज एवं नगरीय निकाय', aliases: ['Chhattisgarh Panchayati Raj Act 1993', 'Panchayati Raj & Local Administration', 'top_cg_panchayat_act'], keywords: ['पंचायती राज', 'ग्राम पंचायत', 'ग्राम सभा', 'जनपद पंचायत', 'जिला पंचायत', 'नगर निगम', 'सरपंच', 'Panchayati Raj & Local Administration in CG', 'panchayati raj cg'] },

    { id: 'top_cg_econ_budget', topicId: 'top_cg_econ_budget', subjectId: 'sub_cg_economy', mainCategoryId: 'cat_cg_gk', titleHi: 'राज्य बजट एवं आर्थिक सर्वेक्षण', titleEn: 'राज्य बजट एवं आर्थिक सर्वेक्षण', aliases: ['Economy, Budget & Schemes of CG', 'CG Economy, Forest & Agriculture', 'top_cg_economy_schemes'], keywords: ['आर्थिक सर्वेक्षण', 'छत्तीसगढ़ बजट', 'सकल राज्य घरेलू उत्पाद', 'प्रति व्यक्ति आय', 'Economy, Budget & Schemes of CG', 'cg economic survey', 'cg budget'] },
    { id: 'top_cg_econ_agri', topicId: 'top_cg_econ_agri', subjectId: 'sub_cg_economy', mainCategoryId: 'cat_cg_gk', titleHi: 'कृषि, वानिकी एवं ग्रामीण अर्थव्यवस्था', titleEn: 'कृषि, वानिकी एवं ग्रामीण अर्थव्यवस्था', aliases: [], keywords: ['धान खरीदी', 'समर्थन मूल्य', 'लघु वनोपज', 'तेंदूपत्ता', 'पशुपालन', 'मत्स्य पालन', 'सहकारिता'] },

    { id: 'top_cg_art_craft', topicId: 'top_cg_art_craft', subjectId: 'sub_cg_art_culture', mainCategoryId: 'cat_cg_gk', titleHi: 'लोक चित्रकला, शिल्पकला एवं आभूषण', titleEn: 'लोक चित्रकला, शिल्पकला एवं आभूषण', aliases: [], keywords: ['ढोकरा', 'घड़वा', 'बेल मेटल', 'गोदना', 'तुम्बा', 'बांस शिल्प', 'आभूषण', 'सूता', 'नाचा', 'रहस'] },
    { id: 'top_cg_art_sites', topicId: 'top_cg_art_sites', subjectId: 'sub_cg_art_culture', mainCategoryId: 'cat_cg_gk', titleHi: 'पुरातात्विक, ऐतिहासिक एवं सांस्कृतिक स्थल', titleEn: 'पुरातात्विक, ऐतिहासिक एवं सांस्कृतिक स्थल', aliases: [], keywords: ['भोरमदेव', 'सिरपुर', 'राजिम', 'मल्हार', 'तालागांव', 'बारसूर', 'दंतेवाड़ा', 'डोंगरगढ़', 'शिवरीनारायण', 'चंपारण्य', 'मैनपाट'] },

    { id: 'top_cg_tribes_main', topicId: 'top_cg_tribes_main', subjectId: 'sub_cg_tribes', mainCategoryId: 'cat_cg_gk', titleHi: 'प्रमुख जनजातियाँ एवं विशेष पिछड़ी जनजातियाँ (PVTG)', titleEn: 'प्रमुख जनजातियाँ एवं विशेष पिछड़ी जनजातियाँ (PVTG)', aliases: ['Tribes, Folk Art & Culture of CG', 'Tribes, Art & Culture', 'top_cg_tribes_culture'], keywords: ['गोंड', 'बैगा', 'अबूझमाड़िया', 'कमार', 'बिरहोर', 'पहाड़ी कोरवा', 'भुंजिया', 'पंडो', 'हल्बा', 'भतरा', 'उरांव', 'कंवर', 'बिंझवार', 'Tribes, Folk Art & Culture of CG', 'pvtg cg'] },
    { id: 'top_cg_tribes_customs', topicId: 'top_cg_tribes_customs', subjectId: 'sub_cg_tribes', mainCategoryId: 'cat_cg_gk', titleHi: 'युवागृह, विवाह एवं जनजातीय परंपराएँ', titleEn: 'युवागृह, विवाह एवं जनजातीय परंपराएँ', aliases: [], keywords: ['घोटुल', 'धुमकुरिया', 'चेलिक', 'मोटियारी', 'लमसैना', 'पाढोनी', 'बूढ़ादेव', 'आंगादेव', 'सल्फी', 'ताड़ी', 'ghotul'] },

    { id: 'top_cg_dance_song', topicId: 'top_cg_folk_dance_song', subjectId: 'sub_cg_folk_dance_song', mainCategoryId: 'cat_cg_gk', titleHi: 'प्रमुख लोकनृत्य, लोकगीत एवं लोकनाट्य', titleEn: 'प्रमुख लोकनृत्य, लोकगीत एवं लोकनाट्य', aliases: [], keywords: ['सुआ', 'पंथी', 'राउत नाचा', 'कर्मा', 'ककसार', 'गौर नृत्य', 'सैला', 'सरहुल', 'पंडवानी', 'भरथरी', 'चंदैनी गोंदा', 'ददरिया', 'भोजली', 'सोहर', 'बिहाव गीत'] },

    { id: 'top_cg_lit_lang', topicId: 'top_cg_lit_lang', subjectId: 'sub_cg_literature', mainCategoryId: 'cat_cg_gk', titleHi: 'छत्तीसगढ़ी भाषा, व्याकरण एवं साहित्यकार', titleEn: 'छत्तीसगढ़ी भाषा, व्याकरण एवं साहित्यकार', aliases: ['Language, Literature & Personalities of CG', 'top_cg_literature_lang'], keywords: ['छत्तीसगढ़ी भाषा', 'जनऊला', 'हाना', 'मुकुटधर पांडेय', 'लोचन प्रसाद पांडेय', 'सुंदरलाल शर्मा', 'पदुमलाल पुन्नालाल बख्शी', 'माधवराव सप्रे', 'छत्तीसगढ़ मित्र', 'Language, Literature & Personalities of CG'] },

    { id: 'top_cg_festivals_main', topicId: 'top_cg_festivals_main', subjectId: 'sub_cg_fairs_festivals', mainCategoryId: 'cat_cg_gk', titleHi: 'छत्तीसगढ़ के प्रमुख पर्व, मेले एवं महोत्सव', titleEn: 'छत्तीसगढ़ के प्रमुख पर्व, मेले एवं महोत्सव', aliases: [], keywords: ['हरेली', 'पोरा', 'तीजा', 'छेरछेरा', 'अक्ती', 'बस्तर दशहरा', 'गोंचा पर्व', 'मड़ई', 'राजिम कुंभ', 'चक्रधर समारोह', 'सिरपुर महोत्सव', 'भोरमदेव महोत्सव'] },

    { id: 'top_cg_schemes_main', topicId: 'top_cg_schemes_main', subjectId: 'sub_cg_schemes', mainCategoryId: 'cat_cg_gk', titleHi: 'कल्याणकारी एवं फ्लैगशिप सरकारी योजनाएँ', titleEn: 'कल्याणकारी एवं फ्लैगशिप सरकारी योजनाएँ', aliases: [], keywords: ['महतारी वंदन', 'कृषक उन्नति', 'नियद नेल्लानार', 'रामलला दर्शन', 'चरण पादुका', 'सरस्वती साइकिल', 'मुख्यमंत्री खाद्यान्न'] },

    { id: 'top_cg_person_main', topicId: 'top_cg_person_main', subjectId: 'sub_cg_personalities', mainCategoryId: 'cat_cg_gk', titleHi: 'छत्तीसगढ़ के प्रमुख व्यक्तित्व एवं योगदान', titleEn: 'छत्तीसगढ़ के प्रमुख व्यक्तित्व एवं योगदान', aliases: [], keywords: ['गुरु घासीदास', 'ठाकुर प्यारेलाल', 'रविशंकर शुक्ल', 'वामनराव लाखे', 'मिनीमाता', 'तीजन बाई', 'हबीब तनवीर', 'देवदास बंजारे'] },

    { id: 'top_cg_awards_main', topicId: 'top_cg_awards_main', subjectId: 'sub_cg_awards', mainCategoryId: 'cat_cg_gk', titleHi: 'राज्य अलंकरण एवं राष्ट्रीय सम्मान', titleEn: 'राज्य अलंकरण एवं राष्ट्रीय सम्मान', aliases: [], keywords: ['राज्य अलंकरण', 'शहीद वीर नारायण सिंह सम्मान', 'गुण्डाधूर सम्मान', 'मिनीमाता सम्मान', 'गुरु घासीदास सम्मान', 'चक्रधर सम्मान', 'दाऊ मंदराजी सम्मान'] },

    { id: 'top_cg_districts_main', topicId: 'top_cg_districts_main', subjectId: 'sub_cg_districts', mainCategoryId: 'cat_cg_gk', titleHi: 'संभाग, जिलों का गठन एवं जिलावार परिचय', titleEn: 'संभाग, जिलों का गठन एवं जिलावार परिचय', aliases: [], keywords: ['33 जिले', '5 संभाग', 'मनेन्द्रगढ़', 'सारंगढ़', 'खैरागढ़', 'सक्ती', 'मोहला मानपुर', 'भू-आवेष्ठित जिले', 'सीमावर्ती राज्य'] },

    { id: 'top_cg_minerals_main', topicId: 'top_cg_minerals_main', subjectId: 'sub_cg_minerals_industries', mainCategoryId: 'cat_cg_gk', titleHi: 'खनिज संसाधन, ऊर्जा एवं प्रमुख उद्योग', titleEn: 'खनिज संसाधन, ऊर्जा एवं प्रमुख उद्योग', aliases: [], keywords: ['बैलाडीला', 'कोरबा कोयला', 'टिन', 'बॉक्साइट', 'हीरा', 'अलेक्जेंड्राइट', 'भिलाई इस्पात संयंत्र', 'बाल्को', 'एनएमडीसी', 'एसईसीएल', 'एनटीपीसी', 'औद्योगिक नीति'] },

    { id: 'top_cg_parks_main', topicId: 'top_cg_parks_main', subjectId: 'sub_cg_national_parks', mainCategoryId: 'cat_cg_gk', titleHi: 'राष्ट्रीय उद्यान, अभयारण्य एवं टाइगर रिजर्व', titleEn: 'राष्ट्रीय उद्यान, अभयारण्य एवं टाइगर रिजर्व', aliases: ['Forests, Wildlife & National Parks of CG', 'top_cg_forest_wildlife'], keywords: ['इंद्रावती राष्ट्रीय उद्यान', 'कांगेर घाटी', 'गुरु घासीदास राष्ट्रीय उद्यान', 'अचानकमार', 'बारनवापारा', 'सीतानदी', 'उदंती', 'तमोर पिंगला', 'सेमरसोत', 'बादलखोल', 'गोमर्दा', 'लेमरू', 'Forests, Wildlife & National Parks of CG'] },

    { id: 'top_cg_gen_info_main', topicId: 'top_cg_gen_info_main', subjectId: 'sub_cg_general_info', mainCategoryId: 'cat_cg_gk', titleHi: 'राज्य प्रतीक, जनगणना एवं सामान्य परिचय', titleEn: 'राज्य प्रतीक, जनगणना एवं सामान्य परिचय', aliases: ['Chhattisgarh Current Affairs'], keywords: ['1 नवंबर 2000', '26वां राज्य', 'वन भैंसा', 'पहाड़ी मैना', 'साल वृक्ष', 'अरपा पैरी के धार', 'छत्तीसगढ़ जनगणना', 'छत्तीसगढ़ समसामयिकी'] },

    // --- 2. Indian GS Topic Folders ---
    { id: 'top_gs_anc_indus_vedic', topicId: 'top_gs_anc_indus_vedic', subjectId: 'sub_gs_ancient_history', mainCategoryId: 'cat_indian_gs', titleHi: 'सिंधु घाटी सभ्यता एवं वैदिक काल', titleEn: 'सिंधु घाटी सभ्यता एवं वैदिक काल', aliases: ['Ancient Indian History', 'Ancient History of India', 'top_hist_ancient'], keywords: ['सिंधु घाटी', 'हड़प्पा', 'मोहनजोदड़ो', 'लोथल', 'कालीबंगा', 'धौलावीरा', 'ऋग्वेद', 'वैदिक', 'उपनिषद', 'indus valley', 'harappa', 'vedic'] },
    { id: 'top_gs_anc_buddha_maurya', topicId: 'top_gs_anc_buddha_maurya', subjectId: 'sub_gs_ancient_history', mainCategoryId: 'cat_indian_gs', titleHi: 'बौद्ध-जैन धर्म, मौर्य एवं गुप्त साम्राज्य', titleEn: 'बौद्ध-जैन धर्म, मौर्य एवं गुप्त साम्राज्य', aliases: [], keywords: ['गौतम बुद्ध', 'महावीर', 'बौद्ध', 'जैन', 'मगध', 'चंद्रगुप्त मौर्य', 'अशोक', 'चाणक्य', 'समुद्रगुप्त', 'गुप्त वंश', 'हर्षवर्धन', 'चोल', 'Ancient History of India', 'maurya', 'gupta'] },

    { id: 'top_gs_med_sultanate_mughal', topicId: 'top_gs_med_sultanate_mughal', subjectId: 'sub_gs_medieval_history', mainCategoryId: 'cat_indian_gs', titleHi: 'दिल्ली सल्तनत, मुगल साम्राज्य एवं भक्ति आंदोलन', titleEn: 'दिल्ली सल्तनत, मुगल साम्राज्य एवं भक्ति आंदोलन', aliases: ['Medieval Indian History', 'Medieval History of India', 'top_hist_medieval'], keywords: ['दिल्ली सल्तनत', 'ऐबक', 'इल्तुतमिश', 'खिलजी', 'तुगलक', 'बाबर', 'अकबर', 'शाहजहाँ', 'औरंगजेब', 'शिवाजी', 'विजयनगर', 'भक्ति आंदोलन', 'सूफी', 'Medieval History of India', 'sultanate', 'mughal'] },

    { id: 'top_gs_mod_freedom', topicId: 'top_gs_mod_freedom', subjectId: 'sub_gs_modern_history', mainCategoryId: 'cat_indian_gs', titleHi: '1857 की क्रांति एवं भारतीय राष्ट्रीय आंदोलन', titleEn: '1857 की क्रांति एवं भारतीय राष्ट्रीय आंदोलन', aliases: ['Modern Indian History', 'Modern Indian History & Freedom Struggle', 'top_hist_modern'], keywords: ['प्लासी', 'बक्सर', '1857 की क्रांति', 'राजा राममोहन राय', 'कांग्रेस', 'बंगाल विभाजन', 'महात्मा गांधी', 'चंपारण', 'असहयोग', 'सविनय अवज्ञा', 'दांडी मार्च', 'भारत छोड़ो', 'सुभाष चंद्र बोस', 'भगत सिंह', 'पूर्ण स्वराज', 'लाहौर अधिवेशन', 'Modern Indian History & Freedom Struggle'] },

    { id: 'top_gs_art_main', topicId: 'top_gs_art_main', subjectId: 'sub_gs_art_culture', mainCategoryId: 'cat_indian_gs', titleHi: 'शास्त्रीय नृत्य, संगीत, स्थापत्य एवं चित्रकला', titleEn: 'शास्त्रीय नृत्य, संगीत, स्थापत्य एवं चित्रकला', aliases: ['Art & Architecture', 'top_hist_art'], keywords: ['भरतनाट्यम', 'कथक', 'कथकली', 'कुचिपुड़ी', 'ओडिसी', 'मोहिनीअट्टम', 'सत्रिया', 'अजंता', 'एलोरा', 'खजुराहो', 'कोणार्क', 'मधुबनी', 'यूनेस्को धरोहर'] },

    { id: 'top_gs_igeo_phys_rivers', topicId: 'top_gs_igeo_phys_rivers', subjectId: 'sub_gs_indian_geography', mainCategoryId: 'cat_indian_gs', titleHi: 'भारत का भौतिक विभाजन एवं नदी तंत्र', titleEn: 'भारत का भौतिक विभाजन एवं नदी तंत्र', aliases: ['Indian Geography', 'Physical Features & River Systems of India', 'Physical Features & River Systems', 'top_geo_physical_rivers', 'top_geo_indian'], keywords: ['हिमालय', 'पश्चिमी घाट', 'पूर्वी घाट', 'अरावली', 'सतपुड़ा', 'गंगा', 'ब्रह्मपुत्र', 'गोदावरी', 'कृष्णा', 'कावेरी', 'नर्मदा', 'दक्षिण गंगा', 'Physical Features & River Systems'] },
    { id: 'top_gs_igeo_climate_res', topicId: 'top_gs_igeo_climate_res', subjectId: 'sub_gs_indian_geography', mainCategoryId: 'cat_indian_gs', titleHi: 'जलवायु, मिट्टी, कृषि एवं खनिज संसाधन', titleEn: 'जलवायु, मिट्टी, कृषि एवं खनिज संसाधन', aliases: ['Climate, Soil, Agriculture & Minerals', 'top_geo_climate_agri'], keywords: ['मानसून', 'काली मिट्टी', 'जलोढ़ मिट्टी', 'लैटेराइट', 'हरित क्रांति', 'रबी', 'खरीफ', 'Climate, Soil, Agriculture & Minerals'] },

    { id: 'top_gs_wgeo_main', topicId: 'top_gs_wgeo_main', subjectId: 'sub_gs_world_geography', mainCategoryId: 'cat_indian_gs', titleHi: 'सौरमंडल, महाद्वीप, महासागर एवं वायुमंडल', titleEn: 'सौरमंडल, महाद्वीप, महासागर एवं वायुमंडल', aliases: ['World Geography', 'World & Physical Geography', 'Physical Geography', 'top_geo_world'], keywords: ['सौरमंडल', 'ग्रह', 'अक्षांश', 'देशांतर', 'भूमध्य रेखा', 'क्षोभमंडल', 'समतापमंडल', 'ओजोन परत', 'महासागर', 'ज्वालामुखी', 'भूकंप', 'World & Physical Geography'] },

    { id: 'top_gs_pol_rights', topicId: 'top_gs_pol_rights', subjectId: 'sub_gs_polity', mainCategoryId: 'cat_indian_gs', titleHi: 'संवैधानिक विकास, प्रस्तावना, मूल अधिकार एवं कर्तव्य', titleEn: 'संवैधानिक विकास, प्रस्तावना, मूल अधिकार एवं कर्तव्य', aliases: ['Constitution', 'Fundamental Rights', 'Directive Principles', 'Constitutional Framework & Preamble', 'Fundamental Rights, DPSP & Duties', 'Fundamental Rights & Duties', 'top_pol_framework', 'top_pol_rights_duties'], keywords: ['प्रस्तावना', 'मूल अधिकार', 'मौलिक अधिकार', 'नीति निर्देशक तत्व', 'मूल कर्तव्य', 'अनुच्छेद 14', 'अनुच्छेद 19', 'अनुच्छेद 21', 'अनुच्छेद 32', 'संवैधानिक उपचार', 'Constitutional Framework & Preamble', 'Fundamental Rights & Duties'] },
    { id: 'top_gs_pol_union_state', topicId: 'top_gs_pol_union_state', subjectId: 'sub_gs_polity', mainCategoryId: 'cat_indian_gs', titleHi: 'राष्ट्रपति, संसद, न्यायपालिका एवं संवैधानिक आयोग', titleEn: 'राष्ट्रपति, संसद, न्यायपालिका एवं संवैधानिक आयोग', aliases: ['Parliament', 'President and Governor', 'Union & State Executive and Parliament', 'Judiciary & Constitutional Bodies', 'top_pol_union_state', 'top_pol_judiciary_bodies'], keywords: ['राष्ट्रपति', 'उपराष्ट्रपति', 'प्रधानमंत्री', 'संसद', 'लोकसभा', 'राज्यसभा', 'सर्वोच्च न्यायालय', 'उच्च न्यायालय', 'निर्वाचन आयोग', 'वित्त आयोग', 'नियंत्रक एवं महालेखा परीक्षक', 'संविधान संशोधन', 'Union & State Executive and Parliament', 'Judiciary & Constitutional Bodies'] },

    { id: 'top_gs_econ_main', topicId: 'top_gs_econ_main', subjectId: 'sub_gs_economy', mainCategoryId: 'cat_indian_gs', titleHi: 'राष्ट्रीय आय, बैंकिंग, बजट एवं आर्थिक नियोजन', titleEn: 'राष्ट्रीय आय, बैंकिंग, बजट एवं आर्थिक नियोजन', aliases: ['National Income & Planning', 'Banking, RBI & Monetary Policy', 'Union & State Budget, Economic Survey', 'National Income, Budget & Fiscal Policy', 'top_econ_income_budget', 'top_econ_banking_monetary'], keywords: ['राष्ट्रीय आय', 'जीडीपी', 'नीति आयोग', 'पंचवर्षीय योजना', 'रिजर्व बैंक', 'मौद्रिक नीति', 'रेपो दर', 'मुद्रास्फीति', 'जीएसटी', 'बजट', 'नाबार्ड', 'सेबी', 'National Income, Budget & Fiscal Policy', 'Banking, RBI & Monetary Policy'] },

    { id: 'top_gs_gsci_main', topicId: 'top_gs_gsci_main', subjectId: 'sub_gs_general_science', mainCategoryId: 'cat_indian_gs', titleHi: 'दैनिक विज्ञान, वैज्ञानिक उपकरण एवं आविष्कार', titleEn: 'दैनिक विज्ञान, वैज्ञानिक उपकरण एवं आविष्कार', aliases: ['Physics & Chemistry in Daily Life'], keywords: ['वैज्ञानिक उपकरण', 'बैरोमीटर', 'हाइग्रोमीटर', 'लैक्टोमीटर', 'सीस्मोग्राफ', 'आविष्कार', 'सामान्य विज्ञान'] },

    { id: 'top_gs_phys_main', topicId: 'top_gs_phys_main', subjectId: 'sub_gs_physics', mainCategoryId: 'cat_indian_gs', titleHi: 'यांत्रिकी, प्रकाश, ध्वनि, ऊष्मा एवं विद्युत', titleEn: 'यांत्रिकी, प्रकाश, ध्वनि, ऊष्मा एवं विद्युत', aliases: [], keywords: ['मात्रक', 'न्यूटन', 'गुरुत्वाकर्षण', 'प्रकाश', 'अपवर्तन', 'परावर्तन', 'लेंस', 'दर्पण', 'ध्वनि', 'ऊष्मा', 'विद्युत धारा', 'ओम का नियम', 'चुंबकत्व', 'Physics'] },

    { id: 'top_gs_chem_main', topicId: 'top_gs_chem_main', subjectId: 'sub_gs_chemistry', mainCategoryId: 'cat_indian_gs', titleHi: 'परमाणु संरचना, अम्ल-क्षार, धातु एवं कार्बनिक रसायन', titleEn: 'परमाणु संरचना, अम्ल-क्षार, धातु एवं कार्बनिक रसायन', aliases: [], keywords: ['परमाणु', 'समस्थानिक', 'आवर्त सारणी', 'अम्ल', 'क्षार', 'लवण', 'पीएच मान', 'धातु', 'अयस्क', 'विरंजक चूर्ण', 'प्लास्टर ऑफ पेरिस', 'बहुलक', 'Chemistry'] },

    { id: 'top_gs_bio_main', topicId: 'top_gs_bio_main', subjectId: 'sub_gs_biology', mainCategoryId: 'cat_indian_gs', titleHi: 'कोशिका, मानव शरीर तंत्र, पोषण एवं मानव रोग', titleEn: 'कोशिका, मानव शरीर तंत्र, पोषण एवं मानव रोग', aliases: ['Physics, Chemistry & Biology', 'Biology & Human Health', 'top_sci_bio_chem_phys'], keywords: ['कोशिका', 'माइटोकॉन्ड्रिया', 'राइबोसोम', 'डीएनए', 'प्रकाश संश्लेषण', 'यकृत', 'अग्न्याशय', 'हृदय', 'रक्त', 'हीमोग्लोबिन', 'विटामिन', 'रोग', 'जीवाणु', 'विषाणु', 'Physics, Chemistry & Biology', 'Biology'] },

    { id: 'top_gs_env_main', topicId: 'top_gs_env_main', subjectId: 'sub_gs_environment', mainCategoryId: 'cat_indian_gs', titleHi: 'पारिस्थितिकी तंत्र, जैव विविधता एवं जलवायु परिवर्तन', titleEn: 'पारिस्थितिकी तंत्र, जैव विविधता एवं जलवायु परिवर्तन', aliases: ['Ecology, Biodiversity & Climate Change', 'Environment & Ecology', 'top_env_ecology_bio'], keywords: ['पारिस्थितिकी', 'खाद्य श्रृंखला', 'जैव विविधता', 'रामसर', 'प्रोजेक्ट टाइगर', 'मॉन्ट्रियल प्रोटोकॉल', 'क्योटो प्रोटोकॉल', 'ग्रीनहाउस गैस', 'ओजोन', 'प्रदूषण', 'Ecology, Biodiversity & Climate Change'] },

    { id: 'top_gs_scitech_main', topicId: 'top_gs_scitech_main', subjectId: 'sub_gs_sci_tech', mainCategoryId: 'cat_indian_gs', titleHi: 'अंतरिक्ष (ISRO), रक्षा (DRDO), कंप्यूटर एवं सूचना प्रौद्योगिकी', titleEn: 'अंतरिक्ष (ISRO), रक्षा (DRDO), कंप्यूटर एवं सूचना प्रौद्योगिकी', aliases: ['Space, Defence & Emerging Tech', 'Space (ISRO), Defence (DRDO) & IT', 'Computer Architecture, OS & Networking', 'Computer Architecture, Hardware & Memory', 'Operating System & MS Office (Word, Excel, PowerPoint)', 'Internet, Networking, Email & Cyber Security', 'MS Office, Shortcuts & Multimedia', 'top_comp_arch_os_net', 'top_sci_space_defence'], keywords: ['इसरो', 'चंद्रयान', 'गगनयान', 'डीआरडीओ', 'मिसाइल', 'कंप्यूटर', 'कैश मेमोरी', 'रैम', 'रोम', 'ऑपरेटिंग सिस्टम', 'इंटरनेट', 'Space, Defence & Emerging Tech', 'Computer Architecture, OS & Networking'] },

    { id: 'top_gs_intl_main', topicId: 'top_gs_intl_main', subjectId: 'sub_gs_intl_org', mainCategoryId: 'cat_indian_gs', titleHi: 'संयुक्त राष्ट्र एवं प्रमुख अंतरराष्ट्रीय संगठन', titleEn: 'संयुक्त राष्ट्र एवं प्रमुख अंतरराष्ट्रीय संगठन', aliases: [], keywords: ['संयुक्त राष्ट्र', 'सुरक्षा परिषद', 'विश्व स्वास्थ्य संगठन', 'विश्व बैंक', 'मुद्रा कोष', 'ब्रिक्स', 'जी-20', 'आसियान', 'सार्क', 'बिमस्टेक', 'नाटो'] },

    { id: 'top_gs_gk_main', topicId: 'top_gs_gk_main', subjectId: 'sub_gs_gk', mainCategoryId: 'cat_indian_gs', titleHi: 'समसामयिकी, खेल, पुरस्कार, पुस्तकें एवं दिवस', titleEn: 'समसामयिकी, खेल, पुरस्कार, पुस्तकें एवं दिवस', aliases: ['National & International Current Affairs', 'National & International Events', 'Learning Theories', 'Child Development & Pedagogy', 'Rural Development & Livelihood Schemes', 'top_ca_nat_intl'], keywords: ['समसामयिकी', 'भारतरत्न', 'पद्म पुरस्कार', 'नोबेल पुरस्कार', 'ओलंपिक', 'एशियाई खेल', 'महत्वपूर्ण दिवस', 'पुस्तकें', 'National & International Current Affairs'] },

    // --- 3. MATHS (26 Exact Topic Folders from Part 1.A.3) ---
    { id: 'top_math_number_system', topicId: 'top_math_number_system', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'संख्या पद्धति', titleEn: 'संख्या पद्धति', aliases: ['Number System & Simplification', 'Quantitative Aptitude & Mathematics', 'top_apt_quant_maths'], keywords: ['संख्या पद्धति', 'number system', 'प्राकृत संख्या', 'भाज्य', 'अभाज्य', 'स्थानीय मान', 'इकाई अंक', 'विभाज्यता'] },
    { id: 'top_math_simplification', topicId: 'top_math_simplification', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'सरलीकरण', titleEn: 'सरलीकरण', aliases: ['Simplification'], keywords: ['सरलीकरण', 'simplification', 'bodmas', 'वर्गमूल', 'घनमूल', 'घातांक', 'करणी'] },
    { id: 'top_math_lcm_hcf', topicId: 'top_math_lcm_hcf', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'लघुत्तम एवं महत्तम समापवर्तक', titleEn: 'लघुत्तम एवं महत्तम समापवर्तक', aliases: ['LCM and HCF'], keywords: ['लघुत्तम', 'महत्तम', 'ल.स.', 'म.स.', 'lcm', 'hcf'] },
    { id: 'top_math_fraction_decimal', topicId: 'top_math_fraction_decimal', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'भिन्न एवं दशमलव', titleEn: 'भिन्न एवं दशमलव', aliases: ['Fractions and Decimals'], keywords: ['भिन्न', 'दशमलव', 'fraction', 'decimal'] },
    { id: 'top_math_percentage', topicId: 'top_math_percentage', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'प्रतिशत', titleEn: 'प्रतिशत', aliases: ['Percentage', 'Percentage, Profit & Loss, SI & CI'], keywords: ['प्रतिशत', 'percentage', 'प्रतिशतता'] },
    { id: 'top_math_ratio_proportion', topicId: 'top_math_ratio_proportion', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'अनुपात एवं समानुपात', titleEn: 'अनुपात एवं समानुपात', aliases: ['Ratio and Proportion', 'Ratio, Time & Work, Speed & Distance'], keywords: ['अनुपात', 'समानुपात', 'ratio', 'proportion', 'मिश्रण', 'साझेदारी'] },
    { id: 'top_math_average', topicId: 'top_math_average', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'औसत', titleEn: 'औसत', aliases: ['Average'], keywords: ['औसत', 'average', 'माध्य'] },
    { id: 'top_math_profit_loss', topicId: 'top_math_profit_loss', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'लाभ एवं हानि', titleEn: 'लाभ एवं हानि', aliases: ['Profit and Loss'], keywords: ['लाभ', 'हानि', 'क्रय मूल्य', 'विक्रय मूल्य', 'profit and loss', 'cost price', 'selling price'] },
    { id: 'top_math_discount', topicId: 'top_math_discount', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'छूट', titleEn: 'छूट', aliases: ['Discount'], keywords: ['छूट', 'बट्टा', 'अंकित मूल्य', 'discount', 'marked price'] },
    { id: 'top_math_simple_interest', topicId: 'top_math_simple_interest', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'साधारण ब्याज', titleEn: 'साधारण ब्याज', aliases: ['Simple Interest'], keywords: ['साधारण ब्याज', 'मूलधन', 'simple interest'] },
    { id: 'top_math_compound_interest', topicId: 'top_math_compound_interest', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'चक्रवृद्धि ब्याज', titleEn: 'चक्रवृद्धि ब्याज', aliases: ['Compound Interest'], keywords: ['चक्रवृद्धि ब्याज', 'compound interest'] },
    { id: 'top_math_time_work', topicId: 'top_math_time_work', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'समय एवं कार्य', titleEn: 'समय एवं कार्य', aliases: ['Time and Work'], keywords: ['समय एवं कार्य', 'समय और कार्य', 'कार्य क्षमता', 'time and work'] },
    { id: 'top_math_pipes_cistern', topicId: 'top_math_pipes_cistern', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'पाइप एवं टंकी', titleEn: 'पाइप एवं टंकी', aliases: ['Pipes and Cisterns'], keywords: ['पाइप', 'टंकी', 'नल', 'pipe and cistern'] },
    { id: 'top_math_time_distance', topicId: 'top_math_time_distance', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'समय एवं दूरी', titleEn: 'समय एवं दूरी', aliases: ['Time and Distance'], keywords: ['समय एवं दूरी', 'चाल', 'रेलगाड़ी', 'ट्रेन', 'time and distance', 'speed', 'train'] },
    { id: 'top_math_boat_stream', topicId: 'top_math_boat_stream', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'नाव एवं धारा', titleEn: 'नाव एवं धारा', aliases: ['Boats and Streams'], keywords: ['नाव', 'धारा', 'प्रतिकूल', 'अनुकूल', 'boat and stream'] },
    { id: 'top_math_ages', topicId: 'top_math_ages', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'आयु संबंधी प्रश्न', titleEn: 'आयु संबंधी प्रश्न', aliases: ['Problems on Ages'], keywords: ['आयु', 'वर्तमान आयु', 'वर्ष पूर्व', 'वर्ष बाद', 'problems on ages'] },
    { id: 'top_math_algebra', topicId: 'top_math_algebra', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'बीजगणित', titleEn: 'बीजगणित', aliases: ['Algebra', 'Algebra, Geometry & Mensuration'], keywords: ['बीजगणित', 'बहुपद', 'गुणनखंड', 'algebra', 'polynomial'] },
    { id: 'top_math_linear_eq', topicId: 'top_math_linear_eq', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'रैखिक समीकरण', titleEn: 'रैखिक समीकरण', aliases: ['Linear Equations'], keywords: ['रैखिक समीकरण', 'युगपत समीकरण', 'linear equation'] },
    { id: 'top_math_quadratic_eq', topicId: 'top_math_quadratic_eq', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'द्विघात समीकरण', titleEn: 'द्विघात समीकरण', aliases: ['Quadratic Equations'], keywords: ['द्विघात समीकरण', 'मूलों का योग', 'विविक्तकर', 'quadratic equation'] },
    { id: 'top_math_coord_geom', topicId: 'top_math_coord_geom', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'निर्देशांक ज्यामिति', titleEn: 'निर्देशांक ज्यामिति', aliases: ['Coordinate Geometry'], keywords: ['निर्देशांक ज्यामिति', 'बिंदु', 'चतुर्थांश', 'प्रवणता', 'coordinate geometry'] },
    { id: 'top_math_geometry', topicId: 'top_math_geometry', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'ज्यामिति', titleEn: 'ज्यामिति', aliases: ['Geometry'], keywords: ['ज्यामिति', 'त्रिभुज', 'वृत्त', 'चतुर्भुज', 'कोण', 'जीवा', 'स्पर्श रेखा', 'geometry', 'triangle', 'circle'] },
    { id: 'top_math_mensuration', topicId: 'top_math_mensuration', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'क्षेत्रमिति', titleEn: 'क्षेत्रमिति', aliases: ['Mensuration'], keywords: ['क्षेत्रमिति', 'क्षेत्रफल', 'परिमाप', 'आयतन', 'बेलन', 'शंकु', 'गोला', 'घन', 'घनाभ', 'mensuration', 'area', 'volume'] },
    { id: 'top_math_trigonometry', topicId: 'top_math_trigonometry', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'त्रिकोणमिति', titleEn: 'त्रिकोणमिति', aliases: ['Trigonometry'], keywords: ['त्रिकोणमिति', 'sin', 'cos', 'tan', 'उन्नयन कोण', 'अवनमन कोण', 'trigonometry'] },
    { id: 'top_math_di', topicId: 'top_math_di', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'आंकड़ों की व्याख्या', titleEn: 'आंकड़ों की व्याख्या', aliases: ['Data Interpretation'], keywords: ['आंकड़ों की व्याख्या', 'पाई चार्ट', 'दंड आरेख', 'सारणी', 'माध्यिका', 'बहुलक', 'data interpretation'] },
    { id: 'top_math_probability', topicId: 'top_math_probability', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'प्रायिकता', titleEn: 'प्रायिकता', aliases: ['Probability'], keywords: ['प्रायिकता', 'ताश', 'सिक्का', 'probability'] },
    { id: 'top_math_perm_comb', topicId: 'top_math_perm_comb', subjectId: 'sub_maths', mainCategoryId: 'cat_maths', titleHi: 'क्रमचय एवं संचय', titleEn: 'क्रमचय एवं संचय', aliases: ['Permutation and Combination'], keywords: ['क्रमचय', 'संचय', 'permutation', 'combination'] },

    // --- 4. ENGLISH (23 Exact Topic Folders from Part 1.A.4) ---
    { id: 'top_eng_parts_of_speech', topicId: 'top_eng_parts_of_speech', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Parts of Speech', titleEn: 'Parts of Speech', aliases: ['Parts of Speech, Tenses & Voice', 'General English Grammar & Vocabulary', 'top_lang_english_grammar'], keywords: ['parts of speech'] },
    { id: 'top_eng_noun', topicId: 'top_eng_noun', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Noun', titleEn: 'Noun', aliases: [], keywords: ['noun', 'collective noun', 'countable', 'uncountable'] },
    { id: 'top_eng_pronoun', topicId: 'top_eng_pronoun', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Pronoun', titleEn: 'Pronoun', aliases: [], keywords: ['pronoun', 'reflexive pronoun', 'relative pronoun'] },
    { id: 'top_eng_verb', topicId: 'top_eng_verb', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Verb', titleEn: 'Verb', aliases: [], keywords: ['verb', 'modal', 'auxiliary', 'infinitive', 'gerund', 'participle'] },
    { id: 'top_eng_adjective', topicId: 'top_eng_adjective', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Adjective', titleEn: 'Adjective', aliases: [], keywords: ['adjective', 'degree of comparison', 'comparative', 'superlative'] },
    { id: 'top_eng_adverb', topicId: 'top_eng_adverb', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Adverb', titleEn: 'Adverb', aliases: [], keywords: ['adverb'] },
    { id: 'top_eng_tense', topicId: 'top_eng_tense', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Tense', titleEn: 'Tense', aliases: [], keywords: ['tense', 'present perfect', 'past continuous', 'future tense'] },
    { id: 'top_eng_articles', topicId: 'top_eng_articles', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Articles', titleEn: 'Articles', aliases: [], keywords: ['articles', 'definite article', 'indefinite article', 'use of a an the'] },
    { id: 'top_eng_preposition', topicId: 'top_eng_preposition', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Preposition', titleEn: 'Preposition', aliases: [], keywords: ['preposition', 'appropriate preposition'] },
    { id: 'top_eng_conjunction', topicId: 'top_eng_conjunction', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Conjunction', titleEn: 'Conjunction', aliases: [], keywords: ['conjunction', 'neither nor', 'either or', 'no sooner than'] },
    { id: 'top_eng_sva', topicId: 'top_eng_sva', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Subject Verb Agreement', titleEn: 'Subject Verb Agreement', aliases: [], keywords: ['subject verb agreement', 'syntax'] },
    { id: 'top_eng_voice', topicId: 'top_eng_voice', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Active and Passive Voice', titleEn: 'Active and Passive Voice', aliases: [], keywords: ['active and passive', 'passive voice', 'active voice', 'change the voice'] },
    { id: 'top_eng_narration', topicId: 'top_eng_narration', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Direct and Indirect Speech', titleEn: 'Direct and Indirect Speech', aliases: ['Direct/Indirect Speech & Error Spotting'], keywords: ['direct and indirect', 'indirect speech', 'direct speech', 'narration', 'reported speech'] },
    { id: 'top_eng_vocabulary', topicId: 'top_eng_vocabulary', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Vocabulary', titleEn: 'Vocabulary', aliases: [], keywords: ['vocabulary', 'word meaning', 'phrasal verb'] },
    { id: 'top_eng_syn_ant', topicId: 'top_eng_syn_ant', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Synonyms and Antonyms', titleEn: 'Synonyms and Antonyms', aliases: ['Synonyms, Antonyms, Idioms & One-Word'], keywords: ['synonym', 'antonym', 'nearest in meaning', 'opposite in meaning'] },
    { id: 'top_eng_ows', topicId: 'top_eng_ows', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'One Word Substitution', titleEn: 'One Word Substitution', aliases: [], keywords: ['one word substitution', 'one word for'] },
    { id: 'top_eng_idioms', topicId: 'top_eng_idioms', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Idioms and Phrases', titleEn: 'Idioms and Phrases', aliases: [], keywords: ['idiom', 'phrase', 'idioms and phrases'] },
    { id: 'top_eng_spelling', topicId: 'top_eng_spelling', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Spelling Correction', titleEn: 'Spelling Correction', aliases: [], keywords: ['correctly spelt', 'misspelt', 'spelling correction', 'correct spelling'] },
    { id: 'top_eng_error_detection', topicId: 'top_eng_error_detection', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Error Detection', titleEn: 'Error Detection', aliases: [], keywords: ['error detection', 'spot the error', 'grammatical error'] },
    { id: 'top_eng_sentence_imp', topicId: 'top_eng_sentence_imp', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Sentence Improvement', titleEn: 'Sentence Improvement', aliases: [], keywords: ['sentence improvement', 'improve the bracketed'] },
    { id: 'top_eng_fill_blanks', topicId: 'top_eng_fill_blanks', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Fill in the Blanks', titleEn: 'Fill in the Blanks', aliases: [], keywords: ['fill in the blank'] },
    { id: 'top_eng_rc', topicId: 'top_eng_rc', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Reading Comprehension', titleEn: 'Reading Comprehension', aliases: ['Reading Comprehension & Cloze Test'], keywords: ['reading comprehension', 'read the passage'] },
    { id: 'top_eng_cloze', topicId: 'top_eng_cloze', subjectId: 'sub_english', mainCategoryId: 'cat_english', titleHi: 'Cloze Test', titleEn: 'Cloze Test', aliases: [], keywords: ['cloze test'] },

    // --- 5. HINDI (27 Exact Topic Folders from Part 1.A.5) ---
    { id: 'top_hin_varnamala', topicId: 'top_hin_varnamala', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'वर्ण एवं वर्णमाला', titleEn: 'वर्ण एवं वर्णमाला', aliases: ['General Hindi Grammar (सामान्य हिन्दी व्याकरण)', 'General Hindi Grammar (सामान्य हिन्दी)', 'वर्णमाला, संधि एवं समास (Sandhi & Samas)', 'top_lang_hindi_grammar'], keywords: ['वर्ण', 'वर्णमाला', 'स्वर', 'व्यंजन', 'अल्पप्राण', 'महाप्राण', 'अघोष', 'सघोष', 'उच्चारण स्थान'] },
    { id: 'top_hin_sandhi', topicId: 'top_hin_sandhi', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'संधि', titleEn: 'संधि', aliases: ['Sandhi'], keywords: ['संधि', 'संधि विच्छेद', 'स्वर संधि', 'व्यंजन संधि', 'विसर्ग संधि', 'दीर्घ संधि', 'गुण संधि', 'यण संधि', 'अयादि संधि'] },
    { id: 'top_hin_samas', topicId: 'top_hin_samas', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'समास', titleEn: 'समास', aliases: ['Samas'], keywords: ['समास', 'अव्ययीभाव', 'तत्पुरुष', 'कर्मधारय', 'द्विगु', 'द्वंद्व', 'बहुव्रीहि', 'समास विग्रह'] },
    { id: 'top_hin_upsarg', topicId: 'top_hin_upsarg', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'उपसर्ग', titleEn: 'उपसर्ग', aliases: ['Upsarg'], keywords: ['उपसर्ग'] },
    { id: 'top_hin_pratyay', topicId: 'top_hin_pratyay', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'प्रत्यय', titleEn: 'प्रत्यय', aliases: ['Pratyay'], keywords: ['प्रत्यय', 'कृत प्रत्यय', 'तद्धित प्रत्यय'] },
    { id: 'top_hin_sangya', topicId: 'top_hin_sangya', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'संज्ञा', titleEn: 'संज्ञा', aliases: [], keywords: ['संज्ञा', 'व्यक्तिवाचक', 'जातिवाचक', 'भाववाचक'] },
    { id: 'top_hin_sarvanam', topicId: 'top_hin_sarvanam', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'सर्वनाम', titleEn: 'सर्वनाम', aliases: [], keywords: ['सर्वनाम', 'पुरुषवाचक', 'निश्चयवाचक', 'निजवाचक'] },
    { id: 'top_hin_visheshan', topicId: 'top_hin_visheshan', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'विशेषण', titleEn: 'विशेषण', aliases: [], keywords: ['विशेषण', 'विशेष्य', 'प्रविशेषण', 'गुणवाचक', 'परिमाणवाचक'] },
    { id: 'top_hin_kriya', topicId: 'top_hin_kriya', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'क्रिया', titleEn: 'क्रिया', aliases: [], keywords: ['क्रिया', 'सकर्मक', 'अकर्मक', 'प्रेरणार्थक क्रिया'] },
    { id: 'top_hin_avyay', topicId: 'top_hin_avyay', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'अव्यय', titleEn: 'अव्यय', aliases: [], keywords: ['अव्यय', 'अविकारी', 'क्रियाविशेषण', 'समुच्चयबोधक', 'निपात'] },
    { id: 'top_hin_ling', topicId: 'top_hin_ling', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'लिंग', titleEn: 'लिंग', aliases: [], keywords: ['पुल्लिंग', 'स्त्रीलिंग', 'लिंग बदलो', 'लिंग की पहचान'] },
    { id: 'top_hin_vachan', topicId: 'top_hin_vachan', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'वचन', titleEn: 'वचन', aliases: [], keywords: ['एकवचन', 'बहुवचन', 'वचन बदलो'] },
    { id: 'top_hin_karak', topicId: 'top_hin_karak', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'कारक', titleEn: 'कारक', aliases: [], keywords: ['कारक', 'विभक्ति', 'कर्ता', 'करण', 'संप्रदान', 'अपादान', 'अधिकरण'] },
    { id: 'top_hin_kaal', topicId: 'top_hin_kaal', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'काल', titleEn: 'काल', aliases: [], keywords: ['वर्तमान काल', 'भूतकाल', 'भविष्यत काल', 'संदिग्ध भूत', 'हेतुहेतुमद्'] },
    { id: 'top_hin_vachya', topicId: 'top_hin_vachya', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'वाच्य', titleEn: 'वाच्य', aliases: [], keywords: ['वाच्य', 'कर्तृवाच्य', 'कर्मवाच्य', 'भाववाच्य'] },
    { id: 'top_hin_paryayvachi', topicId: 'top_hin_paryayvachi', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'पर्यायवाची शब्द', titleEn: 'पर्यायवाची शब्द', aliases: ['तत्सम-तद्भव, पर्यायवाची एवं विलोम'], keywords: ['पर्यायवाची', 'समानार्थी'] },
    { id: 'top_hin_vilom', topicId: 'top_hin_vilom', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'विलोम शब्द', titleEn: 'विलोम शब्द', aliases: [], keywords: ['विलोम', 'विपरीतार्थक'] },
    { id: 'top_hin_anekarthi', topicId: 'top_hin_anekarthi', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'अनेकार्थी शब्द', titleEn: 'अनेकार्थी शब्द', aliases: [], keywords: ['अनेकार्थी', 'अनेकार्थक', 'समश्रुत भिन्नार्थक'] },
    { id: 'top_hin_one_word', topicId: 'top_hin_one_word', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'अनेक शब्दों के लिए एक शब्द', titleEn: 'अनेक शब्दों के लिए एक शब्द', aliases: [], keywords: ['अनेक शब्दों के लिए एक शब्द', 'वाक्यांश के लिए एक शब्द'] },
    { id: 'top_hin_muhavare', topicId: 'top_hin_muhavare', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'मुहावरे एवं लोकोक्तियाँ', titleEn: 'मुहावरे एवं लोकोक्तियाँ', aliases: [], keywords: ['मुहावरा', 'मुहावरे', 'लोकोक्ति', 'कहावत'] },
    { id: 'top_hin_tatsam_tadbhav', topicId: 'top_hin_tatsam_tadbhav', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'तत्सम एवं तद्भव', titleEn: 'तत्सम एवं तद्भव', aliases: [], keywords: ['तत्सम', 'तद्भव', 'देशज', 'विदेशज', 'शंकर शब्द'] },
    { id: 'top_hin_vartani', topicId: 'top_hin_vartani', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'वर्तनी शुद्धि', titleEn: 'वर्तनी शुद्धि', aliases: [], keywords: ['वर्तनी', 'शुद्ध शब्द', 'अशुद्ध शब्द'] },
    { id: 'top_hin_vakya_shuddhi', topicId: 'top_hin_vakya_shuddhi', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'वाक्य शुद्धि', titleEn: 'वाक्य शुद्धि', aliases: [], keywords: ['वाक्य शुद्धि', 'शुद्ध वाक्य', 'संयुक्त वाक्य', 'मिश्र वाक्य'] },
    { id: 'top_hin_ras', topicId: 'top_hin_ras', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'रस', titleEn: 'रस', aliases: [], keywords: ['रस', 'स्थायी भाव', 'श्रृंगार रस', 'वीर रस', 'करुण रस', 'विभाव', 'अनुभाव'] },
    { id: 'top_hin_chhand', topicId: 'top_hin_chhand', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'छंद', titleEn: 'छंद', aliases: [], keywords: ['छंद', 'दोहा', 'सोरठा', 'चौपाई', 'रोला', 'कुंडलिया', 'मात्रा'] },
    { id: 'top_hin_alankar', topicId: 'top_hin_alankar', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'अलंकार', titleEn: 'अलंकार', aliases: [], keywords: ['अलंकार', 'अनुप्रास', 'यमक', 'श्लेष', 'उपमा', 'रूपक', 'उत्प्रेक्षा', 'अतिशयोक्ति'] },
    { id: 'top_hin_gadyansh', topicId: 'top_hin_gadyansh', subjectId: 'sub_hindi', mainCategoryId: 'cat_hindi', titleHi: 'अपठित गद्यांश', titleEn: 'अपठित गद्यांश', aliases: [], keywords: ['अपठित गद्यांश', 'गद्यांश'] },

    // --- 6. REASONING (23 Exact Topic Folders from Part 1.A.6) ---
    { id: 'top_reas_analogy', topicId: 'top_reas_analogy', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'समानता एवं सादृश्य', titleEn: 'समानता एवं सादृश्य', aliases: ['Logical & Analytical Reasoning', 'top_apt_logical_reasoning'], keywords: ['सादृश्य', 'समानता', 'analogy'] },
    { id: 'top_reas_classification', topicId: 'top_reas_classification', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'वर्गीकरण', titleEn: 'वर्गीकरण', aliases: ['Classification'], keywords: ['वर्गीकरण', 'विषम चुनिए', 'odd one out', 'classification'] },
    { id: 'top_reas_num_series', topicId: 'top_reas_num_series', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'संख्या श्रृंखला', titleEn: 'संख्या श्रृंखला', aliases: ['Number Series'], keywords: ['संख्या श्रृंखला', 'लुप्त संख्या', 'number series', 'missing number'] },
    { id: 'top_reas_let_series', topicId: 'top_reas_let_series', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'अक्षर श्रृंखला', titleEn: 'अक्षर श्रृंखला', aliases: ['Letter Series'], keywords: ['अक्षर श्रृंखला', 'वर्णमाला श्रृंखला', 'letter series', 'alphabet series'] },
    { id: 'top_reas_coding', topicId: 'top_reas_coding', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'Coding-Decoding', titleEn: 'Coding-Decoding', aliases: ['Coding-Decoding & Series'], keywords: ['कोडिंग', 'डिकोडिंग', 'कूट भाषा', 'coding', 'decoding', 'code language'] },
    { id: 'top_reas_blood_rel', topicId: 'top_reas_blood_rel', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'रक्त संबंध', titleEn: 'रक्त संबंध', aliases: ['Blood Relations & Direction Sense'], keywords: ['रक्त संबंध', 'पिता', 'माता', 'भतीजा', 'मामा', 'blood relation'] },
    { id: 'top_reas_direction', topicId: 'top_reas_direction', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'दिशा एवं दूरी', titleEn: 'दिशा एवं दूरी', aliases: ['Direction Sense'], keywords: ['दिशा एवं दूरी', 'उत्तर की ओर', 'दक्षिण की ओर', 'बाएं मुड़ता', 'दाएं मुड़ता', 'direction and distance'] },
    { id: 'top_reas_ranking', topicId: 'top_reas_ranking', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'क्रम एवं रैंकिंग', titleEn: 'क्रम एवं रैंकिंग', aliases: ['Order and Ranking'], keywords: ['क्रम एवं रैंकिंग', 'पंक्ति में बाएं से', 'दाएं से स्थान', 'order and ranking'] },
    { id: 'top_reas_seating', topicId: 'top_reas_seating', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'बैठने की व्यवस्था', titleEn: 'बैठने की व्यवस्था', aliases: ['Seating Arrangement'], keywords: ['बैठने की व्यवस्था', 'वृत्ताकार मेज', 'केंद्र की ओर मुख', 'seating arrangement'] },
    { id: 'top_reas_puzzle', topicId: 'top_reas_puzzle', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'पहेली', titleEn: 'पहेली', aliases: ['Puzzles'], keywords: ['पहेली', 'मंजिल', 'puzzle'] },
    { id: 'top_reas_venn', topicId: 'top_reas_venn', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'वेन आरेख', titleEn: 'वेन आरेख', aliases: ['Venn Diagram'], keywords: ['वेन आरेख', 'venn diagram'] },
    { id: 'top_reas_syllogism', topicId: 'top_reas_syllogism', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'न्याय निगमन', titleEn: 'न्याय निगमन', aliases: ['Syllogism, Statement & Conclusion'], keywords: ['न्याय निगमन', 'सभी A, B हैं', 'कुछ A, B हैं', 'syllogism'] },
    { id: 'top_reas_stmt_conc', topicId: 'top_reas_stmt_conc', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'कथन एवं निष्कर्ष', titleEn: 'कथन एवं निष्कर्ष', aliases: ['Statement and Conclusion'], keywords: ['कथन एवं निष्कर्ष', 'कथन और निष्कर्ष', 'statement and conclusion'] },
    { id: 'top_reas_stmt_arg', topicId: 'top_reas_stmt_arg', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'कथन एवं तर्क', titleEn: 'कथन एवं तर्क', aliases: ['Statement and Argument'], keywords: ['कथन एवं तर्क', 'पूर्वधारणा', 'statement and argument', 'assumption'] },
    { id: 'top_reas_clock', topicId: 'top_reas_clock', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'घड़ी', titleEn: 'घड़ी', aliases: ['Clock'], keywords: ['घड़ी', 'मिनट की सुई', 'घंटे की सुई', 'clock'] },
    { id: 'top_reas_calendar', topicId: 'top_reas_calendar', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'कैलेंडर', titleEn: 'कैलेंडर', aliases: ['Calendar'], keywords: ['कैलेंडर', 'अधिवर्ष', 'लीप वर्ष', 'सप्ताह का कौन सा दिन', 'calendar', 'leap year'] },
    { id: 'top_reas_dice', topicId: 'top_reas_dice', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'पासा', titleEn: 'पासा', aliases: ['Dice'], keywords: ['पासा', 'विपरीत फलक', 'dice'] },
    { id: 'top_reas_cube', topicId: 'top_reas_cube', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'घन एवं घनाभ', titleEn: 'घन एवं घनाभ', aliases: ['Cube and Cuboid'], keywords: ['रंगे हुए घन', 'छोटे घनों', 'cube and cuboid'] },
    { id: 'top_reas_mirror', topicId: 'top_reas_mirror', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'दर्पण प्रतिबिंब', titleEn: 'दर्पण प्रतिबिंब', aliases: ['Mirror Image'], keywords: ['दर्पण प्रतिबिंब', 'mirror image'] },
    { id: 'top_reas_water', topicId: 'top_reas_water', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'जल प्रतिबिंब', titleEn: 'जल प्रतिबिंब', aliases: ['Water Image'], keywords: ['जल प्रतिबिंब', 'water image'] },
    { id: 'top_reas_paper_fold', topicId: 'top_reas_paper_fold', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'कागज मोड़ना एवं काटना', titleEn: 'कागज मोड़ना एवं काटना', aliases: ['Paper Folding and Cutting'], keywords: ['कागज मोड़ना', 'कागज काटना', 'paper folding', 'paper cutting'] },
    { id: 'top_reas_fig_series', topicId: 'top_reas_fig_series', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'आकृति श्रृंखला', titleEn: 'आकृति श्रृंखला', aliases: ['Figure Series'], keywords: ['आकृति श्रृंखला', 'त्रिभुजों की संख्या', 'figure series', 'counting figures'] },
    { id: 'top_reas_non_verbal', topicId: 'top_reas_non_verbal', subjectId: 'sub_reasoning', mainCategoryId: 'cat_reasoning', titleHi: 'गैर-मौखिक तर्कशक्ति', titleEn: 'गैर-मौखिक तर्कशक्ति', aliases: ['Non-Verbal Reasoning'], keywords: ['गैर-मौखिक', 'सन्निहित आकृति', 'आकृति पूर्ण करना', 'non verbal reasoning', 'embedded figure'] },

    // --- Uncategorised Default Topic ---
    { id: 'top_uncategorised', topicId: 'top_uncategorised', subjectId: 'sub_uncategorised', mainCategoryId: 'cat_uncategorised', titleHi: 'अवर्गीकृत प्रश्न (Uncategorised)', titleEn: 'Uncategorised', aliases: ['Needs Categorisation'], keywords: [] }
  ];

  // ============================================================================
  // SUBTOPIC MASTER (Granular Subtopics under Topics)
  // ============================================================================
  const DEFAULT_SUBTOPICS = [
    { id: 'subtop_kalchuri', subtopicId: 'subtop_kalchuri', topicId: 'top_cg_hist_medieval', subjectId: 'sub_cg_history', titleEn: 'Kalchuri Dynasty', titleHi: 'कलचुरी वंश', keywords: ['kalchuri', 'kalingaraj', 'kamalaraj', 'ratnadev', 'prithvidev', 'jajalladev', 'ratanpur', 'tumman', 'कलचुरी', 'कलिंगराज', 'कमलराज', 'रत्नदेव', 'पृथ्वीदेव', 'जाजल्लदेव', 'रतनपुर', 'तुम्मान'] },
    { id: 'subtop_maratha_cg', subtopicId: 'subtop_maratha_cg', topicId: 'top_cg_hist_medieval', subjectId: 'sub_cg_history', titleEn: 'Maratha Rule in Chhattisgarh', titleHi: 'छत्तीसगढ़ में मराठा एवं सूबा शासन', keywords: ['maratha', 'bimbaji', 'bhonsle', 'vyankoji', 'suba system', 'mahipat rao', 'vithal rao', 'agneu', 'मराठा', 'बिंबाजी', 'भोंसले', 'सूबा शासन', 'महिपत राव', 'एगन्यू'] },
    { id: 'subtop_tribal_revolts', subtopicId: 'subtop_tribal_revolts', topicId: 'top_cg_hist_modern', subjectId: 'sub_cg_history', titleEn: 'Tribal Revolts & Freedom Struggle in CG', titleHi: 'छत्तीसगढ़ के जनजातीय विद्रोह एवं स्वतंत्रता आंदोलन', keywords: ['halba rebellion', 'ajmer singh', 'paralkot', 'gend singh', 'tarapur', 'muria', 'bhumkal', 'gundadhur', 'veer narayan singh', 'sonakhan', 'हल्बा विद्रोह', 'अजमेर सिंह', 'परलकोट', 'गेंद सिंह', 'भूमकाल', 'गुण्डाधूर', 'वीर नारायण सिंह', 'सोनाखान'] },
    { id: 'subtop_state_formation', subtopicId: 'subtop_state_formation', topicId: 'top_cg_gen_info_main', subjectId: 'sub_cg_general_info', titleEn: 'State Formation of Chhattisgarh', titleHi: 'छत्तीसगढ़ राज्य का गठन', keywords: ['1 november 2000', '26th state', 'reorganization act', '1 नवंबर 2000', '26वां राज्य', 'पुनर्गठन अधिनियम'] }
  ];

  window.CGpediaTaxonomyDefaults = {
    MAIN_CATEGORIES,
    EXAM_CATEGORIES,
    PYQ_EXAM_CATEGORIES,
    DEFAULT_SUBJECTS,
    DEFAULT_TOPICS,
    DEFAULT_SUBTOPICS
  };

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

  let currentSyncStatusState = 'synchronizing';

  function updateSyncBadge(stateOrText, isOnline) {
    const badge = document.getElementById('cloudSyncStatusBadge');
    if (!badge) return;

    const normalized = String(stateOrText || '').trim().toLowerCase();
    let mode = 'connected';
    let label = '🟢 Connected';
    let tooltip = 'Firebase Live Sync Connected';

    if (normalized === 'synchronizing' || normalized.includes('synchronizing') || normalized.includes('syncing')) {
      mode = 'synchronizing';
      label = '🔄 Synchronizing...';
      tooltip = 'Synchronizing latest data with Firebase Cloud...';
    } else if (normalized === 'offline' || normalized.includes('offline') || navigator.onLine === false) {
      mode = 'offline';
      label = '⚡ Offline';
      tooltip = 'Offline Mode — Showing cached data; changes will sync when online';
    } else if (normalized === 'error' || normalized.includes('error')) {
      mode = 'error';
      label = '⚠️ Connection Error';
      tooltip = 'Firebase Cloud connection error — Retrying automatically';
    } else if (normalized === 'connected' || isOnline === true) {
      mode = 'connected';
      label = '🟢 Connected';
      tooltip = 'Firebase Live Sync Connected & Up to Date';
    } else if (isOnline === false) {
      mode = 'offline';
      label = '⚡ Offline';
      tooltip = 'Offline Mode — Showing cached data';
    }

    currentSyncStatusState = mode;
    badge.textContent = label;
    badge.setAttribute('data-sync-state', mode);
    badge.title = tooltip;

    if (mode === 'connected') {
      badge.style.background = 'rgba(22, 163, 74, 0.28)';
      badge.style.color = '#86EFAC';
      badge.style.borderColor = 'rgba(134, 239, 172, 0.45)';
    } else if (mode === 'synchronizing') {
      badge.style.background = 'rgba(14, 165, 233, 0.28)';
      badge.style.color = '#BAE6FD';
      badge.style.borderColor = 'rgba(125, 211, 252, 0.45)';
    } else if (mode === 'error') {
      badge.style.background = 'rgba(220, 38, 38, 0.28)';
      badge.style.color = '#FCA5A5';
      badge.style.borderColor = 'rgba(252, 165, 165, 0.45)';
    } else {
      badge.style.background = 'rgba(217, 119, 6, 0.28)';
      badge.style.color = '#FDE68A';
      badge.style.borderColor = 'rgba(253, 230, 138, 0.45)';
    }
  }

  window.addEventListener('offline', () => {
    updateSyncBadge('offline', false);
  });

  window.addEventListener('online', () => {
    if (isCloudConnected) {
      updateSyncBadge('synchronizing', true);
      setTimeout(() => {
        if (navigator.onLine !== false && isCloudConnected) {
          updateSyncBadge('connected', true);
        }
      }, 900);
    }
  });

  const DELETED_DOCS_STORAGE_KEY = 'cgpedia_deleted_cloud_ids_v1';

  function loadDeletedDocMap() {
    try {
      const raw = localStorage.getItem(DELETED_DOCS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (_) {}
    return {};
  }

  function markDocDeletedLocally(collectionName, docId) {
    if (!collectionName || !docId) return;
    try {
      const map = loadDeletedDocMap();
      map[`${collectionName}/${String(docId)}`] = Date.now();
      localStorage.setItem(DELETED_DOCS_STORAGE_KEY, JSON.stringify(map));
    } catch (_) {}
  }

  function unmarkDocDeletedLocally(collectionName, docId) {
    if (!collectionName || !docId) return;
    try {
      const map = loadDeletedDocMap();
      const key = `${collectionName}/${String(docId)}`;
      if (key in map) {
        delete map[key];
        localStorage.setItem(DELETED_DOCS_STORAGE_KEY, JSON.stringify(map));
      }
    } catch (_) {}
  }

  function isDocDeletedLocally(collectionName, docId) {
    if (!collectionName || !docId) return false;
    const map = loadDeletedDocMap();
    return Boolean(map[`${collectionName}/${String(docId)}`]);
  }

  function isCurrentLocalAdminSession() {
    try {
      if (window.CGpediaApp && typeof window.CGpediaApp.isCurrentUserAdmin === 'function') {
        if (window.CGpediaApp.isCurrentUserAdmin()) return true;
      }
      if (auth && auth.currentUser && String(auth.currentUser.email || '').trim().toLowerCase() === OWNER_ADMIN_EMAIL) {
        return true;
      }
      const raw = localStorage.getItem('cgpedia_enterprise_state_v3');
      if (raw) {
        const parsed = JSON.parse(raw);
        const stuEmail = String((parsed && parsed.student && parsed.student.email) || '').trim().toLowerCase();
        if (stuEmail === OWNER_ADMIN_EMAIL) return true;
      }
    } catch (_) {}
    return false;
  }

  function bindNamedFirestoreDatabaseInstance(appInstance) {
    // Firebase v10 compat SDK ignores the databaseId parameter in app.firestore(databaseId)
    // unless the underlying modular 'firestore' provider's [DEFAULT] instance is bound to NAMED_DATABASE_ID.
    try {
      if (
        NAMED_DATABASE_ID &&
        appInstance &&
        appInstance._delegate &&
        appInstance._delegate._container &&
        typeof appInstance._delegate._container.getProvider === 'function'
      ) {
        const fsProvider = appInstance._delegate._container.getProvider('firestore');
        if (fsProvider && typeof fsProvider.getImmediate === 'function' && fsProvider.instances) {
          const namedDelegate = fsProvider.getImmediate({ identifier: NAMED_DATABASE_ID });
          if (namedDelegate) {
            fsProvider.instances.set('[DEFAULT]', namedDelegate);
          }
        }
      }
    } catch (bindErr) {
      console.warn('Named Firestore database binding notice:', bindErr);
    }
    let fsInst = null;
    try {
      fsInst = appInstance.firestore(NAMED_DATABASE_ID);
    } catch (_) {
      fsInst = window.firebase.firestore();
    }
    try {
      if (fsInst && typeof fsInst.settings === 'function') {
        fsInst.settings({ experimentalAutoDetectLongPolling: true, merge: true });
      }
    } catch (_) {}
    return fsInst;
  }

  const activeListenerMap = new Map();
  let secondaryListenersAttached = false;
  let secondaryListenerTimer = null;
  let hasSuccessfulCloudSnapshot = false;

  function initFirebaseConnection(onStateReady) {
    if (navigator.onLine === false) {
      updateSyncBadge('offline', false);
    } else {
      updateSyncBadge('synchronizing', true);
    }

    if (typeof window.firebase === 'undefined') {
      updateSyncBadge('offline', false);
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
      // Connect to provisioned named Firestore database
      db = bindNamedFirestoreDatabaseInstance(firebaseApp);

      // Initialize Firebase Storage using the existing project bucket
      try {
        if (typeof window.firebase.storage === 'function') {
          storage = window.firebase.storage();
        }
      } catch (storageErr) {
        console.warn('Firebase Storage initialization notice:', storageErr);
      }
      isCloudConnected = true;

      auth.onAuthStateChanged((fbUser) => {
        if (window.CGpediaApp && typeof window.CGpediaApp.handleFirebaseAuthUser === 'function') {
          window.CGpediaApp.handleFirebaseAuthUser(fbUser || null);
        }
      });

      // Start Firestore synchronization non-blockingly in the background so UI renders immediately
      setTimeout(() => {
        subscribeCloudCollections();
      }, 10);

      if (onStateReady) onStateReady(true);
    } catch (err) {
      console.warn('Firebase initialization fallback:', err);
      updateSyncBadge(navigator.onLine === false ? 'offline' : 'error', false);
      if (window.CGpediaApp && typeof window.CGpediaApp.handleFirebaseAuthUser === 'function') {
        window.CGpediaApp.handleFirebaseAuthUser(null);
      }
      if (onStateReady) onStateReady(false);
    }
  }

  function attachSingleCollectionListener(col, key, onFirstSnapshotDone) {
    if (!db || activeListenerMap.has(col)) {
      if (typeof onFirstSnapshotDone === 'function') onFirstSnapshotDone();
      return;
    }
    let firstSnapFired = false;
    try {
      const unsub = db.collection(col).onSnapshot(
        (snap) => {
          hasSuccessfulCloudSnapshot = true;
          isCloudConnected = true;
          if (!firstSnapFired) {
            firstSnapFired = true;
            if (typeof onFirstSnapshotDone === 'function') onFirstSnapshotDone();
          }
          if (navigator.onLine !== false && currentSyncStatusState !== 'connected') {
            updateSyncBadge('connected', true);
          }
          if (!window.CGpediaApp || typeof window.CGpediaApp.mergeCloudCollection !== 'function') return;
          const docs = [];
          snap.forEach((doc) => {
            const data = doc.data() || {};
            if (data.isDeleted === true || data.status === 'deleted') {
              markDocDeletedLocally(col, doc.id);
              return;
            }
            docs.push(Object.assign({ id: doc.id }, data));
          });
          window.CGpediaApp.mergeCloudCollection(key, docs, col);
        },
        (err) => {
          if (!firstSnapFired) {
            firstSnapFired = true;
            if (typeof onFirstSnapshotDone === 'function') onFirstSnapshotDone();
          }
          activeListenerMap.delete(col);
          console.warn(`Firestore listener notice [${col}]:`, err && err.message ? err.message : err);
          if (navigator.onLine === false) {
            updateSyncBadge('offline', false);
            return;
          }
          // Keep status Connected when online and fallback to one-time collection fetch + quiet reconnect
          if (isCloudConnected || hasSuccessfulCloudSnapshot) {
            updateSyncBadge('connected', true);
          }
          try {
            db.collection(col).get().then((snap) => {
              if (!snap || !window.CGpediaApp || typeof window.CGpediaApp.mergeCloudCollection !== 'function') return;
              hasSuccessfulCloudSnapshot = true;
              if (navigator.onLine !== false) updateSyncBadge('connected', true);
              const docs = [];
              snap.forEach((doc) => {
                const data = doc.data() || {};
                if (data.isDeleted === true || data.status === 'deleted') {
                  markDocDeletedLocally(col, doc.id);
                  return;
                }
                docs.push(Object.assign({ id: doc.id }, data));
              });
              window.CGpediaApp.mergeCloudCollection(key, docs, col);
            }).catch(() => {});
          } catch (_) {}
        }
      );
      activeListenerMap.set(col, unsub);
      activeUnsubscribes.push(unsub);
    } catch (_) {
      if (!firstSnapFired && typeof onFirstSnapshotDone === 'function') {
        firstSnapFired = true;
        onFirstSnapshotDone();
      }
    }
  }

  let studentPaymentListenersAttached = false;

  function subscribeStudentSupportCollectionsNow() {
    if (!db || studentPaymentListenersAttached) return;
    studentPaymentListenersAttached = true;
    const supportCollections = [
      { col: 'purchases', key: 'activations' },
      { col: 'coupons', key: 'coupons' },
      { col: 'users', key: 'registeredStudents' }
    ];
    supportCollections.forEach(({ col, key }, idx) => {
      setTimeout(() => {
        attachSingleCollectionListener(col, key);
      }, idx * 120);
    });
  }

  function subscribeSecondaryCollectionsNow() {
    if (!db || secondaryListenersAttached) return;
    secondaryListenersAttached = true;
    if (secondaryListenerTimer) {
      clearTimeout(secondaryListenerTimer);
      secondaryListenerTimer = null;
    }

    // Tier 2: Deferred Admin & Question Bank Collections (staggered so main thread never freezes)
    const secondaryCollections = [
      { col: 'purchases', key: 'activations' },
      { col: 'coupons', key: 'coupons' },
      { col: 'users', key: 'registeredStudents' },
      { col: 'upcoming_tests', key: 'upcomingTests' },
      { col: 'admin_staff', key: 'adminStaff' },
      { col: 'exams', key: 'examMaster' },
      { col: 'subjects', key: 'subjectMaster' },
      { col: 'topics', key: 'topicMaster' },
      { col: 'subtopics', key: 'subtopicMaster' },
      { col: 'question_bank', key: 'questionBank' },
      { col: 'orders', key: 'orders' },
      { col: 'student_queries', key: 'queries' },
      { col: 'question_reports', key: 'questionReports' }
    ];

    secondaryCollections.forEach(({ col, key }, idx) => {
      setTimeout(() => {
        attachSingleCollectionListener(col, key);
      }, idx * 90);
    });
  }

  function subscribeCloudCollections() {
    if (!db) return;
    if (activeListenerMap.size > 0) return; // Prevent duplicate listeners

    if (navigator.onLine !== false) {
      updateSyncBadge('synchronizing', true);
    }

    // Tier 1: Essential initial collections needed for Home Dashboard, Stories, Tests & Notifications
    const essentialCollections = [
      { col: 'app_config', key: 'configDocs' },
      { col: 'exam_folders', key: 'folders' },
      { col: 'tests', key: 'tests' },
      { col: 'current_affairs', key: 'stories' },
      { col: 'broadcast_notifications', key: 'notifications' },
      { col: 'leaderboard', key: 'leaderboard' }
    ];

    let remainingEssential = essentialCollections.length;
    const markEssentialReceived = () => {
      remainingEssential -= 1;
      if (remainingEssential <= 0) {
        if (navigator.onLine !== false) {
          updateSyncBadge('connected', true);
        }
        if (!studentPaymentListenersAttached && !secondaryListenerTimer) {
          secondaryListenerTimer = setTimeout(() => {
            subscribeStudentSupportCollectionsNow();
          }, 900);
        }
      }
    };

    essentialCollections.forEach(({ col, key }, idx) => {
      setTimeout(() => {
        attachSingleCollectionListener(col, key, markEssentialReceived);
      }, idx * 45);
    });

    // Fallback: ensure Connected badge and lightweight student support listeners activate smoothly
    setTimeout(() => {
      if (navigator.onLine !== false && isCloudConnected) {
        updateSyncBadge('connected', true);
      }
      subscribeStudentSupportCollectionsNow();
    }, 1500);
  }

  function prepareCloudPayload(docId, payload) {
    const cleanPayload = JSON.parse(JSON.stringify(payload || {}));
    if (!cleanPayload.id && docId) {
      cleanPayload.id = String(docId);
    }
    if (!cleanPayload.updatedAtIso) {
      cleanPayload.updatedAtIso = new Date().toISOString();
    }
    if (isCurrentLocalAdminSession() || !cleanPayload.updatedByAdminEmail) {
      cleanPayload.updatedByAdminEmail = OWNER_ADMIN_EMAIL;
    }
    if (window.firebase && window.firebase.firestore && window.firebase.firestore.FieldValue) {
      cleanPayload.updatedAtTs = window.firebase.firestore.FieldValue.serverTimestamp();
    }
    return cleanPayload;
  }

  async function saveCloudDoc(collectionName, docId, payload) {
    if (!db || !docId) return false;
    try {
      unmarkDocDeletedLocally(collectionName, docId);
      const cleanPayload = prepareCloudPayload(docId, payload);
      await db.collection(collectionName).doc(String(docId)).set(cleanPayload, { merge: true });
      return true;
    } catch (err) {
      console.warn(`Cloud write [${collectionName}/${docId}] deferred locally:`, err.message || err);
      return false;
    }
  }

  async function deleteCloudDoc(collectionName, docId) {
    if (!docId) return false;
    markDocDeletedLocally(collectionName, docId);
    if (!db) return false;
    try {
      await db.collection(collectionName).doc(String(docId)).delete();
      return true;
    } catch (err) {
      try {
        await db.collection(collectionName).doc(String(docId)).set({
          id: String(docId),
          isDeleted: true,
          status: 'deleted',
          updatedAtIso: new Date().toISOString(),
          updatedByAdminEmail: OWNER_ADMIN_EMAIL
        }, { merge: true });
        return true;
      } catch (err2) {
        console.warn(`Cloud delete [${collectionName}/${docId}] failed:`, err2.message || err2);
        return false;
      }
    }
  }

  async function batchSaveCloudDocs(collectionName, docsArray, onProgress) {
    const items = Array.isArray(docsArray) ? docsArray.filter((d) => d && d.id) : [];
    if (items.length === 0) return { committed: 0, failed: 0 };
    if (!db || typeof db.batch !== 'function') {
      if (typeof onProgress === 'function') onProgress(100, items.length, items.length);
      return { committed: items.length, failed: 0, offline: true };
    }
    const CHUNK_SIZE = 100; // Keep batch payload size well within Firestore request limits
    let committed = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      try {
        const batch = db.batch();
        chunk.forEach((docObj) => {
          unmarkDocDeletedLocally(collectionName, docObj.id);
          const cleanPayload = prepareCloudPayload(docObj.id, docObj);
          const docRef = db.collection(collectionName).doc(String(docObj.id));
          batch.set(docRef, cleanPayload, { merge: true });
        });
        await batch.commit();
        committed += chunk.length;
      } catch (err) {
        console.warn(`Batch write chunk [${collectionName}] fallback to individual writes:`, err.message || err);
        for (const docObj of chunk) {
          const ok = await saveCloudDoc(collectionName, docObj.id, docObj);
          if (ok) committed += 1;
          else failed += 1;
        }
      }
      if (typeof onProgress === 'function') {
        const done = Math.min(items.length, i + chunk.length);
        const pct = Math.round((done / items.length) * 100);
        onProgress(pct, done, items.length);
      }
    }
    return { committed, failed };
  }

  async function batchDeleteCloudDocs(collectionName, docIdsArray, onProgress) {
    const ids = Array.isArray(docIdsArray) ? docIdsArray.map((id) => String(id || '').trim()).filter(Boolean) : [];
    if (ids.length === 0) return { deleted: 0, failed: 0 };
    ids.forEach((docId) => markDocDeletedLocally(collectionName, docId));
    if (!db || typeof db.batch !== 'function') {
      if (typeof onProgress === 'function') onProgress(100, ids.length, ids.length);
      return { deleted: ids.length, failed: 0, offline: true };
    }
    const CHUNK_SIZE = 100;
    let deleted = 0;
    let failed = 0;

    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE);
      try {
        const batch = db.batch();
        chunk.forEach((docId) => {
          const docRef = db.collection(collectionName).doc(docId);
          batch.delete(docRef);
        });
        await batch.commit();
        deleted += chunk.length;
      } catch (err) {
        console.warn(`Batch delete chunk [${collectionName}] fallback:`, err.message || err);
        for (const docId of chunk) {
          const ok = await deleteCloudDoc(collectionName, docId);
          if (ok) deleted += 1;
          else failed += 1;
        }
      }
      if (typeof onProgress === 'function') {
        const done = Math.min(ids.length, i + chunk.length);
        const pct = Math.round((done / ids.length) * 100);
        onProgress(pct, done, ids.length);
      }
    }
    return { deleted, failed };
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

  function computeCloudCredDigest(email, password) {
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

  async function registerWithEmailPassword(name, email, password, phone, targetExams) {
    if (navigator.onLine === false) {
      const netErr = new Error('Offline registration is disabled.');
      netErr.code = 'auth/network-request-failed';
      throw netErr;
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    const digest = computeCloudCredDigest(cleanEmail, password);

    if (auth && typeof window.firebase !== 'undefined') {
      try {
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
            credDigest: digest,
            phoneNumber: String(phone || '').trim(),
            targetExams: Array.isArray(targetExams) ? targetExams : ['CGPSC'],
            role: cleanEmail === OWNER_ADMIN_EMAIL ? 'admin' : 'student',
            createdAtIso: new Date().toISOString()
          });
        }
        return fbUser;
      } catch (fbErr) {
        const code = String((fbErr && fbErr.code) || '');
        if (
          code.includes('email-already-in-use') ||
          code.includes('invalid-email') ||
          code.includes('weak-password') ||
          code.includes('network-request-failed')
        ) {
          throw fbErr;
        }
        // If Email/Password provider is not enabled in Firebase Auth console (operation-not-allowed),
        // fall through to online Cloud Firestore `users` registration below.
      }
    }

    if (!db) {
      throw new Error('Cloud database connection unavailable. Please check your internet connection.');
    }

    const existingSnap = await db.collection('users').where('email', '==', cleanEmail).get();
    if (existingSnap && !existingSnap.empty) {
      let hasRegisteredCred = false;
      existingSnap.forEach((doc) => {
        const d = doc.data() || {};
        if (d.credDigest) hasRegisteredCred = true;
      });
      if (hasRegisteredCred) {
        const dupErr = new Error('This email is already registered.');
        dupErr.code = 'auth/email-already-in-use';
        throw dupErr;
      }
    }

    const cloudUid = 'USR-' + computeCloudCredDigest(cleanEmail, 'uid_seed_v1').toUpperCase();
    const nowIso = new Date().toISOString();
    await saveCloudDoc('users', cloudUid, {
      userId: cloudUid,
      displayName: name || 'Aspirant',
      email: cleanEmail,
      credDigest: digest,
      phoneNumber: String(phone || '').trim(),
      targetExams: Array.isArray(targetExams) ? targetExams : ['CGPSC'],
      role: cleanEmail === OWNER_ADMIN_EMAIL ? 'admin' : 'student',
      createdAtIso: nowIso,
      updatedAtIso: nowIso
    });

    return {
      uid: cloudUid,
      displayName: name || 'Aspirant',
      email: cleanEmail,
      phoneNumber: String(phone || '').trim()
    };
  }

  async function signInWithEmailPassword(email, password) {
    if (navigator.onLine === false) {
      const netErr = new Error('Offline login is disabled.');
      netErr.code = 'auth/network-request-failed';
      throw netErr;
    }
    const cleanEmail = String(email || '').trim().toLowerCase();
    const digest = computeCloudCredDigest(cleanEmail, password);

    if (auth && typeof window.firebase !== 'undefined') {
      try {
        const cred = await auth.signInWithEmailAndPassword(cleanEmail, password);
        if (cred && cred.user && db) {
          saveCloudDoc('users', cred.user.uid, {
            userId: cred.user.uid,
            email: cleanEmail,
            credDigest: digest,
            updatedAtIso: new Date().toISOString()
          }).catch(() => {});
        }
        return cred.user;
      } catch (fbErr) {
        const code = String((fbErr && fbErr.code) || '');
        if (
          code.includes('wrong-password') ||
          code.includes('network-request-failed') ||
          code.includes('too-many-requests') ||
          code.includes('user-disabled')
        ) {
          throw fbErr;
        }
        // Fall through to online Cloud Firestore `users` verification when provider is operation-not-allowed or account was registered in Firestore
      }
    }

    if (!db) {
      throw new Error('Cloud database connection unavailable. Please check your internet connection.');
    }

    const snap = await db.collection('users').where('email', '==', cleanEmail).get();
    if (!snap || snap.empty) {
      const notFoundErr = new Error('No registered account found with this email.');
      notFoundErr.code = 'auth/user-not-found';
      throw notFoundErr;
    }

    let matchedDoc = null;
    let docWithoutCred = null;
    snap.forEach((doc) => {
      const data = Object.assign({ id: doc.id }, doc.data());
      if (data.credDigest && data.credDigest === digest) {
        matchedDoc = data;
      } else if (!data.credDigest && !docWithoutCred) {
        docWithoutCred = data;
      }
    });

    if (!matchedDoc && docWithoutCred) {
      // Existing cloud user profile from before password digest was stored: bind digest now
      await saveCloudDoc('users', docWithoutCred.userId || docWithoutCred.id, {
        credDigest: digest,
        updatedAtIso: new Date().toISOString()
      });
      matchedDoc = docWithoutCred;
    }

    if (!matchedDoc) {
      const wrongPassErr = new Error('Incorrect password for this account.');
      wrongPassErr.code = 'auth/wrong-password';
      throw wrongPassErr;
    }

    return {
      uid: matchedDoc.userId || matchedDoc.id,
      displayName: matchedDoc.displayName || matchedDoc.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      phoneNumber: matchedDoc.phoneNumber || matchedDoc.phone || ''
    };
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

  const _queryCache = new Map();

  async function queryQuestionBankFromCloud(filters) {
    const flt = filters || {};
    const cacheKey = JSON.stringify({
      examId: flt.examId || 'ALL',
      subjectId: flt.subjectId || 'ALL',
      topicId: flt.topicId || 'ALL',
      subtopicId: flt.subtopicId || 'ALL',
      difficultyLevel: flt.difficultyLevel || 'ALL',
      verificationStatus: flt.verificationStatus || 'ALL',
      limit: flt.limit || 200
    });
    const cached = _queryCache.get(cacheKey);
    if (cached && (Date.now() - cached.ts) < 15000 && !flt.forceRefresh) {
      return cached.docs;
    }
    if (!db) return null;
    try {
      let queryRef = db.collection('question_bank');
      if (flt.examId && flt.examId !== 'ALL') {
        queryRef = queryRef.where('examIds', 'array-contains', String(flt.examId));
      }
      if (flt.subjectId && flt.subjectId !== 'ALL') {
        queryRef = queryRef.where('subjectId', '==', String(flt.subjectId));
      }
      if (flt.topicId && flt.topicId !== 'ALL') {
        queryRef = queryRef.where('topicId', '==', String(flt.topicId));
      }
      if (flt.subtopicId && flt.subtopicId !== 'ALL') {
        queryRef = queryRef.where('subtopicId', '==', String(flt.subtopicId));
      }
      if (flt.difficultyLevel && flt.difficultyLevel !== 'ALL') {
        queryRef = queryRef.where('difficultyLevel', '==', String(flt.difficultyLevel));
      }
      if (flt.verificationStatus && flt.verificationStatus !== 'ALL') {
        queryRef = queryRef.where('verificationStatus', '==', String(flt.verificationStatus));
      }
      if (flt.limit && Number(flt.limit) > 0) {
        queryRef = queryRef.limit(Number(flt.limit));
      }
      const snap = await queryRef.get();
      const docs = [];
      snap.forEach((doc) => {
        docs.push(Object.assign({ id: doc.id }, doc.data()));
      });
      _queryCache.set(cacheKey, { ts: Date.now(), docs });
      return docs;
    } catch (err) {
      console.warn('Indexed Firestore query fallback to in-memory index:', err.message || err);
      return null;
    }
  }

  function invalidateQuestionBankQueryCache() {
    _queryCache.clear();
  }

  async function syncAllAdminStateToCloud(stateObj) {
    if (!db || !stateObj) return { synced: 0 };
    let totalSynced = 0;
    try {
      if (stateObj.config) {
        const ok = await saveCloudDoc('app_config', 'global', Object.assign({ id: 'global', configKey: 'global' }, stateObj.config));
        if (ok) totalSynced += 1;
      }
      if (stateObj.customTaxonomy) {
        const ok = await saveCloudDoc('app_config', 'taxonomy', Object.assign({ id: 'taxonomy', configKey: 'taxonomy' }, stateObj.customTaxonomy));
        if (ok) totalSynced += 1;
      }
      const collectionsMap = [
        { col: 'exam_folders', list: stateObj.folders },
        { col: 'tests', list: stateObj.tests },
        { col: 'question_bank', list: stateObj.questionBank },
        { col: 'current_affairs', list: stateObj.stories },
        { col: 'broadcast_notifications', list: stateObj.notifications },
        { col: 'upcoming_tests', list: stateObj.upcomingTests },
        { col: 'coupons', list: stateObj.coupons },
        { col: 'purchases', list: stateObj.activations },
        { col: 'orders', list: stateObj.orders },
        { col: 'admin_staff', list: stateObj.adminStaff },
        { col: 'exams', list: stateObj.examMaster },
        { col: 'subjects', list: stateObj.subjectMaster },
        { col: 'topics', list: stateObj.topicMaster },
        { col: 'subtopics', list: stateObj.subtopicMaster }
      ];
      for (const entry of collectionsMap) {
        const arr = Array.isArray(entry.list) ? entry.list.filter((item) => item && item.id && !isDocDeletedLocally(entry.col, item.id)) : [];
        if (arr.length > 0) {
          const res = await batchSaveCloudDocs(entry.col, arr);
          totalSynced += (res && res.committed) ? res.committed : 0;
        }
      }
    } catch (err) {
      console.warn('syncAllAdminStateToCloud notice:', err && err.message ? err.message : err);
    }
    return { synced: totalSynced };
  }

  window.CGpediaCloud = {
    OWNER_ADMIN_EMAIL,
    NAMED_DATABASE_ID,
    MAIN_CATEGORIES,
    EXAM_CATEGORIES,
    PYQ_EXAM_CATEGORIES,
    DEFAULT_SUBJECTS,
    DEFAULT_TOPICS,
    DEFAULT_SUBTOPICS,
    MAX_ANTHEM_FILE_BYTES,
    initFirebaseConnection,
    subscribeSecondaryCollectionsNow,
    updateSyncBadge,
    getActiveListenerCount: () => activeListenerMap.size,
    saveCloudDoc,
    deleteCloudDoc,
    batchSaveCloudDocs,
    batchDeleteCloudDocs,
    syncAllAdminStateToCloud,
    isDocDeletedLocally,
    markDocDeletedLocally,
    unmarkDocDeletedLocally,
    queryQuestionBankFromCloud,
    invalidateQuestionBankQueryCache,
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

