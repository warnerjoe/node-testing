import jwt from 'jsonwebtoken';
import { createToken } from '../../src/controllers/usersController';
import bcrypt from 'bcryptjs';
import User from '../../src/models/User';
import * as usersController from '../../src/controllers/usersController';
import { registerUser } from '../../src/controllers/usersController';
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

describe("Token creation logic", () => {
    test("JWT is called with the correct parameters", () => {
        const mockId = '12345';
        const jwtSecret = process.env.JWT_SECRET as string;

        createToken(mockId);

        expect(jwt.sign).toHaveBeenCalledWith(
            { _id: mockId },
            jwtSecret,
            { expiresIn: '10d' }
        );
    });

    test("Token contains the correct payload (_id and expiration)", () => {
        const mockId = '12345';
        const jwtSecret = process.env.JWT_SECRET as string;

        createToken(mockId);

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

        expect(() => createToken('12345')).toThrow('JWT failed');
    });
});

/*****************************************
 REGISTER
 ****************************************/

describe("Successful registration", () => {
    test.todo("Creates a new user when valid email & password are provided.");
    test.todo("Returns a 200 status code");
    test.todo("Return a valid JWT token and correct email");
});

describe("Check for missing fields", () => {
    test.todo("400 status if email is missing");
    test.todo("400 status if password is missing");
    test.todo("Error message when field is missing");
});

describe("Email already exists", () => {
    test.todo("400 status if email exists");
    test.todo("Email is already in use error message");
});

describe("Error handling", () => {
    test.todo("Database failure returns 500 status and error message");

    test('registerUser handles createtoken throwing an error', async () => {
        const req = mockRequest({
            body: { email: 'test@example.com', password: 'password' }
          });
    
        const res = mockResponse();
    
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ _id: '12345', email: 'test@example.com' });
        (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    
        jest.spyOn(usersController, 'createToken').mockImplementation(() => {
            throw new Error('Token creation failed');
        });
    
        await registerUser(req, res, jest.fn());
    
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'JWT failed' });
    });
});

/*****************************************
 LOGIN
 ****************************************/
 describe("Successful Login", () => {
    test.todo("200 status when email and password are correct");
    test.todo("Returns valid JWT and email");
});

describe("Missing Fields", () => {
    test.todo("400 status if email is missing");
    test.todo("400 status if password is missing");
    test.todo("Returns error message if field is missing");
});

describe("Incorrect Email", () => {
    test.todo("400 status when email is not found");
    test.todo("Incorrect email error message");
});

describe("Incorrect Password", () => {
    test.todo("400 status when password does not match");
    test.todo("Incorrect password error message");
});

describe("Error Handling", () => {
    test.todo("Token creation failure returns 500 status and error message");
});