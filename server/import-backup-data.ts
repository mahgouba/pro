import { db } from "./db";
import { users, banks } from "../shared/schema";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// Read the backup file
const backupFilePath = path.join(process.cwd(), "attached_assets", "selective-database-backup-2025-08-16_1755385647776.json");

interface BackupData {
  metadata: {
    exportDate: string;
    version: string;
    description: string;
    exportType: string;
    selectedTypes: string[];
  };
  data: {
    banks: Array<{
      id: number;
      logo: string;
      bankName: string;
      nameEn: string;
      accountName: string;
      accountNumber: string;
      iban: string;
      type: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
    users: Array<{
      id: number;
      name: string;
      jobTitle: string;
      phoneNumber: string;
      username: string;
      role: string;
      createdAt: string;
    }>;
  };
}

async function importBackupData() {
  try {
    console.log("🔄 بدء استيراد البيانات من ملف النسخ الاحتياطي...");
    
    // Read and parse the backup file
    const backupContent = fs.readFileSync(backupFilePath, 'utf-8');
    const backupData: BackupData = JSON.parse(backupContent);
    
    console.log(`📊 البيانات المستوردة: ${backupData.data.banks.length} بنك، ${backupData.data.users.length} مستخدم`);
    
    // Import banks data
    console.log("🏦 بدء استيراد بيانات البنوك...");
    for (const bank of backupData.data.banks) {
      try {
        await db.insert(banks).values({
          logo: bank.logo,
          bankName: bank.bankName,
          nameEn: bank.nameEn,
          accountName: bank.accountName,
          accountNumber: bank.accountNumber,
          iban: bank.iban,
          type: bank.type,
          isActive: bank.isActive,
          createdAt: new Date(bank.createdAt),
          updatedAt: new Date(bank.updatedAt)
        }).onConflictDoNothing();
        
        console.log(`✅ تم إضافة البنك: ${bank.bankName}`);
      } catch (error: any) {
        console.log(`⚠️  تخطي البنك ${bank.bankName}: ${error.message}`);
      }
    }
    
    // Import users data
    console.log("👥 بدء استيراد بيانات المستخدمين...");
    for (const user of backupData.data.users) {
      try {
        // Skip the existing admin user to avoid conflicts
        if (user.username === "admin") {
          console.log("⏭️  تخطي المستخدم admin الحالي");
          continue;
        }
        
        // Generate a default password for imported users
        const defaultPassword = "123456";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        await db.insert(users).values({
          name: user.name,
          jobTitle: user.jobTitle,
          phoneNumber: user.phoneNumber,
          username: user.username,
          password: hashedPassword,
          role: user.role,
          createdAt: new Date(user.createdAt)
        }).onConflictDoNothing();
        
        console.log(`✅ تم إضافة المستخدم: ${user.name} (${user.username})`);
      } catch (error: any) {
        console.log(`⚠️  تخطي المستخدم ${user.name}: ${error.message}`);
      }
    }
    
    console.log("🎉 تم انتهاء عملية الاستيراد بنجاح!");
    console.log("📝 ملاحظة: كلمة المرور الافتراضية للمستخدمين الجدد هي: 123456");
    
  } catch (error: any) {
    console.error("❌ خطأ في استيراد البيانات:", error.message);
    throw error;
  }
}

// Run the import
importBackupData().catch(console.error);