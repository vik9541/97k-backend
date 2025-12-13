import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// VICTOR iCLOUD SYNC DTOs
// ============================================

export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  VCARD = 'vcard',
}

export class PhoneNumberDto {
  @ApiProperty({ example: 'mobile' })
  @IsString()
  type: string; // mobile, work, home, main, fax

  @ApiProperty({ example: '+79991234567' })
  @IsString()
  number: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class EmailAddressDto {
  @ApiProperty({ example: 'work' })
  @IsString()
  type: string; // work, home, other

  @ApiProperty({ example: 'petrov@city-admin.ru' })
  @IsString()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class PostalAddressDto {
  @ApiProperty({ example: 'work' })
  @IsString()
  type: string; // work, home, other

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;
}

export class SocialProfileDto {
  @ApiProperty({ example: 'telegram' })
  @IsString()
  service: string; // telegram, vk, facebook, linkedin, twitter

  @ApiProperty({ example: '@petrov_ivan' })
  @IsString()
  username: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;
}

export class ContactPhotoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  base64Data?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  size?: number;
}

export class VictorContactFullDto {
  @ApiProperty({ description: 'Apple Contact ID' })
  @IsString()
  appleContactId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleContactId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outlookContactId?: string;

  // Имя
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prefix?: string; // Mr., Mrs., Dr.

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  suffix?: string; // Jr., Sr., PhD

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty()
  @IsString()
  fullName: string;

  // Организация
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitle?: string;

  // Контактные данные
  @ApiPropertyOptional({ type: [PhoneNumberDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhoneNumberDto)
  phoneNumbers?: PhoneNumberDto[];

  @ApiPropertyOptional({ type: [EmailAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAddressDto)
  emails?: EmailAddressDto[];

  @ApiPropertyOptional({ type: [PostalAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostalAddressDto)
  addresses?: PostalAddressDto[];

  // Социальные сети
  @ApiPropertyOptional({ type: [SocialProfileDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialProfileDto)
  socialProfiles?: SocialProfileDto[];

  // Фото
  @ApiPropertyOptional({ type: ContactPhotoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactPhotoDto)
  photo?: ContactPhotoDto;

  // Дополнительно
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  birthday?: string; // ISO date

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // Метаданные
  @ApiProperty()
  @IsString()
  modifiedAt: string; // ISO 8601

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdAt?: string;
}

export class VictorSyncRequestDto {
  @ApiProperty({ type: [VictorContactFullDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VictorContactFullDto)
  contacts: VictorContactFullDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  syncToken?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFullSync?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includePhotos?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceName?: string; // "iPhone 15 Pro"

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iCloudVersion?: string;
}

export class VictorSyncResponseDto {
  @ApiProperty()
  status: 'success' | 'partial' | 'error';

  @ApiProperty()
  totalContacts: number;

  @ApiProperty()
  created: number;

  @ApiProperty()
  updated: number;

  @ApiProperty()
  deleted: number;

  @ApiProperty()
  conflicts: number;

  @ApiProperty()
  errors: number;

  @ApiProperty()
  photosDownloaded: number;

  @ApiProperty()
  dataSizeMB: number;

  @ApiProperty()
  syncToken: string;

  @ApiProperty()
  syncedAt: string;

  @ApiProperty()
  nextSyncRecommended: string;

  @ApiPropertyOptional()
  errorDetails?: string[];
}

export class VictorExportRequestDto {
  @ApiPropertyOptional({ enum: ExportFormat, default: ExportFormat.JSON })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includePhotos?: boolean;

  @ApiPropertyOptional({ description: 'Filter by tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Filter by company' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class VictorContactsStatsDto {
  @ApiProperty()
  totalContacts: number;

  @ApiProperty()
  withPhotos: number;

  @ApiProperty()
  withPhones: number;

  @ApiProperty()
  withEmails: number;

  @ApiProperty()
  withCompanies: number;

  @ApiProperty()
  bySource: {
    apple: number;
    google: number;
    outlook: number;
    manual: number;
  };

  @ApiProperty()
  topCompanies: Array<{ company: string; count: number }>;

  @ApiProperty()
  recentlyAdded: number; // last 7 days

  @ApiProperty()
  recentlyModified: number; // last 7 days

  @ApiProperty()
  lastSyncAt: string;

  @ApiProperty()
  storageUsedMB: number;
}
