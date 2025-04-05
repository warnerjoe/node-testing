import { mockRequest, mockResponse } from 'jest-mock-req-res';
import { Request, Response, NextFunction } from 'express';
import * as tokenUtils from '../../src/utils/tokenUtils'; 

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
    await Promise.resolve(controller(req, res, jest.fn())); 
    expect(res.status).toHaveBeenCalledWith(expectedStatus);
    expect(res.json).toHaveBeenCalledWith({ error: expectedMessage });
};

// Helper function for creating JWT tokens (moved from test files)
export const createMockedToken = (id: string) => {
    return tokenUtils.createToken(id);
};

