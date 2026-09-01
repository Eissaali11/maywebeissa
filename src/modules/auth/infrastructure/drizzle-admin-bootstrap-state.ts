import { count } from 'drizzle-orm';
import { db } from '../../../db';
import { user, account } from '../../../db/schema';
import { AdminBootstrapStatePort } from '../application/ports/admin-bootstrap-state.port';

export class DrizzleAdminBootstrapStateAdapter implements AdminBootstrapStatePort {
  async isInitialized(): Promise<boolean> {
    const [userCountRes] = await db.select({ value: count() }).from(user);
    const [accountCountRes] = await db.select({ value: count() }).from(account);

    const totalUsers = Number(userCountRes?.value ?? 0);
    const totalAccounts = Number(accountCountRes?.value ?? 0);

    return totalUsers > 0 || totalAccounts > 0;
  }
}
