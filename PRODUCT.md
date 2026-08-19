# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React (Vite) + Firebase (Firestore, Firebase Authentication with Google), deployed to Firebase Hosting.

## Users

Primary user: an individual — likely Indonesian, given IDR-only currency — who wants a simple, calm way to record and monitor personal income and expenses, without accounts, budgets, or setup. The MVP is strictly single-user.

## Product Purpose

Personal Finance Tracker ("Finanx") is a web application for recording income and expenses, assigning a category to every transaction, and reviewing monthly summaries and transaction history. Success means a user can log a transaction in seconds and trust that their balance and category breakdowns are always correct.

## Positioning

Calm minimalism versus feature bloat. Finanx deliberately excludes accounts, wallets, transfers, budgets, recurring transactions, goals, debt, and collaboration — the quiet, uncluttered alternative to dense finance apps. Recording is fast, the interface stays simple, and the user's data is their own.

## Operating Context

- Transaction entry is expected to happen frequently from mobile devices; the UI prioritizes mobile usability while remaining usable on tablet and desktop (responsive).
- Usage is monthly: the dashboard is centered on a selected month, with navigation across months.
- Core loop: Google login → dashboard → add income/expense → categorize → review history and monthly summary.
- Two transaction types: `income` and `expense`. Amounts are always positive; balance = total income − total expense.
- Transaction dates use date-level precision; past and current dates allowed, future dates rejected.
- Soft deletion for transactions and custom categories (`deleted_at`); deleted records are excluded from lists and dashboard calculations, and transaction history preserves category snapshots.

## Capabilities and Constraints

Confirmed capabilities:

- Google sign-in and logout via Firebase Auth; user profile stored in Firestore (name, email, photo, created_at, updated_at).
- Create, edit, and soft-delete income/expense transactions with amount, date, type, category, and optional description.
- Transaction list with month/type/category filters, date-descending sort, and cursor-based pagination.
- System (global) categories per type (income: Salary, Business, Bonus, Gift, Other; expense: Food, Transportation, Shopping, Bills, Entertainment, Health, Education, Other), immutable by users.
- User custom categories per type, using app-provided icons, with a unique normalized name within the user/type scope, soft-deletable.
- Monthly dashboard: income, expense, balance, income-vs-expense visualization, category breakdown, month navigation, and a zero state for empty months.
- Profile page: photo, name, email, created/updated timestamps, logout.
- i18n: UI copy in Indonesian and English, user-toggleable (user-confirmed addition beyond the original MVP scope).

Technical constraints:

- React + Vite; Firebase Hosting as the deploy target.
- Firestore structure: `users/{uid}/transactions`, `users/{uid}/categories`, `system_categories`. Transactions carry denormalized category snapshots (`category_id`, `category_source`, `category_name`, `category_icon`).
- Ownership and field validation enforced via Firebase Security Rules (`request.auth.uid == userId`).
- Currency is fixed to IDR for the MVP; no multi-currency.
- Confirmed out of scope for the MVP: accounts/wallets, transfers, budgets, recurring transactions, goals, debt/loans, receipts/attachments, export, notifications, sharing/collaboration, admin, advanced reporting.

## Brand Commitments

- Working product name: **Finanx** (from the project folder name; the PRD title is "Personal Finance Tracker"). Treat as provisional until confirmed.
- Voice, aesthetic, and visual direction are not yet committed; init deliberately excluded aesthetic direction.

## Evidence on Hand

- PRD: `Product Requirements Document — Personal Finance Tracker MVP.md` — functional, validation, business, and acceptance criteria.
- Data model: `Firestore ERD & Data Model — Personal Finance Tracker MVP.md` — schema, indexes, and security-rules direction.
- No code, assets, or real user data yet. Do not fabricate testimonials, customers, benchmarks, or financial data.

## Product Principles

1. Recording must be fast and frictionless — the path from "spent money" to "logged" is as short as possible.
2. Calm beats feature-packed — every surface stays simple, readable, and uncluttered.
3. The user's data is theirs alone — strict isolation and ownership enforced at the data layer.
4. Numbers must be trustworthy — balance, breakdowns, and history derive from one consistent source: active transactions.
5. Mobile is the primary operating scene; desktop and tablet are supported, not bolted on.

## Accessibility & Inclusion

No product-specific accessibility standard was established. The PRD requires responsive usability across desktop, tablet, and mobile.
