interface Props {
  status: string;
}

export const thesisStatusLabels: Record<string, string> = {
  ChoDuyet: 'Chờ duyệt',
  DaDuyet: 'Đã duyệt',
  TuChoi: 'Từ chối',
  DangThucHien: 'Đang thực hiện',
  DuDKBaoVe: 'Đủ điều kiện bảo vệ',
  DuDieuKienBaoVe: 'Đủ điều kiện bảo vệ',
  DangBaoVe: 'Đã xếp lịch bảo vệ',
  DaBaoVe: 'Đã bảo vệ',
  KhongDat: 'Bảo vệ không đạt',
};

export function StatusBadge({ status }: Props) {
  switch (status) {
    case 'ChoDuyet':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Chờ duyệt
        </span>
      );
    case 'DaDuyet':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Đã duyệt
        </span>
      );
    case 'TuChoi':
    case 'KhongDat':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          {thesisStatusLabels[status]}
        </span>
      );
    case 'DuDKBaoVe':
    case 'DuDieuKienBaoVe':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          {thesisStatusLabels[status]}
        </span>
      );
    case 'DaBaoVe':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Đã Bảo vệ
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {thesisStatusLabels[status] || status}
        </span>
      );
  }
}
