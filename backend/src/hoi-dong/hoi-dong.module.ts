import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HoiDong } from './entities/hoi-dong.entity';
import { ThanhVienHoiDong } from './entities/thanhvien-hoidong.entity';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { GiangVien } from '../users/entities/giang-vien.entity';
import { HoiDongService } from './hoi-dong.service';
import { HoiDongController } from './hoi-dong.controller';
import { DeTaiModule } from '../de-tai/de-tai.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([HoiDong, ThanhVienHoiDong, DeTai, GiangVien]), DeTaiModule, UploadModule],
  controllers: [HoiDongController],
  providers: [HoiDongService],
  exports: [HoiDongService],
})
export class HoiDongModule {}
