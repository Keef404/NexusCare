import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { serializeUser } from '../common/serializers/serializers';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async create(createUserDto: CreateUserDto) {
        const passwordHash = await argon2.hash(createUserDto.password);
        const user = await this.prisma.user.create({
            data: {
                email: createUserDto.email,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                professionId: createUserDto.profession,
                isAdmin: createUserDto.isAdmin ?? false,
                password: passwordHash,
            },
            include: { profession: true },
        });
        return serializeUser(user);
    }

    async findAll() {
        const users = await this.prisma.user.findMany({
            include: { profession: true },
        });
        return users.map(serializeUser);
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { profession: true },
        });
        return serializeUser(user);
    }

    async findByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { profession: true },
        });
        return serializeUser(user);
    }

    /** Usage interne (authentification uniquement) : retourne l'enregistrement brut AVEC le hash. */
    async findByEmailWithPassword(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
            include: { profession: true },
        });
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                ...(updateUserDto.email && { email: updateUserDto.email }),
                ...(updateUserDto.firstName && { firstName: updateUserDto.firstName }),
                ...(updateUserDto.lastName && { lastName: updateUserDto.lastName }),
                ...(updateUserDto.profession && { professionId: updateUserDto.profession }),
                ...(updateUserDto.isAdmin !== undefined && { isAdmin: updateUserDto.isAdmin }),
                ...(updateUserDto.password && { password: await argon2.hash(updateUserDto.password) }),
            },
            include: { profession: true },
        });
        return serializeUser(user);
    }

    async remove(id: string) {
        await this.prisma.user.delete({ where: { id } });
        return { id, deleted: true };
    }
}
