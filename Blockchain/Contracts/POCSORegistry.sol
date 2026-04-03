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
        uint256 riskScore;
        string evidenceHash;
        string category;
        Status status;
        address submittedBy;
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

        caseIdToIndex[_caseId] = reports.length;

        emit ReportSubmitted(_caseId, _ipfsCID, _riskScore, _category, block.timestamp);
    }

    function updateStatus(
        string memory _caseId,
        Status _newStatus,
        string memory _notes
    ) external onlyAdmin {
        uint256 index = caseIdToIndex[_caseId];
        require(index != 0, "Case not found");

        reports[index - 1].status = _newStatus;
        reports[index - 1].notes = _notes;

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
        require(index != 0, "Case not found");
        Report storage r = reports[index - 1];
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