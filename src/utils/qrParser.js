export function parseQRCode(rawData) {
  const trimmed = rawData.trim();

  if (trimmed.startsWith('BEGIN:VCARD')) {
    return parseVCard(trimmed);
  }

  if (trimmed.startsWith('WIFI:')) {
    return parseWiFi(trimmed);
  }

  if (trimmed.startsWith('mailto:')) {
    return parseEmail(trimmed);
  }

  if (trimmed.startsWith('tel:')) {
    return parsePhoneNumber(trimmed);
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return parseURL(trimmed);
  }

  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return parseJSON(trimmed);
  }

  return parsePlainText(trimmed);
}

function parseVCard(data) {
  const result = {};
  const lines = data.split('\n');

  for (const line of lines) {
    if (line.includes('FN:')) {
      result['Name'] = line.replace('FN:', '').trim();
    }
    if (line.includes('N:')) {
      result['Full Name'] = line.replace('N:', '').trim();
    }
    if (line.includes('TEL') && line.includes(':')) {
      const phone = line.split(':').pop()?.trim() || '';
      result['Phone'] = phone;
    }
    if (line.includes('EMAIL') && line.includes(':')) {
      const email = line.split(':').pop()?.trim() || '';
      result['Email'] = email;
    }
    if (line.includes('ORG:')) {
      result['Company'] = line.replace('ORG:', '').trim();
    }
    if (line.includes('TITLE:')) {
      result['Title'] = line.replace('TITLE:', '').trim();
    }
    if (line.includes('URL:')) {
      result['Website'] = line.replace('URL:', '').trim();
    }
    if (line.includes('ADR') && line.includes(':')) {
      const addr = line.split(':').pop()?.trim() || '';
      result['Address'] = addr;
    }
  }

  return {
    type: 'Contact (vCard)',
    data: result,
  };
}

function parseWiFi(data) {
  const result = {};
  const ssidMatch = data.match(/S:([^;]+)/);
  const passwordMatch = data.match(/P:([^;]+)/);
  const securityMatch = data.match(/T:([^;]+)/);

  if (ssidMatch) {
    result['Network Name (SSID)'] = ssidMatch[1];
  }
  if (passwordMatch) {
    result['Password'] = passwordMatch[1];
  }
  if (securityMatch) {
    result['Security Type'] = securityMatch[1];
  }

  return {
    type: 'WiFi Credentials',
    data: result,
  };
}

function parseEmail(data) {
  const result = {};
  const emailMatch = data.match(/mailto:([^?]+)/);
  const subjectMatch = data.match(/subject=([^&]+)/);
  const bodyMatch = data.match(/body=([^&]+)/);

  if (emailMatch) {
    result['Email Address'] = decodeURIComponent(emailMatch[1]);
  }
  if (subjectMatch) {
    result['Subject'] = decodeURIComponent(subjectMatch[1]);
  }
  if (bodyMatch) {
    result['Body'] = decodeURIComponent(bodyMatch[1]);
  }

  return {
    type: 'Email',
    data: result,
  };
}

function parsePhoneNumber(data) {
  const phoneNumber = data.replace('tel:', '').trim();

  return {
    type: 'Phone Number',
    data: {
      'Phone Number': phoneNumber,
    },
  };
}

function parseURL(data) {
  const url = data.trim();
  let domain = '';

  try {
    const urlObj = new URL(url);
    domain = urlObj.hostname;
  } catch {
    domain = url.split('/')[2] || url;
  }

  const protocol = url.startsWith('https://') ? 'https' : 'http';

  return {
    type: 'URL / Website',
    data: {
      'Full URL': url,
      'Domain': domain,
      'Protocol': protocol,
    },
  };
}

function parseJSON(data) {
  const result = {};

  try {
    const parsed = JSON.parse(data);
    const flattenObject = (obj, prefix = '') => {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          const newKey = prefix ? `${prefix}.${key}` : key;

          if (value === null) {
            result[newKey] = 'null';
          } else if (typeof value === 'object') {
            flattenObject(value, newKey);
          } else {
            result[newKey] = value;
          }
        }
      }
    };

    flattenObject(parsed);
  } catch {
    result['Content'] = data;
  }

  return {
    type: 'JSON Data',
    data: result,
  };
}

function parsePlainText(data) {
  return {
    type: 'Plain Text',
    data: {
      'Content': data,
      'Type': 'Plain Text',
      'Length': data.length.toString(),
    },
  };
}
