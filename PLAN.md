# PawLog – Project Plan

**Team:** Eleah & Bryan James
**Class:** CS5610 Web Development – Project 3
**Due:** Wed, Nov 11 at 2:59am
**Our goal:** Finish everything by **Sun, Nov 8** (2 days early)

This is our working plan. The final README (author, class link, objective, screenshot, build instructions) gets written on Day 5.

---

## Status

- **Merged to main:** PLAN.md, `getDB()` connection, ML model + features, seed data generator
- **In review:** `health-log` (entries CRUD). Uses a temporary user id until login is added.
- **Next:** Passport login (`auth` branch), then swap the temporary user id for the real logged-in user
- **Behind:** design doc and mockups (80 pts)

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

---

## Folder Structure

```
pawlog/
├── backend/
│   ├── package.json
│   ├── index.js
│   ├── db/            # Mongo connection
│   ├── routes/        # entries, pets, careTasks, auth + validation
│   ├── ml/            # features + logistic regression
│   └── seed/          # synthetic data generator + seed script
├── frontend/
│   ├── package.json
│   └── src/
│       ├── components/   # Component.jsx + Component.css
│       └── pages/
├── design/            # design doc + mockups
├── LICENSE
├── PLAN.md
└── README.md
```

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
- [ ] Design doc: project description, personas, user stories (copy from the proposal)
- [ ] Mockups: daily log form, entry history, alerts page, login

**Bryan**
- [ ] Mockups: pet profiles, care task form, upcoming/overdue dashboard
- [ ] Plan the `pets` and `careTasks` fields

**End of day:** Both apps run locally, and the design doc is close to done. It's worth 80 points, so it gets priority.

---

## Day 2 – Thu, Nov 5: Backend + Data

**Eleah**
- [x] `entries` collection + full CRUD routes (GET, POST, PUT, DELETE, with input validation)
- [ ] Passport auth: register, login, logout (passport-local, express-session, bcrypt)
- [x] Seed data generator: 1,500 labeled health entries ("needs attention" or "normal", with noise)
- [ ] Seed script: save the generated entries to Mongo

**Bryan**
- [ ] `pets` collection + full CRUD routes
- [ ] `careTasks` collection + full CRUD routes
- [ ] Seed script for pets and care tasks

**Both**
- [ ] Protect routes so users only see their own data
- [ ] Test every route with Postman or curl (Eleah's entries routes done)

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
- [ ] Save model weights to MongoDB
- [ ] `POST /api/predict` and `POST /api/retrain` routes
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

- [ ] Design doc: description, personas, user stories, mockups (80)
- [ ] Meets approved proposal requirements (15)
- [ ] Usable, with instructions (5)
- [ ] Actually useful (5)
- [ ] ESLint config, no errors (5)
- [ ] Code organized: components, db, and CSS in folders (5)
- [ ] 3+ React components using hooks (15)
- [ ] Each component in its own file (15)
- [ ] Deployed and working (10)
- [ ] 2+ collections, full CRUD for each of us (15)
- [ ] 1k+ synthetic records (10)
- [ ] Node + Express (5)
- [ ] Prettier formatted (5)
- [ ] Standard HTML tags (5)
- [ ] CSS per component (5)
- [ ] README complete (5)
- [ ] No exposed credentials (5)
- [ ] Separate backend and frontend `package.json` (5)
- [ ] MIT license (5)
- [ ] No leftover unused code (5)
- [ ] Google Form correct (5)
- [ ] Public narrated video with both of us (10)
- [ ] Code frozen on time (5)
- [ ] PropTypes on every component (5)
- [ ] No prohibited libraries (20)
- [ ] Passport authentication (10)
- [ ] Peer review done (10)