'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Car,
  ClipboardCheck,
  CreditCard,
  Headphones,
  HeartHandshake,
  History,
  Mail,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react';

const stages = [
  {
    number: '01',
    title: 'Lead & Inquiry',
    color: 'blue',
    icon: Users,
    steps: [
      ['Customer inquiry', 'Name, phone, referral, or campaign', '/admin/quotations/new'],
      ['Create lead', 'Capture the request in the CRM', '/admin/quotations/new'],
      ['Lead qualification', 'Budget, need, timeline, and vehicle', '/admin/quotations'],
      ['Workload assignment', 'Assign by workload, skills, territory, and availability', '/admin/quotations'],
      ['Commission ownership', 'The assigned agent owns the opportunity', '/admin/commissions'],
      ['Escalation & reassignment', 'SLA failure transfers the lead and notifies the manager', '/admin/sla'],
    ],
  },
  {
    number: '02',
    title: 'Sales Process',
    color: 'green',
    icon: HeartHandshake,
    steps: [
      ['Initial contact', 'Sales agent contacts the customer', '/admin/quotations'],
      ['Needs analysis', 'Understand requirements and finance need', '/admin/quotations'],
      ['Vehicle availability', 'Check stock and preferred model', '/admin/vehicles'],
      ['Test drive', 'Schedule, confirm, and record the result', '/admin/test-drives'],
      ['Trade-in evaluation', 'Capture vehicle, mileage, condition, photos, and value', '/admin/purchases'],
      ['Prepare quotation', 'Create pricing with options and promotions', '/admin/quotations'],
      ['Discount & promotion check', 'Apply eligibility rules and authority limits', '/admin/promotions'],
      ['Manager approval', 'Review and approve pricing', '/admin/quotations'],
      ['Send quotation', 'Email the approved quotation', '/admin/quotations'],
      ['Customer acceptance', 'Customer reviews, signs, or requests changes', '/admin/quotations'],
      ['Create sales order', 'Convert the accepted quote', '/admin/orders'],
      ['Agreement manager signature', 'Manager reviews and signs the agreement', '/admin/orders'],
      ['Customer signature', 'Customer signs; audit history is recorded', '/admin/orders'],
    ],
  },
  {
    number: '03',
    title: 'Finance & Payment',
    color: 'violet',
    icon: CreditCard,
    steps: [
      ['Financing request', 'Submit financing application if needed', '/admin/financing'],
      ['Finance review', 'Track approval, decline, or pending status', '/admin/purchases'],
      ['Submit to bank', 'Send the application to the selected bank', '/admin/financing'],
      ['Bank decision', 'Record the bank decision', '/admin/purchases'],
      ['Alternative financing', 'Offer another payment option if declined', '/admin/orders'],
      ['Payment request', 'Issue the secure payment request or invoice', '/admin/orders'],
      ['Customer payment', 'Record pending, partial, paid, failed, or refunded', '/admin/orders'],
      ['Payment verification', 'Verify payment before delivery can proceed', '/admin/orders'],
    ],
  },
  {
    number: '04',
    title: 'Delivery & Handover',
    color: 'orange',
    icon: ShoppingCart,
    steps: [
      ['Inventory check', 'Confirm vehicle availability', '/admin/vehicles'],
      ['PDI inspection', 'Inspect and prepare the vehicle', '/admin/orders'],
      ['PDI resolution', 'Resolve failed checks before proceeding', '/admin/orders'],
      ['Vehicle allocation', 'Allocate the approved vehicle to the customer', '/admin/orders'],
      ['Delivery approval', 'Manager approves delivery readiness', '/admin/orders'],
      ['Schedule handover', 'Agree on delivery date and time', '/admin/orders'],
      ['Handover documents', 'Invoice, agreement, payment receipt, and PDI', '/admin/orders'],
      ['Customer handover', 'Customer signs the handover documents', '/admin/orders'],
      ['Vehicle delivered', 'Complete delivery and notify customer', '/admin/orders'],
    ],
  },
  {
    number: '05',
    title: 'After-Sales Service',
    color: 'teal',
    icon: Wrench,
    steps: [
      ['Warranty registration', 'Register warranty and send certificate', '/admin/warranty'],
      ['Service profile', 'Create the customer vehicle profile', '/admin/customers'],
      ['Service reminders', 'Set mileage and time reminders', '/admin/service-bookings'],
      ['First service', 'Track the customer’s first visit', '/admin/warranty'],
      ['Workshop / job card', 'Create job card and assign technician', '/admin/workshop/job-cards'],
      ['Parts & labor', 'Allocate parts and record work', '/admin/parts'],
      ['Quality check', 'Complete inspection after service', '/admin/workshop/job-cards'],
      ['Invoice & payment', 'Generate invoice and collect payment', '/admin/workshop/job-cards'],
      ['Vehicle release', 'Return the vehicle to the customer', '/admin/workshop/job-cards'],
      ['Customer feedback', 'Collect feedback and satisfaction score', '/admin/satisfaction'],
      ['Complaint management', 'Investigate and resolve complaints', '/admin/complaints'],
      ['Warranty claim', 'Process claims when applicable', '/admin/workshop/warranty-claims'],
      ['Customer satisfaction', 'Send survey and record score, comments, and follow-up', '/admin/satisfaction'],
    ],
  },
  {
    number: '06',
    title: 'Ownership Lifecycle',
    color: 'indigo',
    icon: UserRound,
    steps: [
      ['Customer ownership', 'Keep one customer history', '/admin/customers'],
      ['Vehicle in use', 'Maintain vehicle and service records', '/admin/customers'],
      ['Periodic maintenance', 'Keep service reminders active', '/admin/service-bookings'],
      ['Special offers', 'Target relevant customer offers', '/admin/promotions'],
      ['Loyalty programs', 'Build repeat engagement', '/admin/repeat-purchase'],
      ['Roadside assistance', 'Support customers after delivery', '/admin/complaints'],
      ['Repeat purchase', 'Identify upgrades and new interest', '/admin/repeat-purchase'],
      ['New lifecycle', 'Start trade-in, quote, order, and delivery again', '/admin/quotations/new'],
    ],
  },
] as const;

const colorClasses = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300',
  green: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300',
  violet: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300',
  orange: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300',
  teal: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-300',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300',
} as const;

export default function DealershipWorkflow() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: ClipboardCheck, value: '52', label: 'Tracked workflow steps' },
          { icon: Mail, value: '15+', label: 'Notification checkpoints' },
          { icon: History, value: '1', label: 'Audited customer history' },
        ].map(({ icon: WorkflowIcon, value, label }) => {
          return (
            <div key={label as string} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <WorkflowIcon className="h-5 w-5 text-geely-blue" />
              <div><div className="text-xl font-semibold text-gray-900 dark:text-white">{value}</div><div className="text-xs text-gray-500 dark:text-gray-400">{label}</div></div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-geely-blue">One customer. One history. One system.</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">Complete Dealership Lifecycle</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Follow the customer from first inquiry to repeat purchase. Each step links to the screen where your team updates it.</p>
          </div>
          <Link href="/admin/analytics" className="inline-flex items-center gap-2 text-sm font-semibold text-geely-blue hover:underline"><RefreshCw className="h-4 w-4" /> View dashboard</Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-6">
        {stages.map((stage) => {
          const StageIcon = stage.icon;
          return (
            <section key={stage.title} className={`rounded-xl border p-3 ${colorClasses[stage.color]}`}>
              <div className="mb-3 flex items-center gap-2 border-b border-current/15 pb-3">
                <StageIcon className="h-5 w-5" />
                <div><div className="text-[10px] font-bold tracking-[0.18em] opacity-70">{stage.number}</div><h3 className="text-sm font-bold leading-tight">{stage.title}</h3></div>
              </div>
              <div className="space-y-2">
                {stage.steps.map(([title, description, href], index) => (
                  <Link key={`${stage.number}-${title}`} href={href} className="group block rounded-lg border border-current/15 bg-white/75 p-2.5 transition hover:-translate-y-0.5 hover:bg-white dark:bg-gray-900/50 dark:hover:bg-gray-900">
                    <div className="flex items-start gap-2"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-current text-[9px] font-bold text-white">{index + 1}</span><span className="text-xs font-bold leading-tight">{title}</span></div>
                    <p className="mt-1 pl-6 text-[11px] leading-snug opacity-75">{description}</p>
                    <div className="mt-1 flex items-center justify-end text-[10px] font-semibold opacity-0 transition group-hover:opacity-100">Update <ArrowRight className="ml-1 h-3 w-3" /></div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl border border-gray-200 bg-white px-5 py-4 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-green-600" /> Approval, payment, and PDI gates protect transitions</span>
        <span className="inline-flex items-center gap-2"><Car className="h-4 w-4 text-geely-blue" /> Sales and vehicle records stay linked</span>
        <span className="inline-flex items-center gap-2"><Headphones className="h-4 w-4 text-violet-600" /> Support continues after delivery</span>
        <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-orange-600" /> Email and in-system notifications stay visible</span>
      </div>
    </div>
  );
}
