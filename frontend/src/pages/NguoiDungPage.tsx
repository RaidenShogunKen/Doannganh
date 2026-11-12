import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { ROLE_LABEL } from '../lib/roles';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  userApi,
  ExtendedUser as ApiExtendedUser,
  CreateUserPayload,
  NhatKyThaoTac,
  VaiTro,
} from '../lib/api';

import { UserStatsCards } from '../components/nguoi-dung/UserStatsCards';
import { UserAccountsTable } from '../components/nguoi-dung/UserAccountsTable';
import { AuditLogTable } from '../components/nguoi-dung/AuditLogTable';
import { UserDetailModal } from '../components/nguoi-dung/UserDetailModal';
import { EditUserModal } from '../components/nguoi-dung/EditUserModal';
import { ResetPasswordModal } from '../components/nguoi-dung/ResetPasswordModal';
import { AddUserModal } from '../components/nguoi-dung/AddUserModal';
import { ImportUsersModal } from '../components/nguoi-dung/ImportUsersModal';
import { BroadcastModal } from '../components/nguoi-dung/BroadcastModal';

export type ExtendedUser = ApiExtendedUser;

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  ipAddress: string;
  status: 'Success' | 'Warning' | 'Info';
}

function mapNhatKy(log: NhatKyThaoTac): AuditLogItem {
  return {
    id: log.maLog,
    timestamp: new Date(log.thoiGian).toLocaleString('vi-VN'),
    user: log.hoTen,
    role: log.vaiTro,
    action: log.hanhDong,
    ipAddress: log.diaChiIp || '—',
    status: log.ketQua,
  };
}

export function NguoiDungPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'accounts' | 'audit-log'>('accounts');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'HocVien' | 'GiangVien' | 'Admin'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Graduated' | 'Locked'>('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<ExtendedUser | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<ExtendedUser | null>(null);
  const [resetPassUser, setResetPassUser] = useState<ExtendedUser | null>(null);

  const isAdmin = user?.vaiTro === 'Admin';

  const taiDuLieu = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [usersRes, logsRes] = await Promise.all([userApi.list(), userApi.nhatKy(150)]);
      setUsers(usersRes.data || []);
      setAuditLogs((logsRes.data || []).map(mapNhatKy));
    } catch (err: any) {
      setUsers([]);
      setAuditLogs([]);
      setLoadError(
        err?.response?.data?.message ||
          'Không tải được danh sách người dùng từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.',
      );
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    taiDuLieu();
  }, [taiDuLieu]);

  if (user?.vaiTro !== 'Admin') {
    return (
      <AppShell
        title="Quản lý Người dùng & Phân quyền"
        subtitle="Phân hệ dành riêng cho Quản trị viên Phòng Đào tạo Sau Đại học"
      >
        <div className="card text-center py-12 space-y-4 max-w-lg mx-auto">
          <span className="text-4xl">🛡️</span>
          <h3 className="font-sans text-lg font-bold text-slate-900">Giới hạn Quyền Truy cập</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tài khoản của bạn (<strong className="text-slate-800">{user?.hoTen}</strong> - Vai trò:{' '}
            <strong>{user ? ROLE_LABEL[user.vaiTro] : ''}</strong>) không có quyền quản trị danh sách người dùng toàn trường.
          </p>
          <div className="pt-2">
            <Link to="/" className="btn-primary py-2 px-5 text-xs inline-block">
              Quay lại Bảng điều khiển
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const handleAddUser = async (payload: CreateUserPayload) => {
    try {
      const { data } = await userApi.create(payload);
      if (data.matKhauKhoiTao) window.prompt('Sao chép mật khẩu khởi tạo để bàn giao cho người dùng.', data.matKhauKhoiTao);
      setShowAddModal(false);
      await taiDuLieu();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không tạo được tài khoản. Vui lòng kiểm tra lại thông tin.');
    }
  };

  const handleToggleStatus = async (maNd: string) => {
    try {
      await userApi.toggleTrangThai(maNd);
      await taiDuLieu();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không đổi được trạng thái tài khoản.');
    }
  };

  const handleSaveEdit = async (edited: ExtendedUser) => {
    try {
      await userApi.update(edited.maNd, {
        hoTen: edited.hoTen,
        email: edited.email,
        sdt: edited.soDienThoai,
        vaiTro: edited.vaiTro,
        trangThai: edited.trangThai,
        mshv: edited.mshv,
        trinhDo: edited.trinhDo,
        khoaHoc: edited.khoaHoc,
        hocHam: edited.hocHam,
        hocVi: edited.hocVi,
        chuyenMon: edited.khoa,
      });
      setSelectedUserForEdit(null);
      await taiDuLieu();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không lưu được thay đổi.');
    }
  };

  const handleResetPassword = async (target: ExtendedUser) => {
    try {
      const res = await userApi.resetPassword(target.maNd);
      alert(res.data.message);
      setResetPassUser(null);
      await taiDuLieu();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không cấp lại được mật khẩu.');
    }
  };

  const handleImportUsers = async (danhSach: CreateUserPayload[]) => {
    try {
      const res = await userApi.import(danhSach);
      const { thanhCong, thatBai, loi } = res.data;
      alert(
        `Đã nhập ${thanhCong} tài khoản, ${thatBai} dòng lỗi. Dùng thao tác đặt lại mật khẩu để cấp quyền đăng nhập cho tài khoản nhập mới.` +
          (loi.length ? `\n\nChi tiết lỗi:\n${loi.map((l) => `Dòng ${l.dong} (${l.email}): ${l.lyDo}`).join('\n')}` : ''),
      );
      setShowImportModal(false);
      await taiDuLieu();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không nhập khẩu được danh sách tài khoản.');
    }
  };

  const handleSendBroadcast = async (data: { title: string; message: string; target: 'ALL' | 'HocVien' | 'GiangVien' }) => {
    try {
      const res = await userApi.broadcast({
        tieuDe: data.title,
        noiDung: data.message,
        doiTuong: data.target as 'ALL' | VaiTro,
      });
      alert(`📢 Đã phát thông báo học vụ tới ${res.data.doiTuong} (${res.data.soNguoiNhan} người nhận).`);
      setShowBroadcastModal(false);
      await taiDuLieu();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không phát được thông báo học vụ.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Mã ND', 'Họ và Tên', 'Email', 'SĐT', 'Vai Trò', 'Trạng Thái', 'MSHV/Học Vị', 'Chuyên Ngành/Khoa'];
    const rows = filteredUsers.map((u) => [
      u.maNd,
      `"${u.hoTen}"`,
      u.email,
      u.soDienThoai || '',
      u.vaiTro,
      u.trangThai,
      u.vaiTro === 'HocVien' ? u.mshv || '' : u.hocVi || '',
      u.vaiTro === 'HocVien' ? u.chuyenNganh || '' : u.khoa || '',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Danh_Sach_Nguoi_Dung_SDH_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalUsers = users.length;
  const totalNCS = users.filter((u) => u.vaiTro === 'HocVien' && u.trinhDo === 'TienSi').length;
  const totalLecturers = users.filter((u) => u.vaiTro === 'GiangVien').length;
  const totalAdmins = users.filter((u) => u.vaiTro === 'Admin').length;

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.hoTen.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.mshv && u.mshv.toLowerCase().includes(search.toLowerCase())) ||
      (u.chuyenNganh && u.chuyenNganh.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === 'ALL' || u.vaiTro === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.trangThai === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <AppShell
      title="Trung Tâm Quản Trị Người Dùng & Định Danh Học Thuật"
      subtitle="Quản lý toàn diện tài khoản NCS Tiến sĩ, Học viên Cao học, Giảng viên Hướng dẫn, Phân quyền RBAC và Nhật ký Bảo mật"
    >
      {loadError && (
        <div role="alert" className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          ⚠️ {loadError}
          <button type="button" onClick={taiDuLieu} className="ml-3 underline font-bold cursor-pointer">
            Thử lại
          </button>
        </div>
      )}

      {}
      <UserStatsCards
        totalUsers={totalUsers}
        totalNCS={totalNCS}
        totalLecturers={totalLecturers}
        totalAdmins={totalAdmins}
      />

      {}
      <div className="mb-6 flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'accounts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          👥 Danh Sách &amp; Phân Quyền Tài Khoản ({users.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit-log')}
          className={`pb-3 text-sm font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit-log'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>🛡️</span>
          <span>Nhật Ký Thao Tác &amp; Bảo Mật ({auditLogs.length})</span>
        </button>
      </div>

      {activeTab === 'accounts' ? (
        <UserAccountsTable
          users={users}
          filteredUsers={filteredUsers}
          search={search}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          loading={loading}
          onSearchChange={setSearch}
          onRoleFilterChange={setRoleFilter}
          onStatusFilterChange={setStatusFilter}
          onOpenBroadcast={() => setShowBroadcastModal(true)}
          onOpenImport={() => setShowImportModal(true)}
          onExportCSV={handleExportCSV}
          onOpenAddModal={() => setShowAddModal(true)}
          onSelectDetail={(u) => setSelectedUserForDetail(u)}
          onSelectEdit={(u) => setSelectedUserForEdit(u)}
          onSelectResetPass={(u) => setResetPassUser(u)}
          onToggleStatus={handleToggleStatus}
        />
      ) : (
        <AuditLogTable
          auditLogs={auditLogs}
          onExportLogs={() => {
            const blob = new Blob([JSON.stringify(auditLogs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Nhat_Ky_Thao_Tac_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        />
      )}

      {}
      {selectedUserForDetail && (
        <UserDetailModal
          user={selectedUserForDetail}
          onClose={() => setSelectedUserForDetail(null)}
        />
      )}

      {}
      {selectedUserForEdit && (
        <EditUserModal
          user={selectedUserForEdit}
          onSave={handleSaveEdit}
          onClose={() => setSelectedUserForEdit(null)}
        />
      )}

      {}
      {resetPassUser && (
        <ResetPasswordModal
          user={resetPassUser}
          onConfirm={() => handleResetPassword(resetPassUser)}
          onClose={() => setResetPassUser(null)}
        />
      )}

      {}
      {showAddModal && (
        <AddUserModal
          onAdd={handleAddUser}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {}
      {showImportModal && (
        <ImportUsersModal
          onImport={handleImportUsers}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {}
      {showBroadcastModal && (
        <BroadcastModal
          totalUsers={users.length}
          onSend={handleSendBroadcast}
          onClose={() => setShowBroadcastModal(false)}
        />
      )}
    </AppShell>
  );
}
