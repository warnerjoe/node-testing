import { startServer } from "../server";
import app from "../app";
import http from "http";

test("Should start the server without crashing", async () => {
  const mockServer = {} as unknown as http.Server;

  const mockListen = jest
    .spyOn(app, "listen")
    .mockImplementation(() => {
      console.log("Mock server started");
      return mockServer;
    });

  await startServer();

  expect(mockListen).toHaveBeenCalled();
  mockListen.mockRestore();
});
