# Frontend Handoff Documentation — Kalliq Voice Call Manager

**Entry Point:** `src/main.tsx`  
**Build Tool:** Vite  
**Dev Server:** Port 5173 (default)  
**Production Build:** `npm run build` → `dist/`

---

## Architecture Overview

### Tech Stack

- **React 19** + **TypeScript**
- **Material-UI (MUI) v6** — Component library
- **Vite** — Build tool and dev server
- **React Router DOM** — Routing (`HashRouter`)
- **Zustand** — Global state management (`useAppStore`)
- **Axios** — HTTP client (baseURL: `${cfg.backendUrl}/api`)
- **Socket.IO Client** — Real-time updates
- **Tiptap** — Rich text editor (React 19 compatible)

### Entry Point & Routing

**File:** `src/main.tsx`

```typescript
// Provider hierarchy:
ThemeProvider → SnackbarProvider → AuthProvider → SettingsProvider 
  → LocalizationProvider → HashRouter → App
```

**File:** `src/App.tsx`

- **Public Route:** `/` → `SignIn` page
- **Admin Routes:** Wrapped in `<AdminLayout />`
  - `/dashboard`, `/campaign`, `/lists`, `/contacts`, `/tasks`, `/settings`, etc.
- **Superadmin Routes:** Wrapped in `<SuperadminRoute />` + `<WithHeader />`
  - `/superdashboard`, `/superdashboard/numbers-pool`, `/superdashboard/users`

---

## Layout System

### AdminLayout (`src/layouts/AdminLayout.tsx`)

**Used for:** All admin routes (dashboard, campaign, lists, contacts, etc.)

**Structure:**
- **Left Sidebar:** Collapsible drawer with navigation menu
- **Top AppBar:** Search, phone dialer, **notifications bell**, settings, avatar
- **Main Content:** `<Outlet />` renders child routes

**Notifications:**
- Bell icon in AppBar (line 542-546)
- Menu dropdown (lines 547-597)
- **Real-time:** Fetches from `/api/notifications`, subscribes to `notification:new` socket event
- **State:** `notifications`, `loadingNotifications` (lines 116-117)
- **Socket subscription:** Lines 141-161

### Header (`src/components/Header.tsx`)

**Used for:** Superadmin routes only (via `WithHeader` HOC)

**Structure:**
- Simple AppBar with logo, add menu, phone, **notifications bell**, avatar
- **Notifications:** Same real-time pattern as AdminLayout (lines 122-162)

### WithHeader (`src/hocs/WithHeader.tsx`)

**Purpose:** HOC that wraps superadmin pages with Header component

---

## State Management

### Global Store (`src/store/useAppStore.tsx`)

**Zustand store** with:

```typescript
{
  user: { id, name, role } | null,
  settings: Record<string, any> | null,
  lists: Record<string, any>[] | null,
  callStats: CallStat | null,
  // Actions: setUser, setSettings, fetchLists, etc.
}
```

**Usage:**
```typescript
import useAppStore from "../store/useAppStore";
const { user, setUser } = useAppStore();
```

### Contexts

- **AuthContext** (`src/contexts/AuthContext.tsx`) — Authentication state
- **SettingsContext** (`src/contexts/SettingsContext.tsx`) — Settings data
- **TwilioContext** (`src/contexts/TwilioContext.tsx`) — Twilio device state
- **GoogleCalendarContext** (`src/contexts/GoogleCalendarContext.tsx`) — Calendar integration

---

## API Layer

### Axios Instance (`src/utils/axiosInstance.ts`)

```typescript
baseURL: `${cfg.backendUrl}/api`
withCredentials: true  // Sends cookies for auth
```

**Error Handling:**
- 401 → Auto-logout (except `/auth/me`)
- 500 → Error message in console

**Usage:**
```typescript
import api from "../utils/axiosInstance";
await api.get("/notifications?limit=50");
await api.post("/email/gmail/send", { ... });
```

### Config (`src/config.ts`)

```typescript
{
  backendUrl: process.env.VITE_BACKEND_URL,
  backendDomain: process.env.VITE_BACKEND_DOMAIN,
  isDevMode: process.env.MODE === "development"
}
```

---

## Socket.IO Integration

### Client Init (`src/utils/initSocket.ts`)

**Function:** `initSocket(userId: string)`

**Behavior:**
- Creates Socket.IO client connection to `config.backendDomain`
- Joins room: `user-${userId}`
- Returns socket instance for event subscription

**Usage in components:**
```typescript
const socket = initSocket(user.id);
socket.on("notification:new", (notification) => {
  // Handle new notification
});
```

**Cleanup:**
```typescript
return () => {
  socket.off("notification:new");
};
```

---

## Email System

### Send Email Modal (`src/components/SendEmailModal.tsx`)

**Purpose:** Unified email composer (replaces all inline compose forms)

**Features:**
- Template dropdown (populates subject + body)
- Rich text editor (Tiptap)
- Auto-appends signature to body
- Gmail connection status check
- Sends via `POST /api/email/gmail/send`

**Key Logic:**
- **Signature append:** Helper functions `normalizeText`, `isHtmlEmpty`, `containsSignature`, `withSignature`
- **Auto-append triggers:** Modal open (if body empty), template selection, before send
- **Editor lock:** `readOnly` only when Gmail disconnected or sending

**Props:**
```typescript
{
  open: boolean,
  onClose: () => void,
  contactId: string,
  contactEmail: string,
  onSuccess?: () => void
}
```

### Email Templates (`src/components/forms/EmailTemplatesListComponent.tsx`)

**Location:** Settings → Email Settings → Templates

**Features:**
- List view with search
- Create/Edit templates via `EmailTemplateEditorComponent`
- Templates stored per user (Personal) or org (Organization)

**Endpoints:**
- `GET /api/email/templates`
- `POST /api/email/templates`
- `PUT /api/email/templates/:id`
- `DELETE /api/email/templates/:id`

### Email Signature (`src/components/forms/EmailSignatureFormComponent.tsx`)

**Location:** Settings → Email Settings → Signature

**Features:**
- Rich text editor for signature HTML
- Auto-saves on "Save" button
- Persisted per user

**Endpoints:**
- `GET /api/email/signature` → `{ html: "..." }`
- `PUT /api/email/signature` → `{ html: "..." }`

### Email Account (`src/components/forms/EmailAccountFormComponent.tsx`)

**Location:** Settings → Email Settings → Accounts

**Features:**
- Connect/Disconnect Gmail OAuth
- Shows connection status

**Endpoints:**
- `GET /api/email/gmail/status`
- `GET /api/auth/google` (OAuth start)
- `DELETE /api/email/gmail/disconnect`

---

## Rich Text Editor

### Component (`src/components/RichTextEditor.tsx`)

**Technology:** Tiptap (React 19 compatible)

**Extensions:**
- Starter Kit (bold, italic, headings, lists, etc.)
- Text Align
- Color
- TextStyle
- Underline
- Link

**Props:**
```typescript
{
  value: string,           // HTML content
  onChange: (html: string) => void,
  placeholder?: string,
  readOnly?: boolean,
  minHeight?: string,
  editorRef?: (editor: any) => void,
  triggerReset?: string | number  // When this changes, resets editor to value
}
```

**Important:** Editor is **uncontrolled** — only resets content when `triggerReset` prop changes (used for template/signature application).

---

## Notifications UI

### AdminLayout Notifications (`src/layouts/AdminLayout.tsx`)

**Location:** Top AppBar, bell icon (line 542)

**Implementation:**
- State: `notifications[]`, `loadingNotifications` (lines 116-117)
- Fetch on mount: `GET /api/notifications?limit=50` (lines 126-137)
- Socket subscription: `notification:new` (lines 141-161)
- Badge: Shows unread count (line 237, rendered at line 543)
- Menu: Maps notifications to MenuItems (lines 567-591)

**Deduplication:**
- Frontend checks `id` or `meta.messageId` before prepending (lines 146-152)

### Header Notifications (`src/components/Header.tsx`)

**Location:** Superadmin routes only

**Implementation:**
- Same pattern as AdminLayout (lines 122-162)
- Same socket subscription and dedupe logic

---

## Settings System

### Settings Registry (`src/registry/settings-component-registry.ts`)

**Purpose:** Maps settings categories + sub-items to React components

**Structure:**
```typescript
{
  "Phone Settings": {
    powerDialerManagement: PowerDialerManagementFormComponent,
    ...
  },
  "Email Settings": {
    emailAccount: EmailAccountFormComponent,
    signature: EmailSignatureFormComponent,
    templates: EmailTemplatesListComponent,
  },
  ...
}
```

**Usage:** `Settings` page renders components based on selected category + sub-item.

---

## Key Utilities

### `src/utils/translateToTitleCase.ts`
- Converts `camelCase` → `Title Case` for UI labels

### `src/utils/initSocket.ts`
- Socket.IO client initialization

### `src/utils/axiosInstance.ts`
- HTTP client with auth interceptors

### `src/hooks/useSnackbar.tsx`
- Global snackbar/toast notifications

---

## File Structure

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Router setup
├── config.ts                   # Environment config
├── theme.ts                    # MUI theme
├── components/
│   ├── Header.tsx              # Superadmin header (with notifications)
│   ├── SendEmailModal.tsx      # Email composer
│   ├── RichTextEditor.tsx      # Tiptap editor
│   └── forms/
│       ├── EmailAccountFormComponent.tsx
│       ├── EmailSignatureFormComponent.tsx
│       ├── EmailTemplatesListComponent.tsx
│       └── EmailTemplateEditorComponent.tsx
├── layouts/
│   └── AdminLayout.tsx         # Admin routes layout (with notifications)
├── pages/
│   ├── SignIn.tsx
│   └── admin/                  # Admin pages
├── contexts/                   # React contexts
├── store/
│   └── useAppStore.tsx         # Zustand global store
├── hooks/                      # Custom React hooks
├── utils/                      # Utility functions
└── registry/
    └── settings-component-registry.ts
```

---

## Environment Variables

### Required (`voice-call-manager-fe/.env`)

```bash
VITE_BACKEND_URL=http://localhost:3000
VITE_BACKEND_DOMAIN=http://localhost:3000
```

**Usage:**
- `VITE_BACKEND_URL` → Axios baseURL (`${cfg.backendUrl}/api`)
- `VITE_BACKEND_DOMAIN` → Socket.IO connection

---

## Common Issues

### Notifications Not Appearing

**Check:**
1. User ID exists: `useAppStore().user?.id` must be truthy
2. API call succeeds: `GET /api/notifications?limit=50` returns 200
3. Socket connected: Browser console shows "Connected to backend socket"
4. Socket subscription: `socket.on("notification:new", ...)` is called
5. Component mounted: `AdminLayout` or `Header` is rendered

### Rich Text Editor Not Editable

**Check:**
- `readOnly` prop is `false`
- `gmailStatus` is loaded (not `null` or `{ connected: false }`)
- Editor is not locked due to `shouldLockEditor` logic in `SendEmailModal`

**Fix:** Editor should only be locked when Gmail is **known** to be disconnected, not while loading.

### Template/Signature Not Saving

**Check:**
- Backend logs show: `markModified("Email Settings")` before `save()`
- Mongoose Mixed fields require `markModified()` for deep changes

---

## Recent Changes

1. **Notifications MVP:**
   - Replaced mock notifications with real API + Socket.IO
   - `AdminLayout.tsx` lines 116-162, 237-272, 542-597
   - `Header.tsx` lines 122-162

2. **Email System:**
   - Unified composer: `SendEmailModal.tsx`
   - Templates: `EmailTemplatesListComponent.tsx`, `EmailTemplateEditorComponent.tsx`
   - Signature: `EmailSignatureFormComponent.tsx`

3. **Rich Text Editor:**
   - Switched from `react-quill` to `@tiptap/react` (React 19 compatibility)
   - Made editor uncontrolled to fix typing issues

---

**END OF FRONTEND HANDOFF**
