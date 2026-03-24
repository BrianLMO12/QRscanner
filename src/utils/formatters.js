export function formatValue(value) {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return value;
}

export function isURL(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function truncateText(text, maxLength = 100) {
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}

export function formatFieldName(name) {
  return name
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' > ');
}
