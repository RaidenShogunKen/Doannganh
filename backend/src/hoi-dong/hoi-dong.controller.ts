import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HoiDongService } from './hoi-dong.service';
import { CreateHoiDongDto, GhiNhanKetQuaDto, ChamDiemHoiDongDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VaiTro } from '../common/enums';

@ApiTags('hoi-dong')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hoi-dong')
export class HoiDongController {
  constructor(private readonly hoiDongService: HoiDongService) {}

  @ApiOperation({ summary: 'Thành lập hội đồng bảo vệ - UC-14 (Chỉ Admin)' })
  @Roles(VaiTro.Admin)
  @Post()
  async createHoiDong(@Body() dto: CreateHoiDongDto, @CurrentUser() user: any) {
    return this.hoiDongService.create(dto, user);
  }

  @ApiOperation({ summary: 'Lấy danh sách hội đồng bảo vệ' })
  @Roles(VaiTro.Admin, VaiTro.GiangVien, VaiTro.HocVien)
  @Get()
  async getHoiDongList(@CurrentUser() user: any) {
    return this.hoiDongService.findAll(user);
  }

  @ApiOperation({ summary: 'Xem chi tiết thông tin và thành viên hội đồng' })
  @Get(':id')
  async getHoiDongDetail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.hoiDongService.findById(id, user);
  }

  @ApiOperation({ summary: 'Chấm điểm 4 tiêu chí đánh giá luận án (Thành viên Hội đồng / Admin)' })
  @Roles(VaiTro.GiangVien)
  @Post(':id/cham-diem')
  async chamDiem(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: ChamDiemHoiDongDto,
  ) {
    return this.hoiDongService.chamDiem(id, user, dto);
  }

  @ApiOperation({ summary: 'Ghi nhận kết quả bảo vệ hội đồng (Chỉ Admin)' })
  @Roles(VaiTro.Admin)
  @Patch(':id/ket-qua')
  async ghiNhanKetQua(@Param('id', ParseUUIDPipe) id: string, @Body() dto: GhiNhanKetQuaDto, @CurrentUser() user: any) {
    return this.hoiDongService.ghiNhanKetQua(id, dto, user);
  }
}
