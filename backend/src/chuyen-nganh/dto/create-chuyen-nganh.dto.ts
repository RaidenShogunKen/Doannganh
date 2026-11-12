import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TrinhDo } from '../../common/enums';

export class CreateChuyenNganhDto {
  @ApiProperty({ example: 'Khoa học máy tính' })
  @IsNotEmpty({ message: 'Tên chuyên ngành không được để trống' })
  @IsString()
  tenCn: string;

  @ApiProperty({ enum: TrinhDo, example: TrinhDo.TienSi })
  @IsEnum(TrinhDo, { message: 'Trình độ đào tạo không hợp lệ' })
  trinhDoDaoTao: TrinhDo;

  @ApiProperty({ example: 90, required: false })
  @IsOptional()
  @IsInt()
  soTinChiCt?: number;
}

export class CauHinhHocPhanDto {
  @IsInt()
  @Min(0)
  @Max(300)
  soTinChiHocPhan: number;
}
