/**
 * Utility functions for generating and formatting standardized 6-digit serial numbers
 * Converts any number to a 6-digit format with leading zeros
 * Examples: 1 → 000001, 100 → 000100, 1000 → 001000, 100000 → 100000
 */

/**
 * Format a number to 6-digit serial number with leading zeros
 * @param num - The number to format
 * @returns Formatted 6-digit string with leading zeros
 */
export function formatSerialNumber(num: number): string {
  return num.toString().padStart(6, '0');
}

/**
 * Generate a standardized quote number with 6-digit serial format
 * Uses current timestamp truncated to last 6 digits for uniqueness
 * @returns Quote number in format Q-XXXXXX (e.g., Q-000001, Q-123456)
 */
export function generateQuoteNumber(): string {
  // Use timestamp modulo 1000000 to get 6 digits maximum
  // Add small random component to avoid collisions in rapid succession
  const timestamp = Date.now();
  const serialNumber = (timestamp % 1000000) + Math.floor(Math.random() * 100);
  const finalSerial = serialNumber % 1000000; // Ensure it stays within 6 digits
  
  return `Q-${formatSerialNumber(finalSerial)}`;
}

/**
 * Generate a standardized invoice number with 6-digit serial format
 * Uses current timestamp truncated to last 6 digits for uniqueness
 * @returns Invoice number in format I-XXXXXX (e.g., I-000001, I-123456)
 */
export function generateInvoiceNumber(): string {
  // Use timestamp modulo 1000000 to get 6 digits maximum
  // Add small random component to avoid collisions in rapid succession
  const timestamp = Date.now();
  const serialNumber = (timestamp % 1000000) + Math.floor(Math.random() * 100);
  const finalSerial = serialNumber % 1000000; // Ensure it stays within 6 digits
  
  return `I-${formatSerialNumber(finalSerial)}`;
}

/**
 * Generate a sequential serial number based on existing count
 * Useful for generating truly sequential numbers if count tracking is available
 * @param currentCount - Current count of items (e.g., number of existing quotes)
 * @returns Next sequential number formatted with leading zeros
 */
export function generateSequentialSerial(currentCount: number): string {
  const nextNumber = currentCount + 1;
  return formatSerialNumber(nextNumber);
}

/**
 * Validate if a string matches the expected 6-digit serial format
 * @param serial - Serial number string to validate
 * @returns true if valid 6-digit format
 */
export function isValidSerialFormat(serial: string): boolean {
  return /^\d{6}$/.test(serial);
}

/**
 * Extract serial number from formatted quote/invoice number
 * @param formattedNumber - Full number like "Q-000123" or "I-001234"
 * @returns Just the 6-digit serial part or null if invalid format
 */
export function extractSerialFromFormatted(formattedNumber: string): string | null {
  const match = formattedNumber.match(/^[QI]-(\d{6})$/);
  return match ? match[1] : null;
}