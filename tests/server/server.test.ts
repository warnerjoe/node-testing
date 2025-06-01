import { startServer } from "../../src/server/server";
import app from "../../src/server/app";
import http from "http";
import mongoose from "mongoose";

jest.mock("mongoose");

test("Should start the server and connect to DB without crashing", async () => {
    const mockServer = {} as unknown as http.Server;

    const connectMock = mongoose.connect as jest.Mock;
    connectMock.mockResolvedValueOnce({});

    const mockListen = jest
        .spyOn(app, "listen")
        .mockImplementation(() => {
            console.log("Mock server started");
            return mockServer;
        });

    await startServer();

    expect(mongoose.connect).toHaveBeenCalled();
    expect(mockListen).toHaveBeenCalled();

    mockListen.mockRestore();
});

afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
});
