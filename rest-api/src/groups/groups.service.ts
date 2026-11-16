import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGroupDto & { createdById: string; memberIds: string[] }) {
    const allMemberIds = Array.from(new Set([dto.createdById, ...dto.memberIds]));

    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        createdById: dto.createdById,
        meetingId: dto.meetingId,
        members: {
          create: allMemberIds.map((userId) => ({ userId })),
        },
      },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return group;
  }

  async findAll() {
    return this.prisma.group.findMany({
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateGroupDto) {
    const name = dto.name?.trim();
    return this.prisma.group.update({
      where: { id },
      data: name ? { name } : {},
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async remove(id: string) {
    // Les réunions liées perdent simplement leur groupe de discussion (groupChatId -> null).
    await this.prisma.meeting.updateMany({ where: { groupChatId: id }, data: { groupChatId: null } });
    await this.prisma.group.delete({ where: { id } });
    return { id, deleted: true };
  }

  async findByUser(userId: string) {
    return this.prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.group.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async addMember(groupId: string, userId: string) {
    return this.prisma.groupMember.create({
      data: { groupId, userId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async removeMember(groupId: string, userId: string) {
    return this.prisma.groupMember.deleteMany({
      where: { groupId, userId },
    });
  }
}
