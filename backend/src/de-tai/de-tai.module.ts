import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeTai } from './entities/de-tai.entity';
import { HocVien } from '../users/entities/hoc-vien.entity';
import { GiangVien } from '../users/entities/giang-vien.entity';
import { DeTaiService } from './de-tai.service';
import { DeTaiController } from './de-tai.controller';
import { NotificationModule } from '../notification/notification.module';
import { UploadModule } from '../upload/upload.module';
import { DefenseReadinessService } from './defense-readiness.service';
import { MinhChungBaoVe } from './entities/minh-chung-bao-ve.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeTai, HocVien, GiangVien, MinhChungBaoVe]),
    NotificationModule,
    UploadModule,
  ],
  controllers: [DeTaiController],
  providers: [DeTaiService, DefenseReadinessService],
  exports: [DeTaiService, DefenseReadinessService, TypeOrmModule],
})
export class DeTaiModule {}
