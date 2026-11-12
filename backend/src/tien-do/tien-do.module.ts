import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TienDo } from './entities/tien-do.entity';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { TienDoService } from './tien-do.service';
import { TienDoController } from './tien-do.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([TienDo, DeTai]), UploadModule],
  controllers: [TienDoController],
  providers: [TienDoService],
  exports: [TienDoService],
})
export class TienDoModule {}
