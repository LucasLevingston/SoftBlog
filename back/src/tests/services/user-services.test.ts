import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import {
  createUserService,
  loginUserService,
  getByUsername,
  getByEmail,
  deleteUserService,
} from '../../services/userService';
import { comparePassword, generateToken, hashPassword } from '../../utils/authUtils';
import prisma from '../../prismaClient';

vi.mock('../../prismaClient', () => ({
  __esModule: true,
  default: {
    user: {
      create: vi.fn().mockResolvedValue({
        id: 'mock-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      }),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../../utils/authUtils', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
  generateToken: vi.fn().mockReturnValue('mock-token'),
}));

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const mockUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  };

  it('should create a user', async () => {
    const hashedPassword = 'hashedpassword';
    (hashPassword as Mock).mockResolvedValue(hashedPassword);
    (prisma.user.create as Mock).mockResolvedValue({
      id: 'mock-id',
      username: mockUser.username,
      email: mockUser.email,
      password: hashedPassword,
    });

    const result = await createUserService(
      mockUser.username,
      mockUser.password,
      mockUser.email
    );
    console.log(result.id);
    expect(result).toEqual({
      id: 'mock-id',
      username: mockUser.username,
      email: mockUser.email,
    });
  });

  it('should login a user', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue({
      id: 'mock-id',
      username: mockUser.username,
      email: mockUser.email,
      password: 'hashedpassword',
    });
    (comparePassword as Mock).mockResolvedValue(true);
    (generateToken as Mock).mockReturnValue('mock-token');

    const result = await loginUserService(mockUser.email, mockUser.password);

    expect(result).toEqual({
      user: {
        email: mockUser.email,
        id: 'mock-id',
        username: mockUser.username,
      },
      token: 'mock-token',
    });
  });

  it('should get a user by username', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser);

    const user = await getByUsername(mockUser.username);
    expect(user).toEqual(mockUser);
  });

  it('should get a user by email', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser);

    const user = await getByEmail(mockUser.email);
    expect(user).toEqual(mockUser);
  });

  it('should delete a user', async () => {
    (prisma.user.findUnique as Mock).mockResolvedValue(mockUser);
    (prisma.user.delete as Mock).mockResolvedValue(mockUser);

    const user = await deleteUserService('1');
    expect(user).toEqual(mockUser);
  });
});
