# ENGINEERING DIRECTORY + STABLE RESUME PROTOCOL

## الهدف

أنشئ داخل Root المشروع مجلد:

`/engineering`

هذا المجلد هو **مصدر الحقيقة الخاص بهندسة المشروع واستئناف العمل**.

يجب على الـAgent استخدامه في كل جلسة للعمل من آخر نقطة وصل إليها، بدون إعادة تحليل أو إعادة تنفيذ المهام المكتملة إلا عند الحاجة.

---

# 1. إنشاء هيكل Engineering

أنشئ الهيكل التالي:

```text
engineering/
├── STATE.md
├── RESUME.md
├── ROADMAP.md
├── TASKS.md
├── DECISIONS.md
├── ARCHITECTURE.md
├── CHANGELOG.md
├── BLOCKERS.md
├── QA.md
└── sessions/
    ├── SESSION-001.md
    ├── SESSION-002.md
    └── ...
```

إذا كان هناك ملفات موجودة بالفعل تؤدي نفس الوظيفة، لا تنشئ نسخاً متكررة بدون داعٍ.

افحص المشروع أولاً ثم اربط النظام بالملفات الحالية.

---

# 2. STATE.md

هذا هو الملف الأهم.

يحتوي دائماً على:

```md
# CURRENT PROJECT STATE

## Current Phase
...

## Current Task
...

## Current Subtask
...

## Last Completed Task
...

## Next Exact Action
...

## Completion
...

## Active Files
...

## Relevant Components
...

## Current Architecture
...

## Known Issues
...

## Blockers
...

## Last Validation
...

## Last Session
...

## Resume Priority
...
```

### قاعدة مهمة

`STATE.md` يجب أن يعكس الحالة الحالية الحقيقية للمشروع.

لا تتركه يعكس حالة قديمة.

---

# 3. RESUME.md

هذا هو ملف الاستئناف الرسمي.

يجب أن يحتوي على تعليمات يستطيع أي Agent جديد اتباعها بدون معرفة المحادثة السابقة.

Structure:

```md
# STABLE RESUME

## Project
سرايا الأندلس للأثاث الفندقي والضيافة

## Current Phase
...

## Current Objective
...

## Last Known State
...

## What Has Been Completed
...

## What Is Still Pending
...

## Current Blocker
...

## Exact Next Step
...

## Files To Inspect First
...

## Files Currently Being Modified
...

## Important Decisions
...

## Do NOT Repeat
...

## Validation Required
...

## Resume Procedure
1.
2.
3.
4.
```

---

# 4. قاعدة "Exact Next Action"

لا تكتب:

> Continue development.

ولا:

> Continue working on Admin.

يجب أن يكون هناك Action محدد جداً.

مثال:

```md
## Next Exact Action

Open:
src/admin/products/ProductForm.tsx

Inspect:
product submission flow.

Then:
connect the form to POST /api/products.

After implementation:
run product API tests.
```

الهدف أن يستطيع Agent جديد البدء مباشرة.

---

# 5. TASKS.md

يحتوي على جميع المهام.

استخدم:

```md
- [ ] Pending
- [~] In Progress
- [x] Completed
- [!] Blocked
```

كل Task يجب أن يكون له ID.

مثال:

```md
ENG-001
ENG-002
ENG-003
```

ولا تحذف المهام المكتملة.

---

# 6. منع إعادة تنفيذ المهام

قبل بدء أي Task:

ابحث في:

* STATE.md
* TASKS.md
* CHANGELOG.md
* sessions/
* المشروع نفسه

إذا كانت المهمة مكتملة فعلاً:

لا تعيد تنفيذها.

إذا كانت الحالة غير مؤكدة:

تحقق من الكود أولاً.

لا تفترض أنها ناقصة.

---

# 7. DECISIONS.md

كل قرار معماري مهم يتم تسجيله.

مثال:

```md
## DEC-001

Decision:
Use PostgreSQL as primary database.

Reason:
Relational data + admin workflows + reporting.

Date:
2026-08-20

Status:
Accepted
```

لا تغير قراراً سابقاً بصمت.

إذا احتجت تغييره:

أضف Decision جديدة تشير إلى القرار السابق.

---

# 8. CHANGELOG.md

كل Session يجب أن تسجل ما تغير.

مثال:

```md
## SESSION-014

Date:
2026-08-20

Completed:
- Added product CRUD.
- Added product image upload.
- Added category filtering.

Changed:
- src/...
- backend/...

Tests:
PASS

Next:
Implement product publishing workflow.
```

---

# 9. BLOCKERS.md

إذا ظهر Blocker:

سجله.

Structure:

```md
## BLOCKER-001

Problem:
...

Impact:
...

Attempted:
...

Current Status:
...

Required Decision:
...

Workaround:
...
```

لا تخفي Blockers.

ولا تعتبر المشروع مكتملًا إذا كان Blocker يمنع وظيفة أساسية.

---

# 10. QA.md

احتفظ بحالة الاختبارات.

مثال:

```md
# QA STATUS

## Build
PASS

## Lint
PASS

## Unit Tests
PASS

## Integration Tests
PASS

## E2E
PARTIAL

## Mobile
PENDING

## RTL
PASS

## Security
PARTIAL
```

حدث الملف بعد كل Validation مهم.

---

# 11. Sessions

كل جلسة عمل يجب أن يكون لها ملف:

```text
engineering/sessions/SESSION-XXX.md
```

يحتوي:

```md
# SESSION XXX

## Started

## Objective

## Initial State

## Work Performed

## Files Changed

## Tests Run

## Results

## Problems Found

## Decisions

## Final State

## Exact Resume Point
```

---

# 12. بروتوكول بدء أي Session

في بداية كل جلسة:

## STEP 1

اقرأ:

```text
engineering/RESUME.md
```

## STEP 2

اقرأ:

```text
engineering/STATE.md
```

## STEP 3

اقرأ:

```text
engineering/TASKS.md
```

## STEP 4

راجع آخر Session داخل:

```text
engineering/sessions/
```

## STEP 5

راجع:

```text
engineering/BLOCKERS.md
engineering/DECISIONS.md
```

حسب الحاجة.

## STEP 6

تحقق من حالة الكود فعلياً.

---

# 13. لا تثق في Resume File وحده

ملفات Engineering هي ذاكرة تشغيلية.

لكنها ليست بديلاً عن الكود.

إذا قال:

```md
Product CRUD = COMPLETE
```

تحقق من وجود:

* Backend
* API
* Database
* Frontend
* Validation
* Tests

إذا كانت غير مكتملة:

صحح STATE أولاً.

ثم أكمل.

---

# 14. Resume Integrity

في بداية كل Session:

قارن:

```text
STATE.md
TASKS.md
CHANGELOG.md
Actual Code
```

إذا كان هناك تعارض:

الحقيقة الفعلية للكود هي المصدر الأعلى.

ثم صحح ملفات Engineering.

---

# 15. Checkpoint System

بعد كل Milestone:

أنشئ Checkpoint.

مثال:

```md
## CHECKPOINT

Phase:
Admin Products

Completed:
ENG-001 → ENG-008

Tests:
PASS

Known Issues:
None

Next:
ENG-009
```

---

# 16. Safe Stop

إذا انتهت جلسة العمل أو اضطررت للتوقف:

**ممنوع التوقف بدون تحديث حالة المشروع.**

قبل التوقف:

1. احفظ الكود.
2. شغّل validation مناسب.
3. حدث TASKS.md.
4. حدث STATE.md.
5. حدث RESUME.md.
6. أنشئ Session file.
7. سجل أي Blockers.
8. اكتب Exact Next Action.

---

# 17. Stable Resume Command

اعتبر هذا الأمر Command ثابت:

```text
RESUME PROJECT
```

عند رؤيته، نفذ:

```text
1. Read engineering/RESUME.md
2. Read engineering/STATE.md
3. Read engineering/TASKS.md
4. Read latest engineering/sessions/
5. Inspect current code state
6. Detect discrepancies
7. Repair engineering state if needed
8. Identify highest-priority incomplete task
9. Continue from EXACT NEXT ACTION
10. Validate changes
11. Update engineering files
12. Save a new session checkpoint
```

---

# 18. ممنوع إعادة البداية

عند تنفيذ:

`RESUME PROJECT`

لا تبدأ من:

* Project overview
* UI redesign
* Architecture rewrite
* Database rewrite
* Full audit

إلا إذا كان ذلك هو الـNext Exact Action.

ابدأ من آخر نقطة حقيقية.

---

# 19. ممنوع الدوران

لا تسمح لنفسك بالدخول في Loop مثل:

```text
Analyze
Analyze again
Plan
Re-plan
Review
Re-review
```

إذا كانت المعلومات كافية:

**نفذ.**

إذا وجدت مشكلة:

**حددها → أصلحها → اختبرها → أكمل.**

---

# 20. لا تعتبر Documentation إنجازاً

تحديث ملفات Engineering ليس بديلاً عن تنفيذ المهمة.

مثلاً:

لا تضع:

```md
ENG-015 = COMPLETE
```

إلا إذا كانت الوظيفة فعلاً موجودة وتعمل.

---

# 21. Atomic Progress

كل Task يجب أن يكون صغيراً بما يكفي لإكماله والتحقق منه.

بدلاً من:

```text
Build Admin
```

استخدم:

```text
ENG-021 Admin sidebar
ENG-022 Admin routing
ENG-023 Product table
ENG-024 Product creation
ENG-025 Product editing
ENG-026 Product deletion
ENG-027 Product publishing
```

---

# 22. Priority

الأولوية:

```text
P0 = Critical
P1 = Required
P2 = Important
P3 = Enhancement
```

إذا وجدت P0 غير مكتملة:

لا تنتقل إلى P3 لمجرد أنها أسهل.

---

# 23. Dependency Awareness

كل Task يمكن أن يحتوي:

```md
Depends On:
ENG-021
ENG-022
```

لا تبدأ Task تعتمد على شيء غير مكتمل إلا إذا كان يمكن تنفيذها بشكل مستقل.

---

# 24. File Awareness

عند تعديل ملف مهم:

سجله في Session.

مثال:

```md
Files Changed:
- frontend/src/pages/admin/products.tsx
- frontend/src/components/ProductForm.tsx
- backend/api/products.py
```

---

# 25. Final Session Report

في نهاية كل Session أعطني فقط:

```text
SESSION COMPLETE

Completed:
...

Validated:
...

Issues:
...

Current State:
...

Next Exact Action:
...

Resume File:
engineering/RESUME.md
```

---

# 26. FINAL RULE

اعتبر مجلد:

```text
/engineering
```

هو:

> **Engineering Memory + Project State + Resume System**

ولا تعتمد على Conversation Memory لكي تعرف أين توقفت.

إذا بدأت جلسة جديدة، يجب أن تستطيع قراءة:

```text
engineering/RESUME.md
```

ثم الانتقال مباشرة إلى آخر نقطة عمل حقيقية.

# EXECUTE NOW

ابدأ الآن بـ:

1. فحص المشروع.
2. تحديد هل توجد Engineering/Documentation files بالفعل.
3. إنشاء `/engineering` إذا لم يكن موجوداً.
4. إنشاء الملفات المطلوبة.
5. استخراج الحالة الحالية من الكود والملفات.
6. كتابة أول `STATE.md`.
7. كتابة أول `RESUME.md`.
8. تحديد آخر Task مكتمل.
9. تحديد أول Task غير مكتمل.
10. البدء في تنفيذ الـNext Exact Action.

لا تكتفِ بإنشاء المجلد.

**استخدمه فعلياً كنظام استئناف من أول Session.**
