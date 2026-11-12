import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService, AuditActor } from './users.service';
import { NguoiDung } from './entities/nguoi-dung.entity';
import { NotificationService } from '../notification/notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { KetQuaThaoTac, LoaiThongBao, VaiTro } from '../common/enums';
import {
  BroadcastDto,
  CreateUserDto,
  ImportUsersDto,
  ResetPasswordDto,
  UpdateUserDto,
} from './dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly notificationService: NotificationService,
    @InjectRepository(NguoiDung)
    private readonly nguoiDungRepo: Repository<NguoiDung>,
  ) {}

  private actor(user: any, ip: string): AuditActor {
    return { maNd: user?.maNd, hoTen: user?.hoTen, vaiTro: user?.vaiTro, ip };
  }

  @ApiOperation({ summary: 'Danh sách người dùng kèm thông tin học vụ (Chỉ Admin)' })
  @Roles(VaiTro.Admin)
  @Get()
  async getAllUsers() {
    return this.usersService.findAllExtended();
  }

  @ApiOperation({
    summary: 'Danh mục giảng viên đủ điều kiện hướng dẫn (cho các form chọn GVHD / thành viên hội đồng)',
  })
  @Roles(VaiTro.Admin, VaiTro.GiangVien, VaiTro.HocVien)
  @Get('giang-vien')
  async getGiangVienList() {
    return this.usersService.findGiangVienForSelect();
  }

  @ApiOperation({ summary: 'Thống kê nhân sự toàn trường (Chỉ Admin)' })
  @Roles(VaiTro.Admin)
  @Get('thong-ke')
  async getThongKe() {
    return this.usersService.getThongKe();
  }

  @ApiOperation({ summary: 'Nhật ký thao tác & bảo mật (Audit Trail — Chỉ Admin)' })
  @Roles(VaiTro.Admin)
  @Get('nhat-ky')
  async getNhatKy(@Query('limit') limit?: string) {
    return this.usersService.getNhatKy(limit ? parseInt(limit, 10) : 100);
  }

  @ApiOperation({ summary: 'Tạo tài khoản mới (Chỉ Admin)' })
  @Roles(VaiTro.Admin)
  @Post()
  async createUser(@CurrentUser() user: any, @Ip() ip: string, @Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto, this.actor(user, ip));
  }

  @ApiOperation({ summary: 'Nhập khẩu danh sách tài khoản từ CSV/Excel (Chỉ Admin)' })
  @Roles(VaiTro.Admin)
  @Post('import')
  async importUsers(@CurrentUser() user: any, @Ip() ip: string, @Body() dto: ImportUsersDto) {
    return this.usersService.importUsers(dto.danhSach, this.actor(user, ip));
  }

  @ApiOperation({ summary: 'Phát thông báo học vụ tới nhóm đối tượng (Chỉ Admin)' })
  @Roles(VaiTro.Admin)
  @Post('broadcast')
  async broadcast(@CurrentUser() user: any, @Ip() ip: string, @Body() dto: BroadcastDto) {
    const where = dto.doiTuong === 'ALL' ? {} : { vaiTro: dto.doiTuong as VaiTro };
    const nguoiNhan = await this.nguoiDungRepo.find({ where, select: ['maNd'] });

    await this.notificationService.broadcast(
      nguoiNhan.map((n) => n.maNd),
      {
        loaiTb: LoaiThongBao.HeThong,
        tieuDe: dto.tieuDe,
        noiDung: dto.noiDung,
        duongDan: dto.duongDan,
      },
    );

    const nhan =
      dto.doiTuong === 'ALL'
        ? 'Toàn thể người dùng'
        : dto.doiTuong === VaiTro.HocVien
          ? 'Học viên / Nghiên cứu sinh'
          : dto.doiTuong === VaiTro.GiangVien
            ? 'Giảng viên hướng dẫn'
            : 'Quản trị viên';

    await this.usersService.ghiNhatKy(
      this.actor(user, ip),
      `Phát thông báo học vụ tới [${nhan}]: "${dto.tieuDe}" (${nguoiNhan.length} người nhận)`,
      KetQuaThaoTac.Info,
    );

    return { success: true, soNguoiNhan: nguoiNhan.length, doiTuong: nhan };
  }

  @ApiOperation({ summary: 'Cập nhật thông tin người dùng (Chỉ Admin)' })
  @Roles(VaiTro.Admin)
  @Patch(':id')
  async updateUser(
    @CurrentUser() user: any,
    @Ip() ip: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto, this.actor(user, ip));
  }

  @ApiOperation({ summary: 'Khóa / Mở khóa tài khoản (Chỉ Admin)' })
  @Roles(VaiTro.Admin)
  @Patch(':id/trang-thai')
  async toggleTrangThai(@CurrentUser() user: any, @Ip() ip: string, @Param('id') id: string) {
    return this.usersService.toggleTrangThai(id, this.actor(user, ip));
  }

  @ApiOperation({ summary: 'Cấp lại mật khẩu (Chỉ Admin)' })
  @Roles(VaiTro.Admin)
  @Post(':id/reset-password')
  async resetPassword(
    @CurrentUser() user: any,
    @Ip() ip: string,
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(id, dto.newPassword, this.actor(user, ip));
  }
}
