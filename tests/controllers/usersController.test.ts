process.env.JWT_SECRET = "testsecret";

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../src/models/User';
import * as usersController from '../../src/controllers/usersController';
import { registerUser, loginUser } from '../../src/controllers/usersController';
import * as tokenUtils from '../../src/utils/tokenUtils';
import { mockRequest, mockResponse } from 'jest-mock-req-res';
import { Request, Response } from 'express';

const mockId = '12345';
const mockEmail = "test@example.com";
const mockPassword = "SecurePassword123!";
const mockHashedPassword = "hashedPassword";
const jwtSecret = process.env.JWT_SECRET as string;

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mockedToken'),
}));

jest.mock('../../src/models/User');
jest.mock('bcryptjs');

const mockUserCreate = (email: string = mockEmail, password: string = mockPassword) => {
    (User.findOne as jest.Mock).mockResolvedValue(null);  
    (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");  
    (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);  
    (User.create as jest.Mock).mockResolvedValue({ _id: mockId, email }); 
};

// const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });
const buildReqRes = (body = {}) => {
    const req = mockRequest({ body });
    const res = mockResponse();
    return { req, res };
};

beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockUserCreate();
});

/*****************************************
 JWT
 ****************************************/
describe("JWT - Token creation logic", () => {
    test("JWT is called with the correct parameters", () => {
        tokenUtils.createToken(mockId);

        expect(jwt.sign).toHaveBeenCalledWith(
            { _id: mockId },
            jwtSecret,
            { expiresIn: '10d' }
        );
    });

    test("Token contains the correct payload (_id and expiration)", () => {
        tokenUtils.createToken(mockId);
        const signCall = (jwt.sign as jest.Mock).mock.calls[0];
        const payload = signCall[0];
        const options = signCall[2];

        expect(payload).toEqual({ _id: mockId });
        expect(options).toHaveProperty('expiresIn', '10d');
    });

    test("Handles jwt.sign throwing an error gracefully", () => {
        const mockError = new Error('JWT failed');
        (jwt.sign as jest.Mock).mockImplementation(() => {
            throw mockError;
        });

        expect(() => tokenUtils.createToken(mockId)).toThrow('JWT failed');
    });
});

/*****************************************
 REGISTER
 ****************************************/
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

            await registerUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "All fields are required" });
        });

        test("Returns 400 status if password is missing", async () => {
            const { req, res } = buildReqRes({ email: mockEmail }); // No password, only email

            await registerUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "All fields are required" });
        });
        
        test("Returns error message if any field is missing", async () => {
            const { req, res } = buildReqRes({});

            await registerUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "All fields are required" });
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
            await registerUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
        });


        test('Handles createToken failure during registration', async () => {
            const { req, res } = buildReqRes({ email: mockEmail, password: mockPassword });
        
            jest.spyOn(tokenUtils, 'createToken').mockImplementation(() => {
                throw new Error('JWT failed');
            });
        
            await registerUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'JWT failed' });
        });
    });
})

/*****************************************
 LOGIN
 ****************************************/
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

            await loginUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "All fields are required." });
        });

        test("Returns 400 status if password is missing", async () => {
            const { req, res } = buildReqRes({ email: mockEmail }); // No password

            await loginUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "All fields are required." });
        });
        
        test("Returns error message if any field is missing", async () => {
            const { req, res } = buildReqRes({}); // No email or password

            await loginUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "All fields are required." });
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
            await loginUser(req, res, jest.fn());
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'JWT failed' });
        });
    })
})