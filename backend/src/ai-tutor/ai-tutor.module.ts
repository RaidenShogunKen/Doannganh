import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TailieuQuyche } from './entities/tailieu-quyche.entity';
import { TailieuChunkVector } from './entities/tailieu-chunk-vector.entity';
import { HoithoaiAi } from './entities/hoithoai-ai.entity';
import { TinnhanAi } from './entities/tinnhan-ai.entity';
import { CustomKbChunk } from './entities/custom-kb-chunk.entity';
import { RagService } from './rag.service';
import { OpenRouterService } from './openrouter.service';
import { AiTutorService } from './ai-tutor.service';
import { AiTutorController } from './ai-tutor.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TailieuQuyche,
      TailieuChunkVector,
      HoithoaiAi,
      TinnhanAi,
      CustomKbChunk,
    ]),
  ],
  controllers: [AiTutorController],
  providers: [AiTutorService, RagService, OpenRouterService],
  exports: [AiTutorService, RagService],
})
export class AiTutorModule {}
