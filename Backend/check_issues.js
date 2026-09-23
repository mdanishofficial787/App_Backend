require("dotenv").config();
const mongoose = require("mongoose");
const IssueReport = require("./schema/IssueReport");
require("./schema/Driver");

async function checkIssues() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const issues = await IssueReport.find()
      .populate("driver", "Name PhoneNumber Email driverReferenceId")
      .sort({ createdAt: -1 })
      .lean();

    console.log("\n=================== ADMIN: REPORTED ISSUES ===================");
    console.log(`Total Issues Found: ${issues.length}\n`);

    if (issues.length === 0) {
      console.log("No issues reported yet.");
    } else {
      issues.forEach((issue, index) => {
        console.log(`[Issue #${index + 1}]`);
        console.log(`  Driver Name : ${issue.driver?.Name || issue.driverName || "N/A"}`);
        console.log(`  Driver Phone: ${issue.driver?.PhoneNumber || "N/A"}`);
        console.log(`  Reason      : ${issue.reason}`);
        console.log(`  Status      : ${issue.status}`);
        console.log(`  Date Range  : ${new Date(issue.fromDate).toLocaleDateString()} -> ${new Date(issue.toDate).toLocaleDateString()}`);
        console.log(`  Time Range  : ${issue.fromTime} -> ${issue.toTime}`);
        console.log(`  Details     : ${issue.details}`);
        console.log(`  Reported At : ${new Date(issue.createdAt).toLocaleString()}`);
        console.log("--------------------------------------------------------------");
      });
    }
    process.exit(0);
  } catch (err) {
    console.error("Error reading issues:", err.message);
    process.exit(1);
  }
}

checkIssues();
