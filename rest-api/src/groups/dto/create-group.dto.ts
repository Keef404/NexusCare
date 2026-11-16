import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Ignoré côté serveur : le créateur est toujours l'utilisateur authentifié. */
  @IsString()
  @IsOptional()
  createdById?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberIds?: string[];

  @IsString()
  @IsOptional()
  meetingId?: string;
}
