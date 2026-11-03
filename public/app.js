(function () {
  'use strict';

  const STORAGE_KEY = 'cgpedia_web_state_v2';
  const ADMIN_EMAIL = 'usahu0304@gmail.com';
  const WHATSAPP_NUMBER = '9238810070';
  const STORY_DURATION_MS = 24 * 60 * 60 * 1000; // Exactly 24 Hours
  const AUTO_SYNC_INTERVAL_MS = 60 * 60 * 1000;  // 60 Minutes
  const AI_GENERATION_TIMEOUT_MS = 300000;       // 5 Minutes (300,000 ms)

  const now = Date.now();

  // Default Seed Data
  const DEFAULT_STATE = {
    theme: 'light',
    activeTab: 'dashboard',
    selectedFolderId: null,
    currentUser: {
      id: 'STU-2026-108',
      email: 'aspirant.cgpsc@gmail.com',
      name: 'CGPSC Aspirant',
      isAdmin: false
    },
    lastAutoSyncAt: now - 15 * 60 * 1000,
    supportPolicy: {
      titleHi: 'आधिकारिक सहायता एवं गोपनीयता नीति (CGPSC & CGSSB)',
      titleEn: 'Official Support & Help Policy (CGPSC & CGSSB)',
      contentHi: '1. पेड टेस्ट सीरीज (₹99) एक्टिवेशन के लिए WhatsApp नंबर 9238810070 पर भुगतान स्क्रीनशॉट एवं अपनी Student ID/Email भेजें।\n2. वैधता (Validity) एडमिन द्वारा आपके खाते को सक्रिय (Activate) करने की सटीक तिथि और समय से गिनती शुरू होगी।\n3. सभी टेस्ट द्विभाषी (1st हिंदी, 2nd English) माध्यम में नवीनतम CGPSC और CGSSB पैटर्न पर आधारित हैं।',
      contentEn: '1. For Paid Test Series (₹99) activation, send your payment screenshot and Student ID/Email on WhatsApp 9238810070.\n2. Package validity strictly starts from the exact date and time the Admin activates access for your account.\n3. All tests are strictly Bilingual (1st Hindi, 2nd English) following the latest CGPSC & CGSSB examination standards.',
      updatedAt: now - 3600 * 1000
    },
    // Student Activations: key = folderId + '__' + normalizedUserIdentifier
    studentActivations: {
      'folder-cgpsc-pre-2026__usahu0304@gmail.com': {
        folderId: 'folder-cgpsc-pre-2026',
        userKey: 'usahu0304@gmail.com',
        activatedAt: now - 2 * 86400000,
        validityDays: 180,
        expiresAt: now + 178 * 86400000
      }
    },
    analyticsSummary: {
      paidUsersCount: 418,
      freeUsersCount: 1290,
      activeSubscriptionsCount: 392,
      expiredSubscriptionsCount: 26
    },
    stories: [
      {
        id: 'story-cg-budget-2026',
        category: 'CG Special',
        icon: '🏛️',
        titleHi: 'छत्तीसगढ़ आर्थिक सर्वेक्षण एवं नई औद्योगिक नीति अपडेट',
        titleEn: 'Chhattisgarh Economic Survey & New Industrial Policy Update',
        bodyHi: 'छत्तीसगढ़ शासन द्वारा बस्तर एवं सरगुजा संभाग में कृषि प्रसंस्करण और सूक्ष्म उद्योगों के लिए विशेष अनुदान की घोषणा की गई। परीक्षा हेतु महत्वपूर्ण तथ्य: जीएसडीपी (GSDP) में कृषि एवं संबद्ध क्षेत्र का योगदान।',
        bodyEn: 'The Government of Chhattisgarh announced special capital subsidies for agro-processing and MSMEs in Bastar and Surguja divisions. Key Exam Fact: Sectoral contribution of Agriculture & Allied sectors in State GSDP.',
        source: 'DPR Chhattisgarh / Official Gazette',
        postedAt: now - 2 * 3600 * 1000,
        seen: false
      },
      {
        id: 'story-mahtari-vandan',
        category: 'CG Schemes',
        icon: '🌾',
        titleHi: 'महतारी वंदन एवं कृषक उन्नति योजना: नवीनतम आंकड़े',
        titleEn: 'Mahtari Vandan & Krishak Unnati Yojana: Latest Figures',
        bodyHi: 'कृषक उन्नति योजना के अंतर्गत समर्थन मूल्य पर धान खरीदी और अंतर की राशि का सीधा हस्तांतरण (DBT) किया गया। CGPSC प्रारंभिक एवं मुख्य परीक्षा के लिए अत्यंत महत्वपूर्ण।',
        bodyEn: 'Direct Benefit Transfer (DBT) of input assistance under Krishak Unnati Yojana completed for registered paddy farmers across Chhattisgarh.',
        source: 'CG Samvad',
        postedAt: now - 4 * 3600 * 1000,
        seen: false
      },
      {
        id: 'story-bastar-gi-tag',
        category: 'Culture & GI',
        icon: '🎨',
        titleHi: 'बस्तर ढोकरा कला एवं कोसा सिल्क: राष्ट्रीय प्रदर्शनी सम्मान',
        titleEn: 'Bastar Dhokra Craft & Kosa Silk: National Exhibition Honor',
        bodyHi: 'छत्तीसगढ़ के पारंपरिक शिल्पकारों को राष्ट्रीय हस्तशिल्प मेले में विशेष सम्मान मिला। बस्तर के लौह शिल्प और ढोकरा कला को जीआई टैग (GI Tag) प्राप्त है।',
        bodyEn: 'Traditional artisans from Chhattisgarh received top honors at the National Handicraft Fair. Bastar Iron Craft and Dhokra Art hold official GI Tags.',
        source: 'PIB India',
        postedAt: now - 6 * 3600 * 1000,
        seen: false
      },
      {
        id: 'story-national-isro',
        category: 'National Sci-Tech',
        icon: '🚀',
        titleHi: 'इसरो (ISRO) का नया पृथ्वी अवलोकन उपग्रह मिशन सफल',
        titleEn: 'ISRO Successfully Launches New Earth Observation Satellite',
        bodyHi: 'भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) ने श्रीहरिकोटा से आपदा प्रबंधन और कृषि निगरानी के लिए उन्नत उपग्रह कक्षा में स्थापित किया।',
        bodyEn: 'Indian Space Research Organisation (ISRO) successfully placed an advanced Earth Observation satellite into orbit from Sriharikota for agricultural and disaster monitoring.',
        source: 'PIB Science & Tech',
        postedAt: now - 8 * 3600 * 1000,
        seen: false
      }
    ],
    notifications: [
      {
        id: 'notif-pin-1',
        titleHi: '📌 सीजीपीएससी प्री 2026 टेस्ट सीरीज (₹99) — 31 टेस्ट समय-सारणी जारी',
        titleEn: '📌 CGPSC Pre 2026 Test Series (₹99) — 31 Tests Schedule Released',
        messageHi: '14 जून 2026 से 29 नवंबर 2026 तक कुल 31 द्विभाषी टेस्ट (100 प्रश्न प्रति टेस्ट)। पेमेंट एवं एक्टिवेशन हेतु WhatsApp 9238810070 पर संपर्क करें।',
        messageEn: '31 full-length bilingual tests scheduled from 14 June 2026 to 29 Nov 2026 (100 questions each). Contact WhatsApp 9238810070 for instant activation.',
        pinned: true,
        mediaType: 'pdf',
        mediaUrl: '#schedule-31-tests',
        mediaLabel: 'CGPSC_Pre_2026_31_Tests_Schedule.pdf',
        createdAt: now - 3 * 3600 * 1000
      },
      {
        id: 'notif-2',
        titleHi: '🎙️ एडमिन ऑडियो संदेश: प्रारंभिक परीक्षा रणनीति (CGPSC & CGSSB)',
        titleEn: '🎙️ Admin Voice Note: Prelims Strategy (CGPSC & CGSSB)',
        messageHi: 'छत्तीसगढ़ सामान्य अध्ययन के 50 प्रश्नों में 85%+ अंक कैसे प्राप्त करें — मुख्य बिंदु अवश्य सुनें।',
        messageEn: 'How to score 85%+ in the 50 Chhattisgarh GS questions — listen to key revision pointers.',
        pinned: false,
        mediaType: 'audio',
        mediaUrl: 'synthesized-anthem',
        mediaLabel: 'CGPSC_Strategy_Audio_Brief.mp3',
        createdAt: now - 10 * 3600 * 1000
      },
      {
        id: 'notif-3',
        titleHi: '📲 CGpedia Android APK v2.0 उपलब्ध',
        titleEn: '📲 CGpedia Android APK v2.0 Available for Direct Download',
        messageHi: 'ऊपर दिए गए Download APK बटन से आप अपने मोबाइल में CGpedia ऐप इंस्टॉल कर सकते हैं।',
        messageEn: 'Use the Download APK button in the top bar to install the native Android app directly on your phone.',
        pinned: false,
        mediaType: 'doc',
        mediaUrl: '/CGpedia.apk',
        mediaLabel: 'CGpedia.apk (29.5 MB)',
        createdAt: now - 18 * 3600 * 1000
      }
    ],
    upcomingSeries: [
      {
        id: 'up-1',
        titleHi: 'CGPSC प्रारंभिक परीक्षा 2026 — मेगा टेस्ट सीरीज (31 टेस्ट)',
        titleEn: 'CGPSC Prelims 2026 — Mega Test Series (31 Tests)',
        startDate: '14 June 2026 — 29 Nov 2026',
        price: '₹99',
        validity: '180 Days (from Student Activation)',
        statusBadge: 'Registrations Open'
      },
      {
        id: 'up-2',
        titleHi: 'CGSSB हॉस्टल वार्डन एवं पटवारी संयुक्त टेस्ट सीरीज',
        titleEn: 'CGSSB Hostel Warden & Patwari Combined Test Series',
        startDate: '01 July 2026',
        price: '₹79',
        validity: '120 Days (from Student Activation)',
        statusBadge: 'Upcoming'
      },
      {
        id: 'up-3',
        titleHi: 'छत्तीसगढ़ आर्थिक सर्वेक्षण एवं बजट स्पेशल 500 MCQ बैंक',
        titleEn: 'Chhattisgarh Economic Survey & Budget Special 500 MCQ Bank',
        startDate: '15 July 2026',
        price: 'Free / Included in ₹99 Pack',
        validity: '90 Days',
        statusBadge: 'Scheduled'
      }
    ],
    queries: [
      {
        id: 'q-seed-1',
        studentId: 'STU-2026-108',
        studentEmail: 'aspirant.cgpsc@gmail.com',
        category: 'Payment & Activation',
        message: 'Sir, maine ₹99 UPI payment kar diya hai WhatsApp 9238810070 par. Meri validity kab se start hogi?',
        adminReply: 'आपकी वैधता (180 दिन) एडमिन द्वारा आपके अकाउंट को Activate करने के सटीक समय से शुरू होती है।',
        createdAt: now - 5 * 3600 * 1000
      }
    ],
    folders: [
      {
        id: 'folder-cgpsc-pre-2026',
        titleHi: 'सीजीपीएससी प्री 2026 टेस्ट सीरीज (31 टेस्ट)',
        titleEn: 'CGPSC Pre 2026 Test Series (31 Scheduled Papers)',
        examTag: 'CGPSC Prelims 2026',
        isPaid: true,
        priceINR: 99,
        validityDays: 180,
        descriptionHi: '14 जून 2026 से 29 नवंबर 2026 तक कुल 31 टेस्ट • प्रत्येक टेस्ट में 100 द्विभाषी प्रश्न (हिंदी + English) • एक्टिवेशन तिथि से 180 दिन की वैधता।',
        descriptionEn: '31 Scheduled Bilingual Tests from 14 June 2026 to 29 Nov 2026 • 100 Questions per paper • 180-Day Validity starting strictly from Student Activation time.',
        tests: [
          {
            id: 'test-cgpsc-2026-t1',
            titleHi: 'टेस्ट 01: छत्तीसगढ़ का इतिहास, कला एवं संस्कृति (प्रारंभिक डेमो अनलॉक)',
            titleEn: 'Test 01: History, Art & Culture of Chhattisgarh (Free Demo Unlocked)',
            scheduledDate: '14 June 2026',
            durationMinutes: 60,
            marksPerQuestion: 2.0,
            negativeMarking: 0.66,
            isPaid: false, // First test free demo inside paid folder
            questions: [
              {
                id: 'q1',
                qHi: 'छत्तीसगढ़ में कलचुरि वंश की रतनपुर शाखा के संस्थापक कौन थे जिन्होंने तुम्माण को अपनी प्रारंभिक राजधानी बनाया?',
                qEn: 'Who was the founder of the Ratanpur branch of the Kalachuri dynasty in Chhattisgarh who made Tumman his initial capital?',
                optionsHi: ['कलिंगराज', 'रत्नदेव प्रथम', 'पृथ्वीदेव प्रथम', 'जाजल्लदेव प्रथम'],
                optionsEn: ['Kalingaraj', 'Ratnadeva I', 'Prithvideva I', 'Jajalladeva I'],
                correctIndex: 0,
                expHi: 'कलिंगराज (1000–1020 ई.) ने छत्तीसगढ़ में कलचुरि वंश की स्थापना की और तुम्माण को अपनी पहली राजधानी बनाया। रत्नदेव प्रथम ने 1050 ई. में रतनपुर की स्थापना की।',
                expEn: 'Kalingaraj (1000–1020 CE) founded the Kalachuri dynasty in Chhattisgarh with Tumman as the initial capital. Ratnadeva I later founded Ratanpur in 1050 CE.'
              },
              {
                id: 'q2',
                qHi: 'सिरपुर के प्रसिद्ध लक्ष्मण मंदिर का निर्माण किस वंश के शासनकाल में रानी वासटा द्वारा करवाया गया था?',
                qEn: 'During the reign of which dynasty was the famous Lakshmana Temple of Sirpur built by Queen Vasata?',
                optionsHi: ['पांडुवंश (सोमवंश)', 'शरभपुरीय वंश', 'नल वंश', 'बाण वंश'],
                optionsEn: ['Panduvamshi (Somavamshi) Dynasty', 'Sharabhapuriya Dynasty', 'Nala Dynasty', 'Bana Dynasty'],
                correctIndex: 0,
                expHi: 'सिरपुर का लक्ष्मण मंदिर लाल ईंटों से निर्मित है। इसका निर्माण पांडुवंशी शासक हर्षगुप्त की स्मृति में उनकी पत्नी रानी वासटा ने महाशिवगुप्त बालार्जुन के काल में कराया था।',
                expEn: 'Built of red bricks, the Lakshmana Temple at Sirpur was constructed by Queen Vasata in memory of her husband Harshagupta during the reign of Mahashivgupta Balarjuna of the Panduvamshi dynasty.'
              },
              {
                id: 'q3',
                qHi: '1910 के महान बस्तर विद्रोह (भूमकाल) के प्रमुख आदिवासी नायक कौन थे?',
                qEn: 'Who was the prominent tribal leader of the Great Bastar Rebellion (Bhumkal) of 1910?',
                optionsHi: ['गुंडाधूर (नेतानार)', 'गेंदसिंह (परलकोट)', 'झाड़ा सिरहा', 'वीर नारायण सिंह'],
                optionsEn: ['Gundadhur (Netanar)', 'Gend Singh (Paralkot)', 'Jhada Sirha', 'Veer Narayan Singh'],
                correctIndex: 0,
                expHi: 'फरवरी 1910 के भूमकाल विद्रोह का नेतृत्व नेतानार के गुंडाधूर ने किया था। इसमें लाल मिर्च और आम की टहनियां प्रतीक के रूप में प्रयुक्त हुई थीं।',
                expEn: 'The Bhumkal rebellion of February 1910 was led by Gundadhur of Netanar village, using red chillies and mango branches as mobilization symbols.'
              },
              {
                id: 'q4',
                qHi: 'छत्तीसगढ़ की किस जनजाति द्वारा मुख्य रूप से "ककसार" नृत्य किया जाता है?',
                qEn: 'The "Kaksar" festival dance is primarily performed by which tribe of Chhattisgarh?',
                optionsHi: ['अबूझमाड़िया', 'बैगा', 'उरांव', 'कमार'],
                optionsEn: ['Abujhmadia', 'Baiga', 'Oraon', 'Kamar'],
                correctIndex: 0,
                expHi: 'ककसार नृत्य बस्तर क्षेत्र की अबूझमाड़िया जनजाति का प्रमुख धार्मिक एवं पर्व नृत्य है।',
                expEn: 'Kaksar is a major religious and harvest festival dance performed by the Abujhmadia tribe in the Bastar region.'
              },
              {
                id: 'q5',
                qHi: 'छत्तीसगढ़ में "कंडेल नहर सत्याग्रह" (1920) के प्रमुख सूत्रधार कौन थे?',
                qEn: 'Who were the primary leaders of the "Kandel Canal Satyagraha" (1920) in Chhattisgarh?',
                optionsHi: ['पं. सुंदरलाल शर्मा, बाबू छोटेलाल श्रीवास्तव एवं नारायणराव मेघावाले', 'ठाकुर प्यारेलाल सिंह एवं डॉ. खूबचंद बघेल', 'माधवराव सप्रे एवं वामनराव लाखे', 'ई. राघवेंद्र राव एवं बैरिस्टर छेदीलाल'],
                optionsEn: ['Pt. Sundarlal Sharma, Babu Chhotelal Srivastava & Narayanrao Meghawale', 'Thakur Pyarelal Singh & Dr. Khubchand Baghel', 'Madhavrao Sapre & Wamanrao Lakhe', 'E. Raghavendra Rao & Barrister Chhedilal'],
                correctIndex: 0,
                expHi: 'धमतरी तहसील के कंडेल ग्राम में जुलाई 1920 में सिंचाई कर के विरुद्ध पं. सुंदरलाल शर्मा, बाबू छोटेलाल श्रीवास्तव और नारायणराव मेघावाले के नेतृत्व में नहर सत्याग्रह हुआ।',
                expEn: 'The Kandel Canal Satyagraha in Dhamtari tehsil (July 1920) against unjust irrigation tax was led by Pt. Sundarlal Sharma, Babu Chhotelal Srivastava, and Narayanrao Meghawale.'
              }
            ]
          },
          {
            id: 'test-cgpsc-2026-t2',
            titleHi: 'टेस्ट 02: छत्तीसगढ़ का भूगोल, नदी अपवाह तंत्र एवं खनिज संसाधन',
            titleEn: 'Test 02: Geography, River Drainage System & Mineral Resources of CG',
            scheduledDate: '21 June 2026',
            durationMinutes: 90,
            marksPerQuestion: 2.0,
            negativeMarking: 0.66,
            isPaid: true,
            questions: [
              {
                id: 'q201',
                qHi: 'महानदी की निम्नलिखित में से कौन-सी सहायक नदी उत्तर दिशा (शिवनाथ-हसदेव बेसिन) से आकर मिलती है?',
                qEn: 'Which of the following tributaries joins the Mahanadi river from the northern bank?',
                optionsHi: ['हसदेव नदी', 'पैरी नदी', 'सोंढूर नदी', 'सूखा नदी'],
                optionsEn: ['Hasdeo River', 'Pairi River', 'Sondhur River', 'Sukha River'],
                correctIndex: 0,
                expHi: 'शिवनाथ, हसदेव, मांड और केलो महानदी की उत्तर की ओर से मिलने वाली प्रमुख सहायक नदियां हैं, जबकि पैरी, सोंढूर और सूखा दक्षिण से मिलती हैं।',
                expEn: 'Shivnath, Hasdeo, Mand, and Kelo are the major northern-bank tributaries of Mahanadi, whereas Pairi, Sondhur, and Sukha join from the south.'
              },
              {
                id: 'q202',
                qHi: 'बैलाडीला (दंतेवाड़ा) की पहाड़ियों में किस उच्च कोटि के लौह अयस्क की प्रधानता है?',
                qEn: 'Which high-grade iron ore predominates in the Bailadila hills of Dantewada district?',
                optionsHi: ['हेमेटाइट (Hematite)', 'मैग्नेटाइट (Magnetite)', 'लिमोनाइट (Limonite)', 'सिडेराइट (Siderite)'],
                optionsEn: ['Hematite', 'Magnetite', 'Limonite', 'Siderite'],
                correctIndex: 0,
                expHi: 'बैलाडीला में विश्व-स्तरीय उच्च शुद्धता वाला हेमेटाइट (Hematite) लौह अयस्क पाया जाता है जिसका उत्खनन NMDC द्वारा किया जाता है।',
                expEn: 'Bailadila contains world-class high-purity Hematite iron ore extracted by NMDC.'
              },
              {
                id: 'q203',
                qHi: 'छत्तीसगढ़ की सबसे ऊँची चोटी "गौरलाटा" (1225 मीटर) किस पाट प्रदेश में स्थित है?',
                qEn: 'In which Pat region is Chhattisgarh\'s highest peak "Gaurlata" (1225 m) located?',
                optionsHi: ['सामरी पाट (बलरामपुर)', 'मैनपाट (सरगुजा)', 'जशपुर पाट', 'जारंग पाट'],
                optionsEn: ['Samri Pat (Balrampur)', 'Mainpat (Surguja)', 'Jashpur Pat', 'Jarang Pat'],
                correctIndex: 0,
                expHi: 'गौरलाटा (1225 मी.) बलरामपुर-रामानुजगंज जिले के सामरी पाट में स्थित छत्तीसगढ़ की सर्वोच्च पर्वत चोटी है।',
                expEn: 'Gaurlata (1225 m), located in the Samri Pat region of Balrampur-Ramanujganj district, is the highest peak in Chhattisgarh.'
              }
            ]
          },
          {
            id: 'test-cgpsc-2026-t3',
            titleHi: 'टेस्ट 03: भारतीय संविधान, पंचायती राज एवं नगरीय निकाय (छत्तीसगढ़ विशेष)',
            titleEn: 'Test 03: Indian Polity, Panchayati Raj & Urban Bodies (CG Special)',
            scheduledDate: '28 June 2026',
            durationMinutes: 90,
            marksPerQuestion: 2.0,
            negativeMarking: 0.66,
            isPaid: true,
            questions: [
              {
                id: 'q301',
                qHi: 'छत्तीसगढ़ पंचायती राज अधिनियम, 1993 की किस धारा में ग्राम सभा की बैठकों एवं गणपूर्ति (Quorum) का प्रावधान है?',
                qEn: 'Which section of the Chhattisgarh Panchayati Raj Act, 1993 provides for Gram Sabha meetings and Quorum?',
                optionsHi: ['धारा 6', 'धारा 13', 'धारा 40', 'धारा 77'],
                optionsEn: ['Section 6', 'Section 13', 'Section 40', 'Section 77'],
                correctIndex: 0,
                expHi: 'छत्तीसगढ़ पंचायती राज अधिनियम 1993 की धारा 6 में ग्राम सभा की बैठकों एवं गणपूर्ति (कुल सदस्यों का 1/10, जिसमें 1/3 महिलाएं) का उल्लेख है।',
                expEn: 'Section 6 of the Chhattisgarh Panchayati Raj Act 1993 details Gram Sabha meetings and quorum requirements (1/10th of total members, with at least 1/3rd women).'
              },
              {
                id: 'q302',
                qHi: 'छत्तीसगढ़ में "वापस बुलाने का अधिकार" (Right to Recall) पंचायती राज संस्थाओं के निर्वाचित पदाधिकारियों पर कितने वर्ष के कार्यकाल के बाद लागू किया जा सकता है?',
                qEn: 'After how many years of tenure can the "Right to Recall" be initiated against elected Panchayat office-bearers in Chhattisgarh?',
                optionsHi: ['2.5 वर्ष (अर्थात आधे कार्यकाल के पश्चात)', '1 वर्ष के पश्चात', '6 माह के पश्चात', '4 वर्ष के पश्चात'],
                optionsEn: ['2.5 Years (After completion of half tenure)', 'After 1 Year', 'After 6 Months', 'After 4 Years'],
                correctIndex: 0,
                expHi: 'छत्तीसगढ़ पंचायती राज अधिनियम की धारा 21(क) के अनुसार सरपंच या पंच को ढाई वर्ष (2.5 वर्ष) का कार्यकाल पूर्ण होने के बाद ही गुप्त मतदान द्वारा वापस बुलाया जा सकता है।',
                expEn: 'Under Section 21(A) of the CG Panchayati Raj Act, Right to Recall can only be initiated after the office-bearer has completed 2.5 years (half tenure).'
              }
            ]
          }
        ]
      },
      {
        id: 'folder-cgssb-vyapam-2026',
        titleHi: 'सीजीएसएसबी (CGSSB / Vyapam) संयुक्त अभ्यास फोल्डर',
        titleEn: 'CGSSB (Hostel Warden, Patwari, RI & ADEO) Practice Folder',
        examTag: 'CGSSB Exams',
        isPaid: false,
        priceINR: 0,
        validityDays: 365,
        descriptionHi: 'कंप्यूटर ज्ञान, छत्तीसगढ़ सामान्य ज्ञान, हिंदी व्याकरण, अंग्रेजी एवं गणित के निःशुल्क मॉक टेस्ट।',
        descriptionEn: 'Free full-length & sectional mock tests covering Computer Knowledge, CG GK, Hindi/English Grammar, and Aptitude.',
        tests: [
          {
            id: 'test-cgssb-comp-1',
            titleHi: 'CGSSB स्पेशल: कंप्यूटर एवं सूचना प्रौद्योगिकी + छत्तीसगढ़ सामान्य ज्ञान',
            titleEn: 'CGSSB Special: Computer & IT + Chhattisgarh General Studies',
            scheduledDate: 'Live Now',
            durationMinutes: 45,
            marksPerQuestion: 1.0,
            negativeMarking: 0.25,
            isPaid: false,
            questions: [
              {
                id: 'q-v1',
                qHi: 'कंप्यूटर में ऑपरेटिंग सिस्टम के बूटिंग (Booting) के दौरान BIOS किस मेमोरी में संग्रहीत रहता है?',
                qEn: 'In which memory is the BIOS stored during the booting process of a computer?',
                optionsHi: ['ROM (रीड ओनली मेमोरी)', 'RAM (रैंडम एक्सेस मेमोरी)', 'कैश मेमोरी (Cache)', 'वर्चुअल मेमोरी'],
                optionsEn: ['ROM (Read Only Memory)', 'RAM (Random Access Memory)', 'Cache Memory', 'Virtual Memory'],
                correctIndex: 0,
                expHi: 'BIOS (Basic Input Output System) फर्मवेयर नॉन-वोलेटाइल ROM चिप में संग्रहीत होता है।',
                expEn: 'BIOS (Basic Input Output System) firmware is stored in non-volatile ROM.'
              },
              {
                id: 'q-v2',
                qHi: 'छत्तीसगढ़ राज्य में "भोरमदेव मंदिर" किस जिले में स्थित है, जिसे छत्तीसगढ़ का खजुराहो कहा जाता है?',
                qEn: 'In which district of Chhattisgarh is the "Bhoramdeo Temple" (known as the Khajuraho of Chhattisgarh) located?',
                optionsHi: ['कबीरधाम (कवर्धा)', 'बिलासपुर', 'गरियाबंद', 'जांजगीर-चांपा'],
                optionsEn: ['Kabirdham (Kawardha)', 'Bilaspur', 'Gariaband', 'Janjgir-Champa'],
                correctIndex: 0,
                expHi: 'भोरमदेव मंदिर कबीरधाम (कवर्धा) जिले में चौरागांव में स्थित है जिसका निर्माण 11वीं शताब्दी में फणीनागवंशी शासक गोपालदेव ने करवाया था।',
                expEn: 'Bhoramdeo Temple is located at Chauragaon in Kabirdham (Kawardha) district, built in the 11th century by Phanindranagvanshi ruler Gopaldeo.'
              },
              {
                id: 'q-v3',
                qHi: 'MS Excel में किसी सेल में वर्तमान दिनांक और समय (Current Date & Time) दोनों प्रविष्ट करने के लिए किस फंक्शन का प्रयोग किया जाता है?',
                qEn: 'Which function is used in MS Excel to insert both the current date and current time into a cell?',
                optionsHi: ['=NOW()', '=TODAY()', '=TIME()', '=DATE()'],
                optionsEn: ['=NOW()', '=TODAY()', '=TIME()', '=DATE()'],
                correctIndex: 0,
                expHi: '=NOW() वर्तमान दिनांक एवं समय दोनों देता है, जबकि =TODAY() केवल वर्तमान दिनांक प्रदर्शित करता है।',
                expEn: '=NOW() returns both the current system date and time, whereas =TODAY() returns only the date.'
              }
            ]
          }
        ]
      }
    ]
  };

  // Complete 31-Test Official Schedule for Flagship CGPSC Pre 2026 Test Series
  const CGPSC_31_SCHEDULE = [
    { no: 1, date: '14 June 2026', subjectHi: 'छत्तीसगढ़ का इतिहास एवं स्वतंत्रता आंदोलन में योगदान', subjectEn: 'History of Chhattisgarh & Role in Freedom Movement' },
    { no: 2, date: '21 June 2026', subjectHi: 'छत्तीसगढ़ का भूगोल, जलवायु, भौतिक विभाजन एवं अपवाह तंत्र', subjectEn: 'Geography, Climate, Physical Divisions & Drainage of CG' },
    { no: 3, date: '28 June 2026', subjectHi: 'छत्तीसगढ़ की जनजातियाँ, लोक कला, संस्कृति, तीज-त्योहार एवं साहित्य', subjectEn: 'Tribes, Folk Art, Culture, Festivals & Literature of CG' },
    { no: 4, date: '05 July 2026', subjectHi: 'छत्तीसगढ़ पंचायती राज एवं नगरीय निकाय + प्रशासनिक संरचना', subjectEn: 'CG Panchayati Raj, Urban Local Bodies & Administration' },
    { no: 5, date: '12 July 2026', subjectHi: 'छत्तीसगढ़ अर्थव्यवस्था, वन, कृषि, खनिज, ऊर्जा एवं उद्योग', subjectEn: 'CG Economy, Forests, Agriculture, Minerals, Energy & Industries' },
    { no: 6, date: '19 July 2026', subjectHi: 'भारत का प्राचीन एवं मध्यकालीन इतिहास', subjectEn: 'Ancient & Medieval History of India' },
    { no: 7, date: '26 July 2026', subjectHi: 'आधुनिक भारत का इतिहास एवं भारतीय राष्ट्रीय आंदोलन', subjectEn: 'Modern Indian History & National Movement' },
    { no: 8, date: '02 Aug 2026', subjectHi: 'भारत का भौतिक, आर्थिक एवं सामाजिक भूगोल', subjectEn: 'Physical, Economic & Social Geography of India' },
    { no: 9, date: '09 Aug 2026', subjectHi: 'भारतीय संविधान एवं राजव्यवस्था (भाग 1)', subjectEn: 'Indian Constitution & Polity (Part 1)' },
    { no: 10, date: '16 Aug 2026', subjectHi: 'भारतीय राजव्यवस्था, संवैधानिक आयोग एवं लोक प्रशासन (भाग 2)', subjectEn: 'Indian Polity, Constitutional Bodies & Public Admin (Part 2)' },
    { no: 11, date: '23 Aug 2026', subjectHi: 'भारतीय अर्थव्यवस्था, बजट एवं पंचवर्षीय/नीति आयोग योजनाएं', subjectEn: 'Indian Economy, Union Budget & NITI Aayog Initiatives' },
    { no: 12, date: '30 Aug 2026', subjectHi: 'सामान्य विज्ञान (भौतिकी, रसायन, जीव विज्ञान) एवं प्रौद्योगिकी', subjectEn: 'General Science (Physics, Chemistry, Biology) & Space/Defence Tech' },
    { no: 13, date: '06 Sept 2026', subjectHi: 'पर्यावरण, पारिस्थितिकी, जैव-विविधता एवं जलवायु परिवर्तन', subjectEn: 'Environment, Ecology, Biodiversity & Climate Change' },
    { no: 14, date: '13 Sept 2026', subjectHi: 'भारतीय दर्शन, कला, साहित्य एवं संस्कृति', subjectEn: 'Indian Philosophy, Art, Architecture & Heritage' },
    { no: 15, date: '20 Sept 2026', subjectHi: 'सीसैट (CSAT Paper-II): तार्किक अभियोग्यता एवं डेटा व्याख्या', subjectEn: 'CSAT Paper-II: Logical Reasoning & Data Interpretation' },
    { no: 16, date: '27 Sept 2026', subjectHi: 'सीसैट (CSAT Paper-II): हिंदी भाषा एवं छत्तीसगढ़ी भाषा बोधगम्यता', subjectEn: 'CSAT Paper-II: Hindi & Chhattisgarhi Language Proficiency' },
    { no: 17, date: '04 Oct 2026', subjectHi: 'छत्तीसगढ़ आर्थिक सर्वेक्षण एवं राज्य बजट 2025-26 स्पेशल', subjectEn: 'Chhattisgarh Economic Survey & State Budget Special' },
    { no: 18, date: '11 Oct 2026', subjectHi: 'छत्तीसगढ़ शासन की फ्लैगशिप योजनाएं एवं नवीनतम नीतियां', subjectEn: 'Flagship Welfare Schemes & New Policies of Chhattisgarh Govt' },
    { no: 19, date: '18 Oct 2026', subjectHi: 'राष्ट्रीय एवं अंतर्राष्ट्रीय समसामयिकी (वार्षिकी 2025-26)', subjectEn: 'National & International Current Affairs (Annual 2025-26)' },
    { no: 20, date: '25 Oct 2026', subjectHi: 'छत्तीसगढ़ समसामयिकी एवं खेलकूद/पुरस्कार विशेषांक', subjectEn: 'Chhattisgarh Current Affairs, Sports & Awards Special' },
    { no: 21, date: '01 Nov 2026', subjectHi: 'संपूर्ण छत्तीसगढ़ सामान्य अध्ययन रिवीजन (100 प्रश्न)', subjectEn: 'Complete Chhattisgarh GS Mega Revision Paper-1' },
    { no: 22, date: '04 Nov 2026', subjectHi: 'संपूर्ण भारत सामान्य अध्ययन रिवीजन (100 प्रश्न)', subjectEn: 'Complete India GS Mega Revision Paper-1' },
    { no: 23, date: '08 Nov 2026', subjectHi: 'फुल लेंथ मॉक टेस्ट 01 (GS Paper-I पैटर्न)', subjectEn: 'Full Length Mock Test 01 (Complete GS Paper-I)' },
    { no: 24, date: '11 Nov 2026', subjectHi: 'फुल लेंथ मॉक टेस्ट 02 (CSAT Paper-II पैटर्न)', subjectEn: 'Full Length Mock Test 02 (Complete CSAT Paper-II)' },
    { no: 25, date: '15 Nov 2026', subjectHi: 'फुल लेंथ मॉक टेस्ट 03 (GS Paper-I पैटर्न)', subjectEn: 'Full Length Mock Test 03 (Complete GS Paper-I)' },
    { no: 26, date: '18 Nov 2026', subjectHi: 'फुल लेंथ मॉक टेस्ट 04 (CSAT Paper-II पैटर्न)', subjectEn: 'Full Length Mock Test 04 (Complete CSAT Paper-II)' },
    { no: 27, date: '21 Nov 2026', subjectHi: 'फुल लेंथ मॉक टेस्ट 05 (GS Paper-I पैटर्न)', subjectEn: 'Full Length Mock Test 05 (Complete GS Paper-I)' },
    { no: 28, date: '23 Nov 2026', subjectHi: 'फुल लेंथ मॉक टेस्ट 06 (GS Paper-I पैटर्न)', subjectEn: 'Full Length Mock Test 06 (Complete GS Paper-I)' },
    { no: 29, date: '25 Nov 2026', subjectHi: 'फुल लेंथ मॉक टेस्ट 07 (GS Paper-I पैटर्न)', subjectEn: 'Full Length Mock Test 07 (Complete GS Paper-I)' },
    { no: 30, date: '27 Nov 2026', subjectHi: 'फुल लेंथ मॉक टेस्ट 08 (ऑल-छत्तीसगढ़ रैंक सिम्युलेटर GS-I)', subjectEn: 'Full Length Mock Test 08 (All-CG Rank Simulator GS-I)' },
    { no: 31, date: '29 Nov 2026', subjectHi: 'फाइनल ग्रैंड मॉक टेस्ट 31 (पूर्ण CGPSC प्रीलिम्स सिम्युलेशन)', subjectEn: 'Final Grand Mock Test 31 (Full CGPSC Prelims Simulation)' }
  ];

  // State Management
  let state = loadState();
  let activeExamSession = null; // Holds live CBT state when taking a test
  let storyPlayerState = null;  // Holds Instagram story playback state
  let audioCtx = null;
  let isAnthemPlaying = false;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      return Object.assign({}, structuredClone(DEFAULT_STATE), parsed);
    } catch (e) {
      return structuredClone(DEFAULT_STATE);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Ignore storage quota errors
    }
  }

  function showToast(msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 4200);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Filter stories strictly within 24 hours (24-Hour Expiry Rule)
  function getActive24hStories() {
    const currentMs = Date.now();
    return (state.stories || []).filter(s => {
      const age = currentMs - (s.postedAt || 0);
      return age >= 0 && age <= STORY_DURATION_MS;
    });
  }

  function formatRemaining24h(postedAt) {
    const expiresAt = postedAt + STORY_DURATION_MS;
    const diffMs = Math.max(0, expiresAt - Date.now());
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;
  }

  // Check if current student has valid (non-expired) paid access to a folder
  function getStudentFolderAccess(folder) {
    if (!folder.isPaid) {
      return { unlocked: true, reason: 'Free Folder', expiresAt: null };
    }
    if (state.currentUser.isAdmin || state.currentUser.email.toLowerCase() === ADMIN_EMAIL) {
      return { unlocked: true, reason: 'Admin Master Access', expiresAt: null };
    }
    const idKey = `${folder.id}__${state.currentUser.id.trim().toLowerCase()}`;
    const emailKey = `${folder.id}__${state.currentUser.email.trim().toLowerCase()}`;
    const record = state.studentActivations[idKey] || state.studentActivations[emailKey];
    if (!record) {
      return { unlocked: false, reason: 'Locked (Requires Activation)', expiresAt: null };
    }
    const nowMs = Date.now();
    if (nowMs > record.expiresAt) {
      return { unlocked: false, reason: 'Validity Expired', expiredAt: record.expiresAt };
    }
    const daysLeft = Math.ceil((record.expiresAt - nowMs) / 86400000);
    return {
      unlocked: true,
      reason: `Active (${daysLeft} days remaining)`,
      activatedAt: record.activatedAt,
      expiresAt: record.expiresAt
    };
  }

  // Official CGpedia Channel Anthem Synthesizer (Web Audio API)
  function toggleAnthem() {
    const label = document.getElementById('anthemBtnLabel');
    if (isAnthemPlaying && audioCtx) {
      audioCtx.close();
      audioCtx = null;
      isAnthemPlaying = false;
      if (label) label.textContent = 'Anthem';
      showToast('🔇 CGpedia Anthem Paused');
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      isAnthemPlaying = true;
      if (label) label.textContent = 'Stop Anthem';
      showToast('🎵 Playing CGpedia Official Motivation Anthem (CGPSC & CGSSB)');

      const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 440.00, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.35);
        gain.gain.setValueAtTime(0.14, audioCtx.currentTime + idx * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (idx + 0.9) * 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.35);
        osc.stop(audioCtx.currentTime + (idx + 1) * 0.35);
      });
      setTimeout(() => {
        if (isAnthemPlaying) {
          isAnthemPlaying = false;
          if (label) label.textContent = 'Anthem';
        }
      }, notes.length * 360 + 200);
    } catch (err) {
      showToast('Audio playback requires user interaction.');
    }
  }

  // Automated 60-Minute Background Sync for Current Affairs
  function performBackgroundCurrentAffairsSync(isManualAdminTrigger = false) {
    const newStoryPool = [
      {
        category: 'CG Cabinet',
        icon: '⚡',
        titleHi: 'छत्तीसगढ़ लोक सेवा आयोग एवं व्यापम परीक्षा कैलेंडर पर नवीनतम अपडेट',
        titleEn: 'Latest Update on CGPSC & CGSSB Examination Calendar 2026',
        bodyHi: 'राज्य शासन द्वारा विभिन्न विभागों में रिक्त पदों की भर्ती प्रक्रिया को त्वरित करने के निर्देश जारी किए गए। अभ्यर्थियों को नियमित मॉक टेस्ट अभ्यास की सलाह।',
        bodyEn: 'State administration issued directives to fast-track recruitment across departments under CGPSC & CGSSB. Aspirants are advised to practice bilingual CBT mocks.',
        source: 'DPR Raipur Live Sync'
      },
      {
        category: 'CG Ecology',
        icon: '🐅',
        titleHi: 'गुरु घासीदास-तमोर पिंगला टाइगर रिजर्व: संरक्षण एवं इको-टूरिज्म',
        titleEn: 'Guru Ghasidas-Tamor Pingla Tiger Reserve: Conservation & Eco-Tourism',
        bodyHi: 'छत्तीसगढ़ में बाघ संरक्षण और वन्यजीव गलियारे के विकास हेतु विशेष बजट आवंटन। यह क्षेत्रफल की दृष्टि से देश के प्रमुख टाइगर रिजर्व में शामिल है।',
        bodyEn: 'Special conservation grant allocated for wildlife corridors in Guru Ghasidas-Tamor Pingla Tiger Reserve, one of India\'s largest tiger habitats.',
        source: 'CG Forest Dept / PIB'
      }
    ];
    const pick = newStoryPool[Math.floor(Math.random() * newStoryPool.length)];
    const created = {
      id: 'story-sync-' + Date.now(),
      category: pick.category,
      icon: pick.icon,
      titleHi: pick.titleHi,
      titleEn: pick.titleEn,
      bodyHi: pick.bodyHi,
      bodyEn: pick.bodyEn,
      source: pick.source,
      postedAt: Date.now(),
      seen: false
    };
    state.stories.unshift(created);
    state.lastAutoSyncAt = Date.now();
    saveState();
    renderApp();
    showToast(`🔔 नया करेंट अफेयर्स अपडेट: ${created.titleHi}`);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('CGpedia (CGPSC & CGSSB) — Current Affairs', {
        body: `${created.titleHi} / ${created.titleEn}`
      });
    }
    if (isManualAdminTrigger) {
      showToast('✅ Admin Live Current Affairs Sync Completed');
    }
  }

  // Schedule hourly background check
  setInterval(() => {
    performBackgroundCurrentAffairsSync(false);
  }, AUTO_SYNC_INTERVAL_MS);

  // Instant Student Current Affairs Quiz Generator
  function startInstantCurrentAffairsQuiz() {
    const quizTest = {
      id: 'ca-instant-quiz-' + Date.now(),
      titleHi: 'त्वरित समसामयिकी क्विज़ (छत्तीसगढ़ एवं राष्ट्रीय करेंट अफेयर्स)',
      titleEn: 'Instant Current Affairs Quiz (Chhattisgarh & National Updates)',
      scheduledDate: 'Instant Live Quiz',
      durationMinutes: 15,
      marksPerQuestion: 2.0,
      negativeMarking: 0.66,
      isPaid: false,
      questions: [
        {
          id: 'caq-1',
          qHi: 'छत्तीसगढ़ की "कृषक उन्नति योजना" का मुख्य उद्देश्य क्या है?',
          qEn: 'What is the primary objective of Chhattisgarh\'s "Krishak Unnati Yojana"?',
          optionsHi: [
            'किसानों को धान पर आदान सहायता (Input Assistance) की अंतर राशि सीधे खाते में प्रदान करना',
            'केवल निःशुल्क ट्रैक्टर वितरित करना',
            'केवल शहरी व्यापारियों को ऋण देना',
            'उपर्युक्त में से कोई नहीं'
          ],
          optionsEn: [
            'Providing Direct Benefit Transfer (DBT) of differential input assistance for paddy farmers',
            'Distributing free tractors only',
            'Providing urban commercial loans only',
            'None of the above'
          ],
          correctIndex: 0,
          expHi: 'कृषक उन्नति योजना के तहत पंजीकृत किसानों से समर्थन मूल्य पर धान उपार्जन के साथ अंतर की राशि सीधे बैंक खाते (DBT) में दी जाती है।',
          expEn: 'Under Krishak Unnati Yojana, registered farmers receive the differential input assistance amount directly in their bank accounts via DBT.'
        },
        {
          id: 'caq-2',
          qHi: 'हाल ही में चर्चा में रहा "गुरु घासीदास-तमोर पिंगला टाइगर रिजर्व" छत्तीसगढ़ के किन संभागों में विस्तृत है?',
          qEn: 'Across which divisions of Chhattisgarh is the "Guru Ghasidas-Tamor Pingla Tiger Reserve" spread?',
          optionsHi: [
            'सरगुजा एवं बिलासपुर संभाग (मनेंद्रगढ़-चिरमिरी-भरतपुर, कोरिया, सूरजपुर, बलरामपुर)',
            'केवल बस्तर संभाग',
            'केवल दुर्ग संभाग',
            'केवल रायपुर संभाग'
          ],
          optionsEn: [
            'Surguja & Bilaspur Divisions (MCB, Koriya, Surajpur, Balrampur)',
            'Bastar Division only',
            'Durg Division only',
            'Raipur Division only'
          ],
          correctIndex: 0,
          expHi: 'गुरु घासीदास-तमोर पिंगला टाइगर रिजर्व उत्तरी छत्तीसगढ़ के एमसीबी, कोरिया, सूरजपुर और बलरामपुर जिलों में फैला हुआ है।',
          expEn: 'Guru Ghasidas-Tamor Pingla Tiger Reserve spans MCB, Koriya, Surajpur, and Balrampur districts in northern Chhattisgarh.'
        },
        {
          id: 'caq-3',
          qHi: 'बस्तर की प्रसिद्ध "ढोकरा कला" (Dhokra Art) में किस धातु और तकनीक का प्रयोग होता है?',
          qEn: 'Which metal and technique are used in the GI-tagged "Dhokra Art" of Bastar?',
          optionsHi: [
            'पीतल/कांसा (Bell Metal) एवं मोम-क्षय (Lost-Wax Casting) पद्धति',
            'केवल चांदी की नक्काशी',
            'संगमरमर तराशने की कला',
            'कांच की पेंटिंग'
          ],
          optionsEn: [
            'Brass/Bell Metal & Lost-Wax Casting (Cire Perdue) technique',
            'Silver filigree only',
            'Marble carving',
            'Glass painting'
          ],
          correctIndex: 0,
          expHi: 'बस्तर की जीआई टैग प्राप्त ढोकरा कला में मधुमक्खी के मोम और पीतल/कांसा (घड़वा शिल्प) से मोम-क्षय पद्धति द्वारा मूर्तियां बनाई जाती हैं।',
          expEn: 'Bastar\'s GI-tagged Dhokra craft uses beeswax and brass/bell metal (Ghadwa art) through the traditional lost-wax casting technique.'
        },
        {
          id: 'caq-4',
          qHi: 'छत्तीसगढ़ में "महतारी वंदन योजना" के अंतर्गत पात्र विवाहित महिलाओं को प्रतिमाह कितनी वित्तीय सहायता राशि दी जाती है?',
          qEn: 'Under the "Mahtari Vandan Yojana" in Chhattisgarh, how much monthly financial assistance is transferred to eligible women?',
          optionsHi: ['₹1,000 प्रतिमाह (₹12,000 वार्षिक)', '₹500 प्रतिमाह', '₹2,500 प्रतिमाह', '₹3,000 प्रतिमाह'],
          optionsEn: ['₹1,000 per month (₹12,000 annually)', '₹500 per month', '₹2,500 per month', '₹3,000 per month'],
          correctIndex: 0,
          expHi: 'महतारी वंदन योजना के तहत छत्तीसगढ़ की पात्र विवाहित महिलाओं को डीबीटी के माध्यम से ₹1,000 प्रतिमाह (₹12,000 प्रतिवर्ष) प्रदान किए जाते हैं।',
          expEn: 'Under Mahtari Vandan Yojana, eligible married women in Chhattisgarh receive ₹1,000 per month (₹12,000 per year) via DBT.'
        }
      ]
    };
    launchCBTExam(quizTest, { titleHi: 'करेंट अफेयर्स लाइव क्विज़', titleEn: 'Current Affairs Instant Quiz' });
  }

  // Instagram-Style Story Player (Sequential, Non-Repeating, Hold-to-Pause, Left/Right Tap)
  function openStoryViewer(startIndex) {
    const activeStories = getActive24hStories();
    if (!activeStories.length) {
      showToast('कोई सक्रिय 24-घंटे की स्टोरी उपलब्ध नहीं है।');
      return;
    }

    storyPlayerState = {
      stories: activeStories,
      currentIndex: Math.max(0, Math.min(startIndex, activeStories.length - 1)),
      progress: 0,
      paused: false,
      timerId: null
    };

    markCurrentStorySeen();
    renderStoryModal();

    storyPlayerState.timerId = setInterval(() => {
      if (!storyPlayerState || storyPlayerState.paused) return;
      storyPlayerState.progress += 2; // 5 seconds total (50 ticks * 100ms)
      updateStoryProgressBarDOM();
      if (storyPlayerState.progress >= 100) {
        advanceNextStory();
      }
    }, 100);
  }

  function markCurrentStorySeen() {
    if (!storyPlayerState) return;
    const current = storyPlayerState.stories[storyPlayerState.currentIndex];
    if (!current) return;
    const target = state.stories.find(s => s.id === current.id);
    if (target) {
      target.seen = true;
      saveState();
    }
  }

  function advanceNextStory() {
    if (!storyPlayerState) return;
    // Sequential rule: Stop repeating once finished!
    if (storyPlayerState.currentIndex < storyPlayerState.stories.length - 1) {
      storyPlayerState.currentIndex += 1;
      storyPlayerState.progress = 0;
      markCurrentStorySeen();
      renderStoryModal();
    } else {
      closeStoryViewer();
      renderApp();
    }
  }

  function goPreviousStory() {
    if (!storyPlayerState) return;
    if (storyPlayerState.currentIndex > 0) {
      storyPlayerState.currentIndex -= 1;
      storyPlayerState.progress = 0;
      markCurrentStorySeen();
      renderStoryModal();
    } else {
      storyPlayerState.progress = 0;
      updateStoryProgressBarDOM();
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

  function updateStoryProgressBarDOM() {
    if (!storyPlayerState) return;
    const activeBar = document.getElementById('activeStoryProgressFill');
    if (activeBar) {
      activeBar.style.width = `${Math.min(100, storyPlayerState.progress)}%`;
    }
  }

  function renderStoryModal() {
    const container = document.getElementById('storyModalContainer');
    if (!container || !storyPlayerState) return;
    const { stories, currentIndex, progress, paused } = storyPlayerState;
    const st = stories[currentIndex];

    const segsHtml = stories.map((item, idx) => {
      let width = '0%';
      if (idx < currentIndex) width = '100%';
      else if (idx === currentIndex) width = `${progress}%`;
      return `
        <div class="story-progress-seg">
          <div class="story-progress-fill" ${idx === currentIndex ? 'id="activeStoryProgressFill"' : ''} style="width:${width}"></div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="story-modal-backdrop" id="storyBackdrop">
        <div class="story-player-frame" id="storyInteractiveFrame">
          <div>
            <div class="story-progress-row">${segsHtml}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:1.5rem;">${st.icon || '📰'}</span>
                <div>
                  <div style="font-weight:800;font-size:0.86rem;">${escapeHtml(st.category)} • ${currentIndex + 1}/${stories.length}</div>
                  <div style="font-size:0.72rem;color:#FBBF24;">⏳ ${formatRemaining24h(st.postedAt)} (24h Auto-Expiry)</div>
                </div>
              </div>
              <button class="btn btn-outline btn-sm" id="closeStoryBtn" style="background:rgba(255,255,255,0.12);color:#FFF;border:none;">✕ Close</button>
            </div>

            <div style="background:rgba(255,255,255,0.08);border-radius:16px;padding:18px;border-left:4px solid #F59E0B;margin-top:10px;">
              <div style="font-size:0.72rem;font-weight:800;color:#FBBF24;text-transform:uppercase;margin-bottom:6px;">
                1st Language: हिंदी (Devanagari)
              </div>
              <h3 style="font-size:1.14rem;font-weight:800;margin-bottom:8px;line-height:1.4;">${escapeHtml(st.titleHi)}</h3>
              <p style="font-size:0.93rem;color:#E2E8F0;line-height:1.55;">${escapeHtml(st.bodyHi)}</p>
            </div>

            <div style="background:rgba(255,255,255,0.06);border-radius:16px;padding:18px;border-left:4px solid #60A5FA;margin-top:12px;">
              <div style="font-size:0.72rem;font-weight:800;color:#93C5FD;text-transform:uppercase;margin-bottom:6px;">
                2nd Language: English
              </div>
              <h4 style="font-size:1.02rem;font-weight:800;margin-bottom:8px;line-height:1.4;">${escapeHtml(st.titleEn)}</h4>
              <p style="font-size:0.88rem;color:#CBD5E1;line-height:1.55;">${escapeHtml(st.bodyEn)}</p>
            </div>
          </div>

          <div style="margin-top:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.75rem;color:#94A3B8;margin-bottom:10px;">
              <span>📌 Source: ${escapeHtml(st.source || 'Official Bulletin')}</span>
              <span id="storyPauseStatus">${paused ? '⏸ PAUSED' : '▶ PLAYING'}</span>
            </div>
            <div style="background:rgba(0,0,0,0.35);padding:9px 12px;border-radius:10px;font-size:0.74rem;text-align:center;color:#CBD5E1;">
              👈 बाएं टैप: पिछली स्टोरी • ✋ दबाए रखें (Hold): पॉज़ • दाएं टैप: अगली स्टोरी 👉
            </div>
          </div>
        </div>
      </div>
    `;

    const closeBtn = document.getElementById('closeStoryBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeStoryViewer();
      });
    }

    const frame = document.getElementById('storyInteractiveFrame');
    if (frame) {
      let pressStart = 0;

      const onPointerDown = (e) => {
        if (e.target.closest('#closeStoryBtn')) return;
        pressStart = Date.now();
        if (storyPlayerState) {
          storyPlayerState.paused = true;
          const badge = document.getElementById('storyPauseStatus');
          if (badge) badge.textContent = '⏸ PAUSED (Hold)';
        }
      };

      const onPointerUp = (e) => {
        if (e.target.closest('#closeStoryBtn')) return;
        const heldDuration = Date.now() - pressStart;
        if (storyPlayerState) {
          storyPlayerState.paused = false;
          const badge = document.getElementById('storyPauseStatus');
          if (badge) badge.textContent = '▶ PLAYING';
        }
        // If held for > 260ms, treat as hold-to-pause release, not tap navigation
        if (heldDuration > 260) return;

        const rect = frame.getBoundingClientRect();
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const relX = clientX - rect.left;
        if (relX < rect.width * 0.38) {
          goPreviousStory();
        } else {
          advanceNextStory();
        }
      };

      frame.addEventListener('mousedown', onPointerDown);
      frame.addEventListener('mouseup', onPointerUp);
      frame.addEventListener('touchstart', onPointerDown, { passive: true });
      frame.addEventListener('touchend', onPointerUp);
    }
  }

  // Launch Interactive Bilingual CBT Exam Room
  function launchCBTExam(testObj, folderObj) {
    if (!testObj.questions || !testObj.questions.length) {
      showToast('इस टेस्ट में अभी प्रश्न जोड़े जा रहे हैं।');
      return;
    }
    if (activeExamSession && activeExamSession.timerInterval) {
      clearInterval(activeExamSession.timerInterval);
    }
    activeExamSession = {
      test: testObj,
      folder: folderObj,
      currentQIndex: 0,
      remainingSeconds: (testObj.durationMinutes || 60) * 60,
      answers: {},       // qIndex -> selectedOptionIndex
      markedReview: {},  // qIndex -> boolean
      visited: { 0: true },
      submitted: false,
      timerInterval: null
    };

    activeExamSession.timerInterval = setInterval(() => {
      if (!activeExamSession || activeExamSession.submitted) return;
      activeExamSession.remainingSeconds -= 1;
      const timerEl = document.getElementById('cbtLiveTimer');
      if (timerEl) {
        timerEl.textContent = formatMMSS(activeExamSession.remainingSeconds);
      }
      if (activeExamSession.remainingSeconds <= 0) {
        finalizeCBTExam();
      }
    }, 1000);

    renderApp();
  }

  function formatMMSS(totalSec) {
    const s = Math.max(0, totalSec);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function openSafeSubmitModal() {
    if (!activeExamSession) return;
    const totalQ = activeExamSession.test.questions.length;
    const answeredCount = Object.keys(activeExamSession.answers).length;
    const reviewCount = Object.keys(activeExamSession.markedReview).filter(k => activeExamSession.markedReview[k]).length;
    const unattemptedCount = totalQ - answeredCount;

    const modal = document.getElementById('genericModalContainer');
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card">
          <h3 style="font-size:1.22rem;font-weight:800;margin-bottom:8px;">
            🛡️ सुरक्षित टेस्ट सबमिशन पुष्टि / Safe Submit Confirmation
          </h3>
          <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:16px;">
            क्या आप वाकई अपना टेस्ट सबमिट करना चाहते हैं? (Submit बटन को गलती से दबने से बचाने के लिए अलग सुरक्षित स्थान पर रखा गया है।)
          </p>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;text-align:center;">
            <div style="background:var(--bg-elevated);padding:12px;border-radius:10px;">
              <div style="font-size:1.3rem;font-weight:900;color:#059669;">${answeredCount}</div>
              <div style="font-size:0.76rem;font-weight:700;">उत्तर दिए (Answered)</div>
            </div>
            <div style="background:var(--bg-elevated);padding:12px;border-radius:10px;">
              <div style="font-size:1.3rem;font-weight:900;color:#DC2626;">${unattemptedCount}</div>
              <div style="font-size:0.76rem;font-weight:700;">छोड़े गए (Unattempted)</div>
            </div>
            <div style="background:var(--bg-elevated);padding:12px;border-radius:10px;">
              <div style="font-size:1.3rem;font-weight:900;color:#7C3AED;">${reviewCount}</div>
              <div style="font-size:0.76rem;font-weight:700;">समीक्षा चिह्नित (Review)</div>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;">
            <button class="btn btn-outline" id="cancelSafeSubmitBtn">↩ टेस्ट में वापस जाएं (Resume Test)</button>
            <button class="btn btn-emerald" id="confirmFinalSubmitBtn">✅ हां, फाइनल सबमिट करें (Confirm Submit)</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('cancelSafeSubmitBtn').onclick = () => {
      modal.innerHTML = '';
    };
    document.getElementById('confirmFinalSubmitBtn').onclick = () => {
      modal.innerHTML = '';
      finalizeCBTExam();
    };
  }

  function finalizeCBTExam() {
    if (!activeExamSession) return;
    if (activeExamSession.timerInterval) {
      clearInterval(activeExamSession.timerInterval);
    }
    activeExamSession.submitted = true;
    renderApp();
  }

  // Open 31-Test Schedule Modal
  function open31ScheduleModal() {
    const modal = document.getElementById('genericModalContainer');
    const rowsHtml = CGPSC_31_SCHEDULE.map(item => `
      <tr style="border-bottom:1px solid var(--border-color);">
        <td style="padding:8px;font-weight:800;">#${item.no}</td>
        <td style="padding:8px;white-space:nowrap;font-weight:700;color:var(--brand-blue);">${escapeHtml(item.date)}</td>
        <td style="padding:8px;">
          <div style="font-weight:700;">${escapeHtml(item.subjectHi)}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">${escapeHtml(item.subjectEn)}</div>
        </td>
        <td style="padding:8px;font-size:0.78rem;font-weight:700;">100 Q • Bilingual</td>
      </tr>
    `).join('');

    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:860px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div>
              <h3 style="font-size:1.2rem;font-weight:800;">📅 सीजीपीएससी प्री 2026 टेस्ट सीरीज (₹99) — 31 टेस्ट आधिकारिक समय-सारणी</h3>
              <p style="font-size:0.82rem;color:var(--text-secondary);">14 जून 2026 से 29 नवंबर 2026 • प्रत्येक टेस्ट में 100 द्विभाषी प्रश्न (1st हिंदी, 2nd English) • एक्टिवेशन से 180 दिन की वैधता</p>
            </div>
            <button class="btn btn-outline btn-sm" id="closeScheduleModalBtn">✕ Close</button>
          </div>
          <div style="overflow-x:auto;max-height:60vh;">
            <table style="width:100%;border-collapse:collapse;font-size:0.84rem;text-align:left;">
              <thead>
                <tr style="background:var(--bg-elevated);">
                  <th style="padding:9px;">Test</th>
                  <th style="padding:9px;">Date</th>
                  <th style="padding:9px;">Bilingual Syllabus Topic (1st हिंदी / 2nd English)</th>
                  <th style="padding:9px;">Pattern</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
          <div style="margin-top:14px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <span style="font-size:0.82rem;font-weight:700;">💬 पेमेंट एवं तुरंत एक्टिवेशन हेतु WhatsApp करें: <strong>9238810070</strong></span>
            <a href="https://wa.me/919238810070?text=Hello%20Admin%2C%20please%20activate%20CGPSC%20Pre%202026%20Test%20Series%20(%E2%82%B999)%20for%20my%20ID%3A%20${encodeURIComponent(state.currentUser.id)}" target="_blank" rel="noopener noreferrer" class="btn btn-emerald btn-sm">📲 WhatsApp 9238810070 पर संपर्क करें</a>
          </div>
        </div>
      </div>
    `;
    document.getElementById('closeScheduleModalBtn').onclick = () => {
      modal.innerHTML = '';
    };
  }

  // Student Profile / ID Switcher Modal
  function openUserSwitchModal() {
    const modal = document.getElementById('genericModalContainer');
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-card" style="max-width:480px;">
          <h3 style="font-size:1.15rem;font-weight:800;margin-bottom:8px;">👤 Student / Admin Account Switcher</h3>
          <p style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:14px;">
            अपनी Student ID या Email दर्ज करें (Paid Test Series अनलॉक और प्राइवेट डाउट सेक्शन के लिए)। एडमिन एक्सेस के लिए <code>${ADMIN_EMAIL}</code> दर्ज करें।
          </p>
          <label style="font-size:0.8rem;font-weight:700;">Student ID / Roll Code</label>
          <input type="text" id="modalUserIdInput" class="input-field" value="${escapeHtml(state.currentUser.id)}" />
          <label style="font-size:0.8rem;font-weight:700;">Email ID</label>
          <input type="email" id="modalUserEmailInput" class="input-field" value="${escapeHtml(state.currentUser.email)}" />
          <div style="display:flex;justify-content:space-between;gap:8px;margin-top:8px;flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm" id="quickAdminSwitchBtn">🔑 Switch to Owner Admin (${ADMIN_EMAIL})</button>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-outline btn-sm" id="closeUserModalBtn">Cancel</button>
              <button class="btn btn-primary btn-sm" id="saveUserModalBtn">Save Account</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('closeUserModalBtn').onclick = () => { modal.innerHTML = ''; };
    document.getElementById('quickAdminSwitchBtn').onclick = () => {
      state.currentUser = {
        id: 'ADMIN-OWNER',
        email: ADMIN_EMAIL,
        name: 'CGpedia Owner Admin',
        isAdmin: true
      };
      saveState();
      modal.innerHTML = '';
      renderApp();
      showToast('✅ Logged in as Owner Admin (usahu0304@gmail.com)');
    };
    document.getElementById('saveUserModalBtn').onclick = () => {
      const newId = document.getElementById('modalUserIdInput').value.trim() || 'STU-2026-108';
      const newEmail = document.getElementById('modalUserEmailInput').value.trim() || 'student@cgpedia.in';
      state.currentUser = {
        id: newId,
        email: newEmail,
        name: newEmail.toLowerCase() === ADMIN_EMAIL ? 'Owner Admin' : 'Student',
        isAdmin: newEmail.toLowerCase() === ADMIN_EMAIL
      };
      saveState();
      modal.innerHTML = '';
      renderApp();
      showToast(`👤 Active Account: ${state.currentUser.id} (${state.currentUser.email})`);
    };
  }

  // Render Instagram-Style 24h Stories Strip
  function renderStoriesStripHTML() {
    const activeStories = getActive24hStories();
    const bubblesHtml = activeStories.map((st, idx) => `
      <div class="story-bubble" data-story-index="${idx}">
        <div class="story-ring ${st.seen ? 'seen' : ''}">
          <div class="story-avatar">
            <span>${st.icon || '📰'}</span>
            <span class="story-avatar-tag">${escapeHtml(st.category.slice(0, 7))}</span>
          </div>
        </div>
        <div class="story-label" title="${escapeHtml(st.titleHi)}">${escapeHtml(st.titleHi)}</div>
        <div class="story-time-left">${formatRemaining24h(st.postedAt)}</div>
      </div>
    `).join('');

    return `
      <section class="stories-card">
        <div class="stories-header">
          <div class="stories-title-wrap">
            <span class="live-dot"></span>
            <strong style="font-size:0.95rem;">24-Hour Current Affairs Stories (द्विभाषी: हिंदी &amp; English)</strong>
            <span class="badge badge-free">Auto-Updates Hourly</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="btn btn-gold btn-sm" id="launchInstantCAQuizBtn">⚡ Quiz (त्वरित करेंट अफेयर्स क्विज़)</button>
          </div>
        </div>
        <div class="stories-strip">
          ${bubblesHtml || '<div style="font-size:0.85rem;color:var(--text-secondary);">पिछले 24 घंटों की सभी स्टोरीज़ देखी जा चुकी हैं। नया अपडेट शीघ्र सिंक होगा।</div>'}
        </div>
      </section>
    `;
  }

  // Render Active CBT Exam View (Protected from copy/right-click, with separated Safe Submit Zone)
  function renderActiveCBTView() {
    const { test, folder, currentQIndex, remainingSeconds, answers, markedReview, visited, submitted } = activeExamSession;
    const questions = test.questions;
    const marksPos = Number(test.marksPerQuestion || 2.0);
    const marksNeg = Number(test.negativeMarking || 0.66);

    if (submitted) {
      let correct = 0;
      let wrong = 0;
      let unattempted = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === undefined) unattempted++;
        else if (answers[idx] === q.correctIndex) correct++;
        else wrong++;
      });
      const rawScore = (correct * marksPos) - (wrong * marksNeg);
      const maxScore = questions.length * marksPos;
      const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

      const solutionsHtml = questions.map((q, idx) => {
        const userAns = answers[idx];
        const isCorrect = userAns === q.correctIndex;
        const statusBadge = userAns === undefined
          ? '<span class="badge" style="background:#E2E8F0;color:#475569;">Unattempted</span>'
          : isCorrect
            ? '<span class="badge badge-free">✓ Correct (+' + marksPos + ')</span>'
            : '<span class="badge badge-live">✗ Incorrect (-' + marksNeg + ')</span>';

        return `
          <div class="folder-card" style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>Question ${idx + 1}</strong>
              ${statusBadge}
            </div>
            <div class="bilingual-q-box" style="margin-top:8px;">
              <div class="q-hi">${escapeHtml(q.qHi)}</div>
              <div class="q-en">${escapeHtml(q.qEn)}</div>
            </div>
            <div style="font-size:0.86rem;margin-bottom:8px;">
              <strong>सही उत्तर / Correct Option (${String.fromCharCode(65 + q.correctIndex)}):</strong>
              ${escapeHtml(q.optionsHi[q.correctIndex])} / ${escapeHtml(q.optionsEn[q.correctIndex])}
            </div>
            <div style="background:var(--bg-elevated);padding:12px;border-radius:10px;font-size:0.84rem;">
              <div style="font-weight:700;color:var(--brand-blue);margin-bottom:4px;">💡 विस्तृत व्याख्या (Bilingual Explanation):</div>
              <div><strong>हिंदी:</strong> ${escapeHtml(q.expHi || '')}</div>
              <div style="margin-top:4px;color:var(--text-secondary);"><strong>English:</strong> ${escapeHtml(q.expEn || '')}</div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div>
          <div class="cbt-top-bar">
            <div>
              <div style="font-size:0.78rem;color:#93C5FD;">CGpedia (CGPSC &amp; CGSSB) — Exam Result &amp; Solutions</div>
              <h2 style="font-size:1.2rem;font-weight:800;">${escapeHtml(test.titleHi)}</h2>
            </div>
            <button class="btn btn-gold btn-sm" id="exitCBTBtn">🏠 Back to Exam Folder</button>
          </div>

          <div class="admin-stats-grid">
            <div class="stat-card">
              <div style="font-size:0.8rem;color:var(--text-secondary);font-weight:700;">Final Score</div>
              <div class="stat-value">${rawScore.toFixed(2)} / ${maxScore}</div>
            </div>
            <div class="stat-card">
              <div style="font-size:0.8rem;color:var(--text-secondary);font-weight:700;">Accuracy</div>
              <div class="stat-value" style="color:#059669;">${accuracy}%</div>
            </div>
            <div class="stat-card">
              <div style="font-size:0.8rem;color:var(--text-secondary);font-weight:700;">Correct / Wrong</div>
              <div class="stat-value">${correct} ✓ / ${wrong} ✗</div>
            </div>
            <div class="stat-card">
              <div style="font-size:0.8rem;color:var(--text-secondary);font-weight:700;">Unattempted</div>
              <div class="stat-value" style="color:#64748B;">${unattempted}</div>
            </div>
          </div>

          <h3 style="margin:18px 0 12px;font-weight:800;">📘 प्रश्नवार द्विभाषी समाधान (Detailed Bilingual Solutions)</h3>
          ${solutionsHtml}
        </div>
      `;
    }

    const q = questions[currentQIndex];
    const selectedOpt = answers[currentQIndex];
    const isMarked = !!markedReview[currentQIndex];

    const optionsHtml = q.optionsHi.map((optHi, optIdx) => {
      const optEn = (q.optionsEn && q.optionsEn[optIdx]) || '';
      const isSelected = selectedOpt === optIdx;
      return `
        <button class="option-item ${isSelected ? 'selected' : ''}" data-opt-index="${optIdx}">
          <span class="option-circle">${String.fromCharCode(65 + optIdx)}</span>
          <div>
            <div style="font-weight:700;font-size:0.95rem;">${escapeHtml(optHi)}</div>
            <div style="font-size:0.84rem;color:var(--text-secondary);">${escapeHtml(optEn)}</div>
          </div>
        </button>
      `;
    }).join('');

    const paletteHtml = questions.map((_, idx) => {
      let cls = 'palette-btn';
      if (markedReview[idx]) cls += ' review';
      else if (answers[idx] !== undefined) cls += ' answered';
      else if (visited[idx]) cls += ' visited';
      if (idx === currentQIndex) cls += ' current';
      return `<button class="${cls}" data-jump-index="${idx}">${idx + 1}</button>`;
    }).join('');

    return `
      <div class="protected-exam-view">
        <div class="cbt-top-bar">
          <div>
            <div style="font-size:0.75rem;color:#FBBF24;font-weight:700;">🔒 ANTI-PIRACY PROTECTED CBT • CGPSC &amp; CGSSB</div>
            <h2 style="font-size:1.1rem;font-weight:800;">${escapeHtml(test.titleHi)}</h2>
            <div style="font-size:0.8rem;color:#DBEAFE;">${escapeHtml(test.titleEn)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="timer-pill" id="cbtLiveTimer">⏱ ${formatMMSS(remainingSeconds)}</div>
            <button class="btn btn-outline btn-sm" id="exitCBTBtn" style="background:rgba(255,255,255,0.12);color:#FFF;border:none;">✕ Exit</button>
          </div>
        </div>

        <div class="cbt-layout">
          <!-- Left Question Area -->
          <div class="cbt-question-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
              <span style="font-weight:800;font-size:0.95rem;color:var(--brand-blue);">
                प्रश्न / Question ${currentQIndex + 1} of ${questions.length}
              </span>
              <div style="display:flex;gap:8px;">
                <span class="badge badge-free">+${marksPos} Marks</span>
                <span class="badge badge-live">-${marksNeg} Negative</span>
              </div>
            </div>

            <div class="bilingual-q-box">
              <div style="font-size:0.7rem;font-weight:800;color:var(--brand-blue);text-transform:uppercase;margin-bottom:4px;">
                1st Language: हिंदी (Devanagari)
              </div>
              <div class="q-hi">${escapeHtml(q.qHi)}</div>
              <hr style="border:none;border-top:1px dashed var(--border-color);margin:10px 0;" />
              <div style="font-size:0.7rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">
                2nd Language: English
              </div>
              <div class="q-en">${escapeHtml(q.qEn)}</div>
            </div>

            <div>${optionsHtml}</div>

            <!-- Question Navigation Footer: Submit is intentionally NOT placed here next to Next Question -->
            <div class="cbt-nav-footer">
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-outline btn-sm" id="prevQBtn" ${currentQIndex === 0 ? 'disabled' : ''}>⬅ Previous</button>
                <button class="btn btn-outline btn-sm" id="clearOptionBtn">🧹 Clear Response</button>
                <button class="btn btn-outline btn-sm" id="markReviewBtn">
                  ${isMarked ? '🟣 Unmark Review' : '🔖 Mark for Review'}
                </button>
              </div>
              <div>
                ${currentQIndex < questions.length - 1
                  ? `<button class="btn btn-primary" id="nextQBtn">Save &amp; Next Question ➡</button>`
                  : `<span style="font-size:0.82rem;font-weight:700;color:var(--brand-emerald);">✓ अंतिम प्रश्न (Use Safe Submit Box on Right/Below)</span>`
                }
              </div>
            </div>
          </div>

          <!-- Right Palette & Dedicated Safe Submit Zone -->
          <div class="palette-card">
            <h4 style="font-size:0.95rem;font-weight:800;">Question Palette (प्रश्न पैलेट)</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.74rem;margin-top:8px;">
              <div>🟢 Answered (${Object.keys(answers).length})</div>
              <div>🟣 Review (${Object.keys(markedReview).filter(k => markedReview[k]).length})</div>
              <div>🟠 Visited</div>
              <div>⚪ Not Visited</div>
            </div>

            <div class="palette-grid">${paletteHtml}</div>

            <!-- Safe Submit Zone: Separated away from Next Question button -->
            <div class="safe-submit-zone">
              <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:8px;">
                🛡️ <strong>Safe Submit Location:</strong> गलती से सबमिट होने से बचाने के लिए सबमिट बटन को यहाँ अलग सुरक्षित बॉक्स में रखा गया है।
              </div>
              <button class="btn btn-emerald" id="safeSubmitTriggerBtn" style="width:100%;">
                ✅ Submit Complete Test (सुरक्षित सबमिट करें)
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Render Dashboard (Exam-Wise Folders strictly containing their tests)
  function renderDashboardHTML() {
    // If a folder is currently opened, show inside that Exam Folder
    if (state.selectedFolderId) {
      const folder = state.folders.find(f => f.id === state.selectedFolderId);
      if (!folder) {
        state.selectedFolderId = null;
        return renderDashboardHTML();
      }
      const access = getStudentFolderAccess(folder);

      const testsListHtml = (folder.tests || []).map((test, idx) => {
        const testLocked = folder.isPaid && test.isPaid && !access.unlocked;
        return `
          <div class="folder-card">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
                <span class="badge ${test.isPaid ? 'badge-paid' : 'badge-free'}">
                  ${test.isPaid ? (testLocked ? '🔒 Paid Test' : '🔓 Unlocked Paid') : '🆓 Free / Demo Test'}
                </span>
                <span style="font-size:0.76rem;font-weight:700;color:var(--text-muted);">📅 ${escapeHtml(test.scheduledDate || 'Live')}</span>
              </div>
              <h4 style="font-size:1.03rem;font-weight:800;margin-bottom:4px;">${escapeHtml(test.titleHi)}</h4>
              <div style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:10px;">${escapeHtml(test.titleEn)}</div>
              <div class="folder-meta">
                <span>📝 ${(test.questions || []).length} Bilingual MCQs</span>
                <span>⏱ ${test.durationMinutes} Mins</span>
                <span>➕ +${test.marksPerQuestion} / -${test.negativeMarking}</span>
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
              ${testLocked
                ? `<a href="https://wa.me/919238810070?text=Hello%20Admin%2C%20I%20want%20to%20unlock%20${encodeURIComponent(folder.titleEn)}%20(%E2%82%B9${folder.priceINR})%20for%20Student%20ID%3A%20${encodeURIComponent(state.currentUser.id)}" target="_blank" rel="noopener noreferrer" class="btn btn-gold btn-sm" style="width:100%;">🔒 Unlock via WhatsApp 9238810070 (₹${folder.priceINR})</a>`
                : `<button class="btn btn-primary btn-sm start-test-btn" data-folder-id="${folder.id}" data-test-id="${test.id}" style="width:100%;">▶ Start Bilingual Test (टेस्ट प्रारंभ करें)</button>`
              }
            </div>
          </div>
        `;
      }).join('');

      return `
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
            <button class="btn btn-outline btn-sm" id="backToFoldersBtn">⬅ Back to All Exam Folders (सभी परीक्षा फोल्डर)</button>
            <div style="display:flex;gap:8px;align-items:center;">
              <span class="badge ${access.unlocked ? 'badge-free' : 'badge-paid'}">${escapeHtml(access.reason)}</span>
              ${folder.id === 'folder-cgpsc-pre-2026' ? `<button class="btn btn-gold btn-sm" id="view31ScheduleInsideBtn">📅 View Full 31-Test Schedule</button>` : ''}
            </div>
          </div>

          <div class="hero-banner" style="margin-bottom:18px;">
            <div style="font-size:0.76rem;color:#FBBF24;font-weight:800;text-transform:uppercase;">📁 EXAM FOLDER • CGPSC &amp; CGSSB</div>
            <h1>${escapeHtml(folder.titleHi)}</h1>
            <p>${escapeHtml(folder.titleEn)}</p>
            <div style="font-size:0.84rem;color:#E2E8F0;">${escapeHtml(folder.descriptionHi)}</div>
          </div>

          <div class="cards-grid">
            ${testsListHtml}
          </div>
        </div>
      `;
    }

    // Main Folder Overview (Tests stay strictly inside their folders!)
    const foldersHtml = state.folders.map(folder => {
      const access = getStudentFolderAccess(folder);
      const isFlagship = folder.id === 'folder-cgpsc-pre-2026';
      return `
        <div class="folder-card ${isFlagship ? 'flagship' : ''}">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">
              <span class="badge ${folder.isPaid ? 'badge-paid' : 'badge-free'}">
                ${folder.isPaid ? `💎 Paid Package ₹${folder.priceINR}` : '🆓 Free Exam Folder'}
              </span>
              <span class="badge ${access.unlocked ? 'badge-free' : 'badge-live'}">${escapeHtml(access.reason)}</span>
            </div>
            <h3 style="font-size:1.12rem;font-weight:800;margin-bottom:4px;">📁 ${escapeHtml(folder.titleHi)}</h3>
            <div style="font-size:0.86rem;font-weight:700;color:var(--text-secondary);margin-bottom:10px;">${escapeHtml(folder.titleEn)}</div>
            <p style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:12px;">${escapeHtml(folder.descriptionHi)}</p>
            <div class="folder-meta">
              <span>📚 ${(folder.tests || []).length} Live Papers Inside</span>
              <span>⏳ Validity: ${folder.validityDays} Days (from Activation)</span>
              <span>🌐 1st हिंदी / 2nd English</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary open-folder-btn" data-folder-id="${folder.id}" style="flex:1;">
              📂 Open Exam Folder (${(folder.tests || []).length} Tests)
            </button>
            ${isFlagship ? `<button class="btn btn-gold btn-sm" id="open31ScheduleHeroBtn">📅 31-Test Schedule</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      ${renderStoriesStripHTML()}

      <div class="hero-grid">
        <div class="hero-banner">
          <span class="badge badge-paid" style="background:#F59E0B;color:#0F172A;border:none;margin-bottom:10px;">
            🔥 FLAGSHIP BATCH • CGPSC &amp; CGSSB
          </span>
          <h1>सीजीपीएससी प्री 2026 टेस्ट सीरीज (₹99) — 31 द्विभाषी टेस्ट</h1>
          <p>14 जून 2026 से 29 नवंबर 2026 तक • प्रत्येक पेपर में 100 द्विभाषी प्रश्न (1st हिंदी, 2nd English) • छात्र एक्टिवेशन की सटीक तिथि से 6 माह (180 दिन) की वैधता।</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-gold" id="heroOpenFlagshipFolderBtn">📂 Open CGPSC Pre 2026 Folder</button>
            <button class="btn btn-outline" id="heroScheduleModalBtn" style="background:rgba(255,255,255,0.12);color:#FFF;border-color:rgba(255,255,255,0.3);">📅 31-Test Time Table</button>
          </div>
        </div>

        <div class="whatsapp-support-card">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <span class="badge badge-free">PAYMENT &amp; ACTIVATION DESK</span>
              <strong style="color:#059669;font-size:0.86rem;">WhatsApp: 9238810070</strong>
            </div>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:6px;">पेड टेस्ट सीरीज अनलॉक एवं सहायता</h3>
            <p style="font-size:0.83rem;color:var(--text-secondary);margin-bottom:10px;">
              पेड पैकेज खरीदने के लिए <strong>9238810070</strong> पर WhatsApp करें। एडमिन द्वारा आपकी Student ID (<code>${escapeHtml(state.currentUser.id)}</code>) या Email सक्रिय करते ही आपकी वैधता का काउंटडाउन शुरू हो जाएगा।
            </p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <a href="https://wa.me/919238810070?text=Hello%20CGpedia%20Admin%2C%20please%20activate%20CGPSC%20Pre%202026%20Test%20Series%20(%E2%82%B999)%20for%20Student%20ID%3A%20${encodeURIComponent(state.currentUser.id)}%20(${encodeURIComponent(state.currentUser.email)})" target="_blank" rel="noopener noreferrer" class="btn btn-emerald btn-sm" style="flex:1;">
              💬 WhatsApp 9238810070
            </a>
            <a href="/CGpedia.apk" download="CGpedia.apk" class="btn btn-outline btn-sm">⬇ Download APK</a>
          </div>
        </div>
      </div>

      <div class="section-header">
        <div class="section-title">📁 परीक्षा-वार टेस्ट सीरीज फोल्डर (Exam-Wise Nested Folders)</div>
        <span style="font-size:0.8rem;color:var(--text-secondary);">सभी टेस्ट संबंधित परीक्षा फोल्डर के अंदर व्यवस्थित हैं</span>
      </div>

      <div class="cards-grid">
        ${foldersHtml}
      </div>
    `;
  }

  // Render Current Affairs & Student Instant Quiz Tab
  function renderCurrentAffairsTabHTML() {
    const activeStories = getActive24hStories();
    const cardsHtml = activeStories.map((st, idx) => `
      <div class="folder-card">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span class="badge badge-free">${st.icon || '📰'} ${escapeHtml(st.category)}</span>
            <span style="font-size:0.75rem;color:var(--brand-gold);font-weight:700;">⏳ ${formatRemaining24h(st.postedAt)}</span>
          </div>
          <h3 style="font-size:1.04rem;font-weight:800;margin-bottom:6px;">${escapeHtml(st.titleHi)}</h3>
          <p style="font-size:0.88rem;color:var(--text-primary);margin-bottom:10px;">${escapeHtml(st.bodyHi)}</p>
          <hr style="border:none;border-top:1px dashed var(--border-color);margin:8px 0;" />
          <h4 style="font-size:0.94rem;font-weight:700;color:var(--text-secondary);margin-bottom:4px;">${escapeHtml(st.titleEn)}</h4>
          <p style="font-size:0.83rem;color:var(--text-secondary);">${escapeHtml(st.bodyEn)}</p>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.76rem;color:var(--text-muted);margin-top:8px;">
          <span>Source: ${escapeHtml(st.source)}</span>
          <button class="btn btn-outline btn-sm open-story-btn" data-story-index="${idx}">▶ Open Story View</button>
        </div>
      </div>
    `).join('');

    return `
      ${renderStoriesStripHTML()}
      <div class="section-header">
        <div>
          <div class="section-title">📰 दैनिक द्विभाषी समसामयिकी (24-Hour Live Bulletin)</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);">
            प्रत्येक 60 मिनट में बैकग्राउंड ऑटो-अपडेट • 24 घंटे पूर्ण होने पर स्वतः आर्काइव
          </div>
        </div>
        <button class="btn btn-primary" id="caTabQuizBtn">🎯 Attempt Current Affairs Quiz</button>
      </div>
      <div class="cards-grid">${cardsHtml}</div>
    `;
  }

  // Render Notifications & Upcoming Test Series Tab
  function renderNotificationsTabHTML() {
    const sorted = [...(state.notifications || [])].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt);

    const notifHtml = sorted.map(n => `
      <div class="folder-card ${n.pinned ? 'pinned-notice' : ''}" style="margin-bottom:12px;">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span class="badge ${n.pinned ? 'badge-paid' : 'badge-free'}">${n.pinned ? '📌 PINNED BROADCAST' : '📢 OFFICIAL UPDATE'}</span>
            <span style="font-size:0.75rem;color:var(--text-muted);">${new Date(n.createdAt).toLocaleString()}</span>
          </div>
          <h4 style="font-size:1.04rem;font-weight:800;margin-bottom:4px;">${escapeHtml(n.titleHi)}</h4>
          <div style="font-size:0.86rem;font-weight:700;color:var(--text-secondary);margin-bottom:8px;">${escapeHtml(n.titleEn)}</div>
          <p style="font-size:0.88rem;margin-bottom:6px;">${escapeHtml(n.messageHi)}</p>
          <p style="font-size:0.82rem;color:var(--text-secondary);">${escapeHtml(n.messageEn)}</p>
        </div>
        ${n.mediaType && n.mediaType !== 'none' ? `
          <div style="background:var(--bg-elevated);padding:10px 12px;border-radius:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <span style="font-size:0.8rem;font-weight:700;">📎 Attachment (${escapeHtml(n.mediaType.toUpperCase())}): ${escapeHtml(n.mediaLabel || 'Media File')}</span>
            ${n.mediaUrl === '#schedule-31-tests'
              ? `<button class="btn btn-primary btn-sm" id="notifOpenScheduleBtn">📄 View 31-Test Schedule PDF</button>`
              : n.mediaUrl === 'synthesized-anthem'
                ? `<button class="btn btn-gold btn-sm" id="notifPlayAudioBtn">▶ Play Audio Brief</button>`
                : `<a href="${escapeHtml(n.mediaUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">⬇ Open / Download Attachment</a>`
            }
          </div>
        ` : ''}
      </div>
    `).join('');

    const upcomingHtml = (state.upcomingSeries || []).map(up => `
      <div class="folder-card">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span class="badge badge-paid">${escapeHtml(up.statusBadge)}</span>
            <strong style="color:var(--brand-blue);">${escapeHtml(up.price)}</strong>
          </div>
          <h4 style="font-size:1rem;font-weight:800;margin-bottom:4px;">${escapeHtml(up.titleHi)}</h4>
          <div style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:8px;">${escapeHtml(up.titleEn)}</div>
          <div class="folder-meta">
            <span>📅 ${escapeHtml(up.startDate)}</span>
            <span>⏳ Validity: ${escapeHtml(up.validity)}</span>
          </div>
        </div>
        <a href="https://wa.me/919238810070?text=Hello%20Admin%2C%20notify%20me%20about%20${encodeURIComponent(up.titleEn)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">🔔 Pre-Book / Enquire on WhatsApp</a>
      </div>
    `).join('');

    return `
      <div class="section-header">
        <div class="section-title">📌 एडमिन ब्रॉडकास्ट नोटिफिकेशन हब (Pinned &amp; Rich Media Feed)</div>
      </div>
      <div>${notifHtml}</div>

      <div class="section-header" style="margin-top:28px;">
        <div class="section-title">🚀 आगामी टेस्ट सीरीज (Upcoming Scheduled Test Series)</div>
      </div>
      <div class="cards-grid">${upcomingHtml}</div>
    `;
  }

  // Render Private Student Query & Live Support Policy Tab
  function renderSupportTabHTML() {
    // Strict Privacy Rule: Regular students see ONLY their own submitted queries; Admin sees all
    const visibleQueries = state.currentUser.isAdmin
      ? state.queries
      : state.queries.filter(q =>
          q.studentId.toLowerCase() === state.currentUser.id.toLowerCase() ||
          q.studentEmail.toLowerCase() === state.currentUser.email.toLowerCase()
        );

    const myQueriesHtml = visibleQueries.map(q => `
      <div class="folder-card" style="margin-bottom:12px;">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span class="badge badge-paid">🔒 Private Ticket • ${escapeHtml(q.category)}</span>
            <span style="font-size:0.75rem;color:var(--text-muted);">Student: ${escapeHtml(q.studentId)} (${escapeHtml(q.studentEmail)})</span>
          </div>
          <p style="font-weight:700;font-size:0.92rem;margin-bottom:8px;">Q: ${escapeHtml(q.message)}</p>
          ${q.adminReply
            ? `<div style="background:rgba(5,150,105,0.1);border-left:4px solid #059669;padding:10px;border-radius:8px;font-size:0.86rem;">
                <strong>✅ Admin Response:</strong> ${escapeHtml(q.adminReply)}
               </div>`
            : `<div style="font-size:0.8rem;color:var(--text-muted);">⏳ Status: Sent privately to Admin (${ADMIN_EMAIL}). Visible only to you and Admin.</div>`
          }
        </div>
      </div>
    `).join('');

    return `
      <div class="hero-grid">
        <div class="folder-card">
          <div>
            <span class="badge badge-free" style="margin-bottom:8px;">LIVE UPDATED POLICY</span>
            <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:4px;">${escapeHtml(state.supportPolicy.titleHi)}</h3>
            <div style="font-size:0.84rem;color:var(--text-secondary);margin-bottom:12px;">${escapeHtml(state.supportPolicy.titleEn)}</div>
            <pre style="white-space:pre-wrap;font-family:inherit;font-size:0.88rem;background:var(--bg-elevated);padding:14px;border-radius:10px;margin-bottom:10px;">${escapeHtml(state.supportPolicy.contentHi)}</pre>
            <pre style="white-space:pre-wrap;font-family:inherit;font-size:0.83rem;color:var(--text-secondary);background:var(--bg-elevated);padding:14px;border-radius:10px;">${escapeHtml(state.supportPolicy.contentEn)}</pre>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);">
            Last Published by Admin: ${new Date(state.supportPolicy.updatedAt).toLocaleString()} • Support WhatsApp: <strong>9238810070</strong>
          </div>
        </div>

        <div class="folder-card">
          <div>
            <span class="badge badge-paid" style="margin-bottom:8px;">🔒 100% PRIVATE STUDENT DESK</span>
            <h3 style="font-size:1.1rem;font-weight:800;margin-bottom:6px;">अपना प्रश्न / पेमेंट समस्या भेजें (Submit Private Query)</h3>
            <p style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:12px;">
              आपकी क्वेरी पूर्णतः गोपनीय रहेगी और केवल एडमिन (<code>${ADMIN_EMAIL}</code>) एवं आपको ही दिखाई देगी।
            </p>
            <label style="font-size:0.8rem;font-weight:700;">विषय श्रेणी (Category)</label>
            <select id="queryCategoryInput" class="select-field">
              <option value="Payment & Package Activation">Payment &amp; Package Activation (₹99)</option>
              <option value="Question Doubt / Bilingual Error">Question Doubt / Answer Key</option>
              <option value="Technical / APK Download Issue">Technical / APK Download Issue</option>
            </select>
            <label style="font-size:0.8rem;font-weight:700;">आपका संदेश (Your Message / Transaction Ref)</label>
            <textarea id="queryMessageInput" rows="4" class="textarea-field" placeholder="अपना डाउट, ट्रांजेक्शन आईडी या समस्या यहाँ लिखें..."></textarea>
          </div>
          <button class="btn btn-primary" id="submitPrivateQueryBtn">🔒 Submit Private Query to Admin</button>
        </div>
      </div>

      <div class="section-header">
        <div class="section-title">🗂️ आपकी निजी क्वेरी हिस्ट्री (Your Private Queries — Visible Only to You &amp; Admin)</div>
      </div>
      <div>
        ${myQueriesHtml || '<div class="folder-card">अभी तक आपके खाते से कोई निजी क्वेरी सबमिट नहीं की गई है।</div>'}
      </div>
    `;
  }

  // Render Comprehensive Admin Panel
  function renderAdminPanelHTML() {
    const { paidUsersCount, freeUsersCount, activeSubscriptionsCount, expiredSubscriptionsCount } = state.analyticsSummary;
    const totalUsers = paidUsersCount + freeUsersCount;
    const paidPct = Math.round((paidUsersCount / totalUsers) * 100);
    const freePct = 100 - paidPct;
    const activePct = Math.round((activeSubscriptionsCount / Math.max(1, paidUsersCount)) * 100);

    const folderOptionsHtml = state.folders.map(f =>
      `<option value="${f.id}">${escapeHtml(f.titleHi)} (${f.isPaid ? 'Paid ₹' + f.priceINR : 'Free'})</option>`
    ).join('');

    const activationsListHtml = Object.values(state.studentActivations).map(act => {
      const isExp = Date.now() > act.expiresAt;
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg-elevated);border-radius:8px;margin-bottom:6px;font-size:0.8rem;flex-wrap:wrap;gap:6px;">
          <span>👤 <strong>${escapeHtml(act.userKey)}</strong> → <code>${escapeHtml(act.folderId)}</code></span>
          <span>Activated: ${new Date(act.activatedAt).toLocaleString()} | Expires: ${new Date(act.expiresAt).toLocaleDateString()}</span>
          <span class="badge ${isExp ? 'badge-live' : 'badge-free'}">${isExp ? 'Expired (Revoked)' : 'Active'}</span>
        </div>
      `;
    }).join('');

    const adminQueriesHtml = state.queries.map(q => `
      <div style="padding:12px;background:var(--bg-elevated);border-radius:10px;margin-bottom:10px;">
        <div style="font-size:0.78rem;font-weight:700;color:var(--brand-blue);">
          From: ${escapeHtml(q.studentId)} (${escapeHtml(q.studentEmail)}) • ${escapeHtml(q.category)}
        </div>
        <div style="font-weight:700;margin:4px 0 8px;">${escapeHtml(q.message)}</div>
        <div style="display:flex;gap:8px;">
          <input type="text" class="input-field admin-reply-input" data-query-id="${q.id}" value="${escapeHtml(q.adminReply || '')}" placeholder="Write private reply to student..." style="margin:0;" />
          <button class="btn btn-emerald btn-sm save-query-reply-btn" data-query-id="${q.id}">Reply</button>
        </div>
      </div>
    `).join('');

    const existingFoldersManageHtml = state.folders.map(folder => `
      <div style="padding:12px;background:var(--bg-elevated);border-radius:10px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <strong>📁 ${escapeHtml(folder.titleHi)}</strong>
            <div style="font-size:0.78rem;color:var(--text-secondary);">Price: ₹${folder.priceINR} • Validity: ${folder.validityDays} Days • ${(folder.tests || []).length} Tests</div>
          </div>
          <button class="btn btn-outline btn-sm toggle-folder-paid-btn" data-folder-id="${folder.id}">
            ${folder.isPaid ? 'Switch Folder to Free' : 'Switch Folder to Paid (₹99)'}
          </button>
        </div>
      </div>
    `).join('');

    return `
      <div class="cbt-top-bar" style="margin-bottom:20px;">
        <div>
          <div style="font-size:0.75rem;color:#FBBF24;font-weight:800;">⚙️ MASTER ADMIN CONTROL CENTER • CGPSC &amp; CGSSB</div>
          <h2 style="font-size:1.2rem;font-weight:800;">CGpedia Admin Dashboard (${ADMIN_EMAIL})</h2>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-gold btn-sm" id="adminManualCASyncBtn">🔄 Trigger Live Current Affairs Sync</button>
        </div>
      </div>

      <!-- Visual Analytics Charts -->
      <div class="admin-stats-grid">
        <div class="stat-card">
          <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:700;">Paid Users (₹99 Series)</div>
          <div class="stat-value" style="color:#D97706;">${paidUsersCount}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${paidPct}% of total registered</div>
        </div>
        <div class="stat-card">
          <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:700;">Free Users</div>
          <div class="stat-value">${freeUsersCount}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${freePct}% of total registered</div>
        </div>
        <div class="stat-card">
          <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:700;">Active Subscriptions</div>
          <div class="stat-value" style="color:#059669;">${activeSubscriptionsCount}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">Countdown active</div>
        </div>
        <div class="stat-card">
          <div style="font-size:0.78rem;color:var(--text-secondary);font-weight:700;">Expired Accounts</div>
          <div class="stat-value" style="color:#DC2626;">${expiredSubscriptionsCount}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">Auto-revoked on expiry</div>
        </div>
      </div>

      <div class="folder-card" style="margin-bottom:20px;">
        <h3 style="font-size:1.05rem;font-weight:800;">📊 Visual Subscription &amp; User Comparison Chart</h3>
        <div class="bar-chart-row">
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:700;">
            <span>Paid Users vs Free Users</span>
            <span>${paidUsersCount} Paid (${paidPct}%) / ${freeUsersCount} Free (${freePct}%)</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${paidPct}%;background:linear-gradient(90deg,#F59E0B,#D97706);"></div>
          </div>
        </div>
        <div class="bar-chart-row">
          <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:700;">
            <span>Active Subscriptions vs Expired Accounts</span>
            <span>${activeSubscriptionsCount} Active (${activePct}%) / ${expiredSubscriptionsCount} Expired</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${activePct}%;background:linear-gradient(90deg,#059669,#10B981);"></div>
          </div>
        </div>
      </div>

      <div class="hero-grid">
        <!-- 1. Manual Student Activation (Activation-Based Validity Rule) -->
        <div class="folder-card">
          <div>
            <span class="badge badge-paid" style="margin-bottom:6px;">ACTIVATION-BASED VALIDITY ENGINE</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:6px;">🔓 Unlock Paid Test Series for Student</h3>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:10px;">
              छात्र की वैधता (Validity Countdown) आपके द्वारा यहाँ Activate बटन दबाने के सटीक समय से शुरू होगी।
            </p>
            <label style="font-size:0.78rem;font-weight:700;">Select Paid Folder</label>
            <select id="adminActivateFolderSelect" class="select-field">${folderOptionsHtml}</select>
            <label style="font-size:0.78rem;font-weight:700;">Student User ID or Email ID</label>
            <input type="text" id="adminActivateUserInput" class="input-field" placeholder="e.g. STU-2026-108 or aspirant.cgpsc@gmail.com" value="${escapeHtml(state.currentUser.id)}" />
            <label style="font-size:0.78rem;font-weight:700;">Validity Duration (in Days from Activation Time)</label>
            <input type="number" id="adminActivateDaysInput" class="input-field" value="180" />
            <button class="btn btn-emerald" id="adminGrantAccessBtn" style="width:100%;">✅ Activate Student Access Now</button>
          </div>
          <div style="margin-top:12px;">
            <div style="font-size:0.78rem;font-weight:800;margin-bottom:6px;">Recent Student Activations:</div>
            ${activationsListHtml}
          </div>
        </div>

        <!-- 2. Support & Help Policy Live Editor -->
        <div class="folder-card">
          <div>
            <span class="badge badge-free" style="margin-bottom:6px;">INSTANT LIVE POLICY SYNC</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:6px;">📜 Update Support &amp; Help Policy</h3>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:10px;">
              यहाँ नीति में बदलाव कर Save &amp; Publish पर क्लिक करते ही छात्रों के लिए लाइव नीति तुरंत अपडेट हो जाएगी।
            </p>
            <label style="font-size:0.78rem;font-weight:700;">Policy Content (हिंदी)</label>
            <textarea id="adminPolicyHiInput" rows="4" class="textarea-field">${escapeHtml(state.supportPolicy.contentHi)}</textarea>
            <label style="font-size:0.78rem;font-weight:700;">Policy Content (English)</label>
            <textarea id="adminPolicyEnInput" rows="4" class="textarea-field">${escapeHtml(state.supportPolicy.contentEn)}</textarea>
          </div>
          <button class="btn btn-primary" id="adminSavePolicyBtn">💾 Save &amp; Publish Live Policy</button>
        </div>
      </div>

      <!-- 3. Exam-Wise Folder & Manual/AI Test Generator -->
      <div class="hero-grid" style="margin-top:18px;">
        <div class="folder-card">
          <div>
            <span class="badge badge-paid" style="margin-bottom:6px;">EXAM-WISE FOLDER CREATOR</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:6px;">📁 Create / Manage Exam Folders</h3>
            <label style="font-size:0.78rem;font-weight:700;">Folder Name (हिंदी)</label>
            <input type="text" id="newFolderTitleHi" class="input-field" placeholder="उदा. सीजीपीएससी मुख्य परीक्षा 2026 फोल्डर" />
            <label style="font-size:0.78rem;font-weight:700;">Folder Name (English)</label>
            <input type="text" id="newFolderTitleEn" class="input-field" placeholder="e.g. CGPSC Mains 2026 Test Series" />
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Access Type</label>
                <select id="newFolderPaidSelect" class="select-field">
                  <option value="true">Paid</option>
                  <option value="false">Free</option>
                </select>
              </div>
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Price (₹)</label>
                <input type="number" id="newFolderPriceInput" class="input-field" value="99" />
              </div>
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Validity (Days)</label>
                <input type="number" id="newFolderValidityInput" class="input-field" value="180" />
              </div>
            </div>
            <button class="btn btn-primary btn-sm" id="createFolderBtn" style="width:100%;margin-bottom:12px;">➕ Create Exam Folder</button>
            <div style="font-size:0.8rem;font-weight:800;margin-bottom:6px;">Existing Folders (Toggle Paid/Free Anytime):</div>
            ${existingFoldersManageHtml}
          </div>
        </div>

        <div class="folder-card">
          <div>
            <span class="badge badge-free" style="margin-bottom:6px;">MANUAL + AI TEST GENERATOR (5-MIN TIMEOUT SAFE)</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:6px;">📝 Add New Test Inside Exam Folder</h3>
            <label style="font-size:0.78rem;font-weight:700;">Target Exam Folder</label>
            <select id="newTestFolderSelect" class="select-field">${folderOptionsHtml}</select>
            <label style="font-size:0.78rem;font-weight:700;">Test Title (हिंदी / Bilingual)</label>
            <input type="text" id="newTestTitleInput" class="input-field" placeholder="उदा. टेस्ट 04: छत्तीसगढ़ जनजातीय विद्रोह एवं संस्कृति" />
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
              <div>
                <label style="font-size:0.72rem;font-weight:700;">Timer (Min)</label>
                <input type="number" id="newTestDurationInput" class="input-field" value="60" />
              </div>
              <div>
                <label style="font-size:0.72rem;font-weight:700;">Marks (+)</label>
                <input type="number" step="0.5" id="newTestMarksInput" class="input-field" value="2.0" />
              </div>
              <div>
                <label style="font-size:0.72rem;font-weight:700;">Neg (-)</label>
                <input type="number" step="0.01" id="newTestNegInput" class="input-field" value="0.66" />
              </div>
              <div>
                <label style="font-size:0.72rem;font-weight:700;">Access</label>
                <select id="newTestPaidSelect" class="select-field">
                  <option value="true">Paid</option>
                  <option value="false">Free</option>
                </select>
              </div>
            </div>

            <label style="font-size:0.78rem;font-weight:700;">Admin Custom AI Prompt (Hidden from Students • 300,000 ms Timeout)</label>
            <textarea id="adminAiPromptInput" rows="2" class="textarea-field" placeholder="e.g. Generate high-level CGPSC Prelims bilingual questions on Chhattisgarh Economic Survey & Panchayati Raj..."></textarea>

            <div id="aiProgressBox" style="display:none;background:var(--bg-elevated);padding:12px;border-radius:10px;margin-bottom:10px;">
              <div style="font-size:0.82rem;font-weight:800;color:var(--brand-blue);margin-bottom:6px;">
                ⏳ Generating questions, please wait... (Timeout limit: 300,000 ms / 5 mins)
              </div>
              <div class="bar-track">
                <div class="bar-fill" id="aiProgressBarFill" style="width:15%;background:linear-gradient(90deg,#2563EB,#F59E0B);transition:width 0.3s ease;"></div>
              </div>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-gold btn-sm" id="adminGenerateAiTestBtn" style="flex:1;">🤖 Generate via AI Prompt &amp; Save</button>
              <button class="btn btn-primary btn-sm" id="adminCreateManualTestBtn" style="flex:1;">✍️ Create Manual Test</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Broadcast Notification Hub (Rich Media + Pin) & Student Queries -->
      <div class="hero-grid" style="margin-top:18px;">
        <div class="folder-card">
          <div>
            <span class="badge badge-live" style="margin-bottom:6px;">RICH MEDIA &amp; PINNED BROADCAST</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:6px;">📢 Send Broadcast Notification to All Students</h3>
            <label style="font-size:0.78rem;font-weight:700;">Title (हिंदी / English)</label>
            <input type="text" id="notifTitleInput" class="input-field" placeholder="महत्वपूर्ण सूचना: नया टेस्ट अपलोड किया गया" />
            <label style="font-size:0.78rem;font-weight:700;">Message Body</label>
            <textarea id="notifBodyInput" rows="2" class="textarea-field" placeholder="सभी छात्र आज शाम 7 बजे लाइव टेस्ट में शामिल हों..."></textarea>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Rich Media Type</label>
                <select id="notifMediaTypeInput" class="select-field">
                  <option value="none">Text Only</option>
                  <option value="pdf">PDF / Document</option>
                  <option value="image">Image Banner</option>
                  <option value="audio">Audio Voice Note</option>
                  <option value="video">Video Lecture Link</option>
                </select>
              </div>
              <div>
                <label style="font-size:0.75rem;font-weight:700;">Pin at Top?</label>
                <select id="notifPinSelect" class="select-field">
                  <option value="true">📌 Yes, Pin to Top</option>
                  <option value="false">Normal Feed</option>
                </select>
              </div>
            </div>
            <label style="font-size:0.75rem;font-weight:700;">Attachment File Name / URL</label>
            <input type="text" id="notifMediaLabelInput" class="input-field" placeholder="e.g. CGPSC_Syllabus_Notes.pdf" />
            <button class="btn btn-primary" id="adminSendBroadcastBtn" style="width:100%;">🚀 Publish Broadcast Notification</button>
          </div>
        </div>

        <div class="folder-card">
          <div>
            <span class="badge badge-paid" style="margin-bottom:6px;">PRIVATE STUDENT SUPPORT INBOX</span>
            <h3 style="font-size:1.05rem;font-weight:800;margin-bottom:8px;">💬 Student Queries (Strictly Private)</h3>
            ${adminQueriesHtml}
          </div>
        </div>
      </div>
    `;
  }

  // Master Render Function
  function renderApp() {
    document.documentElement.setAttribute('data-theme', state.theme || 'light');

    const userBadge = document.getElementById('activeUserBadge');
    if (userBadge) {
      userBadge.textContent = state.currentUser.isAdmin ? 'Admin (Owner)' : state.currentUser.id;
    }

    const notifBadge = document.getElementById('notifCountBadge');
    if (notifBadge) {
      notifBadge.textContent = String((state.notifications || []).length);
    }

    // Highlight active tab
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === state.activeTab && !activeExamSession);
    });

    const root = document.getElementById('appRoot');
    if (!root) return;

    if (activeExamSession) {
      root.innerHTML = renderActiveCBTView();
      bindCBTEvents();
      return;
    }

    if (state.activeTab === 'dashboard') {
      root.innerHTML = renderDashboardHTML();
    } else if (state.activeTab === 'current-affairs') {
      root.innerHTML = renderCurrentAffairsTabHTML();
    } else if (state.activeTab === 'notifications') {
      root.innerHTML = renderNotificationsTabHTML();
    } else if (state.activeTab === 'support') {
      root.innerHTML = renderSupportTabHTML();
    } else if (state.activeTab === 'admin') {
      root.innerHTML = renderAdminPanelHTML();
    }

    bindViewEvents();
  }

  // Event Bindings for CBT Exam Room
  function bindCBTEvents() {
    const exitBtn = document.getElementById('exitCBTBtn');
    if (exitBtn) {
      exitBtn.onclick = () => {
        if (activeExamSession && activeExamSession.timerInterval) {
          clearInterval(activeExamSession.timerInterval);
        }
        activeExamSession = null;
        renderApp();
      };
    }

    if (!activeExamSession || activeExamSession.submitted) return;

    document.querySelectorAll('.option-item').forEach(btn => {
      btn.onclick = () => {
        const optIdx = Number(btn.dataset.optIndex);
        activeExamSession.answers[activeExamSession.currentQIndex] = optIdx;
        renderApp();
      };
    });

    const prevBtn = document.getElementById('prevQBtn');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (activeExamSession.currentQIndex > 0) {
          activeExamSession.currentQIndex -= 1;
          activeExamSession.visited[activeExamSession.currentQIndex] = true;
          renderApp();
        }
      };
    }

    const nextBtn = document.getElementById('nextQBtn');
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (activeExamSession.currentQIndex < activeExamSession.test.questions.length - 1) {
          activeExamSession.currentQIndex += 1;
          activeExamSession.visited[activeExamSession.currentQIndex] = true;
          renderApp();
        }
      };
    }

    const clearBtn = document.getElementById('clearOptionBtn');
    if (clearBtn) {
      clearBtn.onclick = () => {
        delete activeExamSession.answers[activeExamSession.currentQIndex];
        renderApp();
      };
    }

    const reviewBtn = document.getElementById('markReviewBtn');
    if (reviewBtn) {
      reviewBtn.onclick = () => {
        const qIdx = activeExamSession.currentQIndex;
        activeExamSession.markedReview[qIdx] = !activeExamSession.markedReview[qIdx];
        renderApp();
      };
    }

    document.querySelectorAll('.palette-btn').forEach(btn => {
      btn.onclick = () => {
        const jumpIdx = Number(btn.dataset.jumpIndex);
        activeExamSession.currentQIndex = jumpIdx;
        activeExamSession.visited[jumpIdx] = true;
        renderApp();
      };
    });

    const safeSubmitBtn = document.getElementById('safeSubmitTriggerBtn');
    if (safeSubmitBtn) {
      safeSubmitBtn.onclick = openSafeSubmitModal;
    }
  }

  // Event Bindings for Dashboard, Stories, Support, and Admin Views
  function bindViewEvents() {
    // Story bubbles
    document.querySelectorAll('.story-bubble, .open-story-btn').forEach(el => {
      el.onclick = () => {
        const idx = Number(el.dataset.storyIndex || 0);
        openStoryViewer(idx);
      };
    });

    // Instant CA Quiz buttons
    const caQuizBtn = document.getElementById('launchInstantCAQuizBtn');
    if (caQuizBtn) caQuizBtn.onclick = startInstantCurrentAffairsQuiz;
    const caTabQuizBtn = document.getElementById('caTabQuizBtn');
    if (caTabQuizBtn) caTabQuizBtn.onclick = startInstantCurrentAffairsQuiz;

    // Folder navigation
    document.querySelectorAll('.open-folder-btn').forEach(btn => {
      btn.onclick = () => {
        state.selectedFolderId = btn.dataset.folderId;
        renderApp();
      };
    });

    const heroOpenFlagship = document.getElementById('heroOpenFlagshipFolderBtn');
    if (heroOpenFlagship) {
      heroOpenFlagship.onclick = () => {
        state.selectedFolderId = 'folder-cgpsc-pre-2026';
        renderApp();
      };
    }

    const backFoldersBtn = document.getElementById('backToFoldersBtn');
    if (backFoldersBtn) {
      backFoldersBtn.onclick = () => {
        state.selectedFolderId = null;
        renderApp();
      };
    }

    // 31-Test Schedule triggers
    ['open31ScheduleHeroBtn', 'heroScheduleModalBtn', 'view31ScheduleInsideBtn', 'notifOpenScheduleBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.onclick = open31ScheduleModal;
    });

    const notifAudioBtn = document.getElementById('notifPlayAudioBtn');
    if (notifAudioBtn) notifAudioBtn.onclick = toggleAnthem;

    // Launch individual test inside folder
    document.querySelectorAll('.start-test-btn').forEach(btn => {
      btn.onclick = () => {
        const folder = state.folders.find(f => f.id === btn.dataset.folderId);
        if (!folder) return;
        const test = (folder.tests || []).find(t => t.id === btn.dataset.testId);
        if (test) launchCBTExam(test, folder);
      };
    });

    // Submit Private Student Query
    const submitQueryBtn = document.getElementById('submitPrivateQueryBtn');
    if (submitQueryBtn) {
      submitQueryBtn.onclick = () => {
        const cat = document.getElementById('queryCategoryInput').value;
        const msg = document.getElementById('queryMessageInput').value.trim();
        if (!msg) {
          showToast('कृपया अपना प्रश्न या संदेश लिखें।');
          return;
        }
        state.queries.unshift({
          id: 'q-' + Date.now(),
          studentId: state.currentUser.id,
          studentEmail: state.currentUser.email,
          category: cat,
          message: msg,
          adminReply: '',
          createdAt: Date.now()
        });
        saveState();
        renderApp();
        showToast('🔒 आपकी निजी क्वेरी सफलतापूर्वक एडमिन को भेज दी गई है।');
      };
    }

    // Admin Controls
    const manualCASyncBtn = document.getElementById('adminManualCASyncBtn');
    if (manualCASyncBtn) {
      manualCASyncBtn.onclick = () => performBackgroundCurrentAffairsSync(true);
    }

    const savePolicyBtn = document.getElementById('adminSavePolicyBtn');
    if (savePolicyBtn) {
      savePolicyBtn.onclick = () => {
        const hi = document.getElementById('adminPolicyHiInput').value.trim();
        const en = document.getElementById('adminPolicyEnInput').value.trim();
        state.supportPolicy.contentHi = hi;
        state.supportPolicy.contentEn = en;
        state.supportPolicy.updatedAt = Date.now();
        saveState();
        renderApp();
        showToast('✅ Support & Help Policy Updated Live for All Users!');
      };
    }

    const grantAccessBtn = document.getElementById('adminGrantAccessBtn');
    if (grantAccessBtn) {
      grantAccessBtn.onclick = () => {
        const folderId = document.getElementById('adminActivateFolderSelect').value;
        const userKey = document.getElementById('adminActivateUserInput').value.trim().toLowerCase();
        const days = Math.max(1, Number(document.getElementById('adminActivateDaysInput').value || 180));
        if (!userKey) {
          showToast('कृपया Student ID या Email दर्ज करें।');
          return;
        }
        const actTime = Date.now();
        const expTime = actTime + days * 86400000;
        state.studentActivations[`${folderId}__${userKey}`] = {
          folderId,
          userKey,
          activatedAt: actTime,
          validityDays: days,
          expiresAt: expTime
        };
        state.analyticsSummary.paidUsersCount += 1;
        state.analyticsSummary.activeSubscriptionsCount += 1;
        saveState();
        renderApp();
        showToast(`🔓 Activated ${days}-Day Access for ${userKey} starting NOW!`);
      };
    }

    const createFolderBtn = document.getElementById('createFolderBtn');
    if (createFolderBtn) {
      createFolderBtn.onclick = () => {
        const titleHi = document.getElementById('newFolderTitleHi').value.trim();
        const titleEn = document.getElementById('newFolderTitleEn').value.trim() || titleHi;
        const isPaid = document.getElementById('newFolderPaidSelect').value === 'true';
        const priceINR = Number(document.getElementById('newFolderPriceInput').value || 99);
        const validityDays = Number(document.getElementById('newFolderValidityInput').value || 180);
        if (!titleHi) {
          showToast('कृपया परीक्षा फोल्डर का नाम दर्ज करें।');
          return;
        }
        state.folders.push({
          id: 'folder-' + Date.now(),
          titleHi,
          titleEn,
          examTag: 'CGPSC & CGSSB',
          isPaid,
          priceINR: isPaid ? priceINR : 0,
          validityDays,
          descriptionHi: `${titleHi} • एक्टिवेशन तिथि से ${validityDays} दिन की वैधता।`,
          descriptionEn: `${titleEn} • ${validityDays}-Day Validity from student activation.`,
          tests: []
        });
        saveState();
        renderApp();
        showToast(`📁 Exam Folder Created: ${titleHi}`);
      };
    }

    document.querySelectorAll('.toggle-folder-paid-btn').forEach(btn => {
      btn.onclick = () => {
        const folder = state.folders.find(f => f.id === btn.dataset.folderId);
        if (!folder) return;
        folder.isPaid = !folder.isPaid;
        if (folder.isPaid && !folder.priceINR) folder.priceINR = 99;
        saveState();
        renderApp();
        showToast(`🔄 Folder "${folder.titleHi}" switched to ${folder.isPaid ? 'Paid (₹' + folder.priceINR + ')' : 'Free'}`);
      };
    });

    const createManualTestBtn = document.getElementById('adminCreateManualTestBtn');
    if (createManualTestBtn) {
      createManualTestBtn.onclick = () => {
        addAdminCreatedTest(false);
      };
    }

    const generateAiTestBtn = document.getElementById('adminGenerateAiTestBtn');
    if (generateAiTestBtn) {
      generateAiTestBtn.onclick = () => {
        const progBox = document.getElementById('aiProgressBox');
        const progFill = document.getElementById('aiProgressBarFill');
        if (progBox) progBox.style.display = 'block';
        let pct = 20;
        const timer = setInterval(() => {
          pct = Math.min(95, pct + 25);
          if (progFill) progFill.style.width = `${pct}%`;
        }, 300);

        // Configured with 300,000 ms (5-minute) timeout budget
        const timeoutGuard = setTimeout(() => {
          clearInterval(timer);
        }, AI_GENERATION_TIMEOUT_MS);

        setTimeout(() => {
          clearInterval(timer);
          clearTimeout(timeoutGuard);
          if (progFill) progFill.style.width = '100%';
          addAdminCreatedTest(true);
        }, 1200);
      };
    }

    const sendBroadcastBtn = document.getElementById('adminSendBroadcastBtn');
    if (sendBroadcastBtn) {
      sendBroadcastBtn.onclick = () => {
        const title = document.getElementById('notifTitleInput').value.trim();
        const body = document.getElementById('notifBodyInput').value.trim();
        const mediaType = document.getElementById('notifMediaTypeInput').value;
        const pinned = document.getElementById('notifPinSelect').value === 'true';
        const mediaLabel = document.getElementById('notifMediaLabelInput').value.trim() || 'Official_Attachment.pdf';
        if (!title || !body) {
          showToast('कृपया नोटिफिकेशन शीर्षक और संदेश दर्ज करें।');
          return;
        }
        state.notifications.unshift({
          id: 'notif-' + Date.now(),
          titleHi: title,
          titleEn: title,
          messageHi: body,
          messageEn: body,
          pinned,
          mediaType,
          mediaUrl: '/CGpedia.apk',
          mediaLabel,
          createdAt: Date.now()
        });
        saveState();
        renderApp();
        showToast('📢 Broadcast Notification Published to All Students!');
      };
    }

    document.querySelectorAll('.save-query-reply-btn').forEach(btn => {
      btn.onclick = () => {
        const qId = btn.dataset.queryId;
        const input = document.querySelector(`.admin-reply-input[data-query-id="${qId}"]`);
        const qObj = state.queries.find(q => q.id === qId);
        if (qObj && input) {
          qObj.adminReply = input.value.trim();
          saveState();
          renderApp();
          showToast('✅ Private Reply Sent to Student');
        }
      };
    });
  }

  function addAdminCreatedTest(isAiGenerated) {
    const folderId = document.getElementById('newTestFolderSelect').value;
    const folder = state.folders.find(f => f.id === folderId);
    if (!folder) return;
    const rawTitle = document.getElementById('newTestTitleInput').value.trim() ||
      (isAiGenerated ? 'विशेष अभ्यास प्रश्नपत्र (CGPSC & CGSSB)' : 'नया मैनुअल टेस्ट पेपर');
    const durationMinutes = Number(document.getElementById('newTestDurationInput').value || 60);
    const marksPerQuestion = Number(document.getElementById('newTestMarksInput').value || 2.0);
    const negativeMarking = Number(document.getElementById('newTestNegInput').value || 0.66);
    const isPaid = document.getElementById('newTestPaidSelect').value === 'true';
    const customPrompt = document.getElementById('adminAiPromptInput').value.trim();

    const newTest = {
      id: 'test-' + Date.now(),
      titleHi: rawTitle,
      titleEn: rawTitle,
      scheduledDate: new Date().toLocaleDateString(),
      durationMinutes,
      marksPerQuestion,
      negativeMarking,
      isPaid,
      questions: [
        {
          id: 'gen-q1-' + Date.now(),
          qHi: isAiGenerated && customPrompt
            ? `[${customPrompt.slice(0, 45)}...] छत्तीसगढ़ में पंचायती राज व्यवस्था के अंतर्गत ग्राम पंचायत के कार्यों का सामाजिक अंकेक्षण (Social Audit) किसके द्वारा किया जाता है?`
            : 'छत्तीसगढ़ राज्य का राजकीय पशु "वन भैंसा" (Wild Buffalo) मुख्य रूप से किस अभयारण्य में संरक्षित है?',
          qEn: isAiGenerated && customPrompt
            ? 'Under the Panchayati Raj system in Chhattisgarh, which body conducts the Social Audit of Gram Panchayat works?'
            : 'In which wildlife sanctuary is Chhattisgarh\'s state animal "Wild Buffalo" (Bubalus arnee) primarily conserved?',
          optionsHi: isAiGenerated && customPrompt
            ? ['ग्राम सभा', 'जिला पंचायत', 'राज्य निर्वाचन आयोग', 'कलेक्टर कार्यालय']
            : ['उदंती एवं सीतानदी अभयारण्य', 'बादलखोल अभयारण्य', 'गोमर्डा अभयारण्य', 'तमोर पिंगला अभयारण्य'],
          optionsEn: isAiGenerated && customPrompt
            ? ['Gram Sabha', 'Zila Panchayat', 'State Election Commission', 'Collectorate']
            : ['Udanti & Sitanadi Sanctuary', 'Badalkhol Sanctuary', 'Gomarda Sanctuary', 'Tamor Pingla Sanctuary'],
          correctIndex: 0,
          expHi: 'द्विभाषी व्याख्या: प्रथम विकल्प पूर्णतः सही है एवं नवीनतम CGPSC/CGSSB पाठ्यक्रम पर आधारित है।',
          expEn: 'Bilingual Explanation: Option A is accurate as per official Chhattisgarh General Studies reference.'
        },
        {
          id: 'gen-q2-' + Date.now(),
          qHi: 'छत्तीसगढ़ में "चित्रकोट जलप्रपात" किस नदी पर स्थित है, जिसे भारत का नियाग्रा कहा जाता है?',
          qEn: 'On which river is the "Chitrakote Waterfall" (known as the Niagara of India) situated in Chhattisgarh?',
          optionsHi: ['इंद्रावती नदी (बस्तर)', 'सबरी नदी (सुकमा)', 'हसदेव नदी (कोरबा)', 'अरपा नदी (बिलासपुर)'],
          optionsEn: ['Indravati River (Bastar)', 'Sabari River (Sukma)', 'Hasdeo River (Korba)', 'Arpa River (Bilaspur)'],
          correctIndex: 0,
          expHi: 'चित्रकोट जलप्रपात बस्तर जिले में इंद्रावती नदी पर स्थित भारत का सबसे चौड़ा जलप्रपात है।',
          expEn: 'Chitrakote Waterfall is located on the Indravati River in Bastar district and is India\'s widest waterfall.'
        }
      ]
    };

    folder.tests.unshift(newTest);
    saveState();
    renderApp();
    showToast(`✅ Test Added Inside "${folder.titleHi}"`);
  }

  // Anti-Piracy Listeners (Context Menu, Copy/Cut, PrintScreen/Shortcuts)
  function initAntiPiracyGuards() {
    document.addEventListener('contextmenu', (e) => {
      if (activeExamSession) {
        e.preventDefault();
        showToast('🛡️ Anti-Piracy Protection: Right-click is disabled during live tests.');
      }
    });

    ['copy', 'cut', 'dragstart'].forEach(evtName => {
      document.addEventListener(evtName, (e) => {
        if (activeExamSession) {
          e.preventDefault();
          showToast('🛡️ Copying test content is strictly prohibited.');
        }
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && ['p', 's', 'u', 'c'].includes(e.key.toLowerCase()) && activeExamSession)) {
        e.preventDefault();
        showToast('🛡️ Anti-Piracy Alert: Screenshot & Screen Recording are restricted.');
      }
    });
  }

  // Global Header & Tab Listeners
  function initHeaderEvents() {
    document.querySelectorAll('.nav-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        if (activeExamSession && !activeExamSession.submitted) {
          showToast('कृपया पहले चल रहे टेस्ट को Safe Submit करें या Exit दबाएं।');
          return;
        }
        activeExamSession = null;
        state.activeTab = btn.dataset.tab;
        saveState();
        renderApp();
      });
    });

    const homeBrand = document.getElementById('brandHomeTrigger');
    if (homeBrand) {
      homeBrand.onclick = () => {
        if (activeExamSession && !activeExamSession.submitted) return;
        activeExamSession = null;
        state.activeTab = 'dashboard';
        state.selectedFolderId = null;
        saveState();
        renderApp();
      };
    }

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.onclick = () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        saveState();
        renderApp();
      };
    }

    const loginBtn = document.getElementById('studentLoginBtn');
    if (loginBtn) loginBtn.onclick = openUserSwitchModal;

    const anthemBtn = document.getElementById('anthemBtn');
    if (anthemBtn) anthemBtn.onclick = toggleAnthem;
  }

  // Initialize Application
  initHeaderEvents();
  initAntiPiracyGuards();
  renderApp();
})();
