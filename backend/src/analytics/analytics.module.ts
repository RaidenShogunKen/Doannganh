import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PlagiarismService } from './plagiarism.service';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { HocVien } from '../users/entities/hoc-vien.entity';
import { GiangVien } from '../users/entities/giang-vien.entity';
import { BaiBaoKhoaHoc } from '../bai-bao/entities/bai-bao-khoa-hoc.entity';
import { ChuyenNganh } from '../users/entities/chuyen-nganh.entity';
import { TienDo } from '../tien-do/entities/tien-do.entity';
import { HoiDong } from '../hoi-dong/entities/hoi-dong.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeTai,
      HocVien,
      GiangVien,
      BaiBaoKhoaHoc,
      ChuyenNganh,
      TienDo,
      HoiDong,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PlagiarismService],
  exports: [AnalyticsService, PlagiarismService],
})
export class AnalyticsModule {}
