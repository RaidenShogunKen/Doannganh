import { VaiTro } from '../lib/api';

export interface NavItem {
  to: string;
  label: string;
}

export const ROLE_LABEL: Record<VaiTro, string> = {
  HocVien: 'Học viên',
  GiangVien: 'Giảng viên',
  Admin: 'Quản trị đào tạo',
};

const dashboard: NavItem = { to: '/', label: 'Tổng quan' };
const councils: NavItem = { to: '/hoi-dong', label: 'Hội đồng' };
const profile: NavItem = { to: '/ho-so', label: 'Hồ sơ và đơn học vụ' };
const scan: NavItem = { to: '/kiem-tra-dao-van', label: 'Đối sánh văn bản' };
const tutor: NavItem = { to: '/ai-tutor', label: 'Trợ lý quy chế' };

export const ROLE_NAV: Record<VaiTro, NavItem[]> = {
  HocVien: [
    dashboard,
    { to: '/hoc-phan', label: 'Học phần và bảng điểm' },
    { to: '/de-tai', label: 'Đề tài và tiến độ' },
    councils, profile, scan, tutor,
  ],
  GiangVien: [
    dashboard,
    { to: '/de-tai', label: 'Đề tài hướng dẫn' },
    { to: '/hoc-phan', label: 'Học phần và nhập điểm' },
    councils, profile, scan, tutor,
  ],
  Admin: [
    dashboard,
    { to: '/de-tai', label: 'Quản lý đề tài' },
    councils,
    { to: '/hoc-phan', label: 'Quản lý học phần' },
    profile,
    { to: '/nguoi-dung', label: 'Quản lý người dùng' },
    { to: '/analytics-dashboard', label: 'Phân tích và kho quy chế' },
    scan, tutor,
  ],
};
