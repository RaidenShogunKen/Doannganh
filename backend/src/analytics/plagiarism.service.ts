import { TrangThaiDeTai } from '../common/enums';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeTai } from '../de-tai/entities/de-tai.entity';

export interface PlagiarismSourceMatch {
  name: string;
  sourceType: 'NoiBo' | 'ThuVienQuocGia' | 'IEEE_Scopus' | 'Internet' | 'CrossRef';
  percent: number;
  snippetCount: number;
  matchedTitle?: string;
}

export interface MatchedSnippet {
  id: string;
  text: string;
  sourceName: string;
  startIndex: number;
  endIndex: number;
  similarity: number;
}

export interface CrossRefWork {
  DOI: string;
  title: string[];
  author?: { given: string; family: string }[];
  'container-title'?: string[];
  published?: { 'date-parts': number[][] };
  score?: number;
}

export interface PlagiarismScanResult {
  overallSimilarity: number;
  status: 'Pass' | 'Warning' | 'Fail';
  quyCheCheck: {
    nguongToiDa: number;
    ketLuan: string;
    hopQuy: boolean;
  };
  totalWords: number;
  totalSentences: number;
  matchedSentencesCount: number;
  scanDate: string;
  sources: PlagiarismSourceMatch[];
  matchedSnippets: MatchedSnippet[];
  corpusSize: number;
  crossRefVerification?: {
    queriesRun: number;
    matchesFound: number;
    topMatches: { doi: string; title: string; journal?: string; score: number }[];
    apiStatus: 'Live' | 'Timeout' | 'Error';
  };
}

@Injectable()
export class PlagiarismService {
  private readonly logger = new Logger(PlagiarismService.name);

  private readonly crossRefApiUrl: string;
  private readonly crossRefPoliteEmail: string;

  constructor(
    @InjectRepository(DeTai)
    private readonly deTaiRepo: Repository<DeTai>,
  ) {
    this.crossRefApiUrl = process.env.CROSSREF_API_URL || 'https://api.crossref.org/works';
    this.crossRefPoliteEmail = process.env.CROSSREF_POLITE_EMAIL?.trim() || '';
  }

  async verifyCrossRef(
    titleCandidates: string[],
  ): Promise<{ doi: string; title: string; journal?: string; score: number }[]> {
    const results: { doi: string; title: string; journal?: string; score: number }[] = [];

    for (const query of titleCandidates.slice(0, 5)) {
      if (query.length < 10) continue;
      try {
        const encodedQuery = encodeURIComponent(query.slice(0, 200));
        const url = `${this.crossRefApiUrl}?query=${encodedQuery}&rows=3&select=DOI,title,container-title,score`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': this.crossRefPoliteEmail
              ? `QLDT-SauDaiHoc/1.0 (mailto:${this.crossRefPoliteEmail})`
              : 'QLDT-SauDaiHoc/1.0',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(6000),
        });

        if (!response.ok) throw new Error(`Crossref HTTP ${response.status}`);
        const data = await response.json();
        const items: CrossRefWork[] = data?.message?.items || [];

        for (const item of items) {
          const crossRefTitle = (item.title?.[0] || '').toLowerCase();
          const querySim = this.titleSimilarity(query.toLowerCase(), crossRefTitle);

          if (item.DOI && querySim >= 0.35) {
            results.push({
              doi: item.DOI,
              title: item.title?.[0] || 'Unknown Title',
              journal: item['container-title']?.[0],
              score: Math.round(querySim * 100),
            });
          }
        }

      } catch (err: any) {
        this.logger.debug(`Không kết nối được Crossref: ${err.message}`);
        throw err;
      }
    }

    const seen = new Set<string>();
    return results
      .filter((r) => { if (seen.has(r.doi)) return false; seen.add(r.doi); return true; })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private titleSimilarity(a: string, b: string): number {
    const tokensA = new Set(a.split(/\s+/).filter((w) => w.length > 2));
    const tokensB = new Set(b.split(/\s+/).filter((w) => w.length > 2));
    let intersection = 0;
    for (const t of tokensA) if (tokensB.has(t)) intersection++;
    const union = tokensA.size + tokensB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  async scanDocument(text: string, title?: string, queryCrossref = false): Promise<PlagiarismScanResult> {
    const cleanText = text.trim();
    if (cleanText.length < 15 || !/\p{L}/u.test(cleanText)) {
      throw new BadRequestException('Cần nhập ít nhất 15 ký tự có nội dung văn bản.');
    }

    const sentences = [...cleanText.matchAll(/[^.!?\n]+[.!?]*/gu)]
      .map((match) => ({ text: match[0].trim(), offset: (match.index ?? 0) + match[0].search(/\S/) }))
      .filter((sentence) => sentence.text.length >= 15);
    if (!sentences.length) throw new BadRequestException('Không có câu đủ dài để đối sánh.');

    const topics = await this.deTaiRepo.find({
      where: { trangThai: TrangThaiDeTai.DaBaoVe },
      select: { tenDt: true, tenDtEn: true },
      order: { ngayDangKy: 'DESC' },
      take: 300,
    });
    const corpus = topics.flatMap((topic) => [topic.tenDt, topic.tenDtEn].filter((value): value is string => Boolean(value))
      .map((value) => ({ title: value, grams: this.createNgrams(value) })));

    const matchedSnippets: MatchedSnippet[] = [];
    const hits = new Map<string, number>();
    let matchedSentencesCount = 0;
    for (const [index, sentence] of sentences.entries()) {
      const grams = this.createNgrams(sentence.text);
      let bestScore = 0.4;
      let bestTitle: string | undefined;
      for (const item of corpus) {
        const score = this.calculateJaccardSimilarity(grams, item.grams);
        if (score >= bestScore) {
          bestTitle = item.title;
          bestScore = score;
        }
      }
      if (!bestTitle) continue;
      matchedSentencesCount++;
      hits.set(bestTitle, (hits.get(bestTitle) ?? 0) + 1);
      if (matchedSnippets.length < 200) {
        matchedSnippets.push({
          id: `match-${index}`,
          text: sentence.text,
          sourceName: bestTitle,
          startIndex: sentence.offset,
          endIndex: sentence.offset + sentence.text.length,
          similarity: Math.round(bestScore * 100),
        });
      }
    }

    let crossRefVerification: PlagiarismScanResult['crossRefVerification'];
    if (queryCrossref) {
      if (!title || title.trim().length < 10) throw new BadRequestException('Cần tên văn bản để tra cứu Crossref.');
      try {
        const matches = await this.verifyCrossRef([title.trim()]);
        crossRefVerification = { queriesRun: 1, matchesFound: matches.length, topMatches: matches, apiStatus: 'Live' };
      } catch {
        crossRefVerification = { queriesRun: 1, matchesFound: 0, topMatches: [], apiStatus: 'Error' };
      }
    }

    const percentOfSentences = (count: number) => Number((count / sentences.length * 100).toFixed(1));
    const overallSimilarity = percentOfSentences(matchedSentencesCount);
    const nguongToiDa = 20;
    const hopQuy = overallSimilarity <= nguongToiDa;
    return {
      overallSimilarity,
      status: !hopQuy ? 'Fail' : overallSimilarity >= 18 ? 'Warning' : 'Pass',
      quyCheCheck: {
        nguongToiDa,
        hopQuy,
        ketLuan: corpus.length === 0
          ? 'Kho tiêu đề chưa có dữ liệu. Chưa thể nhận định mức độ tương đồng.'
          : 'Tỷ lệ dựa trên các tiêu đề nội bộ đã bảo vệ. Mốc 20% chỉ để tham khảo.',
      },
      totalWords: cleanText.split(/\s+/).length,
      totalSentences: sentences.length,
      matchedSentencesCount,
      scanDate: new Date().toISOString().slice(0, 10),
      sources: [...hits.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, sourceType: 'NoiBo', snippetCount: count, percent: percentOfSentences(count) })),
      matchedSnippets,
      crossRefVerification,
      corpusSize: corpus.length,
    };
  }

  private createNgrams(text: string, n = 3): string[] {
    const words = text.normalize('NFC').toLocaleLowerCase('vi').match(/[\p{L}\p{N}]+/gu) ?? [];
    if (words.length < n) return words;
    const ngrams: string[] = [];
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(' '));
    }
    return ngrams;
  }

  private calculateJaccardSimilarity(tokensA: string[], tokensB: string[]): number {
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);
    let intersection = 0;
    for (const item of setA) {
      if (setB.has(item)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

}
