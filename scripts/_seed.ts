import "dotenv/config";
import { ensureSeeded } from "../src/db/seed";

ensureSeeded()
  .then(() => console.log("seed done"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
