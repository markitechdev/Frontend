<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { inventoryApi, productsApi, categoriesApi, suppliersApi, movementsApi } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { useDashboardStore } from '@/stores/dashboard';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import ModalDialog from '@/components/ui/ModalDialog.vue';
import TableSkeleton from '@/components/ui/TableSkeleton.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToastStore();
const dashboardStore = useDashboardStore();

const rows = ref([]);
const categories = ref([]);
const suppliers = ref([]);
const loading = ref(true);

const filters = reactive({
  search: (route.query.search || '').toString(),
  status: (route.query.status || '').toString(),
  categoryId: (route.query.categoryId || '').toString(),
});

const syncQuery = () => {
  const query = {};
  if (filters.search) query.search = filters.search;
  if (filters.status) query.status = filters.status;
  if (filters.categoryId) query.categoryId = filters.categoryId;
  router.replace({ query });
};

const clearFilters = () => {
  filters.search = '';
  filters.status = '';
  filters.categoryId = '';
  syncQuery();
};

/* ------------------------------------------------------------ product form */
const productModal = ref(false);
const editingId = ref(null);
const saving = ref(false);
const form = reactive({
  productName: '', sku: '', categoryId: '', supplierId: '',
  unitPrice: 0, unitOfMeasure: 'pc', expirationDate: '',
  currentStock: 0, minimumStock: 0, reorderPoint: 0, location: 'Main Warehouse',
});
const formErrors = ref([]);

const resetForm = () => {
  Object.assign(form, {
    productName: '', sku: '', categoryId: '', supplierId: '',
    unitPrice: 0, unitOfMeasure: 'pc', expirationDate: '',
    currentStock: 0, minimumStock: 0, reorderPoint: 0, location: 'Main Warehouse',
  });
  formErrors.value = [];
  editingId.value = null;
};

const openCreate = () => { resetForm(); productModal.value = true; };

const openEdit = (row) => {
  resetForm();
  editingId.value = row.product.product_id;
  Object.assign(form, {
    productName: row.product.product_name,
    sku: row.product.sku,
    categoryId: row.product.category?.category_id ?? '',
    supplierId: row.product.supplier?.supplier_id ?? '',
    unitPrice: Number(row.product.unit_price),
    expirationDate: row.product.expiration_date ?? '',
    currentStock: row.current_stock,
    minimumStock: row.minimum_stock,
    reorderPoint: row.reorder_point,
    location: row.location ?? 'Main Warehouse',
  });
  productModal.value = true;
};

const saveProduct = async () => {
  saving.value = true;
  formErrors.value = [];
  try {
    const payload = {
      productName: form.productName,
      sku: form.sku,
      categoryId: form.categoryId || null,
      supplierId: form.supplierId || null,
      unitPrice: Number(form.unitPrice),
      unitOfMeasure: form.unitOfMeasure,
      expirationDate: form.expirationDate || null,
      minimumStock: Number(form.minimumStock),
      reorderPoint: Number(form.reorderPoint),
      location: form.location,
    };
    if (editingId.value) {
      await productsApi.update(editingId.value, payload);
      toast.success('Product updated successfully.');
      dashboardStore.invalidate();
    } else {
      await productsApi.create({ ...payload, currentStock: Number(form.currentStock) });
      toast.success('Product added to inventory catalog.');
      dashboardStore.invalidate();
    }
    productModal.value = false;
    await load();
  } catch (e) {
    formErrors.value = e.details?.map((d) => `${d.field}: ${d.message}`) ?? [e.message];
  } finally {
    saving.value = false;
  }
};

const deleteModal = ref(false);
const deleteTarget = ref(null);
const deleting = ref(false);

const confirmDelete = (row) => {
  deleteTarget.value = row;
  deleteModal.value = true;
};

const executeDelete = async () => {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    await productsApi.remove(deleteTarget.value.product.product_id);
    toast.success(`Product "${deleteTarget.value.product.product_name}" deleted.`);
    dashboardStore.invalidate();
    deleteModal.value = false;
    deleteTarget.value = null;
    await load();
  } catch (e) {
    toast.error(e.message);
  } finally {
    deleting.value = false;
  }
};

/* ---------------------------------------------------------- stock movement */
const moveModal = ref(false);
const moveTarget = ref(null);
const moveForm = reactive({ movementType: 'stock_in', quantity: 1, reason: '', referenceNo: '' });
const moveError = ref('');

const openMovement = (row) => {
  moveTarget.value = row;
  Object.assign(moveForm, { movementType: 'stock_in', quantity: 1, reason: '', referenceNo: '' });
  moveError.value = '';
  moveModal.value = true;
};

const submitMovement = async () => {
  if (!moveForm.quantity || Number(moveForm.quantity) <= 0) {
    moveError.value = 'Quantity must be greater than zero.';
    return;
  }
  saving.value = true;
  moveError.value = '';
  try {
    await movementsApi.create({
      productId: moveTarget.value.product.product_id,
      movementType: moveForm.movementType,
      quantity: Number(moveForm.quantity),
      reason: moveForm.reason || null,
      referenceNo: moveForm.referenceNo || null,
    });
    toast.success('Stock movement recorded in ledger.');
    dashboardStore.invalidate();
    moveModal.value = false;
    await load();
  } catch (e) {
    moveError.value = e.message;
  } finally {
    saving.value = false;
  }
};

/* ------------------------------------------------------------------- load */
const load = async () => {
  loading.value = true;
  try {
    const res = await inventoryApi.list({
      search: filters.search, status: filters.status, categoryId: filters.categoryId,
    });
    rows.value = res.data;
  } catch (e) { toast.error(e.message); }
  finally { loading.value = false; }
};

const peso = (n) => (n === null || n === undefined || n === '') ? '--' : `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

const counts = computed(() => {
  if (loading.value) {
    return { all: '--', low: '--', out: '--', totalValue: '--' };
  }
  const totalVal = rows.value.reduce((acc, r) => acc + (r.current_stock * Number(r.product?.unit_price || 0)), 0);
  return {
    all: rows.value.length,
    low: rows.value.filter((r) => r.stock_status === 'low_stock').length,
    out: rows.value.filter((r) => r.stock_status === 'out_of_stock').length,
    totalValue: `₱${Number(totalVal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
  };
});

let t;
watch(() => filters.search, () => { clearTimeout(t); t = setTimeout(load, 350); });
watch(() => [filters.status, filters.categoryId], load);

onMounted(async () => {
  await load();
  try {
    categories.value = await categoriesApi.list();
    if (auth.can('suppliers.view')) suppliers.value = await suppliersApi.list({ active: 'true' });
  } catch { /* filters simply stay empty */ }
});
</script>

<template>
  <div class="space-y-5">
    <!-- View Header & Operational Status Ribbon -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-bold tracking-widest text-sky-600 uppercase">
            Warehouse Logistics
          </span>
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            Stock Control
          </span>
        </div>
        <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
          Inventory Catalog & Stock Control
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Real-time physical inventory monitoring, threshold management, and stock allocation.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          type="button"
          class="btn-ghost btn-sm"
          :disabled="loading"
          @click="load"
          title="Refresh catalog list"
        >
          <svg :class="['w-3.5 h-3.5', loading ? 'animate-spin text-sky-600' : 'text-slate-500']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>

        <button
          v-if="auth.can('products.create')"
          class="btn-primary btn-sm"
          @click="openCreate"
        >
          <span>+ Add Product</span>
        </button>
      </div>
    </div>

    <!-- Filter Toolbar & Inventory Summary Ribbon -->
    <div class="card p-4 space-y-3">
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-[220px]">
          <input
            v-model="filters.search"
            class="input pl-9"
            placeholder="Search product name, SKU or location…"
          />
          <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select v-model="filters.status" class="select w-auto min-w-[150px]">
          <option value="">All Statuses</option>
          <option value="in_stock">✅ In Stock</option>
          <option value="low_stock">⚠️ Low Stock</option>
          <option value="reorder">🔄 Reorder Due</option>
          <option value="out_of_stock">⛔ Out of Stock</option>
        </select>

        <select v-model="filters.categoryId" class="select w-auto min-w-[160px]">
          <option value="">All Categories</option>
          <option v-for="c in categories" :key="c.category_id" :value="c.category_id">
            {{ c.category_name }}
          </option>
        </select>

        <button
          v-if="filters.search || filters.status || filters.categoryId"
          type="button"
          class="btn-ghost btn-sm"
          @click="clearFilters"
        >
          Clear Filters
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-xs">
        <span class="font-semibold text-slate-700">
          Showing <span class="font-bold text-slate-900">{{ counts.all }}</span> catalog item(s)
        </span>
        <span class="text-slate-300 font-bold">•</span>
        <span class="font-semibold text-amber-700">
          {{ counts.low }} Low Stock
        </span>
        <span class="text-slate-300 font-bold">•</span>
        <span class="font-semibold text-rose-700">
          {{ counts.out }} Out of Stock
        </span>
        <span class="ml-auto font-semibold text-slate-700 hidden sm:inline">
          Filter Valuation: <span class="font-bold text-slate-900 font-mono">{{ counts.totalValue }}</span>
        </span>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Product Details</th>
              <th>Category</th>
              <th>Supplier</th>
              <th class="text-right">On Hand</th>
              <th class="text-right">Min</th>
              <th class="text-right">Reorder Point</th>
              <th class="text-right">Unit Price</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <TableSkeleton v-if="loading" :columns="9" :rows="6" />
          <tbody v-else class="divide-y divide-slate-100">
            <tr v-if="!rows.length">
              <td colspan="9" class="text-center py-14 text-slate-400 font-medium">
                No inventory records match the current filter criteria.
              </td>
            </tr>
            <tr v-else v-for="r in rows" :key="r.inventory_id" class="hover:bg-slate-50/80 transition-colors">
              <td class="py-3 px-4">
                <RouterLink
                  :to="`/inventory/${r.product.product_id}`"
                  class="font-bold text-slate-900 hover:text-sky-600 transition"
                >
                  {{ r.product.product_name }}
                </RouterLink>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[11px] text-slate-500 font-mono">SKU: {{ r.product.sku }}</span>
                  <span v-if="r.location" class="text-[10px] text-slate-400">· {{ r.location }}</span>
                </div>
              </td>
              <td class="py-3 px-4 text-slate-700 font-medium">
                {{ r.product.category?.category_name || '—' }}
              </td>
              <td class="py-3 px-4 text-slate-700 font-medium">
                {{ r.product.supplier?.supplier_name || '—' }}
              </td>
              <td class="py-3 px-4 text-right font-black tabular-nums text-slate-900 text-sm">
                {{ r.current_stock }}
              </td>
              <td class="py-3 px-4 text-right tabular-nums text-slate-500 font-medium">
                {{ r.minimum_stock }}
              </td>
              <td class="py-3 px-4 text-right tabular-nums text-slate-500 font-medium">
                {{ r.reorder_point }}
              </td>
              <td class="py-3 px-4 text-right tabular-nums text-slate-800 font-semibold font-mono">
                {{ peso(r.product.unit_price) }}
              </td>
              <td class="py-3 px-4">
                <StatusBadge :status="r.stock_status" />
              </td>
              <td class="py-3 px-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    v-if="auth.can('movements.create')"
                    class="btn-ghost btn-sm"
                    @click="openMovement(r)"
                    title="Record Movement"
                  >
                    ⇄ Stock
                  </button>
                  <button
                    v-if="auth.can('products.update')"
                    class="btn-ghost btn-sm"
                    @click="openEdit(r)"
                    title="Edit Product"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    v-if="auth.can('products.delete')"
                    class="btn-ghost btn-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    @click="confirmDelete(r)"
                    title="Delete Product"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Product Form Modal (Add / Edit) -->
    <ModalDialog
      :open="productModal"
      :title="editingId ? 'Edit Inventory Item' : 'Add New Inventory Product'"
      size="lg"
      @close="productModal = false"
    >
      <div class="grid sm:grid-cols-2 gap-4 text-xs">
        <div class="sm:col-span-2">
          <label class="label">Product Name *</label>
          <input v-model="form.productName" class="input" placeholder="e.g. Ergonomic Industrial Scanner" />
        </div>
        <div>
          <label class="label">SKU (Stock Keeping Unit) *</label>
          <input v-model="form.sku" class="input font-mono" placeholder="SKU-8921" />
        </div>
        <div>
          <label class="label">Unit Price (₱) *</label>
          <input v-model.number="form.unitPrice" type="number" min="0" step="0.01" class="input" placeholder="0.00" />
        </div>
        <div>
          <label class="label">Category</label>
          <select v-model="form.categoryId" class="select">
            <option value="">— Select Category —</option>
            <option v-for="c in categories" :key="c.category_id" :value="c.category_id">{{ c.category_name }}</option>
          </select>
        </div>
        <div>
          <label class="label">Supplier Partner</label>
          <select v-model="form.supplierId" class="select">
            <option value="">— Select Supplier —</option>
            <option v-for="s in suppliers" :key="s.supplier_id" :value="s.supplier_id">{{ s.supplier_name }}</option>
          </select>
        </div>

        <div v-if="!editingId">
          <label class="label">Opening Stock Quantity</label>
          <input v-model.number="form.currentStock" type="number" min="0" class="input" />
        </div>
        <div v-else>
          <label class="label">Current Stock on Hand</label>
          <input :value="form.currentStock" class="input bg-slate-100 font-bold" disabled />
          <p class="text-[11px] text-slate-500 mt-1">Stock adjustments are recorded via movement entries.</p>
        </div>

        <div>
          <label class="label">Minimum Stock Alert Threshold</label>
          <input v-model.number="form.minimumStock" type="number" min="0" class="input" />
        </div>
        <div>
          <label class="label">Reorder Point Threshold</label>
          <input v-model.number="form.reorderPoint" type="number" min="0" class="input" />
        </div>
        <div>
          <label class="label">Expiration Date (Optional)</label>
          <input v-model="form.expirationDate" type="date" class="input" />
        </div>
        <div>
          <label class="label">Storage Location / Bay</label>
          <input v-model="form.location" class="input" placeholder="e.g. Bay 4 - Shelf B" />
        </div>
      </div>

      <ul v-if="formErrors.length" class="mt-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 space-y-1">
        <li v-for="(e, i) in formErrors" :key="i">⚠ {{ e }}</li>
      </ul>

      <template #footer>
        <button class="btn-ghost" @click="productModal = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="saveProduct">
          {{ saving ? 'Saving…' : (editingId ? 'Save Changes' : 'Confirm & Add Product') }}
        </button>
      </template>
    </ModalDialog>

    <!-- Movement Recording Modal -->
    <ModalDialog
      :open="moveModal"
      title="Record Stock Movement"
      @close="moveModal = false"
    >
      <div v-if="moveTarget" class="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-4 text-xs space-y-1">
        <p class="font-bold text-slate-900 text-sm">{{ moveTarget.product.product_name }}</p>
        <p class="text-slate-500 font-mono">SKU: {{ moveTarget.product.sku }}</p>
        <p class="text-slate-700 font-medium pt-1">
          Current Stock on Hand: <span class="font-black text-slate-900">{{ moveTarget.current_stock }}</span> units
        </p>
      </div>

      <div class="space-y-3.5 text-xs">
        <div>
          <label class="label">Movement Classification *</label>
          <select v-model="moveForm.movementType" class="select font-semibold">
            <option value="stock_in">📥 Stock In — goods received from supplier</option>
            <option value="stock_out">📤 Stock Out — goods issued or dispatched</option>
            <option value="returned">↩️ Returned — stock returned to shelf</option>
            <option value="damaged">⚠️ Damaged — written off goods</option>
            <option value="missing">🔍 Missing — inventory count discrepancy</option>
            <option value="adjustment">🛠 Adjustment — operational count correction</option>
          </select>
        </div>

        <div>
          <label class="label">Quantity Units *</label>
          <input v-model.number="moveForm.quantity" type="number" min="1" class="input font-bold" />
        </div>

        <div>
          <label class="label">Reference / PO / Waybill No.</label>
          <input v-model="moveForm.referenceNo" class="input font-mono" placeholder="e.g. PO-2026-0041" />
        </div>

        <div>
          <label class="label">Reason / Notes</label>
          <input v-model="moveForm.reason" class="input" placeholder="e.g. Replenishment shipment received" />
        </div>

        <div v-if="moveError" class="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
          {{ moveError }}
        </div>
      </div>

      <template #footer>
        <button class="btn-ghost" @click="moveModal = false">Cancel</button>
        <button class="btn-primary" :disabled="saving" @click="submitMovement">
          {{ saving ? 'Recording…' : 'Save Ledger Entry' }}
        </button>
      </template>
    </ModalDialog>

    <!-- Delete Confirmation Modal -->
    <ModalDialog
      :open="deleteModal"
      title="Delete Product Confirmation"
      size="sm"
      @close="deleteModal = false"
    >
      <div class="text-xs space-y-3 text-slate-600">
        <p>
          Are you sure you want to delete this product from the inventory catalog?
        </p>
        <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-bold">
          {{ deleteTarget?.product?.product_name }} ({{ deleteTarget?.product?.sku }})
        </div>
        <p class="text-[11px] text-slate-500">
          This operation will remove catalog references and associated threshold records.
        </p>
      </div>

      <template #footer>
        <button class="btn-ghost" @click="deleteModal = false">Cancel</button>
        <button class="btn-danger" :disabled="deleting" @click="executeDelete">
          {{ deleting ? 'Deleting…' : 'Delete Permanently' }}
        </button>
      </template>
    </ModalDialog>
  </div>
</template>
