'use client';

import { useEffect, useState, use } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Star, Send, CheckCircle, XCircle } from 'lucide-react';

type EligibilityState =
  | { phase: 'loading' }
  | { phase: 'ineligible'; reason: 'not_found' | 'not_closed' | 'already_submitted' }
  | { phase: 'ready'; jobCardNo: string; vehicleModel: string | null; customerName: string }
  | { phase: 'submitted' };

export default function CsiSurveyPage({ params }: { params: Promise<{ jobCardId: string }> }) {
  const { jobCardId } = use(params);
  const [state, setState] = useState<EligibilityState>({ phase: 'loading' });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/csi-survey/${jobCardId}`)
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !data.eligible) {
          setState({ phase: 'ineligible', reason: data.reason || 'not_found' });
          return;
        }
        setState({ phase: 'ready', jobCardNo: data.jobCardNo, vehicleModel: data.vehicleModel, customerName: data.customerName });
      })
      .catch(() => setState({ phase: 'ineligible', reason: 'not_found' }));
  }, [jobCardId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/csi-survey/${jobCardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setState({ phase: 'submitted' });
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="py-16 bg-ice min-h-[60vh]">
        <div className="max-w-xl mx-auto px-4">
          {state.phase === 'loading' && (
            <div className="text-center text-steel py-16">Loading…</div>
          )}

          {state.phase === 'ineligible' && (
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-navy mb-3">
                {state.reason === 'already_submitted' ? 'Already submitted' : 'Survey unavailable'}
              </h1>
              <p className="text-steel">
                {state.reason === 'already_submitted' &&
                  "We've already received your feedback for this visit — thank you!"}
                {state.reason === 'not_closed' &&
                  "This service visit hasn't been marked as complete yet. Please check back once your vehicle has been picked up."}
                {state.reason === 'not_found' && "We couldn't find a survey for this link."}
              </p>
            </div>
          )}

          {state.phase === 'submitted' && (
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-navy mb-3">Thank you!</h1>
              <p className="text-steel">Your feedback helps us improve our service.</p>
            </div>
          )}

          {state.phase === 'ready' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h1 className="text-2xl font-bold text-navy mb-1">How was your service visit?</h1>
              <p className="text-steel text-sm mb-6">
                Job {state.jobCardNo}
                {state.vehicleModel ? ` · ${state.vehicleModel}` : ''}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Overall rating *</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                        aria-label={`${star} star${star === 1 ? '' : 's'}`}
                      >
                        <Star
                          size={36}
                          className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300'}
                        />
                      </button>
                    ))}
                    {rating > 0 && <span className="ml-2 text-lg font-semibold text-navy">{rating}/5</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Anything you&apos;d like to tell us? (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="Tell us about your experience…"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-geely-blue text-white px-8 py-4 rounded-lg font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
