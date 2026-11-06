# PawLog – Project Plan

**Team:** Eleah & Bryan James
**Class:** CS5610 Web Development – Project 3
**Due:** Wed, Nov 11 at 2:59am
**Our goal:** Finish everything by **Sun, Nov 8** (2 days early)

This is our working plan. The final README (author, class link, objective, screenshot, build instructions) gets written on Day 5.

---

## Status

- **Merged to main:** PLAN.md, `getDB()` connection, ML model + features, seed data generator
- **In review (5 PRs):** `design-doc`, `health-log` (entries CRUD), `auth` (Passport login), `seed-script` (1,500 entries saved to Mongo), `model-training` (training script + predictEntry)
- **Model:** 95.3% test accuracy on 1,500 seed entries, saved in the `models` collection
- **Merge order:** `design-doc` anytime; `health-log` before `auth` (both change `index.js`, keep both sides if there's a conflict)
- **Next:** frontend (Login/Register, Daily Log Form, Entry History, Alerts)
- **After merges:** predictions on new entries, alerts and feedback routes, `requireLogin`, swap `TEMP_USER_ID` for the real user

---

## Quick Rules (so we don't lose points)

- **No** axios, Mongoose, CORS, or any unapproved library (-20 pts)
- Use `fetch`, the native MongoDB driver, and Passport for auth
- Each React component in its **own file**, with its **own CSS file** of the same name
- PropTypes on every component
- Use real HTML tags (`<button>`, not clickable `<div>`s)
- Prettier formatting + ESLint with zero errors
- Never commit `.env` (Mongo user/password stays secret)
- MIT license
- Delete unused files (default favicon, `routes/users.js`, starter code)
- No CORS library, so in production Express serves the built React app. In development, use the Vite proxy.
- Design doc is its own file in `design/`, linked from the README (not pasted inside it)

---

## Folder Structure

```
pawlog/
├── backend/
│   ├── package.json
│   ├── index.js
│   ├── auth/          # Passport setup + credential checks
│   ├── db/            # Mongo connection
│   ├── routes/        # entries, pets, careTasks, auth + validation
│   ├── ml/            # features, logistic regression, training, predictions
│   └── seed/          # synthetic data generator + seed script
├── frontend/
│   ├── package.json
│   └── src/
│       ├── components/   # Component.jsx + Component.css
│       └── pages/
├── design/            # design doc PDF
├── LICENSE
├── PLAN.md
└── README.md
```

**Backend scripts:** `npm run dev` (server), `npm test` (all tests), `npm run seed` (reseed 1,500 entries), `npm run train` (retrain and save the model)

---

## Day 0 – Tue, Nov 3

- [x] Send the proposal on Slack for approval
- [ ] Both: confirm what time class is, so we know when the 24-hour code freeze is

---

## Day 1 – Wed, Nov 4: Setup + Design Doc

**Shared**
- [x] Create GitHub repo, add MIT license and `.gitignore` (include `.env` and `node_modules`)
- [x] Set up the MongoDB Atlas cluster and share access
- [x] Create `backend/` (Express) and `frontend/` (Vite + React), each with its own `package.json`
- [ ] Add ESLint and Prettier configs to both
- [ ] Delete leftover starter files right away

**Eleah**
- [x] Design doc: project description, personas, user stories
- [x] Mockups: all 9 screens, made in Figma and added to the design doc

**Bryan**
- [ ] Review his user stories and screens in the design doc
- [ ] Plan the `pets` and `careTasks` fields

**End of day:** Both apps run locally, and the design doc is close to done. It's worth 80 points, so it gets priority.

---

## Day 2 – Thu, Nov 5: Backend + Data

**Eleah**
- [x] `entries` collection + full CRUD routes (GET, POST, PUT, DELETE, with input validation)
- [x] Passport auth: register, login, logout, and `/api/auth/me` (passport-local, express-session, bcrypt)
- [x] Seed data generator: 1,500 labeled health entries ("needs attention" or "normal", with noise)
- [x] Seed script: 1,500 entries saved to Mongo (`npm run seed`)

**Bryan**
- [ ] `pets` collection + full CRUD routes
- [ ] `careTasks` collection + full CRUD routes
- [ ] Seed script for pets and care tasks

**Both**
- [ ] Protect routes so users only see their own data
- [ ] Test every route with Postman or curl (Eleah's entries and auth routes done)

**End of day:** All routes work, and the database has 1k+ records.

---

## Day 3 – Fri, Nov 6: Frontend

**Eleah**
- [ ] Login and Register pages
- [ ] `EntryForm` (create + edit)
- [ ] `EntryList` with filters (pet, date range, symptom) + delete

**Bryan**
- [ ] `PetForm` and `PetList`
- [ ] `CareTaskForm` and `CareTaskList`
- [ ] `CareDashboard` (upcoming and overdue tasks)

**Both**
- [ ] React Router setup and a shared navbar
- [ ] Each component gets its own `.css` file and PropTypes

**End of day:** You can do everything in the app from the browser, minus the ML.

---

## Day 4 – Sat, Nov 7: ML + Polish

**Eleah**
- [x] Feature extraction: distance from each pet's 14-day normal, symptom flags, low days in a row
- [x] Logistic regression from scratch (gradient descent)
- [x] Train/test split and accuracy score
- [x] Training script + save model weights to MongoDB (`npm run train`, 95.3% accuracy)
- [x] `predictEntry` helper to score new entries
- [ ] Add predictions to the POST route, plus alerts, feedback, and retrain routes
- [ ] `AlertsPage` with "real problem" / "false alarm" buttons
- [ ] Chart.js trend chart (weight and eating), if time allows

**Bryan**
- [ ] Repeat schedules for care tasks (daily, weekly, yearly)
- [ ] Instructions / How to Use page (rubric points)
- [ ] "Not veterinary advice" note
- [ ] Style pass and check all buttons and forms use proper HTML tags

**End of day:** The full app works locally, including ML alerts.

---

## Day 5 – Sun, Nov 8: Deploy + Deliverables

**Morning**
- [ ] Run ESLint (zero errors) and Prettier on everything
- [ ] Remove unused code and files
- [ ] Deploy (e.g. Render) with env variables set there, not in code
- [ ] Test every feature on the live site

**Afternoon**
- [ ] Final README: author, class link, objective, screenshot, build instructions
- [ ] Slides
- [ ] Record a short narrated demo video, with **both of us** presenting, and make it public
- [ ] Submit the Google Form (check the thumbnail and that all links work)

**End of day:** Code frozen. Everything submitted. 🎉

---

## Buffer Days

**Mon, Nov 9** – Fix anything broken on the live site. Re-check the video and form links.
**Tue, Nov 10** – Complete the peer review (10 pts). Final check against the rubric below.

---

## Rubric Checklist

- [x] Design doc: description, personas, user stories, mockups (80)
- [ ] Meets approved proposal requirements (15)
- [ ] Usable, with instructions (5)
- [ ] Actually useful (5)
- [ ] ESLint config, no errors (5)
- [ ] Code organized: components, db, and CSS in folders (5)
- [ ] 3+ React components using hooks (15)
- [ ] Each component in its own file (15)
- [ ] Deployed and working (10)
- [ ] 2+ collections, full CRUD for each of us (15)
- [x] 1k+ synthetic records (10)
- [x] Node + Express (5)
- [ ] Prettier formatted (5)
- [ ] Standard HTML tags (5)
- [ ] CSS per component (5)
- [ ] README complete (5)
- [ ] No exposed credentials (5)
- [ ] Separate backend and frontend `package.json` (5)
- [x] MIT license (5)
- [ ] No leftover unused code (5)
- [ ] Google Form correct (5)
- [ ] Public narrated video with both of us (10)
- [ ] Code frozen on time (5)
- [ ] PropTypes on every component (5)
- [ ] No prohibited libraries (20)
- [x] Passport authentication (10)
- [ ] Peer review done (10)