import { databaseIdPattern } from '../../common/database-id';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoaiHocPhan } from '../../common/enums';

export class CreateMonHocDto {
  @ApiProperty({ example: 'Phương pháp nghiên cứu khoa học nâng cao' })
  @IsNotEmpty({ message: 'Tên môn học không được để trống' })
  @IsString()
  @MaxLength(150)
  tenMh: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  soTinChi: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  maCn?: number;

  @ApiProperty({ enum: LoaiHocPhan, example: LoaiHocPhan.BatBuoc })
  @IsEnum(LoaiHocPhan)
  loaiHp: LoaiHocPhan;
}

export class DangKyMonHocDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  maMh: number;

  @ApiProperty({ example: 'HK1_2026-2027' })
  @IsNotEmpty({ message: 'Học kỳ/năm học không được để trống' })
  @Matches(/^HK[1-3](?:_\d{4}-\d{4}| \(\d{4}-\d{4}\))$/)
  hocKyNamHoc: string;
}

export class CapNhatDiemDto extends DangKyMonHocDto {
  @ApiProperty({ example: 'uuid-hoc-vien' })
  @IsNotEmpty()
  @Matches(databaseIdPattern)
  maHv: string;

  @ApiProperty({ example: 8.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  diem: number;
}

export class PhanCongGiangDayDto extends DangKyMonHocDto {
  @Matches(databaseIdPattern)
  maGv: string;
}
