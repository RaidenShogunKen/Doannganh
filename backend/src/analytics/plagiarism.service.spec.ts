import { BadRequestException } from '@nestjs/common';
import { PlagiarismService } from './plagiarism.service';

describe('Đối sánh câu với kho tiêu đề', () => {
  const title = 'Nghiên cứu đối sánh văn bản tiếng Việt trong thư viện số';
  const topics = { find: jest.fn() };
  const service = new PlagiarismService(topics as any);

  beforeEach(() => topics.find.mockResolvedValue([{ tenDt: title }]));

  it('từ chối văn bản trống', async () => {
    await expect(service.scanDocument('  ')).rejects.toThrow(BadRequestException);
  });

  it('đếm mỗi câu xuất hiện và trả offset đúng cho câu lặp', async () => {
    const result = await service.scanDocument(title + '. ' + title + '. Câu thứ ba không liên quan.');
    expect(result.overallSimilarity).toBe(66.7);
    expect(result.matchedSentencesCount).toBe(2);
    expect(result.matchedSnippets[1].startIndex).toBe(title.length + 2);
    expect(result.sources).toEqual([{ name: title, sourceType: 'NoiBo', snippetCount: 2, percent: 66.7 }]);
  });

  it('không tạo nguồn mẫu khi kho trống', async () => {
    topics.find.mockResolvedValue([]);
    const result = await service.scanDocument(title);
    expect(result.corpusSize).toBe(0);
    expect(result.sources).toEqual([]);
  });

  it('chỉ gọi Crossref khi được chọn và không tính độ khớp tiêu đề vào tỷ lệ nội bộ', async () => {
    const lookup = jest.spyOn(service, 'verifyCrossRef').mockResolvedValue([{ doi: '10.000/test', title, score: 100 }]);
    const different = 'Văn bản nói về một tình huống hoàn toàn khác.';
    await service.scanDocument(different, title);
    expect(lookup).not.toHaveBeenCalled();
    const result = await service.scanDocument(different, title, true);
    expect(lookup).toHaveBeenCalledWith([title]);
    expect(result.overallSimilarity).toBe(0);
    expect(result.crossRefVerification?.matchesFound).toBe(1);
    lookup.mockRestore();
  });
});
