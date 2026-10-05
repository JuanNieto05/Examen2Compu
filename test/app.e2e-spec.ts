import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // [PARCIAL | NIVEL A: copiar literal] ValidationPipe en los tests e2e.
    // IMPORTANTE: createNestApplication() NO ejecuta tu main.ts, asi que los
    // pipes globales que registras alli NO existen en los e2e. Hay que
    // repetirlos aqui o todos los tests que esperan un 400 recibiran un 201.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /', () => {
    it('should return welcome message', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Welcome to Hotel Management API');
    });
  });
});
