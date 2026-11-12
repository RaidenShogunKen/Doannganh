import { databaseIdPattern } from '../../common/database-id';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { LoaiDonHocVu } from '../../common/enums';

export class CreateDonHocVuDto {
  @ApiPropertyOptional({ description: 'Mã đề tài (nếu có)' })
  @IsOptional()
  @Matches(databaseIdPattern)
  maDt?: string;

  @ApiProperty({
    description: 'Loại đơn học vụ: BaoLuu, GiaHan, QuayLaiHoc',
    enum: LoaiDonHocVu,
    example: LoaiDonHocVu.BaoLuu,
  })
  @IsEnum(LoaiDonHocVu)
  loaiDon: LoaiDonHocVu;

  @ApiProperty({
    description: 'Số tháng xin bảo lưu / gia hạn (Thường là 6 hoặc 12 tháng)',
    example: 6,
    default: 6,
  })
  @IsInt()
  @Min(0)
  @Max(24)
  soThang: number;

  @ApiProperty({
    description: 'Lý do chính đáng kèm minh chứng',
    example: 'Nghiên cứu sinh trúng tuyển học bổng trao đổi nghiên cứu 6 tháng tại Viện Max Planck (Đức).',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  lyDo: string;

  @ApiPropertyOptional({
    description: 'Đường dẫn file đơn hoặc quyết định / minh chứng đính kèm',
  })
  @IsOptional()
  @IsString()
  fileDinhKemUrl?: string;
}
