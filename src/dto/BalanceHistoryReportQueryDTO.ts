import {
  IsDateString,
  IsIn,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CURRENCY {
  IDR = 'IDR',
}
export class BalanceHistoryReportQueryDTO {
  @IsDateString()
  @IsOptional()
  @ApiProperty({
    name: 'from',
    required: false,
    description: 'From Date',
    type: 'string',
  })
  from: string;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    name: 'to',
    required: false,
    description: 'To Date',
    type: 'string',
  })
  to: string;

  @IsIn(['IDR'])
  @IsOptional()
  @ApiProperty({
    name: 'currency',
    required: false,
    description: 'Currency',
    type: 'string',
    enum: CURRENCY,
  })
  currency: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({
    name: 'ledgerAccountId',
    required: false,
    description: 'Ledger Account Id',
    type: 'string',
    format: 'uuid',
  })
  ledgerAccountId: string;

  @Matches('[+-][0-9]{1,2}\\b')
  @IsOptional()
  @ApiProperty({
    name: 'timezone',
    required: false,
    description: 'Timezone',
    type: 'string',
    example: '+7',
    default: '+7',
  })
  timezone?: string = '+7';
}
