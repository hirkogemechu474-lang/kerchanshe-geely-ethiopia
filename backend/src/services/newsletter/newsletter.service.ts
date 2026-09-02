import { newsletterRepository } from '../../repositories';
import { sendEmail } from '../email/smtp';

export const newsletterService = {
  async subscribe(email: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const subscriber = await newsletterRepository.upsertSubscribed(email);

      await sendEmail({
        to: email,
        subject: 'Welcome to Our Newsletter',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e;">Welcome to Our Newsletter!</h2>
            <p>Thank you for subscribing to our newsletter. You'll receive the latest updates on our vehicles, promotions, and news.</p>
            <p>If you didn't subscribe, you can safely ignore this email.</p>
          </div>
        `,
      });

      return { ok: true, data: subscriber };
    } catch (error: any) {
      console.error('[NEWSLETTER SUBSCRIBE ERROR]', error.message);
      return { ok: false, error: 'Failed to subscribe.' };
    }
  },

  async unsubscribe(email: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const existing = await newsletterRepository.findByEmail(email);
      if (!existing) return { ok: false, error: 'Email not found.' };

      const subscriber = await newsletterRepository.upsertSubscribed(email);
      return { ok: true, data: subscriber };
    } catch (error: any) {
      return { ok: false, error: 'Failed to unsubscribe.' };
    }
  },
};
