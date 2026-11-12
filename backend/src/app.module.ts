import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { getTypeOrmConfig } from './config/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HoSoModule } from './ho-so/ho-so.module';
import { ChuyenNganhModule } from './chuyen-nganh/chuyen-nganh.module';
import { MonHocModule } from './mon-hoc/mon-hoc.module';
import { DeTaiModule } from './de-tai/de-tai.module';
import { TienDoModule } from './tien-do/tien-do.module';
import { BaiBaoModule } from './bai-bao/bai-bao.module';
import { HoiDongModule } from './hoi-dong/hoi-dong.module';
import { AiTutorModule } from './ai-tutor/ai-tutor.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UploadModule } from './upload/upload.module';
import { DonHocVuModule } from './don-hoc-vu/don-hoc-vu.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(getTypeOrmConfig()),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '1200', 10),
      },
    ]),
    AuthModule,
    UsersModule,
    HoSoModule,
    ChuyenNganhModule,
    MonHocModule,
    DeTaiModule,
    TienDoModule,
    BaiBaoModule,
    HoiDongModule,
    AiTutorModule,
    AnalyticsModule,
    UploadModule,
    DonHocVuModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
