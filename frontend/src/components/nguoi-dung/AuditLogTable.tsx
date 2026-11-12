
import { AuditLogItem } from '../../pages/NguoiDungPage';

interface AuditLogTableProps {
  auditLogs: AuditLogItem[];
  onExportLogs: () => void;
}

export function AuditLogTable({ auditLogs, onExportLogs }: AuditLogTableProps) {
  return (
    <section className="card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="font-sans text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>🛡️</span>
            <span>Nhật Ký Thao Tác &amp; Truy Cập Hệ Thống (Audit Trail)</span>
          </h3>
          <p className="text-xs text-slate-500">
            Ghi nhận chi tiết mọi hành vi xác thực, nộp báo cáo, thay đổi trạng thái và bảo mật học thuật
          </p>
        </div>

        <button
          type="button"
          onClick={onExportLogs}
          className="btn-secondary py-1.5 px-3 text-xs font-bold cursor-pointer"
        >
          📥 Xuất File Log (.JSON)
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-500">
            <tr>
              <th className="py-3 px-4">Thời Gian</th>
              <th className="py-3 px-4">Tài Khoản / Người Thực Hiện</th>
              <th className="py-3 px-4">Vai Trò</th>
              <th className="py-3 px-4">Nội Dung Thao Tác</th>
              <th className="py-3 px-4">Địa Chỉ IP / Thiết Bị</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                  {log.timestamp}
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900">{log.user}</td>
                <td className="py-3 px-4">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {log.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700 leading-relaxed">{log.action}</td>
                <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{log.ipAddress}</td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      log.status === 'Success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : log.status === 'Warning'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {log.status === 'Success' ? 'Thành công' : log.status === 'Warning' ? 'Cảnh báo' : 'Thông tin'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
