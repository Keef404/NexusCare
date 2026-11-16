import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { CurrentUser } from '../auth/decorators';
import type { AuthUser } from '../auth/decorators';

@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @Post()
    create(@Body() createMessageDto: any, @CurrentUser() me: AuthUser) {
        // L'expéditeur est toujours l'utilisateur authentifié (anti-usurpation).
        return this.messagesService.create({ ...createMessageDto, sender: me.id });
    }

    @Get()
    findAll() {
        return this.messagesService.findAll();
    }

    @Get('room/:roomId')
    findByRoom(@Param('roomId') roomId: string) {
        return this.messagesService.findByRoom(roomId);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.messagesService.remove(id);
    }
}
