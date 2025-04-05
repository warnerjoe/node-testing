import User from '../../src/models/User';
import bcrypt from 'bcryptjs';
import { mockUser, mockId, mockHashedPassword, mockEmail } from '../helpers/testConstants';
import { buildReqRes } from '../helpers/testHelpers';

export const registerUserMock = jest.fn((req, res) => res.status(200).json({ message: 'Mocked registerUser' }));
export const loginUserMock = jest.fn((req, res) => res.status(200).json({ message: 'Mocked loginUser' }));

export const mockUsersController = {
  registerUser: registerUserMock,
  loginUser: loginUserMock,
};

export const mockUserCreate = (User: any, bcrypt: any, email: string = 'test@example.com', password: string = 'SecurePassword123!') => {
  (User.findOne as jest.Mock).mockResolvedValue(null);  
  (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");  
  (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);  
  (User.create as jest.Mock).mockResolvedValue({ _id: mockId, email });
};

export const mockSuccessfulLogin = () => {
  (User.findOne as jest.Mock).mockResolvedValue(mockUser);
  (bcrypt.compare as jest.Mock).mockResolvedValue(true);
};

export const mockUserFound = (user: any) => {
  (User.findOne as jest.Mock).mockResolvedValue(user);
};

export const mockPasswordMatch = (match: boolean) => {
  (bcrypt.compare as jest.Mock).mockResolvedValue(match);
};

export const mockLoginSetup = (email?: string, password?: string, user?: any) => {
  const { req, res } = buildReqRes({ email, password });
  const mockUser = user || (email ? { _id: mockId, email, password: mockHashedPassword } : null);
  
  if (mockUser) {
    mockUserFound(mockUser);
  }

  if (email && password) {
    mockPasswordMatch(true);
  }

  return { req, res };
};

export const mockEmailAlreadyExists = () => {
    (User.findOne as jest.Mock).mockResolvedValue({ email: mockEmail });
};