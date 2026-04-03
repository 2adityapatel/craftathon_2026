# POCSO Blockchain Reporting System — Final Architecture + 32h Timeline

---

## Core Architectural Principle

> **Blockchain stores proof. Storage stores content. AI prioritizes. Backend orchestrates.**

Nothing is overloaded. Nothing is fake-hype blockchain. Each layer has one clear job.

---

## End-to-End Flow (One Sentence)

> Reporter submits evidence → backend sanitizes and encrypts → AI scores urgency and checks duplicates → hash is written to blockchain → evidence stored off-chain encrypted → authority dashboard receives prioritized queue → authority reviews and updates status → reporter tracks progress with anonymous case key

---

## 4-Layer Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1: USER INTERFACE                                            │
│  ┌──────────────────────┐          ┌──────────────────────────┐     │
│  │  Reporter Portal     │          │  Authority Dashboard     │     │
│  │  (React/Vite)        │          │  (React/Vite + JWT)      │     │
│  │                      │          │                          │     │
│  │  - Home              │          │  - Pending Queue         │     │
│  │  - Report Form       │          │  - High-Risk Cases       │     │
│  │  - Upload Evidence   │          │  - Repeat Offenders      │     │
│  │  - Track Status      │          │  - Case Detail           │     │
│  │  - Confirmation      │          │  - Status Update Panel   │     │
│  └──────────┬───────────┘          └──────────┬───────────────┘     │
└─────────────┼──────────────────────────────────┼────────────────────┘
              │                                  │
              ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 2: BACKEND + AI (FastAPI + Python Services)                  │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │ Report Service  │  │ Privacy Service  │  │ AI Analysis Svc    │ │
│  │                 │  │                  │  │                    │ │
│  │ - Create record │  │ - EXIF strip     │  │ - Risk scoring     │ │
│  │ - Generate ID   │  │ - E2EE decrypt   │  │ - Category classify│ │
│  │ - Case key gen  │  │ - Hash verify    │  │ - Duplicate detect │ │
│  │ - Status mgmt   │  │ - Metadata clean │  │ - Repeat offender  │ │
│  │ - Tracking API  │  │ - Key discard    │  │ - Escalation flag  │ │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬───────────┘ │
│           │                    │                      │             │
│           └────────────────────┴──────────────────────┘             │
│                                │                                    │
│                     ┌──────────▼──────────┐                         │
│                     │ Case Management Svc │                         │
│                     │ - Lifecycle tracking│                         │
│                     │ - Authority updates │                         │
│                     │ - Audit log         │                         │
│                     └──────────┬──────────┘                         │
└────────────────────────────────┼────────────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
┌─────────────────────┐ ┌──────────────┐ ┌──────────────────────────┐
│ LAYER 3: BLOCKCHAIN │ │ LAYER 4:     │ │ LAYER 4: STORAGE         │
│ Polygon Amoy Testnet│ │ STORAGE      │ │                          │
│                     │ │              │ │ IPFS (Pinata Free Tier)  │
│ Smart Contract:     │ │ PostgreSQL/  │ │                          │
│ POCSORegistry       │ │ SQLite       │ │ - Encrypted evidence     │
│                     │ │              │ │ - No raw data on-chain   │
│ Stores:             │ │ - Case meta  │ │ - Access-controlled      │
│ - caseId            │ │ - Status hist│ │ - CID referenced on-chain│
│ - ipfsCID           │ │ - Admin users│ │                          │
│ - riskScore         │ │ - Duplicate  │ │                          │
│ - evidenceHash      │ │   index      │ │                          │
│ - category          │ │              │ │                          │
│ - status            │ │              │ │                          │
│ - timestamp         │ │              │ │                          │
│ - audit events      │ │              │ │                          │
└─────────────────────┘ └──────────────┘ └──────────────────────────┘
```

---

## LAYER 1: Frontend

### A. Reporter Portal (Anonymous User)

**Tech:** React + Vite + Tailwind CSS + Web Crypto API + `exifr`

| Page | Route | Purpose |
|---|---|---|
| Home | `/` | Explainer, trust signals, "Report Now" CTA |
| Report Form | `/report` | Multi-step: select type → upload → encrypt → submit |
| Confirmation | `/success` | Display case_id + case_key (save instructions) |
| Track Status | `/track` | Enter case_id + case_key → view current status |

**Report Form Flow:**
```
Step 1: Select evidence type → URL | Image | Video | Text | Screenshot
Step 2: Upload/paste evidence
  └─ If image/video → auto EXIF strip via `exifr`
  └─ If URL → validate format
Step 3: Client-side encryption (automatic, invisible to user)
  └─ Fetch backend RSA public key
  └─ Generate AES-256 key → encrypt payload
  └─ Compute SHA-256 hash of raw payload
  └─ Encrypt AES key with RSA public key
Step 4: Submit → POST /api/v1/submit
Step 5: Receive → { case_id, case_key, message }
  └─ case_key auto-saved to localStorage
```

**What it does NOT do:**
- No login, no email, no phone, no wallet connection
- No identity collection whatsoever

### B. Authority Dashboard (Admin)

**Tech:** React + Vite + `ethers.js`/`viem` + Recharts + JWT auth

| Page | Route | Purpose |
|---|---|---|
| Login | `/admin/login` | Username/password → JWT |
| Overview | `/admin` | Stats: total, by severity, by status |
| Pending Queue | `/admin/cases` | All cases sorted by risk_score DESC |
| High-Risk | `/admin/cases?priority=critical` | risk_score >= 0.8 OR should_escalate |
| Repeat Offenders | `/admin/domains` | Domains reported 3+ times, grouped |
| Case Detail | `/admin/case/:id` | Full report, evidence, audit trail |
| Status Update | (within Case Detail) | Dropdown → calls contract updateStatus() |
| Audit Log | `/admin/audit` | All blockchain events, tamper-proof |

**Admin Auth (Hackathon-Simple):**
```
POST /api/v1/admin/login → { username, password } → { token, role }
All /admin/* routes → Header: Authorization: Bearer <jwt>
```

---

## LAYER 2: Backend (FastAPI + Python Services)

### Project Structure

```
backend/
├── main.py                          # FastAPI app, CORS, route registration
├── config.py                        # Env vars, constants
│
├── services/
│   ├── report_service.py            # Create record, generate case_id, case_key
│   ├── privacy_service.py           # EXIF strip, E2EE decrypt, hash verify, key discard
│   ├── ai_analysis_service.py       # Score, classify, duplicate check, repeat offender
│   └── case_management_service.py   # Status lifecycle, tracking, authority updates
│
├── ai/
│   ├── text_model.py                # NLP: unitary/toxic-bert
│   ├── image_model.py               # Vision: google/vit-base-patch16-224
│   ├── scorer.py                    # Unified risk_score 0.0-1.0
│   └── duplicate_detector.py        # URL/domain matching against existing cases
│
├── blockchain/
│   ├── contract.py                  # ABI, address, web3 provider
│   ├── relayer.py                   # System wallet, sign & send tx (gasless for user)
│   └── reader.py                    # Read contract state, parse events
│
├── storage/
│   ├── ipfs.py                      # Pinata API wrapper
│   └── database.py                  # PostgreSQL/SQLite wrapper
│
├── crypto/
│   ├── keys.py                      # RSA key gen, public key endpoint
│   ├── encrypt.py                   # RSA decrypt, AES decrypt
│   └── hash.py                      # SHA-256 utilities
│
├── models/
│   └── schemas.py                   # Pydantic request/response models
│
└── middleware/
    └── security.py                  # Rate limiting (slowapi), CORS, JWT auth
```

### API Routes

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/public-key` | None | Return backend RSA public key (PEM) |
| `POST` | `/api/v1/submit` | None | Submit encrypted report |
| `GET` | `/api/v1/track` | None | Track case (needs case_id + case_key) |
| `POST` | `/api/v1/admin/login` | None | Admin login → JWT |
| `GET` | `/api/v1/admin/cases` | Admin JWT | List all cases, sorted by risk_score |
| `GET` | `/api/v1/admin/case/:id` | Admin JWT | Single case detail |
| `POST` | `/api/v1/admin/case/:id/status` | Admin JWT | Update status → logs on blockchain |
| `GET` | `/api/v1/admin/audit` | Admin JWT | Blockchain event log |
| `GET` | `/api/v1/admin/domains` | Admin JWT | Repeat offender domains (count >= 3) |

### `/submit` — Full Backend Flow

```
POST /api/v1/submit
Body: { encrypted_payload, encrypted_aes_key, original_hash, evidence_type, description }

1. PRIVACY SERVICE:
   - RSA-OAEP decrypt encrypted_aes_key → aes_key
   - AES-256-GCM decrypt encrypted_payload → clean_payload
   - SHA-256(clean_payload) → computed_hash
   - VERIFY: computed_hash == original_hash
     → MISMATCH: reject 400, log tampering attempt
   - Re-strip EXIF server-side (belt-and-suspenders)

2. AI ANALYSIS SERVICE:
   - Run appropriate model based on evidence_type
   - Get: risk_score, category, confidence
   - Check duplicate (if URL): is_duplicate, repeat_count
   - Flag: repeat_offender = repeat_count >= 3
   - Flag: should_escalate = risk_score >= 0.8 OR repeat_offender

3. REPORT SERVICE:
   - Generate case_id: "CASE-2026-0042"
   - Generate case_key: secrets.token_hex(16) → 32 hex chars
   - Create DB record with all metadata

4. STORAGE:
   - Upload encrypted_payload to IPFS (Pinata) → get CID

5. BLOCKCHAIN RELAYER:
   - Call contract.submitReport(case_id, CID, risk_score, evidence_hash, category)
   - System wallet signs tx, pays gas on Polygon Amoy
   - Get tx_hash

6. CRYPTO:
   - DISCARD aes_key and clean_payload from memory
   - Store case_key_hash (not raw key) in DB for tracking

7. RETURN:
   {
     "case_id": "CASE-2026-0042",
     "case_key": "a3f8c2d1e9b7f4a6c8e0d2b5a7f9c1e3",
     "blockchain_tx": "0xabc123...",
     "ipfs_cid": "QmX7k9...",
     "risk_score": 0.92,
     "threat_level": "CRITICAL",
     "category": "CSAM",
     "message": "Report submitted. Save your case key to track status."
   }
```

---

## LAYER 2 (cont.): AI Analysis Service

### AI Input → Output Contract

| Input | Source |
|---|---|
| User description text | Report form |
| URL/domain | Report form |
| Image/video pixels | Uploaded file |
| Screenshot text (OCR) | Uploaded screenshot |
| Previous report history | Database |

| Output | Type | Purpose |
|---|---|---|
| risk_score | float 0.0-1.0 | Primary sorting in dashboard |
| category | enum | CSAM | harassment | trafficking | hate_speech | other |
| confidence | float 0.0-1.0 | How sure the model is |
| is_duplicate | bool | Same URL/domain already reported |
| repeat_offender | bool | Domain reported >= 3 times |
| repeat_count | int | How many times this domain was reported |
| should_escalate | bool | risk_score >= 0.8 OR repeat_offender |

### Models (All Pre-trained, No Training Needed)

| Evidence Type | Model | Source | Output |
|---|---|---|---|
| Image | `google/vit-base-patch16-224` + NSFW head | Hugging Face | nsfw_score, violence_score |
| Text | `unitary/toxic-bert` | Hugging Face | toxicity_score |
| URL | Scrape page text → NLP + domain reputation heuristic | — | domain_risk_score |
| Video | Extract 3 frames → run image model → average | — | mean_frame_score |

### Risk Score Calculation

```python
def compute_risk_score(evidence_type, content_scores):
    if evidence_type == "image":
        return 0.7 * content_scores["nsfw"] + 0.3 * content_scores["violence"]
    elif evidence_type == "text":
        return content_scores["toxicity"]
    elif evidence_type == "url":
        text_score = analyze_scraped_text(url)
        domain_rep = check_domain_reputation(url)
        return 0.6 * text_score + 0.4 * domain_rep
    elif evidence_type == "video":
        frames = extract_frames(video, n=3)
        scores = [run_image_model(f) for f in frames]
        return mean(scores)

def threat_level(score):
    if score >= 0.8: return "CRITICAL"
    if score >= 0.6: return "HIGH"
    if score >= 0.4: return "MEDIUM"
    return "LOW"
```

### Duplicate Detection

```python
def check_duplicate_url(url):
    domain = extract_domain(url)  # "example.com" from "https://example.com/page"
    count = db.query("SELECT COUNT(*) FROM cases WHERE domain = ?", domain)
    return (count > 0, count)
```

### Safe Data for Hackathon

- Do NOT use real illegal content
- Use proxy datasets: NSFW dataset (public), hate speech datasets, synthetic text
- For demo: prepare 3-4 pre-scored test images with known scores
- Tell judges: "We used safe proxy datasets for ethical and legal compliance"

---

## LAYER 2 (cont.): Service Details

### Report Service

```python
class ReportService:
    def create_report(self, evidence_type, risk_score, category, ipfs_cid,
                      evidence_hash, is_duplicate, repeat_count, should_escalate):
        case_id = self._generate_case_id()    # CASE-2026-0042
        case_key = secrets.token_hex(16)       # a3f8c2d1e9b7f4a6...
        case_key_hash = hashlib.sha256(case_key.encode()).hexdigest()

        db.insert("cases", {
            "case_id": case_id,
            "case_key_hash": case_key_hash,
            "status": "RECEIVED",
            "evidence_type": evidence_type,
            "risk_score": risk_score,
            "category": category,
            "is_duplicate": is_duplicate,
            "repeat_offender": repeat_count >= 3,
            "repeat_count": repeat_count,
            "should_escalate": should_escalate,
            "domain": extract_domain(url) if url else None,
            "ipfs_cid": ipfs_cid,
            "evidence_hash": evidence_hash,
            "blockchain_tx": tx_hash,
        })

        return case_id, case_key
```

### Privacy Service

```python
class PrivacyService:
    def decrypt_and_verify(self, encrypted_payload, encrypted_aes_key, original_hash):
        # 1. Decrypt AES key with RSA private key
        aes_key = rsa_decrypt(encrypted_aes_key, PRIVATE_KEY)

        # 2. Decrypt payload with AES key
        clean_payload = aes_decrypt(encrypted_payload, aes_key)

        # 3. Verify integrity
        computed_hash = sha256(clean_payload)
        if computed_hash != original_hash:
            raise TamperingDetected("Payload hash mismatch")

        # 4. Server-side EXIF strip (belt-and-suspenders)
        clean_payload = strip_exif_server_side(clean_payload)

        return clean_payload, aes_key  # aes_key discarded after AI scoring
```

### Case Management Service

```python
class CaseManagementService:
    STATUSES = [
        "RECEIVED",        # Just submitted
        "UNDER_REVIEW",    # Authority opened
        "VERIFIED",        # Confirmed legitimate
        "ESCALATED",       # Forwarded to agency
        "ACTION_TAKEN",    # Takedown/ISP notified
        "CLOSED"           # Resolved
    ]

    def update_status(self, case_id, new_status, notes, admin_user):
        old_status = db.get_status(case_id)
        if new_status not in self.STATUSES:
            raise InvalidStatus()

        # Update DB
        db.update("cases", case_id, {"status": new_status, "last_updated": now()})

        # Log in history
        db.insert("status_history", {
            "case_id": case_id,
            "old_status": old_status,
            "new_status": new_status,
            "notes": notes,
        })

        # Update on blockchain (immutable audit trail)
        tx_hash = blockchain.update_status(case_id, new_status, notes)

        # Update status_history with tx
        db.update("status_history", latest_entry, {"blockchain_tx": tx_hash})

        return {"case_id": case_id, "status": new_status, "tx": tx_hash}
```

---

## LAYER 3: Blockchain

### Network
- **Polygon Amoy Testnet** — fast, free faucet, EVM-compatible
- Faucet: https://faucet.polygon.technology/ (gives 0.5 MATIC free, enough for 500+ tx)

### Smart Contract (Solidity 0.8.20)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract POCSORegistry {

    enum Status {
        RECEIVED,
        UNDER_REVIEW,
        VERIFIED,
        ESCALATED,
        ACTION_TAKEN,
        CLOSED
    }

    struct Report {
        string caseId;
        string ipfsCID;
        uint256 riskScore;          // 0-100 (float * 100)
        string evidenceHash;        // SHA-256 of original payload
        string category;            // "CSAM", "harassment", etc.
        Status status;
        address submittedBy;        // Always backend system wallet
        uint256 timestamp;
        string notes;
    }

    Report[] public reports;
    mapping(string => uint256) public caseIdToIndex;
    address public admin;

    event ReportSubmitted(
        string caseId,
        string ipfsCID,
        uint256 riskScore,
        string category,
        uint256 timestamp
    );

    event StatusUpdated(
        string caseId,
        Status newStatus,
        string notes,
        uint256 timestamp
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function submitReport(
        string memory _caseId,
        string memory _ipfsCID,
        uint256 _riskScore,
        string memory _evidenceHash,
        string memory _category
    ) external onlyAdmin {
        uint256 index = reports.length;
        reports.push(Report({
            caseId: _caseId,
            ipfsCID: _ipfsCID,
            riskScore: _riskScore,
            evidenceHash: _evidenceHash,
            category: _category,
            status: Status.RECEIVED,
            submittedBy: msg.sender,
            timestamp: block.timestamp,
            notes: ""
        }));
        caseIdToIndex[_caseId] = index;

        emit ReportSubmitted(_caseId, _ipfsCID, _riskScore, _category, block.timestamp);
    }

    function updateStatus(
        string memory _caseId,
        Status _newStatus,
        string memory _notes
    ) external onlyAdmin {
        uint256 index = caseIdToIndex[_caseId];
        require(index < reports.length, "Case not found");

        reports[index].status = _newStatus;
        reports[index].notes = _notes;

        emit StatusUpdated(_caseId, _newStatus, _notes, block.timestamp);
    }

    function getReport(string memory _caseId) external view returns (
        string memory caseId,
        string memory ipfsCID,
        uint256 riskScore,
        string memory evidenceHash,
        string memory category,
        Status status,
        uint256 timestamp,
        string memory notes
    ) {
        uint256 index = caseIdToIndex[_caseId];
        Report storage r = reports[index];
        return (r.caseId, r.ipfsCID, r.riskScore, r.evidenceHash,
                r.category, r.status, r.timestamp, r.notes);
    }

    function getAllReports() external view returns (Report[] memory) {
        return reports;
    }

    function getReportCount() external view returns (uint256) {
        return reports.length;
    }
}
```

### What Blockchain Stores vs. What It Does NOT

| Stores On-Chain | Does NOT Store On-Chain |
|---|---|
| caseId | Raw images/videos |
| ipfsCID (pointer to encrypted evidence) | User identity |
| riskScore | Long text descriptions |
| evidenceHash (SHA-256 integrity proof) | Decryption keys |
| category | IP addresses |
| status | Personal data |
| timestamp | |
| notes (admin updates) | |
| All status change events | |

### Backend Relayer (Gasless for User)

```python
from web3 import Web3
from eth_account import Account

w3 = Web3(Web3.HTTPProvider("https://rpc-amoy.polygon.technology"))
account = Account.from_key(os.getenv("SYSTEM_WALLET_PRIVATE_KEY"))
contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

def submit_report_to_chain(case_id, ipfs_cid, risk_score, evidence_hash, category):
    tx = contract.functions.submitReport(
        case_id, ipfs_cid, int(risk_score * 100), evidence_hash, category
    ).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": 500000,
        "gasPrice": w3.eth.gas_price,
        "chainId": 80002
    })
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt.transactionHash.hex()

def update_status_on_chain(case_id, status_int, notes):
    tx = contract.functions.updateStatus(
        case_id, status_int, notes
    ).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": 300000,
        "gasPrice": w3.eth.gas_price,
        "chainId": 80002
    })
    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return receipt.transactionHash.hex()
```

---

## LAYER 4: Storage

### Off-Chain Evidence Storage (IPFS via Pinata)

| What | Where | Why |
|---|---|---|
| Encrypted evidence files | IPFS (Pinata free tier: 1GB) | Decentralized, content-addressed |
| Case metadata | PostgreSQL/SQLite | Fast queries, admin dashboard |
| Status history | PostgreSQL/SQLite | Audit trail with notes |
| Admin users | PostgreSQL/SQLite | JWT auth |

### IPFS Upload

```python
def upload_to_ipfs(encrypted_file_bytes, filename):
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
    headers = {
        "pinata_api_key": os.getenv("PINATA_API_KEY"),
        "pinata_secret_api_key": os.getenv("PINATA_SECRET_KEY")
    }
    files = {"file": (filename, encrypted_file_bytes)}
    metadata = {"name": f"evidence-{uuid4()}", "keyvalues": {"encrypted": "true"}}
    response = requests.post(url, files=files, headers=headers,
                            data={"pinataMetadata": json.dumps(metadata)})
    return response.json()["IpfsHash"]  # CID: "QmX7k9..."
```

### Database Schema

```sql
-- Cases table (metadata only, NEVER evidence or identity)
CREATE TABLE cases (
    case_id TEXT PRIMARY KEY,
    case_key_hash TEXT UNIQUE,
    status TEXT DEFAULT 'RECEIVED',
    evidence_type TEXT,
    risk_score REAL,
    category TEXT,
    confidence REAL,
    is_duplicate BOOLEAN DEFAULT FALSE,
    repeat_offender BOOLEAN DEFAULT FALSE,
    repeat_count INTEGER DEFAULT 0,
    should_escalate BOOLEAN DEFAULT FALSE,
    domain TEXT,
    ipfs_cid TEXT,
    evidence_hash TEXT,
    blockchain_tx TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Status change history (audit trail)
CREATE TABLE status_history (
    id INTEGER PRIMARY KEY,
    case_id TEXT,
    old_status TEXT,
    new_status TEXT,
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blockchain_tx TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(case_id)
);

-- Admin users (hackathon-simple)
CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT,
    role TEXT DEFAULT 'authority'
);

-- Domain index (for duplicate detection + repeat offender panel)
CREATE INDEX idx_cases_domain ON cases(domain);
```

---

## Cryptography & Security

### End-to-End Encryption Flow

```
FRONTEND (Browser):
  1. GET /api/v1/public-key → RSA public key
  2. User uploads file → exifr.strip() → clean file
  3. Generate random AES-256 key (Web Crypto API)
  4. AES-256-GCM.encrypt(clean_file, aes_key) → encrypted_blob
  5. SHA-256(clean_file) → original_hash
  6. RSA-OAEP.encrypt(aes_key, public_key) → encrypted_key
  7. POST /submit { encrypted_blob, encrypted_key, original_hash, type }

BACKEND (FastAPI):
  1. RSA-OAEP.decrypt(encrypted_key, private_key) → aes_key
  2. AES-256-GCM.decrypt(encrypted_blob, aes_key) → clean_file
  3. SHA-256(clean_file) → computed_hash
  4. VERIFY computed_hash == original_hash → reject if mismatch
  5. Run AI on clean_file (in-memory only)
  6. Upload encrypted_blob to IPFS
  7. Log to blockchain
  8. DISCARD aes_key and clean_file from memory
```

### Anti-Tampering Guarantees

| Threat | Defense |
|---|---|
| Network interception (MitM) | HTTPS + client-side RSA+AES encryption |
| Payload tampering in transit | SHA-256 hash verification on backend |
| Backend tampering | Hash logged on blockchain — any change breaks match |
| Metadata leaks (GPS, device) | Client-side EXIF stripping + server-side re-strip |
| Identity exposure | No wallet, no login, no IP logging, gasless relayer |
| Bot spam | Rate limiting (5/min) + ZKP-ready architecture |

### Libraries

| Layer | Library | Purpose |
|---|---|---|
| Frontend crypto | Web Crypto API (built-in) | AES-GCM, RSA-OAEP, SHA-256 |
| Frontend EXIF | `exifr` npm | Strip GPS, device info |
| Backend crypto | `pycryptodome` | RSA decrypt, AES decrypt |
| Backend hash | `hashlib` (stdlib) | SHA-256 |
| Rate limiting | `slowapi` | IP-based rate limit |

---

## ID System

### Case ID
```
Format: CASE-{YEAR}-{SEQUENCE}
Example: CASE-2026-0001, CASE-2026-0042
Generation: Atomic counter in DB, padded to 4 digits
```

### Case Key (Anonymous Tracking)
```
Format: 32-char hex string (secrets.token_hex(16))
Example: a3f8c2d1e9b7f4a6c8e0d2b5a7f9c1e3
Storage: Hashed (SHA-256) in DB, raw key in user's localStorage only
Purpose: Only way for anonymous reporter to track their case
```

---

## Environment Variables

```bash
# .env (NEVER commit)
SYSTEM_WALLET_PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...
DATABASE_URL=sqlite:///./pocso.db
PINATA_API_KEY=pk_...
PINATA_SECRET_KEY=sk_...
HUGGINGFACE_TOKEN=hf_...
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$12$...
RSA_PRIVATE_KEY_PATH=./keys/private.pem
RATE_LIMIT=5/minute
```

---

## 32-HOUR HACKATHON TIMELINE

### Team Roles
| Member | Role | Focus |
|---|---|---|
| **You** | Backend + AI + Security | FastAPI, crypto, AI models, blockchain integration |
| **Member B** | Blockchain | Solidity contract, deployment, relayer, web3.py |
| **Member C** | Frontend | Reporter portal, admin dashboard, encryption flow |

---

### HOUR 0-2: Setup & Alignment (ALL)

```
[ALL]
  □ Agree on final architecture (this doc)
  □ Create shared repo structure
  □ Set up dev environments
  □ Create .env templates
  □ Get testnet MATIC from Polygon Amoy faucet
  □ Generate RSA key pair for E2EE
  □ Pinata account (free tier)
  □ Hugging Face token (free)
```

### HOUR 2-8: Core Infrastructure (PARALLEL)

```
[Member B - Blockchain]
  □ Write Solidity contract (POCSORegistry)
  □ Deploy to Polygon Amoy testnet
  □ Verify on block explorer
  □ Write web3.py relayer (submit + updateStatus)
  □ Test: manually call submitReport from Python

[You - Backend]
  □ Set up FastAPI project structure
  □ Implement /api/v1/public-key endpoint
  □ Implement crypto module (RSA decrypt, AES decrypt, SHA-256 verify)
  □ Implement /api/v1/submit skeleton (receive, decrypt, verify hash)
  □ Set up SQLite DB + schemas
  □ Test: send encrypted payload from Postman, verify decryption

[Member C - Frontend]
  □ Set up React + Vite + Tailwind
  □ Build Reporter Portal: Home, Report Form, Confirmation, Track pages
  □ Implement EXIF stripping (exifr)
  □ Implement client-side encryption (Web Crypto API: AES + RSA)
  □ Build /api/v1/submit integration
  □ Test: upload image → encrypt → send → get case_id back
```

### HOUR 8-14: AI + Dashboard (PARALLEL)

```
[You - AI + Backend]
  □ Integrate Hugging Face models (vit-base, toxic-bert)
  □ Implement AI Analysis Service (score, category, confidence)
  □ Implement duplicate detection (URL domain matching)
  □ Implement repeat offender flagging (count >= 3)
  □ Connect AI scoring to /submit flow
  □ Implement /api/v1/track endpoint
  □ Test: submit image → get risk_score back

[Member B - Blockchain]
  □ Connect relayer to /submit flow (auto-call contract on submission)
  □ Implement blockchain reader (getAllReports, getReport)
  □ Implement status update on-chain
  □ Test: full flow — submit → blockchain logs → read back

[Member C - Frontend]
  □ Build Authority Dashboard: Login, Overview, Case Queue
  □ Build Case Detail page
  □ Build Status Update panel
  □ Build Track Status page (for reporter)
  □ Connect to backend APIs
  □ Test: login → see cases → update status
```

### HOUR 14-20: Integration + Polish (ALL)

```
[ALL - Integration]
  □ Full end-to-end test: Reporter submits → AI scores → blockchain logs → dashboard shows → admin updates → reporter tracks
  □ Fix all integration bugs
  □ Add error handling everywhere
  □ Add loading states in frontend

[You]
  □ Implement /api/v1/admin/* routes (cases, case detail, status update, audit, domains)
  □ Implement JWT auth for admin routes
  □ Implement rate limiting
  □ Add status_history logging

[Member B]
  □ Build /api/v1/admin/audit endpoint (read blockchain events)
  □ Build /api/v1/admin/domains endpoint (repeat offenders)
  □ Test gas costs, optimize if needed

[Member C]
  □ Build High-Risk Cases panel
  □ Build Repeat Offenders panel
  □ Build Audit Log page
  □ Polish UI: responsive, clean, professional
  □ Add charts/stats on overview page
```

### HOUR 20-26: Testing + Demo Prep (ALL)

```
[ALL]
  □ Run 5+ full end-to-end test scenarios
  □ Prepare demo data:
    - 3-4 pre-scored test images (safe proxy data)
    - 2-3 test URLs
    - 1-2 test text reports
  □ Seed database with 5-10 demo cases for dashboard
  □ Test on different browsers
  □ Fix critical bugs only

[You]
  □ Write judge defense answers (see below)
  □ Prepare AI model explanation
  □ Document safe data usage

[Member B]
  □ Prepare blockchain explanation
  □ Get block explorer links for demo
  □ Show tx hashes in dashboard

[Member C]
  □ Prepare slide deck / demo flow
  □ Record backup demo video (in case live demo fails)
  □ Practice pitch
```

### HOUR 26-30: Buffer + Polish

```
[ALL]
  □ Fix remaining bugs
  □ Add any missing error states
  □ Polish UI/UX
  □ Test deployment (if deploying to cloud)
  □ Practice pitch 3+ times
  □ Time the demo (keep under 5 min)
```

### HOUR 30-32: Final Prep

```
[ALL]
  □ Final end-to-end test
  □ Deploy if not already
  □ Backup: record full demo video
  □ Prepare answers to judge questions
  □ Sleep. Seriously.
```

---

## Judge Defense — Prepared Answers

| Judge Question | Your Answer |
|---|---|
| **"How is this different from the cybercrime portal?"** | "Existing portals use 'trust us' centralized databases. We use mathematical trust — E2EE encryption, blockchain immutability, and AI triage. No one can delete or alter a report once submitted." |
| **"How do you prevent spam/fake reports?"** | "Rate limiting (5/min per IP), duplicate detection (same URL flagged), and ZKP-ready architecture for human verification without identity." |
| **"What if AI misclassifies something?"** | "AI is a triage tool, not a judge. It prioritizes the queue. A human authority always makes the final call before any action is taken." |
| **"How does anonymous tracking work?"** | "Reporter gets a one-time case key (32-char hex). They use it to query status. We store only the SHA-256 hash of the key — we can't reverse it to identify anyone." |
| **"Did you test on real illegal content?"** | "Absolutely not. We used safe proxy datasets (public NSFW datasets, hate speech datasets) and pre-scored test images. Full ethical compliance." |
| **"Why blockchain? Isn't a database enough?"** | "A database admin can delete or alter records. Blockchain makes it mathematically impossible. Every status change is an immutable event. This prevents powerful actors from making complaints 'disappear'." |
| **"How do you handle large video files?"** | "We don't put them on-chain. Evidence is encrypted client-side, stored on IPFS (decentralized storage), and only the cryptographic hash goes on-chain. Blockchain stores proof, storage stores content." |
| **"How does the reporter stay anonymous if they need to be contacted?"** | "The case key creates a one-way anonymous channel. They can check back, add more evidence, or receive updates — all without revealing identity." |

---

## Slide Deck Flow (5 Minutes)

```
Slide 1: Problem
  - Current reporting systems: centralized, trust-based, fear of retaliation
  - Victims don't report because identity might leak

Slide 2: Our Solution
  - Anonymous, blockchain-backed, AI-prioritized reporting platform
  - Reporter submits → backend encrypts → AI scores → blockchain records → authority acts

Slide 3: Architecture Diagram
  - Show the 4-layer diagram from above
  - "Blockchain stores proof. Storage stores content."

Slide 4: Anonymity
  - No wallet, no login, no identity
  - Client-side E2EE + EXIF stripping
  - Gasless relayer — user never touches crypto
  - Case key for anonymous tracking

Slide 5: AI Prioritization
  - Pre-trained models, no training needed
  - Risk scoring, duplicate detection, repeat offender flagging
  - "AI triages, humans decide"

Slide 6: Blockchain Trust
  - Tamper-proof complaint log
  - Immutable status change audit trail
  - Prevents deletion/manipulation by powerful actors

Slide 7: Live Demo
  - Reporter submits → dashboard shows → admin updates → reporter tracks

Slide 8: Impact
  - Mathematical trust over policy trust
  - Trauma-free triage for authorities
  - Scalable, ethical, production-ready architecture
```

---

## What to CUT If Running Behind

| Cut This | Keep This | Why |
|---|---|---|
| Video evidence processing | Image + URL + text | Video frame extraction is time-consuming |
| ZKP implementation | Rate limiting + case key | ZKP is advanced, rate limiting is enough for demo |
| ISP/browser extension | Conceptual mention in pitch | Too complex for 32h, just explain the concept |
| Real-time duplicate detection | Post-submission duplicate flagging | Simpler, still shows the feature |
| Charts/graphs on dashboard | Basic stats counters | Recharts takes time, counters are 5 min |
| Deploy to cloud | Run locally for demo | Deployment eats hours, local demo is fine |

---

This is your complete blueprint. Every layer, every line of code structure, every hour accounted for. Want to start building any specific component now?