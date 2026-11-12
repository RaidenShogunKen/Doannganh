import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { aiTutorApi, RegulationChunk } from '../../lib/api';

export function DocumentLibraryModal({ onClose, onAskAboutDoc }: {
  onClose: () => void;
  onAskAboutDoc: (document: RegulationChunk) => void;
}) {
  const title = useId();
  const [documents, setDocuments] = useState<RegulationChunk[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    aiTutorApi.getDocuments().then(({ data }) => { if (active) setDocuments(data); })
      .catch(() => { if (active) setError('Không tải được kho quy chế.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const query = search.trim().toLocaleLowerCase('vi');
  const filtered = documents.filter((document) =>
    [document.soHieu, document.dieuKhoan, document.tieuDe, ...document.tuKhoa].some((value) => value.toLocaleLowerCase('vi').includes(query)));

  return createPortal(
    <dialog ref={(element) => { if (element && !element.open) element.showModal(); }}
      onCancel={(event) => { event.preventDefault(); onClose(); }} aria-labelledby={title}
      className="m-auto max-h-[85dvh] w-[min(94vw,52rem)] max-w-none overflow-y-auto rounded-2xl bg-white p-4 shadow-xl backdrop:bg-slate-950/65 sm:p-6">
      <div className="space-y-4">
        <header className="flex items-center justify-between gap-2">
          <h2 id={title} className="text-lg font-bold text-slate-900">Kho quy chế đào tạo</h2>
          <button type="button" onClick={onClose} className="btn-secondary text-sm">Đóng</button>
        </header>
        <label className="block text-sm font-medium text-slate-800">Tìm theo số hiệu, điều khoản hoặc chủ đề
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="input-field mt-1" />
        </label>
        {loading && <p role="status" className="text-sm text-slate-700">Đang tải văn bản…</p>}
        {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
        {!loading && !error && !filtered.length && <p className="text-sm text-slate-700">Không có điều khoản phù hợp.</p>}
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {filtered.map((document) => (
            <details key={document.id} className="py-3 text-sm">
              <summary className="cursor-pointer font-semibold text-slate-900">{document.soHieu} · {document.dieuKhoan} · {document.tieuDe}</summary>
              <p className="mt-2 leading-relaxed text-slate-700">{document.noiDung}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {document.linkGoc?.startsWith('https://') && <a href={document.linkGoc} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline">Mở văn bản gốc</a>}
                <button type="button" onClick={() => onAskAboutDoc(document)} className="btn-secondary text-sm">Hỏi về điều khoản này</button>
              </div>
            </details>
          ))}
        </div>
      </div>
    </dialog>, document.body,
  );
}
