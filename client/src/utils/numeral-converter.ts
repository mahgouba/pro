/**
 * Converts Arabic/Persian numerals (٠١٢٣٤٥٦٧٨٩) to English numerals (0123456789).
 * Also handles common Arabic punctuation if needed, but primarily for digits.
 * 
 * @param input String containing Arabic numerals
 * @returns String with English numerals
 */
export function convertArabicToEnglishNumerals(input: string | number): string {
  if (input === null || input === undefined) return "";
  
  const str = input.toString();
  const arabicNumerals = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  const persianNumerals = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(arabicNumerals[i], i.toString()).replace(persianNumerals[i], i.toString());
  }
  
  return result;
}

/**
 * Utility function for input onChange handlers to automatically convert numerals.
 * 
 * @param value Raw input value
 * @param callback Function to call with converted value
 */
export function handleNumeralInput(value: string, callback: (val: string) => void) {
  const converted = convertArabicToEnglishNumerals(value);
  callback(converted);
}
