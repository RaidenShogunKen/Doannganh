
import { ExtendedUser } from '../../pages/NguoiDungPage';
import { ROLE_LABEL } from '../../lib/roles';
import { getAvatarForUser } from '../../lib/avatarService';

interface UserAccountsTableProps {
  users: ExtendedUser[];
  filteredUsers: ExtendedUser[];
  search: string;
  roleFilter: 'ALL' | 'HocVien' | 'GiangVien' | 'Admin';
  statusFilter: 'ALL' | 'Active' | 'Graduated' | 'Locked';
  loading: boolean;
  onSearchChange: (v: string) => void;
  onRoleFilterChange: (r: 'ALL' | 'HocVien' | 'GiangVien' | 'Admin') => void;
  onStatusFilterChange: (s: 'ALL' | 'Active' | 'Graduated' | 'Locked') => void;
  onOpenBroadcast: () => void;
  onOpenImport: () => void;
  onExportCSV: () => void;
  onOpenAddModal: () => void;
  onSelectDetail: (u: ExtendedUser) => void;
  onSelectEdit: (u: ExtendedUser) => void;
  onSelectResetPass: (u: ExtendedUser) => void;
  onToggleStatus: (maNd: string) => void;
}

export function UserAccountsTable({
  filteredUsers,
  search,
  roleFilter,
  statusFilter,
  loading,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onOpenBroadcast,
  onOpenImport,
  onExportCSV,
  onOpenAddModal,
  onSelectDetail,
  onSelectEdit,
  onSelectResetPass,
  onToggleStatus,
}: UserAccountsTableProps) {
  return (
    <>
      {}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="🔍 Tìm kiếm họ tên, email, MSHV, ngành..."
            className="input-field text-xs w-72"
            aria-label="Tìm kiếm người dùng"
          />

          {}
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            {(['ALL', 'HocVien', 'GiangVien', 'Admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRoleFilterChange(r)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === r
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {r === 'ALL' ? 'Tất cả vai trò' : r === 'HocVien' ? 'NCS / Học viên' : ROLE_LABEL[r]}
              </button>
            ))}
          </div>

          {}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as any)}
            className="input-field text-xs w-40"
            aria-label="Lọc theo trạng thái"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="Active">🟢 Đang hoạt động</option>
            <option value="Graduated">🎓 Đã tốt nghiệp</option>
            <option value="Locked">🔴 Đang khóa</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenBroadcast}
            className="btn-secondary py-2 px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Gửi thông báo học vụ tới toàn thể người dùng"
          >
            <span>📢</span>
            <span>Phát Thông Báo Học Vụ</span>
          </button>

          <button
            type="button"
            onClick={onOpenImport}
            className="btn-secondary py-2 px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span>📤</span>
            <span>Import Excel/CSV</span>
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="btn-secondary py-2 px-3 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span>📥</span>
            <span>Xuất Danh Bạ</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="btn-primary py-2 px-4 cursor-pointer shadow-sm text-xs font-bold flex items-center gap-1"
          >
            <span>+</span>
            <span>Tạo Người Dùng</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-10">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="mt-2 text-xs font-semibold text-slate-500">Đang tải danh sách người dùng...</p>
        </div>
      ) : (
        <div className="card overflow-hidden !p-0 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Họ và Tên / Định Danh</th>
                  <th className="px-5 py-3.5">Email &amp; Liên Hệ</th>
                  <th className="px-5 py-3.5">Vai Trò &amp; Học Vị</th>
                  <th className="px-5 py-3.5">Chuyên Ngành / Phụ Trách</th>
                  <th className="px-5 py-3.5">Trạng Thái</th>
                  <th className="px-5 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.maNd} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 shrink-0 rounded-xl overflow-hidden bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs border border-blue-200">
                          {getAvatarForUser(u.email, u.vaiTro) || u.avatar ? (
                            <img
                              src={(getAvatarForUser(u.email, u.vaiTro) || u.avatar)!}
                              alt={u.hoTen}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            u.hoTen.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            {u.hoTen}
                            {u.vaiTro === 'HocVien' && u.trinhDo === 'TienSi' && (
                              <span className="rounded bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 font-bold">
                                NCS
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {u.mshv ? `MSHV: ${u.mshv}` : `Mã ND: ${u.maNd}`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <p className="font-mono text-slate-800">{u.email}</p>
                      <p className="text-[11px] text-slate-400">{u.soDienThoai || 'Chưa cập nhật SĐT'}</p>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            u.vaiTro === 'Admin'
                              ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20'
                              : u.vaiTro === 'GiangVien'
                              ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
                              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                          }`}
                        >
                          {u.vaiTro === 'HocVien'
                            ? u.trinhDo === 'TienSi'
                              ? '🔬 Nghiên cứu sinh'
                              : '🎓 Học viên ThS'
                            : ROLE_LABEL[u.vaiTro]}
                        </span>
                        {u.vaiTro === 'GiangVien' && (
                          <p className="text-[10px] font-semibold text-slate-500">
                            {u.hocHam ? `${u.hocHam} · ` : ''}{u.hocVi}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {u.vaiTro === 'HocVien' ? (
                        <div>
                          <p className="font-semibold text-slate-800">{u.chuyenNganh || 'Khoa học Máy tính'}</p>
                          <p className="text-[11px] text-slate-400">{u.khoaHoc} · GVHD: {u.gvhd || 'Đang phân công'}</p>
                        </div>
                      ) : u.vaiTro === 'GiangVien' ? (
                        <div>
                          <p className="font-semibold text-slate-800">{u.khoa || 'Khoa CNTT'}</p>
                          <p className="text-[11px] text-indigo-600 font-bold">
                            Hướng dẫn: {u.ncsDangHuongDan || 0} / {u.hanMucToiDa || 5} NCS
                          </p>
                        </div>
                      ) : (
                        <p className="font-semibold text-slate-700">{u.khoa || 'Phòng Đào tạo Sau Đại học'}</p>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          u.trangThai === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : u.trangThai === 'Graduated'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            u.trangThai === 'Active'
                              ? 'bg-emerald-500'
                              : u.trangThai === 'Graduated'
                              ? 'bg-blue-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {u.trangThai === 'Active'
                          ? 'Đang hoạt động'
                          : u.trangThai === 'Graduated'
                          ? 'Đã tốt nghiệp'
                          : 'Đã khóa'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectDetail(u)}
                          title="Xem chi tiết hồ sơ"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 cursor-pointer text-xs font-bold"
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectEdit(u)}
                          title="Chỉnh sửa thông tin hành chính"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 cursor-pointer text-xs font-bold"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectResetPass(u)}
                          title="Đặt lại mật khẩu"
                          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer text-xs font-bold"
                        >
                          🔑
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleStatus(u.maNd)}
                          title={u.trangThai === 'Active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          className={`rounded-lg p-1.5 cursor-pointer text-xs font-bold ${
                            u.trangThai === 'Active'
                              ? 'text-rose-700 hover:bg-rose-100 hover:text-rose-900'
                              : 'text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.trangThai === 'Active' ? '🔒' : '🔓'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-xs text-slate-500">
                      Không tìm thấy tài khoản người dùng nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
