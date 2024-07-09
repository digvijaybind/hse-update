const {PrismaClient} = require("@prisma/client");

const prisma = new PrismaClient();

async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log("Connected to the database");
  } catch (err) {
    console.error("Error connecting to the database", err);
  }
}

module.exports = {
  prisma,
  connectToDatabase,
};
