export const mockId = '12345';
export const mockEmail = 'test@example.com';
export const mockPassword = 'SecurePassword123!';
export const mockHashedPassword = 'hashedPassword';

process.env.JWT_SECRET = "testsecret";
export const jwtSecret = process.env.JWT_SECRET as string;

export const mockUser = {
    _id: mockId,
    email: mockEmail,
    password: mockHashedPassword,
};