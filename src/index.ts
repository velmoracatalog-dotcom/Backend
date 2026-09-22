import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./db/connect.js";

async function start() {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`Velmora API running on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
