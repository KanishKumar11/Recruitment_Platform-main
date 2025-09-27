import Settings from "@/app/models/Settings";

// Email notification setting keys
export const EMAIL_NOTIFICATION_SETTINGS = {
  JOB_NOTIFICATION_FREQUENCY: "job_notification_frequency",
  END_OF_DAY_NOTIFICATIONS: "end_of_day_notifications",
  END_OF_DAY_TIME: "end_of_day_time", // Time to send end-of-day emails (24-hour format)
  NOTIFICATION_ENABLED: "email_notifications_enabled",
} as const;

// Default email notification settings
export const DEFAULT_EMAIL_NOTIFICATION_SETTINGS = {
  [EMAIL_NOTIFICATION_SETTINGS.JOB_NOTIFICATION_FREQUENCY]: 5, // Send when jobs reach 5 applications
  [EMAIL_NOTIFICATION_SETTINGS.END_OF_DAY_NOTIFICATIONS]: true, // Enable end-of-day emails
  [EMAIL_NOTIFICATION_SETTINGS.END_OF_DAY_TIME]: "18:00", // 6 PM
  [EMAIL_NOTIFICATION_SETTINGS.NOTIFICATION_ENABLED]: true, // Enable all notifications
};

/**
 * Initialize default email notification settings if they don't exist
 */
export const initializeEmailNotificationSettings = async (
  updatedBy: string
): Promise<void> => {
  try {
    const settingKeys = Object.values(EMAIL_NOTIFICATION_SETTINGS);
    const existingSettings = await Settings.find({ key: { $in: settingKeys } });
    const existingKeys = existingSettings.map(setting => setting.key);

    const settingsToCreate = settingKeys.filter(key => !existingKeys.includes(key));

    if (settingsToCreate.length > 0) {
      const createPromises = settingsToCreate.map(key => {
        const constName = Object.keys(EMAIL_NOTIFICATION_SETTINGS).find(
          name => EMAIL_NOTIFICATION_SETTINGS[name as keyof typeof EMAIL_NOTIFICATION_SETTINGS] === key
        );
        const defaultValue = DEFAULT_EMAIL_NOTIFICATION_SETTINGS[constName as keyof typeof DEFAULT_EMAIL_NOTIFICATION_SETTINGS];

        return Settings.create({
          key,
          value: defaultValue,
          description: getSettingDescription(key),
          updatedBy,
        });
      });

      await Promise.all(createPromises);
      console.log(`Initialized ${settingsToCreate.length} default email notification settings`);
    }
  } catch (error) {
    console.error("Error initializing email notification settings:", error);
  }
};
export const getAllEmailNotificationSettings = async (): Promise<
  Record<string, any>
> => {
  try {
    const settingKeys = Object.values(EMAIL_NOTIFICATION_SETTINGS);
    const settings = await Settings.find({ key: { $in: settingKeys } });

    const settingsMap: Record<string, any> = {};

    // Set defaults first
    Object.entries(DEFAULT_EMAIL_NOTIFICATION_SETTINGS).forEach(
      ([key, value]) => {
        settingsMap[key] = value;
      }
    );

    // Create reverse mapping from database key to constant name
    const keyMapping: Record<string, string> = {};
    Object.entries(EMAIL_NOTIFICATION_SETTINGS).forEach(([constName, dbKey]) => {
      keyMapping[dbKey] = constName;
    });

    // Override with actual settings from database
    settings.forEach((setting) => {
      const constName = keyMapping[setting.key];
      if (constName) {
        settingsMap[constName] = setting.value;
      }
    });

    return settingsMap;
  } catch (error) {
    console.error("Error fetching email notification settings:", error);
    return DEFAULT_EMAIL_NOTIFICATION_SETTINGS;
  }
};

/**
 * Get a specific email notification setting
 */
export const getEmailNotificationSetting = async (
  key: string
): Promise<any> => {
  try {
    const setting = await Settings.findOne({ key });
    if (setting) {
      return setting.value;
    }

    // Return default if not found
    return DEFAULT_EMAIL_NOTIFICATION_SETTINGS[
      key as keyof typeof DEFAULT_EMAIL_NOTIFICATION_SETTINGS
    ];
  } catch (error) {
    console.error(`Error fetching email notification setting ${key}:`, error);
    return DEFAULT_EMAIL_NOTIFICATION_SETTINGS[
      key as keyof typeof DEFAULT_EMAIL_NOTIFICATION_SETTINGS
    ];
  }
};

/**
 * Update email notification settings
 */
export const updateEmailNotificationSettings = async (
  settings: Record<string, any>,
  updatedBy: string
): Promise<void> => {
  try {
    const updatePromises = Object.entries(settings).map(
      async ([key, value]) => {
        // Validate the setting key
        if (!Object.values(EMAIL_NOTIFICATION_SETTINGS).includes(key as any)) {
          throw new Error(`Invalid setting key: ${key}`);
        }

        // Validate the value based on the setting type
        validateSettingValue(key, value);

        return Settings.findOneAndUpdate(
          { key },
          {
            value,
            description: getSettingDescription(key),
            updatedBy,
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          }
        );
      }
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error updating email notification settings:", error);
    throw error;
  }
};

/**
 * Validate setting value based on its type
 */
function validateSettingValue(key: string, value: any): void {
  switch (key) {
    case EMAIL_NOTIFICATION_SETTINGS.JOB_NOTIFICATION_FREQUENCY:
      if (!Number.isInteger(value) || value < 1 || value > 50) {
        throw new Error(
          "Job notification frequency must be an integer between 1 and 50"
        );
      }
      break;
    case EMAIL_NOTIFICATION_SETTINGS.END_OF_DAY_NOTIFICATIONS:
    case EMAIL_NOTIFICATION_SETTINGS.NOTIFICATION_ENABLED:
      if (typeof value !== "boolean") {
        throw new Error("Boolean value expected");
      }
      break;
    case EMAIL_NOTIFICATION_SETTINGS.END_OF_DAY_TIME:
      if (
        typeof value !== "string" ||
        !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
      ) {
        throw new Error("Time must be in HH:MM format (24-hour)");
      }
      break;
    default:
      break;
  }
}

/**
 * Get description for a setting key
 */
function getSettingDescription(key: string): string {
  switch (key) {
    case EMAIL_NOTIFICATION_SETTINGS.JOB_NOTIFICATION_FREQUENCY:
      return "Number of applications per job after which to send notification emails to recruiters";
    case EMAIL_NOTIFICATION_SETTINGS.END_OF_DAY_NOTIFICATIONS:
      return "Whether to send end-of-day notification emails even if the frequency threshold is not met";
    case EMAIL_NOTIFICATION_SETTINGS.END_OF_DAY_TIME:
      return "Time of day to send end-of-day notification emails (24-hour format HH:MM)";
    case EMAIL_NOTIFICATION_SETTINGS.NOTIFICATION_ENABLED:
      return "Whether email notifications to recruiters are enabled globally";
    default:
      return "Email notification system setting";
  }
}

/**
 * Check if notifications are enabled
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await getEmailNotificationSetting(
      EMAIL_NOTIFICATION_SETTINGS.NOTIFICATION_ENABLED
    );
    return Boolean(enabled);
  } catch (error) {
    console.error("Error checking if notifications are enabled:", error);
    return true; // Default to enabled
  }
};

/**
 * Get job notification frequency
 */
export const getJobNotificationFrequency = async (): Promise<number> => {
  try {
    const frequency = await getEmailNotificationSetting(
      EMAIL_NOTIFICATION_SETTINGS.JOB_NOTIFICATION_FREQUENCY
    );
    return Number(frequency) || 5; // Default to 5
  } catch (error) {
    console.error("Error getting job notification frequency:", error);
    return 5; // Default to 5
  }
};

/**
 * Check if end-of-day notifications are enabled
 */
export const areEndOfDayNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await getEmailNotificationSetting(
      EMAIL_NOTIFICATION_SETTINGS.END_OF_DAY_NOTIFICATIONS
    );
    return Boolean(enabled);
  } catch (error) {
    console.error(
      "Error checking if end-of-day notifications are enabled:",
      error
    );
    return true; // Default to enabled
  }
};

/**
 * Get end-of-day notification time
 */
export const getEndOfDayTime = async (): Promise<string> => {
  try {
    const time = await getEmailNotificationSetting(
      EMAIL_NOTIFICATION_SETTINGS.END_OF_DAY_TIME
    );
    return String(time) || "18:00"; // Default to 6 PM
  } catch (error) {
    console.error("Error getting end-of-day time:", error);
    return "18:00"; // Default to 6 PM
  }
};
