export interface ProvisionAdminCredentialInput {
  name: string;
  email: string;
  password: string;
}

export interface ProvisionAdminCredentialOutput {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminCredentialProvisionerPort {
  createAdmin(input: ProvisionAdminCredentialInput): Promise<ProvisionAdminCredentialOutput>;
}
