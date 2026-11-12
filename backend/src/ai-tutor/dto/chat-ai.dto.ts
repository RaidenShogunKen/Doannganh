import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatAiDto {
  @ApiProperty({ example: 'Nghiên cứu sinh cần bao nhiêu bài báo khoa học để đủ điều kiện bảo vệ luận án?' })
  @IsNotEmpty({ message: 'Câu hỏi không được để trống' })
  @IsString()
  @MaxLength(3000)
  cauHoi: string;

  @ApiProperty({ example: 'google/gemini-2.0-flash-exp:free', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  model?: string;

  @ApiProperty({ example: 'uuid-hoi-thoai', required: false })
  @IsOptional()
  @IsUUID()
  maHt?: string;
}
