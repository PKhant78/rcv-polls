require("dotenv").config();
const db = require("./db");

const addUserIdColumn = async () => {
  try {
    // Check if column already exists
    const [results] = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='ballots' AND column_name='userId';
    `);
    
    if (results.length > 0) {
      console.log("✅ userId column already exists in ballots table");
      await db.close();
      return;
    }
    
    // Add userId column to ballots table
    await db.query(`
      ALTER TABLE "ballots" 
      ADD COLUMN "userId" INTEGER 
      REFERENCES "users"("id") 
      ON DELETE SET NULL;
    `);
    
    console.log("✅ Successfully added userId column to ballots table");
    await db.close();
  } catch (error) {
    console.error("❌ Error adding userId column:", error);
    await db.close();
    process.exit(1);
  }
};

addUserIdColumn();
