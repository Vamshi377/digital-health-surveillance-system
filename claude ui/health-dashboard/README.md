# HealthPulse — Digital Health Record System UI

A premium, modern healthcare dashboard built with **React + Vite**.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173 and sign in.

---

## 📁 Project Structure

```
src/
├── App.jsx                   # Root router
├── main.jsx                  # Entry point
├── index.css                 # Global design system / CSS variables
│
├── context/
│   └── AuthContext.jsx       # Auth state (wire up real API here)
│
├── services/
│   └── api.js                # ⭐ Central API service — connect your backend here
│
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.jsx
│   │   ├── Sidebar.jsx
│   │   └── Header.jsx
│   └── ui/
│       ├── Logo.jsx
│       ├── StatCard.jsx
│       └── index.jsx          # Badge, Avatar, SectionCard, Tag, EmptyState
│
└── pages/
    ├── LoginPage.jsx           # Role-based login
    ├── ReceptionDashboard.jsx  # Queue, register patient, appointments
    ├── NurseDashboard.jsx      # Nurse queue, vitals entry, medical records
    ├── LabDashboard.jsx        # Lab queue, upload reports, file attachment
    ├── DoctorDashboard.jsx     # Patient summary, diagnosis, prescription
    ├── PatientDashboard.jsx    # Notifications, records, prescriptions, reports
    ├── AdminDashboard.jsx      # Pending user approvals, user management
    └── DMODashboard.jsx        # Analytics, disease trends, district insights
```

---

## 🔌 Connecting Your Backend

All API calls are centralized in `src/services/api.js`.

1. Set your backend URL in `.env`:
   ```
   VITE_API_BASE_URL=http://your-backend.com/api/v1
   ```

2. Each page uses placeholder/mock data. Replace mock data with API calls like:
   ```js
   import api from '../services/api';

   // Example in a component
   const [patients, setPatients] = useState([]);
   useEffect(() => {
     api.patients.list().then(setPatients).catch(console.error);
   }, []);
   ```

3. In `AuthContext.jsx`, replace the mock `login()` function with:
   ```js
   const login = async (credentials) => {
     const user = await authApi.login(credentials);
     localStorage.setItem('auth_token', user.token);
     setUser(user);
     return user;
   };
   ```

---

## 🎨 Design System

CSS variables are defined in `index.css`:

| Variable | Value | Usage |
|---|---|---|
| `--teal-800` | `#0A5C7A` | Primary brand color |
| `--teal-600` | `#1497C8` | Hover states, focus rings |
| `--accent-emerald` | `#10B981` | Success, positive |
| `--accent-rose` | `#F43F5E` | Danger, alerts |
| `--font-display` | DM Serif Display | Headings, stat values |
| `--font-body` | DM Sans | Body text, UI |

---

## 🧑‍💻 Roles

| Role | Login Emoji | Default Route |
|---|---|---|
| Reception | 🏥 | `/reception` |
| Nurse | 💉 | `/nurse` |
| Lab | 🔬 | `/lab` |
| Doctor | ⚕️ | `/doctor` |
| Patient | 🩺 | `/patient` |
| Admin | 🛡️ | `/admin` |
| DMO | 📊 | `/dmo` |

---

## 📦 Dependencies

- `react` + `react-dom` — UI framework
- `react-router-dom` — Routing
- `recharts` — Charts (DMO analytics)
- `lucide-react` — Icons
- `date-fns` — Date utilities

---

Built with ❤️ — HealthPulse Digital Health Record System
