import bcrypt from 'bcryptjs';
import User from '../../src/models/User';
import { loginUser } from '../../src/controllers/usersController';
import * as tokenUtils from '../../src/utils/tokenUtils';
import { mockUserCreate, buildReqRes, expectErrorResponse } from '../helpers/testHelpers';

const mockId = '12345';
const mockEmail = "test@example.com";
const mockPassword = "SecurePassword123!";
const mockHashedPassword = "hashedPassword";

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

describe("POST /login", () => {
    describe("Success", () => {
        beforeEach(() => {
            jest.spyOn(tokenUtils, 'createToken').mockReturnValue('mockedToken');
        })

        test("Returns 200 status when valid email and password are provided", async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });

            (User.findOne as jest.Mock).mockResolvedValue({
                _id: mockId,
                email: mockEmail,
                password: mockHashedPassword,
            });

            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            await loginUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("Returns valid JWT token and email after successful login", async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });

            (User.findOne as jest.Mock).mockResolvedValue({
                _id: mockId,
                email: mockEmail,
                password: mockHashedPassword,
            });

            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            await loginUser(req, res, jest.fn());
            expect(res.json).toHaveBeenCalledWith({
                email: mockEmail,
                token: 'mockedToken',
            });
        });
    });

    describe("Incorrect Email", () => {
        test("Returns 400 status if email is not found", async () => {
            const { req, res } = buildReqRes({ email: 'otherEmail@email.com', password: mockPassword });

            (User.findOne as jest.Mock).mockResolvedValue(null);
            await loginUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Incorrect email" });
        });

        test("Returns 'Incorrect Email' error message if email is not found", async () => {
            const { req, res } = buildReqRes({ email: 'otherEmail@email.com', password: mockPassword });

            (User.findOne as jest.Mock).mockResolvedValue(null);
            await loginUser(req, res, jest.fn());
            expect(res.json).toHaveBeenCalledWith({ error: "Incorrect email" });
        });
    });

    describe("Incorrect Password", () => {
        test("Returns 400 status if password does not match", async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: 'WrongPassword123!' });

            (User.findOne as jest.Mock).mockResolvedValue({
                _id: mockId,
                email: mockEmail,
                password: mockHashedPassword 
            });

            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            await loginUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test("Returns 'Incorrect password' error message if password does not match", async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: 'WrongPassword123!' });
            (User.findOne as jest.Mock).mockResolvedValue({
                _id: mockId,
                email: mockEmail,
                password: mockHashedPassword 
            });

            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            await loginUser(req, res, jest.fn());
            expect(res.json).toHaveBeenCalledWith({ error: "Incorrect password" });
        });
    });

    describe("Missing Fields", () => {
        test("Returns 400 status if email is missing", async () => {
            const { req, res } = buildReqRes({ password: mockPassword }); // No email
            await expectErrorResponse(loginUser, req, res, 400, "All fields are required.");
        });

        test("Returns 400 status if password is missing", async () => {
            const { req, res } = buildReqRes({ email: mockEmail }); // No password
            await expectErrorResponse(loginUser, req, res, 400, "All fields are required.");
        });
        
        test("Returns error message if any field is missing", async () => {
            const { req, res } = buildReqRes({}); // No email or password
            await expectErrorResponse(loginUser, req, res, 400, "All fields are required.");
        });
    });

    describe("Error Handling", () => {
        test("Returns 500 status and error message if JWT creation fails", async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });

            (User.findOne as jest.Mock).mockResolvedValue({
                _id: mockId,
                email: mockEmail,
                password: mockHashedPassword,
            });

            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            jest.spyOn(tokenUtils, 'createToken').mockImplementation(() => {
                throw new Error('JWT failed');
            });
            
            await expectErrorResponse(loginUser, req, res, 500, "JWT failed");
        });
    })
})