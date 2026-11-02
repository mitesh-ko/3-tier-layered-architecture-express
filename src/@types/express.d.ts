import { JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedUserPayload extends JwtPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: AuthenticatedUserPayload;
    }
  }
}
