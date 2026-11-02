import { userRepository, UserRepository } from './user.repository.js';
import { IUserDocument } from './user.model.js';
import { ListUsersQuery, UpdateUserDto } from './user.schema.js';
import { NotFoundError, ForbiddenError } from '#errors/index.js';
import { CacheService } from '#shared/services/cache.service.js';
import { PaginatedResult } from '#shared/repositories/repository.interface.js';
import { AuthenticatedUserPayload } from '#types/express.js';
import { FilterQuery, UpdateQuery } from 'mongoose';

export class UserService {
  private userRepo: UserRepository;

  constructor(userRepo = userRepository) {
    this.userRepo = userRepo;
  }

  public async getUserById(id: string): Promise<IUserDocument> {
    const cacheKey = `user:${id}`;
    const cached = await CacheService.get<IUserDocument>(cacheKey);
    if (cached) return cached;

    const user = await this.userRepo.findById(id);
    if (!user || user.deletedAt) {
      throw new NotFoundError(`User with ID '${id}' was not found`);
    }

    await CacheService.set(cacheKey, user.toSafeObject(), 300); // 5 min TTL
    return user;
  }

  public async listUsers(query: ListUsersQuery): Promise<PaginatedResult<IUserDocument>> {
    const filter: FilterQuery<IUserDocument> = {
      deletedAt: null,
    };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: 'i' } },
        { lastName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.userRepo.findPaginated(filter, {
      page: query.page,
      limit: query.limit,
      sort: { createdAt: -1 },
    });
  }

  public async updateUser(
    id: string,
    dto: UpdateUserDto,
    currentUser: AuthenticatedUserPayload
  ): Promise<IUserDocument> {
    if (currentUser.userId !== id) {
      throw new ForbiddenError('You can only update your own user profile');
    }

    const updatePayload: UpdateQuery<IUserDocument> = {};

    if (dto.firstName) updatePayload.firstName = dto.firstName;
    if (dto.lastName !== undefined) updatePayload.lastName = dto.lastName;

    if (dto.name && !dto.firstName) {
      const parts = dto.name.trim().split(/\s+/);
      updatePayload.firstName = parts[0] || '';
      updatePayload.lastName = parts.slice(1).join(' ');
    }

    if (dto.phone !== undefined) updatePayload.phone = dto.phone;
    if (dto.status) updatePayload.status = dto.status;

    if (dto.addresses) updatePayload.addresses = dto.addresses;

    if (dto.profile) {
      if (Array.isArray(dto.profile)) {
        // Handle legacy profile array payload
        const avatarItem = dto.profile.find((p) => p.type === 'avatar');
        updatePayload.profile = { avatar: avatarItem?.url || null };
      } else {
        updatePayload.profile = dto.profile;
      }
    }

    const updatedUser = await this.userRepo.updateById(id, updatePayload);
    if (!updatedUser || updatedUser.deletedAt) {
      throw new NotFoundError(`User with ID '${id}' was not found`);
    }

    // Invalidate cached user
    await CacheService.del(`user:${id}`);

    return updatedUser;
  }

  public async deleteUser(id: string, currentUser: AuthenticatedUserPayload): Promise<void> {
    if (currentUser.userId !== id) {
      throw new ForbiddenError('You do not have permission to delete this account');
    }

    const deleted = await this.userRepo.softDeleteById(id);
    if (!deleted) {
      throw new NotFoundError(`User with ID '${id}' was not found`);
    }

    // Invalidate cached user
    await CacheService.del(`user:${id}`);
  }
}

export const userService = new UserService();
