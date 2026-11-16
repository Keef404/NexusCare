import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProfessionsService } from './professions.service';
import { CreateProfessionDto } from './dto/create-profession.dto';
import { UpdateProfessionDto } from './dto/update-profession.dto';
import { AdminOnly, Public } from '../auth/decorators';

@Controller('professions')
export class ProfessionsController {
    constructor(private readonly professionsService: ProfessionsService) {}

    @Post()
    @AdminOnly()
    create(@Body() createProfessionDto: CreateProfessionDto) {
        return this.professionsService.create(createProfessionDto);
    }

    @Get()
    findAll() {
        return this.professionsService.findAll();
    }

    @Get('active')
    @Public()
    findActive() {
        return this.professionsService.findActive();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.professionsService.findOne(id);
    }

    @Patch(':id')
    @AdminOnly()
    update(@Param('id') id: string, @Body() updateProfessionDto: UpdateProfessionDto) {
        return this.professionsService.update(id, updateProfessionDto);
    }

    @Delete(':id')
    @AdminOnly()
    remove(@Param('id') id: string) {
        return this.professionsService.remove(id);
    }

    @Post('seed')
    @AdminOnly()
    seed() {
        return this.professionsService.seed();
    }
}
