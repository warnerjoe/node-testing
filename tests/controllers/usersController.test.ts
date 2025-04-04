import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../src/models/User';
import * as tokenUtils from '../../src/utils/tokenUtils';
import { mockUserCreate } from '../helpers/testHelpers';

process.env.JWT_SECRET = "testsecret";
const jwtSecret = process.env.JWT_SECRET as string;
const mockId = '12345';

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