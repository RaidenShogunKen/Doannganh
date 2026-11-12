import { databaseIdPattern } from '../../common/database-id';
import { IsIn, IsNotEmpty, IsOptional, IsString, Matches, IsNumber, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTienDoDto {
  @ApiProperty({ example: 'uuid-de-tai' })
  @IsNotEmpty()
  @Matches(databaseIdPattern)
  maDt: string;

  @ApiProperty({ example: 'Đã hoàn thành khảo sát tổng quan và xây dựng mô hình thử nghiệm ban đầu.' })
  @IsNotEmpty({ message: 'Nội dung báo cáo tiến độ không được để trống' })
  @IsString()
  @MaxLength(10000)
  noiDung: string;

  @ApiProperty({ example: 'https://storage.university.edu.vn/reports/rp-6m-01.pdf', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileBaoCaoUrl?: string;
}

export class NhanXetTienDoDto {
  @ApiProperty({ example: 'Tiến độ tốt, cần bổ sung thêm đối sánh thực nghiệm trên tập dữ liệu chuẩn.' })
  @IsNotEmpty({ message: 'Nhận xét không được để trống' })
  @IsString()
  @MaxLength(5000)
  nhanXetGvhd: string;

  @ApiProperty({ example: 9.0, required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10)
  diemSo?: number;

  @ApiProperty({ example: 'XuatSac', required: false })
  @IsOptional()
  @IsIn(['XuatSac', 'Dat', 'DatYeuCau', 'CanBoSung'])
  danhGiaKq?: 'XuatSac' | 'Dat' | 'DatYeuCau' | 'CanBoSung';
}
