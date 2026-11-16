import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminOnly, CurrentUser } from '../auth/decorators';
import type { AuthUser } from '../auth/decorators';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @AdminOnly()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() me: AuthUser) {
        if (me.id !== id && !me.isAdmin) {
            throw new ForbiddenException('Vous ne pouvez modifier que votre propre profil');
        }
        if (updateUserDto.isAdmin !== undefined && !me.isAdmin) {
            throw new ForbiddenException('Seul un administrateur peut modifier le rôle administrateur');
        }
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @AdminOnly()
    remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
}
