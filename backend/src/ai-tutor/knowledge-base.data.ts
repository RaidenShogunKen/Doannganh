import { regulationSources, regulationSummaries } from './official-regulations';

export interface QuyCheChunk {
  id: string;
  soHieu: string;
  tenVanBan: string;
  coQuan: string;
  dieuKhoan: string;
  tieuDe: string;
  noiDung: string;
  tuKhoa: string[];
  linkGoc?: string;
}

export const KNOWLEDGE_BASE_QUY_CHE: QuyCheChunk[] = regulationSummaries.map(
  ([source, article, tieuDe, noiDung, keywords], index) => {
    const [soHieu, tenVanBan, linkGoc] = regulationSources[source];
    const dieuKhoan = source === 'tt53' && article === '2 và 34'
      ? 'Điều 2 Thông tư và Điều 34 Quy chế'
      : 'Điều ' + article.replace(' và ', ' và Điều ');
    return {
      id: source + '-' + index, soHieu, tenVanBan, linkGoc, dieuKhoan, tieuDe, noiDung,
      coQuan: 'Bộ Giáo dục và Đào tạo', tuKhoa: [...keywords],
    };
  },
);
