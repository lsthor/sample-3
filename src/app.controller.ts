import {
  Controller,
  Get,
  Param,
  Query,
  Response,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Response as ExpressResponse } from 'express';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BalanceHistoryReportQueryDTO } from './dto/BalanceHistoryReportQueryDTO';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/ledger-accounts/:id/balance-history')
  @ApiOperation({ summary: 'Generate balance history report' })
  @ApiResponse({
    status: 200,
    description: 'Balance history report',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters',
  })
  @UsePipes(new ValidationPipe({ whitelist: false, transform: true }))
  async ledgerAccountsBalanceReport(
    @Param('id') id: string,
    @Query() params: BalanceHistoryReportQueryDTO,
    @Response() res: ExpressResponse,
  ): Promise<ExpressResponse> {
    params.ledgerAccountId = id;
    return await this.appService.generateBalanceHistoryReport(params).then(
      async (fileName) =>
        await this.appService.getExportedUserCSV(fileName).then((csvData) => {
          res.set('Content-Type', 'text/csv');
          res.set('Content-Disposition', 'attachment; filename="report.csv"');
          return res.send(csvData);
        }),
    );
  }

  @Get('/balance-history')
  @ApiOperation({ summary: 'Generate balance history report' })
  @ApiResponse({
    status: 200,
    description: 'Balance history report',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid parameters',
  })
  @UsePipes(new ValidationPipe({ whitelist: false, transform: true }))
  async balanceReport(
    @Query() params: BalanceHistoryReportQueryDTO,
    @Response() res: ExpressResponse,
  ): Promise<ExpressResponse> {
    return await this.appService.generateBalanceHistoryReport(params).then(
      async (fileName) =>
        await this.appService.getExportedUserCSV(fileName).then((csvData) => {
          res.set('Content-Type', 'text/csv');
          res.set('Content-Disposition', 'attachment; filename="report.csv"');
          return res.send(csvData);
        }),
    );
  }
}
