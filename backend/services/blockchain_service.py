import json
from web3 import Web3
from config import settings

# ABI — only the functions we call from Python
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
