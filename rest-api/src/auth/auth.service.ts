import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { TokenService } from './token.service';
import { serializeUser } from '../common/serializers/serializers';
import * as argon2 from 'argon2';

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
    private attempts = new Map<string, { count: number; resetAt: number }>();

    constructor(private usersService: UsersService, private tokens: TokenService) {}

    private checkRateLimit(key: string) {
        const now = Date.now();
        const entry = this.attempts.get(key);
        if (entry && entry.resetAt > now && entry.count >= MAX_ATTEMPTS) {
            throw new HttpException('Trop de tentatives, réessayez dans quelques minutes', HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    private registerFailure(key: string) {
        const now = Date.now();
        const entry = this.attempts.get(key);
        if (!entry || entry.resetAt <= now) this.attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
        else entry.count += 1;
    }

    private withToken(user: any) {
        const safe = serializeUser(user);
        return { ...safe, accessToken: this.tokens.sign({ id: safe!.id, email: safe!.email, isAdmin: !!safe!.isAdmin }) };
    }

    async register(createUserDto: CreateUserDto) {
        const userExists = await this.usersService.findByEmail(createUserDto.email);
        if (userExists) {
            throw new BadRequestException('User already exists');
        }
        try {
            // Une inscription publique ne peut JAMAIS créer un administrateur.
            const created = await this.usersService.create({ ...createUserDto, isAdmin: false });
            return this.withToken(created);
        } catch (err: any) {
            // Handle Prisma unique constraint violation (P2002)
            if (err?.code === 'P2002') {
                throw new BadRequestException('User with provided email already exists');
            }
            throw new InternalServerErrorException('Failed to register user');
        }
    }

    async login(authDto: AuthDto) {
        const key = authDto.email.toLowerCase();
        this.checkRateLimit(key);

        const user = await this.usersService.findByEmailWithPassword(authDto.email);
        const passwordMatches = user ? await argon2.verify(user.password, authDto.password) : false;
        if (!user || !passwordMatches) {
            this.registerFailure(key);
            throw new UnauthorizedException('Identifiants invalides');
        }
        this.attempts.delete(key);
        return this.withToken(user);
    }
}
