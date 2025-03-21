/*****************************************
 JWT
 ****************************************/
 describe("Token creation logic", () => {
    test.todo("JWT is called with the correct parameters");
    test.todo("Token contains the correct payload (_id and expiration)");
    test.todo("Handles jwt.sign throwing an error gracefully");
})

/*****************************************
 REGISTER
 ****************************************/

describe("Successful registration", () => {
    test.todo("Creates a new user when valid email & password are provided.");
    test.todo("Returns a 200 status code");
    test.todo("Return a valid JWT token and correct email");
})

describe("Check for missing fields", () => {
    test.todo("400 status if email is missing");
    test.todo("400 status if password is missing");
    test.todo("Error message when field is missing");
})

describe("Email already exists", () => {
    test.todo("400 status if email exists");
    test.todo("Email is already in use error message");
})

describe("Error handling", () => {
    test.todo("Database failure returns 500 status and error message");
})

/*****************************************
 LOGIN
 ****************************************/
 describe("Successful Login", () => {
    test.todo("200 status when email and password are correct");
    test.todo("Returns valid JWT and email");
})

describe("Missing Fields", () => {
    test.todo("400 status if email is missing");
    test.todo("400 status if password is missing");
    test.todo("Returns error message if field is missing");
})

describe("Incorrect Email", () => {
    test.todo("400 status when email is not found");
    test.todo("Incorrect email error message");
})

describe("Incorrect Password", () => {
    test.todo("400 status when password does not match");
    test.todo("Incorrect password error message");
})

describe("Error Handling", () => {
    test.todo("Token creation failure returns 500 status and error message");
})