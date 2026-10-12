<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { rolesApi } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import ModalDialog from '@/components/ui/ModalDialog.vue';

const auth = useAuthStore();
const toast = useToastStore();

const roles = ref([]);
const grouped = ref({});
const loading = ref(true);

const editor = ref(false);
const active = ref(null);
const selected = ref(new Set());
const saving = ref(false);

const createModal = ref(false);
const newRole = ref({ roleCode: '', roleName: '', description: '' });
const errors = ref([]);

// Danger confirmation dialog state
const deleteModal = ref(false);
const roleToDelete = ref(null);
const deleting = ref(false);

const MODULE_LABEL = {
  inventory: 'Inventory & Stock Records',
  products:  'Product Catalog',
  movements: 'Stock Movements (FIFO/Audit)',
  alerts:    'Alerts & Notifications',
  suppliers: 'Supplier Accounts',
  roles:     'Roles & Permission Control',
  users:     'User Accounts & Passwords',
  logs:      'System Audit Logs',
  reports:   'Analytics & Insights',
  finance:   'Financial Records',
  staff:     'Staff Operations',
};

const getRoleIcon = (role) => {
  if (role?.icon) return role.icon;
  const c = (role?.roleCode || '').toLowerCase();
  if (c === 'super_admin') return '🛡️';
  if (c === 'staff_admin' || c === 'admin') return '⚙️';
  if (c.includes('manager')) return '🧭';
  if (c.includes('warehouse')) return '📦';
  if (c.includes('purchas')) return '🛒';
  if (c.includes('analyst')) return '📊';
  if (c.includes('audit')) return '🔍';
  if (c === 'staff' || c === 'user') return '👤';
  return '🧩';
};

const roleBadge = (code) => ({
  super_admin:     'badge-purple',
  warehouse_admin: 'badge-blue',
  staff_admin:     'badge-amber',
  finance_admin:   'badge-green',
}[code] || 'badge-gray');

// Users with roles.view (e.g. Staff Admin) can open the matrix read-only; only Super Admin edits it.
const readOnly = computed(() => !auth.isSuperAdmin || active.value?.roleCode === 'super_admin');

const openEditor = (role) => {
  active.value = role;
  selected.value = new Set(role.permissions.map((p) => p.permission_id));
  editor.value = true;
};

const toggle = (id) => {
  if (readOnly.value) return;
  const next = new Set(selected.value);
  next.has(id) ? next.delete(id) : next.add(id);
  selected.value = next;
};

const toggleModule = (moduleKey) => {
  if (readOnly.value) return;
  const ids = grouped.value[moduleKey]?.map((p) => p.permission_id) || [];
  const allOn = ids.every((id) => selected.value.has(id));
  const next = new Set(selected.value);
  ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
  selected.value = next;
};

const moduleState = (moduleKey) => {
  const ids = grouped.value[moduleKey]?.map((p) => p.permission_id) ?? [];
  const on = ids.filter((id) => selected.value.has(id)).length;
  return { on, total: ids.length, all: on === ids.length && ids.length > 0 };
};

const savePermissions = async () => {
  if (saving.value) return;
  saving.value = true;
  try {
    await rolesApi.setPermissions(active.value.roleId, [...selected.value]);
    toast.success(`Permissions updated for ${active.value.roleName}.`);
    editor.value = false;
    await load();
    if (active.value.roleCode === auth.roleCode) await auth.refreshProfile();
  } catch (e) {
    toast.error(e.message);
  } finally {
    saving.value = false;
  }
};

const createRole = async () => {
  if (saving.value) return;
  saving.value = true;
  errors.value = [];
  try {
    await rolesApi.create({ ...newRole.value, permissionIds: [] });
    toast.success('Role created. Assign its permissions next.');
    createModal.value = false;
    newRole.value = { roleCode: '', roleName: '', description: '' };
    await load();
  } catch (e) {
    errors.value = e.details?.map((d) => `${d.field}: ${d.message}`) ?? [e.message];
  } finally {
    saving.value = false;
  }
};

const confirmDeleteRole = (role) => {
  roleToDelete.value = role;
  deleteModal.value = true;
};

const executeDeleteRole = async () => {
  if (!roleToDelete.value || deleting.value) return;
  deleting.value = true;
  try {
    await rolesApi.remove(roleToDelete.value.roleId);
    toast.success(`Role "${roleToDelete.value.roleName}" deleted.`);
    deleteModal.value = false;
    roleToDelete.value = null;
    await load();
  } catch (e) {
    toast.error(e.message);
  } finally {
    deleting.value = false;
  }
};

const load = async () => {
  loading.value = true;
  try {
    const [list, perms] = await Promise.all([rolesApi.list(), rolesApi.permissions()]);
    roles.value = list;
    grouped.value = perms.grouped;
  } catch (e) {
    toast.error(e.message);
  } finally {
    loading.value = false;
  }
};

const modules = computed(() => Object.keys(grouped.value));

onMounted(load);
</script>

<template>
  <div class="space-y-5">
    <!-- Header panel -->
    <div class="card p-5 flex flex-wrap items-center justify-between gap-4 border-slate-200">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="text-base font-bold text-slate-900">Role-Based Access Control (RBAC)</h2>
          <span v-if="auth.isSuperAdmin" class="badge-purple font-medium">Super Admin Active</span>
        </div>
        <p class="text-xs text-slate-500 mt-1">
          Permission matrices dictate route protection and sensitive backend API calls across tenants.
        </p>
      </div>

      <button
        v-if="auth.isSuperAdmin"
        class="btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
        @click="createModal = true"
      >
        <span>+</span>
        <span>New Custom Role</span>
      </button>
      <div v-else class="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
        🔒 Role modification is reserved exclusively for Super Admin accounts.
      </div>
    </div>

    <div v-if="loading" class="text-center py-16 text-slate-400">Loading roles…</div>

    <!-- Roles Grid -->
    <div v-else class="grid gap-4 md:grid-cols-2">
      <div v-for="role in roles" :key="role.roleId" class="card border-slate-200 hover:shadow-md transition-shadow">
        <div class="card-header">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="card-title text-base flex items-center gap-1.5 font-bold text-slate-900"><span>{{ getRoleIcon(role) }}</span><span>{{ role.roleName }}</span></h3>
              <span :class="roleBadge(role.roleCode)">{{ role.roleCode }}</span>
              <span v-if="role.isSystem" class="badge-gray">system</span>
            </div>
            <p class="text-xs text-slate-500 mt-1">{{ role.description || 'No description provided.' }}</p>
          </div>
        </div>

        <div class="card-body">
          <div class="flex items-center justify-between text-xs mb-3">
            <span class="text-slate-500 font-medium">{{ role.userCount }} assigned account(s)</span>
            <span class="badge-gray">{{ role.permissions.length }} permission(s) granted</span>
          </div>

          <div class="flex flex-wrap gap-1.5 mb-4 max-h-24 overflow-y-auto p-1.5 bg-slate-50/70 rounded-lg border border-slate-100">
            <span
              v-for="p in role.permissions.slice(0, 12)"
              :key="p.permission_id"
              class="text-[10px] font-mono bg-white border border-slate-200 text-slate-700 rounded px-1.5 py-0.5"
            >
              {{ p.permission_code }}
            </span>
            <span v-if="role.permissions.length > 12" class="text-[10px] text-slate-400 px-1.5 py-0.5 font-medium">
              +{{ role.permissions.length - 12 }} more
            </span>
          </div>

          <div class="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              class="btn-ghost btn-sm"
              :disabled="role.roleCode === 'super_admin'"
              @click="openEditor(role)"
            >
              {{ role.roleCode === 'super_admin' ? 'Full Access (Protected)' : (auth.isSuperAdmin ? 'Edit Permissions' : 'View Permissions') }}
            </button>

            <button
              v-if="!role.isSystem && auth.isSuperAdmin"
              class="btn-ghost btn-sm text-red-600 hover:bg-red-50 hover:border-red-200 ml-auto"
              @click="confirmDeleteRole(role)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Permission Editor Modal -->
    <ModalDialog
      :open="editor"
      :title="`Permissions Matrix — ${active?.roleName || ''}`"
      size="lg"
      @close="editor = false"
    >
      <div class="space-y-5">
        <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <p class="text-xs text-slate-700">
            Selected: <span class="font-bold text-navy-800">{{ selected.size }}</span> total permission grants.
          </p>
          <span class="text-[11px] text-slate-500 font-mono">Role: {{ active?.roleCode }}</span>
        </div>

        <div v-for="m in modules" :key="m" class="border border-slate-200 rounded-lg overflow-hidden">
          <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
            <p class="text-xs font-bold text-slate-800 uppercase tracking-wide">{{ MODULE_LABEL[m] || m }}</p>
            <button
              v-if="!readOnly"
              type="button"
              class="text-xs font-semibold text-navy-700 hover:text-navy-900 hover:underline"
              @click="toggleModule(m)"
            >
              {{ moduleState(m).all ? 'Clear Module' : 'Grant All' }}
              ({{ moduleState(m).on }}/{{ moduleState(m).total }})
            </button>
          </div>

          <div class="p-3 grid sm:grid-cols-2 gap-2 bg-white">
            <label
              v-for="p in grouped[m]"
              :key="p.permission_id"
              class="flex items-start gap-2.5 rounded-lg p-2 hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                class="mt-0.5 rounded border-slate-300 text-navy-800 focus:ring-navy-500"
                :checked="selected.has(p.permission_id)"
                :disabled="readOnly"
                @change="toggle(p.permission_id)"
              />
              <span class="min-w-0">
                <span class="block text-xs font-mono font-medium text-slate-800">{{ p.permission_code }}</span>
                <span class="block text-[11px] text-slate-500 leading-tight">{{ p.description }}</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-ghost" :disabled="saving" @click="editor = false">{{ readOnly ? 'Close' : 'Cancel' }}</button>
        <button v-if="!readOnly" class="btn-primary" :disabled="saving" @click="savePermissions">
          {{ saving ? 'Saving…' : 'Save Permission Matrix' }}
        </button>
      </template>
    </ModalDialog>

    <!-- Create Role Modal -->
    <ModalDialog :open="createModal" title="Create New Role" @close="createModal = false">
      <div class="space-y-4">
        <div>
          <label class="label">Role Code <span class="text-red-500">*</span></label>
          <input
            v-model="newRole.roleCode"
            class="input font-mono text-sm"
            placeholder="e.g. audit_manager"
            :disabled="saving"
          />
          <p class="text-[11px] text-slate-400 mt-1">Unique alphanumeric string with underscores.</p>
        </div>
        <div>
          <label class="label">Display Name <span class="text-red-500">*</span></label>
          <input
            v-model="newRole.roleName"
            class="input text-sm"
            placeholder="e.g. Audit Manager"
            :disabled="saving"
          />
        </div>
        <div>
          <label class="label">Description</label>
          <textarea
            v-model="newRole.description"
            rows="2"
            class="input text-sm"
            placeholder="Describe administrative responsibilities for this role"
            :disabled="saving"
          />
        </div>
        <ul v-if="errors.length" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
          <li v-for="(e, i) in errors" :key="i">⚠ {{ e }}</li>
        </ul>
      </div>

      <template #footer>
        <button class="btn-ghost" :disabled="saving" @click="createModal = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="createRole">
          {{ saving ? 'Creating…' : 'Create Role' }}
        </button>
      </template>
    </ModalDialog>

    <!-- Delete Role Confirmation Modal (Replaces native confirm) -->
    <ModalDialog
      :open="deleteModal"
      title="Confirm Role Deletion"
      size="sm"
      @close="deleteModal = false"
    >
      <div class="space-y-3">
        <p class="text-sm text-slate-700">
          Are you sure you want to permanently delete the role
          <strong class="text-slate-900 font-semibold">"{{ roleToDelete?.roleName }}"</strong>?
        </p>
        <p class="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2.5">
          ⚠ This action is destructive and cannot be undone. Any user currently assigned this role must be reassigned.
        </p>
      </div>

      <template #footer>
        <button class="btn-ghost" :disabled="deleting" @click="deleteModal = false">Cancel</button>
        <button class="btn-danger" :disabled="deleting" @click="executeDeleteRole">
          {{ deleting ? 'Deleting…' : 'Yes, Delete Role' }}
        </button>
      </template>
    </ModalDialog>
  </div>
</template>
