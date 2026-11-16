import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { StripSensitiveInterceptor } from './common/strip-sensitive.interceptor';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { MessagesModule } from './messages/messages.module';
import { AuthModule } from './auth/auth.module';
import { PatientRecordsModule } from './patient-records/patient-records.module';
import { MeetingsModule } from './meetings/meetings.module';
import { ProfessionsModule } from './professions/professions.module';
import { SeedModule } from './seed/seed.module';
import { EventsModule } from './events/events.module';
import { AiModule } from './ai/ai.module';
import { GroupsModule } from './groups/groups.module';
import { FormsModule } from './forms/forms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    MessagesModule,
    AuthModule,
    PatientRecordsModule,
    MeetingsModule,
    ProfessionsModule,
    SeedModule,
    EventsModule,
    AiModule,
    GroupsModule,
    FormsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_INTERCEPTOR, useClass: StripSensitiveInterceptor },
  ],
})
export class AppModule {}
