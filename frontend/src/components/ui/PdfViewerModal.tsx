import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { uploadApi } from '../../lib/api';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName?: string;
}

export function FileAttachment({ fileUrl, fileName, children = 'Mở tệp' }: {
  fileUrl: string;
  fileName?: string;
  children?: string;
}) {
  const [open, setOpen] = useState(false);
  if (/^https:\/\//i.test(fileUrl)) {
    return <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 underline">{children}</a>;
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="font-semibold text-blue-700 underline">{children}</button>
      <PdfViewerModal isOpen={open} onClose={() => setOpen(false)} fileUrl={fileUrl} fileName={fileName} />
    </>
  );
}

export function PdfViewerModal({ isOpen, onClose, fileUrl, fileName = 'Tài liệu minh chứng' }: PdfViewerModalProps) {
  const titleId = useId();
  const [result, setResult] = useState<{ src: string; type: string } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isOpen || !fileUrl) return;
    const controller = new AbortController();
    let src: string | undefined;
    setResult(null);
    setError('');
    uploadApi.read(fileUrl, controller.signal).then(({ data }) => {
      if (controller.signal.aborted) return;
      src = URL.createObjectURL(data);
      setResult({ src, type: data.type });
    }).catch(() => {
      if (!controller.signal.aborted) setError('Không mở được tệp. Tệp có thể đã bị xóa hoặc bạn chưa có quyền xem.');
    });
    return () => {
      controller.abort();
      if (src) URL.revokeObjectURL(src);
    };
  }, [fileUrl, isOpen]);

  if (!isOpen || !fileUrl) return null;
  return createPortal(
    <dialog
      ref={(dialog) => { if (dialog && !dialog.open) dialog.showModal(); }}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      aria-labelledby={titleId}
      className="m-auto h-[85dvh] w-[min(96vw,64rem)] max-w-none rounded-2xl bg-white p-4 shadow-xl backdrop:bg-slate-950/65"
    >
      <div className="flex h-full flex-col gap-3">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <h3 id={titleId} className="min-w-0 break-words font-semibold text-slate-900">{fileName}</h3>
          <div className="flex gap-2">
            {result && (
              <a href={result.src} download={fileUrl.split('/').pop() || fileName} className="btn-secondary px-3 py-1.5 text-sm">
                Tải xuống
              </a>
            )}
            <button type="button" onClick={onClose} className="btn-secondary px-3 py-1.5 text-sm">Đóng</button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-slate-50">
          {error && <p role="alert" className="p-4 text-sm text-rose-800">{error}</p>}
          {!result && !error && <p role="status" className="p-4 text-sm text-slate-700">Đang mở tệp…</p>}
          {result?.type.startsWith('image/') && <img src={result.src} alt={fileName} className="mx-auto max-h-full max-w-full object-contain" />}
          {result?.type === 'application/pdf' && <iframe src={result.src} title={fileName} className="h-full w-full border-0" />}
          {result && !result.type.startsWith('image/') && result.type !== 'application/pdf' && (
            <p className="p-4 text-sm text-slate-700">Tải xuống để mở định dạng tệp này.</p>
          )}
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
