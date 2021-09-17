import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { BalanceHistoryReportQueryDTO } from './dto/BalanceHistoryReportQueryDTO';
import {
  getFile,
  createFile,
  checkIfFileOrDirectoryExists,
} from './common/storage.helper';
import { parse } from 'json2csv';

@Injectable()
export class AppService {
  constructor(
    @InjectConnection() private readonly connection,
    private sequelize: Sequelize,
  ) {}

  async generateBalanceHistoryReport(
    params: BalanceHistoryReportQueryDTO,
  ): Promise<string> {
    const notEmpty = (v: string | undefined) => v && v !== '';

    const constructCriteria = (
      params: BalanceHistoryReportQueryDTO,
    ): string[] => {
      const criteria = [];
      if (notEmpty(params.from)) {
        criteria.push('t.created > :from at time zone :timezone ');
      }
      if (notEmpty(params.to)) {
        criteria.push('t.created < :to at time zone :timezone ');
      }
      if (notEmpty(params.ledgerAccountId)) {
        criteria.push('ll.ledger_account_id  = :ledgerAccountId');
      }
      if (notEmpty(params.currency)) {
        criteria.push('lt.currency = :currency');
      }

      return criteria;
    };

    const constructQuery = (criteria: string[]) => {
      const queryPart =
        'from ledger_line as ll\n' +
        'left join vat v on v.ledger_line_id = ll.id\n' +
        'left join xendit_fee xf on ll.id = xf.ledger_line_id\n' +
        'inner join transaction t on ll.transaction_id = t.id\n' +
        'inner join ledger_transfer lt on lt.sender_ledger_line_id = ll.id or lt.receiver_ledger_line_id = ll.id';
      if (criteria.length === 0) {
        return queryPart;
      } else {
        const criteriaString = criteria.join(' AND ');
        return queryPart + ' WHERE ' + criteriaString;
      }
    };

    const transformDataForCSV = (results: any[]) => {
      if (results.length > 0) {
        const headers = Object.keys(results[0]);
        return [headers, results];
      } else {
        return [[], []];
      }
    };

    const sortBy = ' order by ll.ledger_account_id, ll.sequence ';
    const criteria = constructCriteria(params);
    const queryPart = constructQuery(criteria);
    const countQuery = 'select count(ll.id) ' + queryPart;
    const selectQuery =
      'select t.payment_id as "Payment ID",\n' +
      '       t.id as "Transaction ID",\n' +
      '       case when v.id is null AND xf.id is null then t.type\n' +
      "            when v.id is not null and xf.id is null then t.type || ' VAT'\n" +
      "            else  t.type || ' Fee'\n" +
      '       end as "Transaction Type",\n' +
      "       case when v.id is null AND xf.id is null then 'Transaction'\n" +
      "            when v.id is not null and xf.id is null then 'VAT'\n" +
      "            else 'FEE'\n" +
      '       end as "Line Type",\n' +
      '       t.reference as "Reference",\n' +
      '       lt.currency as "Currency",\n' +
      '       lt.amount as "LT Amount",\n' +
      '       ll.credit - ll.debit as "Balance",\n' +
      '       ll.type,\n' +
      '       t.created as "Created Date ISO",\n' +
      '       :timezone as "Timezone",\n' +
      '       t.created at time zone :timezone as "Created Date",\n' +
      '       t.payment_date at time zone :timezone  as "Payment Date",\n' +
      '       t.settlement_date at time zone :timezone as "Settlement Date"' +
      queryPart +
      sortBy;

    const countData = await this.connection.query(countQuery, {
      replacements: params,
      type: this.connection.QueryTypes.SELECT,
    });

    if (countData[0].count > 10_000) {
      // do something
      console.log('do sometihng');
    }

    const queryData = await this.connection.query(selectQuery, {
      replacements: params,
      type: this.connection.QueryTypes.SELECT,
    });

    // console.log(queryData);

    const [csvFields, csvData] = transformDataForCSV(queryData);

    if (!csvData || !csvFields) {
      return Promise.reject('Unable to transform users data for CSV.');
    }

    const csv = parse(csvData, { fields: csvFields });

    const filePath = `storage/`;
    const fileName = `users-${new Date().toISOString()}.csv`;

    await createFile(filePath, fileName, csv);

    return Promise.resolve(fileName);
  }

  async getExportedUserCSV(filename: string): Promise<string> {
    const filePath = `storage/${filename}`;

    if (!checkIfFileOrDirectoryExists(filePath)) {
      throw new NotFoundException('Report not found.');
    }

    return (await getFile(filePath, 'utf8')).toString();
  }
}
