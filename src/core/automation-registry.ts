/**
 * Central registry for all automations.
 * Each automation registers itself here.
 */

import type { Automation } from './types.js';

// Import automations
import { leadManagementAutomation } from '../automations/lead-management/index.js';
// Import other automations as you add them
// import { invoiceAutomation } from '../automations/invoice-automation.js';

/**
 * Register all automations here.
 * To add a new automation:
 * 1. Create folder in src/automations/
 * 2. Import it here
 * 3. Add to this array
 */
export const automations: Automation[] = [
  leadManagementAutomation,
  // invoiceAutomation,
];

/**
 * Get only enabled automations
 */
export function getEnabledAutomations(): Automation[] {
  return automations.filter((a) => a.enabled);
}

/**
 * Get automation by ID
 */
export function getAutomation(id: string): Automation | undefined {
  return automations.find((a) => a.id === id);
}
