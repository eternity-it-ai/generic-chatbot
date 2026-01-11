export type BackendOk = { ok: true; result: any };
export type BackendErr = { ok: false; error: string };
export type BackendResponse = BackendOk | BackendErr;

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Statistic = {
  label: string;
  value: number;
  is_percentage?: boolean;
};

export type Metadata = {
  industry?: string;
  primary_date?: string;
  primary_money?: string;
  entity_col?: string;
  health_score?: number;
  health_advice?: string;
  catalog?: Array<{ col: string; rich_desc: string }>;
  statistics?: Statistic[];
};

export type BrandingPayload = {
  welcomeName: string;
  companyName: string;
  companyDomain: string;
  logoUrl: string;
};

export type Branding = {
  brandVersion: number;
  configured: boolean;
  configuredAt: string;
  payload: BrandingPayload;
};
