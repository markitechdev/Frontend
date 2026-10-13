<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { salesApi, inventoryApi } from '@/api';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import StatCard from '@/components/ui/StatCard.vue';
import ModalDialog from '@/components/ui/ModalDialog.vue';
import AnimatedNumber from '@/components/ui/AnimatedNumber.vue';

/**
 * Sales & transaction management (finance.view / finance.manage).
 * Recording a sale issues the stock through the movement ledger on the server,
 * so the inventory, alerts and this page always agree.
 */
const auth = useAuthStore();
const toast = useToastStore();
const canManage = computed(() => auth.can('finance.manage'));

const PAYMENT_LABELS = { cash: 'Cash', gcash: 'GCash', card: 'Card', bank_transfer: 'Bank transfer' };
const paymentLabel = (m) => PAYMENT_LABELS[m] || m || '—';
const peso = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (d) => (d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const todayIso = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------- today
const today = ref(null);
const loadToday = async () => {
  try { today.value = (await salesApi.summary({ from: todayIso(), to: todayIso() })).summary; }
  catch { today.value = null; }
};

// ---------------------------------------------------------------- list
const rows = ref([]);
const loading = ref(true);
const error = ref('');
const filters = reactive({ search: '', status: 'all', paymentMethod: '', from: '', to: '' });
const page = ref(1);
const pageSize = 15;
const total = ref(0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
let seq = 0;

const load = async () => {
  if (filters.from && filters.to && filters.from > filters.to) { toast.error('"From" date must be on or before the "To" date.'); return; }
  const my = ++seq;
  loading.value = true; error.value = '';
  try {
    const res = await salesApi.list({
      page: page.value, limit: pageSize,
      status: filters.status, paymentMethod: filters.paymentMethod || undefined,
      search: filters.search.trim() || undefined, from: filters.from || undefined, to: filters.to || undefined,
    });
    if (my !== seq) return;
    rows.value = res.data || [];
    total.value = res.pagination?.total ?? res.meta?.total ?? rows.value.length;
  } catch (e) {
    if (my === seq) error.value = e.message;
  } finally {
    if (my === seq) loading.value = false;
  }
};
const applyFilters = () => { page.value = 1; load(); };
const goTo = (p) => { page.value = Math.min(Math.max(1, p), totalPages.value); load(); };
const clearFilters = () => { Object.assign(filters, { search: '', status: 'all', paymentMethod: '', from: '', to: '' }); applyFilters(); };
watch(() => [filters.status, filters.paymentMethod], applyFilters);

// ---------------------------------------------------------------- record a sale
const saleModal = ref(false);
const saving = ref(false);
const products = ref([]);
const productsLoading = ref(false);
const productSearch = ref('');
const form = reactive({ customerName: '', paymentMethod: 'cash', discount: 0, notes: '', items: [] });

const loadProducts = async () => {
  productsLoading.value = true;
  try {
    const res = await inventoryApi.list({});
    products.value = (res.data || [])
      .filter((r) => r.product && r.product.status === 'active')
      .map((r) => ({ productId: r.product.product_id, name: r.product.product_name, sku: r.product.sku, unitPrice: Number(r.product.unit_price), stock: Number(r.current_stock) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) { toast.error(e.message); }
  finally { productsLoading.value = false; }
};

const openSale = async () => {
  Object.assign(form, { customerName: '', paymentMethod: 'cash', discount: 0, notes: '', items: [] });
  productSearch.value = '';
  saleModal.value = true;
  if (!products.value.length) await loadProducts();
};

const pickable = computed(() => {
  const q = productSearch.value.trim().toLowerCase();
  const chosen = new Set(form.items.map((i) => i.productId));
  return products.value
    .filter((p) => !chosen.has(p.productId))
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    .slice(0, 8);
});
const addItem = (p) => { form.items.push({ ...p, quantity: 1 }); productSearch.value = ''; };
const removeItem = (i) => form.items.splice(i, 1);
const clampQty = (item) => { item.quantity = Math.max(1, Math.min(item.stock, Math.floor(Number(item.quantity) || 1))); };

const subtotal = computed(() => form.items.reduce((s, i) => s + i.unitPrice * (Number(i.quantity) || 0), 0));
const discount = computed(() => Math.max(0, Number(form.discount) || 0));
const grandTotal = computed(() => Math.max(0, subtotal.value - discount.value));
const formError = computed(() => {
  if (!form.items.length) return 'Add at least one item.';
  if (form.items.some((i) => !i.quantity || i.quantity < 1)) return 'Every item needs a quantity of at least 1.';
  if (form.items.some((i) => i.quantity > i.stock)) return 'A quantity is higher than the stock on hand.';
  if (discount.value > subtotal.value) return 'The discount is larger than the subtotal.';
  return '';
});

const submitSale = async () => {
  if (formError.value) { toast.error(formError.value); return; }
  saving.value = true;
  try {
    const sale = await salesApi.create({
      items: form.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      customerName: form.customerName.trim() || null,
      paymentMethod: form.paymentMethod,
      discount: discount.value,
      notes: form.notes.trim() || null,
    });
    toast.success(`Sale ${sale.referenceNo} recorded — ${peso(sale.total)}.`);
    saleModal.value = false;
    products.value = []; // stock changed; reload next time
    page.value = 1;
    await Promise.all([load(), loadToday()]);
  } catch (e) { toast.error(e.message); }
  finally { saving.value = false; }
};

// ---------------------------------------------------------------- details / void
const detail = ref(null);
const detailModal = ref(false);
const voidReason = ref('');
const voiding = ref(false);
const openDetail = (sale) => { detail.value = sale; voidReason.value = ''; detailModal.value = true; };

const voidSale = async () => {
  if (!detail.value) return;
  voiding.value = true;
  try {
    const updated = await salesApi.void(detail.value.saleId, { reason: voidReason.value.trim() || null });
    toast.success(`Sale ${updated.referenceNo} voided; stock returned.`);
    detail.value = updated;
    products.value = [];
    await Promise.all([load(), loadToday()]);
  } catch (e) { toast.error(e.message); }
  finally { voiding.value = false; }
};

onMounted(() => { load(); loadToday(); });
</script>

<template>
  <div class="space-y-5">
    <!-- header -->
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <p class="text-xs font-bold tracking-widest text-sky-700 uppercase">Sales</p>
        <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mt-1">Sales &amp; Transactions</h1>
        <p class="text-sm text-slate-600 mt-1">Record sales, review transactions and void mistakes. Stock is issued automatically.</p>
      </div>
      <button v-if="canManage" type="button" class="btn-primary" @click="openSale">+ Record sale</button>
    </div>

    <!-- today -->
    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <StatCard :index="0" icon="💵" label="Revenue today" :value="today ? peso(today.revenue) : '--'" tone="green" sublabel="Completed sales" />
      <StatCard :index="1" icon="🧾" label="Transactions today" :value="today ? String(today.transactions) : '--'" tone="blue" :sublabel="today ? `${today.itemsSold} item(s) sold` : ''" />
      <StatCard :index="2" icon="📊" label="Average sale today" :value="today ? peso(today.averageSale) : '--'" tone="default" />
      <StatCard :index="3" icon="↩️" label="Voided today" :value="today ? String(today.voidedCount) : '--'" tone="amber" :sublabel="today && today.voidedCount ? peso(today.voidedValue) : ''" />
    </div>

    <!-- transactions -->
    <div class="card anim-rise" style="--d: 4">
      <div class="card-header flex-wrap gap-3">
        <h2 class="card-title">Transactions</h2>
        <span class="text-xs text-slate-500 tabular-nums">{{ loading ? 'Loading…' : `${total.toLocaleString()} record${total === 1 ? '' : 's'}` }}</span>
      </div>

      <div class="px-4 py-3 border-b border-slate-100 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto_auto]">
        <input v-model="filters.search" type="search" class="input" placeholder="Search reference or customer" aria-label="Search sales" @keyup.enter="applyFilters" />
        <select v-model="filters.status" class="select" aria-label="Status">
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="voided">Voided</option>
        </select>
        <select v-model="filters.paymentMethod" class="select" aria-label="Payment method">
          <option value="">All payments</option>
          <option v-for="(label, code) in PAYMENT_LABELS" :key="code" :value="code">{{ label }}</option>
        </select>
        <input v-model="filters.from" type="date" class="input" aria-label="From date" @change="applyFilters" />
        <input v-model="filters.to" type="date" class="input" aria-label="To date" @change="applyFilters" />
        <button type="button" class="btn-ghost btn-sm" @click="clearFilters">Clear</button>
      </div>

      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr><th>Reference</th><th>Date</th><th>Customer</th><th>Items</th><th>Payment</th><th class="text-right">Total</th><th>Status</th><th class="text-right"><span class="sr-only">Actions</span></th></tr>
          </thead>
          <tbody v-if="loading">
            <tr v-for="r in 8" :key="r" class="h-[49px]">
              <td v-for="(w, c) in [120, 130, 120, 50, 80, 90, 80, 60]" :key="c"><div class="h-3 rounded bg-slate-200/80 animate-pulse" :style="{ width: `${w}px` }" /></td>
            </tr>
          </tbody>
          <tbody v-else-if="error">
            <tr><td colspan="8" class="text-center py-10"><p class="text-sm text-red-600">{{ error }}</p><button class="btn-ghost btn-sm mt-2" @click="load">Try again</button></td></tr>
          </tbody>
          <tbody v-else-if="!rows.length">
            <tr><td colspan="8" class="text-center py-12 text-slate-400">No sales recorded yet.<span v-if="canManage"> Use <b>Record sale</b> to add the first one.</span></td></tr>
          </tbody>
          <tbody v-else>
            <tr v-for="s in rows" :key="s.saleId" >
              <td class="font-mono text-xs text-slate-700">{{ s.referenceNo }}</td>
              <td class="text-slate-600 whitespace-nowrap">{{ when(s.soldAt) }}</td>
              <td class="text-slate-800">{{ s.customerName || 'Walk-in' }}</td>
              <td class="tabular-nums">{{ s.itemCount }}</td>
              <td class="text-slate-600">{{ paymentLabel(s.paymentMethod) }}</td>
              <td class="text-right tabular-nums font-semibold" :class="s.status === 'voided' ? 'line-through text-slate-400' : ''">{{ peso(s.total) }}</td>
              <td><span :class="s.status === 'voided' ? 'badge-amber' : 'badge-green'">{{ s.status === 'voided' ? 'Voided' : 'Completed' }}</span></td>
              <td class="text-right"><button type="button" class="btn-ghost btn-sm" @click="openDetail(s)">View</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <span>Page <b class="text-slate-800">{{ page }}</b> of <b class="text-slate-800">{{ totalPages }}</b></span>
        <div class="flex gap-2">
          <button type="button" class="btn-ghost btn-sm" :disabled="page <= 1 || loading" @click="goTo(page - 1)">Previous</button>
          <button type="button" class="btn-ghost btn-sm" :disabled="page >= totalPages || loading" @click="goTo(page + 1)">Next</button>
        </div>
      </div>
    </div>

    <!-- record a sale -->
    <ModalDialog :open="saleModal" title="Record a sale" size="lg" @close="saleModal = false">
      <div class="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div class="space-y-4">
          <div>
            <label class="label" for="sale-product-search">Add products</label>
            <input id="sale-product-search" v-model="productSearch" type="search" class="input" placeholder="Type a product name or SKU" autocomplete="off" />
            <p v-if="productsLoading" class="text-xs text-slate-500 mt-2">Loading products…</p>
            <ul v-else-if="productSearch.trim() || !form.items.length" class="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 max-h-56 overflow-y-auto">
              <li v-if="!pickable.length" class="px-3 py-2 text-xs text-slate-400">No matching products with stock.</li>
              <li v-for="p in pickable" :key="p.productId">
                <button type="button" class="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-sky-50 disabled:opacity-50" :disabled="p.stock < 1" @click="addItem(p)">
                  <span class="min-w-0"><span class="block text-sm font-medium text-slate-800 truncate">{{ p.name }}</span><span class="block text-xs text-slate-500 font-mono">{{ p.sku }}</span></span>
                  <span class="text-right shrink-0"><span class="block text-sm tabular-nums">{{ peso(p.unitPrice) }}</span><span class="block text-xs" :class="p.stock < 1 ? 'text-red-600' : 'text-slate-500'">{{ p.stock }} in stock</span></span>
                </button>
              </li>
            </ul>
          </div>

          <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="table">
              <thead><tr><th>Item</th><th class="text-right">Price</th><th class="w-24">Qty</th><th class="text-right">Line total</th><th><span class="sr-only">Remove</span></th></tr></thead>
              <tbody>
                <tr v-if="!form.items.length"><td colspan="5" class="text-center py-6 text-slate-400 text-sm">No items yet — search above to add products.</td></tr>
                <tr v-for="(item, i) in form.items" :key="item.productId">
                  <td><span class="block text-sm font-medium text-slate-800">{{ item.name }}</span><span class="block text-xs text-slate-500">{{ item.stock }} in stock</span></td>
                  <td class="text-right tabular-nums">{{ peso(item.unitPrice) }}</td>
                  <td><input v-model.number="item.quantity" type="number" min="1" :max="item.stock" class="input !py-1 w-20" :aria-label="`Quantity of ${item.name}`" @change="clampQty(item)" /></td>
                  <td class="text-right tabular-nums font-semibold">{{ peso(item.unitPrice * (item.quantity || 0)) }}</td>
                  <td class="text-right"><button type="button" class="text-slate-400 hover:text-red-600 px-1" :aria-label="`Remove ${item.name}`" @click="removeItem(i)">&times;</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="space-y-3">
          <div><label class="label" for="sale-customer">Customer (optional)</label><input id="sale-customer" v-model="form.customerName" class="input" placeholder="Walk-in" maxlength="120" /></div>
          <div>
            <label class="label" for="sale-payment">Payment method</label>
            <select id="sale-payment" v-model="form.paymentMethod" class="select"><option v-for="(label, code) in PAYMENT_LABELS" :key="code" :value="code">{{ label }}</option></select>
          </div>
          <div><label class="label" for="sale-discount">Discount (₱)</label><input id="sale-discount" v-model.number="form.discount" type="number" min="0" step="0.01" class="input" /></div>
          <div><label class="label" for="sale-notes">Notes</label><textarea id="sale-notes" v-model="form.notes" rows="2" class="input" maxlength="500" /></div>
          <div class="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm space-y-1">
            <div class="flex justify-between text-slate-600"><span>Subtotal</span><span class="tabular-nums">{{ peso(subtotal) }}</span></div>
            <div class="flex justify-between text-slate-600"><span>Discount</span><span class="tabular-nums">− {{ peso(discount) }}</span></div>
            <div class="flex justify-between font-bold text-slate-900 text-base border-t border-slate-200 pt-2 mt-2"><span>Total</span><span class="tabular-nums">{{ peso(grandTotal) }}</span></div>
          </div>
          <p v-if="formError && form.items.length" class="text-xs text-amber-700">{{ formError }}</p>
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn-ghost" @click="saleModal = false">Cancel</button>
        <button type="button" class="btn-primary" :disabled="saving || Boolean(formError)" @click="submitSale">{{ saving ? 'Saving…' : `Record sale · ${peso(grandTotal)}` }}</button>
      </template>
    </ModalDialog>

    <!-- sale details -->
    <ModalDialog :open="detailModal" :title="detail ? `Sale ${detail.referenceNo}` : 'Sale'" @close="detailModal = false">
      <div v-if="detail" class="space-y-4 text-sm">
        <div class="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
          <div><p class="text-xs text-slate-500 uppercase font-semibold">Status</p><span :class="detail.status === 'voided' ? 'badge-amber' : 'badge-green'">{{ detail.status === 'voided' ? 'Voided' : 'Completed' }}</span></div>
          <div><p class="text-xs text-slate-500 uppercase font-semibold">Date</p><p>{{ when(detail.soldAt) }}</p></div>
          <div><p class="text-xs text-slate-500 uppercase font-semibold">Customer</p><p>{{ detail.customerName || 'Walk-in' }}</p></div>
          <div><p class="text-xs text-slate-500 uppercase font-semibold">Payment</p><p>{{ paymentLabel(detail.paymentMethod) }}</p></div>
          <div><p class="text-xs text-slate-500 uppercase font-semibold">Recorded by</p><p>{{ detail.soldBy?.fullName || 'System' }}</p></div>
          <div v-if="detail.notes"><p class="text-xs text-slate-500 uppercase font-semibold">Notes</p><p>{{ detail.notes }}</p></div>
          <div v-if="detail.status === 'voided'" class="col-span-2"><p class="text-xs text-slate-500 uppercase font-semibold">Voided</p><p>{{ when(detail.voidedAt) }} by {{ detail.voidedBy?.fullName || 'System' }}<span v-if="detail.voidReason"> — {{ detail.voidReason }}</span></p></div>
        </div>
        <table class="table">
          <thead><tr><th>Item</th><th class="text-right">Price</th><th class="text-right">Qty</th><th class="text-right">Total</th></tr></thead>
          <tbody>
            <tr v-for="i in detail.items" :key="i.saleItemId"><td><span class="font-medium text-slate-800">{{ i.productName }}</span> <span class="text-xs text-slate-500 font-mono">{{ i.sku }}</span></td><td class="text-right tabular-nums">{{ peso(i.unitPrice) }}</td><td class="text-right tabular-nums">{{ i.quantity }}</td><td class="text-right tabular-nums">{{ peso(i.lineTotal) }}</td></tr>
          </tbody>
          <tfoot class="text-slate-700">
            <tr><td colspan="3" class="text-right">Subtotal</td><td class="text-right tabular-nums">{{ peso(detail.subtotal) }}</td></tr>
            <tr v-if="detail.discount"><td colspan="3" class="text-right">Discount</td><td class="text-right tabular-nums">− {{ peso(detail.discount) }}</td></tr>
            <tr class="font-bold text-slate-900"><td colspan="3" class="text-right">Total</td><td class="text-right tabular-nums">{{ peso(detail.total) }}</td></tr>
          </tfoot>
        </table>
        <div v-if="canManage && detail.status === 'completed'" class="rounded-lg border border-amber-200 bg-amber-50/60 p-3 space-y-2">
          <p class="text-xs font-semibold text-amber-800">Void this sale</p>
          <p class="text-xs text-amber-700">Voiding returns every item to stock and keeps the sale on record as voided.</p>
          <input v-model="voidReason" class="input" placeholder="Reason (optional)" maxlength="300" aria-label="Void reason" />
          <button type="button" class="btn-danger btn-sm" :disabled="voiding" @click="voidSale">{{ voiding ? 'Voiding…' : 'Void sale' }}</button>
        </div>
      </div>
      <template #footer><button type="button" class="btn-ghost" @click="detailModal = false">Close</button></template>
    </ModalDialog>
  </div>
</template>
