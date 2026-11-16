import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { TokenService } from './token.service';

@Module({
    imports: [UsersModule],
    controllers: [AuthController],
    providers: [AuthService, TokenService],
    exports: [TokenService],
})
export class AuthModule { }
