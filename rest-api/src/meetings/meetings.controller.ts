import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile, ForbiddenException, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { MarkFormFilledDto } from './dto/add-patient-record.dto';
import { AdminOnly, CurrentUser } from '../auth/decorators';
import type { AuthUser } from '../auth/decorators';

@Controller('meetings')
export class MeetingsController {
    constructor(private readonly meetingsService: MeetingsService) {}

    /** L'administrateur de la réunion est toujours l'utilisateur authentifié (sauf administrateur plateforme). */
    @Post()
    create(@Body() createMeetingDto: CreateMeetingDto, @CurrentUser() me: AuthUser) {
        if (!me.isAdmin) createMeetingDto.roomAdmin = me.id;
        return this.meetingsService.create(createMeetingDto);
    }

    /** Seul l'administrateur de la réunion (ou un administrateur plateforme) peut la modifier. */
    private async assertRoomAdmin(meetingId: string, me: AuthUser) {
        const meeting: any = await this.meetingsService.findOne(meetingId);
        if (!meeting) throw new NotFoundException('Réunion introuvable');
        const roomAdminId = meeting.roomAdminId ?? meeting.roomAdmin?.id;
        if (roomAdminId !== me.id && !me.isAdmin) {
            throw new ForbiddenException("Seul l'administrateur de la réunion peut effectuer cette action");
        }
    }

    @Get()
    findAll() {
        return this.meetingsService.findAll();
    }

    @Get('pending')
    findPending() {
        return this.meetingsService.findPending();
    }

    @Post(':id/ensure-collaboration-room')
    ensureCollaborationRoom(@Param('id') id: string) {
        return this.meetingsService.ensureCollaborationRoom(id);
    }

    @Post('repair-collaboration-ids')
    @AdminOnly()
    repairCollaborationIds() {
        return this.meetingsService.repairCollaborationIds();
    }

    @Get('room/:roomId')
    findByRoomId(@Param('roomId') roomId: string) {
        return this.meetingsService.findByRoomId(roomId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.meetingsService.findOne(id);
    }

    @Get('participant/:participantId')
    findByParticipant(@Param('participantId') participantId: string) {
        return this.meetingsService.findByParticipant(participantId);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateMeetingDto: UpdateMeetingDto,
        @CurrentUser() me: AuthUser,
        @Query('requesterId') _requesterId?: string
    ) {
        await this.assertRoomAdmin(id, me);
        return this.meetingsService.update(id, updateMeetingDto, me.isAdmin ? undefined : me.id);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @CurrentUser() me: AuthUser) {
        await this.assertRoomAdmin(id, me);
        return this.meetingsService.remove(id);
    }

    @Post(':id/form-filled')
    markFormFilled(
        @Param('id') id: string,
        @Body() markFormFilledDto: MarkFormFilledDto
    ) {
        return this.meetingsService.markFormFilled(id, markFormFilledDto);
    }

    @Get(':id/participants-status')
    getParticipantsStatus(@Param('id') id: string) {
        return this.meetingsService.getParticipantsStatus(id);
    }

    @Get(':id/patient-records')
    getPatientRecords(@Param('id') id: string) {
        return this.meetingsService.getPatientRecordsForMeeting(id);
    }

    @Patch(':id/start')
    startMeeting(@Param('id') id: string) {
        return this.meetingsService.startMeeting(id);
    }

    @Patch(':id/complete')
    completeMeeting(@Param('id') id: string) {
        return this.meetingsService.completeMeeting(id);
    }

    @Patch(':id/cancel')
    async cancelMeeting(@Param('id') id: string, @CurrentUser() me: AuthUser) {
        await this.assertRoomAdmin(id, me);
        return this.meetingsService.cancelMeeting(id);
    }

    @Post(':id/participants')
    async addParticipant(
        @Param('id') id: string,
        @Body() body: { participantId: string; professionId: string },
        @CurrentUser() me: AuthUser
    ) {
        await this.assertRoomAdmin(id, me);
        return this.meetingsService.addParticipant(id, body.participantId, body.professionId);
    }

    @Delete(':id/participants/:participantId')
    async removeParticipant(
        @Param('id') id: string,
        @Param('participantId') participantId: string,
        @CurrentUser() me: AuthUser
    ) {
        if (participantId !== me.id) await this.assertRoomAdmin(id, me); // on peut toujours quitter une réunion soi-même
        return this.meetingsService.removeParticipant(id, participantId);
    }

    @Post(':id/dicom')
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
    uploadDicom(
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.meetingsService.uploadDicomToRoom(id, file);
    }

    @Patch(':id/participants/:participantId/visibility')
    async updateParticipantVisibility(
        @Param('id') id: string,
        @Param('participantId') participantId: string,
        @Body() body: { isVisible: boolean; showProfession?: boolean },
        @CurrentUser() me: AuthUser
    ) {
        await this.assertRoomAdmin(id, me);
        return this.meetingsService.updateParticipantVisibility(
            id, 
            participantId, 
            body.isVisible, 
            body.showProfession
        );
    }
}
