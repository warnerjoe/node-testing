import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config.js';

/*************************** CREATE JSON WEB TOKEN ***************************/

const createToken = (_id) => {
    // Create a new signature
    return jwt.sign({ _id }, process.env.JWT_SECRET, { expiresIn: "10d" });
}

/*************************** REGISTER USER ***************************/

const registerUser = async (req: Request, res: Response) => {
    // Retrieve data from request body
    const { email, password } = req.body;

    // Make sure no field is empty
    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    // Check if the email is already in the database
    const exist = await User.findOne({ email });
    if (exist) {
        return res.status(400).json({ error: "Email is already in use" });
    }

    // Password hashing
    const salt = await bcrypt.genSalt();
    const hashed = await bcrypt.hash(password, salt);

    try {
        // Register user
        const user = await User.create({ email, password: hashed });

        // Create JSON Web Token
        const token = createToken(user._id);

        // Send a response
        res.status(200).json({ email, token });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/*************************** LOGIN USER ***************************/

const loginUser = async (req: Request, res: Response) => {
    // Get data from request body
    const { email, password } = req.body;

    // Confirm the fields are not empty
    if (!email || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    // Check if the email exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ error: "Incorrect email" });
    }

    // Check the password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(400).json({ error: "Incorrect password" });
    }

    try {
        // Create JSON Web Token
        const token = createToken(user._id);
        
        res.status(200).json({ email, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export { registerUser, loginUser };