import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/database";
import User from "../models/user";
import Course from "../models/course";

const seed = async (): Promise<void> => {
  await connectDB();

  console.log("🌱 Seeding database...\n");

  // ── Create admin user ─────────────────────────────
  const existingAdmin = await User.findOne({ email: "admin@unplug.app" });
  if (existingAdmin) {
    console.log("  ⏭️  Admin user already exists, skipping.");
  } else {
    const admin = await User.create({
      name: "Admin",
      email: "admin@unplug.app",
      password: "admin123456",
      role: "admin",
    });
    console.log(`  ✅ Admin created: ${admin.email}`);
  }

  // ── Create sample course ──────────────────────────
  const existingCourse = await Course.findOne({ title: "Introduction to Mathematics" });
  if (existingCourse) {
    console.log("  ⏭️  Sample course already exists, skipping.");
  } else {
    const admin = await User.findOne({ email: "admin@unplug.app" });
    if (!admin) {
      console.error("  ❌ Admin not found. Cannot create sample course.");
      process.exit(1);
    }

    const course = await Course.create({
      title: "Introduction to Mathematics",
      description:
        "Learn the foundations of mathematics — numbers, addition, subtraction, and basic problem solving.",
      subject: "math",
      level: "beginner",
      emoji: "🔢",
      color: "#2C5EAD",
      createdBy: admin._id,
      isPublished: true,
      publishedAt: new Date(),
      lessons: [
        {
          title: "What are Numbers?",
          order: 1,
          type: "text",
          content:
            "Numbers are symbols we use to count and measure things. The basic counting numbers are 1, 2, 3, 4, 5 and so on. Zero (0) represents nothing or none. Numbers help us in everyday life — telling time, counting money, and measuring distances.",
          durationMinutes: 5,
          xpReward: 20,
          quiz: [
            {
              question: "What does the number 0 represent?",
              options: ["Everything", "Nothing or none", "One hundred", "Ten"],
              correctIndex: 1,
              explanation:
                "Zero (0) represents nothing or none. It is the starting point of counting.",
            },
            {
              question: "Which of these is a counting number?",
              options: ["-5", "0.5", "3", "-1"],
              correctIndex: 2,
              explanation:
                "3 is a counting number. Counting numbers are positive whole numbers: 1, 2, 3, 4, 5...",
            },
          ],
        },
        {
          title: "Addition Basics",
          order: 2,
          type: "text",
          content:
            "Addition means combining two or more numbers to find their total. The symbol for addition is +. For example, 2 + 3 = 5. When you add, you are putting things together. Addition is one of the four basic operations in mathematics.",
          durationMinutes: 8,
          xpReward: 25,
          quiz: [
            {
              question: "What is 2 + 3?",
              options: ["4", "5", "6", "7"],
              correctIndex: 1,
              explanation: "2 + 3 = 5. You combine 2 and 3 to get 5.",
            },
            {
              question: "What symbol do we use for addition?",
              options: ["-", "×", "+", "÷"],
              correctIndex: 2,
              explanation:
                "The + symbol is used for addition, which means combining numbers.",
            },
          ],
        },
        {
          title: "Subtraction Basics",
          order: 3,
          type: "text",
          content:
            "Subtraction means taking one number away from another. The symbol for subtraction is -. For example, 5 - 2 = 3. Subtraction tells you how much is left after removing something. It is the opposite of addition.",
          durationMinutes: 8,
          xpReward: 25,
          quiz: [
            {
              question: "What is 5 - 2?",
              options: ["2", "3", "4", "7"],
              correctIndex: 1,
              explanation:
                "5 - 2 = 3. When you take 2 away from 5, you are left with 3.",
            },
          ],
        },
      ],
    });
    console.log(`  ✅ Sample course created: ${course.title}`);
  }

  console.log("\n🌱 Seeding complete!\n");

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
