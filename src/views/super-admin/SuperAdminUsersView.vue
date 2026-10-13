<script setup>
import { ref, computed, onMounted } from 'vue';
import { superAdminApi } from '../../api';
import TableSkeleton from '../../components/ui/TableSkeleton.vue';

const users = ref([]);
const roles = ref([]);
const loading = ref(true);
const rolesLoading = ref(false);
const error = ref(null);
const successMessage = ref(null);

// Filters
const search = ref('');
const selectedRoleFilter = ref('ALL');
const selectedStatusFilter = ref('ALL');

// Modals
const showAddUserModal = ref(false);
const showChangeRoleModal = ref(false);
const showResetPasswordModal = ref(false);
const showDeleteUserModal = ref(false);
const showDetailsModal = ref(false);

const selectedUser = ref(null);
const actionLoading = ref(false);
const modalError = ref(null);

// Forms
const newUserForm = ref({
  fullName: '',
  username: '',
  email: '',
  password: '',
  roleId: '',
  position: '',
  contactNumber: '',
});

const changeRoleForm = ref({
  newRoleId: '',
});

const resetPasswordForm = ref({
  newPassword: '',
});

const showSuccess = (msg) => {
  successMessage.value = msg;
  setTimeout(() => {
    if (successMessage.value === msg) {
      successMessage.value = null;
    }
  }, 4500);
};

const fetchRoles = async () => {
  try {
    rolesLoading.value = true;
    const res = await superAdminApi.roles.list();
    roles.value = Array.isArray(res) ? res : (res?.data || []);
  } catch (err) {
    console.error('Failed to load roles list:', err);
  } finally {
    rolesLoading.value = false;
  }
};

const fetchUsers = async () => {
  try {
    loading.value = true;
    error.value = null;
    const res = await superAdminApi.users.list();
    users.value = Array.isArray(res) ? res : (res?.data || []);
  } catch (e) {
    error.value = e.message || 'Unable to retrieve platform user accounts.';
  } finally {
    loading.value = false;
  }
};

const formatRoleName = (role) => {
  if (!role) return 'Unassigned';
  const icon = role.icon ? role.icon + ' ' : '';
  const name = role.roleName || role.role_name || role.roleCode || role.role_code || 'User';
  return icon + name;
};

const getRoleBadgeClasses = (role) => {
  const code = (role?.roleCode || role?.role_code || '').toLowerCase();
  if (code === 'super_admin') {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800';
  }
  if (code.includes('admin')) {
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800';
  }
  if (code.includes('manager')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
};

const filteredUsers = computed(() => {
  let list = users.value;

  if (selectedRoleFilter.value !== 'ALL') {
    list = list.filter((u) => {
      const code = u.role?.roleCode || u.role?.role_code;
      const id = String(u.role?.roleId || u.role?.role_id);
      return code === selectedRoleFilter.value || id === selectedRoleFilter.value;
    });
  }

  if (selectedStatusFilter.value !== 'ALL') {
    const wantActive = selectedStatusFilter.value === 'ACTIVE';
    list = list.filter((u) => {
      const isActive = u.isActive !== undefined ? u.isActive : u.is_active !== false;
      return wantActive ? isActive : !isActive;
    });
  }

  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    list = list.filter(
      (u) =>
        (u.fullName || u.full_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.position || '').toLowerCase().includes(q) ||
        (u.role?.roleName || u.role?.role_name || '').toLowerCase().includes(q)
    );
  }

  return list;
});

const openAddUser = () => {
  modalError.value = null;
  // Default to first non-super_admin role
  const defaultRole = roles.value.find((r) => (r.role_code || r.roleCode) !== 'super_admin');
  newUserForm.value = {
    fullName: '',
    username: '',
    email: '',
    password: '',
    roleId: defaultRole ? (defaultRole.role_id || defaultRole.roleId) : '',
    position: '',
    contactNumber: '',
  };
  showAddUserModal.value = true;
};

const submitAddUser = async () => {
  if (!newUserForm.value.fullName.trim() || !newUserForm.value.username.trim() || !newUserForm.value.email.trim() || !newUserForm.value.password.trim() || !newUserForm.value.roleId) {
    modalError.value = 'Please fill in all required fields (Full Name, Username, Email, Password, Role).';
    return;
  }
  if (newUserForm.value.password.length < 8) {
    modalError.value = 'Password must be at least 8 characters.';
    return;
  }

  try {
    actionLoading.value = true;
    modalError.value = null;

    const payload = {
      fullName: newUserForm.value.fullName.trim(),
      username: newUserForm.value.username.trim(),
      email: newUserForm.value.email.trim(),
      password: newUserForm.value.password,
      roleId: Number(newUserForm.value.roleId),
      position: newUserForm.value.position.trim() || null,
      contactNumber: newUserForm.value.contactNumber.trim() || null,
    };

    await superAdminApi.users.create(payload);
    showAddUserModal.value = false;
    showSuccess(`User "${payload.fullName}" created successfully.`);
    await fetchUsers();
  } catch (err) {
    modalError.value = err.message || 'Failed to create platform user account.';
  } finally {
    actionLoading.value = false;
  }
};

const openChangeRole = (user) => {
  selectedUser.value = user;
  modalError.value = null;
  const currentRoleId = user.role?.roleId || user.role?.role_id;
  changeRoleForm.value.newRoleId = currentRoleId ? String(currentRoleId) : '';
  showChangeRoleModal.value = true;
};

const submitChangeRole = async () => {
  if (!changeRoleForm.value.newRoleId) {
    modalError.value = 'Please select a new role for this user.';
    return;
  }

  const userId = selectedUser.value.userId || selectedUser.value.user_id;
  try {
    actionLoading.value = true;
    modalError.value = null;

    await superAdminApi.users.update(userId, {
      roleId: Number(changeRoleForm.value.newRoleId),
    });

    showChangeRoleModal.value = false;
    showSuccess(`Role successfully updated for "${selectedUser.value.fullName || selectedUser.value.full_name}".`);
    await fetchUsers();
  } catch (err) {
    modalError.value = err.message || 'Failed to update user role.';
  } finally {
    actionLoading.value = false;
  }
};

const toggleUserStatus = async (user) => {
  const userId = user.userId || user.user_id;
  const currentlyActive = user.isActive !== undefined ? user.isActive : user.is_active !== false;
  const nextStatus = !currentlyActive;

  try {
    loading.value = true;
    await superAdminApi.users.update(userId, {
      isActive: nextStatus,
    });
    showSuccess(`Account "${user.fullName || user.full_name}" is now ${nextStatus ? 'ACTIVE' : 'DEACTIVATED'}.`);
    await fetchUsers();
  } catch (err) {
    error.value = err.message || 'Failed to update user account status.';
  } finally {
    loading.value = false;
  }
};

const openResetPassword = (user) => {
  selectedUser.value = user;
  modalError.value = null;
  resetPasswordForm.value.newPassword = '';
  showResetPasswordModal.value = true;
};

const submitResetPassword = async () => {
  if (!resetPasswordForm.value.newPassword || resetPasswordForm.value.newPassword.length < 8) {
    modalError.value = 'New password must be at least 8 characters long.';
    return;
  }

  const userId = selectedUser.value.userId || selectedUser.value.user_id;
  try {
    actionLoading.value = true;
    modalError.value = null;

    await superAdminApi.users.resetPassword(userId, resetPasswordForm.value.newPassword);
    showResetPasswordModal.value = false;
    showSuccess(`Password successfully reset for "${selectedUser.value.fullName || selectedUser.value.full_name}".`);
  } catch (err) {
    modalError.value = err.message || 'Failed to reset user password.';
  } finally {
    actionLoading.value = false;
  }
};

const openDeleteUser = (user) => {
  selectedUser.value = user;
  modalError.value = null;
  showDeleteUserModal.value = true;
};

const submitDeleteUser = async () => {
  const userId = selectedUser.value.userId || selectedUser.value.user_id;
  try {
    actionLoading.value = true;
    modalError.value = null;

    await superAdminApi.users.remove(userId);
    showDeleteUserModal.value = false;
    showSuccess(`Account "${selectedUser.value.fullName || selectedUser.value.full_name}" has been permanently deleted.`);
    await fetchUsers();
  } catch (err) {
    modalError.value = err.message || 'Failed to delete user account.';
  } finally {
    actionLoading.value = false;
  }
};

const openDetails = (user) => {
  selectedUser.value = user;
  showDetailsModal.value = true;
};

onMounted(() => {
  fetchUsers();
  fetchRoles();
});
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- View Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
            Administration
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          User Accounts
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Create accounts, assign roles, reset passwords and deactivate users.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="fetchUsers"
          :disabled="loading"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
        >
          <svg :class="['w-3.5 h-3.5', loading ? 'animate-spin text-indigo-600' : 'text-slate-500']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>

        <button
          type="button"
          @click="openAddUser"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition shadow-sm"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add User</span>
        </button>
      </div>
    </div>

    <!-- Feedback Alerts -->
    <div
      v-if="successMessage"
      class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 flex items-center justify-between gap-4 text-emerald-800 dark:text-emerald-200 text-sm font-medium animate-fadeIn"
    >
      <div class="flex items-center gap-2.5">
        <svg class="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ successMessage }}</span>
      </div>
      <button @click="successMessage = null" class="text-xs font-bold uppercase hover:underline">Dismiss</button>
    </div>

    <div
      v-if="error"
      class="p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 flex items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span class="text-sm font-medium text-rose-800 dark:text-rose-200">{{ error }}</span>
      </div>
      <button
        type="button"
        @click="fetchUsers"
        class="px-3 py-1 text-xs font-bold uppercase rounded bg-rose-600 text-white hover:bg-rose-700 transition"
      >
        Retry
      </button>
    </div>

    <!-- Table Card -->
    <div class="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <!-- Toolbar -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div class="relative w-full sm:w-64">
            <input
              v-model="search"
              type="search"
              placeholder="Search by name, email, username..."
              class="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <select
              v-model="selectedRoleFilter"
              aria-label="Filter by role"
              class="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Roles</option>
              <option v-for="r in roles" :key="r.role_id || r.roleId" :value="r.role_code || r.roleCode">
                {{ formatRoleName(r) }}
              </option>
            </select>

            <select
              v-model="selectedStatusFilter"
              aria-label="Filter by status"
              class="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        <span class="text-xs text-slate-500 dark:text-slate-400">
          {{ loading ? 'Loading accounts...' : `Showing ${filteredUsers.length} of ${users.length} accounts` }}
        </span>
      </div>

      <!-- Loading Skeleton -->
      <TableSkeleton v-if="loading" :rows="6" :cols="6" class="p-4" />

      <!-- Empty State -->
      <div v-else-if="!filteredUsers.length" class="py-16 text-center text-slate-400">
        <p class="text-sm font-semibold">No platform accounts match the criteria</p>
        <p class="text-xs mt-1">Try modifying your filter or search query.</p>
      </div>

      <!-- Users Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-xs">
            <tr>
              <th class="py-3 px-4 font-semibold">User</th>
              <th class="py-3 px-4 font-semibold">Username</th>
              <th class="py-3 px-4 font-semibold">Role Tier</th>
              <th class="py-3 px-4 font-semibold">Position</th>
              <th class="py-3 px-4 font-semibold">Status</th>
              <th class="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="u in filteredUsers"
              :key="u.userId || u.user_id"
              class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="py-3 px-4">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0">
                    {{ ((u.fullName || u.full_name || 'U')[0]).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-semibold text-slate-900 dark:text-white">{{ u.fullName || u.full_name }}</p>
                    <p class="text-xs text-slate-400 font-mono">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                @{{ u.username }}
              </td>
              <td class="py-3 px-4">
                <span
                  :class="['inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold tracking-wide', getRoleBadgeClasses(u.role)]"
                >
                  <span>{{ u.role?.icon || '👤' }}</span>
                  <span>{{ u.role?.roleName || u.role?.role_name || u.role?.roleCode || u.role?.role_code || 'User' }}</span>
                </span>
              </td>
              <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                {{ u.position || '—' }}
              </td>
              <td class="py-3 px-4">
                <button
                  type="button"
                  @click="toggleUserStatus(u)"
                  title="Click to toggle status"
                  :class="[
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold cursor-pointer transition',
                    (u.isActive !== undefined ? u.isActive : u.is_active !== false)
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 hover:bg-rose-100'
                  ]"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="(u.isActive !== undefined ? u.isActive : u.is_active !== false) ? 'bg-emerald-500' : 'bg-rose-500'" />
                  {{ (u.isActive !== undefined ? u.isActive : u.is_active !== false) ? 'Active' : 'Inactive' }}
                </button>
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    @click="openChangeRole(u)"
                    class="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  >
                    Change Role
                  </button>
                  <button
                    type="button"
                    @click="openResetPassword(u)"
                    class="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    @click="openDetails(u)"
                    class="px-2 py-1 text-xs font-semibold rounded text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                    title="View Account Details"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    @click="openDeleteUser(u)"
                    class="px-2 py-1 text-xs font-semibold rounded text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition"
                    title="Delete Account"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ADD USER MODAL -->
    <div
      v-if="showAddUserModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">👤</span>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Create User Account</h2>
          </div>
          <button @click="showAddUserModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>

        <div v-if="modalError" class="p-3 text-xs rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 text-rose-700 dark:text-rose-300">
          {{ modalError }}
        </div>

        <div class="space-y-3.5 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              v-model="newUserForm.fullName"
              type="text"
              placeholder="e.g. Eleanor Vance"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Username *</label>
              <input
                v-model="newUserForm.username"
                type="text"
                placeholder="e.g. evance"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
              <input
                v-model="newUserForm.email"
                type="email"
                placeholder="e.g. evance@domain.com"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Temporary Password * (Min 8 chars)</label>
            <input
              v-model="newUserForm.password"
              type="password"
              placeholder="••••••••••••"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Assign Role *</label>
            <select
              v-model="newUserForm.roleId"
              aria-label="Assign role"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option disabled value="">Select an assigned role</option>
              <option
                v-for="r in roles"
                :key="r.role_id || r.roleId"
                :value="r.role_id || r.roleId"
              >
                {{ formatRoleName(r) }} ({{ r.role_code || r.roleCode }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Position / Title</label>
              <input
                v-model="newUserForm.position"
                type="text"
                placeholder="e.g. Inventory Analyst"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Number</label>
              <input
                v-model="newUserForm.contactNumber"
                type="text"
                placeholder="e.g. +63 912 345 6789"
                class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            @click="showAddUserModal = false"
            class="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitAddUser"
            :disabled="actionLoading"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            <span v-if="actionLoading" class="animate-spin text-white">⏳</span>
            <span>Create & Persist User</span>
          </button>
        </div>
      </div>
    </div>

    <!-- CHANGE ROLE MODAL -->
    <div
      v-if="showChangeRoleModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 class="text-base font-bold text-slate-900 dark:text-white">Change User Role</h2>
          <button @click="showChangeRoleModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>

        <div v-if="modalError" class="p-3 text-xs rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 text-rose-700 dark:text-rose-300">
          {{ modalError }}
        </div>

        <div class="text-xs space-y-3">
          <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <p class="font-bold text-slate-900 dark:text-white">{{ selectedUser?.fullName || selectedUser?.full_name }}</p>
            <p class="text-xs text-slate-400">@{{ selectedUser?.username }} • {{ selectedUser?.email }}</p>
            <div class="mt-2 flex items-center gap-2">
              <span class="text-xs text-slate-500">Current Role:</span>
              <span class="font-bold text-indigo-600 dark:text-indigo-400">
                {{ formatRoleName(selectedUser?.role) }}
              </span>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Role Assignment *</label>
            <select
              v-model="changeRoleForm.newRoleId"
              aria-label="New role"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option disabled value="">Choose target role</option>
              <option
                v-for="r in roles"
                :key="r.role_id || r.roleId"
                :value="String(r.role_id || r.roleId)"
              >
                {{ formatRoleName(r) }} ({{ r.role_code || r.roleCode }})
              </option>
            </select>
          </div>

          <p class="text-xs text-slate-500 dark:text-slate-400">
            Reassigning a user's role updates their permission matrix across the platform in real time.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            @click="showChangeRoleModal = false"
            class="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitChangeRole"
            :disabled="actionLoading"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            <span v-if="actionLoading" class="animate-spin text-white">⏳</span>
            <span>Confirm Role Change</span>
          </button>
        </div>
      </div>
    </div>

    <!-- RESET PASSWORD MODAL -->
    <div
      v-if="showResetPasswordModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 class="text-base font-bold text-slate-900 dark:text-white">Reset Account Password</h2>
          <button @click="showResetPasswordModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>

        <div v-if="modalError" class="p-3 text-xs rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 text-rose-700 dark:text-rose-300">
          {{ modalError }}
        </div>

        <div class="text-xs space-y-3">
          <p class="text-slate-600 dark:text-slate-400">
            Set a new temporary password for <strong>{{ selectedUser?.fullName || selectedUser?.full_name }}</strong>.
          </p>
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password (Min 8 chars) *</label>
            <input
              v-model="resetPasswordForm.newPassword"
              type="password"
              placeholder="••••••••••••"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            @click="showResetPasswordModal = false"
            class="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitResetPassword"
            :disabled="actionLoading"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            <span v-if="actionLoading" class="animate-spin text-white">⏳</span>
            <span>Update Password</span>
          </button>
        </div>
      </div>
    </div>

    <!-- DELETE USER MODAL -->
    <div
      v-if="showDeleteUserModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 class="text-base font-bold text-rose-600">Delete User Account</h2>
          <button @click="showDeleteUserModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>

        <div v-if="modalError" class="p-3 text-xs rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 text-rose-700 dark:text-rose-300">
          {{ modalError }}
        </div>

        <div class="text-xs space-y-2 text-slate-600 dark:text-slate-400">
          <p>
            Are you sure you want to permanently delete the account for:
          </p>
          <div class="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200 font-semibold">
            {{ selectedUser?.fullName || selectedUser?.full_name }} (@{{ selectedUser?.username }})
          </div>
          <p class="text-xs text-slate-500">
            This action deletes authentication credentials and removes all profile mappings in Supabase. This action cannot be undone.
          </p>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            @click="showDeleteUserModal = false"
            class="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitDeleteUser"
            :disabled="actionLoading"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition"
          >
            <span v-if="actionLoading" class="animate-spin text-white">⏳</span>
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>
    </div>

    <!-- DETAILS MODAL -->
    <div
      v-if="showDetailsModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
    >
      <div class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 class="text-base font-bold text-slate-900 dark:text-white">Account Profile & Audit Details</h2>
          <button @click="showDetailsModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
        </div>

        <div class="text-xs space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-lg">
              {{ ((selectedUser?.fullName || selectedUser?.full_name || 'U')[0]).toUpperCase() }}
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900 dark:text-white">{{ selectedUser?.fullName || selectedUser?.full_name }}</p>
              <p class="text-slate-500 font-mono">@{{ selectedUser?.username }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div>
              <p class="text-xs text-slate-400 font-semibold uppercase">Email Address</p>
              <p class="font-mono text-slate-800 dark:text-slate-200 mt-0.5">{{ selectedUser?.email }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-semibold uppercase">Role Tier</p>
              <p class="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{{ formatRoleName(selectedUser?.role) }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-semibold uppercase">Position</p>
              <p class="text-slate-800 dark:text-slate-200 mt-0.5">{{ selectedUser?.position || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-semibold uppercase">Contact Number</p>
              <p class="font-mono text-slate-800 dark:text-slate-200 mt-0.5">{{ selectedUser?.contactNumber || selectedUser?.contact_number || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-semibold uppercase">Status</p>
              <p class="font-bold mt-0.5" :class="(selectedUser?.isActive !== undefined ? selectedUser?.isActive : selectedUser?.is_active !== false) ? 'text-emerald-600' : 'text-slate-500'">
                {{ (selectedUser?.isActive !== undefined ? selectedUser?.isActive : selectedUser?.is_active !== false) ? 'Active' : 'Inactive' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-slate-400 font-semibold uppercase">Account ID</p>
              <p class="font-mono text-xs text-slate-500 truncate mt-0.5" :title="selectedUser?.userId || selectedUser?.user_id">
                {{ selectedUser?.userId || selectedUser?.user_id }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            @click="showDetailsModal = false"
            class="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
