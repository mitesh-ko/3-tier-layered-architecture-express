export default {
    /**
     * @param db {import('mongodb').Db}
     * @param client {import('mongodb').MongoClient}
     * @returns {Promise<void>}
     */
    async up(db, _client) {
        const collections = await db.listCollections({name: 'users'}).toArray();
        const validator = {
            $jsonSchema: {
                bsonType: 'object',
                title: 'UserObject',
                description: 'Scalable schema for user registration, authentication, and addresses',
                required: ['firstName', 'email'],
                properties: {
                    firstName: {
                        bsonType: 'string',
                        description: 'User first name is required',
                    },
                    lastName: {
                        bsonType: 'string',
                        description: 'User last name',
                    },
                    name: {
                        bsonType: 'string',
                        description: 'User full name alias for backwards compatibility',
                    },
                    email: {
                        bsonType: 'string',
                        description: 'User unique email address',
                    },
                    phone: {
                        bsonType: ['string', 'null'],
                        description: 'User phone number for 2FA and delivery notifications',
                    },
                    phoneVerifiedAt: {
                        bsonType: ['date', 'null'],
                        description: 'Timestamp when phone was verified; null if unverified',
                    },
                    password: {
                        bsonType: 'string',
                        description: 'Bcrypt hashed user password',
                    },
                    status: {
                        bsonType: 'string',
                        enum: ['active', 'inactive', 'suspended', 'pending_approval', 'banned'],
                        description: 'Moderation and lifecycle status',
                    },
                    authProvider: {
                        bsonType: 'string',
                        enum: ['local', 'google', 'facebook', 'apple', 'github'],
                        description: 'Authentication provider for OAuth federation',
                    },
                    providerId: {
                        bsonType: ['string', 'null'],
                        description: 'Third-party OAuth provider subject ID',
                    },
                    emailVerifiedAt: {
                        bsonType: ['date', 'null'],
                        description: 'Timestamp when email was verified; null if unverified',
                    },
                    emailVerificationToken: {
                        bsonType: ['string', 'null'],
                        description: 'SHA-256 hashed one-time verification token',
                    },
                    emailVerificationExpires: {
                        bsonType: ['date', 'null'],
                        description: 'Verification token expiry timestamp',
                    },
                    passwordResetToken: {
                        bsonType: ['string', 'null'],
                        description: 'SHA-256 hashed one-time password reset token',
                    },
                    passwordResetExpires: {
                        bsonType: ['date', 'null'],
                        description: 'Password reset token expiry timestamp',
                    },
                    passwordChangedAt: {
                        bsonType: ['date', 'null'],
                        description: 'Timestamp when password was last changed',
                    },
                    profile: {
                        bsonType: 'object',
                        description: 'Embedded structured profile (avatar, bio, dob, gender)',
                    },
                    addresses: {
                        bsonType: 'array',
                        description: 'Array of user addresses (home, work, billing, etc.)',
                    },
                    failedLoginAttempts: {
                        bsonType: 'number',
                        description: 'Consecutive failed login counter for brute-force protection',
                    },
                    lockUntil: {
                        bsonType: ['date', 'null'],
                        description: 'Timestamp until account is locked',
                    },
                    lastLoginAt: {
                        bsonType: ['date', 'null'],
                        description: 'Audit timestamp of last successful login',
                    },
                    lastLoginIp: {
                        bsonType: ['string', 'null'],
                        description: 'Audit IP address of last successful login',
                    },
                    deletedAt: {
                        bsonType: ['date', 'null'],
                        description: 'Soft deletion timestamp for compliance',
                    },
                },
            },
        };

        if (collections.length === 0) {
            await db.createCollection('users', {validator});
        } else {
            await db.command({collMod: 'users', validator});
        }

        const usersCollection = db.collection('users');

        // Ensure indexes exist
        await usersCollection.createIndex({email: 1}, {unique: true});
        await usersCollection.createIndex({phone: 1}, {unique: true, sparse: true});
        await usersCollection.createIndex({status: 1});
        await usersCollection.createIndex({deletedAt: 1, status: 1});
        await usersCollection.createIndex({authProvider: 1, providerId: 1}, {sparse: true});
        await usersCollection.createIndex(
            {emailVerificationToken: 1, emailVerificationExpires: 1},
            {sparse: true}
        );
        await usersCollection.createIndex(
            {passwordResetToken: 1, passwordResetExpires: 1},
            {sparse: true}
        );
    },

    /**
     * @param db {import('mongodb').Db}
     * @param client {import('mongodb').MongoClient}
     * @returns {Promise<void>}
     */
    async down(db, _client) {
        const collections = await db.listCollections({name: 'users'}).toArray();
        if (collections.length > 0) {
            await db.collection('users').drop();
        }
    },
};
