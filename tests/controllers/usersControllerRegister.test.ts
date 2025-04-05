import bcrypt from 'bcryptjs';
import User from '../../src/models/User';
import { registerUser } from '../../src/controllers/usersController';
import * as tokenUtils from '../../src/utils/tokenUtils';
import { buildReqRes, buildValidReqRes, expectErrorResponse, expectSuccessfulRegisterRes, expectPasswordHashCalled } from '../helpers/testHelpers';
import { mockEmail, mockPassword } from '../helpers/testConstants';
import { mockUserCreate, mockEmailAlreadyExists } from '../mocks/usersControllerMock';

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
});

describe("POST /register", () => {
    describe("Success", () => {
        beforeEach(() => {
            jest.spyOn(tokenUtils, 'createToken').mockReturnValue('mockedToken');
        })

        test("Creates a new user with valid email & password", async () => {
            const { req, res } = buildValidReqRes()

            await registerUser(req, res, jest.fn());
            expect(User.findOne).toHaveBeenCalledWith({ email: mockEmail });
            expectPasswordHashCalled();
            expectSuccessfulRegisterRes(res);
        });

        test("Generates a valid JWT token for new user and 200 status for successful registration", async () => {
            const { req, res } = buildValidReqRes();

            await registerUser(req, res, jest.fn());
            expectSuccessfulRegisterRes(res)
        });

        test("Ensures bcrypt salt and hash functions are called correctly", async () => {
            const { req, res } = buildValidReqRes();

            await registerUser(req, res, jest.fn());
            expectPasswordHashCalled();
        });
        
        test("Returns valid JWT token and email after successful registration", async () => {
            const { req, res } = buildValidReqRes();

            await registerUser(req, res, jest.fn());
            expectSuccessfulRegisterRes(res);
        });

        test("Ensures next() is not called on successful registration", async () => {
            const { req, res } = buildValidReqRes();
            const next = jest.fn();

            await registerUser(req, res, next);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("Missing Fields", () => {
        type TestCase = {
            name: string;
            body: Record<string, unknown>;
        };

        const cases: TestCase[] = [
            { name: "missing email", body: { password: mockPassword } },
            { name: "missing password", body: { email: mockEmail } },
            { name: "missing both fields", body: {} },
        ];

        test.each(cases)("Returns 400 when $name", async ({ body }) => {
            const { req, res } = buildReqRes(body);
            await expectErrorResponse(registerUser, req, res, 400, "All fields are required.");
        });
    });

    describe("Email already exists", () => {
        test("Returns 400 status if user with email already exists", async () => {
            const { req, res } = buildValidReqRes();

            mockEmailAlreadyExists();
            await registerUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test("Returns error message if email is already in use", async () => {
            const { req, res } = buildValidReqRes();

            mockEmailAlreadyExists();
            await registerUser(req, res, jest.fn());
            expect(res.json).toHaveBeenCalledWith({ error: "Email is already in use" });
        });
    });

    describe("Error handling", () => {
        test("Returns 500 status and error message for database failures", async () => {
            const { req, res } = buildValidReqRes();

            (User.create as jest.Mock).mockRejectedValue(new Error("Database error"));

            await expectErrorResponse(registerUser, req, res, 500, "Database error");
        });


        test('Handles createToken failure during registration', async () => {
            const { req, res } = buildValidReqRes();
        
            jest.spyOn(tokenUtils, 'createToken').mockImplementation(() => {
                throw new Error('JWT failed');
            });
        
            await expectErrorResponse(registerUser, req, res, 500, "JWT failed");
        });
    });
})