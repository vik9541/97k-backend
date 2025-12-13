import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsIn, IsOptional } from 'class-validator';

export class ResolveConflictDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  conflictId: bigint;

  @ApiProperty({
    example: 'outlook_wins',
    enum: ['apple_wins', 'google_wins', 'outlook_wins', 'manual'],
  })
  @IsString()
  @IsIn(['apple_wins', 'google_wins', 'outlook_wins', 'manual'])
  strategy: string;

  @ApiPropertyOptional()
  @IsOptional()
  manualData?: any;
}
