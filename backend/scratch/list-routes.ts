import { app } from '../src/app';

async function listRoutes() {
  try {
    await app.ready();
    console.log(app.printRoutes());
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

listRoutes();
