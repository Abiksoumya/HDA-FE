# HMIS — Haldia Development Authority
### React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Redux Toolkit + redux-persist

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

---

## 📁 Project Structure

```
src/
├── apis/                  # Typed Axios API calls
│   ├── common/            # commonApi.ts (menus, dropdowns, hospitals)
│   └── master/            # companyApi, departmentApi, adminGroupApi, companyDepartmentApi
├── components/
│   ├── layout/            # AdminPanel, Topbar, Sidebar
│   ├── pages/             # Login, Dashboard, FileUpload, NotFound
│   │   └── master/        # company/, department/, admin-group/, company-department/
│   ├── panels/            # Modal, ToastContainer
│   ├── shared/            # PageCard, DataTable, FormField, PageLoader
│   └── ui/                # Button (shadcn pattern)
├── hooks/                 # redux.ts, useToast.ts, useModal.ts
├── store/                 # Redux store + slices
│   └── slices/            # authSlice, uiSlice, opdSlice
├── types/                 # index.ts — all TypeScript interfaces
└── utils/                 # apiClient.ts, config.ts, cn.ts, menuTransformer.ts
```

---

## 🔑 Key Architectural Decisions

| Concern | Decision |
|---|---|
| **Auth** | Redux `authSlice` with `redux-persist` (replaces AuthContext) |
| **Token storage** | `localStorage` + Redux state (persisted) |
| **Toast/Alerts** | Redux `uiSlice` → `ToastContainer` (replaces `alert()`) |
| **Confirm dialogs** | Promise-based `useModal()` hook + Radix Dialog |
| **Styling** | Tailwind CSS + custom utility classes + shadcn component patterns |
| **Build tool** | Vite (replaces Create React App) |
| **Routing** | React Router v6 with lazy-loaded pages |

---

## 🎨 Design System

- **Theme**: Futuristic white with blue accents (`#2563eb`)
- **Animations**: `animate-fade-in`, `animate-spin`, shimmer skeleton
- **Responsive**: Mobile-first grid layout; sidebar collapses on toggle
- **Accessibility**: ARIA labels, keyboard nav, focus rings on all interactive elements

---

## 🛠 Environment

The API base URL is in `src/utils/config.ts`:

```ts
export const API_BASE_URL = 'http://103.171.45.210:8090';
```

Change this before deploying.

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `@reduxjs/toolkit` | State management |
| `redux-persist` | Persist auth state across page reloads |
| `react-redux` | React bindings |
| `react-router-dom` v6 | Routing |
| `react-hook-form` + `yup` | Form validation |
| `axios` | HTTP client |
| `tailwindcss` | Utility-first styling |
| `@radix-ui/*` | Accessible headless UI primitives (shadcn base) |
| `lucide-react` | Icons |
| `jwt-decode` | Token expiry validation |
| `lodash.debounce` | Debounced search inputs |

---

## ✅ What Changed from the Original

- ❌ `AuthContext` removed → ✅ `authSlice` (Redux + redux-persist)
- ❌ `alert()` / `confirm()` → ✅ Promise-based Modal + Toast system
- ❌ Bootstrap CSS → ✅ Tailwind CSS + shadcn component patterns
- ❌ Create React App → ✅ Vite (faster HMR, proper TS paths)
- ❌ `.js` / `.jsx` → ✅ `.ts` / `.tsx` throughout
- ❌ CSS files scattered → ✅ Single `index.css` with Tailwind layers
- ✅ Full TypeScript types for all API responses and form values
- ✅ Reusable `DataTable` component with search + pagination
- ✅ Reusable `PageCard`, `FormField` layout components
- ✅ Futuristic white theme with smooth animations
- ✅ Responsive layout (mobile sidebar toggle)
