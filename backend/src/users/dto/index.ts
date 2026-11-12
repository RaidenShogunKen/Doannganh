import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
  ArrayMaxSize,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TrinhDo, VaiTro, TrangThaiTaiKhoan } from '../../common/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  hoTen: string;

  @ApiProperty({ example: 'ncs.moi@example.test' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ enum: VaiTro })
  @IsEnum(VaiTro)
  vaiTro: VaiTro;

  @ApiPropertyOptional({ description: 'Mật khẩu khởi tạo. Bỏ trống để sinh ngẫu nhiên.' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  matKhau?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(15)
  sdt?: string;

  @ApiPropertyOptional({ example: 'NCS2026001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mshv?: string;

  @ApiPropertyOptional({ enum: TrinhDo })
  @IsOptional()
  @IsEnum(TrinhDo)
  trinhDo?: TrinhDo;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  maChuyenNganh?: number;

  @ApiPropertyOptional({ example: 'Khóa K26 (2025 - 2029)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  khoaHoc?: string;

  @ApiPropertyOptional({ example: 'Giáo sư' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  hocHam?: string;

  @ApiPropertyOptional({ example: 'Tiến sĩ khoa học' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  hocVi?: string;

  @ApiPropertyOptional({ example: 'Khoa Công nghệ Thông tin' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  chuyenMon?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  hoTen?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(15)
  sdt?: string;

  @ApiPropertyOptional({ enum: VaiTro })
  @IsOptional()
  @IsEnum(VaiTro)
  vaiTro?: VaiTro;

  @ApiPropertyOptional({ enum: TrangThaiTaiKhoan })
  @IsOptional()
  @IsEnum(TrangThaiTaiKhoan)
  trangThai?: TrangThaiTaiKhoan;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mshv?: string;

  @ApiPropertyOptional({ enum: TrinhDo })
  @IsOptional()
  @IsEnum(TrinhDo)
  trinhDo?: TrinhDo;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  maChuyenNganh?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  khoaHoc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  hocHam?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  hocVi?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  chuyenMon?: string;
}

export class ResetPasswordDto {
  @ApiPropertyOptional({ description: 'Mật khẩu mới. Bỏ trống để sinh ngẫu nhiên.' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}

export class ImportUsersDto {
  @ApiProperty({ type: [CreateUserDto], description: 'Danh sách tài khoản nhập từ CSV/Excel (tối đa 500 dòng)' })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  danhSach: CreateUserDto[];
}

export class BroadcastDto {
  @ApiProperty({ example: 'Lịch nộp báo cáo tiến độ Kỳ 2' })
  @IsString()
  @MaxLength(200)
  tieuDe: string;

  @ApiProperty()
  @IsString()
  noiDung: string;

  @ApiProperty({ enum: ['ALL', ...Object.values(VaiTro)], example: 'HocVien' })
  @IsString()
  doiTuong: 'ALL' | VaiTro;

  @ApiPropertyOptional({ example: '/de-tai' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  duongDan?: string;
}
