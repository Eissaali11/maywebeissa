import { createBootstrapAuthInstance } from './bootstrap-runtime';
import {
  AdminCredentialProvisionerPort,
  ProvisionAdminCredentialInput,
  ProvisionAdminCredentialOutput,
} from '../application/ports/admin-credential-provisioner.port';

export class BetterAuthAdminProvisionerAdapter implements AdminCredentialProvisionerPort {
  async createAdmin(input: ProvisionAdminCredentialInput): Promise<ProvisionAdminCredentialOutput> {
    const bootstrapAuth = createBootstrapAuthInstance();

    const result = await bootstrapAuth.api.signUpEmail({
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
      },
    });

    if (!result || !result.user) {
      throw new Error('Bootstrap failed: Unable to create administrator record.');
    }

    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: (result.user as { role?: string }).role || 'ADMIN',
    };
  }
}
