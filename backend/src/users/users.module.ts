import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NguoiDung } from './entities/nguoi-dung.entity';
import { HocVien } from './entities/hoc-vien.entity';
import { GiangVien } from './entities/giang-vien.entity';
import { ChuyenNganh } from './entities/chuyen-nganh.entity';
import { NhatKyThaoTac } from './entities/nhat-ky-thao-tac.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NguoiDung, HocVien, GiangVien, ChuyenNganh, NhatKyThaoTac]),
    NotificationModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
