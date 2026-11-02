import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '#modules/user/user.service.js';
import { UserRepository } from '#modules/user/user.repository.js';
import { NotFoundError, ForbiddenError } from '#errors/index.js';


describe('UserService (Unit Tests)', () => {
  let userService: UserService;
  let mockUserRepo: Partial<UserRepository>;

  beforeEach(() => {
    mockUserRepo = {
      findById: vi.fn(),
      findPaginated: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
      softDeleteById: vi.fn(),
    };
    userService = new UserService(mockUserRepo as UserRepository);
  });

  describe('getUserById', () => {
    it('should throw NotFoundError if user does not exist', async () => {
      vi.mocked(mockUserRepo.findById!).mockResolvedValue(null);

      await expect(userService.getUserById('64e72f3bb6dc7b001f2a8c12')).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if user is soft-deleted', async () => {
      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        deletedAt: new Date(),
      };
      vi.mocked(mockUserRepo.findById!).mockResolvedValue(mockUser as any);

      await expect(userService.getUserById('64e72f3bb6dc7b001f2a8c12')).rejects.toThrow(NotFoundError);
    });

    it('should return user when found', async () => {
      const mockUser = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        name: 'Jane Doe',
        email: 'jane@example.com',
        toSafeObject: () => ({ _id: '64e72f3bb6dc7b001f2a8c12', name: 'Jane Doe' }),
      };
      vi.mocked(mockUserRepo.findById!).mockResolvedValue(mockUser as any);

      const result = await userService.getUserById('64e72f3bb6dc7b001f2a8c12');
      expect(result.name).toBe('Jane Doe');
    });
  });

  describe('listUsers', () => {
    it('should filter by status and query search', async () => {
      vi.mocked(mockUserRepo.findPaginated!).mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
      });

      const result = await userService.listUsers({
        page: 1,
        limit: 10,
        status: 'active',
        search: 'Demo',
      });

      expect(result.data).toBeDefined();
      expect(mockUserRepo.findPaginated).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: null,
          status: 'active',
          $or: expect.any(Array),
        }),
        expect.anything()
      );
    });
  });

  describe('updateUser', () => {
    it('should forbid user from updating another user account', async () => {
      const userPayload = {
        userId: '64e72f3bb6dc7b001f2a8c12',
        email: 'user1@example.com',
      };

      await expect(
        userService.updateUser('64e72f3bb6dc7b001f2a8c99', { name: 'Hacked' }, userPayload)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow user to update their own account', async () => {
      const userPayload = {
        userId: '64e72f3bb6dc7b001f2a8c12',
        email: 'user1@example.com',
      };

      const mockUpdated = {
        _id: '64e72f3bb6dc7b001f2a8c12',
        name: 'Updated Name',
      };
      vi.mocked(mockUserRepo.updateById!).mockResolvedValue(mockUpdated as any);

      const result = await userService.updateUser('64e72f3bb6dc7b001f2a8c12', { name: 'Updated Name' }, userPayload);
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('deleteUser', () => {
    it('should throw ForbiddenError when user tries to delete another user account', async () => {
      const userPayload = {
        userId: '64e72f3bb6dc7b001f2a8c12',
        email: 'user1@example.com',
      };

      await expect(
        userService.deleteUser('64e72f3bb6dc7b001f2a8c99', userPayload)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should perform soft-delete when owner deletes own account', async () => {
      const userPayload = {
        userId: '64e72f3bb6dc7b001f2a8c12',
        email: 'user1@example.com',
      };

      vi.mocked(mockUserRepo.softDeleteById!).mockResolvedValue({
        _id: '64e72f3bb6dc7b001f2a8c12',
        deletedAt: new Date(),
        status: 'inactive',
      } as any);

      await expect(
        userService.deleteUser('64e72f3bb6dc7b001f2a8c12', userPayload)
      ).resolves.toBeUndefined();

      expect(mockUserRepo.softDeleteById).toHaveBeenCalledWith('64e72f3bb6dc7b001f2a8c12');
    });
  });
});
