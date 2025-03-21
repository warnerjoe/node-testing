export const registerUserMock = jest.fn((req, res) => res.status(200).json({ message: 'Mocked registerUser' }));
export const loginUserMock = jest.fn((req, res) => res.status(200).json({ message: 'Mocked loginUser' }));

const mockUsersController = {
  registerUser: registerUserMock,
  loginUser: loginUserMock,
};

export default mockUsersController;
