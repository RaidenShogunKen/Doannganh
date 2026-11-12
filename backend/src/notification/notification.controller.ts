import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Res,
  UseGuards,
  OnModuleDestroy,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('notification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notification')
export class NotificationController implements OnModuleDestroy {
  constructor(private readonly notificationService: NotificationService) {}

  onModuleDestroy() {
  }

  @ApiOperation({ summary: 'SSE stream: nhận thông báo realtime' })
  @Get('stream')
  sseStream(@CurrentUser() user: any, @Res() res: Response) {
    const maNd: string = user.maNd;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    const subject = this.notificationService.registerSseStream(maNd);
    const sub = subject.subscribe({
      next: (event: MessageEvent) => {
        res.write(`data: ${event.data}\n\n`);
      },
      error: () => {
        clearInterval(heartbeat);
        res.end();
      },
      complete: () => {
        clearInterval(heartbeat);
        res.end();
      },
    });

    res.on('close', () => {
      clearInterval(heartbeat);
      sub.unsubscribe();
      this.notificationService.unregisterSseStream(maNd, subject);
    });
  }

  @ApiOperation({ summary: 'Lấy danh sách thông báo' })
  @Get()
  async getMyNotifications(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.notificationService.getByUser(user.maNd, limit ? parseInt(limit) : 30);
  }

  @ApiOperation({ summary: 'Đếm số thông báo chưa đọc' })
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.notificationService.getUnreadCount(user.maNd);
    return { count };
  }

  @ApiOperation({ summary: 'Đánh dấu thông báo đã đọc' })
  @Patch(':id/read')
  async markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    await this.notificationService.markAsRead(id, user.maNd);
    return { success: true };
  }

  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo đã đọc' })
  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: any) {
    await this.notificationService.markAllAsRead(user.maNd);
    return { success: true };
  }

  @ApiOperation({ summary: 'Xóa thông báo' })
  @Delete(':id')
  async deleteOne(@CurrentUser() user: any, @Param('id') id: string) {
    await this.notificationService.deleteOne(id, user.maNd);
    return { success: true };
  }
}
