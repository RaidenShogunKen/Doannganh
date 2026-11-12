import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Response } from 'express';
import { DataSource, Repository } from 'typeorm';
import { NguoiGui } from '../common/enums';
import { ChatAiDto } from './dto/chat-ai.dto';
import { CustomKbChunk } from './entities/custom-kb-chunk.entity';
import { HoithoaiAi } from './entities/hoithoai-ai.entity';
import { TinnhanAi } from './entities/tinnhan-ai.entity';
import { KNOWLEDGE_BASE_QUY_CHE, QuyCheChunk } from './knowledge-base.data';
import { OpenRouterService } from './openrouter.service';
import { RagService, ScoredChunk } from './rag.service';

type Citation = Omit<ScoredChunk, 'tuKhoa' | 'maTl'>;
type SourceInput = Omit<QuyCheChunk, 'id' | 'coQuan' | 'tuKhoa'> & { coQuan?: string; tuKhoa?: string[] };
const disabledPrefix = '_disabled_';
const toCitation = ({ tuKhoa, maTl, ...citation }: ScoredChunk): Citation => citation;

@Injectable()
export class AiTutorService {
  constructor(
    @InjectRepository(HoithoaiAi) private readonly conversations: Repository<HoithoaiAi>,
    @InjectRepository(TinnhanAi) private readonly messages: Repository<TinnhanAi>,
    @InjectRepository(CustomKbChunk) private readonly documents: Repository<CustomKbChunk>,
    private readonly rag: RagService,
    private readonly provider: OpenRouterService,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    const stored = await this.documents.find();
    for (const row of stored) {
      const builtin = KNOWLEDGE_BASE_QUY_CHE.find((chunk) => chunk.id === row.chunkId);
      if (builtin) {
        if (!row.isActive) builtin.id = disabledPrefix + row.chunkId;
      } else {
        const { chunkId, soHieu, tenVanBan, coQuan, dieuKhoan, tieuDe, noiDung, tuKhoa, linkGoc } = row;
        KNOWLEDGE_BASE_QUY_CHE.push({
          id: row.isActive ? chunkId : disabledPrefix + chunkId,
          soHieu, tenVanBan, coQuan, dieuKhoan, tieuDe, noiDung, tuKhoa, linkGoc,
        });
      }
    }
    this.rag.buildVectorIndex();
  }

  async listSessions(userId: string) {
    const sessions = await this.conversations.find({
      where: { maNd: userId }, order: { thoiGianBatDau: 'DESC' }, take: 50,
    });
    return sessions.map(({ maHt, chuDe, thoiGianBatDau }) => ({ maHt, chuDe, thoiGianBatDau }));
  }

  async readSession(userId: string, maHt: string) {
    await this.requireSession(userId, maHt);
    return this.recentMessages(maHt, 100);
  }

  async deleteSession(userId: string, maHt: string) {
    const result = await this.conversations.delete({ maHt, maNd: userId });
    if (!result.affected) throw new NotFoundException('Không tìm thấy hội thoại');
  }

  async clearSessions(userId: string) {
    await this.conversations.delete({ maNd: userId });
  }

  async chat(userId: string, dto: ChatAiDto) {
    const turn = await this.prepareTurn(userId, dto);
    const generated = !turn.probe && turn.sources.length > 0
      ? await this.provider.generateChatCompletion(this.rag.buildSystemPrompt(turn.sources), turn.question, turn.model, turn.history)
      : null;
    const reply = this.rag.redactSensitivePii(generated || turn.probe || this.rag.generateLocalSynthesizedAnswer(turn.question, turn.sources));
    const citations = turn.sources.map(toCitation);
    const maHt = await this.saveTurn(userId, dto.maHt, turn.question, reply, citations, turn.sources[0]?.maTl);
    return {
      reply, citations, maHt, modelUsed: generated ? 'OpenRouter' : 'Tra cứu trong kho quy chế',
      time: new Date().toISOString(),
    };
  }

  async chatStream(userId: string, dto: ChatAiDto, res: Response) {
    const turn = await this.prepareTurn(userId, dto);
    const citations = turn.sources.map(toCitation);
    const send = (payload: object) => {
      if (!res.destroyed) res.write('data: ' + JSON.stringify(payload) + '\n\n');
    };
    send({ citations });
    let reply = '';
    let modelUsed = 'Tra cứu trong kho quy chế';
    if (!turn.probe && turn.sources.length > 0) {
      const stream = this.provider.generateChatCompletionStream(
        this.rag.buildSystemPrompt(turn.sources), turn.question, turn.model, turn.history,
      );
      for await (const token of stream) {
        if (res.destroyed) return;
        if (token === '[STREAMING_UNAVAILABLE]' || token === '[STREAM_ERROR]') {
          reply = '';
          break;
        }
        reply += token;
        send({ token });
      }
      if (reply) modelUsed = 'OpenRouter';
    }
    reply = this.rag.redactSensitivePii(reply || turn.probe || this.rag.generateLocalSynthesizedAnswer(turn.question, turn.sources));
    if (res.destroyed) return;
    const maHt = await this.saveTurn(userId, dto.maHt, turn.question, reply, citations, turn.sources[0]?.maTl);
    send({ done: true, maHt, reply, modelUsed });
    if (!res.destroyed) res.write('data: [DONE]\n\n');
  }

  private async prepareTurn(userId: string, dto: ChatAiDto) {
    const raw = dto.cauHoi.trim();
    if (!raw) throw new BadRequestException('Câu hỏi không được để trống');
    if (dto.maHt) await this.requireSession(userId, dto.maHt);
    const question = this.rag.redactSensitivePii(raw);
    const probe = this.rag.checkSecurityOrModelProbe(raw);
    const model = dto.model || process.env.OPENROUTER_MODEL || 'openrouter/free';
    if (dto.model && dto.model !== 'openrouter/free' && !dto.model.endsWith(':free')) {
      throw new BadRequestException('Chỉ có thể chọn mô hình miễn phí từ danh mục');
    }
    const sources = probe ? [] : await this.rag.searchRelevantChunksAsync(question, 3);
    const previous = dto.maHt ? await this.recentMessages(dto.maHt, 12) : [];
    const history = previous.map((message) => ({
      role: message.nguoiGui === NguoiGui.User ? 'user' as const : 'assistant' as const,
      content: message.noiDung.slice(0, 4000),
    }));
    return { question, probe, model, sources, history };
  }

  private async requireSession(userId: string, maHt: string) {
    const row = await this.conversations.findOneBy({ maHt, maNd: userId });
    if (!row) throw new NotFoundException('Không tìm thấy hội thoại');
    return row;
  }

  private async recentMessages(maHt: string, take: number) {
    const messages = await this.messages.find({ where: { maHt }, order: { thoiGian: 'DESC', maTn: 'DESC' }, take });
    return messages.reverse();
  }

  private async saveTurn(userId: string, maHt: string | undefined, question: string, reply: string, citations: Citation[], source?: string) {
    return this.dataSource.transaction(async (manager) => {
      let session = maHt ? await manager.findOne(HoithoaiAi, {
        where: { maHt, maNd: userId }, lock: { mode: 'pessimistic_write' },
      }) : null;
      if (maHt && !session) throw new NotFoundException('Không tìm thấy hội thoại');
      if (!session) session = await manager.save(HoithoaiAi, { maNd: userId, chuDe: question.slice(0, 80) });
      const timestamp = new Date();
      await manager.insert(TinnhanAi, [
        { maHt: session.maHt, nguoiGui: NguoiGui.User, noiDung: question, thoiGian: timestamp },
        { maHt: session.maHt, nguoiGui: NguoiGui.AI, noiDung: reply,
          thoiGian: new Date(timestamp.getTime() + 1), citations, maTlThamchieu: source },
      ]);
      return session.maHt;
    });
  }

  getAvailableModels() {
    return this.provider.getAvailableModels();
  }

  getRegulationDocuments() {
    return KNOWLEDGE_BASE_QUY_CHE.filter((chunk) => !chunk.id.startsWith(disabledPrefix));
  }

  getKnowledgeBaseAdmin() {
    const chunks = KNOWLEDGE_BASE_QUY_CHE;
    const totals = new Map<string, number>();
    for (const chunk of chunks) totals.set(chunk.soHieu, (totals.get(chunk.soHieu) || 0) + 1);
    return {
      tongChunk: chunks.length,
      tongVanBan: totals.size,
      tongTuKhoa: new Set(chunks.flatMap((chunk) => chunk.tuKhoa)).size,
      phanBoVanBan: [...totals].map(([soHieu, soChunk]) => ({ soHieu, soChunk })),
      chunks: chunks.map((chunk) => ({ ...chunk, noiDungTomTat: chunk.noiDung.slice(0, 120) })),
    };
  }

  async addKnowledgeBaseChunk(dto: SourceInput) {
    const soHieu = dto.soHieu.trim();
    const dieuKhoan = dto.dieuKhoan.trim();
    if (KNOWLEDGE_BASE_QUY_CHE.some((chunk) => chunk.soHieu === soHieu && chunk.dieuKhoan === dieuKhoan)) {
      throw new ConflictException('Số hiệu và điều khoản này đã có trong kho tri thức');
    }
    const chunk: QuyCheChunk = {
      id: 'custom-' + randomUUID(), soHieu, dieuKhoan, tieuDe: dto.tieuDe.trim(), noiDung: dto.noiDung.trim(),
      tenVanBan: dto.tenVanBan.trim(), coQuan: dto.coQuan?.trim() || 'Cơ sở đào tạo',
      tuKhoa: dto.tuKhoa || [], linkGoc: dto.linkGoc,
    };
    await this.persistChunk(chunk, true);
    KNOWLEDGE_BASE_QUY_CHE.push(chunk);
    this.rag.buildVectorIndex();
    return { success: true, message: 'Đã lưu nguồn tham chiếu vào kho tri thức.', chunk };
  }

  async toggleKnowledgeBaseChunk(id: string) {
    const realId = id.replace(disabledPrefix, '');
    const chunk = KNOWLEDGE_BASE_QUY_CHE.find((item) => item.id.replace(disabledPrefix, '') === realId);
    if (!chunk) throw new NotFoundException('Không tìm thấy nguồn tham chiếu');
    const activate = chunk.id.startsWith(disabledPrefix);
    await this.persistChunk(chunk, activate);
    chunk.id = activate ? realId : disabledPrefix + realId;
    this.rag.buildVectorIndex();
    return { success: true, newStatus: activate ? 'active' : 'disabled', message: 'Đã lưu trạng thái nguồn tham chiếu.' };
  }

  async deleteKnowledgeBaseChunk(id: string) {
    const realId = id.replace(disabledPrefix, '');
    if (!realId.startsWith('custom-')) throw new BadRequestException('Có thể ẩn nguồn quy chế có sẵn trong kho.');
    await this.documents.delete({ chunkId: realId });
    const index = KNOWLEDGE_BASE_QUY_CHE.findIndex((chunk) => chunk.id.replace(disabledPrefix, '') === realId);
    if (index !== -1) KNOWLEDGE_BASE_QUY_CHE.splice(index, 1);
    this.rag.buildVectorIndex();
    return { success: true, message: 'Đã xóa nguồn tham chiếu.' };
  }

  private async persistChunk(chunk: QuyCheChunk, isActive: boolean) {
    const { id, ...data } = chunk;
    await this.documents.upsert({ ...data, chunkId: id.replace(disabledPrefix, ''), isActive }, ['chunkId']);
  }
}
