import bcrypt from 'bcryptjs';
import User from '../../src/models/User';
import { loginUser } from '../../src/controllers/usersController';
import * as tokenUtils from '../../src/utils/tokenUtils';
import { expectErrorResponse } from '../helpers/testHelpers';
import { mockUserCreate, mockUserFound, mockPasswordMatch, mockLoginSetup } from '../mocks/usersControllerMock';
import { mockEmail, mockPassword, mockUser } from '../helpers/testConstants';
import { Request, Response } from 'express';
let req: Request, res: Response;

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mockedToken'),
}));

jest.mock('../../src/models/User');
jest.mock('bcryptjs');

beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockUserCreate(User, bcrypt);
    jest.spyOn(tokenUtils, 'createToken').mockReturnValue('mockedToken');
    const { req: mockReq, res: mockRes } = mockLoginSetup(mockEmail, mockPassword);
    req = mockReq as Request;
    res = mockRes as Response;
});

describe("POST /login", () => {
    describe("Success", () => {
        test("Returns 200 status when valid email and password are provided", async () => {
            await loginUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("Returns valid JWT token and email after successful login", async () => {
            await loginUser(req, res, jest.fn());
            expect(res.json).toHaveBeenCalledWith({
                email: mockEmail,
                token: 'mockedToken',
            });
        });
    });

    describe("Incorrect Email", () => {
        test("Returns 400 status and 'incorrect email' error message if email is not found", async () => {
            const { req, res } = mockLoginSetup('otherEmail@email.com', mockPassword);

            mockUserFound(null);
            await expectErrorResponse(loginUser, req, res, 400, "Incorrect email");
        });
    });

    describe("Incorrect Password", () => {
        test("Returns 'Incorrect password'  error message and 400 status if password does not match", async () => {
            const { req, res } = mockLoginSetup(mockEmail, 'WrongPassword123!', mockUser);

            mockPasswordMatch(false);
            await expectErrorResponse(loginUser, req, res, 400, "Incorrect password");
        });
    });

    describe("Missing Fields", () => {
        type TestCase = {
            name: string;
            email?: string;
            password?: string;
        };

        const cases: TestCase[] = [
            { name: "email is missing", password: mockPassword },
            { name: "password is missing", email:  mockEmail },
            { name: "all fields are missing"},
        ]

        test.each(cases)("Returns error message when $name", async ({ email, password }) => {
            const { req, res } = mockLoginSetup(email, password);
            await expectErrorResponse(loginUser, req, res, 400, "All fields are required.");
        })
    });

    describe("Error Handling", () => {
        test("Returns 500 status and error message if JWT creation fails", async () => {
            jest.spyOn(tokenUtils, 'createToken').mockImplementation(() => {
                throw new Error('JWT failed');
            });
            
            await expectErrorResponse(loginUser, req, res, 500, "JWT failed");
        });
    });
});