import { DragEvent, useRef, useState } from 'react';
import { uploadApi, UploadResponse } from '../../lib/api';
import { FileAttachment } from './PdfViewerModal';

interface FileUploadZoneProps {
  label?: string;
  accept?: string;
  maxSizeMb?: number;
  onUploadSuccess: (res: UploadResponse) => void;
  currentUrl?: string;
  disabled?: boolean;
}

export function FileUploadZone({
  label = 'Tệp minh chứng',
  accept = '.pdf,.png,.jpg,.jpeg,.docx,.xlsx',
  maxSizeMb = 25,
  onUploadSuccess,
  currentUrl,
  disabled,
}: FileUploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadResponse>();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (uploading || disabled) return;
    if (!file.size || file.size > maxSizeMb * 1024 * 1024) {
      setError(file.size ? `Tệp vượt giới hạn ${maxSizeMb} MB.` : 'Tệp không có nội dung.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const { data } = await uploadApi.uploadSingle(file);
      setUploadedFile(data);
      onUploadSuccess(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Tải lên thất bại. Vui lòng chọn lại tệp.');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const [file] = event.dataTransfer.files;
    if (file) void upload(file);
  }

  const fileUrl = uploadedFile?.url || currentUrl;
  return (
    <div className="space-y-2 text-sm">
      <div className={`rounded-xl border border-dashed p-3 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'}`}
        onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept={accept}
            hidden
            onChange={(event) => {
              const [file] = event.currentTarget.files || [];
              event.currentTarget.value = '';
              if (file) void upload(file);
            }}
          />
          <button type="button" className="btn-secondary px-3 py-1.5 text-sm" disabled={uploading || disabled}
            onClick={() => fileInput.current?.click()}>
            Chọn tệp
          </button>
          <span className="font-medium text-slate-700">{label}</span>
          <span className="text-xs text-slate-600">Tối đa {maxSizeMb} MB</span>
        </div>
      </div>
      {uploading && <p role="status" className="text-blue-800">Đang tải tệp…</p>}
      {error && <p role="alert" className="text-rose-800">{error}</p>}
      {fileUrl && (
        <div className="flex flex-wrap items-center gap-2 text-slate-700">
          <span className="break-all">{uploadedFile?.originalName || 'Tệp đã lưu'}</span>
          <FileAttachment fileUrl={fileUrl} fileName={uploadedFile?.originalName} />
        </div>
      )}
    </div>
  );
}
