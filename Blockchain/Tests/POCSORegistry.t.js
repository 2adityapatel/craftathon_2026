const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { ethers } = require("hardhat");

describe("POCSORegistry", function () {
  let registry;
  let owner;
  let nonAdmin;

  // Status enum mapping
  const Status = {
    RECEIVED: 0,
    UNDER_REVIEW: 1,
    VERIFIED: 2,
    ESCALATED: 3,
    ACTION_TAKEN: 4,
    CLOSED: 5,
  };

  // Sample report data
  const sampleReport = {
    caseId: "POCSO-7F4A2X",
    ipfsCID: "QmX7k9abcdef1234567890abcdef1234567890abcdef12",
    riskScore: 92, // 0.92 * 100
    evidenceHash:
      "a3f8c2d1e9b7f4a6c8e0d2b5a7f9c1e3a3f8c2d1e9b7f4a6c8e0d2b5a7f9c1e3",
    category: "CSAM",
  };

  // Deploy fresh contract before each test
  beforeEach(async function () {
    [owner, nonAdmin] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("POCSORegistry");
    registry = await Factory.deploy();
    await registry.deployed();
  });

  // ─────────────────────────────────────────────
  // DEPLOYMENT
  // ─────────────────────────────────────────────
  describe("Deployment", function () {
    it("should set deployer as admin", async function () {
      expect(await registry.admin()).to.equal(owner.address);
    });

    it("should start with zero reports", async function () {
      expect(await registry.getReportCount()).to.equal(0);
    });
  });

  // ─────────────────────────────────────────────
  // SUBMIT REPORT
  // ─────────────────────────────────────────────
  describe("submitReport", function () {
    it("should submit a report and increment count", async function () {
      await registry.submitReport(
        sampleReport.caseId,
        sampleReport.ipfsCID,
        sampleReport.riskScore,
        sampleReport.evidenceHash,
        sampleReport.category,
      );

      expect(await registry.getReportCount()).to.equal(1);
    });

    it("should store report fields correctly", async function () {
      await registry.submitReport(
        sampleReport.caseId,
        sampleReport.ipfsCID,
        sampleReport.riskScore,
        sampleReport.evidenceHash,
        sampleReport.category,
      );

      const report = await registry.getReport(sampleReport.caseId);

      console.log("report[6]:", report[6]);
      console.log("report[7]:", report[7].toString());
      console.log("owner.address:", owner.address);

      expect(report.caseId).to.equal(sampleReport.caseId);
      expect(report.ipfsCID).to.equal(sampleReport.ipfsCID);
      expect(report.riskScore).to.equal(sampleReport.riskScore);
      expect(report.evidenceHash).to.equal(sampleReport.evidenceHash);
      expect(report.category).to.equal(sampleReport.category);
      expect(report.status).to.equal(Status.RECEIVED);
      expect(report.notes).to.equal("");
    });

    it("should set timestamp close to block time", async function () {
      const tx = await registry.submitReport(
        sampleReport.caseId,
        sampleReport.ipfsCID,
        sampleReport.riskScore,
        sampleReport.evidenceHash,
        sampleReport.category,
      );
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const report = await registry.getReport(sampleReport.caseId);
      expect(report.timestamp).to.equal(block.timestamp);
    });

    it("should emit ReportSubmitted event with correct args", async function () {
      await expect(
        registry.submitReport(
          sampleReport.caseId,
          sampleReport.ipfsCID,
          sampleReport.riskScore,
          sampleReport.evidenceHash,
          sampleReport.category,
        ),
      )
        .to.emit(registry, "ReportSubmitted")
        .withArgs(
          sampleReport.caseId,
          sampleReport.ipfsCID,
          sampleReport.riskScore,
          sampleReport.category,
          anyValue,
        );
    });

    it("should revert if called by non-admin", async function () {
      await expect(
        registry
          .connect(nonAdmin)
          .submitReport(
            sampleReport.caseId,
            sampleReport.ipfsCID,
            sampleReport.riskScore,
            sampleReport.evidenceHash,
            sampleReport.category,
          ),
      ).to.be.revertedWith("Not authorized");
    });

    it("should handle multiple reports independently", async function () {
      const report2 = {
        caseId: "POCSO-AB1234",
        ipfsCID: "QmY9k8zyxwvu0987654321zyxwvu0987654321zyxwvu09",
        riskScore: 45,
        evidenceHash:
          "b4g9d3e2f8c7a5b1d0e3c6b9a2f5d8e1b4g9d3e2f8c7a5b1d0e3c6b9a2f5d8e1",
        category: "harassment",
      };

      await registry.submitReport(
        sampleReport.caseId,
        sampleReport.ipfsCID,
        sampleReport.riskScore,
        sampleReport.evidenceHash,
        sampleReport.category,
      );

      await registry.submitReport(
        report2.caseId,
        report2.ipfsCID,
        report2.riskScore,
        report2.evidenceHash,
        report2.category,
      );

      expect(await registry.getReportCount()).to.equal(2);

      const r1 = await registry.getReport(sampleReport.caseId);
      const r2 = await registry.getReport(report2.caseId);

      expect(r1.category).to.equal("CSAM");
      expect(r2.category).to.equal("harassment");
      expect(r1.riskScore).to.equal(92);
      expect(r2.riskScore).to.equal(45);
    });

    it("should handle edge case: riskScore of 0", async function () {
      await registry.submitReport(
        "POCSO-ZERO01",
        sampleReport.ipfsCID,
        0,
        sampleReport.evidenceHash,
        "other",
      );

      const report = await registry.getReport("POCSO-ZERO01");
      expect(report.riskScore).to.equal(0);
    });

    it("should handle edge case: riskScore of 100", async function () {
      await registry.submitReport(
        "POCSO-MAX100",
        sampleReport.ipfsCID,
        100,
        sampleReport.evidenceHash,
        "CSAM",
      );

      const report = await registry.getReport("POCSO-MAX100");
      expect(report.riskScore).to.equal(100);
    });
  });

  // ─────────────────────────────────────────────
  // UPDATE STATUS
  // ─────────────────────────────────────────────
  describe("updateStatus", function () {
    beforeEach(async function () {
      // Submit a report before each status test
      await registry.submitReport(
        sampleReport.caseId,
        sampleReport.ipfsCID,
        sampleReport.riskScore,
        sampleReport.evidenceHash,
        sampleReport.category,
      );
    });

    it("should update status from RECEIVED to UNDER_REVIEW", async function () {
      await registry.updateStatus(
        sampleReport.caseId,
        Status.UNDER_REVIEW,
        "Authority opened the case",
      );

      const report = await registry.getReport(sampleReport.caseId);
      expect(report.status).to.equal(Status.UNDER_REVIEW);
      expect(report.notes).to.equal("Authority opened the case");
    });

    it("should walk through all statuses in sequence", async function () {
      const transitions = [
        { status: Status.UNDER_REVIEW, notes: "Opened" },
        { status: Status.VERIFIED, notes: "Confirmed legitimate" },
        { status: Status.ESCALATED, notes: "Forwarded to agency" },
        { status: Status.ACTION_TAKEN, notes: "ISP notified" },
        { status: Status.CLOSED, notes: "Resolved" },
      ];

      for (const t of transitions) {
        await registry.updateStatus(sampleReport.caseId, t.status, t.notes);
        const report = await registry.getReport(sampleReport.caseId);
        expect(report.status).to.equal(t.status);
        expect(report.notes).to.equal(t.notes);
      }
    });

    it("should emit StatusUpdated event with correct args", async function () {
      await expect(
        registry.updateStatus(
          sampleReport.caseId,
          Status.VERIFIED,
          "Confirmed",
        ),
      )
        .to.emit(registry, "StatusUpdated")
        .withArgs(
          sampleReport.caseId,
          Status.VERIFIED,
          "Confirmed",
          anyValue,
        );
    });

    it("should overwrite notes on second update", async function () {
      await registry.updateStatus(
        sampleReport.caseId,
        Status.UNDER_REVIEW,
        "First note",
      );
      await registry.updateStatus(
        sampleReport.caseId,
        Status.VERIFIED,
        "Second note",
      );

      const report = await registry.getReport(sampleReport.caseId);
      expect(report.notes).to.equal("Second note");
      expect(report.status).to.equal(Status.VERIFIED);
    });

    it("should revert if caseId does not exist", async function () {
      await expect(
        registry.updateStatus("POCSO-FAKEID", Status.VERIFIED, "notes"),
      ).to.be.revertedWith("Case not found");
    });

    it("should revert if called by non-admin", async function () {
      await expect(
        registry
          .connect(nonAdmin)
          .updateStatus(sampleReport.caseId, Status.VERIFIED, "Hacked"),
      ).to.be.revertedWith("Not authorized");
    });

    it("should not affect other reports when updating one", async function () {
      await registry.submitReport(
        "POCSO-OTHER1",
        sampleReport.ipfsCID,
        50,
        sampleReport.evidenceHash,
        "harassment",
      );

      await registry.updateStatus(sampleReport.caseId, Status.CLOSED, "Done");

      const other = await registry.getReport("POCSO-OTHER1");
      expect(other.status).to.equal(Status.RECEIVED);
    });
  });

  // ─────────────────────────────────────────────
  // GET REPORT
  // ─────────────────────────────────────────────
  describe("getReport", function () {
    it("should revert for unknown caseId", async function () {
      await expect(registry.getReport("POCSO-DOESNOTEXIST")).to.be.revertedWith(
        "Case not found",
      );
    });

    it("should return correct data after submit", async function () {
      await registry.submitReport(
        sampleReport.caseId,
        sampleReport.ipfsCID,
        sampleReport.riskScore,
        sampleReport.evidenceHash,
        sampleReport.category,
      );

      const report = await registry.getReport(sampleReport.caseId);
      expect(report.caseId).to.equal(sampleReport.caseId);
    });
  });

  // ─────────────────────────────────────────────
  // GET ALL REPORTS
  // ─────────────────────────────────────────────
  describe("getAllReports", function () {
    it("should return empty array initially", async function () {
      const all = await registry.getAllReports();
      expect(all.length).to.equal(0);
    });

    it("should return all submitted reports", async function () {
      await registry.submitReport(
        "POCSO-AA0001",
        sampleReport.ipfsCID,
        80,
        sampleReport.evidenceHash,
        "CSAM",
      );
      await registry.submitReport(
        "POCSO-BB0002",
        sampleReport.ipfsCID,
        60,
        sampleReport.evidenceHash,
        "harassment",
      );
      await registry.submitReport(
        "POCSO-CC0003",
        sampleReport.ipfsCID,
        30,
        sampleReport.evidenceHash,
        "other",
      );

      const all = await registry.getAllReports();
      expect(all.length).to.equal(3);
      expect(all[0].caseId).to.equal("POCSO-AA0001");
      expect(all[1].caseId).to.equal("POCSO-BB0002");
      expect(all[2].caseId).to.equal("POCSO-CC0003");
    });

    it("should reflect status updates in getAllReports", async function () {
      await registry.submitReport(
        sampleReport.caseId,
        sampleReport.ipfsCID,
        sampleReport.riskScore,
        sampleReport.evidenceHash,
        sampleReport.category,
      );
      await registry.updateStatus(
        sampleReport.caseId,
        Status.ESCALATED,
        "Sent to CBI",
      );

      const all = await registry.getAllReports();
      expect(all[0].status).to.equal(Status.ESCALATED);
      expect(all[0].notes).to.equal("Sent to CBI");
    });
  });

  // ─────────────────────────────────────────────
  // INDEX INTEGRITY (the 1-indexed fix)
  // ─────────────────────────────────────────────
  describe("Index integrity", function () {
    it("should correctly index first report at position 1 (not 0)", async function () {
      await registry.submitReport(
        sampleReport.caseId,
        sampleReport.ipfsCID,
        sampleReport.riskScore,
        sampleReport.evidenceHash,
        sampleReport.category,
      );

      const index = await registry.caseIdToIndex(sampleReport.caseId);
      expect(index).to.equal(1); // 1-indexed
    });

    it("unregistered caseId should return index 0 (not found sentinel)", async function () {
      const index = await registry.caseIdToIndex("POCSO-GHOST");
      expect(index).to.equal(0);
    });

    it("should correctly retrieve report at index 1 via getReport", async function () {
      await registry.submitReport(
        sampleReport.caseId,
        sampleReport.ipfsCID,
        sampleReport.riskScore,
        sampleReport.evidenceHash,
        sampleReport.category,
      );

      // reports[0] is index 1 in mapping — getReport must resolve correctly
      const report = await registry.getReport(sampleReport.caseId);
      expect(report.caseId).to.equal(sampleReport.caseId);
    });
  });

  // ─────────────────────────────────────────────
  // EVENT LOG (for audit trail reader)
  // ─────────────────────────────────────────────
  describe("Event log", function () {
    it("should emit one ReportSubmitted per submission", async function () {
      const tx1 = await registry.submitReport(
        "POCSO-EV0001",
        sampleReport.ipfsCID,
        70,
        sampleReport.evidenceHash,
        "CSAM",
      );
      const tx2 = await registry.submitReport(
        "POCSO-EV0002",
        sampleReport.ipfsCID,
        50,
        sampleReport.evidenceHash,
        "harassment",
      );

      const receipt1 = await tx1.wait();
      const receipt2 = await tx2.wait();

      expect(receipt1.events[0].event).to.equal("ReportSubmitted");
      expect(receipt2.events[0].event).to.equal("ReportSubmitted");
    });

    it("should emit one StatusUpdated per status change", async function () {
      await registry.submitReport(
        sampleReport.caseId,
        sampleReport.ipfsCID,
        sampleReport.riskScore,
        sampleReport.evidenceHash,
        sampleReport.category,
      );

      const tx = await registry.updateStatus(
        sampleReport.caseId,
        Status.VERIFIED,
        "Confirmed",
      );
      const receipt = await tx.wait();

      expect(receipt.events[0].event).to.equal("StatusUpdated");
      expect(receipt.events[0].args.caseId).to.equal(sampleReport.caseId);
      expect(receipt.events[0].args.newStatus).to.equal(Status.VERIFIED);
    });
  });
});
