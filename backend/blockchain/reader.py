from web3 import Web3
from config import settings

class BlockchainReader:
    def __init__(self):
        # Using public RPC for Sepolia
        self.w3 = Web3(Web3.HTTPProvider("https://ethereum-sepolia-rpc.publicnode.com"))
        
        # Simple ABI for events
        self.abi = [
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": False, "internalType": "string", "name": "caseId", "type": "string"},
                    {"indexed": False, "internalType": "string", "name": "ipfsCID", "type": "string"},
                    {"indexed": False, "internalType": "uint256", "name": "riskScore", "type": "uint256"},
                    {"indexed": False, "internalType": "string", "name": "category", "type": "string"},
                    {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
                ],
                "name": "ReportSubmitted",
                "type": "event"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": False, "internalType": "string", "name": "caseId", "type": "string"},
                    {"indexed": False, "internalType": "enum POCSORegistry.Status", "name": "newStatus", "type": "uint8"},
                    {"indexed": False, "internalType": "string", "name": "notes", "type": "string"},
                    {"indexed": False, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
                ],
                "name": "StatusUpdated",
                "type": "event"
            }
        ]
        
        self.contract_address = settings.contract_address
        if self.contract_address:
            self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.abi)
        else:
            self.contract = None

    def get_audit_events(self, limit=50):
        """
        Fetches the latest StatusUpdated and ReportSubmitted events from the blockchain.
        In a production app, we'd use an indexer (The Graph), but for a hackathon, we query logs.
        """
        if not self.contract:
            return []

        try:
            # Get current block
            current_block = self.w3.eth.block_number
            # Query the last 5000 blocks (roughly ~15 hours on Ethereum/L2s)
            start_block = max(0, current_block - 5000)

            # Fetch StatusUpdated events
            status_events = self.contract.events.StatusUpdated.get_logs(from_block=start_block)
            
            # Fetch ReportSubmitted events
            report_events = self.contract.events.ReportSubmitted.get_logs(from_block=start_block)

            audit_log = []
            
            status_map = ["RECEIVED", "UNDER_REVIEW", "VERIFIED", "ESCALATED", "ACTION_TAKEN", "CLOSED"]

            for event in status_events:
                audit_log.append({
                    "event": "StatusUpdated",
                    "case_id": event.args.caseId,
                    "new_status": status_map[event.args.newStatus],
                    "notes": event.args.notes,
                    "tx": event.transactionHash.hex(),
                    "timestamp": event.args.timestamp
                })

            for event in report_events:
                audit_log.append({
                    "event": "ReportSubmitted",
                    "case_id": event.args.caseId,
                    "new_status": "RECEIVED",
                    "notes": "New report submitted via portal.",
                    "tx": event.transactionHash.hex(),
                    "timestamp": event.args.timestamp
                })

            # Sort by timestamp descending
            audit_log.sort(key=lambda x: x["timestamp"], reverse=True)
            return audit_log[:limit]

        except Exception as e:
            print(f"Blockchain Reader Error: {e}")
            return []
