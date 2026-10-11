<script setup>
import { computed } from 'vue';

const props = defineProps({ status: { type: String, required: true } });

const MAP = {
  in_stock:     { label: 'In Stock',     icon: '✅', cls: 'badge-green' },
  low_stock:    { label: 'Low Stock',    icon: '⚠️', cls: 'badge-amber' },
  reorder:      { label: 'Reorder Due',  icon: '🔄', cls: 'badge-blue'  },
  out_of_stock: { label: 'Out of Stock', icon: '⛔', cls: 'badge-red'   },

  active:       { label: 'Active',       icon: '🚨', cls: 'badge-red'   },
  acknowledged: { label: 'Acknowledged', icon: '⏳', cls: 'badge-amber' },
  resolved:     { label: 'Resolved',     icon: '✓',  cls: 'badge-green' },

  critical:     { label: 'Critical',     icon: '🔴', cls: 'badge-red'    },
  high:         { label: 'High',         icon: '🟠', cls: 'badge-amber'  },
  medium:       { label: 'Medium',       icon: '🔵', cls: 'badge-blue'   },
  low:          { label: 'Low',          icon: '⚪', cls: 'badge-gray'   },

  stock_in:     { label: 'Stock In',     icon: '📥', cls: 'badge-green'  },
  stock_out:    { label: 'Stock Out',    icon: '📤', cls: 'badge-blue'   },
  damaged:      { label: 'Damaged',      icon: '⚠️', cls: 'badge-amber'  },
  missing:      { label: 'Missing',      icon: '🔍', cls: 'badge-red'    },
  returned:     { label: 'Returned',     icon: '↩️', cls: 'badge-purple' },
  adjustment:   { label: 'Adjustment',   icon: '🛠', cls: 'badge-gray'   },

  near_expiry:  { label: 'Near Expiry',  icon: '⚠️', cls: 'badge-amber' },
  missing_item: { label: 'Missing Item', icon: '🔍', cls: 'badge-red'   },
  damaged_item: { label: 'Damaged Item', icon: '⚠️', cls: 'badge-amber' },
};

const entry = computed(() => MAP[props.status] || {
  label: String(props.status).replace(/_/g, ' '),
  icon: '',
  cls: 'badge-gray',
});
</script>

<template>
  <span :class="entry.cls">
    <span v-if="entry.icon" class="text-[10px] leading-none select-none">{{ entry.icon }}</span>
    <span>{{ entry.label }}</span>
  </span>
</template>
