import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HoSoGiangVienDto {
  @ApiProperty({ example: 'Phó Giáo sư', required: false })
  @IsOptional()
  @IsString()
  hocHam?: string;

  @ApiProperty({ example: 'Tiến sĩ', required: false })
  @IsOptional()
  @IsString()
  hocVi?: string;

  @ApiProperty({ example: 'Khoa học máy tính & Trí tuệ nhân tạo', required: false })
  @IsOptional()
  @IsString()
  chuyenMon?: string;
}
