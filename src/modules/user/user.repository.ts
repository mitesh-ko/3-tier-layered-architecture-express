import { BaseRepository } from '#shared/repositories/base.repository.js';
import { IUserDocument, UserModel } from './user.model.js';
import { DateUtil } from '#shared/utils/date.util.js';

export class UserRepository extends BaseRepository<IUserDocument> {
  constructor() {
    super(UserModel);
  }

  public async findByEmail(email: string): Promise<IUserDocument | null> {
    return this.findOne({ email: email.toLowerCase().trim(), deletedAt: null });
  }

  public async findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
    return this.model.findOne({ email: email.toLowerCase().trim() }).select('+password').exec();
  }

  public async existsByEmail(email: string): Promise<boolean> {
    return this.exists({ email: email.toLowerCase().trim(), deletedAt: null });
  }

  public async findByPhone(phone: string): Promise<IUserDocument | null> {
    return this.findOne({ phone: phone.trim(), deletedAt: null });
  }

  public async findByProvider(provider: string, providerId: string): Promise<IUserDocument | null> {
    return this.findOne({ authProvider: provider, providerId, deletedAt: null });
  }

  public async findByEmailVerificationToken(tokenHash: string): Promise<IUserDocument | null> {
    return this.model
      .findOne({
        emailVerificationToken: tokenHash,
        emailVerificationExpires: { $gt: DateUtil.nowUTC() },
        deletedAt: null,
      })
      .select('+emailVerificationToken +emailVerificationExpires')
      .exec();
  }

  public async findByPasswordResetToken(tokenHash: string): Promise<IUserDocument | null> {
    return this.model
      .findOne({
        passwordResetToken: tokenHash,
        passwordResetExpires: { $gt: DateUtil.nowUTC() },
        deletedAt: null,
      })
      .select('+passwordResetToken +passwordResetExpires')
      .exec();
  }

  public async softDeleteById(id: string): Promise<IUserDocument | null> {
    return this.updateById(id, {
      deletedAt: DateUtil.nowUTC(),
      status: 'inactive',
    });
  }
}

export const userRepository = new UserRepository();
