import { databaseIdPattern } from '../../common/database-id';
import {
  IsArray,
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,

  IsNumber,
  Min,
  Max,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CapDanhGia, ChucDanhHoiDong, PhieuHoiDong, QuyCheBaoVe } from '../../common/enums';

export class ThanhVienDto {
  @ApiProperty({ example: 'uuid-giang-vien' })
  @IsNotEmpty()
  @Matches(databaseIdPattern)
  maGv: string;

  @ApiProperty({ enum: ChucDanhHoiDong, example: ChucDanhHoiDong.ChuTich })
  @IsEnum(ChucDanhHoiDong)
  chucDanh: ChucDanhHoiDong;

  @ApiProperty({ example: 'TrongCoSoDaoTao', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  coQuanCt?: string;
}

export class CreateHoiDongDto {
  @ApiProperty({ example: 'uuid-de-tai' })
  @IsNotEmpty()
  @Matches(databaseIdPattern)
  maDt: string;

  @ApiProperty({ enum: CapDanhGia, example: CapDanhGia.CapTruong })
  @IsEnum(CapDanhGia)
  capDanhGia: CapDanhGia;

  @ApiProperty({ example: '2026-10-15T08:30:00.000Z' })
  @IsNotEmpty()
  @IsDateString({ strict: true })
  @Matches(/(?:Z|[+-]\d{2}:\d{2})$/)
  ngayBaoVe: string;

  @ApiProperty({ example: 'Phòng Hội thảo 302, Tòa nhà A1', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  diaDiem?: string;

  @IsEnum(QuyCheBaoVe)
  quyChe: QuyCheBaoVe;

  @IsBoolean()
  daKiemTraTieuChuan: boolean;

  @ApiProperty({ type: [ThanhVienDto] })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(21)
  @ValidateNested({ each: true })
  @Type(() => ThanhVienDto)
  thanhVien: ThanhVienDto[];
}

export class ChamDiemHoiDongDto {
  @ApiProperty({ example: 2.0, description: 'Tính cấp thiết & Tổng quan (Tối đa 2.0đ)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(2.0)
  diemTieuChi1: number;

  @ApiProperty({ example: 3.0, description: 'Phương pháp & Độ tin cậy (Tối đa 3.0đ)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(3.0)
  diemTieuChi2: number;

  @ApiProperty({ example: 2.8, description: 'Đóng góp mới & Giá trị khoa học (Tối đa 3.0đ)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(3.0)
  diemTieuChi3: number;

  @ApiProperty({ example: 1.9, description: 'Trình bày & Trả lời câu hỏi (Tối đa 2.0đ)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(2.0)
  diemTieuChi4: number;

  @ApiProperty({ example: 'Luận án đạt chất lượng xuất sắc, đóng góp mới rõ ràng.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  nhanXet?: string;

  @ApiProperty({ example: 'TanThanh', required: false })
  @IsOptional()
  @IsEnum(PhieuHoiDong)
  quyetNghi?: PhieuHoiDong;
}

export class GhiNhanKetQuaDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(21)
  @ArrayUnique()
  @Matches(databaseIdPattern, { each: true })
  thanhVienCoMat: string[];

  @Matches(/^\/api\/v1\/upload\/files\/[\w.-]+$/)
  @MaxLength(255)
  bienBanUrl: string;

  @IsOptional()
  @IsBoolean()
  kienNghiBaoVeLai?: boolean;

  // Thạc sĩ theo TT 53 và đánh giá ở đơn vị chuyên môn căn cứ biên bản của cơ sở.
  @IsOptional()
  @IsEnum(PhieuHoiDong)
  quyetNghi?: PhieuHoiDong;
}
