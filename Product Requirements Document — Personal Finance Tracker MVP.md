# Product Requirements Document (PRD)
## Personal Finance Tracker — MVP

**Version:** 1.0  
**Status:** Draft  
**Platform:** Web Application  
**Frontend:** React JS  
**Backend / Database:** Firebase / Firestore  
**Authentication:** Firebase Authentication with Google  
**Currency:** Indonesian Rupiah (IDR)

---

## 1. Product Overview

### 1.1 Product Name

**Personal Finance Tracker**

### 1.2 Product Description

Personal Finance Tracker is a simple web application for recording and monitoring personal financial transactions.

The application allows authenticated users to record:

- Income
- Expenses

Users can categorize transactions, view their monthly financial summary, and review their transaction history.

The MVP focuses on simplicity and fast transaction recording rather than advanced financial management features.

### 1.3 Product Concept

The core concept is:

```text
Login
  ↓
Dashboard
  ↓
View financial summary
  ↓
Add Income / Expense
  ↓
Categorize transaction
  ↓
View transaction history
```

Each user's financial data is isolated from other users.

---

# 2. Product Goals

## 2.1 Primary Goals

The MVP should allow users to:

1. Authenticate using Google.
2. Record income.
3. Record expenses.
4. Assign a category to every transaction.
5. View transactions by date.
6. View monthly financial summaries.
7. View income and expense breakdowns by category.
8. Manage custom categories.
9. Edit existing transactions.
10. Soft-delete transactions.
11. Access the application securely so users can only access their own data.

## 2.2 Product Philosophy

The product should prioritize:

- Simplicity
- Fast transaction entry
- Easy-to-understand financial summaries
- Minimal configuration
- Strong data ownership
- Mobile-friendly usability

---

# 3. MVP Scope

## 3.1 In Scope

### Authentication

- Google Login
- Logout
- Firebase Authentication
- User profile stored in Firestore

### Transactions

- Create income transaction
- Create expense transaction
- Edit transaction
- Soft-delete transaction
- Transaction date
- Amount
- Category
- Description
- Transaction type

### Categories

- Global/default categories
- User custom categories
- Category type
- Category icon
- Unique category names
- Soft deletion for custom categories

### Dashboard

- Monthly dashboard
- Monthly income
- Monthly expense
- Monthly balance
- Income vs Expense
- Category breakdown
- Month navigation

### Transaction List

- List transactions
- Filter by transaction type
- Filter by category
- Filter by month
- Sort by transaction date descending
- Pagination

### Profile

- Name
- Email
- Profile photo
- Created timestamp
- Updated timestamp
- Logout

---

# 4. Out of Scope

The following features are intentionally excluded from the MVP:

- Shared finance / collaborative accounts
- Multiple currencies
- Bank account integration
- Wallet/account management
- Transfer between accounts
- Recurring transactions
- Budget management
- Financial goals
- Debt management
- Loan management
- Receipt upload
- Attachment management
- PDF/Excel export
- Notifications
- Reminders
- Scheduled transactions
- Future transactions
- Advanced reporting
- Transaction audit history
- Account deletion
- Multi-level permissions
- Admin dashboard
- Complex financial forecasting

These features may be considered for future versions.

---

# 5. Target User

The primary target user is an individual who wants a simple way to record personal income and expenses.

The MVP does not target organizations, teams, families, or collaborative financial management.

---

# 6. User Roles

The MVP has one application-level user role:

## 6.1 Authenticated User

An authenticated user can:

- View their own profile
- View their own transactions
- Create transactions
- Edit their own transactions
- Soft-delete their own transactions
- View global categories
- Create custom categories
- Soft-delete custom categories
- View their own dashboard

Users cannot access another user's private data.

---

# 7. Authentication Requirements

## 7.1 Google Authentication

Authentication will be handled using Firebase Authentication.

The application will support:

```text
Login with Google
Logout
```

The authentication implementation itself is outside the core product requirement because the Google login flow will be handled separately.

## 7.2 User Profile

After successful authentication, a user profile document should exist in Firestore.

Minimum profile data:

```text
name
email
photo
created_at
updated_at
```

The Firebase Authentication UID is the primary identity reference for the user.

---

# 8. Data Ownership & Security

The application must enforce strict user-level data isolation.

### Rules

Every private transaction belongs to exactly one user.

Every custom category belongs to exactly one user.

A user can only access their own private data.

### User permissions

A user can:

```text
Read       → Own transactions
Create     → Own transactions
Update     → Own transactions
Soft delete → Own transactions
```

For custom categories:

```text
Read       → Own custom categories
Create     → Own custom categories
Update     → Own categories where applicable
Soft delete → Own custom categories
```

Global categories are readable by authenticated users but cannot be modified by users.

Firebase Security Rules must enforce these restrictions on the backend.

---

# 9. Transaction Requirements

## 9.1 Transaction Types

The application supports exactly two transaction types:

```text
income
expense
```

A transaction must have exactly one type.

## 9.2 Transaction Fields

Each transaction contains:

```text
amount
date
type
category
description
```

The transaction also requires ownership information and timestamps.

Conceptually:

```text
Transaction
├── user
├── type
├── amount
├── date
├── category
├── description
├── created_at
├── updated_at
└── deleted_at
```

---

# 10. Transaction Amount Rules

## 10.1 Positive Amount

Transaction amounts must always be positive.

Valid:

```text
50000
100000
2500000
```

Invalid:

```text
0
-50000
-100000
```

The application must not store expenses as negative values.

For example:

```text
amount = 50000
type = expense
```

rather than:

```text
amount = -50000
```

## 10.2 Balance Calculation

The balance is calculated as:

```text
Balance = Total Income - Total Expense
```

Example:

```text
Income  = Rp10.000.000
Expense = Rp6.500.000

Balance = Rp3.500.000
```

---

# 11. Transaction Date Rules

The transaction date:

- Is required.
- Can be selected by the user.
- Can represent a date in the past.
- Cannot represent a future date.
- Uses date-level precision for the MVP.

Example:

```text
2026-08-17
```

The MVP does not require transaction time.

The application may still store system timestamps such as `created_at` and `updated_at`.

---

# 12. Transaction Description

Description is optional.

Valid transaction:

```text
Amount: Rp50.000
Type: Expense
Category: Food
Description: Lunch
```

Also valid:

```text
Amount: Rp50.000
Type: Expense
Category: Food
Description: empty
```

---

# 13. Transaction Category Rules

Every transaction must have exactly one category.

A transaction cannot exist without a category.

Category availability depends on transaction type.

For example:

```text
Type: Income

Available categories:
- Salary
- Business
- Bonus
- Gift
- Other
```

For expense:

```text
Type: Expense

Available categories:
- Food
- Transportation
- Shopping
- Bills
- Entertainment
- Health
- Education
- Other
```

An expense category cannot be selected for an income transaction and vice versa.

---

# 14. Transaction Lifecycle

Transactions are created immediately as completed.

The MVP does not support draft, pending, or cancelled transactions.

Transaction lifecycle:

```text
Create
  ↓
Completed
  ↓
Edit / Soft Delete
```

---

# 15. Transaction Edit Requirements

Users can edit their own transactions.

Editable fields:

```text
amount
date
type
category
description
```

When changing the transaction type, the selected category must also be valid for the new type.

The MVP does not maintain transaction history or audit versions.

---

# 16. Transaction Delete Requirements

Transactions use soft deletion.

The application should not physically remove a transaction document immediately.

Instead:

```text
deleted_at = timestamp
```

When `deleted_at` is not null, the transaction is considered deleted.

Deleted transactions:

- Do not appear in transaction lists.
- Do not appear in dashboard calculations.
- Do not contribute to balance.
- Do not contribute to category summaries.

---

# 17. Transaction List

The application must provide a transaction list.

## 17.1 Sorting

Transactions are sorted by:

```text
transaction date DESC
```

Newest transaction dates appear first.

## 17.2 Filtering

Users can filter transactions by:

- Month
- Income / Expense
- Category

## 17.3 Pagination

The transaction list must support pagination.

For Firestore, cursor-based pagination is preferred over offset pagination.

The implementation should use appropriate Firestore query cursors to load subsequent pages.

---

# 18. Add Transaction

Users create transactions through one unified form.

Example:

```text
Add Transaction

Type
[ Income ] [ Expense ]

Amount
[              ]

Category
[              ]

Date
[              ]

Description
[              ]

[ Save ]
```

The form should conditionally display categories based on the selected transaction type.

---

# 19. Category Requirements

## 19.1 Category Types

Each category belongs to one transaction type:

```text
income
expense
```

## 19.2 Category Fields

A category contains:

```text
name
type
icon
```

The category also requires ownership/system information and lifecycle timestamps.

---

# 20. Global Categories

The application provides a set of predefined global categories.

Examples:

### Income

```text
Salary
Business
Bonus
Gift
Other
```

### Expense

```text
Food
Transportation
Shopping
Bills
Entertainment
Health
Education
Other
```

Global categories:

- Are available to all authenticated users.
- Cannot be edited by users.
- Cannot be deleted by users.
- Use predefined application icons.
- Are maintained by the application/system.

The exact default category list may evolve independently from the user-created category system.

---

# 21. Custom Categories

Users may create custom categories.

Example:

```text
Income
- Freelance

Expense
- Gaming
- Pets
- Coffee
```

Custom categories:

- Belong to exactly one user.
- Are visible only to that user.
- Cannot be seen by other users.
- Must have a category type.
- Must use an application-provided icon.
- Must have a unique name within the user's category/type scope.

---

# 22. Category Name Uniqueness

Category names must be unique for a user within the same transaction type.

For example:

```text
User A

Expense
Food
Food  ← invalid
```

But the same name may exist under a different type if required:

```text
Income
Food

Expense
Food
```

This behavior is technically allowed by the data model, although normally users would use semantically appropriate categories.

---

# 23. Category Icons

Users cannot upload custom icons.

The application provides a predefined icon library.

When creating a custom category, the user selects an icon from the available application icon set.

Example:

```text
Food          → food icon
Transportation → car icon
Shopping      → shopping icon
Salary        → money icon
```

---

# 24. Custom Category Deletion

Custom categories use soft deletion.

After a custom category is deleted:

- It must not appear when creating new transactions.
- It must remain associated with historical transactions.
- Historical transactions remain valid.
- Existing transaction data must not be deleted because a category was deleted.

Conceptually:

```text
Category
deleted_at = timestamp
```

A deleted category should be excluded from active category queries.

---

# 25. Category Management

The MVP provides a dedicated category management area.

Example:

```text
Categories

Income
----------------
Salary
Business
Bonus
Gift
Other
Freelance

Expense
----------------
Food
Transportation
Shopping
Bills
Entertainment
Health
Education
Other

[ Add Category ]
```

For MVP, custom categories are created from the Category management page rather than directly inside the transaction form.

---

# 26. Dashboard

The application provides a monthly dashboard.

The dashboard is centered around a selected month.

Example:

```text
< July 2026 >    August 2026    < September 2026 >
```

The selected month controls the data shown in the dashboard.

---

# 27. Dashboard Summary

The dashboard must display:

```text
Total Income
Total Expense
Balance
```

Example:

```text
Income
Rp12.000.000

Expense
Rp 5.500.000

Balance
Rp 6.500.000
```

Balance is calculated as:

```text
income - expense
```

---

# 28. Dashboard Income vs Expense

The dashboard should provide an income-vs-expense visualization.

Example:

```text
August 2026

Income  █████████████████  Rp12.000.000
Expense ████████           Rp 5.500.000
```

The exact visualization library and UI representation are implementation concerns.

---

# 29. Dashboard Category Breakdown

The dashboard should display category-based financial breakdowns.

Income and expense should be analyzed separately.

Example:

```text
Income Breakdown

Salary       Rp10.000.000
Business      Rp2.000.000
```

```text
Expense Breakdown

Food          Rp1.500.000
Transportation Rp500.000
Shopping      Rp2.000.000
```

Category breakdown must exclude soft-deleted transactions.

---

# 30. Empty Dashboard State

If the selected month contains no transactions, the dashboard must still render normally.

Example:

```text
Income
Rp0

Expense
Rp0

Balance
Rp0

No transactions this month.
```

The user should still be able to create a transaction.

---

# 31. Dashboard Data Calculation

For the MVP, dashboard values are calculated from transaction data rather than stored as permanent monthly aggregate records.

Conceptually:

```text
Firestore Transactions
        ↓
Query selected month
        ↓
Exclude soft-deleted records
        ↓
Calculate
        ↓
Dashboard
```

Calculated values include:

```text
total income
total expense
balance
income by category
expense by category
```

The application should not maintain separate monthly balance documents in the MVP.

---

# 32. Monthly Navigation

Users can move between months.

Example:

```text
July 2026
August 2026
September 2026
```

The current month may be selected by default.

Users can navigate to previous months.

Users must not be able to add a transaction dated after the current date, even if they are viewing a future month.

---

# 33. Profile

The profile page contains:

```text
Profile Photo
Name
Email
Created At
Updated At
Logout
```

The profile does not include:

- Currency settings
- Timezone settings
- Address
- Phone number
- Financial preferences

The MVP uses IDR globally.

---

# 34. Application Navigation

The suggested main application structure is:

```text
Dashboard
Transactions
Categories
Profile
```

A user should be able to navigate between these sections easily.

---

# 35. User Flow

## 35.1 First Login

```text
Open Application
      ↓
Google Login
      ↓
Firebase Authentication
      ↓
Create / Load User Profile
      ↓
Dashboard
```

Default categories are immediately available without requiring a setup wizard.

---

## 35.2 Create Expense

```text
Dashboard
    ↓
Add Transaction
    ↓
Select Expense
    ↓
Enter Amount
    ↓
Select Expense Category
    ↓
Select Date
    ↓
Optional Description
    ↓
Save
    ↓
Transaction Completed
    ↓
Dashboard Updated
```

---

## 35.3 Create Income

```text
Dashboard
    ↓
Add Transaction
    ↓
Select Income
    ↓
Enter Amount
    ↓
Select Income Category
    ↓
Select Date
    ↓
Optional Description
    ↓
Save
    ↓
Transaction Completed
    ↓
Dashboard Updated
```

---

## 35.4 Edit Transaction

```text
Transactions
    ↓
Select Transaction
    ↓
Edit
    ↓
Update Fields
    ↓
Save
    ↓
Transaction Updated
    ↓
Dashboard Recalculated
```

---

## 35.5 Delete Transaction

```text
Transactions
    ↓
Select Transaction
    ↓
Delete
    ↓
Soft Delete
    ↓
Transaction disappears from active queries
    ↓
Dashboard recalculated
```

---

## 35.6 Create Custom Category

```text
Categories
    ↓
Add Category
    ↓
Choose Type
    ↓
Enter Name
    ↓
Choose Application Icon
    ↓
Validate Unique Name
    ↓
Save
```

---

# 36. Functional Requirements

## FR-001 — Authentication

The system shall allow users to authenticate using Google through Firebase Authentication.

## FR-002 — User Profile

The system shall create or maintain a user profile document in Firestore.

## FR-003 — Create Transaction

The system shall allow authenticated users to create income and expense transactions.

## FR-004 — Transaction Validation

The system shall require:

- Type
- Amount
- Date
- Category

Description is optional.

## FR-005 — Positive Amount

The system shall reject transactions with amount less than or equal to zero.

## FR-006 — Transaction Date

The system shall reject transactions with a future date.

## FR-007 — Category Compatibility

The system shall only allow a category whose type matches the selected transaction type.

## FR-008 — Transaction Ownership

The system shall associate every private transaction with exactly one user.

## FR-009 — Transaction Editing

The system shall allow users to edit their own transactions.

## FR-010 — Transaction Soft Delete

The system shall soft-delete transactions rather than physically removing them.

## FR-011 — Transaction Filtering

The system shall support month, type, and category filtering.

## FR-012 — Transaction Sorting

The system shall sort transactions by transaction date descending.

## FR-013 — Transaction Pagination

The system shall support pagination for transaction lists.

## FR-014 — Global Categories

The system shall provide globally available default categories.

## FR-015 — Custom Categories

The system shall allow users to create custom categories.

## FR-016 — Category Ownership

The system shall associate every custom category with exactly one user.

## FR-017 — Category Uniqueness

The system shall prevent duplicate category names within the same user's category/type scope.

## FR-018 — Category Soft Delete

The system shall soft-delete custom categories.

## FR-019 — Dashboard

The system shall display monthly income, expense, balance, and category breakdowns.

## FR-020 — Monthly Navigation

The system shall allow users to navigate between months.

## FR-021 — Data Isolation

The system shall prevent users from accessing another user's private financial data.

---

# 37. Validation Rules

| Field | Required | Validation |
|---|---|---|
| type | Yes | `income` or `expense` |
| amount | Yes | Number greater than 0 |
| date | Yes | Must not be future date |
| category | Yes | Must exist and match transaction type |
| description | No | Optional text |
| category name | Yes | Unique within applicable user/type scope |
| category icon | Yes | Must come from application-provided icon set |

---

# 38. Business Rules

### BR-001

A user can only access their own private transaction data.

### BR-002

A transaction must have exactly one category.

### BR-003

A transaction's category type must match the transaction type.

### BR-004

Transaction amount is always positive.

### BR-005

Expense does not use negative numbers.

### BR-006

Balance is calculated as income minus expense.

### BR-007

Future-dated transactions are not allowed.

### BR-008

Transactions are completed immediately after successful creation.

### BR-009

Deleted transactions are excluded from all normal calculations and active lists.

### BR-010

Deleted categories cannot be selected for new transactions.

### BR-011

Historical transactions retain their category relationship even after the category is soft-deleted.

### BR-012

Global categories cannot be modified by end users.

### BR-013

Custom categories belong to one user only.

### BR-014

Category names must be unique within the applicable user/type scope.

### BR-015

Dashboard calculations only use active transactions.

---

# 39. Firestore Data Model Direction

Because this application uses Firebase/Firestore, the recommended initial structure is a user-oriented subcollection model.

Conceptually:

```text
users/
  {userId}/
    transactions/
      {transactionId}

    categories/
      {categoryId}

categories/
  {categoryId}
```

Where:

```text
users/{userId}
```

contains user profile data.

Private user-owned data is nested under the user.

Global categories remain in a separate top-level collection.

This structure is recommended because it makes ownership explicit and aligns naturally with Firebase Security Rules.

---

# 40. Preliminary Entity / Collection Candidates

This PRD implies the following major data entities.

## 40.1 User

Potential fields:

```text
user_id
name
email
photo
created_at
updated_at
```

The `user_id` maps to the Firebase Authentication UID.

## 40.2 User Transaction

Potential fields:

```text
transaction_id
type
amount
date
category_id
description
created_at
updated_at
deleted_at
```

The parent user path provides ownership.

## 40.3 User Custom Category

Potential fields:

```text
category_id
name
type
icon
created_at
updated_at
deleted_at
```

The parent user path provides ownership.

## 40.4 Global Category

Potential fields:

```text
category_id
name
type
icon
```

Additional administrative metadata can be considered during ERD/data-model design.

---

# 41. Firestore Query Requirements

The application is expected to perform queries similar to:

### Monthly transactions

```text
WHERE date >= month_start
AND date <= month_end
AND deleted_at IS NULL
ORDER BY date DESC
```

### Type filtering

```text
WHERE type = income
```

or:

```text
WHERE type = expense
```

### Category filtering

```text
WHERE category_id = selected_category
```

### Dashboard

Monthly active transactions are queried and aggregated to calculate:

```text
income
expense
balance
category breakdown
```

The final Firestore implementation should determine the exact composite indexes required.

---

# 42. Non-Functional Requirements

## 42.1 Security

Financial data must be protected by Firebase Security Rules.

Client-side restrictions alone are not sufficient.

## 42.2 Data Isolation

A user must never be able to read or modify another user's private data by manipulating client-side requests.

## 42.3 Responsive Design

The application should be usable on:

- Desktop
- Tablet
- Mobile

The UI should prioritize mobile usability because transaction entry is expected to happen frequently from mobile devices.

## 42.4 Performance

Common operations should feel immediate:

- Opening dashboard
- Opening transaction list
- Creating transaction
- Editing transaction
- Loading categories

Pagination should prevent large transaction collections from being loaded unnecessarily.

---

# 43. MVP Acceptance Criteria

The MVP is considered functionally complete when:

### Authentication

- User can login with Google.
- User can logout.
- User profile is persisted.

### Transactions

- User can create income.
- User can create expense.
- User must select category.
- User must enter positive amount.
- User cannot create future transactions.
- User can edit transactions.
- User can soft-delete transactions.
- Deleted transactions are excluded from calculations.

### Categories

- Default categories are available.
- User can create custom categories.
- Custom category names cannot duplicate an existing category in the same applicable scope.
- User cannot modify global categories.
- User cannot use deleted categories for new transactions.

### Dashboard

- Monthly income is displayed.
- Monthly expense is displayed.
- Balance is displayed.
- Income vs expense visualization is displayed.
- Category breakdown is displayed.
- User can switch months.
- Empty months display zero-state information.

### Transaction List

- Transactions are sorted by date descending.
- User can filter by month.
- User can filter by type.
- User can filter by category.
- Pagination works correctly.

### Security

- User A cannot access User B's private transactions.
- User A cannot modify User B's private transactions.
- User A cannot access User B's custom categories.
- Global categories are readable but immutable by end users.

---

# 44. Future Expansion Opportunities

The current architecture should leave room for future features such as:

```text
Recurring Transactions
Budget
Financial Goals
Multiple Accounts / Wallets
Bank Integration
Transfer
Multiple Currency
Reports
Export
Receipt Attachments
Notifications
Shared Finance
Family Finance
```

These features are intentionally not part of the MVP.

---

# 45. ERD Preparation Notes

This PRD is intended to become the source of truth for the subsequent data-model design.

The ERD / Firestore data model should answer the following:

1. How users are represented.
2. How transactions are associated with users.
3. How custom categories are associated with users.
4. How global categories are represented.
5. How transactions reference categories.
6. How soft deletion is represented.
7. How timestamps are represented.
8. How transaction type is represented.
9. How category type is represented.
10. How Firestore queries required by the dashboard and transaction list are supported.
11. Which composite indexes are required.
12. How Firebase Security Rules enforce ownership.
13. How deleted transactions/categories are excluded from active queries.
14. How historical transactions remain valid after category deletion.

---

# 46. Recommended Initial Firestore Structure

Based on the requirements above, the recommended initial model is:

```text
Firestore
│
├── users/
│   └── {userId}
│       ├── name
│       ├── email
│       ├── photo
│       ├── created_at
│       └── updated_at
│
│       ├── transactions/
│       │   └── {transactionId}
│       │       ├── type
│       │       ├── amount
│       │       ├── date
│       │       ├── category_id
│       │       ├── description
│       │       ├── created_at
│       │       ├── updated_at
│       │       └── deleted_at
│       │
│       └── categories/
│           └── {categoryId}
│               ├── name
│               ├── type
│               ├── icon
│               ├── created_at
│               ├── updated_at
│               └── deleted_at
│
└── categories/
    └── {categoryId}
        ├── name
        ├── type
        └── icon
```

This structure is a **preliminary data-model direction**, not yet the final ERD.

---

# 47. Product Summary

The Personal Finance Tracker MVP is intentionally simple.

The core product loop is:

```text
Authenticate
    ↓
Record income / expense
    ↓
Categorize transaction
    ↓
Review transaction history
    ↓
View monthly financial summary
```

The MVP deliberately avoids account/wallet management, collaboration, budgeting, recurring transactions, multiple currencies, and other advanced financial features.

The central data concepts are:

```text
User
Transaction
Category
```

with two category sources:

```text
Global Category
User Custom Category
```

and two transaction types:

```text
Income
Expense
```

The primary financial calculation is:

```text
Balance = Income - Expense
```

This PRD is the foundation for the next stage: designing the **Firestore data model / ERD, indexes, and Firebase Security Rules**.