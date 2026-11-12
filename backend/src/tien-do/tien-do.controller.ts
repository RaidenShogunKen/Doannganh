import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TienDoService } from './tien-do.service';
import { CreateTienDoDto, NhanXetTienDoDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VaiTro } from '../common/enums';

@ApiTags('tien-do')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class TienDoController {
  constructor(private readonly tienDoService: TienDoService) {}

  @ApiOperation({ summary: 'Học viên nộp báo cáo tiến độ định kỳ' })
  @Roles(VaiTro.HocVien)
  @Post('tien-do')
  async createTienDo(@CurrentUser() user: any, @Body() dto: CreateTienDoDto) {
    return this.tienDoService.create(user.maNd, dto);
  }

  @ApiOperation({ summary: 'Xem danh sách báo cáo tiến độ theo đề tài' })
  @Get('de-tai/:maDt/tien-do')
  async getTienDoByDeTai(@Param('maDt') maDt: string, @CurrentUser() user: any) {
    return this.tienDoService.listByDeTai(maDt, user);
  }

  @ApiOperation({ summary: 'GVHD hoặc Admin ghi nhận xét báo cáo tiến độ' })
  @Roles(VaiTro.GiangVien, VaiTro.Admin)
  @Patch('tien-do/:id/nhan-xet')
  async nhanXetTienDo(
    @Param('id') id: string,
    @Body() dto: NhanXetTienDoDto,
    @CurrentUser() user: any,
  ) {
    return this.tienDoService.nhanXet(id, dto, user);
  }
}
