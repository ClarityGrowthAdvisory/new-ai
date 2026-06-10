# AI Review Booster Panel — Complete System Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Routing & Navigation](#6-routing--navigation)
7. [User Roles & Permissions](#7-user-roles--permissions)
8. [Feature Documentation](#8-feature-documentation)
9. [Edge Functions (Backend)](#9-edge-functions-backend)
10. [Public Review Page](#10-public-review-page)
11. [Subscription & Payments](#11-subscription--payments)
12. [File Storage](#12-file-storage)
13. [Internationalization (i18n)](#13-internationalization-i18n)
14. [Theming & Branding](#14-theming--branding)
15. [Security](#15-security)
16. [Deployment](#16-deployment)

---

## 1. Project Overview

**AI Review Booster Panel** is a multi-tenant SaaS application that helps businesses improve their online reputation by intelligently routing customer feedback:

- **Happy customers (4–5 stars)** → Redirected to Google Reviews with pre-written review samples they can copy & paste.
- **Unhappy customers (1–3 stars)** → Feedback is captured privately, preventing negative public reviews.

**Published URL:** `https://reviewsys.lovable.app`

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React SPA)                  │
│    Vite + React 18 + TypeScript + Tailwind CSS          │
│    shadcn/ui components + Recharts                      │
└─────────────────┬───────────────────────────────────────┘
                  │ Supabase JS SDK
┌─────────────────▼───────────────────────────────────────┐
│                   Lovable Cloud (Supabase)               │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Auth     │  │ PostgreSQL   │  │ Edge Functions    │  │
│  │ (Email)  │  │ (RLS)        │  │ - admin-users     │  │
│  │          │  │              │  │ - razorpay         │  │
│  └──────────┘  └──────────────┘  └───────────────────┘  │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Storage (business-logos bucket — public)          │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

| Layer        | Technology                                                |
| ------------ | --------------------------------------------------------- |
| Framework    | React 18 + TypeScript                                     |
| Build Tool   | Vite 5                                                    |
| Styling      | Tailwind CSS 3 + shadcn/ui                                |
| State        | React Query (TanStack Query v5) + React useState          |
| Routing      | React Router DOM v6                                       |
| Charts       | Recharts                                                  |
| Auth         | Supabase Auth (email/password)                            |
| Database     | PostgreSQL via Supabase (with RLS)                        |
| Backend      | Supabase Edge Functions (Deno runtime)                    |
| Payments     | Razorpay (Indian payment gateway)                         |
| QR Codes     | `qrcode` npm package (canvas-based with logo overlay)     |
| Storage      | Supabase Storage (public `business-logos` bucket)         |
| Deployment   | Lovable Cloud                                             |

---

## 4. Database Schema

### Tables

#### `profiles`
Stores user profile data, automatically created via `handle_new_user()` trigger on signup.

| Column       | Type      | Description                                   |
| ------------ | --------- | --------------------------------------------- |
| `id`         | UUID (PK) | Auto-generated                                |
| `user_id`    | UUID      | References auth.users                         |
| `name`       | text      | Full name                                     |
| `email`      | text      | Email address                                 |
| `phone`      | text      | Phone number                                  |
| `is_active`  | boolean   | Account active status (default: true)         |
| `created_by` | UUID      | Admin who created this user (nullable)        |
| `created_at` | timestamp | Auto timestamp                                |

#### `user_roles`
Separate table for RBAC (prevents privilege escalation).

| Column    | Type              | Description                          |
| --------- | ----------------- | ------------------------------------ |
| `id`      | UUID (PK)         | Auto-generated                       |
| `user_id` | UUID              | References auth.users                |
| `role`    | app_role (enum)   | `super_admin`, `admin`, or `client`  |

#### `business_profiles`
Each client has one business profile for their review link.

| Column             | Type      | Description                              |
| ------------------ | --------- | ---------------------------------------- |
| `id`               | UUID (PK) | Auto-generated                           |
| `user_id`          | UUID      | Owner                                    |
| `business_name`    | text      | Display name                             |
| `slug`             | text      | URL-friendly identifier                  |
| `google_review_url`| text      | Google Review URL                        |
| `theme`            | text      | Visual theme (`default`, `jewellery`, `salon`, `restaurant`) |
| `primary_color`    | text      | Custom brand color (hex)                 |
| `font_family`      | text      | Custom Google Font                       |
| `logo_url`         | text      | Uploaded logo URL                        |
| `bg_image_url`     | text      | Custom background image URL              |
| `created_at`       | timestamp | Auto timestamp                           |
| `updated_at`       | timestamp | Auto timestamp                           |

#### `positive_reviews`
Sample review texts shown to happy customers for copy-paste.

| Column        | Type      | Description                    |
| ------------- | --------- | ------------------------------ |
| `id`          | UUID (PK) | Auto-generated                 |
| `business_id` | UUID     | References business_profiles   |
| `review_text` | text      | The sample review content      |
| `segment_id`  | UUID      | Optional category (nullable)   |
| `created_at`  | timestamp | Auto timestamp                 |

#### `review_segments`
Categories for organizing review samples (e.g., "Food", "Service", "Quality").

| Column        | Type      | Description                  |
| ------------- | --------- | ---------------------------- |
| `id`          | UUID (PK) | Auto-generated               |
| `business_id` | UUID     | References business_profiles |
| `name`        | text      | Segment name                 |
| `created_at`  | timestamp | Auto timestamp               |

#### `negative_feedback`
Privately captured feedback from unhappy customers (1–3 stars).

| Column         | Type      | Description                  |
| -------------- | --------- | ---------------------------- |
| `id`           | UUID (PK) | Auto-generated               |
| `business_id`  | UUID      | References business_profiles |
| `rating`       | integer   | 1–3 stars                    |
| `feedback_text`| text      | Customer's feedback          |
| `created_at`   | timestamp | Auto timestamp               |

#### `analytics`
Aggregated counters per business.

| Column               | Type      | Description                |
| -------------------- | --------- | -------------------------- |
| `id`                 | UUID (PK) | Auto-generated             |
| `business_id`        | UUID      | References business_profiles (unique) |
| `page_views`         | integer   | Total page view count      |
| `five_star_clicks`   | integer   | 4-5 star redirect count    |
| `low_star_submissions`| integer  | 1-3 star submission count  |

#### `page_view_logs`
Individual page view records for daily chart breakdowns.

| Column        | Type      | Description                  |
| ------------- | --------- | ---------------------------- |
| `id`          | UUID (PK) | Auto-generated               |
| `business_id` | UUID     | References business_profiles |
| `viewed_at`   | timestamp | When the page was viewed     |

#### `plans`
Subscription plan definitions (managed by Super Admin).

| Column         | Type      | Description                           |
| -------------- | --------- | ------------------------------------- |
| `id`           | UUID (PK) | Auto-generated                       |
| `name`         | text      | Plan name                            |
| `description`  | text      | Plan description                     |
| `price`        | numeric   | Price in INR                         |
| `validity_days`| integer   | Duration in days                     |
| `max_reviews`  | integer   | Max review samples allowed           |
| `max_segments` | integer   | Max segments/locations allowed       |
| `theme_access` | text[]    | Allowed theme IDs                    |
| `badge`        | text      | Badge label (e.g., "popular")        |
| `is_active`    | boolean   | Whether visible to clients           |
| `created_at`   | timestamp | Auto timestamp                       |
| `updated_at`   | timestamp | Auto timestamp                       |

#### `user_plans`
Maps users to their assigned/purchased plans.

| Column       | Type      | Description                    |
| ------------ | --------- | ------------------------------ |
| `id`         | UUID (PK) | Auto-generated                 |
| `user_id`    | UUID      | The user                       |
| `plan_id`    | UUID      | References plans (nullable)    |
| `assigned_at`| timestamp | When the plan was assigned     |
| `expires_at` | timestamp | Plan expiration date           |

#### `payment_records`
Razorpay payment transaction records.

| Column               | Type      | Description                     |
| -------------------- | --------- | ------------------------------- |
| `id`                 | UUID (PK) | Auto-generated                 |
| `user_id`            | UUID      | The paying user                |
| `plan_id`            | UUID      | Plan purchased (nullable)      |
| `amount`             | numeric   | Amount in INR                  |
| `currency`           | text      | Default: `INR`                 |
| `razorpay_order_id`  | text      | Razorpay order ID              |
| `razorpay_payment_id`| text      | Razorpay payment ID (nullable) |
| `razorpay_signature` | text      | Verification signature (nullable) |
| `status`             | text      | `created`, `paid`              |
| `is_renewal`         | boolean   | Whether this is a renewal      |
| `created_at`         | timestamp | Auto timestamp                 |
| `updated_at`         | timestamp | Auto timestamp                 |

### Database Functions

| Function               | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `has_role(uuid, role)` | Security definer — checks if user has a given role  |
| `is_admin(uuid)`       | Security definer — checks admin role                |
| `is_super_admin(uuid)` | Security definer — checks super_admin role          |
| `increment_analytics(business_id, column)` | Upserts and increments analytics counters |
| `handle_new_user()`    | Trigger function — auto-creates profile on signup   |

---

## 5. Authentication & Authorization

### Auth Flow
- **Email/password** authentication via Supabase Auth
- Email verification required (auto-confirm disabled)
- Password reset via email link → `/reset-password` page
- Session managed by Supabase JS SDK (`onAuthStateChange`)

### Auth Context (`useAuth` hook)
Provides: `user`, `session`, `role`, `loading`, `signIn`, `signUp`, `signOut`

Role is fetched from `user_roles` table after authentication.

### Protected Routes (`ProtectedRoute` component)
- Wraps route groups with `allowedRoles` prop
- Redirects unauthenticated users to `/login`
- Redirects users to their role-specific dashboard if accessing unauthorized routes

---

## 6. Routing & Navigation

| Route                           | Component              | Access         |
| ------------------------------- | ---------------------- | -------------- |
| `/`                             | Landing page (guests) / Auto-redirect (auth users) | Public |
| `/login`                        | LoginPage              | Public         |
| `/reset-password`               | ResetPasswordPage      | Public         |
| `/review/:slug`                 | PublicReviewPage        | Public         |
| `/dashboard`                    | ClientDashboard         | Client         |
| `/dashboard/review-link`        | ReviewLinkSetup         | Client         |
| `/dashboard/positive-reviews`   | PositiveReviewsPage     | Client         |
| `/dashboard/negative-feedback`  | NegativeFeedbackPage    | Client         |
| `/dashboard/subscription`       | SubscriptionPage        | Client         |
| `/admin`                        | AdminDashboard          | Admin          |
| `/admin/feedback`               | AdminFeedbackPage       | Admin          |
| `/super-admin`                  | SuperAdminDashboard     | Super Admin    |
| `/super-admin/admins`           | SuperAdminAdminsPage    | Super Admin    |
| `/super-admin/users`            | SuperAdminUsersPage     | Super Admin    |
| `/super-admin/plans`            | AdminPlansPage          | Super Admin    |
| `/super-admin/feedback`         | AdminFeedbackPage       | Super Admin    |

### Auto-Redirect Logic
- Guest on `/` → Landing page
- Authenticated user on `/` → Redirected to their role-specific dashboard
- Authenticated user on `/login` → Redirected to their dashboard

---

## 7. User Roles & Permissions

### Three-Tier RBAC

| Role          | Capabilities                                                                      |
| ------------- | --------------------------------------------------------------------------------- |
| **Super Admin** | Full platform control: manage admins, view all users/feedback, CRUD plans, assign plans |
| **Admin**       | Create/manage client users, assign plans to own clients, view own clients' feedback, change passwords |
| **Client**      | Set up review link, manage positive review samples, view negative feedback, view analytics, manage subscription |

### Data Isolation (RLS Enforced)
- **Admins** can only see users they created (`profiles.created_by = auth.uid()`)
- **Clients** can only see their own business data (`business_profiles.user_id = auth.uid()`)
- **Super Admins** have platform-wide visibility
- **Public** users can view business profiles by slug and submit feedback (no auth required)

---

## 8. Feature Documentation

### 8.1 Client Dashboard
- **Stats cards**: Total reviews added, page visitors, public links count, negative feedback count
- **Daily visitors chart**: Area chart showing 30-day page view trends
- **Daily breakdown chart**: Bar chart comparing positive redirects vs negative submissions
- **Plan expiry alert**: Warning banner when plan expires within 30 days

### 8.2 Review Link Setup
- Configure business name, Google Review URL, custom slug
- Upload business logo (max 2MB) and background image (max 5MB)
- Select visual theme: General, Jewellery, Salon/Spa, Restaurant/Café
- Choose brand color (hex color picker)
- Select Google Font from 10 curated options
- Generate QR code with optional logo overlay
- Copy public review link

### 8.3 Positive Reviews Management
- **Single add**: Write individual review samples with optional segment assignment
- **Bulk import**: Paste multiple reviews (one per line) for batch import
- **Segments**: Create categories (e.g., Food, Service, Quality) to organize reviews
- **Edit/Delete**: Inline editing and deletion of review samples
- **Filter**: View reviews by segment

### 8.4 Negative Feedback Viewer
- Table view of all privately captured feedback
- Shows rating (stars), feedback text, and date
- Read-only for clients

### 8.5 Admin Dashboard (Admin role)
- Quick stats: Total users and review links
- Full user management table with search and filtering
- **Actions per user**: Assign plan, enable/disable, change password, delete
- **Create User**: Dialog to create new client accounts (auto-confirmed email)
- **Export CSV**: Download filtered user list
- **Pagination**: 10 users per page
- **Plan expiry filters**: All, Active, Expiring in 7/30 days, Expired, No Plan

### 8.6 Super Admin Dashboard
- Platform-wide stats: Total admins, total users, total review links
- Full admin management (create/delete/disable admins)
- View all users across all admins with admin attribution
- Plan CRUD management (create, edit, delete, activate/deactivate plans)
- View all negative feedback across the platform

---

## 9. Edge Functions (Backend)

### `admin-users` Function
**Purpose**: Server-side user management operations requiring service role key.

| Action            | Who Can Call   | Description                                      |
| ----------------- | -------------- | ------------------------------------------------ |
| `create-user`     | Admin, SA      | Create a new user with auto-confirmed email      |
| `update-password` | Admin, SA      | Change a user's password                         |
| `delete-user`     | Admin, SA      | Delete a user account                            |

**Security**:
- Validates JWT and checks caller's role in `user_roles` table
- Admins can only manage users they created (`created_by` check)
- Cannot create/delete `super_admin` accounts
- Admins can only create `client` role users

### `razorpay` Function
**Purpose**: Handle Razorpay payment gateway integration.

| Action            | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `create-order`    | Creates Razorpay order (₹999 new / ₹499 renewal)        |
| `verify-payment`  | Verifies HMAC SHA256 signature and activates plan (365 days) |

**Flow**:
1. Client clicks "Buy" → Frontend calls `create-order`
2. Edge function creates Razorpay order and saves `payment_records` with status `created`
3. Razorpay checkout opens in browser
4. On success → Frontend calls `verify-payment`
5. Edge function verifies signature, updates `payment_records` to `paid`, upserts `user_plans`

---

## 10. Public Review Page

**URL**: `/review/:slug`

### Flow
1. Page loads → Fetches business profile by slug
2. Logs page view (analytics counter + `page_view_logs`)
3. Displays branded rating interface (1–5 stars)
4. **4–5 stars**: Shows positive review samples → User taps to copy → Auto-redirected to Google Reviews
5. **1–3 stars**: Shows private feedback form → Submitted to `negative_feedback` table
6. **Thank you**: Confirmation screen

### Features
- Multi-language support (English, Hindi, Marathi)
- Theme-aware styling (4 visual presets)
- Custom branding (logo, colors, fonts, background)
- Segment filtering for review samples
- Clipboard copy with toast notification
- Mobile-optimized responsive design

---

## 11. Subscription & Payments

### Pricing Model
- **New purchase**: ₹999/year
- **Renewal**: ₹499/year
- **Free trial**: 7-day plans can be assigned by admins

### Plan Assignment Methods
1. **Admin/Super Admin manual assignment**: Via user management dropdown
2. **Client self-purchase**: Via Razorpay on `/dashboard/subscription`

### Plan Expiration
- `PlanExpiryAlert` component shows warnings at 30/7/0 days
- Expired plans disable the public review page (enforced at application level)

---

## 12. File Storage

**Bucket**: `business-logos` (public)

| File Type        | Max Size | Path Format                    |
| ---------------- | -------- | ------------------------------ |
| Business logo    | 2MB      | `{user_id}/{timestamp}.{ext}`  |
| Background image | 5MB      | `{user_id}/bg-{timestamp}.{ext}` |

Accepted formats: JPG, PNG, WebP

---

## 13. Internationalization (i18n)

The public review page supports three languages:

| Language | Code | Label    |
| -------- | ---- | -------- |
| English  | `en` | English  |
| Hindi    | `hi` | हिन्दी    |
| Marathi  | `mr` | मराठी     |

Translation keys cover: rating prompt, negative feedback form, positive review instructions, thank you message, toast notifications, and error states.

Language toggle is a floating button on the public review page (top-right).

---

## 14. Theming & Branding

### Visual Themes (Public Review Page)

| Theme       | ID          | Style                                    |
| ----------- | ----------- | ---------------------------------------- |
| General     | `default`   | Clean purple/white, Space Grotesk font   |
| Jewellery   | `jewellery` | Dark/gold luxury, Playfair Display font  |
| Salon/Spa   | `salon`     | Soft pink pastels, Tenor Sans font       |
| Restaurant  | `restaurant`| Warm orange tones, Merriweather font     |

### Custom Branding (per business)
- **Brand color**: Overrides button/accent colors
- **Font family**: Overrides theme fonts (10 Google Fonts available)
- **Logo**: Displayed on the review card (max 240px wide, `object-contain`)
- **Background image**: Overrides theme background

### Dashboard Theme
The dashboard uses shadcn/ui design tokens with semantic CSS variables defined in `index.css`:
- `--primary`, `--secondary`, `--accent`, `--muted`, `--destructive`
- `--sidebar-*` tokens for navigation
- `--star`, `--star-empty` for rating displays
- `--success` for positive indicators

---

## 15. Security

### Row-Level Security (RLS)
All tables have RLS enabled with restrictive policies:

- **user_roles**: Users can view own role; Super Admins can manage all; Admins can view their created users' roles
- **profiles**: Users can view/update own; Admins can view/update own + created users; Super Admins have full access
- **business_profiles**: Owners have full CRUD; Public can read by slug; Admins/SA have read access to relevant profiles
- **analytics**: Read-only for owners, admins (scoped), and super admins
- **negative_feedback**: Public can insert (anonymous); Read access scoped by role
- **positive_reviews**: Owners can manage; Public can read
- **plans**: Public can read active plans; Super Admins can manage
- **user_plans**: Users can view own; Admins can manage their users'; Super Admins have full access
- **payment_records**: Users can insert/update/view own; Super Admins can view all

### Edge Function Security
- JWT validation on all requests
- Role verification using `user_roles` table with service role key
- Admin scope enforcement (admins can only manage users they created)
- Cannot create or delete `super_admin` accounts
- Razorpay signature verification using HMAC SHA256

### Best Practices Applied
- Roles stored in separate `user_roles` table (not in profiles)
- Security definer functions for role checks (prevents RLS recursion)
- Service role key only used server-side (edge functions)
- No client-side admin checks (all enforced via RLS + edge functions)

---

## 16. Deployment

### Frontend
- Deployed via Lovable's built-in publish feature
- Published to: `https://reviewsys.lovable.app`
- Frontend changes require clicking "Update" in publish dialog

### Backend
- Edge functions deploy automatically on code changes
- Database migrations deploy automatically
- No manual deployment steps needed

### Environment Variables (auto-managed)
- `VITE_SUPABASE_URL` — Backend API URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Public anon key
- `VITE_SUPABASE_PROJECT_ID` — Project identifier

### Secrets (configured in Lovable Cloud)
- `SUPABASE_SERVICE_ROLE_KEY` — For edge function admin operations
- `SUPABASE_DB_URL` — Database connection string
- `RAZORPAY_KEY_ID` — Razorpay publishable key
- `RAZORPAY_KEY_SECRET` — Razorpay secret key

---

## Project Structure

```
src/
├── App.tsx                          # Root component with routing
├── components/
│   ├── DashboardLayout.tsx          # Sidebar navigation layout
│   ├── NavLink.tsx                  # Navigation link component
│   ├── PlanExpiryAlert.tsx          # Plan expiry warning banner
│   ├── ProtectedRoute.tsx           # Route guard with role checking
│   └── ui/                          # shadcn/ui component library
├── hooks/
│   ├── useAuth.tsx                  # Auth context provider + hook
│   ├── use-mobile.tsx               # Mobile breakpoint hook
│   └── use-toast.ts                 # Toast notification hook
├── integrations/supabase/
│   ├── client.ts                    # Supabase client (auto-generated)
│   └── types.ts                     # Database types (auto-generated)
├── lib/
│   ├── reviewThemes.ts              # Theme definitions for public page
│   ├── translations.ts             # i18n translations (en/hi/mr)
│   └── utils.ts                     # Utility functions (cn, etc.)
├── pages/
│   ├── Index.tsx                    # Marketing landing page
│   ├── LoginPage.tsx                # Auth (login/signup/forgot)
│   ├── ResetPasswordPage.tsx        # Password reset
│   ├── PublicReviewPage.tsx         # Public review collection page
│   ├── ClientDashboard.tsx          # Client overview dashboard
│   ├── ReviewLinkSetup.tsx          # Review link configuration
│   ├── PositiveReviewsPage.tsx      # Manage review samples
│   ├── NegativeFeedbackPage.tsx     # View negative feedback
│   ├── SubscriptionPage.tsx         # Plan purchase (Razorpay)
│   ├── AdminDashboard.tsx           # Admin user management
│   ├── AdminFeedbackPage.tsx        # Admin/SA feedback viewer
│   ├── AdminPlansPage.tsx           # SA plan management
│   ├── SuperAdminDashboard.tsx      # SA overview dashboard
│   ├── SuperAdminAdminsPage.tsx     # SA admin management
│   ├── SuperAdminUsersPage.tsx      # SA all users viewer
│   └── NotFound.tsx                 # 404 page
└── index.css                        # Design tokens & global styles

supabase/
├── config.toml                      # Supabase configuration
├── functions/
│   ├── admin-users/index.ts         # User management edge function
│   └── razorpay/index.ts            # Payment gateway edge function
└── migrations/                      # Database migration files
```
