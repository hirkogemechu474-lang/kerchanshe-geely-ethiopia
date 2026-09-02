import { csiSurveyRepository } from '../../repositories';
import { sendEmail } from '../email/smtp';

export const csiSurveyService = {
  async getEligibility(jobCardId: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const jobCard = await csiSurveyRepository.findJobCardForEligibility(jobCardId);
      if (!jobCard) return { ok: false, error: 'Job card not found.' };

      if (jobCard.status !== 'INVOICED_CLOSED') {
        return { ok: false, error: 'Survey is only available for completed job cards.' };
      }

      if (jobCard.csiSurveyResponse) {
        return { ok: false, error: 'Survey has already been submitted for this job card.' };
      }

      return {
        ok: true,
        data: {
          jobCardNo: jobCard.jobCardNo,
          vehicleModel: jobCard.vehicleModel,
          customerName: jobCard.customerName,
        },
      };
    } catch (error: any) {
      return { ok: false, error: 'Failed to check survey eligibility.' };
    }
  },

  async submit(jobCardId: string, rating: number, comment: string | null): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const jobCard = await csiSurveyRepository.findJobCardForSubmit(jobCardId);
      if (!jobCard) return { ok: false, error: 'Job card not found.' };

      if (jobCard.status !== 'INVOICED_CLOSED') {
        return { ok: false, error: 'Survey is only available for completed job cards.' };
      }

      const response = await csiSurveyRepository.createResponse(jobCardId, rating, comment);

      if (jobCard.customerEmail) {
        await sendEmail({
          to: jobCard.customerEmail,
          subject: 'Thank You for Your Feedback',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a2e;">Thank You for Your Feedback</h2>
              <p>Dear ${jobCard.customerName},</p>
              <p>We appreciate you taking the time to complete our customer satisfaction survey for job card <strong>${jobCard.jobCardNo}</strong>.</p>
              <p>Your feedback helps us improve our service.</p>
            </div>
          `,
        });
      }

      return { ok: true, data: response };
    } catch (error: any) {
      console.error('[CSI SURVEY SUBMIT ERROR]', error.message);
      return { ok: false, error: 'Failed to submit survey.' };
    }
  },
};
