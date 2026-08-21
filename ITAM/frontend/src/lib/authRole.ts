import { BackendUserRole, getStoredUser } from "@/lib/auth";

export type UserRole = BackendUserRole;

export function getCurrentUserRole(): UserRole {
  const user = getStoredUser();
  return user?.role ?? "it_team";
}
