import bcrypt from 'bcryptjs';
import { userRepository } from '@/repositories/userRepository';
import { sendFormEmail } from '@/lib/form-email';

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; httpStatus: 400 | 409; error: string };

/**
 * Register a new customer account.
 * Note: Admin users should be created through the admin panel, not public
 * registration.
 */
export async function registerCustomer(body: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  city?: string;
  acceptTerms: boolean;
}): Promise<RegisterResult> {
  const { firstName, lastName, email, phone, password, city, acceptTerms } = body;

  if (!firstName || !lastName || !email || !phone || !password || !city) {
    return { ok: false, httpStatus: 400, error: 'All required fields must be provided' };
  }

  if (!acceptTerms) {
    return { ok: false, httpStatus: 400, error: 'You must accept the terms and conditions' };
  }

  if (password.length < 8) {
    return { ok: false, httpStatus: 400, error: 'Password must be at least 8 characters' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { ok: false, httpStatus: 400, error: 'Invalid email address' };
  }

  const existingUser = await userRepository.findByEmail(email.toLowerCase());
  if (existingUser) {
    return { ok: false, httpStatus: 409, error: 'An account with this email already exists' };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Public registration creates a "customer" role entry — NOT for admin users.
  const user = await userRepository.createCustomer({
    email: email.toLowerCase(),
    name: `${firstName} ${lastName}`,
    passwordHash,
    role: 'customer',
    isActive: true,
  });

  try {
    await sendFormEmail({
      type: 'account registration',
      name: `${firstName} ${lastName}`,
      email: user.email,
      phone,
      subject: `New customer account — ${firstName} ${lastName}`,
      reference: user.id,
      details: `${firstName} ${lastName} created a customer account (${city || 'city not provided'}).`,
    });
  } catch (emailError) {
    console.error('[auth:register:email]', emailError);
  }

  return { ok: true, userId: user.id };
}
