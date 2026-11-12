export type UserRole = 'organizer' | 'sponsor' | 'admin';

export type AccountStatus = 'active' | 'suspended' | 'pending';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type EventCategory =
  | 'technology'
  | 'business'
  | 'sports'
  | 'cultural'
  | 'social'
  | 'academic'
  | 'other';

export type EventStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'published'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type ProposalStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'changes_requested'
  | 'rejected'
  | 'expired'
  | 'payment_pending'
  | 'paid'
  | 'cancelled';

export type PaymentStatus =
  | 'CREATED'
  | 'APPROVED'
  | 'COMPLETED'
  | 'PENDING'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type DeliverableStatus =
  | 'pending'
  | 'submitted'
  | 'verified'
  | 'not_verified'
  | 'waived_by_sponsor';

export interface ProfileRow {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface OrganizerProfileRow {
  id: string;
  user_id: string | null;
  society_name: string;
  university_id: string | null;
  university_name: string | null;
  campus_city: string;
  category: string;
  description: string;
  contact_person: string;
  official_email: string;
  website: string | null;
  logo_url: string | null;
  verification_status: VerificationStatus;
  review_note: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SponsorProfileRow {
  id: string;
  user_id: string | null;
  company_name: string;
  industry: string;
  description: string;
  website: string | null;
  operating_locations: string[];
  products_services: string | null;
  target_tags: string[];
  objectives: string[];
  budget_min_minor: number;
  budget_max_minor: number;
  currency: string;
  preferred_categories: string[];
  preferred_locations: string[];
  preferred_benefits: string[];
  contact_email: string;
  logo_url: string | null;
  verification_status: VerificationStatus;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  organizer_id: string;
  university_id: string | null;
  title: string;
  description: string;
  category: EventCategory;
  city: string;
  country: string;
  venue: string | null;
  starts_at: string;
  ends_at: string;
  expected_attendees: number;
  audience_tags: string[];
  event_objectives: string[];
  social_reach: number;
  sponsorship_target_minor: number;
  currency: string;
  sponsorship_needs: string[];
  deck_storage_path: string | null;
  status: EventStatus;
  review_note: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SponsorshipPackageRow {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price_minor: number;
  currency: string;
  benefits_json: string[];
  availability: number;
  ideal_sponsor_categories: string[];
  pricing_rationale: string | null;
  assumptions_json: string[];
  ai_generated: boolean;
  approved_by_organizer: boolean;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface FactorScores {
  audience_fit: number;
  industry_fit: number;
  budget_fit: number;
  location_fit: number;
  benefit_fit: number;
  timing_fit: number;
}

export interface MatchRow {
  id: string;
  event_id: string;
  sponsor_id: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  factor_scores_json: FactorScores;
  explanation: string;
  missing_info_json: string[];
  recommended_package_id: string | null;
  profile_snapshot_at: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalRow {
  id: string;
  event_id: string;
  sponsor_id: string;
  package_id: string;
  organizer_id: string;
  amount_minor: number;
  currency: string;
  benefits_snapshot_json: string[];
  message: string;
  change_request_note: string | null;
  status: ProposalStatus;
  expires_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  proposal_id: string;
  paypal_order_id: string | null;
  paypal_capture_id: string | null;
  amount_minor: number;
  currency: string;
  status: PaymentStatus;
  captured_at: string | null;
  raw_status_reason: string | null;
  created_at: string;
  updated_at: string;
}
