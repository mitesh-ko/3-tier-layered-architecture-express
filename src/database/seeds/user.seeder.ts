import bcrypt from 'bcryptjs';
import { UserModel } from '#modules/user/user.model.js';
import { USER_STATUS, AUTH_PROVIDER, ADDRESS_TYPE } from '#constants/user.constant.js';
import { logger } from '#config/logger.config.js';

export interface SeedReport {
  name: string;
  created: number;
  skipped: number;
}

export class UserSeeder {
  public static async seed(reset = false): Promise<SeedReport> {
    if (reset) {
      const deleteResult = await UserModel.deleteMany({});
      logger.info({ deletedCount: deleteResult.deletedCount }, 'Purged existing users for reset');
    }

    const defaultUsers = [
      {
        firstName: 'Super',
        lastName: 'Administrator',
        email: 'admin@example.com',
        phone: '+15550000001',
        phoneVerifiedAt: new Date(),
        emailVerifiedAt: new Date(),
        password: 'Admin@Password123',
        status: USER_STATUS.ACTIVE,
        authProvider: AUTH_PROVIDER.LOCAL,
        profile: {
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
          bio: 'Global platform super administrator',
        },
        addresses: [
          {
            type: ADDRESS_TYPE.WORK,
            isDefault: true,
            fullName: 'Super Administrator',
            phone: '+15550000001',
            street: '100 Innovation Way',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94107',
            country: 'US',
          },
        ],
      },
      {
        firstName: 'Operations',
        lastName: 'Manager',
        email: 'manager@example.com',
        phone: '+15550000002',
        phoneVerifiedAt: new Date(),
        emailVerifiedAt: new Date(),
        password: 'User@Password123',
        status: USER_STATUS.ACTIVE,
        authProvider: AUTH_PROVIDER.LOCAL,
        profile: {
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
          bio: 'Internal operations & system administrator',
        },
        addresses: [
          {
            type: ADDRESS_TYPE.WORK,
            isDefault: true,
            fullName: 'Operations Office',
            phone: '+15550000002',
            street: '200 Corporate Blvd',
            city: 'Austin',
            state: 'TX',
            postalCode: '78701',
            country: 'US',
          },
        ],
      },
      {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'user@example.com',
        phone: '+15550000003',
        phoneVerifiedAt: new Date(),
        emailVerifiedAt: new Date(),
        password: 'User@Password123',
        status: USER_STATUS.ACTIVE,
        authProvider: AUTH_PROVIDER.LOCAL,
        profile: {
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
          bio: 'Standard application user',
        },
        addresses: [
          {
            type: ADDRESS_TYPE.HOME,
            isDefault: true,
            fullName: 'Jane Doe',
            phone: '+15550000003',
            street: '123 Residential Street',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        ],
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const user of defaultUsers) {
      const existing = await UserModel.findOne({ email: user.email });
      if (existing) {
        skipped++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password, 10);
      await UserModel.create({
        ...user,
        password: hashedPassword,
      });
      created++;
    }

    return {
      name: 'UserSeeder',
      created,
      skipped,
    };
  }
}
