// Export all actions from the main projects reducer
export * from "./projects";
export * from "./agenda";
export * from "./groups";
export * from "./participants";
export * from "./settings";
// dashboard removed - using derived selectors (selectCompleteDashboard)

// Import and export the main projects reducer
import projectsReducer from "./projects";
export default projectsReducer;