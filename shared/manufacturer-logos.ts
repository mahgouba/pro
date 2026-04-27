// Manufacturer logo mappings
export const manufacturerLogos: Record<string, string> = {
  // Arabic manufacturer names mapped to logo files
  "مرسيدس": "/mercedes.svg",
  "بي ام دبليو": "/bmw.svg",
  "تويوتا": "/toyota.svg",
  "لكزس": "/lexus.svg",
  "نيسان": "/Nissan.svg",
  "إنفينيتي": "/infiniti.svg",
  "لاند روفر": "/landrover.svg",
  "جاكوار": "/jaguar.svg",
  "بنتلي": "/bentley-svgrepo-com.svg",
  "رولز رويس": "/Rolls-Royce.svg",
  "فيراري": "/ferrari.svg",
  "لامبورغيني": "/lamborghini.svg",
  "بوغاتي": "/bugatti.svg",
  "بورشه": "/porsche-svgrepo-com.svg",
  "تيسلا": "/logos/Tesla.svg",
  "تسلا": "/logos/Tesla.svg",
  "فولكس فاغن": "/volkswagen.svg",
  "فورد": "/ford-mustang.svg",
  "لينكولن": "/lincoln.svg",
  "لينكون": "/lincoln.svg",
  "رام": "/ram.svg",
  "جي إم سي": "/logos/GMC.svg",
  "جي ام سي": "/logos/GMC.svg",
  "مايباخ": "/maybach.svg",
  "لوتس": "/lotus.svg",
  "روكس": "/logos/Rox.svg",
  "كاديلاك": "/logos/cadillac.svg",
  
  // Additional variations for ROX
  "Rox": "/logos/Rox.svg",
  "rox": "/logos/Rox.svg",
  "RoX": "/logos/Rox.svg",
  "روكس ROX": "/logos/Rox.svg",
  
  // English names as fallback
  "Mercedes": "/mercedes.svg",
  "Lexus": "/lexus.svg", 
  "Nissan": "/Nissan.svg",
  "Toyota": "/toyota.svg",
  "BMW": "/bmw.svg",
  "Land Rover": "/landrover.svg",
  "Jaguar": "/jaguar.svg",
  "Bentley": "/bentley-svgrepo-com.svg",
  "Rolls-Royce": "/Rolls-Royce.svg",
  "Ferrari": "/ferrari.svg",
  "Lamborghini": "/lamborghini.svg",
  "Bugatti": "/bugatti.svg",
  "Porsche": "/porsche-svgrepo-com.svg",
  "Tesla": "/logos/Tesla.svg",
  "Volkswagen": "/volkswagen.svg",
  "Ford": "/ford-mustang.svg",
  "Lincoln": "/lincoln.svg",
  "Ram": "/ram.svg",
  "GMC": "/logos/GMC.svg",
  "Maybach": "/maybach.svg",
  "Lotus": "/lotus.svg",
  "Infiniti": "/infiniti.svg",
  "ROX": "/logos/Rox.svg",
  "Cadillac": "/logos/cadillac.svg",
  
  // Additional variations for GMC
  "جي ام سي GMC": "/logos/GMC.svg",
  "GMC جي ام سي": "/logos/GMC.svg",
  "gmc": "/logos/GMC.svg",
};

export function getManufacturerLogo(manufacturerName: string): string | null {
  // Clean the manufacturer name by trimming spaces and normalizing
  const cleanName = manufacturerName.trim();
  return manufacturerLogos[cleanName] || null;
}

export function getAllManufacturerLogos(): typeof manufacturerLogos {
  return manufacturerLogos;
}