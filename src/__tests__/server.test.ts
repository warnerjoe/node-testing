import app from "../app";
import http from "http";

test("Should start the server without crashing", () => {
    const mockServer = {} as http.Server;

    const mockListen = jest.spyOn(app, "listen").mockImplementation(() => {
        console.log("Mock server started");
        return mockServer; 
    });

    require("../server"); 

    expect(mockListen).toHaveBeenCalled();
    mockListen.mockRestore();
});
