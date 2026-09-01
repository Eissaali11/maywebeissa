import {
  executeAdminBootstrap,
  BootstrapAdminInput,
  BootstrapAdminOutput,
} from '../application/admin-bootstrap';
import { DrizzleAdminBootstrapStateAdapter } from './drizzle-admin-bootstrap-state';
import { BetterAuthAdminProvisionerAdapter } from './better-auth-admin-provisioner';

export async function bootstrapAdmin(input: BootstrapAdminInput): Promise<BootstrapAdminOutput> {
  const stateAdapter = new DrizzleAdminBootstrapStateAdapter();
  const provisionerAdapter = new BetterAuthAdminProvisionerAdapter();

  return executeAdminBootstrap(input, stateAdapter, provisionerAdapter);
}

export type { BootstrapAdminInput, BootstrapAdminOutput };
