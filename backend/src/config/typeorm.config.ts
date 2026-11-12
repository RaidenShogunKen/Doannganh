import * as dotenv from 'dotenv';
dotenv.config();
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'qldt_dev',
  password: process.env.DB_PASSWORD || '1',
  database: process.env.DB_NAME || 'qldt_saudaihoc',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  autoLoadEntities: true,
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsRun: process.env.DB_MIGRATIONS_RUN !== 'false',
  migrationsTransactionMode: 'each',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
