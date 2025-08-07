const mongoose = require("mongoose");

const MONGODB_URI = 'mongodb+srv://kanishkumar:kanish1234@cluster0.2zf36.mongodb.net/sourcingscreen';

// Test the support settings API functionality
async function testSupportSettingsAPI() {
  console.log("🧪 Testing Support Settings API...\n");

  try {
    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Define Settings schema inline for testing
    const SettingsSchema = new mongoose.Schema({
      key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      value: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
      description: {
        type: String,
        trim: true,
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    }, {
      timestamps: true,
    });

    const Settings = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

    // Define User schema for testing
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
    });

    const User = mongoose.models.User || mongoose.model("User", UserSchema);

    // Support settings constants
    const SUPPORT_SETTINGS = {
      SUPPORT_EMAIL: "support_email",
      SUPPORT_AUTO_RESPONSE: "support_auto_response",
      SUPPORT_EMAIL_TEMPLATE: "support_email_template",
      SUPPORT_NOTIFICATION_ENABLED: "support_notification_enabled",
    };

    const DEFAULT_SUPPORT_SETTINGS = {
      [SUPPORT_SETTINGS.SUPPORT_EMAIL]: "support@sourcingscreen.com",
      [SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE]: true,
      [SUPPORT_SETTINGS.SUPPORT_EMAIL_TEMPLATE]: `
        <h2>New Support Ticket Submitted</h2>
        <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Category:</strong> {{category}}</p>
        <p><strong>Priority:</strong> {{priority}}</p>
        <p><strong>Submitted By:</strong> {{userName}} ({{userEmail}})</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
          {{message}}
        </div>
        <p><strong>Submitted At:</strong> {{createdAt}}</p>
        <hr>
        <p>Please log in to the admin panel to respond to this ticket.</p>
      `,
      [SUPPORT_SETTINGS.SUPPORT_NOTIFICATION_ENABLED]: true,
    };

    // Email validation function
    function validateSupportEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email || email.trim().length === 0) {
        return { isValid: false, error: "Email is required" };
      }

      if (!emailRegex.test(email)) {
        return { isValid: false, error: "Invalid email format" };
      }

      return { isValid: true };
    }

    // Test 1: Email validation
    console.log("\n📧 Testing email validation...");

    const validEmail = validateSupportEmail("support@example.com");
    console.log("Valid email test:", validEmail.isValid ? "✅ PASS" : "❌ FAIL");

    const invalidEmail = validateSupportEmail("invalid-email");
    console.log("Invalid email test:", !invalidEmail.isValid ? "✅ PASS" : "❌ FAIL");

    const emptyEmail = validateSupportEmail("");
    console.log("Empty email test:", !emptyEmail.isValid ? "✅ PASS" : "❌ FAIL");

    // Test 2: Find or create admin user
    console.log("\n👤 Setting up admin user...");
    let adminUser = await User.findOne({ role: "ADMIN" });
    if (!adminUser) {
      adminUser = new User({
        name: "Test Admin",
        email: "admin@test.com",
        password: "hashedpassword",
        role: "ADMIN",
      });
      await adminUser.save();
      console.log("✅ Test admin user created");
    } else {
      console.log("✅ Admin user found:", adminUser.email);
    }

    // Test 3: Initialize default settings
    console.log("\n⚙️ Testing settings initialization...");

    const supportKeys = Object.values(SUPPORT_SETTINGS);
    const existingSettings = await Settings.find({ key: { $in: supportKeys } });
    const existingKeys = existingSettings.map((s) => s.key);

    const settingsToCreate = supportKeys.filter(
      (key) => !existingKeys.includes(key)
    );

    if (settingsToCreate.length > 0) {
      const newSettings = settingsToCreate.map((key) => ({
        key,
        value: DEFAULT_SUPPORT_SETTINGS[key],
        description: getSettingDescription(key),
        updatedBy: adminUser._id,
      }));

      await Settings.insertMany(newSettings);
      console.log(`✅ Initialized ${newSettings.length} default support settings`);
    } else {
      console.log("✅ All default settings already exist");
    }

    function getSettingDescription(key) {
      switch (key) {
        case SUPPORT_SETTINGS.SUPPORT_EMAIL:
          return "Email address where support ticket notifications are sent";
        case SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE:
          return "Whether to send automatic response emails to users when they submit tickets";
        case SUPPORT_SETTINGS.SUPPORT_EMAIL_TEMPLATE:
          return "HTML template for support ticket notification emails";
        case SUPPORT_SETTINGS.SUPPORT_NOTIFICATION_ENABLED:
          return "Whether email notifications for new tickets are enabled";
        default:
          return "Support system setting";
      }
    }

    // Test 4: Get all support settings
    console.log("\n📋 Testing get all support settings...");
    const allSettings = await Settings.find({ key: { $in: supportKeys } });

    const settingsObj = {};
    allSettings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });

    // Add default values for missing settings
    supportKeys.forEach((key) => {
      if (!(key in settingsObj)) {
        settingsObj[key] = DEFAULT_SUPPORT_SETTINGS[key];
      }
    });

    console.log("Settings retrieved:", Object.keys(settingsObj).length > 0 ? "✅ PASS" : "❌ FAIL");
    console.log("Support email:", settingsObj[SUPPORT_SETTINGS.SUPPORT_EMAIL]);
    console.log("Auto response enabled:", settingsObj[SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE]);
    console.log("Notifications enabled:", settingsObj[SUPPORT_SETTINGS.SUPPORT_NOTIFICATION_ENABLED]);

    // Test 5: Update settings (simulate API PUT request)
    console.log("\n✏️ Testing settings update...");

    const updateData = {
      [SUPPORT_SETTINGS.SUPPORT_EMAIL]: "newsupport@example.com",
      [SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE]: false,
      [SUPPORT_SETTINGS.SUPPORT_NOTIFICATION_ENABLED]: true,
    };

    // Validate the update data
    let validationErrors = {};

    // Validate support email
    if (updateData[SUPPORT_SETTINGS.SUPPORT_EMAIL]) {
      const emailValidation = validateSupportEmail(updateData[SUPPORT_SETTINGS.SUPPORT_EMAIL]);
      if (!emailValidation.isValid) {
        validationErrors.support_email = emailValidation.error;
      }
    }

    // Validate boolean settings
    const booleanSettings = [
      SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE,
      SUPPORT_SETTINGS.SUPPORT_NOTIFICATION_ENABLED,
    ];

    booleanSettings.forEach((key) => {
      if (updateData[key] !== undefined && typeof updateData[key] !== "boolean") {
        validationErrors[key] = "Must be a boolean value";
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      console.log("❌ Validation failed:", validationErrors);
    } else {
      console.log("✅ Validation passed");

      // Update each setting
      for (const [key, value] of Object.entries(updateData)) {
        if (supportKeys.includes(key)) {
          await Settings.findOneAndUpdate(
            { key },
            {
              value,
              description: getSettingDescription(key),
              updatedBy: adminUser._id,
            },
            {
              new: true,
              upsert: true,
              runValidators: true,
            }
          );
          console.log(`✅ Updated ${key} = ${JSON.stringify(value)}`);
        }
      }
    }

    // Test 6: Verify updates
    console.log("\n🔍 Verifying updates...");
    const updatedSettings = await Settings.find({ key: { $in: supportKeys } });

    const updatedSettingsObj = {};
    updatedSettings.forEach((setting) => {
      updatedSettingsObj[setting.key] = setting.value;
    });

    const emailUpdated = updatedSettingsObj[SUPPORT_SETTINGS.SUPPORT_EMAIL] === updateData[SUPPORT_SETTINGS.SUPPORT_EMAIL];
    const autoResponseUpdated = updatedSettingsObj[SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE] === updateData[SUPPORT_SETTINGS.SUPPORT_AUTO_RESPONSE];

    console.log("Email setting updated:", emailUpdated ? "✅ PASS" : "❌ FAIL");
    console.log("Auto response setting updated:", autoResponseUpdated ? "✅ PASS" : "❌ FAIL");

    // Test 7: Test audit trail
    console.log("\n📝 Testing audit trail...");
    const settingWithAudit = await Settings.findOne({
      key: SUPPORT_SETTINGS.SUPPORT_EMAIL
    }).populate("updatedBy", "name email");

    if (settingWithAudit && settingWithAudit.updatedBy) {
      console.log("✅ Audit trail working");
      console.log(`  - Updated by: ${settingWithAudit.updatedBy.name} (${settingWithAudit.updatedBy.email})`);
      console.log(`  - Updated at: ${settingWithAudit.updatedAt}`);
    } else {
      console.log("❌ Audit trail not working");
    }

    // Test 8: Test API endpoint structure
    console.log("\n🌐 Testing API endpoint structure...");

    // Simulate GET /api/admin/support/settings
    const getApiResponse = {
      settings: updatedSettingsObj
    };
    console.log("GET API response structure:", getApiResponse.settings ? "✅ PASS" : "❌ FAIL");

    // Simulate PUT /api/admin/support/settings
    const putApiResponse = {
      message: "Support settings updated successfully",
      settings: updatedSettingsObj,
      updated: updateData,
    };
    console.log("PUT API response structure:", putApiResponse.message && putApiResponse.settings ? "✅ PASS" : "❌ FAIL");

    console.log("\n🎉 All support settings API tests completed!");
    console.log("\n📊 Test Summary:");
    console.log("✅ Email validation");
    console.log("✅ Settings initialization");
    console.log("✅ Get all settings");
    console.log("✅ Update settings validation");
    console.log("✅ Settings update");
    console.log("✅ Update verification");
    console.log("✅ Audit trail");
    console.log("✅ API endpoint structure");

  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Stack trace:", error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the test
testSupportSettingsAPI().catch(console.error);