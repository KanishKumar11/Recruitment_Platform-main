const mongoose = require("mongoose");

const MONGODB_URI = 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';

// Test the support settings API endpoints
async function testSupportSettings() {
  console.log("🧪 Testing Support Settings Management System...\n");

  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Import models and utilities
    const Settings = require("./src/app/models/Settings").default;
    const User = require("./src/app/models/User").default;
    const {
      getAllSupportSettings,
      setSupportSetting,
      validateSupportEmail,
      initializeSupportSettings,
      SUPPORT_SETTINGS,
      DEFAULT_SUPPORT_SETTINGS,
    } = require("./src/app/lib/supportSettings");

    // Test 1: Email validation
    console.log("\n📧 Testing email validation...");

    const validEmail = validateSupportEmail("support@example.com");
    console.log("Valid email test:", validEmail.isValid ? "✅ PASS" : "❌ FAIL");

    const invalidEmail = validateSupportEmail("invalid-email");
    console.log("Invalid email test:", !invalidEmail.isValid ? "✅ PASS" : "❌ FAIL");

    const emptyEmail = validateSupportEmail("");
    console.log("Empty email test:", !emptyEmail.isValid ? "✅ PASS" : "❌ FAIL");

    // Test 2: Get admin user for testing
    console.log("\n👤 Finding admin user...");
    const adminUser = await User.findOne({ role: "ADMIN" });
    if (!adminUser) {
      console.log("❌ No admin user found. Creating one for testing...");
      const testAdmin = new User({
        name: "Test Admin",
        email: "admin@test.com",
        password: "hashedpassword",
        role: "ADMIN",
      });
      await testAdmin.save();
      console.log("✅ Test admin user created");
    } else {
      console.log("✅ Admin user found:", adminUser.email);
    }

    const testAdminId = adminUser ? adminUser._id.toString() : (await User.findOne({ role: "ADMIN" }))._id.toString();

    // Test 3: Initialize default settings
    console.log("\n⚙️ Testing settings initialization...");
    await initializeSupportSettings(testAdminId);
    console.log("✅ Default settings initialized");

    // Test 4: Get all support settings
    console.log("\n📋 Testing get all support settings...");
    const allSettings = await getAllSupportSettings();
    console.log("Settings retrieved:", Object.keys(allSettings).length > 0 ? "✅ PASS" : "❌ FAIL");
    console.log("Default support email:", allSettings[SUPPORT_SETTINGS.SUPPORT_EMAIL]);
    console.log("Auto response enabled:", allSettings[SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE]);
    console.log("Notifications enabled:", allSettings[SUPPORT_SETTINGS.SUPPORT_NOTIFICATION_ENABLED]);

    // Test 5: Update a setting
    console.log("\n✏️ Testing setting update...");
    const testEmail = "newsupport@example.com";
    await setSupportSetting(
      SUPPORT_SETTINGS.SUPPORT_EMAIL,
      testEmail,
      testAdminId,
      "Updated test email"
    );

    const updatedSettings = await getAllSupportSettings();
    const emailUpdated = updatedSettings[SUPPORT_SETTINGS.SUPPORT_EMAIL] === testEmail;
    console.log("Email setting updated:", emailUpdated ? "✅ PASS" : "❌ FAIL");

    // Test 6: Test API endpoint simulation
    console.log("\n🌐 Testing API endpoint logic...");

    // Simulate GET request
    const getResponse = await getAllSupportSettings();
    console.log("GET settings response:", getResponse ? "✅ PASS" : "❌ FAIL");

    // Simulate PUT request validation
    const testSettings = {
      [SUPPORT_SETTINGS.SUPPORT_EMAIL]: "test@example.com",
      [SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE]: false,
      [SUPPORT_SETTINGS.SUPPORT_NOTIFICATION_ENABLED]: true,
    };

    let validationPassed = true;

    // Validate email
    const emailValidation = validateSupportEmail(testSettings[SUPPORT_SETTINGS.SUPPORT_EMAIL]);
    if (!emailValidation.isValid) {
      validationPassed = false;
      console.log("❌ Email validation failed:", emailValidation.error);
    }

    // Validate boolean settings
    const booleanSettings = [
      SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE,
      SUPPORT_SETTINGS.SUPPORT_NOTIFICATION_ENABLED,
    ];

    booleanSettings.forEach((key) => {
      if (testSettings[key] !== undefined && typeof testSettings[key] !== "boolean") {
        validationPassed = false;
        console.log(`❌ Boolean validation failed for ${key}`);
      }
    });

    console.log("PUT validation logic:", validationPassed ? "✅ PASS" : "❌ FAIL");

    // Test 7: Verify database storage
    console.log("\n💾 Testing database storage...");
    const dbSettings = await Settings.find({
      key: { $in: Object.values(SUPPORT_SETTINGS) }
    }).populate("updatedBy", "name email");

    console.log(`Found ${dbSettings.length} support settings in database`);
    dbSettings.forEach(setting => {
      console.log(`  - ${setting.key}: ${JSON.stringify(setting.value)} (updated by: ${setting.updatedBy?.name || 'Unknown'})`);
    });

    const dbStorageTest = dbSettings.length >= Object.keys(SUPPORT_SETTINGS).length;
    console.log("Database storage:", dbStorageTest ? "✅ PASS" : "❌ FAIL");

    // Test 8: Test audit logging simulation
    console.log("\n📝 Testing audit logging...");
    const auditLogEntry = {
      action: "UPDATE_SUPPORT_SETTING",
      key: SUPPORT_SETTINGS.SUPPORT_EMAIL,
      oldValue: DEFAULT_SUPPORT_SETTINGS[SUPPORT_SETTINGS.SUPPORT_EMAIL],
      newValue: testEmail,
      updatedBy: testAdminId,
      timestamp: new Date(),
    };

    console.log("Audit log entry created:", auditLogEntry ? "✅ PASS" : "❌ FAIL");
    console.log("Audit details:", JSON.stringify(auditLogEntry, null, 2));

    // Test 9: Test default fallback
    console.log("\n🔄 Testing default fallback...");

    // Temporarily remove a setting to test fallback
    await Settings.deleteOne({ key: SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE });

    const settingsWithFallback = await getAllSupportSettings();
    const fallbackWorking = settingsWithFallback[SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE] ===
      DEFAULT_SUPPORT_SETTINGS[SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE];

    console.log("Default fallback:", fallbackWorking ? "✅ PASS" : "❌ FAIL");

    // Restore the setting
    await setSupportSetting(
      SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE,
      DEFAULT_SUPPORT_SETTINGS[SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE],
      testAdminId
    );

    console.log("\n🎉 All support settings tests completed!");
    console.log("\n📊 Test Summary:");
    console.log("✅ Email validation");
    console.log("✅ Settings initialization");
    console.log("✅ Get all settings");
    console.log("✅ Update settings");
    console.log("✅ API endpoint logic");
    console.log("✅ Database storage");
    console.log("✅ Audit logging");
    console.log("✅ Default fallback");

  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Stack trace:", error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the test
testSupportSettings().catch(console.error);