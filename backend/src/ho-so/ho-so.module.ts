import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HocVien } from '../users/entities/hoc-vien.entity';
import { GiangVien } from '../users/entities/giang-vien.entity';
import { DonTuyenSinh } from './entities/don-tuyen-sinh.entity';
import { HoSoService } from './ho-so.service';
import { HoSoController } from './ho-so.controller';
import { NotificationModule } from '../notification/notification.module';

import { NguoiDung } from '../users/entities/nguoi-dung.entity';
import { UploadModule } from '../upload/upload.module';
import { DeTaiModule } from '../de-tai/de-tai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HocVien, GiangVien, DonTuyenSinh, NguoiDung]),
    NotificationModule,
    UploadModule,
    DeTaiModule,
  ],
  controllers: [HoSoController],
  providers: [HoSoService],
  exports: [HoSoService],
})
export class HoSoModule {}
