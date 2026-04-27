import { getDatabase } from "./db";
import { users, employeeWorkSchedules } from "@shared/schema";
import bcrypt from "bcryptjs";

async function addWorkSchedules() {
  try {
    const { db } = getDatabase();
    
    console.log("🏗️ Adding work schedules data...");

    // Get all existing users
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users in database`);

    if (allUsers.length === 0) {
      console.log("No users found. Creating a default admin user...");
      
      // Create a default admin user
      const hashedPassword = await bcrypt.hash("admin123", 12);
      const [adminUser] = await db.insert(users).values({
        name: "مدير النظام",
        username: "admin",
        password: hashedPassword,
        role: "admin",
        jobTitle: "مدير عام",
        phoneNumber: "0500000000",
        createdAt: new Date()
      }).returning();
      
      console.log("✅ Created default admin user:", adminUser.username);
      allUsers.push(adminUser);
    }

    // Check if work schedules already exist
    const existingSchedules = await db.select().from(employeeWorkSchedules);
    if (existingSchedules.length > 0) {
      console.log(`Found ${existingSchedules.length} existing work schedules`);
      return;
    }

    // Sample work schedule data
    const workSchedulesData = [
      {
        employeeName: "أحمد محمد",
        employeeId: allUsers[0]?.id || 1,
        startTime: "08:00",
        endTime: "17:00",
        workDays: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"],
        breakStartTime: "12:00",
        breakEndTime: "13:00",
        isActive: true,
        scheduleType: "دوام كامل",
        notes: "دوام عادي - مكتب الرياض"
      },
      {
        employeeName: "فاطمة العلي",
        employeeId: allUsers[1]?.id || 2,
        startTime: "09:00",
        endTime: "16:00",
        workDays: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"],
        breakStartTime: "12:30",
        breakEndTime: "13:30",
        isActive: true,
        scheduleType: "دوام مرن",
        notes: "دوام مرن - قسم المبيعات"
      },
      {
        employeeName: "محمد الأحمد",
        employeeId: allUsers[2]?.id || 3,
        startTime: "07:30",
        endTime: "16:30",
        workDays: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "السبت"],
        breakStartTime: "11:30",
        breakEndTime: "12:30",
        isActive: true,
        scheduleType: "دوام مسائي",
        notes: "دوام المعرض - شامل نهاية الأسبوع"
      },
      {
        employeeName: "نورا السعد",
        employeeId: allUsers[3]?.id || 4,
        startTime: "10:00",
        endTime: "18:00",
        workDays: ["الأحد", "الثلاثاء", "الخميس"],
        breakStartTime: "13:00",
        breakEndTime: "14:00",
        isActive: true,
        scheduleType: "دوام جزئي",
        notes: "دوام جزئي - قسم المحاسبة"
      },
      {
        employeeName: "خالد الراشد",
        employeeId: allUsers[4]?.id || 5,
        startTime: "06:00",
        endTime: "14:00",
        workDays: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"],
        breakStartTime: "10:00",
        breakEndTime: "10:30",
        isActive: true,
        scheduleType: "دوام صباحي",
        notes: "دوام صباحي مبكر - قسم الصيانة"
      }
    ];

    // Insert work schedules
    for (const scheduleData of workSchedulesData) {
      try {
        await db.insert(employeeWorkSchedules).values({
          employeeName: scheduleData.employeeName,
          employeeId: scheduleData.employeeId,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
          workDays: scheduleData.workDays,
          breakStartTime: scheduleData.breakStartTime,
          breakEndTime: scheduleData.breakEndTime,
          isActive: scheduleData.isActive,
          scheduleType: scheduleData.scheduleType,
          notes: scheduleData.notes,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`✅ Added work schedule for: ${scheduleData.employeeName}`);
      } catch (error) {
        console.error(`❌ Failed to add schedule for ${scheduleData.employeeName}:`, error);
      }
    }

    console.log("🎉 Work schedules data added successfully!");
    
    // Verify the data
    const finalCount = await db.select().from(employeeWorkSchedules);
    console.log(`📊 Total work schedules in database: ${finalCount.length}`);
    
  } catch (error) {
    console.error("❌ Error adding work schedules:", error);
  }
}

// Run the function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addWorkSchedules().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { addWorkSchedules };