import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should return 400 if from date is invalid', () => {
    return request(app.getHttpServer())
      .get('/balance-history')
      .query({ from: '201ss1-01-01' })
      .expect(400);
  });

  it('should return 400 if to date is invalid', () => {
    return request(app.getHttpServer())
      .get('/balance-history')
      .query({ to: '201ss1-01-01' })
      .expect(400);
  });

  it('should return 400 if currency is invalid', () => {
    return request(app.getHttpServer())
      .get('/balance-history')
      .query({ currency: 'USD' })
      .expect(400);
  });

  it('should return 400 if timezone is invalid', () => {
    return request(app.getHttpServer())
      .get('/balance-history')
      .query({ timezone: '+s' })
      .expect(400);
  });

  it('should return 400 if ledger account id is invalid', () => {
    return request(app.getHttpServer())
      .get('/balance-history')
      .query({ ledgerAccountId: 'not-uuid' })
      .expect(400);
  });

  it('should return 200 without any params', () => {
    return request(app.getHttpServer())
      .get('/balance-history')
      .query({})
      .expect(200);
  });

  it('should return 200 with from date and to date', () => {
    return request(app.getHttpServer())
      .get('/balance-history')
      .query({ from: '2021-09-04', to: '2021-09-05' })
      .expect(200);
  });

  it('should return 200 with currency', () => {
    return request(app.getHttpServer())
      .get('/balance-history')
      .query({ currency: 'IDR' })
      .expect(200);
  });

  it('should return 200 even with ledger account id not found', () => {
    return request(app.getHttpServer())
      .get('/balance-history')
      .query({ ledgerAccountId: 'd833f340-3c00-415f-ad09-a79c6718f7c6' })
      .expect(200);
  });

  it('should return 200 even with ledger account id not found', () => {
    return request(app.getHttpServer())
      .get(
        '/ledger-accounts/d833f340-3c00-415f-ad09-a79c6718f7c6/balance-history',
      )
      .expect(200);
  });
});
