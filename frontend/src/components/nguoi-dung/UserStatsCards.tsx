
interface UserStatsCardsProps {
  totalUsers: number;
  totalNCS: number;
  totalLecturers: number;
  totalAdmins: number;
}

export function UserStatsCards({
  totalUsers,
  totalNCS,
  totalLecturers,
  totalAdmins,
}: UserStatsCardsProps) {
  return (
    <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng Số Người Dùng</span>
          <span className="h-2 w-2 rounded-full bg-blue-600 ring-4 ring-blue-100" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900">{totalUsers}</span>
          <span className="text-xs text-slate-500 font-medium">tài khoản</span>
        </div>
      </div>

      <div className="card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Nghiên Cứu Sinh Tiến Sĩ</span>
          <span className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-100" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900">{totalNCS}</span>
          <span className="text-xs text-blue-700 font-semibold">NCS</span>
        </div>
      </div>

      <div className="card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Giảng Viên Hướng Dẫn</span>
          <span className="h-2 w-2 rounded-full bg-amber-500 ring-4 ring-amber-100" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900">{totalLecturers}</span>
          <span className="text-xs text-amber-700 font-semibold">GS/PGS/TS</span>
        </div>
      </div>

      <div className="card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quản Trị Viên Đào Tạo</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900">{totalAdmins}</span>
          <span className="text-xs text-emerald-700 font-semibold">Admin</span>
        </div>
      </div>
    </section>
  );
}
