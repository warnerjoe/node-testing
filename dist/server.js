"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_1 = __importDefault(require("path"));
// import { userRoutes } from './routes/usersRoutes'
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, 'config/.env') });
app_1.default.use(express_1.default.json());
// app.use("/users", userRoutes);
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGO_URI, { dbName: "dev_db" });
        console.log("Database is connected and ");
        const server = app_1.default.listen(process.env.PORT, () => {
            console.log(`we online at port ${process.env.PORT}`);
        });
        return server;
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error) {
            console.error("Mongoose Error: ", error.message);
        }
        else if (error instanceof Error) {
            console.error("Error", error.message);
        }
        else {
            console.error("Unknown Error", error);
        }
        process.exit(1);
    }
});
exports.startServer = startServer;
if (process.env.NODE_ENV !== "test") {
    (0, exports.startServer)();
}
