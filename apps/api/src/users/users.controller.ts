import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ModeratorGuard } from '../auth/moderator.guard';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateDisplayNameDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  /** List all users — Admin + Mod can see (for Server Settings) */
  @Get()
  @UseGuards(ModeratorGuard)
  findAll() {
    return this.usersService.findAll();
  }

  /** Create a new user — Admin only */
  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  /** Update display name — Admin only (users update themselves via /auth/me) */
  @Patch(':id')
  @UseGuards(AdminGuard)
  updateDisplayName(@Param('id') id: string, @Body() dto: UpdateDisplayNameDto) {
    return this.usersService.updateDisplayName(id, dto);
  }

  /** Assign / revoke MODERATOR role — Admin only */
  @Patch(':id/role')
  @UseGuards(AdminGuard)
  assignRole(
    @Param('id') id: string,
    @Body('role') role: 'MODERATOR' | 'MEMBER',
    @Req() req: any,
  ) {
    return this.usersService.assignRole(id, role, req.user.id);
  }

  /** Kick user (clear sessions, gateway will disconnect socket) — Admin + Mod */
  @Delete(':id/session')
  @UseGuards(ModeratorGuard)
  kickUser(@Param('id') id: string, @Req() req: any) {
    return this.usersService.kickUser(id, req.user.id);
  }

  /** Hard-delete a user — Admin only */
  @Delete(':id')
  @UseGuards(AdminGuard)
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
