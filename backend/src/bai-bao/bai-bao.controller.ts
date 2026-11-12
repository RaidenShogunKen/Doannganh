import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BaiBaoService } from './bai-bao.service';
import { CreateBaiBaoDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VaiTro } from '../common/enums';

@ApiTags('bai-bao')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class BaiBaoController {
  constructor(private readonly baiBaoService: BaiBaoService) {}

  @ApiOperation({ summary: 'Học viên nộp minh chứng bài báo khoa học' })
  @Roles(VaiTro.HocVien)
  @Post('bai-bao')
  async createBaiBao(@CurrentUser() user: any, @Body() dto: CreateBaiBaoDto) {
    return this.baiBaoService.create(user.maNd, dto);
  }

  @ApiOperation({ summary: 'Xem danh sách bài báo khoa học của học viên' })
  @Get('hoc-vien/:maHv/bai-bao')
  async getBaiBaoByHocVien(@Param('maHv') maHv: string, @CurrentUser() user: any) {
    const targetHv = user.vaiTro === VaiTro.HocVien ? user.maNd : maHv;
    return this.baiBaoService.listByHocVien(targetHv, user);
  }
}
