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
import { DeTaiService } from './de-tai.service';
import { CreateDeTaiDto, DuyetMinhChungBaoVeDto, HanNopLuanAnDto, NopMinhChungBaoVeDto, UpdateTrangThaiDeTaiDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VaiTro } from '../common/enums';
import { DefenseReadinessService } from './defense-readiness.service';

@ApiTags('de-tai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('de-tai')
export class DeTaiController {
  constructor(
    private readonly deTaiService: DeTaiService,
    private readonly readiness: DefenseReadinessService,
  ) {}

  @ApiOperation({ summary: 'Học viên đăng ký đề tài' })
  @Roles(VaiTro.HocVien)
  @Post()
  async createDeTai(@CurrentUser() user: any, @Body() dto: CreateDeTaiDto) {
    return this.deTaiService.create(user.maNd, dto);
  }

  @ApiOperation({ summary: 'Lấy danh sách đề tài (tự động phân quyền theo vai trò)' })
  @Get()
  async getDeTaiList(@CurrentUser() user: any) {
    return this.deTaiService.findAll(user);
  }

  @ApiOperation({ summary: 'Xem thông tin chi tiết đề tài' })
  @Get(':id')
  async getDeTaiDetail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.deTaiService.findById(id, user);
  }

  @ApiOperation({ summary: 'Duyệt / Từ chối đề tài (GVHD hoặc Admin)' })
  @Roles(VaiTro.GiangVien, VaiTro.Admin)
  @Patch(':id/trang-thai')
  async updateTrangThai(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrangThaiDeTaiDto,
    @CurrentUser() user: any,
  ) {
    return this.deTaiService.updateTrangThai(id, dto, user);
  }

  @ApiOperation({ summary: 'Xác nhận đủ điều kiện bảo vệ - UC-08 (GVHD hoặc Admin)' })
  @Roles(VaiTro.GiangVien, VaiTro.Admin)
  @Patch(':id/xac-nhan-du-dieu-kien')
  async xacNhanDuDieuKien(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.deTaiService.xacNhanDuDieuKien(id, user);
  }

  @Get(':id/dieu-kien-bao-ve')
  getChecklist(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.readiness.getChecklist(id, user);
  }

  @Roles(VaiTro.Admin)
  @Patch(':id/han-nop-luan-an')
  capNhatHanNop(@Param('id', ParseUUIDPipe) id: string, @Body() dto: HanNopLuanAnDto) {
    return this.deTaiService.capNhatHanNop(id, dto.hanNopLuanAn);
  }

  @Roles(VaiTro.HocVien, VaiTro.Admin)
  @Post(':id/minh-chung-bao-ve')
  submitEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: NopMinhChungBaoVeDto,
    @CurrentUser() user: any,
  ) {
    return this.readiness.submit(id, dto, user);
  }

  @Roles(VaiTro.Admin)
  @Patch(':id/minh-chung-bao-ve')
  reviewEvidence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuyetMinhChungBaoVeDto,
    @CurrentUser() user: any,
  ) {
    return this.readiness.review(id, dto, user);
  }
}
