import express from 'express';
import request from 'supertest';
import { mockUsersController, registerUserMock, loginUserMock } from '../mocks/usersControllerMock';

jest.mock('../../src/controllers/usersController', () => mockUsersController);

import usersRouter from '../../src/routes/usersRoutes';

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Users Routes", () => {
  test("POST /register calls registerUser controller", async () => {
    await request(app)
      .post('/api/users/register')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200);

    expect(registerUserMock).toHaveBeenCalled();
  });

  test("POST /login calls loginUser controller", async () => {
    await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(200);

    expect(loginUserMock).toHaveBeenCalled();
  });

  test("Handles unknown routes with appropriate error", async () => {
    await request(app)
      .post('/api/users/unknown')
      .expect(404);
  });
});
