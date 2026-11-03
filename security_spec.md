# CGpedia Firestore Security Specification (Phase 0 Security TDD)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Unmatched paths are unconditionally denied (`allow read, write: if false`).
2. **Exclusive Admin RBAC**: Admin privileges (`isAdmin()`) require an authenticated token with either verified owner email (`request.auth.token.email == 'usahu0304@gmail.com' && request.auth.token.email_verified == true`) or a trusted document in `/admins/{uid}`. Clients can never write to `/admins` or self-assign `role: 'admin'`.
3. **Strict PII Isolation**: `/users/{userId}` and its subcollections (`purchases`, `attempts`, `bookmarks`) can only be accessed by `request.auth.uid == userId` or `isAdmin()`.
4. **Draft & Publish Isolation**: Non-admin students can only read `tests` where `status == 'published'` and `questions`, `exam_folders`, `subject_folders`, and `current_affairs` where `visibility == 'published'`. Unpublished AI test drafts are completely invisible to students.
5. **No Blanket List Queries**: Every `allow list` rule evaluates `resource.data` (`visibility == 'published'`, `status == 'published'`, `configKey == 'global'`, or `userId == request.auth.uid`). Unfiltered client queries fail with `PERMISSION_DENIED`.
6. **Terminal State Locking**: Submitted `attempts` (`status == 'submitted'`) and completed `purchases` (`status == 'completed'`) cannot be mutated or deleted by students.
7. **Temporal & Structural Integrity**: All timestamps require `is timestamp && <= request.time`; `createdAt` and identity keys (`userId`, `createdBy`, `authorUid`) are immutable on update; every string and list is strictly size-bounded.

## 2. The Dirty Dozen Adversarial Payloads
1. **Unauthenticated Scraper**: Unauthenticated `list` on `/tests` or `/current_affairs` -> Rejected (`request.auth != null`).
2. **Cross-User PII Leak**: Alice (`alice_uid`) performs `get` on `/users/bob_uid` -> Rejected (`request.auth.uid == userId`).
3. **Self-Assigned Admin Escalation**: Student creates `/users/alice_uid` with `role: 'admin'` -> Rejected (`incoming().role == 'student' || isAdmin()`).
4. **Role Mutation Shadow Update**: Student updates `/users/alice_uid` changing `role` to `'admin'` or injecting `isVerified: true` -> Rejected by `incoming().role == existing().role` and `affectedKeys().hasOnly(...)`.
5. **Unverified Admin Email Spoof**: Attacker signs in with `email: 'usahu0304@gmail.com'` and `email_verified: false` and tries to create a test in `/tests` -> Rejected (`email_verified == true` required).
6. **Draft Test Leak**: Student queries `/tests` with `status == 'draft'` or without `where('status', '==', 'published')` -> Rejected (`existing().status == 'published'`).
7. **Student Catalog Tampering**: Student attempts `create`, `update`, or `delete` on `/exam_folders`, `/subject_folders`, `/tests`, `/questions`, or `/app_config` -> Rejected (`isAdmin()` required).
8. **Scorecard Tampering (Terminal State)**: Student attempts `update` on `/users/alice_uid/attempts/att_1` to inflate `score` after submission -> Rejected (only `isAdmin()` can update; terminal state locked).
9. **Purchase Forgery / Mutation**: Alice creates purchase for `bob_uid` or mutates `amountInr` after creation -> Rejected.
10. **ID Poisoning**: Attacker targets `/users/` with a 200-char or special-char document ID -> Rejected by `isValidId()`.
11. **Denial-of-Wallet Oversized String/List**: Attacker submits 100KB headline or 50 MCQ options -> Rejected by strict `.size()` bounds and 4-option tuple check.
12. **Future Clock-Skew Timestamp Injection**: Client writes future timestamp `request.time + 1h` -> Rejected by `<= request.time`.
