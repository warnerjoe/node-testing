import express, { Request, Response } from 'express';
import usersRouter from './routes/usersRoutes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

app.use('/api/users', usersRouter);

export default app;