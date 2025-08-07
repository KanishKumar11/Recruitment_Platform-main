import Settings from "@/app/models/Settings";

// Support-specific setting keys
export const SUPPORT_SETTINGS = {
  SUPPORT_EMAIL: "support_email",
  SUPPORT_AUTO_RESPONSE: "support_auto_response",
  SUPPORT_EMAIL_TEMPLATE: "support_email_template",
  SUPPORT_NOTIFICATION_ENABLED: "support_notification_enabled",
} as const;

// Default support settings
export const DEFAULT_SUPPORT_SETTINGS = {
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

/**
 * Get a support setting value
 */
export async function getSupportSetting(
  key: string,
  defaultValue?: any
): Promise<any> {
  try {
    const setting = await Settings.findOne({ key });
    return setting
      ? setting.value
      : defaultValue ||
          DEFAULT_SUPPORT_SETTINGS[
            key as keyof typeof DEFAULT_SUPPORT_SETTINGS
          ];
  } catch (error) {
    console.error(`Error getting support setting ${key}:`, error);
    return (
      defaultValue ||
      DEFAULT_SUPPORT_SETTINGS[key as keyof typeof DEFAULT_SUPPORT_SETTINGS]
    );
  }
}

/**
 * Set a support setting value
 */
export async function setSupportSetting(
  key: string,
  value: any,
  updatedBy: string,
  description?: string
): Promise<void> {
  try {
    await Settings.findOneAndUpdate(
      { key },
      {
        value,
        description,
        updatedBy,
      },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (error) {
    console.error(`Error setting support setting ${key}:`, error);
    throw error;
  }
}

/**
 * Get all support settings
 */
export async function getAllSupportSettings(): Promise<Record<string, any>> {
  try {
    const supportKeys = Object.values(SUPPORT_SETTINGS);
    const settings = await Settings.find({ key: { $in: supportKeys } });

    const result: Record<string, any> = {};

    // Add existing settings
    settings.forEach((setting) => {
      result[setting.key] = setting.value;
    });

    // Add default values for missing settings
    supportKeys.forEach((key) => {
      if (!(key in result)) {
        result[key] =
          DEFAULT_SUPPORT_SETTINGS[
            key as keyof typeof DEFAULT_SUPPORT_SETTINGS
          ];
      }
    });

    return result;
  } catch (error) {
    console.error("Error getting all support settings:", error);
    return DEFAULT_SUPPORT_SETTINGS;
  }
}

/**
 * Initialize default support settings if they don't exist
 */
export async function initializeSupportSettings(
  adminUserId: string
): Promise<void> {
  try {
    const supportKeys = Object.values(SUPPORT_SETTINGS);
    const existingSettings = await Settings.find({ key: { $in: supportKeys } });
    const existingKeys = existingSettings.map((s) => s.key);

    const settingsToCreate = supportKeys.filter(
      (key) => !existingKeys.includes(key)
    );

    if (settingsToCreate.length > 0) {
      const newSettings = settingsToCreate.map((key) => ({
        key,
        value:
          DEFAULT_SUPPORT_SETTINGS[
            key as keyof typeof DEFAULT_SUPPORT_SETTINGS
          ],
        description: getSettingDescription(key),
        updatedBy: adminUserId,
      }));

      await Settings.insertMany(newSettings);
      console.log(`Initialized ${newSettings.length} default support settings`);
    }
  } catch (error) {
    console.error("Error initializing support settings:", error);
  }
}

/**
 * Get description for a setting key
 */
function getSettingDescription(key: string): string {
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

/**
 * Validate support email format
 */
export function validateSupportEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || email.trim().length === 0) {
    return { isValid: false, error: "Email is required" };
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Invalid email format" };
  }

  return { isValid: true };
}
