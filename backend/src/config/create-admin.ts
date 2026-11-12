import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { VaiTro } from '../common/enums';
import { NguoiDung } from '../users/entities/nguoi-dung.entity';
import dataSource from './data-source';

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) {
    throw new Error('Cách dùng: node dist/config/create-admin.js admin@example.edu.vn');
  }
  await dataSource.initialize();
  try {
    await dataSource.runMigrations();
    const users = dataSource.getRepository(NguoiDung);
    if (await users.existsBy({ email })) throw new Error('Email đã tồn tại.');
    const password = randomBytes(24).toString('base64url');
    await users.insert({
      hoTen: 'Quản trị viên', email, vaiTro: VaiTro.Admin, matKhauHash: await bcrypt.hash(password, 12),
    });
    console.log(`Đã tạo quản trị viên ${email}. Mật khẩu khởi tạo: ${password}`);
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
