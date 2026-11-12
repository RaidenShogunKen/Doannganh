import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonHocVu } from './entities/don-hoc-vu.entity';
import { HocVien } from '../users/entities/hoc-vien.entity';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { DonHocVuService } from './don-hoc-vu.service';
import { DonHocVuController } from './don-hoc-vu.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([DonHocVu, HocVien, DeTai]), UploadModule],
  controllers: [DonHocVuController],
  providers: [DonHocVuService],
  exports: [DonHocVuService],
})
export class DonHocVuModule {}
