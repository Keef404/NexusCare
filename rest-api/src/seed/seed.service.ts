import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class SeedService implements OnModuleInit {
    constructor(private prisma: PrismaService) {}

    async onModuleInit() {
        console.log('🌱 Vérification des données de démo...');
        await this.seedProfessions();
        // Comptes/dossiers/réunions de démo (mots de passe connus) : jamais en production.
        const demoAllowed = process.env.NODE_ENV !== 'production' && process.env.SEED_DEMO_DATA !== 'false';
        if (demoAllowed) {
            await this.seedUsers();
            await this.seedPatientRecords();
            await this.seedMeetings();
        } else {
            console.log('ℹ️ Données de démo désactivées (production ou SEED_DEMO_DATA=false)');
        }
        console.log('✅ Données de démo vérifiées/créées');
    }

    private async seedProfessions() {
        const professions = [
            { name: 'Oncologue', description: 'Spécialiste en oncologie', color: '#ef4444', idForm: 'oncologistForm' },
            { name: 'Chirurgien', description: 'Chirurgien spécialisé', color: '#3b82f6', idForm: 'surgeonForm' },
            { name: 'Radiologue', description: 'Spécialiste en imagerie médicale', color: '#8b5cf6', idForm: 'radiologistForm' },
            { name: 'Anatomopathologiste', description: 'Spécialiste en anatomie pathologique', color: '#10b981', idForm: 'pathologistForm' },
            { name: 'Radiothérapeute', description: 'Spécialiste en radiothérapie', color: '#f59e0b', idForm: 'radiotherapistForm' },
            { name: 'Infirmier(ère)', description: 'Personnel infirmier', color: '#ec4899', idForm: 'nurseForm' },
            { name: 'Psychologue', description: 'Accompagnement psychologique', color: '#6366f1', idForm: 'psychologistForm' },
            { name: 'Médecin généraliste', description: 'Médecin traitant', color: '#14b8a6', idForm: 'general_practitionerForm' },
        ];

        for (const profession of professions) {
            await this.prisma.profession.upsert({
                where: { name: profession.name },
                update: { idForm: profession.idForm },
                create: profession,
            });
        }
    }

    private async seedUsers() {
        const chirurgien = await this.prisma.profession.findUnique({ where: { name: 'Chirurgien' } });
        const radiologue = await this.prisma.profession.findUnique({ where: { name: 'Radiologue' } });
        const anatomoPath = await this.prisma.profession.findUnique({ where: { name: 'Anatomopathologiste' } });
        const infirmier = await this.prisma.profession.findUnique({ where: { name: 'Infirmier(ère)' } });
        const oncologue = await this.prisma.profession.findUnique({ where: { name: 'Oncologue' } });

        const users = [
            {
                email: 'sophie.martin@oncocollab.fr',
                firstName: 'Sophie',
                lastName: 'Martin',
                professionId: chirurgien!.id,
                password: await argon2.hash('password123'),
                isAdmin: false,
            },
            {
                email: 'jean.dupont@oncocollab.fr',
                firstName: 'Jean',
                lastName: 'Dupont',
                professionId: radiologue!.id,
                password: await argon2.hash('password123'),
                isAdmin: false,
            },
            {
                email: 'marie.lefevre@oncocollab.fr',
                firstName: 'Marie',
                lastName: 'Lefèvre',
                professionId: anatomoPath!.id,
                password: await argon2.hash('password123'),
                isAdmin: false,
            },
            {
                email: 'paul.bernard@oncocollab.fr',
                firstName: 'Paul',
                lastName: 'Bernard',
                professionId: infirmier!.id,
                password: await argon2.hash('password123'),
                isAdmin: false,
            },
            {
                email: 'admin@oncocollab.fr',
                firstName: 'Admin',
                lastName: 'System',
                professionId: oncologue!.id,
                password: await argon2.hash('admin123'),
                isAdmin: true,
            },
        ];

        for (const user of users) {
            const exists = await this.prisma.user.findUnique({ where: { email: user.email } });
            if (!exists) {
                await this.prisma.user.create({ data: user });
                console.log(`  ➕ Utilisateur créé: ${user.email}`);
            }
        }
    }

    private async seedPatientRecords() {
        const count = await this.prisma.patientRecord.count();
        if (count > 0) return;

        const patients = [
            {
                profession: 'Patient',
                data: {
                    firstName: 'Michel',
                    lastName: 'Dubois',
                    dateOfBirth: '1958-03-15',
                    gender: 'M',
                    diagnosis: 'Cancer du poumon - Stade IIA',
                    notes: 'Patient suivi depuis janvier 2026',
                },
            },
            {
                profession: 'Patient',
                data: {
                    firstName: 'Françoise',
                    lastName: 'Lambert',
                    dateOfBirth: '1965-07-22',
                    gender: 'F',
                    diagnosis: 'Cancer du sein - Triple négatif',
                    notes: 'Chimiothérapie néoadjuvante en cours',
                },
            },
            {
                profession: 'Patient',
                data: {
                    firstName: 'Robert',
                    lastName: 'Moreau',
                    dateOfBirth: '1972-11-08',
                    gender: 'M',
                    diagnosis: 'Mélanome - Stade III',
                    notes: 'Immunothérapie prévue',
                },
            },
        ];

        for (const patient of patients) {
            await this.prisma.patientRecord.create({ data: patient });
            console.log(`  ➕ Patient créé: ${(patient.data as any).firstName} ${(patient.data as any).lastName}`);
        }
    }

    private async seedMeetings() {
        const count = await this.prisma.meeting.count();
        if (count > 0) return;

        const users = await this.prisma.user.findMany({ include: { profession: true } });

        if (users.length < 2) {
            console.log('  ⚠️ Pas assez de données pour créer des réunions');
            return;
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        // RCP pour discuter du plan de traitement de Michel Dubois
        await this.prisma.meeting.create({
            data: {
                roomId: 'demo-room-001',
                subject: 'RCP - Cas Michel Dubois',
                description: 'Réunion de concertation pluridisciplinaire pour discuter du plan de traitement',
                time: '14:00',
                roomAdminId: users[0].id,
                status: 'pending',
                scheduledDate: tomorrow,
                duration: 60,
                participants: {
                    create: users.slice(0, 4).map(u => ({
                        userId: u.id,
                        professionId: u.professionId,
                        isVisible: true,
                        showProfession: true,
                        formFilled: false,
                    })),
                },
            },
        });
        console.log('  ➕ Réunion créée: RCP - Cas Michel Dubois');

        // Suivi post-op de Mme Lambert pour planifier la suite du traitement
        await this.prisma.meeting.create({
            data: {
                roomId: 'demo-room-002',
                subject: 'Suivi post-opératoire - Mme Lambert',
                description: "Discussion sur les résultats de l'intervention et planification de la suite",
                time: '10:30',
                roomAdminId: users[0].id,
                status: 'pending',
                scheduledDate: nextWeek,
                duration: 45,
                participants: {
                    create: users.slice(0, 3).map(u => ({
                        userId: u.id,
                        professionId: u.professionId,
                        isVisible: true,
                        showProfession: true,
                        formFilled: false,
                    })),
                },
            },
        });
        console.log('  ➕ Réunion créée: Suivi post-opératoire - Mme Lambert');
    }
}
