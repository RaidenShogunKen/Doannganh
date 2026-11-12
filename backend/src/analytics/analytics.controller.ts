import { Controller, Get, Post, Body, UseGuards, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { PlagiarismService } from './plagiarism.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VaiTro } from '../common/enums';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class PlagiarismCheckDto {
  @IsOptional()
  @IsString()
  @MaxLength(250000)
  text?: string;
  @IsOptional()
  @IsString()
  @MaxLength(250000)
  noiDung?: string;
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tieuDe?: string;
  @IsOptional()
  @IsBoolean()
  queryCrossref?: boolean;
}

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly plagiarismService: PlagiarismService,
  ) {}

  @ApiOperation({ summary: 'Lấy các chỉ số thống kê tổng quan toàn trường (Overview)' })
  @Get('overview')
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @ApiOperation({ summary: 'Lấy danh sách cảnh báo sớm nguy cơ quá hạn đào tạo (SLA 72 tháng)' })
  @Roles(VaiTro.Admin, VaiTro.GiangVien)
  @Get('sla-warning')
  async getSlaWarnings(@CurrentUser() user: { maNd: string; vaiTro: VaiTro }) {
    return this.analyticsService.getSlaWarnings(user.vaiTro === VaiTro.GiangVien ? user.maNd : undefined);
  }

  @ApiOperation({ summary: 'Lấy danh sách cảnh báo sớm nguy cơ quá hạn đào tạo (SLA 72 tháng - Alias)' })
  @Roles(VaiTro.Admin, VaiTro.GiangVien)
  @Get('sla-warnings')
  async getSlaWarningsAlias(@CurrentUser() user: { maNd: string; vaiTro: VaiTro }) {
    return this.getSlaWarnings(user);
  }

  @ApiOperation({ summary: 'Mô hình dự báo đa biến nguy cơ quá hạn đào tạo và chỉ số rủi ro học vụ (Predictive Risk Score 0-100)' })
  @Roles(VaiTro.Admin)
  @Get('predictive-risk')
  async getPredictiveRisk() {
    return this.analyticsService.getPredictiveRiskAnalysis();
  }

  @ApiOperation({ summary: 'Phân tích tương quan Pearson giữa điểm đánh giá tiến độ định kỳ và điểm bảo vệ Hội đồng' })
  @Roles(VaiTro.Admin)
  @Get('progress-defense-correlation')
  async getProgressDefenseCorrelation() {
    return this.analyticsService.getProgressDefenseCorrelation();
  }

  @ApiOperation({ summary: 'Phân tích năng suất công bố khoa học và tỷ lệ bài báo ISI/Scopus' })
  @Get('publication-productivity')
  async getPublicationProductivity() {
    return this.analyticsService.getPublicationProductivity();
  }

  @ApiOperation({ summary: 'Thống kê xu hướng công bố bài báo khoa học qua các năm' })
  @Get('publications')
  async getPublicationTrends() {
    return this.analyticsService.getPublicationTrends();
  }

  @ApiOperation({ summary: 'Thống kê phân bố đề tài theo chuyên ngành đào tạo' })
  @Get('majors')
  async getMajorsDistribution() {
    return this.analyticsService.getMajorsDistribution();
  }

  @ApiOperation({ summary: 'Thống kê tải và định mức hướng dẫn của Giảng viên' })
  @Get('workload')
  async getSupervisorWorkload() {
    return this.analyticsService.getSupervisorWorkload();
  }

  @ApiOperation({ summary: 'Đối sánh với tiêu đề nội bộ và tùy chọn tra cứu tiêu đề qua Crossref' })
  @ApiBody({ type: PlagiarismCheckDto })
  @Post('plagiarism-check')
  async checkPlagiarism(@Body() dto: PlagiarismCheckDto) {
    const textToScan = dto.text || dto.noiDung || '';
    const titleToUse = dto.title || dto.tieuDe;
    return this.plagiarismService.scanDocument(textToScan, titleToUse, dto.queryCrossref);
  }

  @ApiOperation({
    summary: 'Xuất báo cáo tổng hợp học vụ (Định dạng JSON cấu trúc — cho phép Frontend render CSV / PDF)',
  })
  @Roles(VaiTro.Admin)
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="dashboard_export.json"')
  @Get('export')
  async exportDashboard(@Res() res: Response) {
    const data = await this.analyticsService.exportDashboardReport();
    res.json(data);
  }
}
