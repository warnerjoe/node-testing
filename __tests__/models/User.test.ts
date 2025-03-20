import User from '../../src/models/User';

describe("User Model - Valid User", () => {
  it("should save a valid user successfully", async () => {
    const validUser = new User({
      email: "test@example.com",
      password: "secret123",
    });

    const savedUser = await validUser.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe("test@example.com");
    expect(savedUser.createdAt).toBeDefined();
    expect(savedUser.updatedAt).toBeDefined();
  });
});
