import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PhanLoaiBaiBao } from '../../common/enums';

export class CreateBaiBaoDto {
  @ApiProperty({ example: 'Deep Learning Approaches for Predictive Analytics in Higher Education' })
  @IsNotEmpty({ message: 'Tiêu đề bài báo không được để trống' })
  @IsString()
  @MaxLength(300)
  tieuDe: string;

  @ApiProperty({ example: 'IEEE Transactions on Learning Technologies', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tenTapChiHoiThao?: string;

  @ApiProperty({ enum: PhanLoaiBaiBao, example: PhanLoaiBaiBao.ISI, required: false })
  @IsOptional()
  @IsEnum(PhanLoaiBaiBao)
  phanLoai?: PhanLoaiBaiBao;

  @ApiProperty({ example: '2026-05-15', required: false })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  ngayCongBo?: string;

  @ApiProperty({ example: 'https://doi.org/10.1109/TLT.2026.1234567', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileMinhChung?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  doi?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  issn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  vaiTroTacGia?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(255)
  linkBaiBao?: string;
}
