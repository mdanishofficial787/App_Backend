require("dotenv").config();
const mongoose = require("mongoose");

async function migrateAndClean() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to primary database:", mongoose.connection.name);

    const client = mongoose.connection.client;
    const testDb = client.db("test");
    const rideDb = client.db("ride_and_serve");

    console.log("\n=================== STARTING DATA MIGRATION ===================");

    // List all collections in ride_and_serve
    const rideCollections = await rideDb.listCollections().toArray();

    for (const colInfo of rideCollections) {
      const colName = colInfo.name;
      const count = await rideDb.collection(colName).countDocuments();
      console.log(`\nProcessing collection '${colName}' (${count} documents)...`);

      if (count > 0) {
        const docs = await rideDb.collection(colName).find({}).toArray();
        let inserted = 0;
        let skipped = 0;

        for (const doc of docs) {
          try {
            // Check if document already exists in test database
            const existing = await testDb.collection(colName).findOne({ _id: doc._id });
            if (!existing) {
              await testDb.collection(colName).insertOne(doc);
              inserted++;
            } else {
              skipped++;
            }
          } catch (err) {
            console.error(`Error inserting doc ${doc._id} into test.${colName}:`, err.message);
          }
        }

        console.log(`  -> Migrated to test.${colName}: ${inserted} inserted, ${skipped} already existed.`);

        // Also if colName is riderequests, make sure requests collection in test also has them
        if (colName === "riderequests") {
          let reqInserted = 0;
          let reqSkipped = 0;
          for (const doc of docs) {
            try {
              const ex = await testDb.collection("requests").findOne({
                $or: [{ _id: doc._id }, { requestId: doc.requestId }].filter(Boolean)
              });
              if (!ex) {
                await testDb.collection("requests").insertOne(doc);
                reqInserted++;
              } else {
                reqSkipped++;
              }
            } catch (err) {}
          }
          console.log(`  -> Synced to test.requests: ${reqInserted} inserted, ${reqSkipped} already existed.`);
        }
      }
    }

    console.log("\n=================== VERIFYING TEST DATABASE ===================");
    const testCols = await testDb.listCollections().toArray();
    for (const c of testCols) {
      const cCount = await testDb.collection(c.name).countDocuments();
      console.log(`  test.${c.name} -> ${cCount} docs`);
    }

    console.log("\n=================== DROPPING RIDE_AND_SERVE DATABASE ===================");
    const dropResult = await rideDb.dropDatabase();
    console.log("ride_and_serve database dropped successfully:", dropResult);

    const adminDb = client.db().admin();
    const finalDbs = await adminDb.listDatabases();
    console.log("\nActive Databases remaining on cluster:", finalDbs.databases.map(d => d.name));

    console.log("\nMigration and cleanup completed successfully!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateAndClean();
