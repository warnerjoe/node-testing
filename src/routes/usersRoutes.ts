import express from 'express';
import { registerUser, loginUser } from '../controllers/usersController';

const router = express.Router();

router.post('/', registerUser);
router.post('/login', loginUser);

export { router as usersRoutes };