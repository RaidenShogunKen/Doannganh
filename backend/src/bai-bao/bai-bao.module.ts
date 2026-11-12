import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaiBaoKhoaHoc } from './entities/bai-bao-khoa-hoc.entity';
import { BaiBaoService } from './bai-bao.service';
import { BaiBaoController } from './bai-bao.controller';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([BaiBaoKhoaHoc, DeTai]), UploadModule],
  controllers: [BaiBaoController],
  providers: [BaiBaoService],
  exports: [BaiBaoService],
})
export class BaiBaoModule {}
