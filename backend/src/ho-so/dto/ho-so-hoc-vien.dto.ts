import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TrinhDo } from '../../common/enums';

export class HoSoHocVienDto {
  @ApiProperty({ example: 'NCS2026001' })
  @IsNotEmpty({ message: 'Mã số học viên không được để trống' })
  @IsString()
  @MaxLength(20)
  mshv: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'Chuyên ngành không được để trống' })
  @IsInt()
  maChuyenNganh: number;

  @ApiProperty({ enum: TrinhDo, example: TrinhDo.TienSi })
  @IsEnum(TrinhDo, { message: 'Trình độ đào tạo không hợp lệ' })
  trinhDo: TrinhDo;

  @ApiProperty({ example: 'K32', required: false })
  @IsOptional()
  @IsString()
  khoaHoc?: string;

  @ApiProperty({ example: '2026-09-01', required: false })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngayNhapHoc?: string;

  @ApiProperty({ example: '1992-08-15', required: false, description: 'Ngày sinh (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngaySinh?: string;

  @ApiProperty({ example: 'Nam', required: false, description: 'Giới tính (Nam/Nữ)' })
  @IsOptional()
  @IsString()
  gioiTinh?: string;

  @ApiProperty({ example: '001092018899', required: false, description: 'Số CCCD / Hộ chiếu' })
  @IsOptional()
  @IsString()
  soCccd?: string;

  @ApiProperty({ example: '0912345678', required: false, description: 'Số điện thoại di động' })
  @IsOptional()
  @IsString()
  soDienThoai?: string;

  @ApiProperty({ example: 'Cầu Giấy, Hà Nội', required: false, description: 'Địa chỉ cư trú' })
  @IsOptional()
  @IsString()
  diaChi?: string;

  @ApiProperty({ example: 'Thạc sĩ Khoa học Máy tính — ĐH Bách Khoa (2022)', required: false })
  @IsOptional()
  @IsString()
  bangCapDauVao?: string;

  @ApiProperty({ example: 'Tập trung toàn thời gian (03 năm / 36 tháng)', required: false })
  @IsOptional()
  @IsString()
  hinhThucDaoTao?: string;

  @ApiProperty({ example: 'Viện Công nghệ Thông tin — Nghiên cứu viên', required: false })
  @IsOptional()
  @IsString()
  coQuanCongTac?: string;

  @ApiProperty({ example: 'IELTS Academic 7.0 (Đạt chuẩn >= 6.5)', required: false })
  @IsOptional()
  @IsString()
  ngoaiNgu?: string;

  @ApiProperty({ example: 'Mô hình Ngôn ngữ Lớn (LLMs), Kiến trúc RAG', required: false })
  @IsOptional()
  @IsString()
  huongNghienCuu?: string;

  @IsOptional()
  @MaxLength(255)
  @Matches(/^\/api\/v1\/upload\/files\/[\w.-]+\.(?:png|jpe?g)$/i)
  anhDaiDienUrl?: string;
}
