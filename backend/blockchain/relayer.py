import os
import json
from web3 import Web3
from eth_account import Account
from config import settings

class BlockchainRelayer:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(BlockchainRelayer, cls).__new__(cls)
            cls._instance._setup()
        return cls._instance

    def _setup(self):
        # 1. Setup the Web3 provider (Ethereum Sepolia Testnet)
        # Using a reliable public RPC for Sepolia
        self.w3 = Web3(Web3.HTTPProvider("https://ethereum-sepolia-rpc.publicnode.com"))
        
        # 2. Setup the identity (Relayer Wallet)
        if settings.system_wallet_private_key:
            self.account = Account.from_key(settings.system_wallet_private_key)
        else:
            self.account = None
            
        # 3. Setup the Contract (ABI must match POCSORegistry.sol)
        # Note: In a real project, we'd load the ABI from a JSON file.
        self.abi = [
            {"inputs":[{"internalType":"string","name":"_caseId","type":"string"},{"internalType":"string","name":"_ipfsCID","type":"string"},{"internalType":"uint256","name":"_riskScore","type":"uint256"},{"internalType":"string","name":"_evidenceHash","type":"string"},{"internalType":"string","name":"_category","type":"string"}],"name":"submitReport","outputs":[],"stateMutability":"nonpayable","type":"function"},
            {"inputs":[{"internalType":"string","name":"_caseId","type":"string"},{"internalType":"uint8","name":"_newStatus","type":"uint8"},{"internalType":"string","name":"_notes","type":"string"}],"name":"updateStatus","outputs":[],"stateMutability":"nonpayable","type":"function"}
        ]
        
        self.contract_address = settings.contract_address
        if self.contract_address:
            self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.abi)
        else:
            self.contract = None

    def submit_report_to_chain(self, case_id, ipfs_cid, risk_score, evidence_hash, category):
        """
        Submits the report metadata to the Ethereum Sepolia Smart Contract.
        This provides the 'Proof Layer'.
        """
        if not self.account or not self.contract:
            print("WARNING: Blockchain keys/contract missing. Returning mock TX hash.")
            return f"mock_tx_{case_id}"

        try:
            # Prepare transaction
            tx = self.contract.functions.submitReport(
                case_id,
                ipfs_cid,
                int(risk_score * 100), # Store as uint (0-100)
                evidence_hash,
                category
            ).build_transaction({
                "from": self.account.address,
                "nonce": self.w3.eth.get_transaction_count(self.account.address),
                "gas": 500000,
                "gasPrice": self.w3.eth.gas_price,
                "chainId": 11155111 # Ethereum Sepolia Testnet
            })

            # Sign and send
            signed_tx = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return receipt.transactionHash.hex()
            
        except Exception as e:
            print(f"Blockchain Relayer Error: {e}")
            raise Exception("Failed to anchor report to blockchain.")

    def update_status_on_chain(self, case_id: str, status_int: int, notes: str):
        """
        Updates the report status on-chain. This provides an immutable audit trail.
        """
        if not self.account or not self.contract:
            print("WARNING: Blockchain keys/contract missing. Returning mock TX hash.")
            return f"mock_update_tx_{case_id}"

        try:
            # Prepare transaction
            tx = self.contract.functions.updateStatus(
                case_id,
                status_int,
                notes
            ).build_transaction({
                "from": self.account.address,
                "nonce": self.w3.eth.get_transaction_count(self.account.address),
                "gas": 300000,
                "gasPrice": self.w3.eth.gas_price,
                "chainId": 11155111 # Ethereum Sepolia Testnet
            })

            # Sign and send
            signed_tx = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            return receipt.transactionHash.hex()
            
        except Exception as e:
            print(f"Blockchain Relayer Status Update Error: {e}")
            raise Exception("Failed to anchor status update to blockchain.")
