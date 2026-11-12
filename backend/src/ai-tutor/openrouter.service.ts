import { Injectable, Logger } from '@nestjs/common';

export interface SupportedAiModel {
  id: string;
  name: string;
  provider: string;
  badge: string;
  description: string;
  isFree: boolean;
  contextLength?: number;
}

export const FALLBACK_FREE_MODELS: SupportedAiModel[] = [
  {
    id: 'openrouter/free',
    name: '🤖 Trợ lý AI Quy chế (Free Models Router - Khuyến nghị)',
    provider: 'OpenRouter / Hệ Thống Đào Tạo',
    badge: 'Tự động định tuyến · 200k Context',
    description: 'Bộ định tuyến tự động tối ưu hóa tốc độ và độ chuẩn xác quy chế trên các model free khả dụng.',
    isFree: true,
    contextLength: 200000,
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: '🧠 Trợ lý AI Phân tích Chuyên sâu (Google Gemma 4 31B)',
    provider: 'Google / OpenRouter',
    badge: 'Khuyến nghị · 262k Context',
    description: 'Mô hình phân tích sâu 31B tham số của Google, chuyên xử lý quy chế phức tạp về luận án và bài báo.',
    isFree: true,
    contextLength: 262144,
  },
  {
    id: 'google/gemma-4-26b-a4b-it:free',
    name: '📚 Trợ lý AI Tra cứu Quy chế Siêu tốc (Google Gemma 4 26B)',
    provider: 'Google / OpenRouter',
    badge: 'Siêu tốc · 262k Context',
    description: 'Mô hình 26B tham số tối ưu hóa tốc độ tra cứu tức thời số hiệu văn bản và điều khoản Thông tư.',
    isFree: true,
    contextLength: 262144,
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: '⚡ Trợ lý AI Phản hồi Nhanh (NVIDIA Nemotron 3.5 Lightning)',
    provider: 'NVIDIA / OpenRouter',
    badge: '1M Context · Siêu nhanh',
    description: 'Mô hình ngữ cảnh siêu lớn 1.000.000 tokens của NVIDIA, đối chiếu toàn văn quy chuẩn đào tạo.',
    isFree: true,
    contextLength: 1000000,
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: '🏛️ Trợ lý AI Tham vấn Cấp cao (NVIDIA Nemotron 3 Ultra 550B)',
    provider: 'NVIDIA / OpenRouter',
    badge: '550B Siêu Lớn · 1M Context',
    description: 'Mô hình siêu trọng lượng 550B tham số chuyên giải quyết các ca học vụ và cơ cấu hội đồng phức tạp.',
    isFree: true,
    contextLength: 1000000,
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: '🛡️ Trợ lý AI Kiểm định Quy chuẩn (NVIDIA Nemotron 3 Super 120B)',
    provider: 'NVIDIA / OpenRouter',
    badge: '120B Tham số · 262k Context',
    description: 'Mô hình 120B tham số chuyên kiểm định tiêu chuẩn điều kiện bảo vệ và chuẩn bài báo ISI/Scopus.',
    isFree: true,
    contextLength: 262144,
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: '🔍 Trợ lý AI Suy luận Logic (NVIDIA Nemotron 3 Nano Omni Reasoning)',
    provider: 'NVIDIA / OpenRouter',
    badge: 'Reasoning · 256k Context',
    description: 'Mô hình có khả năng suy luận chuỗi (Chain-of-Thought) kiểm tra đối soát quy định học vụ.',
    isFree: true,
    contextLength: 256000,
  },
  {
    id: 'z-ai/glm-5.2:free',
    name: '🌐 Trợ lý AI Đa ngữ Học thuật (Z.ai GLM 5.2)',
    provider: 'Z.ai / OpenRouter',
    badge: 'Đa ngữ · 256k Context',
    description: 'Mô hình đa ngữ thế hệ mới xử lý tài liệu học thuật và văn bản quy phạm pháp luật.',
    isFree: true,
    contextLength: 256000,
  },
  {
    id: 'liquid/lfm-2.5-2.6b:free',
    name: '💡 Trợ lý AI Tinh gọn Trích xuất (LiquidAI LFM 2.5 2.6B)',
    provider: 'LiquidAI / OpenRouter',
    badge: 'Gọn nhẹ · 65k Context',
    description: 'Mô hình kiến trúc Liquid mượt mà, trích xuất súc tích các điều khoản và thông số định mức.',
    isFree: true,
    contextLength: 65536,
  },
  {
    id: 'thinkingmachines/inkling:free',
    name: '📖 Trợ lý AI Tổng hợp Văn bản (Thinking Machines Inkling)',
    provider: 'Thinking Machines / OpenRouter',
    badge: 'Tổng hợp · 262k Context',
    description: 'Mô hình chuyên tổng hợp và so sánh sự khác biệt giữa Thông tư 18/2021 và Thông tư 23/2021.',
    isFree: true,
    contextLength: 262144,
  },
  {
    id: 'cohere/north-mini-code:free',
    name: '💻 Trợ lý AI Kỹ thuật & Cấu trúc Dữ liệu (Cohere North Mini Code)',
    provider: 'Cohere / OpenRouter',
    badge: 'Cấu trúc · 256k Context',
    description: 'Mô hình chuyên xử lý cấu trúc dữ liệu quy chuẩn và biểu mẫu báo cáo tiến độ.',
    isFree: true,
    contextLength: 256000,
  },
  {
    id: 'poolside/laguna-s-2.1:free',
    name: '🎯 Trợ lý AI Tối ưu Hóa Học vụ (Poolside Laguna S 2.1)',
    provider: 'Poolside / OpenRouter',
    badge: 'Tối ưu · 262k Context',
    description: 'Mô hình tối ưu hóa quy trình xét duyệt đề tài và thẩm định điều kiện bảo vệ.',
    isFree: true,
    contextLength: 262144,
  },
  {
    id: 'dots-studio/dots-3-note-preview:free',
    name: '📝 Trợ lý AI Tóm tắt Ghi chú (Dots Studio Dots3-Note Preview)',
    provider: 'Dots Studio / OpenRouter',
    badge: 'Ghi chú · 512k Context',
    description: 'Mô hình ngữ cảnh 512k tokens hỗ trợ tóm tắt biên bản họp hội đồng và nhận xét của GVHD.',
    isFree: true,
    contextLength: 512000,
  },
];

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private cachedModels: SupportedAiModel[] | null = null;
  private lastFetchTime = 0;

  async getAvailableModels(): Promise<SupportedAiModel[]> {
    const now = Date.now();
    if (this.cachedModels && now - this.lastFetchTime < 15 * 60 * 1000) {
      return this.cachedModels;
    }

    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const json = await res.json();
        const models = json.data || [];
        const liveFree = models
          .filter(
            (m: any) =>
              (m.id.endsWith(':free') ||
                m.id === 'openrouter/free' ||
                (m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0)) &&
              !m.id.includes('lyria') &&
              !m.id.includes('safety'),
          )
          .map((m: any) => {
            let academicName = `🤖 Trợ lý AI Quy chế (${m.name || m.id})`;
            let academicBadge = `${Math.round((m.context_length || 128000) / 1024)}k Context`;

            if (m.id === 'openrouter/free') {
              academicName = '🤖 Trợ lý AI Quy chế (Free Models Router - Khuyến nghị)';
              academicBadge = 'Tự động định tuyến';
            } else if (m.id.includes('gemma-4-31b')) {
              academicName = '🧠 Trợ lý AI Phân tích Chuyên sâu (Google Gemma 4 31B)';
              academicBadge = 'Khuyến nghị · 262k';
            } else if (m.id.includes('gemma-4-26b')) {
              academicName = '📚 Trợ lý AI Tra cứu Quy chế Siêu tốc (Google Gemma 4 26B)';
              academicBadge = 'Siêu tốc · 262k';
            } else if (m.id.includes('nemotron-3.5-lightning')) {
              academicName = '⚡ Trợ lý AI Phản hồi Nhanh (NVIDIA Nemotron 3.5 Lightning)';
              academicBadge = '1M Context';
            } else if (m.id.includes('nemotron-3-ultra')) {
              academicName = '🏛️ Trợ lý AI Tham vấn Cấp cao (NVIDIA Nemotron 3 Ultra 550B)';
              academicBadge = '550B Siêu Lớn';
            } else if (m.id.includes('nemotron-3-super')) {
              academicName = '🛡️ Trợ lý AI Kiểm định Quy chuẩn (NVIDIA Nemotron 3 Super 120B)';
              academicBadge = '120B Tham số';
            } else if (m.id.includes('reasoning')) {
              academicName = '🔍 Trợ lý AI Suy luận Logic (NVIDIA Nemotron Reasoning)';
              academicBadge = 'Reasoning';
            } else if (m.id.includes('glm')) {
              academicName = '🌐 Trợ lý AI Đa ngữ Học thuật (Z.ai GLM 5.2)';
              academicBadge = 'Đa ngữ · 256k';
            } else if (m.id.includes('lfm')) {
              academicName = '💡 Trợ lý AI Tinh gọn Trích xuất (LiquidAI LFM 2.5)';
              academicBadge = 'Gọn nhẹ · 65k';
            }

            return {
              id: m.id,
              name: academicName,
              provider: m.name ? `${m.name.split(':')[0] || 'OpenRouter'}` : 'Hệ Thống Đào Tạo',
              badge: academicBadge,
              description: m.description || 'Mô hình trợ lý ảo miễn phí chuyên trách tư vấn Quy chế Đào tạo Sau Đại học.',
              isFree: true,
              contextLength: m.context_length,
            };
          });

        if (liveFree.length > 0) {
          this.cachedModels = liveFree;
          this.lastFetchTime = now;
          this.logger.log(`⚡ Đã tải thành công ${liveFree.length} model miễn phí thực tế từ OpenRouter API.`);
          return liveFree;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Không thể lấy danh sách model live từ OpenRouter: ${err.message}. Sử dụng danh sách fallback.`);
    }

    return FALLBACK_FREE_MODELS;
  }

  async *generateChatCompletionStream(
    systemPrompt: string,
    userQuestion: string,
    modelId?: string,
    historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ): AsyncGenerator<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const selectedModel = modelId || process.env.OPENROUTER_MODEL || 'openrouter/free';
    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_openrouter_api_key_here')) {
      yield '[STREAMING_UNAVAILABLE]';
      return;
    }

    const trimmedHistory = historyMessages.slice(-20);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'QLDT Sau Dai Hoc AI Tutor',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...trimmedHistory,
            { role: 'user', content: userQuestion },
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      });

      if (!response.ok || !response.body) {
        this.logger.error(`OpenRouter Stream API lỗi: ${response.status}`);
        yield '[STREAM_ERROR]';
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const jsonStr = trimmed.slice(6);
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch { }
        }
      }
    } catch (error: any) {
      this.logger.error(`Lỗi Streaming OpenRouter: ${error.message}`);
      yield '[STREAM_ERROR]';
    }
  }

  async generateChatCompletion(
    systemPrompt: string,
    userQuestion: string,
    modelId?: string,
    historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ): Promise<string | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const selectedModel = modelId || process.env.OPENROUTER_MODEL || 'openrouter/free';
    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_openrouter_api_key_here')) {
      this.logger.warn(
        'Chưa cấu hình OPENROUTER_API_KEY trong .env. Hệ thống chuyển sang RAG Engine cục bộ.',
      );
      return null;
    }

    const trimmedHistory = historyMessages.slice(-20);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'QLDT Sau Dai Hoc AI Tutor',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...trimmedHistory,
            { role: 'user', content: userQuestion },
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`OpenRouter API trả về lỗi HTTP ${response.status}: ${errorText}`);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      return content || null;
    } catch (error: any) {
      this.logger.error(`Lỗi khi gọi OpenRouter API: ${error.message}`, error.stack);
      return null;
    }
  }
}
