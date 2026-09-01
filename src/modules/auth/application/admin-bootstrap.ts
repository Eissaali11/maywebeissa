import { AdminBootstrapStatePort } from './ports/admin-bootstrap-state.port';
import { AdminCredentialProvisionerPort } from './ports/admin-credential-provisioner.port';

export interface BootstrapAdminInput {
  name: string;
  email: string;
  password: string;
}

export interface BootstrapAdminOutput {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function executeAdminBootstrap(
  input: BootstrapAdminInput,
  statePort: AdminBootstrapStatePort,
  credentialProvisioner: AdminCredentialProvisionerPort
): Promise<BootstrapAdminOutput> {
  const { name, email, password } = input;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Invalid name: Name must be a non-empty string.');
  }

  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    throw new Error('Invalid email: Must provide a valid email address.');
  }

  if (!password || typeof password !== 'string' || password.length < 12 || password.length > 128) {
    throw new Error('Invalid password: Password must be between 12 and 128 characters long.');
  }

  // Pre-check single-admin status
  const initialized = await statePort.isInitialized();
  if (initialized) {
    throw new Error(
      'ADMIN_BOOTSTRAP_ALREADY_INITIALIZED: Single administrator already exists in the system.'
    );
  }

  try {
    return await credentialProvisioner.createAdmin({
      name: name.trim(),
      email: cleanEmail,
      password,
    });
  } catch (err) {
    // Post-failure concurrency check
    const postCheckInitialized = await statePort.isInitialized();
    if (postCheckInitialized) {
      throw new Error(
        'ADMIN_BOOTSTRAP_ALREADY_INITIALIZED: Single administrator already exists in the system.'
      );
    }
    throw err;
  }
}
