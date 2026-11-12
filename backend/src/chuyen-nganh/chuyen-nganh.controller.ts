import { Controller, Get, Post, Body, UseGuards, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChuyenNganhService } from './chuyen-nganh.service';
import { CauHinhHocPhanDto, CreateChuyenNganhDto } from './dto/create-chuyen-nganh.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { VaiTro } from '../common/enums';

@ApiTags('chuyen-nganh')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chuyen-nganh')
export class ChuyenNganhController {
  constructor(private readonly chuyenNganhService: ChuyenNganhService) {}

  @ApiOperation({ summary: 'Lấy danh sách tất cả chuyên ngành' })
  @Get()
  async getAll() {
    return this.chuyenNganhService.findAll();
  }

  @ApiOperation({ summary: 'Tạo chuyên ngành mới (Chỉ Admin)' })
  @Roles(VaiTro.Admin)
  @Post()
  async create(@Body() dto: CreateChuyenNganhDto) {
    return this.chuyenNganhService.create(dto);
  }

  @Roles(VaiTro.Admin)
  @Patch(':id/hoc-phan')
  cauHinhHocPhan(@Param('id', ParseIntPipe) maCn: number, @Body() dto: CauHinhHocPhanDto) {
    return this.chuyenNganhService.cauHinhHocPhan(maCn, dto.soTinChiHocPhan);
  }
}
