# प्रश्न बैंक (Question Bank) — 30-Minute Scan Failure & Answer Key Upload Fix Plan

## 1. समस्या का सटीक कारण (Root Cause Analysis)

1. **स्कैन के बाद भी "कोई प्रश्न नहीं मिला" क्यों आया (`localParsed.rawItems` बनाम `localParsed.rows` बग):**
   - `parseRawImportFile` और `parsePdfOcrAndMatchAnswerKey` सारे निकाले गए प्रश्नों को **`localParsed.rawItems`** में लौटाते हैं।
   - लेकिन `scanAndCategorizeWithAiOrFallback` (लाइन 6693 और 7152) में गलती से `localParsed.rows` चेक किया जा रहा था (जो हमेशा `undefined` था)। इस वजह से पूरे स्कैन के बाद भी निकाले गए सारे प्रश्न छोड़ दिए जा रहे थे और अंत में **"फ़ाइल में कोई प्रश्न नहीं मिला"** दिख रहा था।
   - साथ ही `rawItems` में विकल्प `optionsHi: [A, B, C, D]` और `optionsEn: [A, B, C, D]` के रूप में होते हैं, जिन्हें सेव करते समय सही से मैप किया जाएगा।

2. **स्कैन में 30 मिनट क्यों लगे (Slow Per-Page OCR Reload & Double Scanning):**
   - 10 से 30 पेज की PDF में हर पेज पर नया `Tesseract` वर्कर शुरू हो रहा था और जिन पेजों में पहले से टेक्स्ट था उन पर भी धीमा इमेज OCR चल रहा था।
   - इसके अलावा पहले `extractTextFromUploadedFile` में और फिर `scanAndCategorizeWithAiOrFallback` में दो बार OCR लूप चल रहा था।

3. **2nd बॉक्स (उत्तर कुंजी) में "अपलोड हो गया" क्यों नहीं दिखा:**
   - दूसरे बॉक्स के HTML में `<div id="qbSelectedAKFileLabel">` छूट गया था और ब्राउज़र का **Service Worker (`sw.js` v11 / `admin-console.js?v=5.7`)** पुरानी कैश फ़ाइल दिखा रहा था।

---

## 2. प्रस्तावित सुधार (Targeted Fixes — केवल Question Bank के लिए)

### सुधार 1: `rawItems` डेटा मैपिंग और प्रश्न सेव बग ठीक करना
- `scanAndCategorizeWithAiOrFallback` में `localParsed.rawItems || localParsed.rows` दोनों को सपोर्ट किया जाएगा।
- प्रत्येक प्रश्न के विकल्पों (`optionsHi[0..3]` / `optA_Hi..optD_Hi`) और उत्तर कुंजी को सही फ़ॉर्मेट में बदलकर सीधे **Subject -> Topic फ़ोल्डर** में सेव किया जाएगा।

### सुधार 2: हर पेज स्कैन होते ही तुरंत Live Save (10–30 पेज की PDF के लिए तेज़ स्कैनर)
- **Instant Text First:** यदि PDF पेज में पहले से डिजिटल टेक्स्ट (या KrutiDev टेक्स्ट) मौजूद है, तो बिना धीमे इमेज OCR के **1 सेकंड के अंदर** उस पेज के प्रश्न निकाले जाएंगे।
- **Single Reusable OCR Worker:** यदि पेज स्कैन इमेज है, तो पूरे PDF के लिए **एक ही Reusable Tesseract Worker** या **Android AI Vision** का उपयोग होगा जिससे स्पीड 5x–10x तेज़ हो जाएगी।
- **Page-by-Page Live Save:** जैसे ही पेज 1, पेज 2, पेज 3... स्कैन होगा, उस पेज से मिले प्रश्न **तुरंत उसी समय प्रश्न बैंक (Subject > Topic फ़ोल्डर) में जुड़ते और सेव होते जाएंगे** और स्क्रीन पर दिखेगा:
  `📄 पेज 4/20 स्कैन हुआ — अब तक 28 प्रश्न सेव हो चुके हैं...`
  इससे यदि बीच में कोई पेज खाली भी हो या आप प्रक्रिया देखें, तो अब तक स्कैन हुए सारे प्रश्न सुरक्षित सेव रहेंगे।

### सुधार 3: 2nd बॉक्स (उत्तर कुंजी) में तुरंत हरा स्टेटस और Cache Update
- बॉक्स 2 के HTML में `<div id="qbSelectedAKFileLabel">` जोड़ा जाएगा ताकि फ़ाइल चुनते ही तुरंत दिखे:
  `✅ फ़ाइल_का_नाम.pdf (अपलोड हो गया — स्कैन के लिए तैयार)`
- `index.html` और `sw.js` का कैश वर्शन (`?v=6.0` और `cgpedia-platform-v14`) अपडेट किया जाएगा ताकि मोबाइल ऐप और वेब ब्राउज़र दोनों में तुरंत नया कोड लोड हो।

---

## 3. दायरा (Strict Scope)
- **केवल** `प्रश्न बैंक (Question Bank)` के अपलोड और स्कैन सेक्शन में सुधार किया जाएगा। ऐप के किसी अन्य भाग में कोई बदलाव नहीं होगा।
