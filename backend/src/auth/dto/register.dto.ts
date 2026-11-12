import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VaiTro } from '../../common/enums';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @MinLength(2)
  @MaxLength(100)
  hoTen: string;

  @ApiProperty({ example: 'sv1@example.test' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @MaxLength(100)
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  matKhau: string;

  @ApiProperty({ enum: VaiTro, example: VaiTro.HocVien, required: false })
  @IsOptional()
  @IsEnum(VaiTro, { message: 'Vai trò không hợp lệ' })
  vaiTro?: VaiTro;

  @ApiProperty({ example: '0901234567', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  sdt?: string;
}
