import { DeTai, BaiBao, SlaWarningItem, PlagiarismScanResult, HoiDong } from './api';

export async function exportDeTaiToExcel(deTais: DeTai[], fileName = 'Danh_Sach_De_Tai_Sau_Dai_Hoc.xlsx') {
  const XLSX = await import('xlsx');
  const data = deTais.map((dt, idx) => ({
    'STT': idx + 1,
    'Mã Đề Tài': dt.maDt,
    'Tên Đề Tài Nghiên Cứu': dt.tenDt,
    'Học Viên / NCS': dt.hocVien?.nguoiDung?.hoTen || 'Chưa phân công',
    'Trình Độ': dt.hocVien?.trinhDo === 'TienSi' ? 'Tiến sĩ' : 'Thạc sĩ',
    'GVHD Chính': dt.giangVienHuongDan
      ? `${dt.giangVienHuongDan.hocHam || ''} ${dt.giangVienHuongDan.hocVi || ''} ${dt.giangVienHuongDan.nguoiDung?.hoTen || ''}`.trim()
      : 'Chưa có',
    'GVHD Phụ (Đồng HD)': dt.giangVienHuongDan2
      ? `${dt.giangVienHuongDan2.hocHam || ''} ${dt.giangVienHuongDan2.hocVi || ''} ${dt.giangVienHuongDan2.nguoiDung?.hoTen || ''}`.trim()
      : 'Không',
    'Trạng Thái': formatTrangThai(dt.trangThai),
    'Ngày Đăng Ký': dt.ngayDangKy || '',
    'Ngày Dự Kiến Bảo Vệ': dt.ngayDuKienBaoVe || 'Chưa xếp lịch',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 45 },
    { wch: 22 },
    { wch: 12 },
    { wch: 25 },
    { wch: 25 },
    { wch: 20 },
    { wch: 14 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_Sach_De_Tai');
  XLSX.writeFile(workbook, fileName);
}

export async function exportBaiBaoToExcel(baiBaos: BaiBao[], fileName = 'Danh_Muc_Bai_Bao_Khoa_Hoc_ISI_Scopus.xlsx') {
  const XLSX = await import('xlsx');
  const data = baiBaos.map((bb, idx) => ({
    'STT': idx + 1,
    'Mã Bài Báo': bb.maBb,
    'Tên Bài Báo Khoa Học': bb.tieuDe,
    'Tạp Chí / Hội Thảo': bb.tenTapChiHoiThao || 'Chưa cập nhật',
    'Phân Loại': bb.phanLoai || 'Khác',
    'Ngày Công Bố': bb.ngayCongBo || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 45 },
    { wch: 30 },
    { wch: 14 },
    { wch: 15 },
    { wch: 25 },
    { wch: 28 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bai_Bao_Khoa_Hoc');
  XLSX.writeFile(workbook, fileName);
}

export async function exportSlaReportExcel(warnings: SlaWarningItem[], fileName = 'Bao_Cao_SLA_Tien_Do_Sau_Dai_Hoc.xlsx') {
  const XLSX = await import('xlsx');
  const data = warnings.map((w, idx) => ({
    'STT': idx + 1,
    'MSHV': w.mshv,
    'Họ Và Tên NCS': w.hoTen,
    'Chuyên Ngành': w.chuyenNganh,
    'Tên Đề Tài Luận Án': w.tenDt,
    'Số Tháng Đào Tạo': w.soThangDaDaoTao,
    'Mức Độ Cảnh Báo':
      w.mucDoCanhBao === 'BaoDongDo'
        ? 'BÁO ĐỘNG ĐỎ (> 60 tháng)'
        : w.mucDoCanhBao === 'CanDayNhanh'
        ? 'Cần Đẩy Nhanh (36 - 60 tháng)'
        : 'An Toàn (< 36 tháng)',
    'Số Bài Báo ISI/Scopus': w.soBaiBaoIsiScopus,
    'Lần Báo Cáo Tiến Độ Gần Nhất': `Kỳ ${w.lanBaoCaoGanNhat}`,
    'Giảng Viên Hướng Dẫn': w.gvhd,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 22 },
    { wch: 20 },
    { wch: 45 },
    { wch: 18 },
    { wch: 28 },
    { wch: 22 },
    { wch: 28 },
    { wch: 25 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Canh_Bao_SLA_72T');
  XLSX.writeFile(workbook, fileName);
}

async function generatePdfFromHtml(htmlContent: string, fileName: string) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')]);
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.fontFamily = 'Arial, "Segoe UI", Tahoma, sans-serif';
  container.style.padding = '36px 44px';
  container.style.boxSizing = 'border-box';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}

const htmlEntities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(text: unknown) {
  return String(text ?? '').replace(/[&<>"']/g, (character) => htmlEntities[character]);
}

export async function exportHoiDongPdf(council: HoiDong) {
  const members = (council.thanhVien || []).map((member) =>
    `<li>${escapeHtml(member.giangVien?.nguoiDung?.hoTen || 'Giảng viên')} · ${escapeHtml(formatVaiTroHoiDong(member.chucDanh))}</li>`,
  ).join('');
  await generatePdfFromHtml(`
    <h1>Tóm tắt kết quả hội đồng</h1>
    <h2>${escapeHtml(council.deTai?.tenDt)}</h2>
    <p>Học viên: ${escapeHtml(council.deTai?.hocVien?.nguoiDung?.hoTen || 'Chưa có dữ liệu')}</p>
    <p>Ngày đánh giá: ${escapeHtml(new Date(council.ngayBaoVe).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }))}</p>
    <p>Địa điểm: ${escapeHtml(council.diaDiem || 'Chưa có dữ liệu')}</p>
    <p>Kết quả: <strong>${escapeHtml(council.ketQua || 'Chưa chốt')}</strong></p>
    ${council.diemTb != null ? `<p>Điểm trung bình: ${escapeHtml(council.diemTb)}/10</p>` : ''}
    <h3>Thành viên hội đồng</h3><ul>${members}</ul>
    <p>Bản tóm tắt từ dữ liệu học vụ. Tra cứu biên bản đã ký trong hồ sơ hội đồng.</p>
  `, `Tom_tat_hoi_dong_${council.maHd}.pdf`);
}

export async function exportPlagiarismReportPdf(result: PlagiarismScanResult, docTitle = 'Văn bản đối sánh') {
  const sources = result.sources.map((source) =>
    `<li>${escapeHtml(source.name)} · ${escapeHtml(source.snippetCount)} câu · ${escapeHtml(source.percent)}%</li>`,
  ).join('');
  const crossref = result.crossRefVerification;
  await generatePdfFromHtml(`
    <h1>Báo cáo đối sánh văn bản</h1>
    <p>Văn bản: <strong>${escapeHtml(docTitle)}</strong></p>
    <p>Ngày đối sánh: ${escapeHtml(result.scanDate)}</p>
    <p>Phạm vi: ${escapeHtml(result.corpusSize)} tiêu đề đã bảo vệ trong kho nội bộ.</p>
    <p>Số câu tương đồng: ${escapeHtml(result.matchedSentencesCount)}/${escapeHtml(result.totalSentences)}.</p>
    <p>Tỷ lệ câu tương đồng: ${result.corpusSize ? escapeHtml(result.overallSimilarity) + '%' : 'Chưa có dữ liệu'}</p>
    <p>${escapeHtml(result.quyCheCheck.ketLuan)}</p>
    ${sources ? `<h2>Nguồn nội bộ khớp</h2><ul>${sources}</ul>` : '<p>Chưa tìm thấy câu khớp trong phạm vi đã đối chiếu.</p>'}
    ${crossref ? `<p>Tra cứu tiêu đề Crossref: ${crossref.apiStatus === 'Error' ? 'Không kết nối được' : escapeHtml(crossref.matchesFound) + ' kết quả'}.</p>` : ''}
  `, 'Bao_cao_doi_sanh.pdf');
}

function formatTrangThai(tt: string): string {
  const map: Record<string, string> = {
    ChoDuyet: 'Chờ duyệt',
    DaDuyet: 'Đã duyệt',
    DangThucHien: 'Đang thực hiện',
    DuDKBaoVe: 'Đủ ĐK bảo vệ',
    DaBaoVe: 'Đã bảo vệ',
    Huy: 'Đã hủy',
  };
  return map[tt] || tt;
}

function formatVaiTroHoiDong(vt: string): string {
  const map: Record<string, string> = {
    ChuTich: 'Chủ tịch HĐ',
    ThuKy: 'Thư ký HĐ',
    PhanBien1: 'Phản biện 1',
    PhanBien2: 'Phản biện 2',
    UyVien: 'Ủy viên HĐ',
  };
  return map[vt] || vt;
}
