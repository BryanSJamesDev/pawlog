# PawLog

A pet health tracker that helps owners log their pets' daily health and catch problems early with machine learning.

## Authors

- [Eleah Burman](https://github.com/EleahBurman)
- [Bryan James](https://github.com/BryanSJamesDev)

## Class

[CS5610 Web Development, Northeastern University](https://johnguerra.co/classes/webDevelopment_online_fall_2026/)

## Project Objective

Pet health problems often start small, like a dog eating a little less for a few days, and owners tend to notice only once it's serious. PawLog keeps a daily record of each pet's food, water, activity, weight, and symptoms. A logistic regression model compares each day to that pet's own normal and flags entries that may need attention, so owners get an early warning and a clear history to show their vet.

PawLog also keeps pet profiles and a care schedule for meds, vaccines, and vet visits, with a dashboard of upcoming and overdue tasks.

Alerts are not veterinary advice.

## Design Document

[PawLog Design Document (PDF)](design/PawLog-Design-Document.pdf)

Includes the project description, user personas, user stories, and design mockups.

## Screenshot

Coming soon, once the app is deployed.

## Features

- **Daily health log:** create, edit, delete, and filter entries by pet, date range, and symptom
- **ML health alerts:** each entry gets a probability that it needs attention; owners mark alerts as a real problem or a false alarm, and the model retrains on that feedback
- **Pet profiles:** name, species, breed, age, and vet info
- **Care schedule:** meds, vaccines, and vet visits with repeat schedules and an upcoming/overdue dashboard
- **Accounts:** register and log in with Passport; each user only sees their own pets and entries

## Machine Learning

A logistic regression model written from scratch in JavaScript and trained with gradient descent. No ML library is used.

- **Features (10 per entry):** how far food, water, activity, and weight are from the pet's normal (its last 14 entries), five symptom flags, and the number of low-food days in a row
- **Training data:** 1,500 labeled synthetic entries (50 pets × 30 days) with sick spells and 5% label noise
- **Results:** 95.3% accuracy on a 20% test split the model never saw during training

## Tech Stack

- **Frontend:** React (hooks), React Router, Fetch API
- **Backend:** Node.js, Express
- **Database:** MongoDB (native Node.js driver)
- **Authentication:** Passport (passport-local), express-session, bcrypt

## Instructions to Build

### Requirements

- [Node.js](https://nodejs.org/) 20 or newer
- A [MongoDB Atlas](https://www.mongodb.com/atlas) database (the free tier works)

### 1. Clone the repo

```
git clone https://github.com/BryanSJamesDev/pawlog.git
cd pawlog
```

### 2. Set up the backend

```
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in:

- `MONGO_URI`: your MongoDB connection string
- `SESSION_SECRET`: any long random string. To make one, run:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Add data and train the model

```
npm run seed
npm run train
```

`seed` adds 1,500 synthetic health entries. `train` trains the model on them and saves it to the database.

### 4. Start the backend

```
npm run dev
```

The API runs at `http://localhost:3000`.

### 5. Start the frontend

In a second terminal, from the `pawlog` folder:

```
cd frontend
npm install
npm run dev
```

Then open the link it prints.

### Run the tests

From the `backend` folder:

```
npm test
```

## License

[MIT](LICENSE)