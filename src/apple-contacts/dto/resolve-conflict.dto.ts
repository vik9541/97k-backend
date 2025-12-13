import { IsString, IsOptional } from 'class-validator';

export class ResolveConflictDto {
  @IsString()
  strategy: 'local_wins' | 'remote_wins' | 'manual';

  @IsOptional()
  manualData?: any;
}
