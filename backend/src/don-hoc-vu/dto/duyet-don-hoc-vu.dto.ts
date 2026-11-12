import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GvhdDuyetDonDto {
  @ApiProperty({
    description: 'Ý kiến nhận xét và xác nhận của Cán bộ / Giảng viên hướng dẫn',
    example: 'Đồng ý cho NCS tạm dừng học tập để tham gia chương trình trao đổi học thuật quốc tế.',
  })
  @IsString()
  @IsNotEmpty()
  yKienGvhd: string;
}

export class AdminDuyetDonDto {
  @ApiPropertyOptional({
    description: 'Số Quyết định của Hiệu trưởng / Cơ sở đào tạo',
    example: 'QĐ-SĐH-2026/89',
  })
  @IsOptional()
  @IsString()
  quyetDinhSo?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú phê duyệt',
    example: 'Phòng Đào tạo Sau Đại học đã thẩm tra đủ điều kiện và trình Hiệu trưởng ký duyệt.',
  })
  @IsOptional()
  @IsString()
  ghiChu?: string;
}

export class TuChoiDonDto {
  @ApiProperty({
    description: 'Lý do từ chối đơn học vụ',
    example: 'Chưa đủ điều kiện tạm dừng hoặc chưa có minh chứng hợp lệ.',
  })
  @IsString()
  @IsNotEmpty()
  lyDoTuChoi: string;
}
