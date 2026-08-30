# Central Placement Management Portal
### **Rathinam College of Arts & Science**
*An Intelligent, Enterprise-Grade Campus Recruitment & Placement Management System*

---

## 🏛️ Project Overview

The **Central Placement Management Portal** is a production-ready web application built for the Placement Cell of **Rathinam College of Arts & Science**. It centralizes the end-to-end recruitment ecosystem: from student profile repositories and corporate partner pipelines to Job Description (JD) text extraction, TF-IDF/NLP-powered ATS resume matching, real-time drive logging, and placement intelligence reporting.

---

## 🚀 Key Technologies & Stack

### **Frontend**
- **React.js 19** & **Vite**: Ultra-fast component rendering and HMR.
- **Tailwind CSS v4**: Modern, responsive styling with theme-based design tokens.
- **Recharts**: Interactive department-wise placement charts and progress distributions.
- **Axios**: HTTP client with request interceptors injecting RBAC session credentials (`X-User-Email`).
- **Lucide React**: Clean icons throughout the interface.
- **SheetJS (xlsx)**: Client-side Excel template generation.

### **Backend**
- **FastAPI (Python 3.11+)**: Asynchronous, performant REST API.
- **SQLAlchemy & SQLite / PostgreSQL**: Enterprise ORM with cascade handling and relationship integrity.
- **Pydantic v2**: Data validation schemas and serializable models.
- **openpyxl & Pandas**: Excel validation, schema normalization, and bulk data parsing.

### **Data Science & ATS Intelligence**
- **Scikit-learn**: TF-IDF Vectorizer and Cosine Similarity algorithms for automated candidate scoring against extracted JD skills.
- **PyMuPDF (fitz)**: Document text extraction from uploaded resume and JD files.

---

## 🛡️ Role-Based Access Control (RBAC) & Access Hierarchy

The portal implements strict authorization across both the **frontend UI** and **backend API dependencies** (`auth_deps.py`). Every protected endpoint validates identity and permission level, returning `HTTP 403 Forbidden` on unauthorized operations.

```
                  ┌─────────────────────────────────────────┐
                  │          Dr. Sivasubramaniam            │
                  │        Head of Placement (Admin)        │
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────┴────────────────────┐
                  │             Dr. Jeyakannan              │
                  │           Placement Manager             │
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────┴────────────────────┐
                  │        Placement Team Members           │
                  │   Team Member 1, 2, 3, 4 (Officers)     │
                  └─────────────────────────────────────────┘
```

### **Permission Matrix**

| Feature / Module | Admin (`Dr. Sivasubramaniam`) | Manager (`Dr. Jeyakannan`) | Team Members (`Team Member 1-4`) |
| :--- | :---: | :---: | :---: |
| **System Dashboard** | Full System KPIs & Pipeline | Student & Team Performance KPIs | Assigned Pipeline & Active Leads |
| **Student Directory** | View, Add, Edit, Delete, Archive | View, Add, Edit, Delete, Archive | View-Only (Read-Only) |
| **Bulk Excel Import** | ✅ Full Access | ✅ Full Access | ❌ Forbidden (403) |
| **Company Leads** | All Leads & Full Oversight | ❌ Forbidden (403) | Own Assigned Leads Only |
| **Lead Approval** | ✅ Approve / Reject | ❌ Forbidden (403) | ❌ Forbidden (403) |
| **Submit for Approval** | ❌ (Reviewer Only) | ❌ Forbidden (403) | ✅ Allowed for Assigned Leads |
| **Approved Companies** | View All 20 Partners | ❌ Forbidden (403) | View Assigned Partners |
| **ATS Resume Matcher** | Any Approved Company | ❌ Forbidden (403) | Assigned Companies Only |
| **Drive Completion** | Any Approved Drive | ❌ Forbidden (403) | Assigned Companies Only |
| **Report: Registered** | ✅ Allowed | ❌ Forbidden (403) | ✅ Allowed (Assigned) |
| **Report: Completed** | ✅ Allowed | ✅ Allowed | ✅ Allowed (Assigned) |
| **Report: Student Status**| ✅ Allowed | ✅ Allowed | ❌ Forbidden (403) |
| **Report: Lead Pipeline**| ✅ Allowed | ❌ Forbidden (403) | ✅ Allowed (Assigned) |
| **Staff User Provisioning**| ✅ Allowed | ❌ Forbidden (403) | ❌ Forbidden (403) |

---

## 🔑 Pre-Configured Demo Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Head of Placement (Admin)** | Dr. Sivasubramaniam | `admin@college.edu` | `admin123` |
| **Placement Manager** | Dr. Jeyakannan | `manager@college.edu` | `manager123` |
| **Placement Team Member 1** | Team Member 1 | `team1@college.edu` | `team123` |
| **Placement Team Member 2** | Team Member 2 | `team2@college.edu` | `team123` |
| **Placement Team Member 3** | Team Member 3 | `team3@college.edu` | `team123` |
| **Placement Team Member 4** | Team Member 4 | `team4@college.edu` | `team123` |

---

## 📊 Source of Truth Data Integration

The database is directly initialized from the authoritative Excel files in `/data`:
1. **`100_Students_List.xlsx`**:
   - Master directory of **100 students** across 5 academic departments:
     - Computer Science (24)
     - Cyber Security (21)
     - Business Administration (21)
     - Information Technology (19)
     - Electronics and Communication (15)
   - Real-time placement status: **70 Placed**, **30 Yet to be Placed**.
   - Note: `PG %` is intentionally `NULL` as an optional academic field.
2. **`Companies_List.xlsx`**:
   - **20 Verified Corporate Partners** (e.g., Google India, Microsoft India, Amazon, Zoho Corporation, Qualcomm, Cisco, Adobe).
   - Embedded Job Description text summaries and official career rendering links.
   - Distinct **Company Tier** classification: `Tier 1`, `Tier 2`, and `Tier 3`.
   - **70 Placement Records** linking students directly to their respective recruiters.

---

## ⚙️ Setup and Running Instructions

### **1. Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment (optional)
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Seed database from /data source files
python -m app.seed

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at `http://localhost:8000` (Swagger docs at `/docs`).

---

### **2. Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend Portal will be accessible at `http://localhost:5173`.

---

### **3. Automated Test Verification**
```bash
# In the backend directory:
python test_complete.py  # Verifies authentication, logins, user provisioning
python test_rbac.py      # Verifies 100% of the RBAC authorization matrix
```

---

## 🏫 Institutional Identity
- **Institution**: Rathinam College of Arts & Science (RCAS & RTC)
- **Portal**: Central Placement Management Portal
- **Head of Placement**: Dr. Sivasubramaniam
