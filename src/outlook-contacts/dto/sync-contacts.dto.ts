import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';
import { ContactDto } from './contact.dto';

export class SyncContactsDto {
  @ApiProperty({ example: 'access_token_here' })
  @IsString()
  accessToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional({ type: [ContactDto] })
  @IsOptional()
  @IsArray()
  contacts?: ContactDto[];
}
