export type UploadPurpose =
  | 'avatar'
  | 'nic_front'
  | 'nic_back'
  | 'license_front'
  | 'license_back'
  | 'vehicle'
  | 'offer_attachment'
  | 'credit_purchase_proof';

export type PresignUploadResult = {
  uploadUrl: string;
  fileUrl: string;
  viewUrl: string;
  key: string;
  expiresIn: number;
};

export type AuthenticatedPresignPayload = {
  purpose: UploadPurpose;
  contentType: string;
  filename?: string;
};

export type SignupPresignPayload = {
  countryCode: string;
  countryCallingCode: string;
  phoneDigits: string;
  purpose: 'avatar' | 'nic_front' | 'nic_back';
  contentType: string;
  filename?: string;
};
