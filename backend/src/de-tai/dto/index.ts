import { databaseIdPattern } from '../../common/database-id';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoaiMinhChungBaoVe, TrangThaiDeTai, TrangThaiMinhChung } from '../../common/enums';

export class CreateDeTaiDto {
  @ApiProperty({ example: 'Nghiên cứu ứng dụng Học sâu trong phân tích dữ liệu y tế' })
  @IsNotEmpty({ message: 'Tên đề tài không được để trống' })
  @IsString()
  @MaxLength(300)
  tenDt: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  tenDtEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15000)
  thuyetMinh?: string;

  @IsOptional()
  @Matches(/^\/api\/v1\/upload\/files\/[\w.-]+$/)
  @MaxLength(255)
  fileDeCuong?: string;

  @ApiProperty({ example: 'uuid-gvhd-1' })
  @IsNotEmpty({ message: 'Giảng viên hướng dẫn 1 không được để trống' })
  @Matches(databaseIdPattern)
  maGvhd: string;

  @ApiProperty({ example: 'uuid-gvhd-2', required: false })
  @IsOptional()
  @Matches(databaseIdPattern)
  maGvhd2?: string;

  @ApiProperty({ example: '2027-06-30', required: false })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngayDuKienBaoVe?: string;
}

export class NopMinhChungBaoVeDto {
  @IsEnum(LoaiMinhChungBaoVe)
  loai: LoaiMinhChungBaoVe;

  @Matches(/^\/api\/v1\/upload\/files\/[\w.-]+$/)
  @MaxLength(255)
  fileUrl: string;
}

export class DuyetMinhChungBaoVeDto {
  @IsEnum(LoaiMinhChungBaoVe)
  loai: LoaiMinhChungBaoVe;

  @IsEnum(TrangThaiMinhChung)
  trangThai: TrangThaiMinhChung;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  ghiChu: string;
}

export class UpdateTrangThaiDeTaiDto {
  @ApiProperty({ enum: TrangThaiDeTai, example: TrangThaiDeTai.DaDuyet })
  @IsEnum(TrangThaiDeTai)
  trangThai: TrangThaiDeTai;
}

export class HanNopLuanAnDto {
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  hanNopLuanAn: string;
}
