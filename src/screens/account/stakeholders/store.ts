/* Role edits and confirmations made on this page. Module-level so they survive tab switches and are shared by
   the Stakeholders table, the person sheet, Activity's participant roles and Intelligence's news link. */
import { useSyncExternalStore } from 'react'

export interface RoleState { roles: Record<string, string>; confirmed: Record<string, true> }
let state: RoleState = { roles: {}, confirmed: {} }
const subs = new Set<() => void>()
const emit = () => subs.forEach(f => f())

export const roleStore = {
  /** Set a role by hand; it counts as confirmed. */
  set(key: string, role: string) { state = { roles: { ...state.roles, [key]: role }, confirmed: { ...state.confirmed, [key]: true } }; emit() },
  /** Drop the hand-set role and go back to what AHI tagged or the AI inferred. */
  reset(key: string) {
    const roles = { ...state.roles }, confirmed = { ...state.confirmed }
    delete roles[key]; delete confirmed[key]
    state = { roles, confirmed }; emit()
  },
  /** Keep the inferred role as it is. */
  confirm(key: string) { state = { ...state, confirmed: { ...state.confirmed, [key]: true } }; emit() },
}

export const useRoles = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f) } }, () => state)
