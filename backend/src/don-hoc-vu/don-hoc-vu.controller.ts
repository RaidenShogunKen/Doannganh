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
import { DonHocVuService } from './don-hoc-vu.service';
import { CreateDonHocVuDto, GvhdDuyetDonDto, AdminDuyetDonDto, TuChoiDonDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VaiTro } from '../common/enums';

@ApiTags('don-hoc-vu')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('don-hoc-vu')
export class DonHocVuController {
  constructor(private readonly donHocVuService: DonHocVuService) {}

  @ApiOperation({ summary: 'Học viên nộp đơn học vụ (Bảo lưu, Gia hạn, Quay lại học)' })
  @Roles(VaiTro.HocVien)
  @Post()
  async createDon(@CurrentUser() user: any, @Body() dto: CreateDonHocVuDto) {
    return this.donHocVuService.create(user.maNd, dto);
  }

  @ApiOperation({ summary: 'Lấy danh sách đơn học vụ theo vai trò' })
  @Get()
  async getDonList(@CurrentUser() user: any) {
    return this.donHocVuService.findAll(user);
  }

  @ApiOperation({ summary: 'Xem chi tiết đơn học vụ' })
  @Get(':id')
  async getDonDetail(@Param('id') id: string, @CurrentUser() user: any) {
    return this.donHocVuService.findById(id, user);
  }

  @ApiOperation({ summary: 'Giảng viên hướng dẫn duyệt / cho ý kiến vào đơn' })
  @Roles(VaiTro.GiangVien)
  @Patch(':id/gvhd-duyet')
  async gvhdDuyet(
    @Param('id') id: string,
    @Body() dto: GvhdDuyetDonDto,
    @CurrentUser() user: any,
  ) {
    return this.donHocVuService.gvhdDuyet(id, user, dto);
  }

  @ApiOperation({ summary: 'Quản trị viên / Phòng Đào tạo SĐH ban hành quyết định phê duyệt' })
  @Roles(VaiTro.Admin)
  @Patch(':id/admin-duyet')
  async adminDuyet(
    @Param('id') id: string,
    @Body() dto: AdminDuyetDonDto,
    @CurrentUser() user: any,
  ) {
    return this.donHocVuService.adminDuyet(id, user, dto);
  }

  @ApiOperation({ summary: 'Từ chối đơn học vụ (GVHD hoặc Admin)' })
  @Roles(VaiTro.GiangVien, VaiTro.Admin)
  @Patch(':id/tu-choi')
  async tuChoi(
    @Param('id') id: string,
    @Body() dto: TuChoiDonDto,
    @CurrentUser() user: any,
  ) {
    return this.donHocVuService.tuChoi(id, user, dto);
  }
}
