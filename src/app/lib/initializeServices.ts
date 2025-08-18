import { startBackgroundProcessor } from "./backgroundJobProcessor";

// Initialize all background services
export const initializeServices = () => {
  try {
    console.log("Initializing background services...");

    // Start the background job processor
    startBackgroundProcessor();

    console.log("Background services initialized successfully");
  } catch (error) {
    console.error("Error initializing background services:", error);
  }
};

// Initialize services when this module is imported
if (typeof window === "undefined") {
  // Only run on server side
  initializeServices();
}

export default initializeServices;
