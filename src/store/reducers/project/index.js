// Only re-export from projects.js — the other slices (agenda, groups, participants, settings)
// are imported directly by their consumers, and their exports conflict with projects.js
// (e.g. setLoading, getGroupsSuccess). Groups state uses store/entities/groupsSlice + RTK Query.
export * from "./projects";

// Import and export the main projects reducer
import projectsReducer from "./projects";
export default projectsReducer;