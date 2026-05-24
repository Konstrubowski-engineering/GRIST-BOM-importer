<template>
  <div class="tree-node">
    <div 
      class="node-row" 
      :class="{ 'is-deleted': node.status === 'Usunięty', 'is-new': node.action === 'create' }"
    >
      <div class="col-expand">
        <button v-if="node.children.length" @click="toggleExpand" class="expand-btn">
          {{ node.expanded ? '▼' : '▶' }}
        </button>
      </div>
      <div class="col-check">
        <input type="checkbox" v-model="node.selected" @change="onCheckChange" />
      </div>
      <div class="col-item">{{ node.item }}</div>
      <div class="col-part">{{ node.partNumber }}</div>
      <div class="col-qty">{{ node.qty }}</div>
      <div class="col-desc">{{ node.description }}</div>
      <div class="col-action">
        <span class="badge" :class="actionClass">{{ actionText }}</span>
      </div>
    </div>
    
    <div v-if="node.expanded && node.children.length" class="node-children">
      <TreeNode 
        v-for="child in node.children" 
        :key="child.item + child.partNumber" 
        :node="child" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BOMNode } from '../utils/bomParser';

const props = defineProps<{
  node: BOMNode
}>();

const toggleExpand = () => {
  props.node.expanded = !props.node.expanded;
};

const onCheckChange = (e: Event) => {
  const isChecked = (e.target as HTMLInputElement).checked;
  // Cascade to children
  cascadeCheck(props.node, isChecked);
};

const cascadeCheck = (n: BOMNode, checked: boolean) => {
  n.selected = checked;
  for (const child of n.children) {
    cascadeCheck(child, checked);
  }
};

const actionText = computed(() => {
  if (props.node.status === 'Usunięty') return 'Usuń (Soft)';
  if (props.node.action === 'create') return 'Utwórz';
  if (props.node.action === 'update') return 'Aktualizuj';
  return 'Bez zmian';
});

const actionClass = computed(() => {
  if (props.node.status === 'Usunięty') return 'badge-danger';
  if (props.node.action === 'create') return 'badge-success';
  if (props.node.action === 'update') return 'badge-warning';
  return 'badge-neutral';
});
</script>

<style scoped>
.tree-node {
  display: flex;
  flex-direction: column;
}
.node-row {
  display: flex;
  align-items: center;
  padding: 6px 4px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  transition: background-color 0.2s;
  font-size: 12px;
}
.node-row:hover {
  background-color: rgba(255,255,255,0.05);
}
.node-children {
  padding-left: 16px;
  border-left: 1px solid rgba(255,255,255,0.1);
  margin-left: 0;
}
.is-deleted {
  opacity: 0.6;
  text-decoration: line-through;
}
.col-expand { width: 30px; text-align: center; }
.col-check { width: 30px; text-align: center; }
.col-item { width: 80px; font-weight: normal; text-align: left; }
.col-part { width: 150px; font-family: monospace; text-align: left; }
.col-qty { width: 60px; text-align: left; }
.col-desc { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
.col-action { width: 120px; text-align: left; }

.expand-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 10px;
  padding: 4px;
  border-radius: 4px;
}
.expand-btn:hover {
  background: rgba(255,255,255,0.2);
}

.badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}
.badge-success { background: rgba(16, 185, 129, 0.2); color: #34d399; }
.badge-warning { background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
.badge-danger { background: rgba(239, 68, 68, 0.2); color: #f87171; }
.badge-neutral { background: rgba(156, 163, 175, 0.2); color: #9ca3af; }
</style>
