// Input sanitization utilities for security
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    // Remove potential script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove potential HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove potential SQL injection patterns
    .replace(/['";\\]/g, '')
    // Limit length to prevent buffer overflow
    .substring(0, 1000);
};

export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';

  const sanitized = email.trim().toLowerCase();
  // Basic email validation and sanitization
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) return '';

  return sanitized.substring(0, 254); // RFC 5321 limit
};

export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }
    return urlObj.toString();
  } catch {
    return '';
  }
};

export const sanitizePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return '';

  // Remove all non-digit characters except + and spaces
  return phone.replace(/[^\d+\s-()]/g, '').substring(0, 20);
};