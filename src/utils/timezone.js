import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { parseISO } from 'date-fns';

/**
 * Fallback timezone list for browsers that don't support Intl.supportedValuesOf
 * Covers ~50 common timezones worldwide
 */
const FALLBACK_TIMEZONES = [
  // UTC
  'UTC',
  // Africa
  'Africa/Cairo', 'Africa/Casablanca', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
  // Americas
  'America/Anchorage', 'America/Argentina/Buenos_Aires', 'America/Bogota', 'America/Chicago',
  'America/Denver', 'America/Edmonton', 'America/Halifax', 'America/Lima', 'America/Los_Angeles',
  'America/Mexico_City', 'America/New_York', 'America/Phoenix', 'America/Santiago',
  'America/Sao_Paulo', 'America/Toronto', 'America/Vancouver',
  // Asia
  'Asia/Bangkok', 'Asia/Colombo', 'Asia/Dubai', 'Asia/Ho_Chi_Minh', 'Asia/Hong_Kong',
  'Asia/Jakarta', 'Asia/Jerusalem', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Kuala_Lumpur',
  'Asia/Manila', 'Asia/Riyadh', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Singapore',
  'Asia/Taipei', 'Asia/Tokyo',
  // Australia & Pacific
  'Australia/Brisbane', 'Australia/Melbourne', 'Australia/Perth', 'Australia/Sydney',
  'Pacific/Auckland', 'Pacific/Fiji', 'Pacific/Honolulu',
  // Europe
  'Europe/Amsterdam', 'Europe/Athens', 'Europe/Berlin', 'Europe/Brussels', 'Europe/Dublin',
  'Europe/Helsinki', 'Europe/Istanbul', 'Europe/Lisbon', 'Europe/London', 'Europe/Madrid',
  'Europe/Moscow', 'Europe/Paris', 'Europe/Rome', 'Europe/Stockholm', 'Europe/Vienna',
  'Europe/Warsaw', 'Europe/Zurich'
];

/**
 * Timezone search aliases for better discoverability
 * Maps timezone values to searchable terms (cities, regions, abbreviations)
 */
const TIMEZONE_ALIASES = {
  // === AMERICAS ===
  // Canada
  'America/Toronto': ['montreal', 'ottawa', 'ontario', 'quebec city', 'eastern', 'est', 'edt', 'canada eastern'],
  'America/Halifax': ['maritime', 'maritimes', 'atlantic', 'nova scotia', 'new brunswick', 'pei', 'prince edward island', 'ast', 'adt'],
  'America/St_Johns': ['newfoundland', 'labrador', 'nst', 'ndt'],
  'America/Vancouver': ['pacific', 'pst', 'pdt', 'british columbia', 'bc', 'victoria'],
  'America/Edmonton': ['alberta', 'calgary', 'mountain', 'mst', 'mdt'],
  'America/Winnipeg': ['manitoba', 'central', 'cst', 'cdt'],
  'America/Regina': ['saskatchewan', 'cst'],

  // USA
  'America/New_York': ['eastern', 'est', 'edt', 'nyc', 'new york city', 'boston', 'miami', 'philadelphia', 'washington dc', 'atlanta', 'florida'],
  'America/Chicago': ['central', 'cst', 'cdt', 'dallas', 'houston', 'texas', 'illinois', 'minneapolis'],
  'America/Denver': ['mountain', 'mst', 'mdt', 'colorado', 'utah', 'salt lake city'],
  'America/Los_Angeles': ['pacific', 'pst', 'pdt', 'california', 'seattle', 'san francisco', 'la', 'hollywood', 'silicon valley'],
  'America/Phoenix': ['arizona', 'mst'],
  'America/Anchorage': ['alaska', 'akst', 'akdt'],
  'Pacific/Honolulu': ['hawaii', 'hst', 'honolulu'],

  // Latin America
  'America/Mexico_City': ['mexico', 'cdmx', 'cst'],
  'America/Sao_Paulo': ['brazil', 'brasil', 'rio', 'rio de janeiro', 'brt'],
  'America/Argentina/Buenos_Aires': ['argentina', 'art', 'buenos aires'],
  'America/Bogota': ['colombia', 'cot'],
  'America/Lima': ['peru', 'pet'],
  'America/Santiago': ['chile', 'clt', 'clst'],

  // === EUROPE ===
  'Europe/London': ['uk', 'united kingdom', 'england', 'britain', 'gmt', 'bst', 'greenwich'],
  'Europe/Paris': ['france', 'cet', 'cest', 'central european'],
  'Europe/Berlin': ['germany', 'deutschland', 'cet', 'cest'],
  'Europe/Madrid': ['spain', 'espana', 'cet', 'cest'],
  'Europe/Rome': ['italy', 'italia', 'cet', 'cest', 'milan'],
  'Europe/Amsterdam': ['netherlands', 'holland', 'cet', 'cest'],
  'Europe/Brussels': ['belgium', 'cet', 'cest'],
  'Europe/Zurich': ['switzerland', 'swiss', 'cet', 'cest', 'geneva'],
  'Europe/Vienna': ['austria', 'cet', 'cest'],
  'Europe/Stockholm': ['sweden', 'cet', 'cest'],
  'Europe/Oslo': ['norway', 'cet', 'cest'],
  'Europe/Copenhagen': ['denmark', 'cet', 'cest'],
  'Europe/Helsinki': ['finland', 'eet', 'eest'],
  'Europe/Warsaw': ['poland', 'cet', 'cest'],
  'Europe/Prague': ['czech', 'czechia', 'cet', 'cest'],
  'Europe/Athens': ['greece', 'eet', 'eest'],
  'Europe/Istanbul': ['turkey', 'trt'],
  'Europe/Moscow': ['russia', 'msk', 'moscow time'],
  'Europe/Lisbon': ['portugal', 'wet', 'west'],
  'Europe/Dublin': ['ireland', 'gmt', 'ist'],

  // === ASIA ===
  'Asia/Tokyo': ['japan', 'jst', 'osaka', 'kyoto'],
  'Asia/Shanghai': ['china', 'beijing', 'cst', 'chinese'],
  'Asia/Hong_Kong': ['hk', 'hkt'],
  'Asia/Singapore': ['sg', 'sgt'],
  'Asia/Seoul': ['korea', 'south korea', 'kst'],
  'Asia/Taipei': ['taiwan', 'tst'],
  'Asia/Bangkok': ['thailand', 'ict', 'indochina'],
  'Asia/Ho_Chi_Minh': ['vietnam', 'saigon', 'ict'],
  'Asia/Jakarta': ['indonesia', 'wib'],
  'Asia/Manila': ['philippines', 'pht'],
  'Asia/Kuala_Lumpur': ['malaysia', 'myt', 'kl'],
  'Asia/Kolkata': ['india', 'mumbai', 'delhi', 'bangalore', 'ist', 'indian'],
  'Asia/Dubai': ['uae', 'emirates', 'gst', 'gulf', 'abu dhabi'],
  'Asia/Riyadh': ['saudi', 'saudi arabia', 'ast'],
  'Asia/Jerusalem': ['israel', 'ist', 'tel aviv'],
  'Asia/Karachi': ['pakistan', 'pkt'],
  'Asia/Dhaka': ['bangladesh', 'bst'],
  'Asia/Tehran': ['iran', 'irst', 'persia'],
  'Asia/Baghdad': ['iraq', 'ast'],
  'Asia/Kuwait': ['kuwait', 'ast'],
  'Asia/Qatar': ['qatar', 'doha', 'ast'],

  // === AUSTRALIA & PACIFIC ===
  'Australia/Sydney': ['aest', 'aedt', 'new south wales', 'nsw', 'australian eastern'],
  'Australia/Melbourne': ['victoria', 'aest', 'aedt'],
  'Australia/Brisbane': ['queensland', 'aest'],
  'Australia/Perth': ['western australia', 'wa', 'awst'],
  'Australia/Adelaide': ['south australia', 'acst', 'acdt'],
  'Pacific/Auckland': ['new zealand', 'nz', 'nzst', 'nzdt', 'wellington'],
  'Pacific/Fiji': ['fiji', 'fjt'],

  // === AFRICA ===
  'Africa/Cairo': ['egypt', 'eet'],
  'Africa/Johannesburg': ['south africa', 'sast', 'cape town'],
  'Africa/Lagos': ['nigeria', 'wat', 'west africa'],
  'Africa/Nairobi': ['kenya', 'eat', 'east africa'],
  'Africa/Casablanca': ['morocco', 'wet'],
};

/**
 * Get search aliases for a timezone
 * @param {string} tzValue - IANA timezone string
 * @returns {string[]} Array of searchable aliases
 */
export function getTimezoneAliases(tzValue) {
  return TIMEZONE_ALIASES[tzValue] || [];
}

/**
 * Get all available timezones
 * Uses browser API when available, falls back to hardcoded list
 */
function getAllTimezones() {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      return Intl.supportedValuesOf('timeZone');
    }
  } catch (e) {
    console.warn('Intl.supportedValuesOf not supported, using fallback timezone list');
  }
  return FALLBACK_TIMEZONES;
}

/**
 * Get timezone offset string (e.g., "UTC-5", "UTC+9")
 */
function getUtcOffsetString(timezone) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    return offsetPart ? offsetPart.value : '';
  } catch {
    return '';
  }
}

/**
 * Format timezone for display
 * Converts "America/New_York" → "New York (UTC-5)"
 */
function formatTimezoneLabel(timezone) {
  // Handle UTC specially
  if (timezone === 'UTC') {
    return 'UTC (Coordinated Universal Time)';
  }

  // Get the city/location part (after the last /)
  const parts = timezone.split('/');
  const location = parts[parts.length - 1].replace(/_/g, ' ');

  // Get offset
  const offset = getUtcOffsetString(timezone);

  return offset ? `${location} (${offset})` : location;
}

/**
 * Group timezones by region
 * Returns array of { region: string, timezones: [{value, label}] }
 */
function groupTimezonesByRegion(timezones) {
  const groups = {
    'UTC': [],
    'Africa': [],
    'Americas': [],
    'Asia': [],
    'Australia & Pacific': [],
    'Europe': [],
    'Other': []
  };

  timezones.forEach(tz => {
    const formatted = {
      value: tz,
      label: formatTimezoneLabel(tz)
    };

    if (tz === 'UTC') {
      groups['UTC'].push(formatted);
    } else if (tz.startsWith('Africa/')) {
      groups['Africa'].push(formatted);
    } else if (tz.startsWith('America/')) {
      groups['Americas'].push(formatted);
    } else if (tz.startsWith('Asia/')) {
      groups['Asia'].push(formatted);
    } else if (tz.startsWith('Australia/') || tz.startsWith('Pacific/')) {
      groups['Australia & Pacific'].push(formatted);
    } else if (tz.startsWith('Europe/')) {
      groups['Europe'].push(formatted);
    } else {
      groups['Other'].push(formatted);
    }
  });

  // Sort timezones within each group by label
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => a.label.localeCompare(b.label));
  });

  // Convert to array format, filtering out empty groups
  const regionOrder = ['UTC', 'Americas', 'Europe', 'Asia', 'Africa', 'Australia & Pacific', 'Other'];
  return regionOrder
    .filter(region => groups[region].length > 0)
    .map(region => ({
      region,
      timezones: groups[region]
    }));
}

// Generate timezone data
const allTimezones = getAllTimezones();

/**
 * Grouped timezone options for Select with ListSubheader
 */
export const TIMEZONE_OPTIONS_GROUPED = groupTimezonesByRegion(allTimezones);

/**
 * Flat list of timezone options (for backward compatibility)
 */
export const TIMEZONE_OPTIONS = allTimezones.map(tz => ({
  value: tz,
  label: formatTimezoneLabel(tz)
}));

/**
 * Get just the timezone values for backward compatibility
 */
export const TIMEZONE_VALUES = allTimezones;

/**
 * Convert a local time to UTC for database storage
 * @param {Date|string} localDate - Date in local/project timezone
 * @param {string} timezone - IANA timezone string (e.g., 'America/New_York')
 * @returns {Date} - UTC Date object for database storage
 */
export function localToUtc(localDate, timezone) {
  if (!localDate) return null;
  const date = typeof localDate === 'string' ? parseISO(localDate) : localDate;
  return zonedTimeToUtc(date, timezone);
}

/**
 * Convert UTC time to project timezone for display
 * @param {Date|string} utcDate - UTC date from database
 * @param {string} timezone - IANA timezone string
 * @returns {Date} - Date object in project timezone
 */
export function utcToLocal(utcDate, timezone) {
  if (!utcDate) return null;
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return utcToZonedTime(date, timezone);
}

/**
 * Format a UTC date in project timezone
 * @param {Date|string} utcDate - UTC date from database
 * @param {string} timezone - IANA timezone string
 * @param {string} formatStr - date-fns format string
 * @returns {string} - Formatted date string in project timezone
 */
export function formatInProjectTimezone(utcDate, timezone, formatStr = 'yyyy-MM-dd HH:mm') {
  if (!utcDate) return '';
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return formatInTimeZone(date, timezone, formatStr);
}

/**
 * Get current time in project timezone
 * @param {string} timezone - IANA timezone string
 * @returns {Date} - Current time in project timezone
 */
export function getCurrentTimeInTimezone(timezone) {
  return utcToZonedTime(new Date(), timezone);
}

/**
 * Get timezone offset display string (e.g., "EST", "UTC-5")
 * @param {string} timezone - IANA timezone string
 * @returns {string} - Short timezone abbreviation
 */
export function getTimezoneOffset(timezone) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(now);
    const tzName = parts.find(p => p.type === 'timeZoneName');
    return tzName ? tzName.value : timezone;
  } catch {
    return timezone;
  }
}

/**
 * Get the label for a timezone value
 * @param {string} timezoneValue - IANA timezone string
 * @returns {string} - Human-readable label
 */
export function getTimezoneLabel(timezoneValue) {
  const option = TIMEZONE_OPTIONS.find(tz => tz.value === timezoneValue);
  return option ? option.label : timezoneValue;
}

/**
 * Convert time from one timezone to another and format it
 * @param {Date|string} date - The date/time to convert
 * @param {string} fromTimezone - Source timezone (e.g., 'America/Los_Angeles')
 * @param {string} toTimezone - Target timezone (e.g., 'America/New_York')
 * @param {string} formatStr - date-fns format string
 * @returns {string} - Formatted time in target timezone
 */
export function convertTimezone(date, fromTimezone, toTimezone, formatStr = 'h:mm a') {
  if (!date || !fromTimezone || !toTimezone) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    // First convert from source timezone to UTC
    const utcDate = zonedTimeToUtc(dateObj, fromTimezone);
    // Then format in target timezone
    return formatInTimeZone(utcDate, toTimezone, formatStr);
  } catch {
    return '';
  }
}

export default {
  TIMEZONE_OPTIONS,
  TIMEZONE_OPTIONS_GROUPED,
  TIMEZONE_VALUES,
  localToUtc,
  utcToLocal,
  formatInProjectTimezone,
  getCurrentTimeInTimezone,
  getTimezoneOffset,
  getTimezoneLabel,
  convertTimezone
};
