import { IsString, IsOptional } from 'class-validator';

export class ContactDto {
  @IsString()
  appleContactId: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  modifiedAt: string; // ISO 8601 date
}
