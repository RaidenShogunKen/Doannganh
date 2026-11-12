
import { useState } from 'react';
import { CreateUserPayload } from '../../lib/api';

interface ImportUsersModalProps {
  onImport: (danhSach: CreateUserPayload[]) => void | Promise<void>;
  onClose: () => void;
}

const COT_CHUAN = ['hoTen', 'email', 'vaiTro', 'sdt', 'mshv', 'trinhDo', 'khoaHoc', 'hocHam', 'hocVi', 'chuyenMon'];

const FILE_MAU =
  'hoTen,email,vaiTro,sdt,mshv,trinhDo,khoaHoc,hocHam,hocVi,chuyenMon\n' +
  'Nguyễn Văn An,an.nv@example.test,HocVien,0912345678,NCS2026101,TienSi,Khóa K26 (2025 - 2029),,,\n' +
  'Trần Thị Bình,binh.tt@example.test,GiangVien,0987654321,,,,Phó Giáo sư,Tiến sĩ,Khoa Công nghệ Thông tin\n';

function tachDongCsv(dong: string): string[] {
  const o: string[] = [];
  let hienTai = '';
  let trongNgoac = false;
  for (let i = 0; i < dong.length; i++) {
    const c = dong[i];
    if (c === '"') {
      if (trongNgoac && dong[i + 1] === '"') {
        hienTai += '"';
        i++;
      } else {
        trongNgoac = !trongNgoac;
      }
    } else if (c === ',' && !trongNgoac) {
      o.push(hienTai.trim());
      hienTai = '';
    } else {
      hienTai += c;
    }
  }
  o.push(hienTai.trim());
  return o;
}

export function ImportUsersModal({ onImport, onClose }: ImportUsersModalProps) {
  const [danhSach, setDanhSach] = useState<CreateUserPayload[]>([]);
  const [loi, setLoi] = useState<string[]>([]);
  const [tenFile, setTenFile] = useState('');
  const [dangGui, setDangGui] = useState(false);

  const docFile = async (file: File) => {
    setTenFile(file.name);
    const noiDung = (await file.text()).replace(/^﻿/, '');
    const dong = noiDung.split(/\r?\n/).filter((d) => d.trim().length > 0);

    if (dong.length < 2) {
      setLoi(['File không có dữ liệu (cần dòng tiêu đề và ít nhất 1 dòng nội dung).']);
      setDanhSach([]);
      return;
    }

    const tieuDe = tachDongCsv(dong[0]).map((h) => h.replace(/^"|"$/g, ''));
    const thieuCot = ['hoTen', 'email', 'vaiTro'].filter((c) => !tieuDe.includes(c));
    if (thieuCot.length) {
      setLoi([`File thiếu cột bắt buộc: ${thieuCot.join(', ')}. Cột hợp lệ: ${COT_CHUAN.join(', ')}.`]);
      setDanhSach([]);
      return;
    }

    const ketQua: CreateUserPayload[] = [];
    const loiDong: string[] = [];

    dong.slice(1).forEach((d, i) => {
      const o = tachDongCsv(d);
      const rec: Record<string, string> = {};
      tieuDe.forEach((h, idx) => (rec[h] = (o[idx] || '').replace(/^"|"$/g, '')));

      if (!rec.hoTen || !rec.email || !rec.vaiTro) {
        loiDong.push(`Dòng ${i + 2}: thiếu họ tên, email hoặc vai trò.`);
        return;
      }
      if (!['HocVien', 'GiangVien', 'Admin'].includes(rec.vaiTro)) {
        loiDong.push(`Dòng ${i + 2}: vai trò "${rec.vaiTro}" không hợp lệ.`);
        return;
      }
      if (rec.vaiTro === 'HocVien' && !rec.mshv) {
        loiDong.push(`Dòng ${i + 2}: tài khoản học viên bắt buộc có MSHV.`);
        return;
      }

      ketQua.push({
        hoTen: rec.hoTen,
        email: rec.email,
        vaiTro: rec.vaiTro as CreateUserPayload['vaiTro'],
        sdt: rec.sdt || undefined,
        mshv: rec.mshv || undefined,
        trinhDo: (rec.trinhDo as 'TienSi' | 'ThacSi') || undefined,
        khoaHoc: rec.khoaHoc || undefined,
        hocHam: rec.hocHam || undefined,
        hocVi: rec.hocVi || undefined,
        chuyenMon: rec.chuyenMon || undefined,
      });
    });

    setDanhSach(ketQua);
    setLoi(loiDong);
  };

  const taiFileMau = () => {
    const blob = new Blob(['﻿' + FILE_MAU], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Mau_Import_NCS_GiangVien_SDH.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-users-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
    >
      <article className="card max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
        <header className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              Nhập Dữ Liệu Hàng Loạt
            </span>
            <h3 id="import-users-title" className="font-sans text-base font-bold text-slate-900 mt-1">
              Import Danh Sách NCS / Giảng Viên Từ File CSV
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-lg font-bold cursor-pointer"
            aria-label="Đóng modal import"
          >
            ✕
          </button>
        </header>

        <div className="my-4 space-y-4 text-xs font-sans">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-2">
            <span className="text-3xl">📁</span>
            <p className="font-semibold text-slate-700">Chọn file CSV danh sách tài khoản</p>
            <label className="btn-secondary py-1.5 px-3 text-xs font-bold inline-block cursor-pointer">
              Chọn File Từ Máy Tính
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) docFile(f);
                }}
                className="hidden"
              />
            </label>
            {tenFile && <p className="text-[11px] font-mono text-slate-600">📄 {tenFile}</p>}
            <p className="text-[10px] text-slate-400">
              Cột bắt buộc: hoTen, email, vaiTro — tối đa 500 dòng mỗi lần nhập
            </p>
          </div>

          {danhSach.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
              ✅ Đã đọc hợp lệ <strong>{danhSach.length}</strong> tài khoản, sẵn sàng ghi vào cơ sở dữ liệu.
            </div>
          )}

          {loi.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800 space-y-1 max-h-40 overflow-y-auto">
              <p className="font-bold">⚠️ {loi.length} dòng sẽ bị bỏ qua:</p>
              {loi.map((l) => (
                <p key={l} className="text-[11px]">
                  • {l}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>Chưa có file mẫu?</span>
            <button type="button" onClick={taiFileMau} className="font-bold text-blue-600 hover:underline cursor-pointer">
              📥 Tải File CSV Mẫu Chuẩn
            </button>
          </div>

          <footer className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button type="button" onClick={onClose} className="btn-secondary text-xs py-2 px-4 cursor-pointer">
              Đóng
            </button>
            <button
              type="button"
              disabled={danhSach.length === 0 || dangGui}
              onClick={async () => {
                setDangGui(true);
                try {
                  await onImport(danhSach);
                } finally {
                  setDangGui(false);
                }
              }}
              className="btn-primary text-xs py-2 px-5 cursor-pointer font-bold shadow-md disabled:opacity-50"
            >
              {dangGui ? 'Đang nhập…' : `Nhập ${danhSach.length} Tài Khoản`}
            </button>
          </footer>
        </div>
      </article>
    </div>
  );
}
