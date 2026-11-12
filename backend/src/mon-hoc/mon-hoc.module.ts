import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonHoc } from './entities/mon-hoc.entity';
import { DangKyMonHoc } from './entities/dangky-monhoc.entity';
import { HocVien } from '../users/entities/hoc-vien.entity';
import { NguoiDung } from '../users/entities/nguoi-dung.entity';
import { NotificationModule } from '../notification/notification.module';
import { MonHocService } from './mon-hoc.service';
import { MonHocController } from './mon-hoc.controller';
import { PhanCongGiangDay } from './entities/phan-cong-giang-day.entity';
import { GiangVien } from '../users/entities/giang-vien.entity';
import { DeTai } from '../de-tai/entities/de-tai.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonHoc, DangKyMonHoc, HocVien, NguoiDung, GiangVien, DeTai, PhanCongGiangDay]),
    NotificationModule,
  ],
  controllers: [MonHocController],
  providers: [MonHocService],
  exports: [MonHocService],
})
export class MonHocModule {}
