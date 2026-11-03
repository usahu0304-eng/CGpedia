const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = process.env.GCP_PROJECT || "demo-no-project";
const ALICE_UID = "alice_student_1";
const BOB_UID = "bob_student_2";
const ADMIN_UID = "owner_admin_1";
const ADMIN_EMAIL = "usahu0304@gmail.com";

const [emulatorHost, emulatorPortStr] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085").split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

test("1. Unauthenticated caller cannot read published tests or current affairs", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("tests").where("status", "==", "published").get());
  await assertFails(unauthDb.collection("current_affairs").where("visibility", "==", "published").get());
});

test("2. Student can create own profile as student, but CANNOT self-assign admin role", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID, {
    email: "alice@example.com",
    email_verified: true,
  }).firestore();
  const now = new Date();

  // Attempt privilege escalation on creation -> MUST FAIL
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).set({
      userId: ALICE_UID,
      displayName: "Alice Sahu",
      email: "alice@example.com",
      phoneNumber: "9876543210",
      photoUrl: "",
      targetExam: "CGPSC Prelims",
      preferredLanguage: "en",
      darkMode: false,
      notifyCurrentAffairs: true,
      notifyNewTests: true,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    })
  );

  // Valid student registration -> MUST SUCCEED
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).set({
      userId: ALICE_UID,
      displayName: "Alice Sahu",
      email: "alice@example.com",
      phoneNumber: "9876543210",
      photoUrl: "",
      targetExam: "CGPSC Prelims",
      preferredLanguage: "en",
      darkMode: false,
      notifyCurrentAffairs: true,
      notifyNewTests: true,
      role: "student",
      createdAt: now,
      updatedAt: now,
    })
  );
});

test("3. PII Isolation: Student cannot read another student's profile", async () => {
  const now = new Date();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().collection("users").doc(BOB_UID).set({
      userId: BOB_UID,
      displayName: "Bob Verma",
      email: "bob@example.com",
      phoneNumber: "9998887776",
      photoUrl: "",
      targetExam: "CGSSB / Vyapam",
      preferredLanguage: "en",
      darkMode: false,
      notifyCurrentAffairs: true,
      notifyNewTests: true,
      role: "student",
      createdAt: now,
      updatedAt: now,
    });
  });

  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertFails(aliceDb.collection("users").doc(BOB_UID).get());
});

test("4. Email Spoofing Test: Unverified owner email cannot perform Admin writes", async () => {
  const spoofAdminDb = testEnv.authenticatedContext("spoof_uid", {
    email: ADMIN_EMAIL,
    email_verified: false,
  }).firestore();
  const now = new Date();

  await assertFails(
    spoofAdminDb.collection("exam_folders").doc("cgpsc_prelims").set({
      titleHi: "सीजीपीएससी प्रारंभिक परीक्षा",
      titleEn: "CGPSC Prelims",
      descriptionHi: "प्रारंभिक परीक्षा टेस्ट सीरीज",
      descriptionEn: "State Service Preliminary Test Series",
      examCode: "CGPSC_PRE",
      sortOrder: 1,
      isFreeFolder: false,
      priceInr: 299,
      testCount: 5,
      visibility: "published",
      createdBy: "spoof_uid",
      createdAt: now,
      updatedAt: now,
    })
  );
});

test("5. Verified Owner Admin can create Draft test, publish it, and students only read Published tests", async () => {
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const now = new Date();

  // Admin creates Draft test
  await assertSucceeds(
    adminDb.collection("tests").doc("test_draft_1").set({
      folderType: "exam",
      folderId: "cgpsc_prelims",
      titleHi: "छत्तीसगढ़ सामान्य अध्ययन मॉक 1",
      titleEn: "Chhattisgarh GS Mock 1",
      topic: "Chhattisgarh History & Tribes",
      difficulty: "CGPSC_Level",
      durationMinutes: 60,
      questionLimit: 50,
      questionCount: 10,
      marksPerQuestion: 2,
      negativeMarking: 0.66,
      isPaid: false,
      priceInr: 0,
      status: "draft",
      createdBy: ADMIN_UID,
      createdAt: now,
      updatedAt: now,
    })
  );

  // Student CANNOT get draft test or list without status=='published' filter
  await assertFails(aliceDb.collection("tests").doc("test_draft_1").get());
  await assertFails(aliceDb.collection("tests").get());

  // Admin publishes test
  await assertSucceeds(
    adminDb.collection("tests").doc("test_draft_1").update({
      status: "published",
      updatedAt: new Date(),
    })
  );

  // Student CAN query published tests with aligned filter
  await assertSucceeds(
    aliceDb.collection("tests").where("status", "==", "published").get()
  );
});

test("6. Shadow Update & Terminal State Lock: Student cannot inject ghost fields or mutate submitted attempt", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const now = new Date();

  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("attempts").doc("att_1").set({
      userId: ALICE_UID,
      testId: "test_1",
      testTitleHi: "टेस्ट 1",
      testTitleEn: "Test 1",
      totalQuestions: 10,
      attemptedCount: 8,
      correctCount: 7,
      incorrectCount: 1,
      score: 13.34,
      maxScore: 20,
      accuracyPercent: 88,
      timeTakenSeconds: 420,
      selectedAnswers: { q1: 0, q2: 2 },
      status: "submitted",
      createdAt: now,
    })
  );

  // Attempt to tamper with score after submission -> MUST FAIL
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).collection("attempts").doc("att_1").update({
      score: 20,
    })
  );
});

test("7. Admin can manually grant paid test series access to student and save Support/Help policy config", async () => {
  const adminDb = testEnv.authenticatedContext(ADMIN_UID, {
    email: ADMIN_EMAIL,
    email_verified: true,
  }).firestore();
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const now = new Date();

  // Admin manually unlocks CGPSC Pre 2026 Test Series (₹99) for Alice
  await assertSucceeds(
    adminDb
      .collection("users")
      .doc(ALICE_UID)
      .collection("purchases")
      .doc("admin_grant_cgpsc_pre_2026_series")
      .set({
        userId: ALICE_UID,
        testId: "cgpsc_pre_2026_series",
        testTitleHi: "सीजीपीएससी प्री 2026 टेस्ट सीरीज",
        testTitleEn: "CGPSC Pre 2026 Test Series",
        amountInr: 99,
        paymentMethod: "AdminGrant",
        transactionRef: "ADMIN-WHATSAPP-9238810070",
        status: "completed",
        createdAt: now,
      })
  );

  // Student Alice can read her unlocked purchase record
  await assertSucceeds(
    aliceDb.collection("users").doc(ALICE_UID).collection("purchases").where("userId", "==", ALICE_UID).get()
  );

  // Admin can save & update Support & Help policy + WhatsApp number in app_config/global
  await assertSucceeds(
    adminDb.collection("app_config").doc("global").set({
      configKey: "global",
      anthemTitleHi: "सीजीपीडिया एंथम",
      anthemTitleEn: "CGpedia Anthem",
      anthemSourceType: "bundled",
      anthemAudioUrl: "",
      anthemChunkCount: 0,
      anthemMimeType: "audio/mpeg",
      telegramChannelUrl: "https://t.me/cgpedia_official",
      supportEmail: "usahu0304@gmail.com",
      whatsappSupportNumber: "9238810070",
      supportPolicyHi: "भुगतान एवं सहायता हेतु व्हाट्सएप 9238810070 पर संपर्क करें।",
      supportPolicyEn: "For payment assistance and queries, contact WhatsApp 9238810070.",
      latestVersionCode: 2,
      latestVersionName: "2.0.0",
      apkDownloadUrl: "https://t.me/CGpediaOfficial",
      updateNotesHi: "नया अपडेट उपलब्ध: सीजीपीएससी प्री 2026 टेस्ट सीरीज (₹99) और इंस्टाग्राम स्टोरीज समसामयिकी।",
      updateNotesEn: "New Update Available: CGPSC Pre 2026 Test Series (₹99) & Instagram Stories Current Affairs.",
      updatedBy: ADMIN_UID,
      createdAt: now,
      updatedAt: now,
    })
  );

  // Admin can broadcast a new APK version update (e.g. versionCode 3)
  await assertSucceeds(
    adminDb.collection("app_config").doc("global").update({
      latestVersionCode: 3,
      latestVersionName: "2.1.0",
      apkDownloadUrl: "https://t.me/CGpediaOfficial",
      updatedBy: ADMIN_UID,
      updatedAt: new Date(),
    })
  );
});


