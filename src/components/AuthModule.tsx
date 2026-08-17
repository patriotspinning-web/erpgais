import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Users,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  UserCheck,
  ShieldCheck,
  Database,
  Edit2,
} from 'lucide-react';
import { User, Role } from '../types';
import {
  getAuthorizedUsers,
  changeUserPassword,
  saveOrUpdateUser,
  removeUser,
  syncUsersWithSupabase,
  SystemUserCredential,
} from '../config/authUsers';

interface AuthModuleProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: (updatedUser: User) => void;
}

export const AuthModule: React.FC<AuthModuleProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'password' | 'users' | 'security'>('password');
  const [usersList, setUsersList] = useState<SystemUserCredential[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Password Change Form State
  const [targetEmail, setTargetEmail] = useState<string>(currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordStatusMsg, setPasswordStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New / Edit User Form State
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [userFormEmail, setUserFormEmail] = useState<string>('');
  const [userFormName, setUserFormName] = useState<string>('');
  const [userFormRole, setUserFormRole] = useState<Role>('Store Manager');
  const [userFormPassword, setUserFormPassword] = useState<string>('');
  const [userFormMsg, setUserFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSuperAdmin = currentUser?.role === 'Super Admin';

  // Load user credentials
  const reloadUsers = async () => {
    setIsLoading(true);
    try {
      const users = await syncUsersWithSupabase();
      setUsersList(users);
    } catch {
      setUsersList(getAuthorizedUsers());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadUsers();
      if (currentUser?.email) {
        setTargetEmail(currentUser.email);
      }
      setPasswordStatusMsg(null);
      setUserFormMsg(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle password change submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatusMsg(null);

    if (newPassword.length < 6) {
      setPasswordStatusMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatusMsg({ type: 'error', text: 'New passwords do not match. Please verify.' });
      return;
    }

    setIsLoading(true);
    const emailToUpdate = targetEmail || currentUser?.email || '';
    
    // Non-super-admin must provide current password
    const verifyCurrent = isSuperAdmin && targetEmail !== currentUser?.email ? undefined : currentPassword;

    const res = await changeUserPassword(emailToUpdate, newPassword, verifyCurrent);

    if (res.success) {
      setPasswordStatusMsg({ type: 'success', text: `Success: Password for ${emailToUpdate} has been updated and synced to Supabase Cloud!` });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      reloadUsers();
    } else {
      setPasswordStatusMsg({ type: 'error', text: res.message });
    }
    setIsLoading(false);
  };

  // Handle Create or Update User Submit
  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormMsg(null);

    if (!userFormEmail.trim() || !userFormName.trim()) {
      setUserFormMsg({ type: 'error', text: 'Email and Name are required.' });
      return;
    }

    if (!editingEmail && userFormPassword.length < 6) {
      setUserFormMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsLoading(true);

    const existingUser = usersList.find((u) => u.email.toLowerCase() === userFormEmail.toLowerCase());
    const passToUse = userFormPassword.trim() || (existingUser ? existingUser.password : 'password');

    const res = await saveOrUpdateUser({
      email: userFormEmail.trim().toLowerCase(),
      name: userFormName.trim(),
      role: userFormRole,
      password: passToUse,
    });

    if (res.success) {
      setUserFormMsg({ type: 'success', text: res.message });
      setTimeout(() => {
        setShowAddUserModal(false);
        setEditingEmail(null);
        setUserFormEmail('');
        setUserFormName('');
        setUserFormPassword('');
      }, 1000);
      reloadUsers();
    } else {
      setUserFormMsg({ type: 'error', text: res.message });
    }
    setIsLoading(false);
  };

  // Handle Delete User
  const handleDeleteUser = async (email: string) => {
    if (email.toLowerCase() === currentUser?.email?.toLowerCase()) {
      alert('You cannot delete your own currently logged-in account.');
      return;
    }

    if (confirm(`Are you sure you want to remove user: ${email}?`)) {
      setIsLoading(true);
      await removeUser(email);
      await reloadUsers();
      setIsLoading(false);
    }
  };

  // Open Edit User Modal
  const openEditModal = (u: SystemUserCredential) => {
    setEditingEmail(u.email);
    setUserFormEmail(u.email);
    setUserFormName(u.name);
    setUserFormRole(u.role);
    setUserFormPassword('');
    setUserFormMsg(null);
    setShowAddUserModal(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                User Authentication & Security
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage accounts, credentials, and Supabase cloud password updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('password')}
            className={`py-3 sm:py-3.5 px-3 sm:px-4 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'password'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Change Password</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 sm:py-3.5 px-3 sm:px-4 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Accounts ({usersList.length})</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 sm:py-3.5 px-3 sm:px-4 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Cloud Sync Status</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: CHANGE PASSWORD */}
          {activeTab === 'password' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      Secure Supabase Password Synchronization
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                      Changing your password here updates both the local application credentials and the Supabase cloud database.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* User Account Selection (Super Admin only can pick another user) */}
                {isSuperAdmin ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                      Select Account To Update
                    </label>
                    <select
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                    >
                      {usersList.map((u) => (
                        <option key={u.email} value={u.email}>
                          {u.name} ({u.email}) - [{u.role}]
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                      Account Email
                    </label>
                    <input
                      type="email"
                      value={currentUser?.email || ''}
                      disabled
                      className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 font-mono"
                    />
                  </div>
                )}

                {/* Current Password (Required if not Super Admin updating another user) */}
                {(!isSuperAdmin || targetEmail === currentUser?.email) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                      placeholder="Minimum 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                      placeholder="Re-type new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Feedback Message */}
                {passwordStatusMsg && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 border ${
                      passwordStatusMsg.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {passwordStatusMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span>{passwordStatusMsg.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  {isLoading ? 'Updating Cloud Credentials...' : 'Save & Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT (SUPER ADMIN ONLY) */}
          {activeTab === 'users' && isSuperAdmin && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Authorized Mill Users</h3>
                  <p className="text-xs text-slate-500">Manage user logins, access roles, and cloud credentials</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={reloadUsers}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                    title="Reload from Supabase"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingEmail(null);
                      setUserFormEmail('');
                      setUserFormName('');
                      setUserFormRole('Store Manager');
                      setUserFormPassword('');
                      setUserFormMsg(null);
                      setShowAddUserModal(true);
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add New User</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">User & Name</th>
                        <th className="px-4 py-3">Email Address</th>
                        <th className="px-4 py-3">Access Role</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {usersList.map((u) => (
                        <tr key={u.email} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                                {u.email === currentUser?.email && (
                                  <span className="text-[10px] text-emerald-600 font-semibold">(You)</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{u.email}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[11px] inline-flex items-center gap-1 ${
                                u.role === 'Super Admin'
                                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                  : u.role === 'Quality Officer'
                                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                  : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              }`}
                            >
                              {u.role === 'Super Admin' ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setTargetEmail(u.email);
                                  setActiveTab('password');
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                                title="Change User Password"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                title="Edit User Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {u.email !== currentUser?.email && (
                                <button
                                  onClick={() => handleDeleteUser(u.email)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"
                                  title="Delete Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLOUD SYNC & STATUS */}
          {activeTab === 'security' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Supabase Cloud Sync Engine</h4>
                    <p className="text-xs text-slate-500">Cross-device real-time credential security</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>• <strong>Table Name:</strong> <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">system_users</code></p>
                  <p>• <strong>Security Architecture:</strong> Password updates are persisted to the centralized Supabase PostgreSQL database and synchronized instantly across any authorized mill computer or browser.</p>
                  <p>• <strong>Realtime Status:</strong> Active & Connected</p>
                </div>

                <button
                  onClick={reloadUsers}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Syncing...' : 'Force Sync System Users to Cloud'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Patriot Spinning Mills Ltd. • Secure Access Management
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Add / Edit User Modal Dialog */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingEmail ? 'Edit User Profile' : 'Add New Authorized User'}
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUserFormSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={userFormName}
                  onChange={(e) => setUserFormName(e.target.value)}
                  required
                  placeholder="e.g. Tariqul Islam"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={userFormEmail}
                  onChange={(e) => setUserFormEmail(e.target.value)}
                  required
                  disabled={!!editingEmail}
                  placeholder="e.g. user@patriot.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Role / Permissions</label>
                <select
                  value={userFormRole}
                  onChange={(e) => setUserFormRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Store Manager">Store Manager (Inventory Control)</option>
                  <option value="Super Admin">Super Admin (Full Access + DB Config)</option>
                  <option value="Quality Officer">Quality Officer (HVI & Uster)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {editingEmail ? 'New Password (Leave blank to keep unchanged)' : 'Login Password'}
                </label>
                <input
                  type="password"
                  value={userFormPassword}
                  onChange={(e) => setUserFormPassword(e.target.value)}
                  placeholder={editingEmail ? '•••••••• (unchanged)' : 'Enter password (min 6 chars)'}
                  required={!editingEmail}
                  minLength={editingEmail ? undefined : 6}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {userFormMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs ${
                    userFormMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {userFormMsg.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20"
                >
                  {isLoading ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
