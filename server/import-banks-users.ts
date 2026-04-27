import { db } from "./db";
import { banks, users } from "@shared/schema";
import bcrypt from "bcryptjs";

const banksData = [
  {
    bankName: "مصرف الراجحي",
    nameEn: "Al Rajhi Bank",
    accountName: "شركة البريمي للسيارات",
    accountNumber: "575608010000904",
    iban: "SA8080000575608010000904",
    type: "شركة",
    isActive: true,
    logo: "/rajhi.png"
  },
  {
    bankName: "البنك الأهلي السعودي",
    nameEn: "Saudi National Bank",
    accountName: "شركة البريمي للسيارات",
    accountNumber: "25268400000102",
    iban: "SA5110000025268400000102",
    type: "شركة",
    isActive: true,
    logo: "/snb.png"
  },
  {
    bankName: "بنك الجزيرة",
    nameEn: "Bank AlJazira",
    accountName: "شركة البريمي للسيارات",
    accountNumber: "030495028555001",
    iban: "SA7060100030495028555001",
    type: "شركة",
    isActive: true,
    logo: "/aljazira.png"
  },
  {
    bankName: "بنك البلاد",
    nameEn: "Bank Albilad",
    accountName: "شركة البريمي للسيارات",
    accountNumber: "448888888780008",
    iban: "SA1315000448888888780008",
    type: "شركة",
    isActive: true,
    logo: "/albilad.png"
  },
  {
    bankName: "البنك العربي الوطني",
    nameEn: "Arab National Bank",
    accountName: "شركة البريمي للسيارات",
    accountNumber: "0108095322110019",
    iban: "SA3030000108095322110019",
    type: "شركة",
    isActive: true,
    logo: "/anb.png"
  },
  {
    bankName: "بنك الإمارات دبي الوطني",
    nameEn: "Emirates NBD",
    accountName: "شركة البريمي للسيارات",
    accountNumber: "1016050175301",
    iban: "SA4095000001016050175301",
    type: "شركة",
    isActive: true,
    logo: "/emirates.png"
  },
  {
    bankName: "بنك الرياض",
    nameEn: "Riyad Bank",
    accountName: "شركة البريمي للسيارات",
    accountNumber: "2383212779940",
    iban: "SA1420000002383212779940",
    type: "شركة",
    isActive: true,
    logo: "/riyad.png"
  },
  {
    bankName: "مصرف الإنماء",
    nameEn: "Bank Alinma",
    accountName: "شركة البريمي للسيارات",
    accountNumber: "68201863704000",
    iban: "SA9605000068201863704000",
    type: "شركة",
    isActive: true,
    logo: "/alinma.png"
  },
  {
    bankName: "البنك السعودي الأول (SAB)",
    nameEn: "Saudi Awwal Bank (SAB)",
    accountName: "شركة معرض البريمي للسيارات",
    accountNumber: "822173787001",
    iban: "SA6445000000822173787001",
    type: "شركة",
    isActive: true,
    logo: "/sab.png"
  },
  {
    bankName: "البنك السعودي الفرنسي",
    nameEn: "Saudi French Bank",
    accountName: "شركة البريمي للسيارات",
    accountNumber: "97844900167",
    iban: "SA5655000000097844900167",
    type: "شركة",
    isActive: true,
    logo: "/sfb.png"
  }
];

const usersData = [
  {
    name: "احمد الزميتي",
    jobTitle: "مندوب مبيعات",
    phoneNumber: "0557449997",
    username: "ahmad_alzmaity",
    password: "Pass49997",
    role: "salesperson"
  },
  {
    name: "زايد حيدر",
    jobTitle: "مندوب مبيعات",
    phoneNumber: "0554497773",
    username: "zaid_haidar",
    password: "Pass97773",
    role: "salesperson"
  },
  {
    name: "عبدالله نصر",
    jobTitle: "مندوب مبيعات",
    phoneNumber: "0503715148",
    username: "abdullah_nasr",
    password: "Pass15148",
    role: "salesperson"
  },
  {
    name: "عمار المليكي",
    jobTitle: "مندوب مبيعات",
    phoneNumber: "0550399991",
    username: "ammar_almaliki",
    password: "Pass99991",
    role: "salesperson"
  },
  {
    name: "عزام الغنامي",
    jobTitle: "مندوب مبيعات",
    phoneNumber: "0598147975",
    username: "azzam_alghanami",
    password: "Pass47975",
    role: "salesperson"
  },
  {
    name: "ايمن الموشكي",
    jobTitle: "مندوب مبيعات",
    phoneNumber: "0533014932",
    username: "ayman_almoshki",
    password: "Pass14932",
    role: "salesperson"
  },
  {
    name: "ايمن المليكي",
    jobTitle: "مدير المبيعات",
    phoneNumber: "0508059998",
    username: "ayman_almaliki",
    password: "Pass59998",
    role: "sales_director"
  },
  {
    name: "احمد الجوهري",
    jobTitle: "مندوب البنوك",
    phoneNumber: "0543266042",
    username: "ahmad_aljawhary",
    password: "Pass66042",
    role: "accountant"
  },
  {
    name: "احمد كمال",
    jobTitle: "محاسب",
    phoneNumber: "0555053167",
    username: "ahmad_kamal",
    password: "Pass53167",
    role: "accountant"
  },
  {
    name: "محمود كمال",
    jobTitle: "محاسب",
    phoneNumber: "0598084630",
    username: "mahmoud_kamal",
    password: "Pass84630",
    role: "accountant"
  },
  {
    name: "سامي احمد",
    jobTitle: "محاسب",
    phoneNumber: "0532649681",
    username: "sami_ahmad",
    password: "Pass49681",
    role: "accountant"
  },
  {
    name: "ساوي",
    jobTitle: "مندوب مبيعات",
    phoneNumber: "0559986086",
    username: "sawi",
    password: "Pass86086",
    role: "salesperson"
  },
  {
    name: "فاروق الغنامي",
    jobTitle: "محاسب",
    phoneNumber: "0508222813",
    username: "farouq_alghanami",
    password: "Pass22813",
    role: "accountant"
  },
  {
    name: "صادق الغنامي",
    jobTitle: "محاسب",
    phoneNumber: "0551813362",
    username: "sadiq_alghanami",
    password: "Pass13362",
    role: "accountant"
  },
  {
    name: "عبدالمجيد عبدالله",
    jobTitle: "المدير التنفيذي",
    phoneNumber: "0553336741",
    username: "abdulmajeed_abdullah",
    password: "Pass36741",
    role: "admin"
  },
  {
    name: "عبدالله الغنامي",
    jobTitle: "المالك",
    phoneNumber: "0533339333",
    username: "abdullah_alghanami",
    password: "Pass39333",
    role: "admin"
  }
];

async function importData() {
  try {
    console.log("🏦 Importing banks...");
    
    // Import banks
    for (const bank of banksData) {
      try {
        await db.insert(banks).values(bank).onConflictDoNothing();
        console.log(`  ✅ Added bank: ${bank.bankName}`);
      } catch (error) {
        console.log(`  ⚠️ Bank ${bank.bankName} might already exist`);
      }
    }
    
    console.log("\n👥 Importing users...");
    
    // Import users
    for (const user of usersData) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await db.insert(users).values({
          ...user,
          password: hashedPassword
        }).onConflictDoNothing();
        console.log(`  ✅ Added user: ${user.name} (${user.username})`);
      } catch (error) {
        console.log(`  ⚠️ User ${user.username} might already exist`);
      }
    }
    
    console.log("\n✨ Data import completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error importing data:", error);
    process.exit(1);
  }
}

importData();