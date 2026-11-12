import { Equals, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class XacNhanNhapHocDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  mshv?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maChuyenNganh?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  khoaHoc?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngayNhapHoc?: string;
}

export class GhiNhanTotNghiepDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  soQuyetDinh: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngayQuyetDinh: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileUrl: string;

  @Equals(true)
  daDoiChieu: boolean;
}
