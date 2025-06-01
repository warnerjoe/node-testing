import express from 'express';
import { registerUser, loginUser } from '../controllers/usersController';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

const usersRouter = router;
export default usersRouter;
