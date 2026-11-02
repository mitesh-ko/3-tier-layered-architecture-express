import { JobRegistry } from './job-registry.js';
import {
  WelcomeEmailHandler,
  EmailVerificationHandler,
  PasswordResetEmailHandler,
} from './handlers/email.handler.js';

// Auto-register built-in core handlers
JobRegistry.register(new WelcomeEmailHandler());
JobRegistry.register(new EmailVerificationHandler());
JobRegistry.register(new PasswordResetEmailHandler());

export * from './job.types.js';
export * from './job-registry.js';
export * from './job-dispatcher.js';
export * from './job-worker.js';
export * from './handlers/email.handler.js';
