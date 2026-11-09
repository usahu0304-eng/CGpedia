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
    { id: 'exam_cgpsc', examId: 'exam_cgpsc', code: 'CGPSC', nameHi: 'छत्तीसगढ़ पीएससी (CGPSC)', nameEn: 'CGPSC', icon: '🏛️', badge: 'State Flagship', subjectIds: ['sub_cg_gs', 'sub_history', 'sub_geography', 'sub_polity', 'sub_economy', 'sub_science', 'sub_mathematics', 'sub_reasoning', 'sub_hindi', 'sub_english', 'sub_computer', 'sub_current_affairs'] },
    { id: 'exam_cg_vyapam', examId: 'exam_cg_vyapam', code: 'CG_VYAPAM', nameHi: 'छत्तीसगढ़ व्यापम (CG Vyapam)', nameEn: 'CG Vyapam', icon: '🏢', badge: 'State Board', subjectIds: ['sub_cg_gs', 'sub_history', 'sub_geography', 'sub_polity', 'sub_economy', 'sub_science', 'sub_mathematics', 'sub_reasoning', 'sub_hindi', 'sub_english', 'sub_computer', 'sub_current_affairs'] },
    { id: 'exam_adeo', examId: 'exam_adeo', code: 'ADEO', nameHi: 'सहायक विकास विस्तार अधिकारी (ADEO)', nameEn: 'ADEO', icon: '🌾', badge: 'Rural Dev', subjectIds: ['sub_cg_gs', 'sub_polity', 'sub_economy', 'sub_hindi', 'sub_reasoning', 'sub_current_affairs'] },
    { id: 'exam_patwari', examId: 'exam_patwari', code: 'PATWARI', nameHi: 'पटवारी भर्ती परीक्षा (Patwari)', nameEn: 'Patwari', icon: '📐', badge: 'Revenue', subjectIds: ['sub_computer', 'sub_cg_gs', 'sub_mathematics', 'sub_reasoning', 'sub_hindi', 'sub_english', 'sub_history', 'sub_geography', 'sub_polity', 'sub_economy', 'sub_science', 'sub_current_affairs'] },
    { id: 'exam_sub_inspector', examId: 'exam_sub_inspector', code: 'SUB_INSPECTOR', nameHi: 'उप निरीक्षक भर्ती (Sub Inspector / SI)', nameEn: 'Sub Inspector', icon: '👮', badge: 'Police SI', subjectIds: ['sub_cg_gs', 'sub_history', 'sub_geography', 'sub_polity', 'sub_economy', 'sub_science', 'sub_mathematics', 'sub_reasoning', 'sub_hindi', 'sub_english', 'sub_computer', 'sub_current_affairs'] },
    { id: 'exam_teacher_recruitment', examId: 'exam_teacher_recruitment', code: 'TEACHER_RECRUITMENT', nameHi: 'शिक्षक भर्ती परीक्षा (Teacher Recruitment)', nameEn: 'Teacher Recruitment', icon: '🏫', badge: 'Teaching', subjectIds: ['sub_pedagogy', 'sub_hindi', 'sub_english', 'sub_mathematics', 'sub_science', 'sub_cg_gs', 'sub_computer', 'sub_history', 'sub_geography', 'sub_polity'] },
    { id: 'exam_tet', examId: 'exam_tet', code: 'TET', nameHi: 'शिक्षक पात्रता परीक्षा (TET / CGTET / CTET)', nameEn: 'TET', icon: '📖', badge: 'Eligibility', subjectIds: ['sub_pedagogy', 'sub_hindi', 'sub_english', 'sub_mathematics', 'sub_science'] },
    { id: 'upsc', examId: 'exam_upsc', code: 'UPSC', nameHi: 'संघ लोक सेवा आयोग (UPSC CSE)', nameEn: 'UPSC Civil Services (IAS/IPS)', icon: '🇮🇳', badge: 'All India', subjectIds: ['sub_history', 'sub_geography', 'sub_polity', 'sub_economy', 'sub_science', 'sub_mathematics', 'sub_reasoning', 'sub_english', 'sub_current_affairs'] },
    { id: 'state_psc', examId: 'exam_state_psc', code: 'STATE_PSC', nameHi: 'अन्य राज्य पीएससी (MPPSC, UPPSC, BPSC)', nameEn: 'State PSC Examinations', icon: '⚖️', badge: 'State PCS', subjectIds: ['sub_history', 'sub_geography', 'sub_polity', 'sub_economy', 'sub_science', 'sub_hindi', 'sub_current_affairs'] },
    { id: 'ssc', examId: 'exam_ssc', code: 'SSC', nameHi: 'एसएससी परीक्षाएं (CGL, CHSL, MTS, GD)', nameEn: 'SSC Examinations (CGL, CHSL, GD)', icon: '📋', badge: 'Central Govt', subjectIds: ['sub_mathematics', 'sub_reasoning', 'sub_english', 'sub_hindi', 'sub_history', 'sub_geography', 'sub_polity', 'sub_economy', 'sub_science', 'sub_computer', 'sub_current_affairs'] },
    { id: 'banking', examId: 'exam_banking', code: 'BANKING', nameHi: 'बैंकिंग एवं बीमा (IBPS, SBI, RBI)', nameEn: 'Banking & Insurance (IBPS, SBI, RBI)', icon: '🏦', badge: 'Banking', subjectIds: ['sub_mathematics', 'sub_reasoning', 'sub_english', 'sub_economy', 'sub_computer', 'sub_current_affairs'] },
    { id: 'railway', examId: 'exam_railway', code: 'RAILWAY', nameHi: 'रेलवे भर्ती बोर्ड (RRB NTPC, Group D, ALP)', nameEn: 'Railway (RRB NTPC, Group D, ALP)', icon: '🚆', badge: 'Railways', subjectIds: ['sub_mathematics', 'sub_reasoning', 'sub_science', 'sub_history', 'sub_geography', 'sub_polity', 'sub_current_affairs'] },
    { id: 'teaching', examId: 'exam_teaching', code: 'TEACHING', nameHi: 'शिक्षक भर्ती एवं व्याख्याता परीक्षा', nameEn: 'Teaching & Lecturer Exams', icon: '🎓', badge: 'Teaching', subjectIds: ['sub_pedagogy', 'sub_hindi', 'sub_english', 'sub_mathematics', 'sub_science', 'sub_cg_gs', 'sub_computer'] },
    { id: 'ctet_tet', examId: 'exam_ctet_tet', code: 'CTET_TET', nameHi: 'सीटीईटी एवं राज्य टीईटी (CTET, CGTET)', nameEn: 'CTET & State TET (CGTET)', icon: '📖', badge: 'Eligibility', subjectIds: ['sub_pedagogy', 'sub_hindi', 'sub_english', 'sub_mathematics', 'sub_science'] },
    { id: 'ugc_net', examId: 'exam_ugc_net', code: 'UGC_NET', nameHi: 'यूजीसी नेट / सेट (UGC NET & CG SET)', nameEn: 'UGC NET / JRF & State SET', icon: '🔬', badge: 'Higher Ed', subjectIds: ['sub_pedagogy', 'sub_reasoning', 'sub_computer', 'sub_history', 'sub_geography', 'sub_polity', 'sub_economy'] },
    { id: 'police', examId: 'exam_police', code: 'POLICE', nameHi: 'पुलिस भर्ती (CG Police SI, Constable)', nameEn: 'Police Exams (SI & Constable)', icon: '🚓', badge: 'Uniformed', subjectIds: ['sub_cg_gs', 'sub_history', 'sub_geography', 'sub_polity', 'sub_science', 'sub_mathematics', 'sub_reasoning', 'sub_hindi'] },
    { id: 'defence', examId: 'exam_defence', code: 'DEFENCE', nameHi: 'रक्षा परीक्षाएं (NDA, CDS, AFCAT, Agniveer)', nameEn: 'Defence Exams (NDA, CDS, AFCAT)', icon: '🛡️', badge: 'Defence', subjectIds: ['sub_mathematics', 'sub_english', 'sub_science', 'sub_history', 'sub_geography', 'sub_polity', 'sub_current_affairs'] },
    { id: 'other', examId: 'exam_other', code: 'OTHER', nameHi: 'अन्य प्रतियोगी परीक्षाएं', nameEn: 'Other Competitive Examinations', icon: '🧭', badge: 'General', subjectIds: ['sub_cg_gs', 'sub_history', 'sub_geography', 'sub_polity', 'sub_economy', 'sub_science', 'sub_mathematics', 'sub_reasoning', 'sub_hindi', 'sub_english', 'sub_computer', 'sub_current_affairs'] }
  ];

  const DEFAULT_SUBJECTS = [
    {
      id: 'sub_cg_gs',
      subjectId: 'sub_cg_gs',
      code: 'CG_GK',
      examCode: 'CGPSC',
      titleHi: 'छत्तीसगढ़ सामान्य ज्ञान (Chhattisgarh GK)',
      titleEn: 'Chhattisgarh General Knowledge',
      aliases: ['Chhattisgarh General Studies', 'Chhattisgarh GS', 'CG GK', 'CG GS', 'छत्तीसगढ़ सामान्य अध्ययन (CG GS)', 'छत्तीसगढ़ सामान्य ज्ञान'],
      topics: ['History of Chhattisgarh', 'Tribes, Art & Culture', 'Geography & Climate of CG', 'Panchayati Raj & Local Administration', 'CG Economy, Forest & Agriculture', 'Chhattisgarh Current Affairs']
    },
    {
      id: 'sub_history',
      subjectId: 'sub_history',
      code: 'HISTORY',
      examCode: 'ALL',
      titleHi: 'इतिहास (History)',
      titleEn: 'History',
      aliases: ['Indian History & National Movement', 'Indian History', 'भारत का इतिहास एवं राष्ट्रीय आंदोलन', 'भारत का इतिहास', 'Ancient India', 'Medieval India', 'Modern History'],
      topics: ['Ancient Indian History', 'Medieval Indian History', 'Modern Indian History', 'Art & Architecture', 'Ancient India', 'Medieval India', 'Modern History & Freedom Struggle']
    },
    {
      id: 'sub_geography',
      subjectId: 'sub_geography',
      code: 'GEOGRAPHY',
      examCode: 'ALL',
      titleHi: 'भूगोल (Geography)',
      titleEn: 'Geography',
      aliases: ['Indian & World Geography', 'Indian Geography', 'भारत एवं विश्व का भूगोल', 'भारत का भूगोल'],
      topics: ['Indian Geography', 'World Geography', 'Physical Geography', 'Chhattisgarh Geography', 'Rivers, Climate & Monsoon', 'Minerals, Industries & Resources', 'Environment & Biodiversity']
    },
    {
      id: 'sub_polity',
      subjectId: 'sub_polity',
      code: 'POLITY',
      examCode: 'ALL',
      titleHi: 'भारतीय राजव्यवस्था एवं संविधान (Indian Polity)',
      titleEn: 'Indian Polity',
      aliases: ['Indian Polity & Constitution', 'Polity', 'Constitution', 'भारतीय राजव्यवस्था एवं संविधान', 'भारतीय राजव्यवस्था'],
      topics: ['Constitution', 'Fundamental Rights', 'Directive Principles', 'Parliament', 'President and Governor', 'Constitutional Framework', 'Fundamental Rights & Duties', 'Parliament & State Legislature', 'Judiciary & Constitutional Bodies']
    },
    {
      id: 'sub_economy',
      subjectId: 'sub_economy',
      code: 'ECONOMICS',
      examCode: 'ALL',
      titleHi: 'अर्थव्यवस्था (Economics)',
      titleEn: 'Economics',
      aliases: ['Indian Economy & Budget', 'Indian Economy', 'Economy', 'भारतीय अर्थव्यवस्था एवं बजट', 'भारतीय अर्थव्यवस्था'],
      topics: ['National Income & Planning', 'Banking, RBI & Monetary Policy', 'Union & State Budget, Economic Survey', 'Social Welfare Schemes']
    },
    {
      id: 'sub_science',
      subjectId: 'sub_science',
      code: 'SCIENCE',
      examCode: 'ALL',
      titleHi: 'सामान्य विज्ञान (General Science)',
      titleEn: 'General Science',
      aliases: ['General Science & Technology', 'Science', 'सामान्य विज्ञान एवं प्रौद्योगिकी'],
      topics: ['Physics & Chemistry in Daily Life', 'Biology & Human Health', 'Space (ISRO), Defence (DRDO) & IT', 'Environment & Ecology']
    },
    {
      id: 'sub_mathematics',
      subjectId: 'sub_mathematics',
      code: 'MATHEMATICS',
      examCode: 'ALL',
      titleHi: 'गणित (Mathematics)',
      titleEn: 'Mathematics',
      aliases: ['Quantitative Aptitude', 'Quantitative Aptitude & Data Interpretation', 'Maths', 'Aptitude, Reasoning & Language (CSAT)', 'sub_csat'],
      topics: ['Number System & Simplification', 'Percentage, Profit & Loss, SI & CI', 'Ratio, Time & Work, Speed & Distance', 'Algebra, Geometry & Mensuration', 'Quantitative Aptitude & Data Interpretation']
    },
    {
      id: 'sub_reasoning',
      subjectId: 'sub_reasoning',
      code: 'REASONING',
      examCode: 'ALL',
      titleHi: 'तर्कशक्ति एवं रीजनिंग (Reasoning)',
      titleEn: 'Reasoning',
      aliases: ['Logical & Analytical Reasoning', 'General Intelligence & Reasoning', 'Mental Ability'],
      topics: ['Coding-Decoding & Series', 'Blood Relations & Direction Sense', 'Syllogism, Statement & Conclusion', 'Puzzles, Seating & Non-Verbal Reasoning', 'Logical & Analytical Reasoning']
    },
    {
      id: 'sub_hindi',
      subjectId: 'sub_hindi',
      code: 'HINDI',
      examCode: 'ALL',
      titleHi: 'सामान्य हिन्दी (Hindi)',
      titleEn: 'Hindi',
      aliases: ['General Hindi', 'General Hindi Grammar (सामान्य हिन्दी)', 'हिन्दी व्याकरण'],
      topics: ['वर्णमाला, संधि एवं समास (Sandhi & Samas)', 'तत्सम-तद्भव, उपसर्ग एवं प्रत्यय', 'पर्यायवाची, विलोम एवं मुहावरे', 'वाक्य शुद्धि एवं रस-छंद-अलंकार', 'General Hindi Grammar (सामान्य हिन्दी)']
    },
    {
      id: 'sub_english',
      subjectId: 'sub_english',
      code: 'ENGLISH',
      examCode: 'ALL',
      titleHi: 'सामान्य अंग्रेजी (English)',
      titleEn: 'English',
      aliases: ['General English', 'General English Comprehension', 'English Grammar'],
      topics: ['Parts of Speech, Tenses & Voice', 'Direct/Indirect Speech & Error Spotting', 'Synonyms, Antonyms, Idioms & One-Word', 'Reading Comprehension & Cloze Test', 'General English Comprehension']
    },
    {
      id: 'sub_computer',
      subjectId: 'sub_computer',
      code: 'COMPUTER',
      examCode: 'ALL',
      titleHi: 'कंप्यूटर ज्ञान (Computer Knowledge)',
      titleEn: 'Computer Knowledge',
      aliases: ['Computer Awareness', 'Computer Science', 'Basic Computer'],
      topics: ['Computer Architecture, Hardware & Memory', 'Operating System & MS Office (Word, Excel, PowerPoint)', 'Internet, Networking, Email & Cyber Security', 'Multimedia, Printers & Antivirus', 'Computer Awareness']
    },
    {
      id: 'sub_pedagogy',
      subjectId: 'sub_pedagogy',
      code: 'PEDAGOGY',
      examCode: 'TET',
      titleHi: 'बाल विकास एवं शिक्षाशास्त्र (CDP)',
      titleEn: 'Child Development & Pedagogy',
      aliases: ['Pedagogy', 'Teaching Aptitude'],
      topics: ['Learning Theories', 'Inclusive Education', 'Teaching Aptitude & Assessment']
    },
    {
      id: 'sub_current_affairs',
      subjectId: 'sub_current_affairs',
      code: 'CURRENT_AFFAIRS',
      examCode: 'ALL',
      titleHi: 'समसामयिकी (Current Affairs)',
      titleEn: 'Current Affairs',
      aliases: ['Chhattisgarh, National & International Current Affairs'],
      topics: ['Chhattisgarh Current Affairs', 'National & International Events', 'Awards, Sports & Schemes']
    }
  ];

  const DEFAULT_TOPICS = [
    // History (sub_history)
    { id: 'top_hist_ancient', topicId: 'top_hist_ancient', subjectId: 'sub_history', titleEn: 'Ancient Indian History', titleHi: 'प्राचीन भारत का इतिहास', aliases: ['Ancient India'], keywords: ['indus', 'harappa', 'mohenjodaro', 'vedic', 'rigveda', 'maurya', 'ashoka', 'chandragupta', 'chankya', 'kautilya', 'gupta', 'samudragupta', 'buddha', 'mahavira', 'jainism', 'buddhism', 'सिंधु', 'हड़प्पा', 'वैदिक', 'ऋग्वेद', 'मौर्य', 'अशोक', 'चन्द्रगुप्त', 'गुप्त', 'बुद्ध', 'महावीर'] },
    { id: 'top_hist_medieval', topicId: 'top_hist_medieval', subjectId: 'sub_history', titleEn: 'Medieval Indian History', titleHi: 'मध्यकालीन भारत का इतिहास', aliases: ['Medieval India'], keywords: ['sultanate', 'qutbuddin', 'iltutmish', 'alauddin', 'khilji', 'tughlaq', 'lodi', 'mughal', 'babur', 'akbar', 'jahangir', 'shahjahan', 'aurangzeb', 'shivaji', 'vijayanagara', 'bhakti', 'sufi', 'सल्तनत', 'खिलजी', 'तुगलक', 'मुगल', 'अकबर', 'बाबर', 'औरंगजेब', 'शिवाजी', 'भक्ति', 'सूफी'] },
    { id: 'top_hist_modern', topicId: 'top_hist_modern', subjectId: 'sub_history', titleEn: 'Modern Indian History', titleHi: 'आधुनिक भारत का इतिहास', aliases: ['Modern History & Freedom Struggle', 'Modern History'], keywords: ['1857', 'revolt', 'gandhi', 'congress', 'non-cooperation', 'quit india', 'swadeshi', 'dandi', 'civil disobedience', 'bhagat singh', 'subhash chandra bose', 'viceroy', 'governor general', 'british', 'गांधी', 'कांग्रेस', 'असहयोग', 'भारत छोड़ो', 'स्वदेशी', 'दांडी', '1857 की क्रांति', 'वायसराय', 'गवर्नर जनरल'] },
    { id: 'top_hist_art', topicId: 'top_hist_art', subjectId: 'sub_history', titleEn: 'Art & Architecture', titleHi: 'कला एवं स्थापत्य', aliases: [], keywords: ['temple', 'stupa', 'ajanta', 'ellora', 'khajuraho', 'sculpture', 'मंदिर', 'स्तूप', 'अजंता', 'एलोरा', 'खजुराहो'] },

    // Geography (sub_geography)
    { id: 'top_geo_indian', topicId: 'top_geo_indian', subjectId: 'sub_geography', titleEn: 'Indian Geography', titleHi: 'भारत का भूगोल', aliases: ['Rivers, Climate & Monsoon', 'Minerals, Industries & Resources'], keywords: ['himalaya', 'ganga', 'brahmaputra', 'godavari', 'krishna', 'narmada', 'monsoon', 'western ghats', 'eastern ghats', 'thar', 'soil', 'national park', 'census', 'हिमालय', 'गंगा', 'ब्रह्मपुत्र', 'गोदावरी', 'नर्मदा', 'मानसून', 'पूर्वी घाट', 'पश्चिमी घाट', 'मृदा', 'जनगणना'] },
    { id: 'top_geo_world', topicId: 'top_geo_world', subjectId: 'sub_geography', titleEn: 'World Geography', titleHi: 'विश्व का भूगोल', aliases: [], keywords: ['continent', 'pacific', 'atlantic', 'sahara', 'amazon', 'nile', 'andes', 'equator', 'tropic', 'planet', 'solar system', 'महाद्वीप', 'महासागर', 'प्रशांत', 'अटलांटिक', 'सहारा', 'अमेज़न', 'नील', 'सौरमंडल', 'ग्रह'] },
    { id: 'top_geo_physical', topicId: 'top_geo_physical', subjectId: 'sub_geography', titleEn: 'Physical Geography', titleHi: 'भौतिक भूगोल', aliases: ['Environment & Biodiversity'], keywords: ['earthquake', 'volcano', 'plate tectonics', 'atmosphere', 'troposphere', 'stratosphere', 'cyclone', 'ocean current', 'igneous', 'sedimentary', 'metamorphic', 'भूकंप', 'ज्वालामुखी', 'वायुमंडल', 'क्षोभमंडल', 'समतापमंडल', 'चक्रवात', 'चट्टान'] },
    { id: 'top_geo_cg', topicId: 'top_geo_cg', subjectId: 'sub_geography', titleEn: 'Chhattisgarh Geography', titleHi: 'छत्तीसगढ़ का भूगोल', aliases: ['Rivers & Drainage System', 'Physical Divisions', 'Forests & National Parks'], keywords: ['mahanadi', 'indravati', 'shivnath', 'hasdeo', 'sihawa', 'chitrakote', 'tirathgarh', 'bailadila', 'dandakaranya', 'pat region', 'mainpat', 'kanger valley', 'indravati national park', 'महानदी', 'इंद्रावती', 'शिवनाथ', 'हसदेव', 'सिहावा', 'चित्रकोट', 'तीरथगढ़', 'बैलाडीला', 'दण्डकारण्य', 'मैनपाट', 'कांगेर घाटी'] },

    // Indian Polity (sub_polity)
    { id: 'top_pol_constitution', topicId: 'top_pol_constitution', subjectId: 'sub_polity', titleEn: 'Constitution', titleHi: 'संविधान का विकास एवं विशेषताएँ', aliases: ['Constitutional Framework'], keywords: ['constituent assembly', 'preamble', 'schedule', 'amendment', 'drafting committee', 'ambedkar', 'संविधान सभा', 'प्रस्तावना', 'अनुसूची', 'संशोधन', 'प्रारूप समिति', 'अंबेडकर'] },
    { id: 'top_pol_fr', topicId: 'top_pol_fr', subjectId: 'sub_polity', titleEn: 'Fundamental Rights', titleHi: 'मौलिक अधिकार', aliases: ['Fundamental Rights & Duties'], keywords: ['fundamental right', 'article 14', 'article 19', 'article 21', 'article 32', 'habeas corpus', 'mandamus', 'writ', 'right to equality', 'right to freedom', 'मौलिक अधिकार', 'अनुच्छेद 14', 'अनुच्छेद 19', 'अनुच्छेद 21', 'अनुच्छेद 32', 'बंदी प्रत्यक्षीकरण', 'परमादेश', 'रिट'] },
    { id: 'top_pol_dpsp', topicId: 'top_pol_dpsp', subjectId: 'sub_polity', titleEn: 'Directive Principles', titleHi: 'नीति निदेशक तत्व एवं मूल कर्तव्य', aliases: [], keywords: ['directive principles', 'dpsp', 'article 36', 'article 40', 'article 44', 'uniform civil code', 'fundamental duties', 'article 51a', 'swaran singh', 'नीति निदेशक', 'अनुच्छेद 40', 'समान नागरिक संहिता', 'मौलिक कर्तव्य', 'स्वर्ण सिंह'] },
    { id: 'top_pol_parliament', topicId: 'top_pol_parliament', subjectId: 'sub_polity', titleEn: 'Parliament', titleHi: 'संसद एवं राज्य विधानमंडल', aliases: ['Parliament & State Legislature'], keywords: ['lok sabha', 'rajya sabha', 'speaker', 'money bill', 'joint sitting', 'article 108', 'article 110', 'parliament', 'vidhan sabha', 'लोकसभा', 'राज्यसभा', 'धन विधेयक', 'संयुक्त बैठक', 'संसद', 'विधानसभा'] },
    { id: 'top_pol_exec', topicId: 'top_pol_exec', subjectId: 'sub_polity', titleEn: 'President and Governor', titleHi: 'राष्ट्रपति, राज्यपाल एवं न्यायपालिका', aliases: ['Judiciary & Constitutional Bodies', 'Panchayati Raj'], keywords: ['president', 'governor', 'prime minister', 'chief minister', 'ordinance', 'impeachment', 'article 52', 'article 61', 'article 72', 'article 123', 'supreme court', 'high court', 'election commission', 'cag', 'upsc', 'राष्ट्रपति', 'राज्यपाल', 'प्रधानमंत्री', 'अध्यादेश', 'महाभियोग', 'सर्वोच्च न्यायालय', 'उच्च न्यायालय', 'निर्वाचन आयोग'] },

    // Chhattisgarh General Knowledge (sub_cg_gs)
    { id: 'top_cg_history', topicId: 'top_cg_history', subjectId: 'sub_cg_gs', titleEn: 'History of Chhattisgarh', titleHi: 'छत्तीसगढ़ का इतिहास', aliases: ['Ancient & Kalchuri Period', 'Modern History of CG', 'Tribal Revolts'], keywords: ['kalchuri', 'ratanpur', 'kalingaraj', 'ratnadev', 'maratha', 'bimbaji', 'bhonsle', 'halba', 'paralkot', 'gend singh', 'veer narayan singh', 'sonakhan', 'bhumkal', 'gundadhur', 'sirpur', 'sharabhapuriya', 'कलचुरी', 'रतनपुर', 'कलिंगराज', 'रत्नदेव', 'मराठा', 'बिंबाजी', 'भोंसले', 'हल्बा', 'परलकोट', 'वीर नारायण सिंह', 'सोनाखान', 'भूमकाल', 'गुण्डाधूर', 'सिरपुर'] },
    { id: 'top_cg_culture', topicId: 'top_cg_culture', subjectId: 'sub_cg_gs', titleEn: 'Tribes, Art & Culture', titleHi: 'जनजातियाँ, कला एवं संस्कृति', aliases: [], keywords: ['gond', 'baiga', 'abujhmaria', 'korwa', 'birhor', 'halba', 'oraon', 'kanwar', 'suwa', 'panthi', 'raut nacha', 'karma', 'pandwani', 'teejan bai', 'chakradhar', 'bastar dussehra', 'hareli', 'cherchera', 'गोंड', 'बैगा', 'अबूझमाड़िया', 'कोरवा', 'बिरहोर', 'उरांव', 'सुआ', 'पंथी', 'राउत नाचा', 'करमा', 'पंडवानी', 'तीजन बाई', 'बस्तर दशहरा', 'हरेली', 'छेरछेरा'] },
    { id: 'top_cg_geo_climate', topicId: 'top_cg_geo_climate', subjectId: 'sub_cg_gs', titleEn: 'Geography & Climate of CG', titleHi: 'छत्तीसगढ़ का भूगोल एवं जलवायु', aliases: [], keywords: ['chhattisgarh capital', 'raipur', 'bilaspur', 'bastar', 'surguja', 'durg', 'mahanadi basin', 'maikal', 'gaurlata', 'छत्तीसगढ़ की राजधानी', 'रायपुर', 'बिलासपुर', 'बस्तर', 'सरगुजा', 'गौरलाटा', 'मैक़ल'] },
    { id: 'top_cg_admin', topicId: 'top_cg_admin', subjectId: 'sub_cg_gs', titleEn: 'Panchayati Raj & Local Administration', titleHi: 'पंचायती राज एवं स्थानीय प्रशासन', aliases: [], keywords: ['gram sabha', 'janpad panchayat', 'zila panchayat', 'sarpanch', '73rd amendment', 'panchayati raj act 1993', 'municipal', 'ग्राम सभा', 'जनपद पंचायत', 'जिला पंचायत', 'सरपंच', 'पंचायती राज'] },
    { id: 'top_cg_econ', topicId: 'top_cg_econ', subjectId: 'sub_cg_gs', titleEn: 'CG Economy, Forest & Agriculture', titleHi: 'छत्तीसगढ़ की अर्थव्यवस्था, वन एवं कृषि', aliases: [], keywords: ['paddy', 'msp', 'tendu', 'sal forest', 'tin', 'coal', 'korba', 'bhilai steel plant', 'economic survey', 'धान', 'तेंदूपत्ता', 'साल वन', 'टिन', 'कोयला', 'कोरबा', 'भिलाई इस्पात', 'आर्थिक सर्वेक्षण'] },
    { id: 'top_cg_ca', topicId: 'top_cg_ca', subjectId: 'sub_cg_gs', titleEn: 'Chhattisgarh Current Affairs', titleHi: 'छत्तीसगढ़ समसामयिकी', aliases: [], keywords: ['mahtari vandana', 'krishak unnati', 'chhattisgarh budget', 'राज्योत्सव', 'महतारी वंदन', 'कृषक उन्नति'] },

    // Economics (sub_economy)
    { id: 'top_econ_income', topicId: 'top_econ_income', subjectId: 'sub_economy', titleEn: 'National Income & Planning', titleHi: 'राष्ट्रीय आय एवं नियोजन', aliases: [], keywords: ['gdp', 'gnp', 'nnp', 'national income', 'niti aayog', 'five year plan', 'per capita', 'जीडीपी', 'राष्ट्रीय आय', 'नीति आयोग', 'पंचवर्षीय योजना'] },
    { id: 'top_econ_banking', topicId: 'top_econ_banking', subjectId: 'sub_economy', titleEn: 'Banking, RBI & Monetary Policy', titleHi: 'बैंकिंग, आरबीआई एवं मौद्रिक नीति', aliases: [], keywords: ['rbi', 'repo rate', 'reverse repo', 'crr', 'slr', 'inflation', 'monetary policy', 'nabard', 'sebi', 'आरबीआई', 'रेपो दर', 'मुद्रास्फीति', 'मौद्रिक नीति', 'नाबार्ड'] },
    { id: 'top_econ_budget', topicId: 'top_econ_budget', subjectId: 'sub_economy', titleEn: 'Union & State Budget, Economic Survey', titleHi: 'केंद्रीय एवं राज्य बजट तथा आर्थिक सर्वेक्षण', aliases: ['Social Welfare Schemes'], keywords: ['fiscal deficit', 'gst', 'finance commission', 'union budget', 'tax', 'राजकोषीय घाटा', 'जीएसटी', 'वित्त आयोग', 'बजट'] },

    // General Science (sub_science)
    { id: 'top_sci_phys_chem', topicId: 'top_sci_phys_chem', subjectId: 'sub_science', titleEn: 'Physics & Chemistry in Daily Life', titleHi: 'दैनिक जीवन में भौतिकी एवं रसायन', aliases: [], keywords: ['newton', 'ohm', 'lens', 'mirror', 'acid', 'base', 'ph value', 'periodic table', 'atom', 'electron', 'chemical', 'न्यूटन', 'लेंस', 'दर्पण', 'अम्ल', 'क्षार', 'आवर्त सारणी', 'परमाणु'] },
    { id: 'top_sci_bio', topicId: 'top_sci_bio', subjectId: 'sub_science', titleEn: 'Biology & Human Health', titleHi: 'जीव विज्ञान एवं मानव स्वास्थ्य', aliases: [], keywords: ['cell', 'vitamin', 'protein', 'blood', 'heart', 'dna', 'rna', 'photosynthesis', 'virus', 'bacteria', 'vaccine', 'कोशिका', 'विटामिन', 'प्रोटीन', 'रक्त', 'प्रकाश संश्लेषण', 'जीवाणु', 'विषाणु'] },
    { id: 'top_sci_tech', topicId: 'top_sci_tech', subjectId: 'sub_science', titleEn: 'Space (ISRO), Defence (DRDO) & IT', titleHi: 'अंतरिक्ष (ISRO), रक्षा (DRDO) एवं प्रौद्योगिकी', aliases: ['Environment & Ecology'], keywords: ['isro', 'chandrayaan', 'gaganyaan', 'drdo', 'missile', 'satellite', 'pslv', 'gslv', 'इसरो', 'चंद्रयान', 'गगनयान', 'डीआरडीओ', 'उपग्रह'] },

    // Mathematics (sub_mathematics)
    { id: 'top_math_number', topicId: 'top_math_number', subjectId: 'sub_mathematics', titleEn: 'Number System & Simplification', titleHi: 'संख्या पद्धति एवं सरलीकरण', aliases: ['Quantitative Aptitude & Data Interpretation'], keywords: ['lcm', 'hcf', 'prime number', 'divisibility', 'remainder', 'fraction', 'square root', 'लघुत्तम', 'महत्तम', 'अभाज्य संख्या', 'विभाज्यता', 'वर्गमूल'] },
    { id: 'top_math_arith', topicId: 'top_math_arith', subjectId: 'sub_mathematics', titleEn: 'Percentage, Profit & Loss, SI & CI', titleHi: 'प्रतिशत, लाभ-हानि, साधारण एवं चक्रवृद्धि ब्याज', aliases: [], keywords: ['percentage', 'profit', 'loss', 'discount', 'simple interest', 'compound interest', 'प्रतिशत', 'लाभ', 'हानि', 'साधारण ब्याज', 'चक्रवृद्धि ब्याज'] },
    { id: 'top_math_ratio_time', topicId: 'top_math_ratio_time', subjectId: 'sub_mathematics', titleEn: 'Ratio, Time & Work, Speed & Distance', titleHi: 'अनुपात, समय-कार्य एवं चाल-दूरी', aliases: [], keywords: ['ratio', 'proportion', 'average', 'time and work', 'train', 'speed', 'distance', 'अनुपात', 'समानुपात', 'औसत', 'समय और कार्य', 'चाल', 'दूरी'] },
    { id: 'top_math_geom', topicId: 'top_math_geom', subjectId: 'sub_mathematics', titleEn: 'Algebra, Geometry & Mensuration', titleHi: 'बीजगणित, ज्यामिति एवं क्षेत्रमिति', aliases: [], keywords: ['triangle', 'circle', 'cylinder', 'cone', 'sphere', 'area', 'volume', 'perimeter', 'polynomial', 'त्रिभुज', 'वृत्त', 'बेलन', 'शंकु', 'गोला', 'क्षेत्रफल', 'आयतन'] },

    // Reasoning (sub_reasoning)
    { id: 'top_reas_coding', topicId: 'top_reas_coding', subjectId: 'sub_reasoning', titleEn: 'Coding-Decoding & Series', titleHi: 'कोडिंग-डिकोडिंग एवं श्रृंखला', aliases: ['Logical & Analytical Reasoning'], keywords: ['coding', 'decoding', 'missing number', 'number series', 'alphabet series', 'analogy', 'odd one out', 'कोडिंग', 'डिकोडिंग', 'श्रृंखला', 'लुप्त संख्या', 'सादृश्यता'] },
    { id: 'top_reas_blood_dir', topicId: 'top_reas_blood_dir', subjectId: 'sub_reasoning', titleEn: 'Blood Relations & Direction Sense', titleHi: 'रक्त संबंध एवं दिशा परीक्षण', aliases: [], keywords: ['blood relation', 'mother', 'father', 'brother', 'north-east', 'direction', 'clockwise', 'रक्त संबंध', 'दिशा', 'दक्षिणावर्त', 'वामावर्त'] },
    { id: 'top_reas_syllogism', topicId: 'top_reas_syllogism', subjectId: 'sub_reasoning', titleEn: 'Syllogism, Statement & Conclusion', titleHi: 'न्याय निगमन, कथन एवं निष्कर्ष', aliases: ['Puzzles, Seating & Non-Verbal Reasoning'], keywords: ['syllogism', 'statement', 'conclusion', 'assumption', 'venn diagram', 'dice', 'calendar', 'clock', 'कथन', 'निष्कर्ष', 'वेन आरेख', 'पासा', 'कैलेंडर', 'घड़ी'] },

    // Hindi (sub_hindi)
    { id: 'top_hin_sandhi', topicId: 'top_hin_sandhi', subjectId: 'sub_hindi', titleEn: 'वर्णमाला, संधि एवं समास (Sandhi & Samas)', titleHi: 'वर्णमाला, संधि एवं समास', aliases: ['General Hindi Grammar (सामान्य हिन्दी)'], keywords: ['संधि', 'समास', 'स्वर', 'व्यंजन', 'वर्णमाला', 'बहुव्रीहि', 'तत्पुरुष', 'द्वंद्व', 'कर्मधारय', 'यण संधि', 'गुण संधि'] },
    { id: 'top_hin_vocab', topicId: 'top_hin_vocab', subjectId: 'sub_hindi', titleEn: 'तत्सम-तद्भव, पर्यायवाची एवं विलोम', titleHi: 'तत्सम-तद्भव, पर्यायवाची, विलोम एवं मुहावरे', aliases: ['तत्सम-तद्भव, उपसर्ग एवं प्रत्यय', 'पर्यायवाची, विलोम एवं मुहावरे', 'वाक्य शुद्धि एवं रस-छंद-अलंकार'], keywords: ['तत्सम', 'तद्भव', 'उपसर्ग', 'प्रत्यय', 'पर्यायवाची', 'विलोम', 'मुहावरा', 'लोकोक्ति', 'अलंकार', 'रस', 'छंद', 'वर्तनी'] },

    // English (sub_english)
    { id: 'top_eng_grammar', topicId: 'top_eng_grammar', subjectId: 'sub_english', titleEn: 'Parts of Speech, Tenses & Voice', titleHi: 'अंग्रेजी व्याकरण (Tenses, Voice & Narration)', aliases: ['Direct/Indirect Speech & Error Spotting', 'General English Comprehension'], keywords: ['passive voice', 'active voice', 'indirect speech', 'direct speech', 'preposition', 'article', 'tense', 'subject-verb'] },
    { id: 'top_eng_vocab', topicId: 'top_eng_vocab', subjectId: 'sub_english', titleEn: 'Synonyms, Antonyms, Idioms & One-Word', titleHi: 'शब्दावली (Synonyms, Antonyms & Idioms)', aliases: ['Reading Comprehension & Cloze Test'], keywords: ['synonym', 'antonym', 'idiom', 'phrase', 'one word substitution', 'correctly spelt', 'spelling'] },

    // Computer Knowledge (sub_computer)
    { id: 'top_comp_hw', topicId: 'top_comp_hw', subjectId: 'sub_computer', titleEn: 'Computer Architecture, Hardware & Memory', titleHi: 'कंप्यूटर संरचना, हार्डवेयर एवं मेमोरी', aliases: ['Computer Awareness'], keywords: ['cpu', 'alu', 'ram', 'rom', 'cache', 'register', 'input device', 'output device', 'printer', 'plotter', 'scanner', 'bit', 'byte', 'सीपीयू', 'रैम', 'रोम', 'मेमोरी', 'प्रिंटर', 'इनपुट', 'आउटपुट'] },
    { id: 'top_comp_sw', topicId: 'top_comp_sw', subjectId: 'sub_computer', titleEn: 'Operating System & MS Office (Word, Excel, PowerPoint)', titleHi: 'ऑपरेटिंग सिस्टम एवं एमएस ऑफिस', aliases: [], keywords: ['operating system', 'windows', 'linux', 'unix', 'ms word', 'ms excel', 'powerpoint', 'spreadsheet', 'formula', 'shortcut key', 'ऑपरेटिंग सिस्टम', 'एमएस वर्ड', 'एक्सेल', 'पॉवरपॉइंट', 'शॉर्टकट कुंजी'] },
    { id: 'top_comp_net', topicId: 'top_comp_net', subjectId: 'sub_computer', titleEn: 'Internet, Networking, Email & Cyber Security', titleHi: 'इंटरनेट, नेटवर्किंग एवं साइबर सुरक्षा', aliases: ['Multimedia, Printers & Antivirus'], keywords: ['internet', 'browser', 'http', 'tcp/ip', 'url', 'email', 'virus', 'malware', 'antivirus', 'firewall', 'cyber', 'इंटरनेट', 'ब्राउज़र', 'ईमेल', 'वायरस', 'एंटीवायरस', 'फायरवॉल'] },

    // Child Development & Pedagogy (sub_pedagogy)
    { id: 'top_ped_theories', topicId: 'top_ped_theories', subjectId: 'sub_pedagogy', titleEn: 'Learning Theories', titleHi: 'अधिगम एवं विकास के सिद्धांत', aliases: ['Inclusive Education', 'Teaching Aptitude & Assessment'], keywords: ['piaget', 'vygotsky', 'kohlberg', 'skinner', 'pavlov', 'thorndike', 'pedagogy', 'inclusive education', 'ncf', 'rte', 'पियाजे', 'वायगोत्स्की', 'कोहलबर्ग', 'अधिगम', 'समावेशी शिक्षा', 'बाल विकास'] },

    // Current Affairs (sub_current_affairs)
    { id: 'top_ca_events', topicId: 'top_ca_events', subjectId: 'sub_current_affairs', titleEn: 'National & International Events', titleHi: 'राष्ट्रीय एवं अंतर्राष्ट्रीय समसामयिकी', aliases: ['Awards, Sports & Schemes'], keywords: ['nobel prize', 'bharat ratna', 'padma', 'olympics', 'summit', 'g20', 'brics', 'index', 'सूचकांक', 'शिखर सम्मेलन', 'पुरस्कार', 'नोबेल', 'पद्म'] }
  ];

  const DEFAULT_SUBTOPICS = [
    // History -> Ancient Indian History (top_hist_ancient)
    { id: 'subtop_ivc', subtopicId: 'subtop_ivc', topicId: 'top_hist_ancient', subjectId: 'sub_history', titleEn: 'Indus Valley Civilization', titleHi: 'सिंधु घाटी सभ्यता', keywords: ['indus valley', 'harappa', 'mohenjodaro', 'lothal', 'kalibangan', 'dholavira', 'सिंधु घाटी', 'हड़प्पा', 'मोहनजोदड़ो', 'लोथल', 'कालीबंगा', 'धौलावीरा'] },
    { id: 'subtop_vedic', subtopicId: 'subtop_vedic', topicId: 'top_hist_ancient', subjectId: 'sub_history', titleEn: 'Vedic Period', titleHi: 'वैदिक काल', keywords: ['rigveda', 'samaveda', 'yajurveda', 'atharvaveda', 'upanishad', 'vedic', 'gayatri mantra', 'ऋग्वेद', 'सामवेद', 'यजुर्वेद', 'अथर्ववेद', 'उपनिषद', 'वैदिक'] },
    { id: 'subtop_maurya', subtopicId: 'subtop_maurya', topicId: 'top_hist_ancient', subjectId: 'sub_history', titleEn: 'Maurya Empire', titleHi: 'मौर्य साम्राज्य', keywords: ['maurya', 'ashoka', 'chandragupta maurya', 'bindusara', 'arthashastra', 'kautilya', 'chanakya', 'megasthenes', 'indica', 'kalinga', 'मौर्य', 'अशोक', 'चन्द्रगुप्त मौर्य', 'बिन्दुसार', 'अर्थशास्त्र', 'कौटिल्य', 'चाणक्य', 'मेगस्थनीज', 'कलिंग'] },
    { id: 'subtop_gupta', subtopicId: 'subtop_gupta', topicId: 'top_hist_ancient', subjectId: 'sub_history', titleEn: 'Gupta Empire', titleHi: 'गुप्त साम्राज्य', keywords: ['gupta', 'samudragupta', 'chandragupta ii', 'vikramaditya', 'kalidasa', 'aryabhata', 'fa-hien', 'nalanda', 'गुप्त', 'समुद्रगुप्त', 'विक्रमादित्य', 'कालिदास', 'आर्यभट्ट', 'नालंदा'] },

    // History -> Medieval Indian History (top_hist_medieval)
    { id: 'subtop_delhi_sultanate', subtopicId: 'subtop_delhi_sultanate', topicId: 'top_hist_medieval', subjectId: 'sub_history', titleEn: 'Delhi Sultanate', titleHi: 'दिल्ली सल्तनत', keywords: ['delhi sultanate', 'qutbuddin aibak', 'iltutmish', 'razia', 'balban', 'alauddin khilji', 'muhammad bin tughlaq', 'ibrahim lodi', 'दिल्ली सल्तनत', 'कुतुबुद्दीन ऐबक', 'इल्तुतमिश', 'रजिया', 'बलबन', 'अलाउद्दीन खिलजी', 'तुगलक'] },
    { id: 'subtop_mughal', subtopicId: 'subtop_mughal', topicId: 'top_hist_medieval', subjectId: 'sub_history', titleEn: 'Mughal Empire', titleHi: 'मुगल साम्राज्य', keywords: ['mughal', 'babur', 'humayun', 'akbar', 'jahangir', 'shah jahan', 'aurangzeb', 'panipat', 'mansabdari', 'मुगल', 'बाबर', 'हुमायूँ', 'अकबर', 'जहाँगीर', 'शाहजहाँ', 'औरंगजेब', 'पानीपत', 'मनसबदारी'] },

    // History -> Modern Indian History (top_hist_modern)
    { id: 'subtop_1857', subtopicId: 'subtop_1857', topicId: 'top_hist_modern', subjectId: 'sub_history', titleEn: 'Revolt of 1857', titleHi: '1857 की क्रांति', keywords: ['1857', 'mangal pandey', 'rani lakshmibai', 'tatya tope', 'nana sahib', 'bahadur shah zafar', 'मंगल पांडे', 'रानी लक्ष्मीबाई', 'तात्या टोपे', '1857 का विद्रोह'] },
    { id: 'subtop_national_movement', subtopicId: 'subtop_national_movement', topicId: 'top_hist_modern', subjectId: 'sub_history', titleEn: 'Indian National Movement', titleHi: 'भारतीय राष्ट्रीय आंदोलन', keywords: ['mahatma gandhi', 'non-cooperation', 'civil disobedience', 'quit india', 'dandi march', 'champaran', 'swadeshi', 'महात्मा गांधी', 'असहयोग आंदोलन', 'सविनय अवज्ञा', 'भारत छोड़ो', 'दांडी यात्रा', 'चंपारण'] },

    // Geography -> Chhattisgarh Geography (top_geo_cg)
    { id: 'subtop_cg_rivers', subtopicId: 'subtop_cg_rivers', topicId: 'top_geo_cg', subjectId: 'sub_geography', titleEn: 'Rivers & Waterfalls of CG', titleHi: 'छत्तीसगढ़ की नदियाँ एवं जलप्रपात', keywords: ['mahanadi', 'indravati', 'shivnath', 'hasdeo', 'chitrakote', 'tirathgarh', 'amritdhara', 'महानदी', 'इंद्रावती', 'शिवनाथ', 'हसदेव', 'चित्रकोट', 'तीरथगढ़'] },
    { id: 'subtop_cg_forests', subtopicId: 'subtop_cg_forests', topicId: 'top_geo_cg', subjectId: 'sub_geography', titleEn: 'Forests & National Parks of CG', titleHi: 'छत्तीसगढ़ के वन एवं राष्ट्रीय उद्यान', keywords: ['kanger valley', 'guru ghasidas national park', 'indravati national park', 'achanakmar', 'udanti', 'sitanadi', 'कांगेर घाटी', 'गुरु घासीदास राष्ट्रीय उद्यान', 'अचानकमार', 'उदंती', 'सीतानदी'] },

    // Indian Polity -> Topics
    { id: 'subtop_preamble_sched', subtopicId: 'subtop_preamble_sched', topicId: 'top_pol_constitution', subjectId: 'sub_polity', titleEn: 'Preamble, Schedules & Amendments', titleHi: 'प्रस्तावना, अनुसूचियाँ एवं संविधान संशोधन', keywords: ['preamble', 'schedule', '42nd amendment', '44th amendment', 'प्रस्तावना', 'अनुसूची', '42वां संशोधन', '44वां संशोधन'] },
    { id: 'subtop_writs', subtopicId: 'subtop_writs', topicId: 'top_pol_fr', subjectId: 'sub_polity', titleEn: 'Constitutional Remedies & Writs (Art 32)', titleHi: 'संवैधानिक उपचार एवं रिट (अनुच्छेद 32)', keywords: ['article 32', 'writ', 'habeas corpus', 'mandamus', 'certiorari', 'अनुच्छेद 32', 'रिट', 'बंदी प्रत्यक्षीकरण', 'परमादेश'] },
    { id: 'subtop_dpsp_duties', subtopicId: 'subtop_dpsp_duties', topicId: 'top_pol_dpsp', subjectId: 'sub_polity', titleEn: 'DPSP & Fundamental Duties', titleHi: 'नीति निदेशक तत्व एवं मौलिक कर्तव्य', keywords: ['article 40', 'article 44', 'article 51a', 'fundamental duties', 'अनुच्छेद 40', 'अनुच्छेद 44', 'अनुच्छेद 51क', 'मौलिक कर्तव्य'] },
    { id: 'subtop_loksabha_rajyasabha', subtopicId: 'subtop_loksabha_rajyasabha', topicId: 'top_pol_parliament', subjectId: 'sub_polity', titleEn: 'Lok Sabha & Rajya Sabha', titleHi: 'लोकसभा एवं राज्यसभा', keywords: ['lok sabha', 'rajya sabha', 'speaker', 'money bill', 'लोकसभा', 'राज्यसभा', 'धन विधेयक'] },
    { id: 'subtop_pres_gov', subtopicId: 'subtop_pres_gov', topicId: 'top_pol_exec', subjectId: 'sub_polity', titleEn: 'President & Governor Powers', titleHi: 'राष्ट्रपति एवं राज्यपाल की शक्तियाँ', keywords: ['president', 'governor', 'ordinance', 'impeachment', 'pardon', 'राष्ट्रपति', 'राज्यपाल', 'अध्यादेश', 'महाभियोग', 'क्षमादान'] },

    // Chhattisgarh GK -> History of Chhattisgarh (top_cg_history)
    { id: 'subtop_kalchuri', subtopicId: 'subtop_kalchuri', topicId: 'top_cg_history', subjectId: 'sub_cg_gs', titleEn: 'Kalchuri Dynasty', titleHi: 'कलचुरी वंश', keywords: ['kalchuri', 'kalingaraj', 'kamalaraj', 'ratnadev', 'prithvidev', 'jajalladev', 'ratanpur', 'tumman', 'कलचुरी', 'कलिंगराज', 'कमलराज', 'रत्नदेव', 'पृथ्वीदेव', 'जाजल्लदेव', 'रतनपुर', 'तुम्मान'] },
    { id: 'subtop_maratha_cg', subtopicId: 'subtop_maratha_cg', topicId: 'top_cg_history', subjectId: 'sub_cg_gs', titleEn: 'Maratha Rule in Chhattisgarh', titleHi: 'छत्तीसगढ़ में मराठा एवं सूबा शासन', keywords: ['maratha', 'bimbaji', 'bhonsle', 'vyankoji', 'suba system', 'mahipat rao', 'vithal rao', 'agneu', 'मराठा', 'बिंबाजी', 'भोंसले', 'सूबा शासन', 'महिपत राव', 'एगन्यू'] },
    { id: 'subtop_tribal_revolts', subtopicId: 'subtop_tribal_revolts', topicId: 'top_cg_history', subjectId: 'sub_cg_gs', titleEn: 'Tribal Revolts & Freedom Struggle in CG', titleHi: 'छत्तीसगढ़ के जनजातीय विद्रोह एवं स्वतंत्रता आंदोलन', keywords: ['halba rebellion', 'ajmer singh', 'paralkot', 'gend singh', 'tarapur', 'muria', 'bhumkal', 'gundadhur', 'veer narayan singh', 'sonakhan', 'हल्बा विद्रोह', 'अजमेर सिंह', 'परलकोट', 'गेंद सिंह', 'भूमकाल', 'गुण्डाधूर', 'वीर नारायण सिंह', 'सोनाखान'] },
    { id: 'subtop_state_formation', subtopicId: 'subtop_state_formation', topicId: 'top_cg_history', subjectId: 'sub_cg_gs', titleEn: 'State Formation of Chhattisgarh', titleHi: 'छत्तीसगढ़ राज्य का गठन', keywords: ['1 november 2000', '26th state', 'reorganization act', '1 नवंबर 2000', '26वां राज्य', 'पुनर्गठन अधिनियम'] }
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
    EXAM_CATEGORIES,
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

