import { mockRequest, mockResponse } from 'jest-mock-req-res';
import { Request, Response, NextFunction } from 'express';
import * as tokenUtils from '../../src/utils/tokenUtils'; 
import User from '../../src/models/User';

// Helper function to create user from all of the variables above
export const mockUserCreate = (User: any, bcrypt: any, email: string = 'test@example.com', password: string = 'SecurePassword123!') => {
    (User.findOne as jest.Mock).mockResolvedValue(null);  
    (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");  
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");  
    (User.create as jest.Mock).mockResolvedValue({ _id: '12345', email });
};

// Helper function to take the body in, and return the request and response
export const buildReqRes = (body = {}) => {
    const req = mockRequest({ body });
    const res = mockResponse();
    return { req, res };
};

// Helper function to test a (controller, req, res, status, message) and return an error.
export const expectErrorResponse = async (
    controller: (req: Request, res: Response, next: NextFunction) => void | Promise<void>, 
    req: Request, 
    res: Response, 
    expectedStatus: number, 
    expectedMessage: string
) => {
    await Promise.resolve(controller(req, res, jest.fn())); // Ensure handling both sync/async cases
    expect(res.status).toHaveBeenCalledWith(expectedStatus);
    expect(res.json).toHaveBeenCalledWith({ error: expectedMessage });
};

// Helper function for creating JWT tokens (moved from test files)
export const createMockedToken = (id: string) => {
    return tokenUtils.createToken(id);
};
