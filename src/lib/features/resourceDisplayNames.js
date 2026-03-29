/**
 * Human-readable display names for resource limit errors.
 * Used by the global ResourceLimitProvider to show polished limit dialogs.
 */
export const RESOURCE_DISPLAY_NAMES = {
  projects: { label: 'Projects', noun: 'projects' },
  participants: { label: 'Participants', noun: 'participants' },
  sub_organizations: { label: 'Sub-Organizations', noun: 'sub-organizations' },
  instructors: { label: 'Instructors', noun: 'instructors' },
  courses: { label: 'Courses', noun: 'courses' },
  curriculums: { label: 'Curriculums', noun: 'curriculums' },
  projects_per_month: { label: 'Monthly Projects', noun: 'projects this month' },
  custom_roles: { label: 'Custom Roles', noun: 'custom participant roles' },
  emails_per_month: { label: 'Monthly Emails', noun: 'emails this month' },
  training_recipients: { label: 'Training Recipients', noun: 'training recipients' },
  smart_pulse_per_day: { label: 'SmartPulse AI', noun: 'SmartPulse calls today' }
};

/**
 * Given an error body, extract a human-readable resource label.
 * Prefers the explicit `resource` field, falls back to parsing the message.
 */
export function getResourceLabel(errorData) {
  if (errorData?.resource && RESOURCE_DISPLAY_NAMES[errorData.resource]) {
    return RESOURCE_DISPLAY_NAMES[errorData.resource].label;
  }
  const match = errorData?.message?.match(/your (\S+) limit/);
  if (match && RESOURCE_DISPLAY_NAMES[match[1]]) {
    return RESOURCE_DISPLAY_NAMES[match[1]].label;
  }
  return null;
}

/**
 * Given an error body, extract a human-readable resource noun for sentences.
 * e.g., "training recipients", "SmartPulse calls today"
 */
export function getResourceNoun(errorData) {
  if (errorData?.resource && RESOURCE_DISPLAY_NAMES[errorData.resource]) {
    return RESOURCE_DISPLAY_NAMES[errorData.resource].noun;
  }
  const match = errorData?.message?.match(/your (\S+) limit/);
  if (match && RESOURCE_DISPLAY_NAMES[match[1]]) {
    return RESOURCE_DISPLAY_NAMES[match[1]].noun;
  }
  return 'this resource';
}
