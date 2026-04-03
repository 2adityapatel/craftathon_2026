import json
from web3 import Web3
from config import settings

# Status enum mapping (matches POCSORegistry.sol)
STATUS_MAP: dict[str, int] = {
    "RECEIVED":      0,
    "UNDER_REVIEW":  1,
    "VERIFIED":      2,
    "ESCALATED":     3,
    "ACTION_TAKEN":  4,
    "CLOSED":        5,
}
STATUS_REVERSE: dict[int, str] = {v: k for k, v in STATUS_MAP.items()}

# Full ABI — all functions we use from Python
POCSO_ABI = json.loads("""[
  {
    "inputs": [
      {"internalType": "string", "name": "_caseId", "type": "string"},
      {"internalType": "string", "name": "_ipfsCID", "type": "string"},
      {"internalType": "uint256", "name": "_riskScore", "type": "uint256"},
      {"internalType": "string", "name": "_evidenceHash", "type": "string"},
      {"internalType": "string", "name": "_category", "type": "string"}
    ],
    "name": "submitReport",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_caseId", "type": "string"},
      {"internalType": "uint8",  "name": "_newStatus", "type": "uint8"},
      {"internalType": "string", "name": "_notes", "type": "string"}
    ],
    "name": "updateStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_caseId", "type": "string"}],
    "name": "getReport",
    "outputs": [
      {"internalType": "string",  "name": "caseId",        "type": "string"},
      {"internalType": "string",  "name": "ipfsCID",       "type": "string"},
      {"internalType": "uint256", "name": "riskScore",     "type": "uint256"},
      {"internalType": "string",  "name": "evidenceHash",  "type": "string"},
      {"internalType": "string",  "name": "category",      "type": "string"},
      {"internalType": "uint8",   "name": "status",        "type": "uint8"},
      {"internalType": "uint256", "name": "timestamp",     "type": "uint256"},
      {"internalType": "string",  "name": "notes",         "type": "string"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllReports",
    "outputs": [
      {
        "components": [
          {"internalType": "string",  "name": "caseId",       "type": "string"},
          {"internalType": "string",  "name": "ipfsCID",      "type": "string"},
          {"internalType": "uint256", "name": "riskScore",    "type": "uint256"},
          {"internalType": "string",  "name": "evidenceHash", "type": "string"},
          {"internalType": "string",  "name": "category",     "type": "string"},
          {"internalType": "uint8",   "name": "status",       "type": "uint8"},
          {"internalType": "address", "name": "submittedBy",  "type": "address"},
          {"internalType": "uint256", "name": "timestamp",    "type": "uint256"},
          {"internalType": "string",  "name": "notes",        "type": "string"}
        ],
        "internalType": "struct POCSORegistry.Report[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getReportCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "string",  "name": "caseId",    "type": "string"},
      {"indexed": false, "internalType": "string",  "name": "ipfsCID",   "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "riskScore",  "type": "uint256"},
      {"indexed": false, "internalType": "string",  "name": "category",   "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp",  "type": "uint256"}
    ],
    "name": "ReportSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "string",  "name": "caseId",    "type": "string"},
      {"indexed": false, "internalType": "uint8",   "name": "newStatus", "type": "uint8"},
      {"indexed": false, "internalType": "string",  "name": "notes",     "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "StatusUpdated",
    "type": "event"
  }
]""")


def _get_w3():
    return Web3(Web3.HTTPProvider(settings.sepolia_rpc_url))


def anchor_report_on_chain(
    case_id: str,
    ipfs_cid: str,
    risk_score: float,
    evidence_hash: str,
    category: str,
) -> str:
    """
    Calls POCSORegistry.submitReport() on Sepolia.
    risk_score is a float (e.g. 0.87) — multiplied by 100 → stored as uint256 (87).
    Returns the transaction hash string.
    """
    w3 = _get_w3()
    if not w3.is_connected():
        raise ConnectionError("Cannot connect to Sepolia via Alchemy RPC.")

    account = w3.eth.account.from_key(settings.system_wallet_private_key)
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(settings.contract_address),
        abi=POCSO_ABI,
    )

    risk_score_int = int(round(risk_score * 100))  # 0.87 -> 87

    print("=" * 50)
    print("🚀 ANCHORING REPORT TO BLOCKCHAIN...")
    print(f"Contract: {settings.contract_address}")
    print(f"Caller Wallet: {account.address}")
    print(f"Data Payload:")
    print(f"  - case_id: {case_id}")
    print(f"  - ipfs_cid: {ipfs_cid}")
    print(f"  - risk_score: {risk_score_int} (original: {risk_score})")
    print(f"  - evidence_hash: {evidence_hash}")
    print(f"  - category: {category}")
    print("=" * 50)

    try:
        # Pre-estimate gas to catch "Not authorized" (onlyAdmin) or other reverts before sending
        estimated_gas = contract.functions.submitReport(
            case_id, ipfs_cid, risk_score_int, evidence_hash, category
        ).estimate_gas({"from": account.address})
        gas_limit = int(estimated_gas * 1.2) # 20% buffer
    except Exception as e:
        # This will catch reverts like "Not authorized"
        raise Exception(f"Transaction will revert (check if this wallet is the admin): {str(e)}")

    tx = contract.functions.submitReport(
        case_id,
        ipfs_cid,
        risk_score_int,
        evidence_hash,
        category,
    ).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": gas_limit,
        "gasPrice": w3.eth.gas_price,
    })

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    
    try:
        # Wait for receipt to confirm it was successful on-chain
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
        if receipt.status == 0:
            raise Exception("Transaction failed on chain (Status 0).")
    except Exception as e:
        raise Exception(f"Transaction {tx_hash.hex()} failed: {str(e)}")

    return tx_hash.hex()


def _get_contract():
    """Returns a (w3, contract) tuple, raising if not connected."""
    w3 = _get_w3()
    if not w3.is_connected():
        raise ConnectionError("Cannot connect to Sepolia via Alchemy RPC.")
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(settings.contract_address),
        abi=POCSO_ABI,
    )
    return w3, contract


def update_status_on_chain(case_id: str, new_status: int, notes: str) -> str:
    """
    Calls POCSORegistry.updateStatus() on Sepolia.
    new_status is a uint8 (0-5) matching the Status enum.
    Returns the transaction hash string.
    """
    w3, contract = _get_contract()
    account = w3.eth.account.from_key(settings.system_wallet_private_key)

    print("=" * 50)
    print("🔄 UPDATING STATUS ON BLOCKCHAIN...")
    print(f"  - case_id: {case_id}  new_status: {new_status}  notes: {notes}")
    print("=" * 50)

    try:
        estimated_gas = contract.functions.updateStatus(
            case_id, new_status, notes
        ).estimate_gas({"from": account.address})
        gas_limit = int(estimated_gas * 1.2)
    except Exception as e:
        raise Exception(f"updateStatus will revert: {str(e)}")

    tx = contract.functions.updateStatus(
        case_id, new_status, notes
    ).build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": gas_limit,
        "gasPrice": w3.eth.gas_price,
    })

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
    if receipt.status == 0:
        raise Exception(f"updateStatus tx {tx_hash.hex()} reverted on-chain.")

    return tx_hash.hex()


def get_report_from_chain(case_id: str) -> dict:
    """Read-only: calls getReport(caseId) — no gas needed."""
    _, contract = _get_contract()
    result = contract.functions.getReport(case_id).call()
    # result order: caseId, ipfsCID, riskScore, evidenceHash, category, status, timestamp, notes
    return {
        "case_id":       result[0],
        "ipfs_cid":      result[1],
        "risk_score":    result[2] / 100.0,   # stored as int*100 on-chain
        "evidence_hash": result[3],
        "category":      result[4],
        "status":        STATUS_REVERSE.get(result[5], str(result[5])),
        "timestamp":     result[6],
        "notes":         result[7],
    }


def get_all_reports_from_chain() -> list[dict]:
    """Read-only: calls getAllReports() — returns all on-chain reports."""
    _, contract = _get_contract()
    reports = contract.functions.getAllReports().call()
    result = []
    for r in reports:
        result.append({
            "case_id":       r[0],
            "ipfs_cid":      r[1],
            "risk_score":    r[2] / 100.0,
            "evidence_hash": r[3],
            "category":      r[4],
            "status":        STATUS_REVERSE.get(r[5], str(r[5])),
            "submitted_by":  r[6],
            "timestamp":     r[7],
            "notes":         r[8],
        })
    return result


def get_report_count_from_chain() -> int:
    """Read-only: calls getReportCount()."""
    _, contract = _get_contract()
    return contract.functions.getReportCount().call()


def get_status_history_from_chain(case_id: str) -> list[dict]:
    """
    Reads all StatusUpdated events from the contract for a given caseId.
    Returns a list of status change records ordered oldest → newest.
    Note: We scan all blocks from 0 → latest. For large deployments this
    should be limited to a deployment block, but for hackathon/testnet it's fine.
    """
    w3, contract = _get_contract()
    try:
        # Alchemy Free Tier will throw a 502 Gateway Timeout if we query from block 0
        # because the range is 5+ million blocks.
        # Since this is a hackathon project, cases were submitted recently.
        # We query the last ~25,000 blocks (roughly 3 days of Sepolia history)
        current_block = w3.eth.block_number
        start_block = max(0, current_block - 25000)

        logs = contract.events.StatusUpdated.get_logs(from_block=start_block, to_block="latest")
    except Exception as e:
        raise Exception(f"Failed to read StatusUpdated events. Make sure RPC is reachable: {str(e)}")

    result = []
    for log in logs:
        args = log["args"]
        if args["caseId"] != case_id:
            continue
        result.append({
            "case_id":    args["caseId"],
            "new_status": STATUS_REVERSE.get(args["newStatus"], str(args["newStatus"])),
            "notes":      args["notes"],
            "timestamp":  args["timestamp"],
            "block_number": log["blockNumber"],
            "tx_hash":    log["transactionHash"].hex(),
        })

    # Sort by block number ascending (oldest first)
    result.sort(key=lambda x: x["block_number"])
    return result
