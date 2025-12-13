import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';

export class ContactDto {
  @ApiProperty({ example: '1' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional({ example: 'ACME Corp' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: 'CEO' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'outlook-123' })
  @IsOptional()
  @IsString()
  outlookContactId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  outlookModifiedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  sourceType?: string;
}
