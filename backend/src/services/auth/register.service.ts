import { userRepository } from '../../repositories';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export const registerService = {
  async registerCustomer(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const existing = await userRepository.findByEmail(data.email);
      if (existing) {
        return { ok: false, error: 'Email already registered' };
      }

      const hashedPassword = await bcrypt.hash(data.password, 12);

      const user = await userRepository.create({
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
        role: 'customer',
        isActive: true,
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        env.auth.jwtSecret,
        { expiresIn: '24h' }
      );

      return {
        ok: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      };
    } catch (error: any) {
      console.error('[REGISTER ERROR]', error.message);
      return { ok: false, error: 'Registration failed. Please try again.' };
    }
  },

  async registerUser(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    dealerId?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const existing = await userRepository.findByEmail(data.email);
      if (existing) {
        return { ok: false, error: 'Email already registered' };
      }

      const hashedPassword = await bcrypt.hash(data.password, 12);

      const user = await userRepository.create({
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
        role: data.role,
        isActive: true,
        ...(data.dealerId && { dealerId: data.dealerId }),
      });

      return { ok: true, data: user };
    } catch (error: any) {
      console.error('[REGISTER USER ERROR]', error.message);
      return { ok: false, error: 'User registration failed.' };
    }
  },
};
