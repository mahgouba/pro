// Function to convert numbers to Arabic text with proper format
export function numberToArabic(num: number): string {
  if (num === 0) return "فقط صفر ريال سعودي لا غير";
  
  const ones = [
    "", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة",
    "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمس عشرة", "ستة عشر",
    "سبعة عشر", "ثمانية عشر", "تسعة عشر"
  ];
  
  const onesForCompound = [
    "", "واحد", "اثنان", "ثلاثة", "أربعة", "خمس", "ستة", "سبعة", "ثمانية", "تسعة"
  ];
  
  const tens = [
    "", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"
  ];
  
  const hundreds = [
    "", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"
  ];

  function convertNumber(n: number): string {
    if (n === 0) return "";
    
    let result = "";
    
    // Handle millions
    if (n >= 1000000) {
      const millions = Math.floor(n / 1000000);
      if (millions === 1) {
        result += "مليون";
      } else if (millions === 2) {
        result += "مليونان";
      } else if (millions < 11) {
        result += convertHundreds(millions) + " ملايين";
      } else {
        result += convertHundreds(millions) + " مليون";
      }
      n %= 1000000;
      if (n > 0) result += " و ";
    }
    
    // Handle thousands
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000);
      if (thousands === 1) {
        result += "ألف";
      } else if (thousands === 2) {
        result += "ألفان";
      } else if (thousands < 11) {
        result += convertHundreds(thousands) + " آلاف";
      } else {
        result += convertHundreds(thousands) + " ألف";
      }
      n %= 1000;
      if (n > 0) result += " و ";
    }
    
    // Handle hundreds and below
    if (n > 0) {
      result += convertHundreds(n);
    }
    
    return result;
  }
  
  function convertHundreds(n: number): string {
    if (n === 0) return "";
    
    let result = "";
    
    // Handle hundreds
    if (n >= 100) {
      const hundredsDigit = Math.floor(n / 100);
      result += hundreds[hundredsDigit];
      n %= 100;
      if (n > 0) result += " و ";
    }
    
    // Handle tens and ones (Arabic order: ones before tens for compound numbers)
    if (n >= 20) {
      const tensDigit = Math.floor(n / 10);
      const onesDigit = n % 10;
      
      if (onesDigit > 0) {
        // Special case for 5 in compound numbers with hundreds context
        const onesText = (onesDigit === 5 && result.includes("مائة")) ? "خمسة" : onesForCompound[onesDigit];
        result += onesText + " و " + tens[tensDigit];
      } else {
        result += tens[tensDigit];
      }
    } else if (n >= 11 && n <= 19) {
      // Numbers 11-19 use the standard ones array
      result += ones[n];
    } else if (n > 0) {
      result += ones[n];
    }
    
    return result;
  }
  
  // Split into riyal and halala parts
  const riyalPart = Math.floor(num);
  const halalaPart = Math.round((num - riyalPart) * 100);
  
  let result = "فقط ";
  
  // Handle the case where there are no riyals, only halalas
  if (riyalPart === 0 && halalaPart > 0) {
    result += convertNumber(halalaPart);
    if (halalaPart === 1) {
      result += " هللة";
    } else if (halalaPart === 2) {
      result += " هللتان";
    } else if (halalaPart <= 10) {
      result += " هللات";
    } else {
      result += " هللة";
    }
    result += " لا غير";
    return result;
  }
  
  // Handle riyals
  if (riyalPart > 0) {
    result += convertNumber(riyalPart) + " ريال سعودي";
  }
  
  // Handle halalas
  if (halalaPart > 0) {
    result += " و " + convertNumber(halalaPart);
    if (halalaPart === 1) {
      result += " هللة";
    } else if (halalaPart === 2) {
      result += " هللتان";
    } else if (halalaPart <= 10) {
      result += " هللات";
    } else {
      result += " هللة";
    }
  }
  
  result += " لا غير";
  return result;
}