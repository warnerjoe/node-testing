import jwt from 'jsonwebtoken';

export const createToken = (_id: string): string => {
    return jwt.sign({ _id }, process.env.JWT_SECRET as string, { expiresIn: '10d' });
};