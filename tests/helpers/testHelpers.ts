import { mockRequest, mockResponse } from 'jest-mock-req-res';
import { Request, Response, NextFunction } from 'express';
import * as tokenUtils from '../../src/utils/tokenUtils'; 
import { mockEmail, mockPassword } from '../helpers/testConstants';
import bcrypt from 'bcryptjs';

// Helper function to take the body in, and return the request and response
export const buildReqRes = (body = {}) => {
    const req = mockRequest({ body });
    const res = mockResponse();
    return { req, res };
};

export const buildValidReqRes = () => buildReqRes({ email: mockEmail, password: mockPassword })

// Helper function to test a (controller, req, res, status, message) and return an error.
export const expectErrorResponse = async (
    controller: (req: Request, res: Response, next: NextFunction) => void | Promise<void>, 
    req: Request, 
    res: Response, 
    expectedStatus: number, 
    expectedMessage: string
) => {
    await Promise.resolve(controller(req, res, jest.fn())); 
    expect(res.status).toHaveBeenCalledWith(expectedStatus);
    expect(res.json).toHaveBeenCalledWith({ error: expectedMessage });
};

export const expectSuccessfulRegisterRes = (res: any) => {
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
        email: mockEmail,
        token: "mockedToken"
    });
};

export const expectPasswordHashCalled = () => {
    expect(bcrypt.genSalt).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith(mockPassword, "salt");
};

// Helper function for creating mock JWT tokens
export const createMockedToken = (id: string) => {
    return tokenUtils.createToken(id);
};