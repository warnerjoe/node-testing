import bcrypt from 'bcryptjs';
import User from '../../src/models/User';
import { registerUser } from '../../src/controllers/usersController';
import * as tokenUtils from '../../src/utils/tokenUtils';
import { buildReqRes, expectErrorResponse } from '../helpers/testHelpers';
import { mockEmail, mockPassword, mockHashedPassword } from '../helpers/testConstants';
import { mockUserCreate } from '../mocks/usersControllerMock';

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
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword })

            await registerUser(req, res, jest.fn());
            expect(User.findOne).toHaveBeenCalledWith({ email: mockEmail });
            expect(bcrypt.genSalt).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, "salt");
            expect(User.create).toHaveBeenCalledWith({
                email: mockEmail,
                password: mockHashedPassword
            });
        });

        test("Generates a valid JWT token for new user", async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });

            await registerUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                email: mockEmail,
                token: "mockedToken"
            });
        });

        test("Returns 200 status code for successful registration", async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });

            await registerUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("Ensures bcrypt salt and hash functions are called correctly", async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });

            await registerUser(req, res, jest.fn());
            expect(bcrypt.genSalt).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, "salt");
        });
        
        test("Returns valid JWT token and email after successful registration", async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });

            await registerUser(req, res, jest.fn());
            expect(res.json).toHaveBeenCalledWith({
                email: mockEmail,
                token: "mockedToken"
            });
        });

        test("Ensures next() is not called on successful registration", async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });
            const next = jest.fn();

            await registerUser(req, res, next);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("Missing Fields", () => {
        test("Returns 400 status if email is missing", async () => {
            const { req, res } = buildReqRes({ password: mockPassword }); // No email, only password
            await expectErrorResponse(registerUser, req, res, 400, "All fields are required.");
        });

        test("Returns 400 status if password is missing", async () => {
            const { req, res } = buildReqRes({ email: mockEmail }); // No password, only email
            await expectErrorResponse(registerUser, req, res, 400, "All fields are required.");
        });
        
        test("Returns error message if any field is missing", async () => {
            const { req, res } = buildReqRes({});
            await expectErrorResponse(registerUser, req, res, 400, "All fields are required.");
        });

    });

    describe("Email already exists", () => {
        test("Returns 400 status if email already exists", async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });

            (User.findOne as jest.Mock).mockResolvedValue({ email: mockEmail });
            await registerUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test("Returns error message if email is already in use", async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });

            (User.findOne as jest.Mock).mockResolvedValue({ email: mockEmail });
            await registerUser(req, res, jest.fn());
            expect(res.json).toHaveBeenCalledWith({ error: "Email is already in use" });
        });
    });

    describe("Error handling", () => {
        test("Returns 500 status and error message for database failures", async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });

            (User.create as jest.Mock).mockRejectedValue(new Error("Database error"));

            await expectErrorResponse(registerUser, req, res, 500, "Database error");
        });


        test('Handles createToken failure during registration', async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });
        
            jest.spyOn(tokenUtils, 'createToken').mockImplementation(() => {
                throw new Error('JWT failed');
            });
        
            await expectErrorResponse(registerUser, req, res, 500, "JWT failed");
        });
    });
})