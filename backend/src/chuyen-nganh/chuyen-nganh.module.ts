import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChuyenNganh } from '../users/entities/chuyen-nganh.entity';
import { ChuyenNganhService } from './chuyen-nganh.service';
import { ChuyenNganhController } from './chuyen-nganh.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChuyenNganh])],
  controllers: [ChuyenNganhController],
  providers: [ChuyenNganhService],
  exports: [ChuyenNganhService],
})
export class ChuyenNganhModule {}
