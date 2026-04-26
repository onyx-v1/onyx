import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.channelsService.findAll(req.user.role);
  }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreateChannelDto) {
    return this.channelsService.create(dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  delete(@Param('id') id: string) {
    return this.channelsService.delete(id);
  }
}
