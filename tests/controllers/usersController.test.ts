process.env.JWT_SECRET = "testsecret";

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../src/models/User';
import * as usersController from '../../src/controllers/usersController';
import { registerUser, loginUser } from '../../src/controllers/usersController';
import * as tokenUtils from '../../src/utils/tokenUtils';
import { mockRequest, mockResponse } from 'jest-mock-req-res';
import { Request, Response } from 'express';

/*****************************************
 JWT
 ****************************************/
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mockedToken'),
}));

jest.mock('../../src/models/User');
jest.mock('bcryptjs');

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe("JWT - Token creation logic", () => {
    test("JWT is called with the correct parameters", () => {
        const mockId = '12345';
        const jwtSecret = process.env.JWT_SECRET as string;

        tokenUtils.createToken(mockId);

        expect(jwt.sign).toHaveBeenCalledWith(
            { _id: mockId },
            jwtSecret,
            { expiresIn: '10d' }
        );
    });

    test("Token contains the correct payload (_id and expiration)", () => {
        const mockId = '12345';
        const jwtSecret = process.env.JWT_SECRET as string;

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

        expect(() => tokenUtils.createToken('12345')).toThrow('JWT failed');
    });
});

/*****************************************
 REGISTER
 ****************************************/

describe("REGISTER - Success", () => {
    test("Creates a new user when valid email & password are provided", async () => {
        const mockEmail = "test@example.com";
        const mockPassword = "SecurePassword123!";
        const mockHashedPassword = "hashedPassword";

        const req = mockRequest({
            body: { email: mockEmail, password: mockPassword }
        });

        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue(null); 
        (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
        (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);

        await registerUser(req, res, jest.fn());

        expect(User.findOne).toHaveBeenCalledWith({ email: mockEmail });

        expect(bcrypt.genSalt).toHaveBeenCalled();
        expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, "salt");

        expect(User.create).toHaveBeenCalledWith({
            email: mockEmail,
            password: mockHashedPassword
        });
    });

    test("Generates a valid token for new user", async () => {
        const mockUserId = "12345";
        const mockEmail = "test@example.com";

        const req = mockRequest({
            body: { email: mockEmail, password: "SecurePassword123!" }
        });
        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ _id: mockUserId, email: mockEmail });
        (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

        jest.spyOn(tokenUtils, 'createToken').mockReturnValue('mockedToken');

        await registerUser(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            email: mockEmail,
            token: "mockedToken"
        });
    });

    test("Returns a 200 status code", async () => {
        const mockEmail = "test@example.com";
        const mockUserId = "12345";

        const req = mockRequest({
            body: { email: mockEmail, password: "SecurePassword123!" }
        });
        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ _id: mockUserId, email: mockEmail });
        (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

        jest.spyOn(tokenUtils, 'createToken').mockReturnValue('mockedToken');

        await registerUser(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test("Ensures bcrypt salt and hash functions are called correctly", async () => {
        const mockPassword = "SecurePassword123!";
        const mockHashedPassword = "hashedPassword";

        const req = mockRequest({
            body: { email: "test@example.com", password: mockPassword }
        });
        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue(null);
        (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
        (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
        (User.create as jest.Mock).mockResolvedValue({ _id: "12345", email: "test@example.com" });

        await registerUser(req, res, jest.fn());

        expect(bcrypt.genSalt).toHaveBeenCalled();
        expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, "salt");
    });
    
    test("Return a valid JWT token and correct email", async () => {
        const mockEmail = "test@example.com";
        const mockUserId = "12345";

        const req = mockRequest({
            body: { email: mockEmail, password: "SecurePassword123!" }
        });
        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ _id: mockUserId, email: mockEmail });
        (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

        jest.spyOn(tokenUtils, 'createToken').mockReturnValue('mockedToken');

        await registerUser(req, res, jest.fn());

        expect(res.json).toHaveBeenCalledWith({
            email: mockEmail,
            token: "mockedToken"
        });
    });

    test("Ensures next() is not called on successful registration", async () => {
        const mockEmail = "test@example.com";

        const req = mockRequest({
            body: { email: mockEmail, password: "SecurePassword123!" }
        });
        const res = mockResponse();
        const next = jest.fn();

        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ _id: "12345", email: mockEmail });
        (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
        jest.spyOn(tokenUtils, "createToken").mockReturnValue("mockedToken");

        await registerUser(req, res, next);

        expect(next).not.toHaveBeenCalled();
    });
});

describe("REGISTER - Check for missing fields", () => {
    test("400 status if email is missing", async () => {
        const req = mockRequest({
            body: { password: "SecurePassword123!" } // No email
        });
        const res = mockResponse();

        await registerUser(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "All fields are required" });
    });

    test("400 status if password is missing", async () => {
        const req = mockRequest({
            body: { email: "test@example.com" } // No password
        });
        const res = mockResponse();

        await registerUser(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "All fields are required" });
    });
    
    test("Error message when field is missing", async () => {
        const req = mockRequest({
            body: {} // No email, no password
        });
        const res = mockResponse();

        await registerUser(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "All fields are required" });
    });

});

describe("REGISTER - Email already exists", () => {
    test("400 status if email exists", async () => {
        const mockEmail = "test@example.com";
        const req = mockRequest({
            body: { email: mockEmail, password: "SecurePassword123!" }
        });
        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue({ email: mockEmail });

        await registerUser(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("Email is already in use error message", async () => {
        const mockEmail = "test@example.com";
        const req = mockRequest({
            body: { email: mockEmail, password: "SecurePassword123!" }
        });
        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue({ email: mockEmail });

        await registerUser(req, res, jest.fn());

        expect(res.json).toHaveBeenCalledWith({ error: "Email is already in use" });
    });
});

describe("REGISTER - Error handling", () => {
    test("Database failure returns 500 status and error message", async () => {
        const mockEmail = "test@example.com";
        const mockPassword = "SecurePassword123!";
        const req = mockRequest({
            body: { email: mockEmail, password: mockPassword }
        });
        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue(null);

        (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

        (User.create as jest.Mock).mockRejectedValue(new Error("Database error"));

        await registerUser(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });


    test('registerUser handles createtoken throwing an error', async () => {
        const req = mockRequest({
            body: { email: 'test@example.com', password: 'password' }
          });
    
        const res = mockResponse();
    
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ _id: '12345', email: 'test@example.com' });
        (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

    
        jest.spyOn(tokenUtils, 'createToken').mockImplementation(() => {
            throw new Error('JWT failed');
        });
    
        await registerUser(req, res, jest.fn());
    
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'JWT failed' });
    });
});

/*****************************************
 LOGIN
 ****************************************/
describe("LOGIN - Success", () => {
    test("200 status when email and password are correct", async () => {
        const mockEmail = "test@example.com";
        const mockPassword = "SecurePassword123!";
        const mockUserId = "12345";
        const mockHashedPassword = "hashedPassword";

        const req = mockRequest({
            body: { email: mockEmail, password: mockPassword }
        });
        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue({
            _id: mockUserId,
            email: mockEmail,
            password: mockHashedPassword,
        });

        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        jest.spyOn(tokenUtils, 'createToken').mockReturnValue('mockedToken');

        await loginUser(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(200);
    });

     test("Returns valid JWT and email", async () => {
        const mockEmail = "test@example.com";
        const mockUserId = "12345";
        const mockHashedPassword = "hashedPassword";

        const req = mockRequest({
            body: { email: mockEmail, password: "SecurePassword123!" }
        });
        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue({
            _id: mockUserId,
            email: mockEmail,
            password: mockHashedPassword,
        });

        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        jest.spyOn(tokenUtils, 'createToken').mockReturnValue('mockedToken');

        await loginUser(req, res, jest.fn());

        expect(res.json).toHaveBeenCalledWith({
            email: mockEmail,
            token: 'mockedToken',
        });
    });
});

describe("LOGIN - Missing Fields", () => {
    test("400 status if email is missing", async () => {
        const req = mockRequest({
            body: { password: "SecurePassword123!" } // No email
        });
        const res = mockResponse();

        await loginUser(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "All fields are required." });
    });

    test("400 status if password is missing", async () => {
        const req = mockRequest({
            body: { email: "test@example.com" } // No password
        });
        const res = mockResponse();

        await loginUser(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "All fields are required." });
    });
    
    test("Returns error message if field is missing", async () => {
        const req = mockRequest({
            body: {} // No email, no password
        });
        const res = mockResponse();

        await loginUser(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "All fields are required." });
    });
});

describe("LOGIN - Incorrect Email", () => {
    test("400 status when email is not found", async () => {
        const req = mockRequest({
            body: { email: "nonexistent@example.com", password: "SecurePassword123!" }
        });
        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue(null);

        await loginUser(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Incorrect email" });
    });

    test("Incorrect email error message", async () => {
        const req = mockRequest({
            body: { email: "nonexistent@example.com", password: "SecurePassword123!" }
        });
        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue(null);

        await loginUser(req, res, jest.fn());

        expect(res.json).toHaveBeenCalledWith({ error: "Incorrect email" });
    });
});

describe("LOGIN - Incorrect Password", () => {
    test("400 status when password does not match", async () => {
        const req = mockRequest({
            body: { email: "test@example.com", password: "WrongPassword123!" }
        });
        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue({
            _id: "12345",
            email: "test@example.com",
            password: "hashedPassword" 
        });

        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await loginUser(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test("Incorrect password error message", async () => {
        const req = mockRequest({
            body: { email: "test@example.com", password: "WrongPassword123!" }
        });
        const res = mockResponse();
        (User.findOne as jest.Mock).mockResolvedValue({
            _id: "12345",
            email: "test@example.com",
            password: "hashedPassword" 
        });

        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await loginUser(req, res, jest.fn());

        expect(res.json).toHaveBeenCalledWith({ error: "Incorrect password" });
    });
});

describe("LOGIN - Error Handling", () => {
    test("Token creation failure returns 500 status and error message", async () => {
        const req = mockRequest({
            body: { email: 'test@example.com', password: 'password' }
        });

        const res = mockResponse();

        (User.findOne as jest.Mock).mockResolvedValue({
            _id: '12345',
            email: 'test@example.com',
            password: 'hashedPassword',
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