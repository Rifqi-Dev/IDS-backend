import { PrismaClient } from "@prisma/client";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";

const prisma = new PrismaClient({
  log: ["warn", "error", "query"],
});

(async () => {
  await prisma
    .$connect()
    .then(async (r) => {
      console.log("[Info] Database connection established succesfully!");
    })
    .catch(async (err: PrismaClientInitializationError) => {
      {
        console.log("DB Connection error", err.message);
      }
    });
})();

export default prisma;
