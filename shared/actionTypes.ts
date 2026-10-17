/**
 * The shared list of agent action types.
 *
 * Agents, the LLM safeguard generator, and the backend must all use these
 * exact strings in `AgentAction.actionType` and `Safeguard.actionType`.
 * Matching ignores upper/lower case, but spelling must be identical.
 *
 * `AgentAction.actionType` stays a plain string, so a new type can be used
 * before it is added here. Add it here once the team agrees on it.
 */

export const ACTION_TYPES = {
  answer_question: "Reply to a customer with information only. Changes nothing.",
  refund: "Send money back to a customer. Set `amount` in dollars.",
  change_refund_destination: "Change the bank account or card a refund is sent to.",
  override_refund_policy: "Approve something the refund policy does not allow (outside the window, old policy, conflicting instructions).",
  change_email: "Change the email address on a customer account.",
  change_password: "Change or reset a customer's password.",
  disable_security_checks: "Turn off verification, 2FA, or other account protections.",
  share_customer_data: "Reveal one customer's personal or payment details to someone.",
  grant_account_access: "Give a person access to customer accounts or internal tools.",
} as const;

export type KnownActionType = keyof typeof ACTION_TYPES;

export const KNOWN_ACTION_TYPES = Object.keys(ACTION_TYPES) as KnownActionType[];
