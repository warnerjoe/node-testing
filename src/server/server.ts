import app                   from './app';
import dotenv                from 'dotenv';
import express               from 'express';
import { Server }            from 'http';
import mongoose, { connect } from 'mongoose';
import path                  from 'path';

dotenv.config({ path: path.resolve(__dirname, 'config/.env') });

app.use(express.json());

export const startServer = async(): Promise<Server> => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string, { dbName: "dev_db" });
        console.log("Database is connected and ")

        const server = app.listen(process.env.PORT, () => {
            console.log(`we online at port ${process.env.PORT}`)
        });

        return server;
    } catch (error: unknown) {
        if (error instanceof mongoose.Error) {
            console.error("Mongoose Error: ", error.message)
        } else if (error instanceof Error) {
            console.error("Error", error.message)
        } else {
            console.error("Unknown Error", error);
        }
        process.exit(1);
    }
}

if (process.env.NODE_ENV !== "test") {
    startServer();
}
