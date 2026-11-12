import { Controller, Post, Get, Delete, Patch, Body, Param, ParseUUIDPipe, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { AiTutorService } from './ai-tutor.service';
import { ChatAiDto } from './dto/chat-ai.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VaiTro } from '../common/enums';
import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class KnowledgeBaseChunkDto {
  @Matches(/\S/)
  @MaxLength(100)
  soHieu: string;
  @Matches(/\S/)
  @MaxLength(300)
  tenVanBan: string;
  @IsOptional()
  @IsString()
  @MaxLength(200)
  coQuan?: string;
  @Matches(/\S/)
  @MaxLength(100)
  dieuKhoan: string;
  @Matches(/\S/)
  @MaxLength(300)
  tieuDe: string;
  @Matches(/\S/)
  @MaxLength(16000)
  noiDung: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  tuKhoa?: string[];
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  linkGoc?: string;
}

@ApiTags('ai-tutor')
@Controller('ai-tutor')
export class AiTutorController {
  constructor(private readonly aiTutorService: AiTutorService) {}

  @ApiOperation({ summary: 'Hỏi đáp AI Tutor Quy chế Đào tạo (RAG + OpenRouter)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(@CurrentUser() user: any, @Body() dto: ChatAiDto) {
    return this.aiTutorService.chat(user?.maNd, dto);
  }

  @ApiOperation({ summary: 'AI Tutor streaming SSE — nhận response từng token realtime' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('chat/stream')
  async chatStream(
    @CurrentUser() user: any,
    @Body() dto: ChatAiDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      await this.aiTutorService.chatStream(user?.maNd, dto, res);
    } catch {
      if (!res.destroyed) res.write(`data: ${JSON.stringify({ error: 'Chưa trả lời được câu hỏi. Vui lòng thử lại.' })}\n\n`);
    } finally {
      res.end();
    }
  }

  @ApiOperation({ summary: 'Lấy danh sách các Model AI Free được hỗ trợ (OpenRouter)' })
  @UseGuards(JwtAuthGuard)
  @Get('models')
  async getModels() {
    return this.aiTutorService.getAvailableModels();
  }

  @ApiOperation({ summary: 'Lấy kho tài liệu quy chế đào tạo hiện hành (Knowledge Base)' })
  @UseGuards(JwtAuthGuard)
  @Get('quy-che')
  async getDocuments() {
    return this.aiTutorService.getRegulationDocuments();
  }

  @UseGuards(JwtAuthGuard)
  @Get('hoi-thoai')
  listSessions(@CurrentUser() user: { maNd: string }) {
    return this.aiTutorService.listSessions(user.maNd);
  }

  @UseGuards(JwtAuthGuard)
  @Get('hoi-thoai/:id')
  readSession(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { maNd: string }) {
    return this.aiTutorService.readSession(user.maNd, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('hoi-thoai/:id')
  deleteSession(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { maNd: string }) {
    return this.aiTutorService.deleteSession(user.maNd, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('hoi-thoai')
  clearSessions(@CurrentUser() user: { maNd: string }) {
    return this.aiTutorService.clearSessions(user.maNd);
  }

  @ApiOperation({ summary: '[Admin] Lấy toàn bộ chunks quy chế trong Knowledge Base kèm thống kê' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTro.Admin)
  @Get('knowledge-base')
  async getKnowledgeBaseAdmin() {
    return this.aiTutorService.getKnowledgeBaseAdmin();
  }

  @ApiOperation({ summary: '[Admin] Thêm chunk quy chế mới vào Knowledge Base (không cần restart)' })
  @ApiBody({ type: KnowledgeBaseChunkDto })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTro.Admin)
  @Post('knowledge-base')
  async addKnowledgeBaseChunk(@Body() dto: KnowledgeBaseChunkDto) {
    return this.aiTutorService.addKnowledgeBaseChunk(dto);
  }

  @ApiOperation({ summary: '[Admin] Ẩn/Hiện một chunk quy chế (toggle trạng thái hiệu lực)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTro.Admin)
  @Patch('knowledge-base/:id/toggle')
  async toggleKnowledgeBaseChunk(@Param('id') id: string) {
    return this.aiTutorService.toggleKnowledgeBaseChunk(id);
  }

  @ApiOperation({ summary: '[Admin] Xóa một chunk quy chế khỏi Knowledge Base' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(VaiTro.Admin)
  @Delete('knowledge-base/:id')
  async deleteKnowledgeBaseChunk(@Param('id') id: string) {
    return this.aiTutorService.deleteKnowledgeBaseChunk(id);
  }
}
