import { prisma } from '../../config/database';
import { userRepository } from '../../repositories';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export const loginService = {
  async authenticate(email: string, password: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return { ok: false, error: 'Invalid email or password' };
      }

      if (!user.isActive) {
        return { ok: false, error: 'Account is deactivated. Please contact administrator.' };
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return { ok: false, error: 'Invalid email or password' };
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        env.auth.jwtSecret,
        { expiresIn: '24h' }
      );

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      return {
        ok: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            dealerId: user.dealerId,
          },
        },
      };
    } catch (error: any) {
      console.error('[LOGIN ERROR]', error.message);
      return { ok: false, error: 'Login failed. Please try again.' };
    }
  },

  async verifyToken(token: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const decoded = jwt.verify(token, env.auth.jwtSecret) as any;
      const user = await userRepository.findById(decoded.id);
      if (!user || !user.isActive) {
        return { ok: false, error: 'Invalid token' };
      }
      return { ok: true, data: user };
    } catch (error: any) {
      return { ok: false, error: 'Invalid or expired token' };
    }
  },
};
