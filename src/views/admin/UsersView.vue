<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { usersApi, rolesApi } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import ModalDialog from '@/components/ui/ModalDialog.vue';
import TableSkeleton from '@/components/ui/TableSkeleton.vue';

const auth = useAuthStore();
const toast = useToastStore();

const users = ref([]);
const roles = ref([]);
const loading = ref(true);
const filters = reactive({ search: '', role: '', active: '' });

const modal = ref(false);
const editingId = ref(null);
const saving = ref(false);
const errors = ref([]);
const form = reactive({
  fullName: '', username: '', email: '', password: '',
  roleId: '', position: '', contactNumber: '', isActive: true,
});

const pwModal = ref(false);
const pwTarget = ref(null);
const newPassword = ref('');

const getRoleDisplay = (code, name) => {
  const c = (code || '').toLowerCase();
  let icon = '👤';
  if (c === 'super_admin') icon = '🛡️';
  else if (c === 'staff_admin' || c === 'admin') icon = '⚙️';
  else if (c.includes('manager')) icon = '🧭';
  else if (c.includes('warehouse')) icon = '📦';
  else if (c.includes('purchas')) icon = '🛒';
  else if (c.includes('analyst')) icon = '📊';
  else if (c.includes('audit')) icon = '🔍';
  else if (c.includes('finance')) icon = '💰';
  else if (c === 'staff' || c === 'user') icon = '👤';
  else if (c) icon = '🧩';
  return { icon, text: name || (code ? code.toUpperCase() : 'Staff') };
};

const roleBadge = (code) => ({
  super_admin: 'badge-purple', warehouse_admin: 'badge-blue',
  staff_admin: 'badge-amber', finance_admin: 'badge-green',
}[code] || 'badge-gray');

const reset = () => {
  Object.assign(form, {
    fullName: '', username: '', email: '', password: '',
    roleId: availableRoles.value[0]?.roleId ?? '', position: '', contactNumber: '', isActive: true,
  });
  errors.value = []; editingId.value = null;
};

const openCreate = () => { reset(); modal.value = true; };

const openEdit = (u) => {
  reset();
  editingId.value = u.userId;
  Object.assign(form, {
    fullName: u.fullName, username: u.username, email: u.email,
    roleId: u.role?.roleId ?? '', position: u.position ?? '',
    contactNumber: u.contactNumber ?? '', isActive: u.isActive,
  });
  modal.value = true;
};

const save = async () => {
  if (saving.value) return;
  errors.value = [];
  if (!form.fullName.trim() || !form.username.trim() || (!editingId.value && (!form.email.trim() || form.password.length < 8)) || !form.roleId) {
    errors.value = ['Please fill in every required field (password: at least 8 characters).'];
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await usersApi.update(editingId.value, {
        fullName: form.fullName, username: form.username, roleId: Number(form.roleId),
        position: form.position || null, contactNumber: form.contactNumber || null,
        isActive: form.isActive,
      });
      toast.success('User updated.');
    } else {
      await usersApi.create({
        fullName: form.fullName, username: form.username, email: form.email,
        password: form.password, roleId: Number(form.roleId),
        position: form.position || null, contactNumber: form.contactNumber || null,
      });
      toast.success('User account created.');
    }
    modal.value = false;
    await load();
  } catch (e) {
    errors.value = e.details?.map((d) => `${d.field}: ${d.message}`) ?? [e.message];
  } finally { saving.value = false; }
};

const rowBusy = ref(null);
const toggleActive = async (u) => {
  if (rowBusy.value) return;
  rowBusy.value = u.userId;
  try {
    await usersApi.update(u.userId, { isActive: !u.isActive });
    toast.success(u.isActive ? 'Account deactivated.' : 'Account reactivated.');
    await load();
  } catch (e) { toast.error(e.message); }
  finally { rowBusy.value = null; }
};

const isSelf = (u) => u.userId === (auth.user?.id || auth.user?.userId);

const deleteModal = ref(false);
const deleteTarget = ref(null);
const deleting = ref(false);

/*
 * Same rule as the API: "administrator" roles are Super Admin or any role that
 * can manage accounts. Only a Super Admin may assign them, or change, reset or
 * delete an account that holds one.
 */
const ADMIN_PERMS = ['users.manage', 'roles.manage', 'system.manage', 'security.manage'];
const adminRoleIds = computed(() => new Set(roles.value
  .filter((r) => r.roleCode === 'super_admin' || (r.permissions || []).some((p) => ADMIN_PERMS.includes(p.permission_code)))
  .map((r) => r.roleId)));

/** Can the signed-in user change / reset / delete this account? */
const canManage = (u) => auth.isSuperAdmin || !adminRoleIds.value.has(u.role?.roleId);

const availableRoles = computed(() => roles.value.filter((r) =>
  r.isActive !== false && (auth.isSuperAdmin || !adminRoleIds.value.has(r.roleId))));

const confirmDelete = (u) => {
  deleteTarget.value = u;
  deleteModal.value = true;
};

const executeDelete = async () => {
  if (!deleteTarget.value || deleting.value) return;
  deleting.value = true;
  try {
    await usersApi.remove(deleteTarget.value.userId);
    toast.success('Account deleted.');
    deleteModal.value = false;
    deleteTarget.value = null;
    await load();
  } catch (e) {
    toast.error(e.message);
  } finally {
    deleting.value = false;
  }
};

const openPassword = (u) => { pwTarget.value = u; newPassword.value = ''; pwModal.value = true; };

const savePassword = async () => {
  if (saving.value) return;
  saving.value = true;
  try {
    await usersApi.resetPassword(pwTarget.value.userId, newPassword.value);
    toast.success(`Password reset for ${pwTarget.value.fullName}.`);
    pwModal.value = false;
  } catch (e) { toast.error(e.message); }
  finally { saving.value = false; }
};

const loadError = ref('');
let requestSeq = 0;
const load = async () => {
  const seq = ++requestSeq;
  loading.value = true;
  loadError.value = '';
  try {
    const list = await usersApi.list({ search: filters.search, role: filters.role, active: filters.active });
    if (seq === requestSeq) users.value = list; // ignore out-of-order responses from fast typing
  } catch (e) {
    if (seq === requestSeq) loadError.value = e.message;
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
};

let t;
watch(() => filters.search, () => { clearTimeout(t); t = setTimeout(load, 350); });
watch(() => [filters.role, filters.active], load);

onMounted(async () => {
  try { roles.value = await rolesApi.list(); } catch { /* ignore */ }
  await load();
});
</script>

<template>
  <div class="space-y-5">
    <div class="card p-4 flex flex-wrap items-center gap-3">
      <input v-model="filters.search" class="input flex-1 min-w-[200px]" placeholder="Search name, username or email…" />
      <select v-model="filters.role" class="select w-auto min-w-[170px]">
        <option value="">All roles</option>
        <option v-for="r in roles" :key="r.roleId" :value="r.roleCode">{{ r.roleName }}</option>
      </select>
      <select v-model="filters.active" class="select w-auto min-w-[140px]">
        <option value="">All accounts</option>
        <option value="true">Active only</option>
        <option value="false">Deactivated</option>
      </select>
      <button v-if="auth.can('users.manage')" class="btn-primary btn-sm ml-auto" @click="openCreate">
        + Add User
      </button>
    </div>

    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Position</th><th>Status</th><th class="text-right">Actions</th></tr>
          </thead>
          <TableSkeleton v-if="loading" :columns="7" :rows="5" />
          <tbody v-else>
            <tr v-if="loadError">
              <td colspan="7" class="text-center py-10">
                <p class="text-sm text-red-600">{{ loadError }}</p>
                <button class="btn-ghost btn-sm mt-2" @click="load">Try again</button>
              </td>
            </tr>
            <tr v-else-if="!users.length">
              <td colspan="7" class="text-center py-12 text-slate-400">
                {{ filters.search || filters.role || filters.active ? 'No accounts match these filters.' : 'No user accounts yet.' }}
              </td>
            </tr>
            <tr v-else v-for="u in users" :key="u.userId">
              <td class="font-medium text-slate-800">{{ u.fullName }}</td>
              <td class="font-mono text-xs text-slate-500">{{ u.username }}</td>
              <td class="text-slate-600 text-sm">{{ u.email }}</td>
              <td><span :class="roleBadge(u.role?.roleCode)">{{ u.role?.roleName }}</span></td>
              <td class="text-slate-600 text-sm">{{ u.position || '—' }}</td>
              <td><span :class="u.isActive ? 'badge-green' : 'badge-gray'">{{ u.isActive ? 'Active' : 'Deactivated' }}</span></td>
              <td class="text-right whitespace-nowrap">
                <template v-if="auth.can('users.manage') && (canManage(u) || isSelf(u))">
                  <button class="btn-ghost btn-sm mr-1" @click="openEdit(u)">Edit</button>
                  <button class="btn-ghost btn-sm mr-1" @click="openPassword(u)">Password</button>
                  <template v-if="!isSelf(u)">
                    <button class="btn-ghost btn-sm mr-1" :disabled="rowBusy === u.userId" @click="toggleActive(u)">
                      {{ rowBusy === u.userId ? '…' : (u.isActive ? 'Disable' : 'Enable') }}
                    </button>
                    <button class="btn-ghost btn-sm text-red-600" @click="confirmDelete(u)">Delete</button>
                  </template>
                </template>
                <span v-else-if="auth.can('users.manage')" class="text-xs text-slate-400" title="Only a Super Admin can change administrator accounts">Admin account</span>
                <span v-else class="text-xs text-slate-400">View only</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- user modal -->
    <ModalDialog :open="modal" :title="editingId ? 'Edit User' : 'Add User'" @close="modal = false">
      <div class="space-y-4">
        <div><label class="label">Full name *</label><input v-model="form.fullName" class="input" /></div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div><label class="label">Username *</label><input v-model="form.username" class="input font-mono" /></div>
          <div>
            <label class="label">Email *</label>
            <input v-model="form.email" type="email" class="input" :disabled="!!editingId" />
            <p v-if="editingId" class="text-[11px] text-slate-400 mt-1">Email cannot be changed here.</p>
          </div>
        </div>
        <div v-if="!editingId">
          <label class="label">Temporary password *</label>
          <input v-model="form.password" type="text" class="input font-mono" placeholder="At least 8 characters" />
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="label">Role *</label>
            <select v-model="form.roleId" class="select" :disabled="!!editingId && editingId === (auth.user?.id || auth.user?.userId)">
              <option v-for="r in availableRoles" :key="r.roleId" :value="r.roleId">{{ r.roleName }}</option>
            </select>
          </div>
          <div><label class="label">Position</label><input v-model="form.position" class="input" /></div>
        </div>
        <div><label class="label">Contact number</label><input v-model="form.contactNumber" class="input" /></div>
        <label v-if="editingId" class="flex items-center gap-2 text-sm text-slate-700">
          <input v-model="form.isActive" type="checkbox" class="rounded border-slate-300" />
          Account is active
        </label>
        <ul v-if="errors.length" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-0.5">
          <li v-for="(e, i) in errors" :key="i">{{ e }}</li>
        </ul>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="modal = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</button>
      </template>
    </ModalDialog>

    <!-- password modal -->
    <ModalDialog :open="pwModal" title="Reset Password" size="sm" @close="pwModal = false">
      <p class="text-sm text-slate-600 mb-4">
        Set a new password for <span class="font-semibold">{{ pwTarget?.fullName }}</span>.
        Share it with them directly and ask them to change it.
      </p>
      <label class="label">New password</label>
      <input v-model="newPassword" type="text" class="input font-mono" placeholder="At least 8 characters" />
      <template #footer>
        <button class="btn-ghost" @click="pwModal = false">Cancel</button>
        <button class="btn-primary" :disabled="saving || newPassword.length < 8" @click="savePassword">
          {{ saving ? 'Saving…' : 'Reset password' }}
        </button>
      </template>
    </ModalDialog>
<!-- delete confirmation modal -->
    <ModalDialog :open="deleteModal" title="Delete User Account" size="sm" @close="deleteModal = false">
      <div class="space-y-3">
        <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <p class="font-semibold">Destructive Action</p>
          <p class="mt-1">
            Permanently delete the user account for
            <span class="font-bold underline">{{ deleteTarget?.fullName }}</span>?
          </p>
          <p class="mt-2 text-xs text-red-700">
            This cannot be undone. Active login sessions for this account will be terminated immediately.
          </p>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" :disabled="deleting" @click="deleteModal = false">Cancel</button>
        <button class="btn-danger" :disabled="deleting" @click="executeDelete">
          {{ deleting ? 'Deleting…' : 'Delete Account' }}
        </button>
      </template>
    </ModalDialog>
  </div>
</template>
