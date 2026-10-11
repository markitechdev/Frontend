<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { superAdminApi } from '@/api';
import { useToastStore } from '@/stores/toast';
import TableSkeleton from '@/components/ui/TableSkeleton.vue';
import ModalDialog from '@/components/ui/ModalDialog.vue';

const toast = useToastStore();

const roles = ref([]);
const permissions = ref([]);
const groupedPermissions = ref({});
const loading = ref(true);
const error = ref(null);
const saving = ref(false);

// Icon presets for easy Super Admin selection
const ICON_PRESETS = ['🛡️', '⚙️', '🧭', '👤', '📦', '🛒', '📊', '🔍', '💼', '🧩'];

// Module display labels for clear RBAC governance
const MODULE_TITLES = {
  inventory: 'Inventory & Stock Records',
  products: 'Product Catalog',
  movements: 'Stock Movements & Ledger',
  alerts: 'Alerts & Threshold Notifications',
  suppliers: 'Supplier Accounts',
  users: 'User Accounts & Security',
  roles: 'Roles & Clearance Matrix',
  reports: 'Reports & Analytics',
  finance: 'Financial Valuation',
  logs: 'System Audit Logs',
};

// -------------------------------------------------------------
// Data Fetching
// -------------------------------------------------------------
const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [rolesRes, permsRes] = await Promise.all([
      superAdminApi.roles.list(),
      superAdminApi.roles.permissions().catch(() => ({ permissions: [], grouped: {} })),
    ]);
    roles.value = Array.isArray(rolesRes) ? rolesRes : rolesRes?.data || [];
    
    // Normalize permissions array and grouped catalogue
    if (permsRes?.grouped) {
      groupedPermissions.value = permsRes.grouped;
      permissions.value = permsRes.permissions || [];
    } else if (Array.isArray(permsRes)) {
      permissions.value = permsRes;
      const g = {};
      permsRes.forEach((p) => {
        (g[p.module] ||= []).push(p);
      });
      groupedPermissions.value = g;
    } else {
      groupedPermissions.value = {};
      permissions.value = [];
    }
  } catch (e) {
    error.value = e.message || 'Unable to retrieve platform roles and matrix.';
  } finally {
    loading.value = false;
  }
};

// -------------------------------------------------------------
// Create Role State & Actions
// -------------------------------------------------------------
const createModalOpen = ref(false);
const createForm = reactive({
  roleCode: '',
  roleName: '',
  icon: '🧩',
  description: '',
  permissionIds: new Set(),
});
const createErrors = reactive({ roleCode: '', roleName: '' });

const openCreateModal = () => {
  createForm.roleCode = '';
  createForm.roleName = '';
  createForm.icon = '🧩';
  createForm.description = '';
  createForm.permissionIds = new Set();
  createErrors.roleCode = '';
  createErrors.roleName = '';
  createModalOpen.value = true;
};

const toggleCreatePerm = (permId) => {
  const next = new Set(createForm.permissionIds);
  next.has(permId) ? next.delete(permId) : next.add(permId);
  createForm.permissionIds = next;
};

const toggleCreateModule = (moduleKey) => {
  const pList = groupedPermissions.value[moduleKey] || [];
  const ids = pList.map((p) => p.permission_id);
  const allSelected = ids.every((id) => createForm.permissionIds.has(id));
  const next = new Set(createForm.permissionIds);
  if (allSelected) {
    ids.forEach((id) => next.delete(id));
  } else {
    ids.forEach((id) => next.add(id));
  }
  createForm.permissionIds = next;
};

const isCreateModuleAllSelected = (moduleKey) => {
  const pList = groupedPermissions.value[moduleKey] || [];
  if (!pList.length) return false;
  return pList.every((p) => createForm.permissionIds.has(p.permission_id));
};

const submitCreateRole = async () => {
  createErrors.roleCode = '';
  createErrors.roleName = '';

  const cleanCode = createForm.roleCode.trim().toLowerCase();
  const cleanName = createForm.roleName.trim();

  if (!cleanCode) {
    createErrors.roleCode = 'Role code is required (e.g. warehouse_manager).';
    return;
  }
  if (!/^[a-z_]+$/.test(cleanCode)) {
    createErrors.roleCode = 'Role code must contain only lowercase letters and underscores.';
    return;
  }
  if (!cleanName || cleanName.length < 3) {
    createErrors.roleName = 'Role name must be at least 3 characters.';
    return;
  }

  saving.value = true;
  try {
    await superAdminApi.roles.create({
      roleCode: cleanCode,
      roleName: cleanName,
      icon: createForm.icon || '🧩',
      description: createForm.description.trim(),
      permissionIds: Array.from(createForm.permissionIds),
    });
    toast.success(`Role "${cleanName}" created permanently.`);
    createModalOpen.value = false;
    await fetchData();
  } catch (e) {
    toast.error(e.message || 'Failed to create custom role.');
  } finally {
    saving.value = false;
  }
};

// -------------------------------------------------------------
// Edit Role State & Actions
// -------------------------------------------------------------
const editModalOpen = ref(false);
const activeRole = ref(null);
const editForm = reactive({
  roleName: '',
  icon: '🧩',
  description: '',
  isActive: true,
  permissionIds: new Set(),
});

const openEditModal = (role) => {
  activeRole.value = role;
  editForm.roleName = role.roleName || role.role_name;
  editForm.icon = role.icon || '🧩';
  editForm.description = role.description || '';
  editForm.isActive = role.isActive !== false;
  
  const permIds = (role.permissions || []).map((p) => p.permission_id ?? p.id).filter(Boolean);
  editForm.permissionIds = new Set(permIds);
  editModalOpen.value = true;
};

const toggleEditPerm = (permId) => {
  if (activeRole.value?.roleCode === 'super_admin') return;
  const next = new Set(editForm.permissionIds);
  next.has(permId) ? next.delete(permId) : next.add(permId);
  editForm.permissionIds = next;
};

const toggleEditModule = (moduleKey) => {
  if (activeRole.value?.roleCode === 'super_admin') return;
  const pList = groupedPermissions.value[moduleKey] || [];
  const ids = pList.map((p) => p.permission_id);
  const allSelected = ids.every((id) => editForm.permissionIds.has(id));
  const next = new Set(editForm.permissionIds);
  if (allSelected) {
    ids.forEach((id) => next.delete(id));
  } else {
    ids.forEach((id) => next.add(id));
  }
  editForm.permissionIds = next;
};

const isEditModuleAllSelected = (moduleKey) => {
  const pList = groupedPermissions.value[moduleKey] || [];
  if (!pList.length) return false;
  return pList.every((p) => editForm.permissionIds.has(p.permission_id));
};

const submitEditRole = async () => {
  if (!activeRole.value) return;
  saving.value = true;
  try {
    const roleId = activeRole.value.roleId || activeRole.value.role_id;
    // 1. Update metadata (name, icon, description, isActive)
    await superAdminApi.roles.update(roleId, {
      roleName: editForm.roleName.trim(),
      icon: editForm.icon,
      description: editForm.description.trim(),
      isActive: editForm.isActive,
    });

    // 2. Update permissions matrix if not super_admin (which is immutable root)
    if (activeRole.value.roleCode !== 'super_admin') {
      await superAdminApi.roles.setPermissions(roleId, Array.from(editForm.permissionIds));
    }

    toast.success(`Role "${editForm.roleName}" updated successfully.`);
    editModalOpen.value = false;
    await fetchData();
  } catch (e) {
    toast.error(e.message || 'Failed to update role.');
  } finally {
    saving.value = false;
  }
};

// -------------------------------------------------------------
// Quick Toggle Active State
// -------------------------------------------------------------
const toggleRoleStatus = async (role) => {
  if (role.isSystem) {
    toast.error('System roles are protected and cannot be deactivated.');
    return;
  }
  const roleId = role.roleId || role.role_id;
  const nextActive = !role.isActive;
  try {
    await superAdminApi.roles.update(roleId, { isActive: nextActive });
    toast.success(nextActive ? `Role activated.` : `Role deactivated.`);
    await fetchData();
  } catch (e) {
    toast.error(e.message || 'Failed to toggle role state.');
  }
};

// -------------------------------------------------------------
// Delete Custom Role
// -------------------------------------------------------------
const deleteModalOpen = ref(false);
const roleToDelete = ref(null);
const deleting = ref(false);

const confirmDeleteRole = (role) => {
  if (role.isSystem) {
    toast.error('System roles are protected and cannot be deleted.');
    return;
  }
  if (role.userCount > 0) {
    toast.error(`Cannot delete role while ${role.userCount} account(s) are assigned to it. Reassign users first.`);
    return;
  }
  roleToDelete.value = role;
  deleteModalOpen.value = true;
};

const executeDeleteRole = async () => {
  if (!roleToDelete.value) return;
  deleting.value = true;
  try {
    const roleId = roleToDelete.value.roleId || roleToDelete.value.role_id;
    await superAdminApi.roles.remove(roleId);
    toast.success(`Role "${roleToDelete.value.roleName || roleToDelete.value.role_code}" deleted permanently.`);
    deleteModalOpen.value = false;
    roleToDelete.value = null;
    await fetchData();
  } catch (e) {
    toast.error(e.message || 'Failed to delete role.');
  } finally {
    deleting.value = false;
  }
};

// -------------------------------------------------------------
// View Assigned Users Modal
// -------------------------------------------------------------
const usersModalOpen = ref(false);
const usersRoleTitle = ref('');
const usersList = ref([]);
const usersLoading = ref(false);

const openUsersModal = async (role) => {
  const roleId = role.roleId || role.role_id;
  usersRoleTitle.value = role.roleName || role.role_code;
  usersModalOpen.value = true;
  usersLoading.value = true;
  try {
    const res = await superAdminApi.roles.getUsers(roleId);
    usersList.value = res?.users || [];
  } catch (e) {
    toast.error(e.message || 'Unable to retrieve assigned users for this role.');
    usersList.value = [];
  } finally {
    usersLoading.value = false;
  }
};

onMounted(fetchData);
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- View Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
            Platform Governance
          </span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Authorization Matrix
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
          Roles & Clearance Hierarchy
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Global capability matrix mapping roles to tenant and platform boundaries.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          type="button"
          @click="fetchData"
          :disabled="loading"
          class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-xs"
        >
          <svg :class="['w-3.5 h-3.5', loading ? 'animate-spin text-indigo-600' : 'text-slate-500']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Matrix</span>
        </button>

        <button
          type="button"
          @click="openCreateModal"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs"
        >
          <span>+</span>
          <span>Create Role</span>
        </button>
      </div>
    </div>

    <!-- Error Alert with Retry -->
    <div
      v-if="error"
      class="p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 flex items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <svg class="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span class="text-sm font-medium text-rose-800 dark:text-rose-200">{{ error }}</span>
      </div>
      <button
        type="button"
        @click="fetchData"
        class="px-3 py-1 text-xs font-bold uppercase rounded bg-rose-600 text-white hover:bg-rose-700 transition"
      >
        Retry
      </button>
    </div>

    <!-- Loading Skeletons -->
    <TableSkeleton v-if="loading" :rows="4" :cols="3" class="p-4 bg-white dark:bg-slate-900 rounded-xl" />

    <!-- Roles Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="role in roles"
        :key="role.roleId || role.role_id"
        class="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
      >
        <div>
          <!-- Card Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-2">
              <span class="text-xl select-none">{{ role.icon || '🧩' }}</span>
              <span class="text-xs font-mono font-semibold text-slate-400">
                #{{ role.roleId || role.role_id }}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <span
                v-if="role.isSystem"
                class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                System
              </span>
              <span
                :class="[
                  'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                  role.roleCode === 'super_admin'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                ]"
              >
                {{ role.roleCode || role.role_code }}
              </span>
            </div>
          </div>

          <!-- Role Details -->
          <div class="mt-3">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-slate-900 dark:text-white">
                {{ role.roleName || role.role_name }}
              </h3>
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                  role.isActive !== false
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                ]"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="role.isActive !== false ? 'bg-emerald-500' : 'bg-slate-400'" />
                {{ role.isActive !== false ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {{ role.description || 'Custom platform operational role.' }}
            </p>
          </div>

          <!-- Metrics: Users & Permissions -->
          <div class="flex items-center justify-between text-xs mt-3.5 py-2 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <button
              type="button"
              @click="openUsersModal(role)"
              class="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {{ role.userCount ?? 0 }} assigned user(s)
            </button>
            <span class="text-slate-500 dark:text-slate-400">
              {{ (role.permissions || []).length }} permissions
            </span>
          </div>

          <!-- Permission preview pills -->
          <div class="flex flex-wrap gap-1 mt-3 max-h-20 overflow-y-auto p-1 bg-slate-50/60 dark:bg-slate-800/30 rounded border border-slate-100 dark:border-slate-800/50">
            <span
              v-for="p in (role.permissions || []).slice(0, 8)"
              :key="p.permission_id || p.id"
              class="text-[9px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded px-1.5 py-0.5"
            >
              {{ p.permission_code || p.code }}
            </span>
            <span
              v-if="(role.permissions || []).length > 8"
              class="text-[9px] font-semibold text-slate-400 px-1 py-0.5"
            >
              +{{ role.permissions.length - 8 }} more
            </span>
          </div>
        </div>

        <!-- Role Action Footer -->
        <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            @click="openEditModal(role)"
            class="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition font-medium"
          >
            {{ role.roleCode === 'super_admin' ? 'View Clearance' : 'Edit Matrix' }}
          </button>

          <div class="flex items-center gap-1.5">
            <button
              v-if="!role.isSystem"
              type="button"
              @click="toggleRoleStatus(role)"
              class="px-2 py-1 rounded text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              {{ role.isActive !== false ? 'Deactivate' : 'Activate' }}
            </button>

            <button
              v-if="!role.isSystem"
              type="button"
              @click="confirmDeleteRole(role)"
              class="px-2 py-1 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ----------------------------------------------------------- -->
    <!-- Create Role Modal Dialog                                    -->
    <!-- ----------------------------------------------------------- -->
    <ModalDialog :open="createModalOpen" title="Create Custom Role & Permission Set" @close="createModalOpen = false">
      <form class="space-y-4" @submit.prevent="submitCreateRole">
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="label">Role Name <span class="text-rose-500">*</span></label>
            <input
              v-model="createForm.roleName"
              type="text"
              class="input"
              placeholder="e.g. Warehouse Lead"
              required
            />
            <p v-if="createErrors.roleName" class="text-xs text-rose-500 mt-1">{{ createErrors.roleName }}</p>
          </div>

          <div>
            <label class="label">Role Code (Database Key) <span class="text-rose-500">*</span></label>
            <input
              v-model="createForm.roleCode"
              type="text"
              class="input font-mono"
              placeholder="e.g. warehouse_lead"
              required
            />
            <p v-if="createErrors.roleCode" class="text-xs text-rose-500 mt-1">{{ createErrors.roleCode }}</p>
          </div>
        </div>

        <div>
          <label class="label">Visual Identifier Icon</label>
          <div class="flex flex-wrap gap-2 items-center">
            <button
              v-for="ico in ICON_PRESETS"
              :key="ico"
              type="button"
              :class="[
                'w-9 h-9 rounded-lg border text-lg flex items-center justify-center transition',
                createForm.icon === ico
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400'
              ]"
              @click="createForm.icon = ico"
            >
              {{ ico }}
            </button>
            <input
              v-model="createForm.icon"
              type="text"
              class="input w-20 text-center text-lg"
              maxlength="8"
            />
          </div>
        </div>

        <div>
          <label class="label">Role Description</label>
          <textarea
            v-model="createForm.description"
            class="input h-20"
            placeholder="Operational scope, inventory oversight authority, and clearance boundary..."
          />
        </div>

        <!-- Permission Matrix -->
        <div class="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Grant Authoritative Permissions
              </p>
              <p class="text-[11px] text-slate-500">
                {{ createForm.permissionIds.size }} of {{ permissions.length }} capabilities selected
              </p>
            </div>
          </div>

          <div class="space-y-4 max-h-80 overflow-y-auto pr-1">
            <div
              v-for="(pList, modKey) in groupedPermissions"
              :key="modKey"
              class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
            >
              <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                <span class="text-xs font-bold text-slate-800 dark:text-white capitalize">
                  {{ MODULE_TITLES[modKey] || modKey }}
                </span>
                <button
                  type="button"
                  @click="toggleCreateModule(modKey)"
                  class="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {{ isCreateModuleAllSelected(modKey) ? 'Deselect All' : 'Select All' }}
                </button>
              </div>

              <div class="grid sm:grid-cols-2 gap-2">
                <label
                  v-for="p in pList"
                  :key="p.permission_id"
                  class="flex items-start gap-2 text-xs p-1.5 rounded hover:bg-white dark:hover:bg-slate-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="createForm.permissionIds.has(p.permission_id)"
                    @change="toggleCreatePerm(p.permission_id)"
                    class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span class="font-mono font-medium text-slate-800 dark:text-slate-200 block">
                      {{ p.permission_code }}
                    </span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {{ p.description }}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            class="btn-ghost btn-sm"
            :disabled="saving"
            @click="createModalOpen = false"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary btn-sm px-4"
            :disabled="saving"
          >
            {{ saving ? 'Saving Role…' : 'Create Role' }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <!-- ----------------------------------------------------------- -->
    <!-- Edit Role Modal Dialog                                      -->
    <!-- ----------------------------------------------------------- -->
    <ModalDialog
      :open="editModalOpen"
      :title="`Edit Role: ${activeRole?.roleName || activeRole?.role_name || ''}`"
      @close="editModalOpen = false"
    >
      <form class="space-y-4" @submit.prevent="submitEditRole">
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="label">Role Name</label>
            <input
              v-model="editForm.roleName"
              type="text"
              class="input"
              :disabled="activeRole?.roleCode === 'super_admin'"
              required
            />
          </div>

          <div>
            <label class="label">Active State</label>
            <select
              v-model="editForm.isActive"
              class="select"
              :disabled="activeRole?.isSystem"
            >
              <option :value="true">Active Operational Clearance</option>
              <option :value="false">Deactivated (Blocked from Users)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="label">Visual Identifier Icon</label>
          <div class="flex flex-wrap gap-2 items-center">
            <button
              v-for="ico in ICON_PRESETS"
              :key="ico"
              type="button"
              :class="[
                'w-9 h-9 rounded-lg border text-lg flex items-center justify-center transition',
                editForm.icon === ico
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400'
              ]"
              @click="editForm.icon = ico"
            >
              {{ ico }}
            </button>
            <input
              v-model="editForm.icon"
              type="text"
              class="input w-20 text-center text-lg"
              maxlength="8"
            />
          </div>
        </div>

        <div>
          <label class="label">Description</label>
          <textarea
            v-model="editForm.description"
            class="input h-16"
          />
        </div>

        <!-- Permission Matrix for Edit -->
        <div class="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-2">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Grant Authoritative Permissions
              </p>
              <p class="text-[11px] text-slate-500">
                {{ activeRole?.roleCode === 'super_admin' ? 'Universal Access (Root Tier)' : `${editForm.permissionIds.size} of ${permissions.length} selected` }}
              </p>
            </div>
          </div>

          <div v-if="activeRole?.roleCode === 'super_admin'" class="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-300">
            🛡️ Super Admin possesses unconditional bypass clearance across all platform APIs and routes. Its permissions cannot be reduced.
          </div>

          <div v-else class="space-y-4 max-h-72 overflow-y-auto pr-1">
            <div
              v-for="(pList, modKey) in groupedPermissions"
              :key="modKey"
              class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40"
            >
              <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                <span class="text-xs font-bold text-slate-800 dark:text-white capitalize">
                  {{ MODULE_TITLES[modKey] || modKey }}
                </span>
                <button
                  type="button"
                  @click="toggleEditModule(modKey)"
                  class="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {{ isEditModuleAllSelected(modKey) ? 'Deselect All' : 'Select All' }}
                </button>
              </div>

              <div class="grid sm:grid-cols-2 gap-2">
                <label
                  v-for="p in pList"
                  :key="p.permission_id"
                  class="flex items-start gap-2 text-xs p-1.5 rounded hover:bg-white dark:hover:bg-slate-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="editForm.permissionIds.has(p.permission_id)"
                    @change="toggleEditPerm(p.permission_id)"
                    class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span class="font-mono font-medium text-slate-800 dark:text-slate-200 block">
                      {{ p.permission_code }}
                    </span>
                    <span class="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {{ p.description }}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            class="btn-ghost btn-sm"
            :disabled="saving"
            @click="editModalOpen = false"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="btn-primary btn-sm px-4"
            :disabled="saving"
          >
            {{ saving ? 'Saving Changes…' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </ModalDialog>

    <!-- ----------------------------------------------------------- -->
    <!-- View Assigned Users Modal Dialog                            -->
    <!-- ----------------------------------------------------------- -->
    <ModalDialog
      :open="usersModalOpen"
      :title="`Assigned Accounts: ${usersRoleTitle}`"
      @close="usersModalOpen = false"
    >
      <div v-if="usersLoading" class="py-12 text-center text-slate-400 text-xs">
        Loading user directory…
      </div>
      <div v-else-if="!usersList.length" class="py-12 text-center text-slate-400 text-xs">
        No accounts currently assigned to this role.
      </div>
      <div v-else class="max-h-80 overflow-y-auto">
        <table class="w-full text-left text-xs">
          <thead class="text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th class="py-2 font-semibold">User</th>
              <th class="py-2 font-semibold">Username</th>
              <th class="py-2 font-semibold">Position</th>
              <th class="py-2 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="u in usersList" :key="u.userId" class="py-2">
              <td class="py-2 font-medium text-slate-900 dark:text-white">
                {{ u.fullName }}
                <span class="block text-[11px] text-slate-400 font-normal">{{ u.email }}</span>
              </td>
              <td class="py-2 font-mono text-slate-500 dark:text-slate-400">@{{ u.username }}</td>
              <td class="py-2 text-slate-500">{{ u.position || '—' }}</td>
              <td class="py-2 text-right">
                <span :class="u.isActive ? 'text-emerald-600 font-semibold' : 'text-slate-400'">
                  {{ u.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ModalDialog>

    <!-- ----------------------------------------------------------- -->
    <!-- Delete Role Confirmation Modal                              -->
    <!-- ----------------------------------------------------------- -->
    <ModalDialog
      :open="deleteModalOpen"
      title="Confirm Custom Role Deletion"
      @close="deleteModalOpen = false"
    >
      <div class="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <p>
          Are you sure you want to permanently delete custom role
          <strong class="text-slate-900 dark:text-white">"{{ roleToDelete?.roleName || roleToDelete?.role_code }}"</strong>?
        </p>
        <p class="text-xs text-rose-600 dark:text-rose-400">
          This operation permanently purges the role and associated permissions mapping from the database.
        </p>
      </div>

      <template #footer>
        <button
          type="button"
          class="btn-ghost btn-sm"
          :disabled="deleting"
          @click="deleteModalOpen = false"
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition"
          :disabled="deleting"
          @click="executeDeleteRole"
        >
          {{ deleting ? 'Deleting…' : 'Delete Role' }}
        </button>
      </template>
    </ModalDialog>
  </div>
</template>
