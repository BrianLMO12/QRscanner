/**
 * QR Parser - Detects and parses different QR code content types
 */

export const QR_TYPES = {
  JSON: 'json',
  VCARD: 'vcard',
  URL: 'url',
  WIFI: 'wifi',
  EMAIL: 'email',
  PHONE: 'phone',
  TEXT: 'text',
};

/**
 * Determine the type of QR code content
 */
export const detectQRType = (content) => {
  if (!content) return QR_TYPES.TEXT;

  // JSON detection
  if ((content.trim().startsWith('{') && content.trim().endsWith('}')) ||
    (content.trim().startsWith('[') && content.trim().endsWith(']'))) {
    return QR_TYPES.JSON;
  }

  // vCard detection
  if (content.startsWith('BEGIN:VCARD')) {
    return QR_TYPES.VCARD;
  }

  // WiFi detection
  if (content.startsWith('WIFI:')) {
    return QR_TYPES.WIFI;
  }

  // Email detection
  if (content.startsWith('mailto:')) {
    return QR_TYPES.EMAIL;
  }

  // Phone detection
  if (content.startsWith('tel:')) {
    return QR_TYPES.PHONE;
  }

  // URL detection
  if (content.startsWith('http://') || content.startsWith('https://')) {
    return QR_TYPES.URL;
  }

  // Default to plain text
  return QR_TYPES.TEXT;
};

/**
 * Parse JSON content
 */
const parseJSON = (content) => {
  try {
    const data = JSON.parse(content);
    const entries = [];

    const flattenObject = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const displayKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flattenObject(value, displayKey);
        } else if (Array.isArray(value)) {
          entries.push({
            key: displayKey,
            value: JSON.stringify(value),
          });
        } else {
          entries.push({
            key: displayKey,
            value: String(value),
          });
        }
      }
    };

    flattenObject(data);
    return { type: QR_TYPES.JSON, data: entries };
  } catch (error) {
    return { type: QR_TYPES.TEXT, data: [{ key: 'Error', value: 'Invalid JSON' }] };
  }
};

/**
 * Parse vCard content
 */
const parseVCard = (content) => {
  const data = {};
  const lines = content.split('\n');

  lines.forEach((line) => {
    if (line.startsWith('FN:')) {
      data.name = line.substring(3);
    } else if (line.startsWith('N:')) {
      if (!data.name) data.name = line.substring(2);
    } else if (line.startsWith('TEL')) {
      data.phone = line.split(':')[1];
    } else if (line.startsWith('EMAIL')) {
      data.email = line.split(':')[1];
    } else if (line.startsWith('ORG:')) {
      data.company = line.substring(4);
    } else if (line.startsWith('TITLE:')) {
      data.title = line.substring(6);
    } else if (line.startsWith('URL') || line.startsWith('URL;')) {
      const parts = line.split(':');
      data.website = parts[1];
    } else if (line.startsWith('ADR') || line.startsWith('ADR;')) {
      const parts = line.split(':');
      data.address = parts[1];
    }
  });

  const entries = [
    { key: 'Name', value: data.name || 'N/A' },
    { key: 'Phone', value: data.phone || 'N/A' },
    { key: 'Email', value: data.email || 'N/A' },
    { key: 'Company', value: data.company || 'N/A' },
    { key: 'Title', value: data.title || 'N/A' },
    { key: 'Website', value: data.website || 'N/A' },
    { key: 'Address', value: data.address || 'N/A' },
  ];

  return { type: QR_TYPES.VCARD, data: entries };
};

/**
 * Parse URL content
 */
const parseURL = (content) => {
  try {
    const url = new URL(content);
    const entries = [
      { key: 'Full URL', value: content },
      { key: 'Domain', value: url.hostname },
      { key: 'Protocol', value: url.protocol.replace(':', '') },
    ];
    return { type: QR_TYPES.URL, data: entries };
  } catch (error) {
    return {
      type: QR_TYPES.URL,
      data: [{ key: 'Full URL', value: content }],
    };
  }
};

/**
 * Parse WiFi credentials
 */
const parseWiFi = (content) => {
  const data = {};
  // Format: WIFI:S:SSID;T:WPA;P:password;;
  const match = content.match(/WIFI:S:([^;]+);T:([^;]+);P:([^;]+)/);

  if (match) {
    data.ssid = match[1];
    data.security = match[2];
    data.password = match[3];
  }

  const entries = [
    { key: 'Network Name (SSID)', value: data.ssid || 'N/A' },
    { key: 'Password', value: data.password || 'N/A' },
    { key: 'Security Type', value: data.security || 'WPA' },
  ];

  return { type: QR_TYPES.WIFI, data: entries };
};

/**
 * Parse email content
 */
const parseEmail = (content) => {
  // Format: mailto:email@example.com?subject=Test&body=Message
  const emailMatch = content.match(/mailto:([^?]+)/);
  const subjectMatch = content.match(/subject=([^&]+)/);
  const bodyMatch = content.match(/body=([^&]+)/);

  const entries = [
    { key: 'Email Address', value: emailMatch ? decodeURIComponent(emailMatch[1]) : 'N/A' },
    { key: 'Subject', value: subjectMatch ? decodeURIComponent(subjectMatch[1]) : 'N/A' },
    { key: 'Body', value: bodyMatch ? decodeURIComponent(bodyMatch[1]) : 'N/A' },
  ];

  return { type: QR_TYPES.EMAIL, data: entries };
};

/**
 * Parse phone number
 */
const parsePhone = (content) => {
  // Format: tel:+1234567890
  const phoneMatch = content.match(/tel:(.+)/);
  const phone = phoneMatch ? phoneMatch[1] : content;

  const entries = [
    { key: 'Phone Number', value: phone },
  ];

  return { type: QR_TYPES.PHONE, data: entries };
};

/**
 * Parse plain text
 */
const parseText = (content) => {
  const entries = [
    { key: 'Content', value: content },
    { key: 'Type', value: 'Plain Text' },
    { key: 'Length', value: String(content.length) },
  ];

  return { type: QR_TYPES.TEXT, data: entries };
};

/**
 * Main parser function - detects type and parses accordingly
 */
export const parseQRContent = (content) => {
  if (!content) {
    return { type: QR_TYPES.TEXT, data: [{ key: 'Error', value: 'Empty content' }] };
  }

  const type = detectQRType(content);

  switch (type) {
    case QR_TYPES.JSON:
      return parseJSON(content);
    case QR_TYPES.VCARD:
      return parseVCard(content);
    case QR_TYPES.URL:
      return parseURL(content);
    case QR_TYPES.WIFI:
      return parseWiFi(content);
    case QR_TYPES.EMAIL:
      return parseEmail(content);
    case QR_TYPES.PHONE:
      return parsePhone(content);
    case QR_TYPES.TEXT:
    default:
      return parseText(content);
  }
};
