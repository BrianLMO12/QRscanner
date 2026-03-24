/**
 * Formatters - Data formatting utilities
 */

/**
 * Convert table data to CSV format for clipboard
 */
export const tableToCSV = (data) => {
  if (!data || !Array.isArray(data)) return '';

  const headers = ['Key', 'Value'];
  const rows = data.map(item => [
    `"${String(item.key).replace(/"/g, '""')}"`,
    `"${String(item.value).replace(/"/g, '""')}"`,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Convert table data to JSON format
 */
export const tableToJSON = (data) => {
  if (!data || !Array.isArray(data)) return '';

  const obj = {};
  data.forEach(item => {
    obj[item.key] = item.value;
  });

  return JSON.stringify(obj, null, 2);
};

/**
 * Format raw text for display
 */
export const formatText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Get display name for QR type
 */
export const getQRTypeDisplayName = (type) => {
  const typeNames = {
    json: 'JSON Data',
    vcard: 'Contact (vCard)',
    url: 'Website URL',
    wifi: 'WiFi Credentials',
    email: 'Email',
    phone: 'Phone Number',
    text: 'Plain Text',
  };

  return typeNames[type] || 'Unknown';
};
