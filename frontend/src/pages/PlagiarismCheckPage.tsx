import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { plagiarismApi, PlagiarismScanResult } from '../lib/api';
import { exportPlagiarismReportPdf } from '../lib/exportService';

export function PlagiarismCheckPage() {
  const [inputText, setInputText] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [queryCrossref, setQueryCrossref] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [scannedText, setScannedText] = useState('');
  const [scannedTitle, setScannedTitle] = useState('');
  const [result, setResult] = useState<PlagiarismScanResult | null>(null);
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(null);
  const selectedSnippet = result?.matchedSnippets.find((snippet) => snippet.id === selectedSnippetId);

  const handleScan = async () => {
    if (scanning || !inputText.trim() || inputText.length > 250000) return;
    const text = inputText.trim();
    const title = docTitle.trim();
    setScanning(true);
    setError('');
    setResult(null);
    setSelectedSnippetId(null);
    try {
      const { data } = await plagiarismApi.check({ text, title: title || undefined, queryCrossref });
      setResult(data);
      setScannedText(text);
      setScannedTitle(title);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join('. ') : message || 'Chưa nhận được kết quả đối sánh. Vui lòng thử lại.');
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    setError('');
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error('Tệp vượt giới hạn 25 MB.');
      let text: string;
      if (/\.docx$/i.test(file.name)) {
        const { default: mammoth } = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        text = result.value;
      } else if (/\.txt$/i.test(file.name)) {
        text = await file.text();
      } else {
        throw new Error('Vui lòng chọn tệp TXT hoặc DOCX.');
      }
      if (!text.trim()) throw new Error('Tệp không có văn bản để đối sánh.');
      setDocTitle(file.name.replace(/\.[^.]+$/, '').slice(0, 300));
      setInputText(text);
      setResult(null);
    } catch (err: any) {
      setError(err?.message || 'Không đọc được tệp.');
    }
  };

  return (
    <AppShell
      title="Kiểm Tra Liêm Chính Học Thuật & Quét Trùng Lặp Luận Án"
      subtitle="Đối sánh văn bản với kho nội bộ và tra cứu tiêu đề qua Crossref."
    >
      <div className="space-y-6">
        {}
        <p className="text-sm leading-relaxed text-slate-700">
          Kết quả dùng để rà soát các đoạn cần xem lại. Crossref cung cấp thông tin tiêu đề, tác giả và DOI.
          <Link to="/de-tai" className="ml-2 font-semibold text-blue-700 underline">Về danh sách đề tài</Link>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-sans text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>📝</span>
                  <span>Văn Bản Cần Rà Soát Liêm Chính</span>
                </h3>
                <span className="text-xs text-slate-400">Hỗ trợ sao chép văn bản hoặc tải tệp</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Tên Đề tài / Văn bản kiểm tra:</label>
                <input
                  value={docTitle}
                  maxLength={300}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="input-field text-xs mt-1"
                  placeholder="Nhập tên đề tài luận án hoặc tên bài báo..."
                />
                {inputText.length > 250000 && <p className="text-sm text-rose-800">Văn bản vượt 250.000 ký tự. Hãy chia thành các phần nhỏ.</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Tải tệp văn bản (.txt, .docx):</label>
                <input
                  type="file"
                  accept=".txt,.docx"
                  onChange={handleFileUpload}
                  className="input-field text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer mt-1"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700">Nội dung toàn văn cần quét trùng lặp:</label>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {inputText.split(/\s+/).filter(Boolean).length} từ · {inputText.length} ký tự
                  </span>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={10}
                  placeholder="Dán toàn văn tóm tắt đề cương luận án, báo cáo tiến độ 6 tháng hoặc nội dung bài báo khoa học vào đây..."
                  className="w-full rounded-2xl border border-slate-200 p-4 text-xs font-mono leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-y"
                />
              </div>

              <label className="flex items-start gap-2 text-sm text-slate-800">
                <input type="checkbox" checked={queryCrossref} onChange={(event) => setQueryCrossref(event.target.checked)} />
                Gửi tiêu đề tới Crossref để tra cứu DOI và thông tin công bố
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={!inputText.trim() || inputText.length > 250000 || scanning || (queryCrossref && docTitle.trim().length < 10)}
                  onClick={handleScan}
                  className="btn-primary py-3 px-8 text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <span>{scanning ? '⏳' : '⚡'}</span>
                  <span>{scanning ? 'Đang Thực Hiện Quét Liêm Chính...' : 'Bắt Đầu Quét Trùng Lặp & Liêm Chính'}</span>
                </button>
              </div>

              {scanning && <p role="status" className="text-sm text-blue-800">Đang đối sánh văn bản…</p>}
              {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
            </div>
          </div>
        </div>

        {}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`card p-5 border-2 ${
                result.overallSimilarity <= result.quyCheCheck.nguongToiDa
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : result.overallSimilarity <= 25
                  ? 'border-amber-300 bg-amber-50/50'
                  : 'border-rose-300 bg-rose-50/50'
              }`}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tỷ lệ câu tương đồng</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className={`text-4xl font-extrabold font-mono ${
                    result.overallSimilarity <= result.quyCheCheck.nguongToiDa ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {result.corpusSize ? result.overallSimilarity + '%' : '—'}
                  </span>
                  <span className="text-xs font-bold text-slate-500">/ Mốc tham khảo {result.quyCheCheck.nguongToiDa}%</span>
                </div>
                <p className="text-[11px] font-semibold mt-1 text-slate-600">
                  {!result.corpusSize ? 'Kho tiêu đề chưa có dữ liệu' : result.overallSimilarity <= result.quyCheCheck.nguongToiDa ? 'Trong mốc tham khảo' : 'Cần xem lại đoạn tương đồng'}
                </p>
              </div>

              <div className="card p-5 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nhận định đối sánh</p>
                <p className={`text-xs font-bold mt-2 ${
                  result.overallSimilarity <= result.quyCheCheck.nguongToiDa ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {!result.corpusSize ? 'CHƯA CÓ DỮ LIỆU ĐỐI CHIẾU' : result.status === 'Pass' ? 'TRONG MỐC THAM KHẢO' : result.status === 'Warning' ? 'CẢNH BÁO SÁT HẠN' : 'CẦN RÀ SOÁT'}
                </p>
                <p className="text-[10px] text-slate-500 line-clamp-2">
                  {result.quyCheCheck.ketLuan}
                </p>
              </div>

              <div className="card p-5 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Quy Mô Văn Bản</p>
                <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">{result.totalWords} từ</p>
                <p className="text-[11px] text-slate-500">{result.totalSentences} câu phân tích</p>
              </div>

              <div className="card p-5 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Đoạn Trùng Khớp</p>
                <p className="text-xl font-extrabold text-slate-900 font-mono mt-1">{result.matchedSnippets.length} đoạn</p>
                <p className="text-[11px] text-slate-500">từ {result.sources.length} nguồn tham chiếu</p>
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {}
              <div className="lg:col-span-7 card p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="font-sans text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>📖</span>
                    <span>Văn bản đã đối sánh</span>
                  </h3>
                </div>

                <div className="max-h-[500px] overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs leading-relaxed font-sans space-y-2 whitespace-pre-wrap">
                  <p className="break-words text-slate-800">{scannedText}</p>
                </div>
              </div>

              {}
              <div className="lg:col-span-5 card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="font-sans text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>📚</span>
                    <span>Danh Sách Nguồn Trùng Khớp</span>
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {result.sources.length} nguồn
                  </span>
                </div>
                {!result.sources.length && <p className="text-sm text-slate-600">Chưa có nguồn khớp trong kho tiêu đề.</p>}
                {!!result.matchedSnippets.length && <details className="space-y-2">
                  <summary className="cursor-pointer text-sm font-semibold text-blue-800">Xem từng đoạn tương đồng</summary>
                  <ul className="max-h-52 space-y-2 overflow-y-auto">
                    {result.matchedSnippets.map((snippet) => <li key={snippet.id}>
                      <button type="button" aria-pressed={snippet.id === selectedSnippetId}
                        className="w-full rounded-lg bg-slate-50 p-2 text-left text-sm text-blue-900 hover:bg-blue-50"
                        onClick={() => setSelectedSnippetId(snippet.id)}>{snippet.text}</button>
                    </li>)}
                  </ul>
                  {selectedSnippet && <p className="text-sm text-slate-700">Nguồn đối sánh · {selectedSnippet.sourceName}</p>}
                </details>}

                <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {result.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs truncate max-w-[70%]">
                          {idx + 1}. {src.name}
                        </span>
                        <span className="font-mono font-extrabold text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          {src.percent}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">
                          {src.sourceType === 'CrossRef' ? 'Crossref' : 'Kho nội bộ'}
                        </span>
                        <span>{src.snippetCount} đoạn trùng</span>
                      </div>
                    </div>
                  ))}
                </div>

                {}
                <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => exportPlagiarismReportPdf(result, scannedTitle)}
                    className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>📄</span>
                    <span>Xuất báo cáo đối sánh PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setInputText('');
                      setDocTitle('');
                    }}
                    className="btn-secondary py-2 text-xs font-bold text-center cursor-pointer"
                  >
                    Quét Văn Bản Mới
                  </button>
                </div>
              </div>
            </div>
            {result.crossRefVerification && <section className="card space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Tra cứu tiêu đề qua Crossref</h3>
              {result.crossRefVerification.apiStatus !== 'Live'
                ? <p className="text-sm text-slate-700">Chưa nhận được phản hồi từ Crossref.</p>
                : result.crossRefVerification.topMatches.length > 0
                  ? <ul className="space-y-3 text-sm">
                    {result.crossRefVerification.topMatches.map((match) => <li key={match.doi}>
                      <a className="break-words font-semibold text-blue-800 underline" href={`https://doi.org/${encodeURI(match.doi)}`}
                        target="_blank" rel="noopener noreferrer">{match.title}</a>
                      <p className="break-words text-slate-600">{[match.journal, match.doi].filter(Boolean).join(' · ')}</p>
                    </li>)}
                  </ul>
                  : <p className="text-sm text-slate-700">Chưa tìm thấy tiêu đề phù hợp.</p>}
            </section>}
          </div>
        )}
      </div>
    </AppShell>
  );
}
