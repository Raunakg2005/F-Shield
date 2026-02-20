<div align="center">
  <img src="https://img.icons8.com/nolan/256/1A6DFF/C822FF/fraud.png" alt="FraudSense Icon" width="120" />
  <h1>FraudSense</h1>
  <p><b>Algorithmic Transaction Intelligence & Graph-Based Collusion Detection</b></p>
  
  <p>
    <a href="#machine-learning-architecture">ML Architecture</a> •
    <a href="#core-capabilities">Capabilities</a> •
    <a href="#project-directory-structure">Structure</a> •
    <a href="#local-environment-setup">Installation</a> •
    <a href="#api-reference">API Docs</a>
  </p>
</div>

---

## 📌 Executive Summary

**FraudSense** is an enterprise-grade, ML-driven transaction monitoring platform tailored for detecting anomaly patterns, synthetic identities, and multi-tenant fraud rings. Utilizing an **Isotonic-Calibrated XGBoost pipeline** underneath a high-performance React Command Center, it provides compliance officers and risk investigators with real-time **Explainable AI (XAI)** telemetry.

While standard rule-based fraud systems suffer from massive false-positive rates and opaque edge-cases, FraudSense integrates a 4-layer proprietary detection engine. It evaluates raw metadata, temporal velocity heuristics, historic baselines, and cross-vendor topology graphs to assign a true mathematical probability of fraud to every ledger entry.

---

## 🔬 Machine Learning Architecture

FraudSense bypasses standard logistic models in favor of a robust Gradient Boosting framework, deliberately tuned and calibrated for the extreme class imbalances inherent to financial fraud datasets.

### 1. XGBoost Core (Extreme Gradient Boosting)
- **Objective:** `binary:logistic`.
- **Handling Class Imbalance:** Utilizes `scale_pos_weight` dynamically calculated during the training pipeline (`Num_Negative / Num_Positive`) to aggressively penalize falsely clearing fraudulent transactions.
- **Regularization:** Employs L1 (`alpha`) and L2 (`lambda`) regularization directly within the booster to prevent overfitting on synthetic identity markers.

### 2. Isotonic Probability Calibration
Raw XGBoost margins are highly uncalibrated, often clustering probabilities around non-linear thresholds. FraudSense wraps the XGBoost classifier in `sklearn.calibration.CalibratedClassifierCV(method='isotonic')`.
- Ensures the model outputs a monotonic, strictly distributed confidence percentage (0.00% to 100.00%) that can be reliably used for rigid thresholding (e.g., Auto-Decline > 85%).

### 3. Explainable AI (SHAP Integration)
Black-box ML is unacceptable in financial compliance. FraudSense uses the **SHapley Additive exPlanations (SHAP)** TreeExplainer.
- On every flagged transaction, the engine computes the exact local SHAP force values.
- The UI translates these mathematical vectors into human-readable strings (e.g., *"num_txns_last_24h pushed risk up by 24%"*).

### 4. PageRank Topological Networking (Layer 4)
Fraud rings often use identical, seemingly benign "shell" vendors distributed across multiple stolen business identities.
- Using **NetworkX**, the backend builds an in-memory directed graph (`Business → Vendor`).
- The engine calculates the **PageRank centrality** of every vendor. If a vendor suddenly receives immense centrality combined with high financial concentration, the network graph flags the entity as a Collusion Risk, dynamically overriding the XGBoost baseline.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend Runtime** | React 18, Vite, TypeScript | Type-safe, high-performance UI rendering |
| **Styling & Animation** | Tailwind CSS, Framer Motion | Glassmorphic design and fluid viewport transitions |
| **Graph Visualization** | React Force Graph 2D | GPU-accelerated Canvas rendering for collision networks |
| **Backend API** | Python 3.9+, Flask, Flask-CORS | REST API serving ML predictions and data ingestion |
| **Database ORM** | SQLAlchemy (SQLite / PostgreSQL) | Persistent storage of ledgers and metadata |
| **Machine Learning** | XGBoost, Scikit-learn, Pandas | Model training, inference, and data manipulation |
| **Auth & Security** | Firebase Admin SDK, PyJWT | Cryptographic JWT verification and Session Management |

---

## 🛡️ Core Capabilities & User Flow

1. **Algorithmic Threat Detection (Ingestion)**
   - Businesses can upload massive raw CSV ledger files directly through the command center.
   - The Python backend intercepts the upload, vectorizes the strings in memory, runs the features through the calibrated pipeline, and instantly drops the results into the database.
   
2. **Investigator Action Queue (Triage)**
   - The `/alerts` dashboard provides a staggering, prioritized queue separating "Critical" and "High" risk transactions away from the standard ledger for human-in-the-loop review.
   
3. **Transaction Telemetry (Investigation)**
   - Deep-dive views into specific transactions. The UI displays the exact SHAP features (e.g., `time_since_last_txn`, `vendor_risk_score`) that caused the deviation.
   - Render variables like `amount` vs `historical_business_average`.
   
4. **Resolution Feedback Loop (Actuation)**
   - Cryptographically tracks investigator decisions (`Confirmed Fraud` or `False Positive`).
   - These human dispositions are designed to be fed back into the continuous training script, slowly dampening false positives over time without sacrificing recall.
   
5. **Global Preferences (Configuration)**
   - Allows super-admins to modify global strict tolerances (e.g., modifying the auto-quarantine threshold from 75% to 50%).
   - Instantly enforce network halts across specific Region ISO codes or Vendor IDs.

---

## 📁 Project Directory Structure

FraudSense operates as a monolithic repository separating the high-performance ML API from the React UI.

```text
fraud-sense/
├── backend/                        # ML & Flask Application
│   ├── app.py                      # Flask entry point & middleware registration
│   ├── database.py                 # SQLAlchemy ORM schemas
│   ├── firebase_middleware.py      # JWT validation auth wrapper
│   ├── fraud_pipeline.pkl          # Serialized XGBoost/Isotonic ML binary
│   │
│   ├── fraud_engine/               # Core Analytical Runtime
│   │   ├── engine.py               # Feature extractor & SHAP explainer
│   │   └── network.py              # Vendor topology PageRank algorithm
│   │
│   ├── ml/                         # Model Retraining Pipeline
│   │   ├── dataset_generation.py   # Synthesizer for ledger anomalies
│   │   └── train_model.py          # Time-split XGBoost fitting script
│   │
│   └── routes/                     # REST API Endpoints
│       ├── fraud.py                # Admin health, graphs, and action queues
│       └── transactions.py         # CSV ingestion & single-ledger views
│
├── kharghar/                       # Command Center (React + TypeScript)
│   ├── src/
│   │   ├── main.tsx                # StrictMode Entry
│   │   ├── App.tsx                 # Core dynamic router
│   │   ├── components/             # Reusable UI components (Navbar, DataTables, Loading)
│   │   ├── firebase/               # Firebase Client initialization (firebase.ts)
│   │   ├── pages/                  # Views (Dashboard, Alerts, NetworkGraph, Admin, Profile)
│   │   ├── services/               # REST HTTP fetch wrappers (api.ts)
│   │   └── types.ts                # Strict TypeScript interface definitions
│   │
│   ├── index.css                   # Global Tailwind directives & theming variables
│   ├── tailwind.config.js          # Extended 'cyber' colors and glassmorphic utility rules
│   ├── vite.config.ts              # Vite bundling configs
│   └── package.json                # NPM dependency mapping
│
├── .gitignore                      # Monorepo root gitignore mapping
└── README.md                       # Comprehensive markdown documentation
```

---

## 💻 Local Environment Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **Python**: 3.9.x or higher
- **Firebase Account**: Required for Authentication and Session JWTs.

### 1. Environment Configuration

Because this is a decoupled architecture, you must create two separate `.env` files for the Frontend and Backend to communicate properly over CORS.

**Step 1A: Backend Env (`backend/.env`)**
Create this file inside the `backend/` directory:
```env
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
PORT=5000

# Security (Replace with a secure 32-byte random string)
SECRET_KEY=your_secure_flask_secret_key_here

# SQLite Database is used by default. For production PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost/dbname
```

**Step 1B: Frontend Env (`kharghar/.env`)**
Create this file inside the `kharghar/` directory:
```env
# API Routing
VITE_API_URL=http://localhost:5000

# Firebase Configuration
# Replace these with your web app firebaseConfig payload
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Admin SDK Configuration
The Python backend uses the Firebase Admin SDK to verify the JWTs sent by the React frontend.
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Select your provisioned project.
3. Go to **Project Settings** (Gear icon) > **Service Accounts**.
4. Click **Generate new private key**.
5. Move the downloaded JSON file into the `backend/` directory.
6. **RENAME** the file exactly to `firebase-adminsdk.json`.

*(Note: The root `.gitignore` is pre-configured to ignore this file. Never commit your Admin SDK certificate to GitHub).*

### 3. Bootstrapping the Backend Server
Open a terminal instance, navigate to the backend, build the environment, and boot the ML engine:
```bash
cd backend

# Create an isolated python virtual environment
python -m venv venv

# Activate the virtual environment (Windows)
venv\Scripts\activate

# Activate the virtual environment (macOS/Linux)
# source venv/bin/activate

# Install strictly pinned dependencies
pip install -r requirements.txt

# Start the Flask API server
# It will run internally on 127.0.0.1:5000
python app.py
```

### 4. Bootstrapping the Frontend Server
Open a secondary independent terminal instance for the React application:
```bash
cd kharghar

# Install node module tree
npm install

# Start the Vite development and Hot-Module Replacement server
npm run dev
```
Navigate your browser to `http://localhost:5173`. If everything is connected, you can register an account and view the Command Center!

---

## 🧠 Model Retraining & Fine-Tuning Pipeline

FraudSense ships with a pre-trained serialized model binary (`backend/fraud_pipeline.pkl`) to ensure the repository works out-of-the-box for reviewers and stakeholders. 

If you wish to modify the subjective feature engineering rules, ingest your own proprietary corporate datasets, or adjust the calibration thresholds, you can trigger the training pipeline locally.

**Running the Training Script:**
```bash
cd backend
python ml/train_model.py
```

**What this script automates:**
1. **Synthetic Ledger Generation**: Spawns `test_dataset.csv` utilizing parameterized logic to distribute anomalies (e.g. forced velocity spikes, impossible geolocation hopping).
2. **Train/Test Splitting**: Uses standard `Sklearn.model_selection` to slice the ledger chronologically to prevent temporal data leakage.
3. **Pipeline Assembly**: Creates a continuous `Scikit-learn Pipeline` utilizing `ColumnTransformer` (to scale numerics and OneHotEncode categories), culminating into the `XGBClassifier`.
4. **Isotonic Calibration**: Fits the regression wrapper over the resultant model margins.
5. **SHAP Diagnostics**: Generates a local `shap_summary.png` graphical plot to visualize overall global feature importance (e.g., proving whether `time_since_last_txn` correctly impacts the prediction margin).
6. **Disk Serialization**: Outputs the new `.pkl` binary payload automatically readable by the Flask application on the next boot cycle.

*(Note: Depending on your hardware CPU core count, this may take 1-3 minutes to compile depending on the volume generated).*

---

## 📡 API Reference Guide

FraudSense relies on strictly enforced REST protocols. All requests (except basic GETs without data) require a `Bearer <Firebase-JWT>` in the Authorization header.

### `POST /transactions/upload`
Ingests a CSV file. Runs the `predict_proba()` against every row, and processes it through the Network Layer.
- **Body:** `multipart/form-data` containing `file`
- **Response:** JSON list of the evaluated verdicts mapped back to the row index.

### `GET /fraud/stats`
Renders the high-level aggregation metrics for the dashboard.
- **Query Params:** None
- **Response:** JSON containing mathematical properties `fraud_rate`, `risk_breakdown`, and `total_transactions`.

### `GET /transactions/<id>/explain`
Intercepts the specific Transaction ID and interfaces with the `TreeExplainer` payload.
- **Response:** Returns the literal text interpretations of the top SHAP vector impacts.

### `PATCH /transactions/<id>/review`
The Human-In-The-Loop loopback mechanism.
- **Body JSON:** `{"status": "confirmed_fraud"}` 
- **Response:** Updates database, logs the audit, and flags the row for inclusion in the next Retraining Epoch.

---

> FraudSense was purpose-built as a technological demonstration of Explainable AI in high-stakes financial environments. 
> Developed for the Innovathon 2025.
