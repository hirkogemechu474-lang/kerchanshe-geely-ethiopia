import { messageRepository } from '@/repositories/messageRepository';
import { sendFormEmail } from '@/lib/form-email';

export async function submitContactMessage(data: any) {
  const message = await messageRepository.create({
    from: data.name || data.from || 'Website visitor',
    email: data.email,
    subject: data.subject || 'Website enquiry',
    category: data.category || data.type || 'General',
    content: data.message || data.content || '',
    status: 'unread',
    priority: data.priority || 'medium',
  });

  let notificationSent = false;
  try {
    notificationSent = await sendFormEmail({
      type: 'message',
      name: data.name || data.from || 'Website visitor',
      email: data.email,
      phone: data.phone,
      subject: data.subject || 'Website enquiry',
      reference: message.id,
      details: data.message || data.content || '',
    });
  } catch (emailError) {
    console.error('[message:email]', emailError);
  }

  return { message, notificationSent };
}
