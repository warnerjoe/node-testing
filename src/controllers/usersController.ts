import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import 'dotenv/config.js';

interface UserBody {
  email: string;
  password: string;
}

/*************************** CREATE JSON WEB TOKEN ***************************/

const createToken = (_id: string): string => {
  return jwt.sign({ _id }, process.env.JWT_SECRET as string, { expiresIn: '10d' });
};

/*************************** REGISTER USER ***************************/

const registerUser: RequestHandler<{}, {}, UserBody> = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  };

  const exist = await User.findOne({ email });
  if (exist) {
    res.status(400).json({ error: 'Email is already in use' });
    return;
  };

  const salt = await bcrypt.genSalt();
  const hashed = await bcrypt.hash(password, salt);

  try {
    const user = await User.create({ email, password: hashed });

    const token = createToken(user._id.toString());

    res.status(200).json({ email, token });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'JWT failed' });
    };
  };
};

/*************************** LOGIN USER ***************************/

const loginUser: RequestHandler<{}, {}, { email: string; password: string }> = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'All fields are required.' });
    return;
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(400).json({ error: 'Incorrect email' });
    return;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    res.status(400).json({ error: 'Incorrect password' });
    return;
  }

  try {
    const token = createToken(user._id.toString());
    res.status(200).json({ email, token });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred.' });
    }
  }
};

export { registerUser, loginUser, createToken};
