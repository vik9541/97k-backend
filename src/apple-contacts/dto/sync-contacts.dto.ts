import { IsArray, IsBoolean, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ContactDto } from './contact.dto';

export class SyncContactsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  contacts: ContactDto[];

  @IsString()
  @IsOptional()
  syncToken?: string;

  @IsBoolean()
  isFullSync: boolean;
}
