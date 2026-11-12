const fs = require('node:fs/promises');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function main() {
  const { default: dataSource } = require('./dist/config/data-source.js');
  await dataSource.initialize();
  try {
    const applied = await dataSource.runMigrations();
    console.log(`Đã áp dụng ${applied.length} migration.`);
    if (process.argv.includes('--demo')) {
      if (process.env.NODE_ENV === 'production') throw new Error('Chỉ nạp dữ liệu demo trong môi trường phát triển.');
      const seed = await fs.readFile(path.join(__dirname, '..', 'database', 'seed.sql'), 'utf8');
      await dataSource.transaction((manager) => manager.query(seed));
      console.log('Đã nạp dữ liệu mẫu.');
    }
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
