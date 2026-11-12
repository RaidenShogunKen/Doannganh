import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MonHocService } from './mon-hoc.service';
import { CreateMonHocDto, DangKyMonHocDto, CapNhatDiemDto, PhanCongGiangDayDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VaiTro } from '../common/enums';

@ApiTags('mon-hoc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mon-hoc')
export class MonHocController {
  constructor(private readonly monHocService: MonHocService) {}

  @ApiOperation({ summary: 'Lấy danh sách tất cả môn học' })
  @Get()
  async getAllMonHoc(@Query('maCn') maCn?: number) {
    return this.monHocService.findAllMonHoc(maCn ? Number(maCn) : undefined);
  }

  @ApiOperation({ summary: 'Thêm môn học mới (Chỉ Admin)' })
  @Roles(VaiTro.Admin)
  @Post()
  async createMonHoc(@Body() dto: CreateMonHocDto) {
    return this.monHocService.createMonHoc(dto);
  }

  @Roles(VaiTro.GiangVien, VaiTro.Admin)
  @Get('phan-cong')
  danhSachPhanCong(@CurrentUser() user: any) {
    return this.monHocService.danhSachPhanCong(user);
  }

  @Roles(VaiTro.Admin)
  @Post('phan-cong')
  phanCong(@Body() dto: PhanCongGiangDayDto) {
    return this.monHocService.phanCongGiangDay(dto);
  }

  @Roles(VaiTro.Admin)
  @Delete('phan-cong')
  huyPhanCong(@Body() dto: PhanCongGiangDayDto) {
    return this.monHocService.huyPhanCongGiangDay(dto);
  }

  @Roles(VaiTro.GiangVien, VaiTro.Admin)
  @Get(':maMh/:hocKy/danh-sach-cham-diem')
  danhSachChamDiem(
    @Param('maMh', ParseIntPipe) maMh: number,
    @Param('hocKy') hocKy: string,
    @CurrentUser() user: any,
  ) {
    return this.monHocService.danhSachChamDiem(maMh, hocKy, user);
  }

  @ApiOperation({ summary: 'Học viên đăng ký học phần' })
  @Roles(VaiTro.HocVien)
  @Post('dang-ky')
  async dangKyHocPhan(@CurrentUser() user: any, @Body() dto: DangKyMonHocDto) {
    return this.monHocService.dangKyHocPhan(user.maNd, dto);
  }

  @ApiOperation({ summary: 'Xem danh sách học phần đã đăng ký và bảng điểm của học viên' })
  @Get('dang-ky/:maHv')
  async getDangKyByHocVien(@Param('maHv') maHv: string, @CurrentUser() user: any) {
    const targetHv = user.vaiTro === VaiTro.HocVien ? user.maNd : maHv;
    await this.monHocService.kiemTraQuyenXemBangDiem(targetHv, user);
    return this.monHocService.listDangKyByHocVien(targetHv);
  }

  @ApiOperation({ summary: 'Giảng viên hoặc Admin cập nhật/nhập điểm môn học' })
  @Roles(VaiTro.GiangVien, VaiTro.Admin)
  @Patch('diem')
  async capNhatDiem(@Body() dto: CapNhatDiemDto, @CurrentUser() user: any) {
    return this.monHocService.capNhatDiem(dto, user);
  }

  @ApiOperation({ summary: 'Học viên hủy đăng ký học phần' })
  @Roles(VaiTro.HocVien)
  @Delete('dang-ky/:maMh/:hocKy')
  async huyDangKy(
    @CurrentUser() user: any,
    @Param('maMh') maMh: number,
    @Param('hocKy') hocKy: string,
  ) {
    return this.monHocService.huyDangKy(user.maNd, Number(maMh), hocKy);
  }

  @ApiOperation({ summary: 'Lấy GPA và bảng điểm tổng hợp của học viên (thang 10 + 4.0)' })
  @Get('gpa/:maHv')
  async getGpa(@Param('maHv') maHv: string, @CurrentUser() user: any) {
    const targetHv = user.vaiTro === VaiTro.HocVien ? user.maNd : maHv;
    await this.monHocService.kiemTraQuyenXemBangDiem(targetHv, user);
    return this.monHocService.tinhGpaHocVien(targetHv);
  }

  @ApiOperation({ summary: 'Kiểm tra điều kiện tốt nghiệp của học viên (cảnh báo tự động)' })
  @Get('dieu-kien-tot-nghiep/:maHv')
  async getDieuKienTotNghiep(@Param('maHv') maHv: string, @CurrentUser() user: any) {
    const targetHv = user.vaiTro === VaiTro.HocVien ? user.maNd : maHv;
    await this.monHocService.kiemTraQuyenXemBangDiem(targetHv, user);
    return this.monHocService.kiemTraDieuKienTotNghiep(targetHv);
  }
}
