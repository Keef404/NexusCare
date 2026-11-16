import { Controller, Get, Post, Patch, Delete, Param, Body, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AdminOnly, CurrentUser } from '../auth/decorators';
import type { AuthUser } from '../auth/decorators';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  /** Création : le créateur est toujours l'utilisateur authentifié (jamais une valeur du corps). */
  @Post()
  create(@Body() dto: CreateGroupDto, @CurrentUser() me: AuthUser) {
    return this.groupsService.create({ ...dto, createdById: me.id, memberIds: dto.memberIds ?? [] });
  }

  /** EPIC 8 : liste de tous les groupes (administrateur). */
  @Get()
  @AdminOnly()
  findAll() {
    return this.groupsService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string, @CurrentUser() me: AuthUser) {
    if (me.id !== userId && !me.isAdmin) {
      throw new ForbiddenException('Accès refusé');
    }
    return this.groupsService.findByUser(userId);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() me: AuthUser) {
    const group = await this.groupsService.findById(id);
    if (!group) throw new NotFoundException('Groupe introuvable');
    const isMember = group.members.some((m) => m.userId === me.id);
    if (!isMember && !me.isAdmin) throw new ForbiddenException('Accès refusé');
    return group;
  }

  /** Renommage : créateur du groupe ou administrateur. */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateGroupDto, @CurrentUser() me: AuthUser) {
    await this.assertCanManage(id, me);
    return this.groupsService.update(id, dto);
  }

  /** Suppression : créateur du groupe ou administrateur. */
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() me: AuthUser) {
    await this.assertCanManage(id, me);
    return this.groupsService.remove(id);
  }

  @Post(':id/members/:userId')
  async addMember(@Param('id') groupId: string, @Param('userId') userId: string, @CurrentUser() me: AuthUser) {
    await this.assertCanManage(groupId, me);
    return this.groupsService.addMember(groupId, userId);
  }

  @Delete(':id/members/:userId')
  async removeMember(@Param('id') groupId: string, @Param('userId') userId: string, @CurrentUser() me: AuthUser) {
    if (me.id !== userId) await this.assertCanManage(groupId, me); // on peut toujours quitter un groupe soi-même
    return this.groupsService.removeMember(groupId, userId);
  }

  private async assertCanManage(groupId: string, me: AuthUser) {
    const group = await this.groupsService.findById(groupId);
    if (!group) throw new NotFoundException('Groupe introuvable');
    if (group.createdById !== me.id && !me.isAdmin) {
      throw new ForbiddenException('Seul le créateur du groupe ou un administrateur peut effectuer cette action');
    }
  }
}
