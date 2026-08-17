import { User, Role } from '../types';
import {
  fetchSystemUsersFromSupabase,
  saveSystemUserToSupabase,
  deleteSystemUserFromSupabase,
  updateUserPasswordInSupabase,
  SystemUserRecord,
} from '../lib/supabase';

/**
 * ------------------------------------------------------------------
 * PATRIOT ERP - DEFAULT INITIAL AUTHORIZED USERS
 * ------------------------------------------------------------------
 */
export interface SystemUserCredential {
  email: string;
  password: string;
  name: string;
  role: Role;
  updated_at?: string;
}

export const INITIAL_AUTHORIZED_USERS: SystemUserCredential[] = [
  {
    email: 'admin@patriot.com',
    password: 'password',
    name: 'General Manager (Admin)',
    role: 'Super Admin',
  },
  {
    email: 'store@patriot.com',
    password: 'password',
    name: 'Store Officer',
    role: 'Store Manager',
  },
  {
    email: 'patriotspinning@gmail.com',
    password: 'password',
    name: 'Patriot Spinning Admin',
    role: 'Super Admin',
  },
];

const LOCAL_STORAGE_USERS_KEY = 'patriot_erp_system_users_v2';

/**
 * Retrieve all currently authorized users from local cache or defaults
 */
export function getAuthorizedUsers(): SystemUserCredential[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {
    // ignore
  }
  return INITIAL_AUTHORIZED_USERS;
}

/**
 * Save user list to local storage cache
 */
export function saveAuthorizedUsersLocally(users: SystemUserCredential[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed saving users to localStorage:', err);
  }
}

/**
 * Sync with Supabase cloud users on startup or on demand
 */
export async function syncUsersWithSupabase(): Promise<SystemUserCredential[]> {
  try {
    const cloudUsers = await fetchSystemUsersFromSupabase();
    if (cloudUsers && cloudUsers.length > 0) {
      const mapped: SystemUserCredential[] = cloudUsers.map((u) => ({
        email: u.email,
        password: u.password,
        name: u.name,
        role: u.role,
        updated_at: u.updated_at,
      }));
      saveAuthorizedUsersLocally(mapped);
      return mapped;
    } else {
      // Seed defaults to Supabase if empty
      const local = getAuthorizedUsers();
      for (const u of local) {
        await saveSystemUserToSupabase(u as SystemUserRecord);
      }
      return local;
    }
  } catch (err) {
    console.warn('Sync users error:', err);
    return getAuthorizedUsers();
  }
}

/**
 * Validate credentials during login
 */
export function authenticateLocalUser(emailInput: string, passwordInput: string): User | null {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  const users = getAuthorizedUsers();
  const matchedUser = users.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === cleanPass
  );

  if (matchedUser) {
    return {
      name: matchedUser.name,
      email: matchedUser.email,
      role: matchedUser.role,
    };
  }

  return null;
}

/**
 * Update a user's password both locally and in Supabase Cloud
 */
export async function changeUserPassword(
  email: string,
  newPassword: string,
  oldPassword?: string
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = newPassword.trim();

  if (cleanPass.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
  }

  const users = getAuthorizedUsers();
  const userIndex = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

  if (userIndex === -1) {
    return { success: false, message: 'User account not found.' };
  }

  if (oldPassword && users[userIndex].password !== oldPassword.trim()) {
    return { success: false, message: 'Current password does not match.' };
  }

  // Update in local cache
  users[userIndex].password = cleanPass;
  users[userIndex].updated_at = new Date().toISOString();
  saveAuthorizedUsersLocally(users);

  // Sync to Supabase cloud
  try {
    await updateUserPasswordInSupabase(cleanEmail, cleanPass);
    await saveSystemUserToSupabase(users[userIndex] as SystemUserRecord);
  } catch (err) {
    console.warn('Supabase password sync warning:', err);
  }

  return { success: true, message: 'Password has been updated successfully!' };
}

/**
 * Add or update a full user profile (Super Admin)
 */
export async function saveOrUpdateUser(user: SystemUserCredential): Promise<{ success: boolean; message: string }> {
  const cleanEmail = user.email.trim().toLowerCase();
  const users = getAuthorizedUsers();
  const existingIdx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

  const updatedRecord: SystemUserCredential = {
    ...user,
    email: cleanEmail,
    updated_at: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    users[existingIdx] = updatedRecord;
  } else {
    users.push(updatedRecord);
  }

  saveAuthorizedUsersLocally(users);

  try {
    await saveSystemUserToSupabase(updatedRecord as SystemUserRecord);
  } catch (err) {
    console.warn('Supabase user save error:', err);
  }

  return { success: true, message: `User ${cleanEmail} saved successfully!` };
}

/**
 * Delete a user (Super Admin)
 */
export async function removeUser(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const users = getAuthorizedUsers();

  if (users.length <= 1) {
    return { success: false, message: 'Cannot delete the last remaining system user.' };
  }

  const filtered = users.filter((u) => u.email.toLowerCase() !== cleanEmail);
  saveAuthorizedUsersLocally(filtered);

  try {
    await deleteSystemUserFromSupabase(cleanEmail);
  } catch (err) {
    console.warn('Supabase delete user error:', err);
  }

  return { success: true, message: `User ${cleanEmail} removed.` };
}
