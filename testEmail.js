require("dotenv").config();
const sendVerificationEmail = require("./emailSender"); // ✅ Ensure correct import

const emailToSend = "airdrop1x1x1@gmail.com"; // ✅ Update to the correct email
const otpCode = "123456";

console.log("📧 Calling sendVerificationEmail with:", emailToSend);
sendVerificationEmail(emailToSend, otpCode);
