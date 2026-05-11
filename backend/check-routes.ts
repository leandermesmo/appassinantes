import { app } from './src/app';

async function check() {
  await app.ready();
  console.log(app.printRoutes());
  process.exit(0);
}

check();
