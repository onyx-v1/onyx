import { Controller, Delete, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('search')
  search(@Query('q') q: string, @Query('channelId') channelId?: string) {
    return this.messagesService.search(q, channelId);
  }

  @Get('channel/:channelId/pinned')
  getPinned(@Param('channelId') channelId: string) {
    return this.messagesService.getPinnedMessages(channelId);
  }

  @Get('channel/:channelId')
  findByChannel(
    @Param('channelId') channelId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.findByChannel(
      channelId,
      before,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Delete(':id')
  deleteMessage(@Param('id') id: string, @Req() req: any) {
    return this.messagesService.deleteMessage(id, req.user.id, req.user.role === 'ADMIN');
  }
}
