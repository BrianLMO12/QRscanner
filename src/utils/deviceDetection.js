/**
 * Device Detection Utility
 * Detects if the app is running on a real mobile device or desktop browser
 */

export function getDeviceType() {
  // Check user agent for iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Check user agent for Android
  const isAndroid = /Android/.test(navigator.userAgent);

  // If iOS or Android detected, it's a real mobile device
  if (isIOS || isAndroid) {
    return {
      type: 'mobile',
      os: isIOS ? 'iOS' : 'Android',
      isReal: true
    };
  }

  // For desktop browsers, even if they have touch capability, it's desktop
  return {
    type: 'desktop',
    os: 'desktop',
    isReal: true
  };
}

export function isMobileDevice() {
  return getDeviceType().type === 'mobile';
}

export function isDesktopDevice() {
  return getDeviceType().type === 'desktop';
}

export function getDeviceID() {
  // Generate a unique device ID based on user agent and current time
  const userAgent = navigator.userAgent;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < userAgent.length; i++) {
    const char = userAgent.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `${Math.abs(hash)}-${timestamp}-${random}`.substring(0, 20);
}
