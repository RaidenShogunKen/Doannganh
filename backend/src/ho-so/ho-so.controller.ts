import {
  Controller,
  Put,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HoSoService, NopDonTuyenSinhDto } from './ho-so.service';
import { HoSoHocVienDto } from './dto/ho-so-hoc-vien.dto';
import { HoSoGiangVienDto } from './dto/ho-so-giang-vien.dto';
import { GhiNhanTotNghiepDto, XacNhanNhapHocDto } from './dto/quyet-dinh-hoc-vu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VaiTro, TrangThaiDonTuyenSinh } from '../common/enums';

@ApiTags('ho-so')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ho-so')
export class HoSoController {
  constructor(private readonly hoSoService: HoSoService) {}

  @ApiOperation({ summary: 'Học viên tự hoàn thiện/cập nhật hồ sơ cá nhân' })
  @Roles(VaiTro.HocVien, VaiTro.Admin)
  @Put('hoc-vien')
  async hoanThienHocVien(@CurrentUser() user: any, @Body() dto: HoSoHocVienDto) {
    return this.hoSoService.hoanThienHocVien(user.maNd, dto, user.vaiTro);
  }

  @ApiOperation({ summary: 'Giảng viên tự hoàn thiện/cập nhật hồ sơ cá nhân' })
  @Roles(VaiTro.GiangVien, VaiTro.Admin)
  @Put('giang-vien')
  async hoanThienGiangVien(@CurrentUser() user: any, @Body() dto: HoSoGiangVienDto) {
    return this.hoSoService.hoanThienGiangVien(user.maNd, dto, user.vaiTro);
  }

  @ApiOperation({ summary: 'Lấy thông tin hồ sơ học viên của tài khoản hiện tại' })
  @Roles(VaiTro.HocVien)
  @Get('hoc-vien/toi')
  async getHoSoHocVienCuaToi(@CurrentUser() user: any) {
    return this.hoSoService.getHoSoHocVien(user.maNd);
  }

  @ApiOperation({ summary: 'Lấy thông tin hồ sơ giảng viên của tài khoản hiện tại' })
  @Roles(VaiTro.GiangVien)
  @Get('giang-vien/toi')
  async getHoSoGiangVienCuaToi(@CurrentUser() user: any) {
    return this.hoSoService.getHoSoGiangVien(user.maNd);
  }

  @ApiOperation({ summary: 'Nộp đơn tuyển sinh (ThacSi/TienSi)' })
  @Roles(VaiTro.HocVien)
  @Post('don-tuyen-sinh')
  async nopDon(@CurrentUser() user: any, @Body() dto: NopDonTuyenSinhDto) {
    return this.hoSoService.nopDonTuyenSinh(user.maNd, dto);
  }

  @ApiOperation({ summary: 'Danh sách đơn tuyển sinh (Admin: tất cả | HocVien: của mình)' })
  @ApiQuery({ name: 'trangThai', required: false, enum: TrangThaiDonTuyenSinh })
  @Get('don-tuyen-sinh')
  async getDanhSachDon(
    @CurrentUser() user: any,
    @Query('trangThai') trangThai?: TrangThaiDonTuyenSinh,
  ) {
    return this.hoSoService.getDanhSachDon(user.maNd, user.vaiTro, trangThai);
  }

  @ApiOperation({ summary: 'Chi tiết một đơn tuyển sinh' })
  @Get('don-tuyen-sinh/:id')
  async getDonById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.hoSoService.getDonById(id, user.maNd, user.vaiTro);
  }

  @ApiOperation({ summary: '[Admin] Phê duyệt đơn tuyển sinh (+ upload file quyết định)' })
  @Roles(VaiTro.Admin)
  @Patch('don-tuyen-sinh/:id/duyet')
  async duyetDon(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { fileQuyetDinhUrl?: string; ghiChuAdmin?: string },
  ) {
    return this.hoSoService.duyetDon(id, user.maNd, body.fileQuyetDinhUrl, body.ghiChuAdmin);
  }

  @ApiOperation({ summary: '[Admin] Từ chối đơn tuyển sinh kèm lý do' })
  @Roles(VaiTro.Admin)
  @Patch('don-tuyen-sinh/:id/tu-choi')
  async tuChoiDon(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { lyDo: string },
  ) {
    return this.hoSoService.tuChoiDon(id, user.maNd, body.lyDo);
  }

  @ApiOperation({ summary: '[Admin] Xác nhận nhập học chính thức' })
  @Roles(VaiTro.Admin)
  @Patch('don-tuyen-sinh/:id/nhap-hoc')
  async nhapHoc(@Param('id') id: string, @Body() dto: XacNhanNhapHocDto) {
    return this.hoSoService.xacNhanNhapHoc(id, dto);
  }

  @ApiOperation({ summary: 'Ghi nhận quyết định công nhận tốt nghiệp đã ban hành' })
  @Roles(VaiTro.Admin)
  @Post('tot-nghiep/:maDt')
  async ghiNhanTotNghiep(@Param('maDt') maDt: string, @Body() dto: GhiNhanTotNghiepDto, @CurrentUser() user: { maNd: string }) {
    return this.hoSoService.ghiNhanTotNghiep(maDt, dto, user.maNd);
  }

  @ApiOperation({ summary: 'Đối chiếu SHA-256 của tệp quyết định với giá trị lưu khi duyệt' })
  @Get('don-tuyen-sinh/:id/verify-signature')
  async verifySignature(@Param('id') id: string, @CurrentUser() user: any) {
    const don = await this.hoSoService.getDonById(id, user.maNd, user.vaiTro);
    const isValid = await this.hoSoService.verifyQuyetDinhHash(don);
    return {
      maDon: don.maDon,
      isValid,
      hashQuyetDinh: don.hashQuyetDinh,
      ngayKyDuyet: don.ngayKyDuyet,
      algorithm: 'SHA-256',
      thongBao: isValid
        ? 'Nội dung tệp khớp mã SHA-256 được lưu khi phê duyệt.'
        : 'Chưa xác minh được nội dung tệp theo mã SHA-256 đã lưu.',
    };
  }
}
