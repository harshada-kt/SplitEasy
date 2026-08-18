# SplitEasy — Day 1 Progress

Group expense splitter. Day 1 covers: project setup, database schema, and JWT authentication.

## What's done today
- Project structure (`client/` + `server/`)
- PostgreSQL schema: `users`, `groups`, `group_members`, `expenses`, `expense_splits`
- Auth API: signup, login, get current user (`/api/auth/me`)
- Passwords hashed with bcrypt, sessions handled via JWT

## Setup

### 1. Database
Create a free Postgres database (recommended: [Neon](https://neon.tech) or [Supabase](https://supabase.com)).
Then run the schema against it:
```bash
psql "<your-database-url>" -f server/schema.sql
```
(Or paste the contents of `server/schema.sql` into your provider's SQL editor.)

### 2. Backend
```bash
cd server
npm install
cp .env.example .env
# edit .env: paste your DATABASE_URL and set a random JWT_SECRET
npm run dev
```
Server runs at `http://localhost:5000`. Visit it in a browser — you should see:
```json
{"status": "SplitEasy API is running"}
```

### 3. Test the auth endpoints
Using curl, Postman, or Thunder Client:

**Sign up**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"password123"}'
```

**Log in**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"password123"}'
```

Both return a `token` — copy it and use it to test the protected route:

**Get current user**
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <paste-token-here>"
```

## Day 2 — Groups & Expenses

New endpoints (all require the `Authorization: Bearer <token>` header from login):

**Create a group**
```
POST /api/groups
Body: { "name": "Goa Trip" }
```

**List my groups**
```
GET /api/groups
```

**Get one group + members**
```
GET /api/groups/:groupId
```

**Add a member** (they must already have a SplitEasy account)
```
POST /api/groups/:groupId/members
Body: { "email": "friend@example.com" }
```

**Add an expense (equal split)**
```
POST /api/groups/:groupId/expenses
Body: {
  "description": "Dinner",
  "amount": 1200,
  "paidBy": 1
}
```

**Add an expense (custom split)**
```
POST /api/groups/:groupId/expenses
Body: {
  "description": "Cab",
  "amount": 500,
  "paidBy": 1,
  "splitType": "custom",
  "splits": [
    { "userId": 1, "amount": 300 },
    { "userId": 2, "amount": 200 }
  ]
}
```

**List expenses in a group**
```
GET /api/groups/:groupId/expenses
```

**Get balances (who owes / is owed how much)**
```
GET /api/groups/:groupId/balances
```
Returns each member's `paid`, `owed`, and net `balance`. Positive balance = they're owed money. Negative = they owe money.

### Testing in PowerShell (Invoke-RestMethod)
Remember to save the `token` you got from login and include it in every request:

```powershell
$token = "paste_your_token_here"
$headers = @{ Authorization = "Bearer $token" }

# Create a group
Invoke-RestMethod -Uri "http://localhost:5000/api/groups" -Method POST -Headers $headers -ContentType "application/json" -Body '{"name":"Goa Trip"}'
```

## Day 3 — Settle-Up Algorithm
Added `GET /api/groups/:groupId/settle-up` — simplifies everyone's debts into the
minimum number of payments needed, using a greedy largest-creditor/largest-debtor
matching algorithm (see `server/utils/settleUp.js`).

## Day 4 — Frontend
React + Tailwind client in `client/`, purple theme. Pages: login, signup, dashboard
(group list), and group detail (members, add expense, balances, settle-up view).

### Running the frontend
```bash
cd client
npm install
npm run dev
```
Opens at `http://localhost:5173`. Make sure the backend (`server/`) is running at
the same time on `http://localhost:5000` — the frontend talks to it directly.

### Design tokens
- Colors: plum `#2D1B4E`, amethyst `#7C4DFF`, violet `#5B21B6`, lavender `#F3EEFF`, ink `#1E1B2E`, owed `#22C55E`, owe `#F97066`
- Fonts: Sora (headings), Inter (body/data)
- Signature element: settle-up transactions render as connected avatar pills with an arrow, not a plain table

## Next up — Day 5
Deploy backend (Render) + frontend (Vercel), final polish, README.
