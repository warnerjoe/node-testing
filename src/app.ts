import express, { Request, Response } from 'express';

const app = express();

// Define routes
app.get('/', (req: Request, res: Response) => {
    res.send("Hello world!");
});

export default app;