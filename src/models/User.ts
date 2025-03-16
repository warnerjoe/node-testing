import { Schema, model } from 'mongoose';

interface IUser {
    email: string;
    username: string;
    password: string;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        }
    },
    { timestamps: true }
);

const User = model<IUser>("User", UserSchema);

export default User;