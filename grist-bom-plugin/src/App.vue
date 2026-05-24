<template>
  <div class="app-container">
    <header class="header">
      <h1>🔩 BOM Importer</h1>
      <div class="project-info">
        <label class="project-label">Projekt:</label>
        <select v-model="projektId" class="project-select">
          <option :value="null">— wybierz projekt —</option>
          <option v-for="p in availableProjects" :key="p.id" :value="p.id">
            {{ p.Projekt || p.id }}
          </option>
        </select>
        <span v-if="autoDetectedProjektId" class="auto-badge">
          ✓ Auto-wykryty ID: {{ autoDetectedProjektId }}
        </span>
        <span v-if="!projektId" class="warn-badge">
          ⚠ Wybierz projekt
        </span>
      </div>
    </header>

    <main class="content">
      <div v-if="!tree.length" class="upload-zone" @dragover.prevent @drop.prevent="handleDrop">
        <input type="file" ref="fileInput" @change="handleFileSelect" accept=".xlsx, .csv" class="hidden-input" />
        <div class="upload-content" @click="fileInput?.click()">
          <div class="icon">📁</div>
          <h2>Upuść plik XLSX / CSV tutaj</h2>
          <p>lub kliknij, aby wybrać z dysku</p>
        </div>
      </div>

      <div v-else class="tree-container">
        <div class="toolbar">
          <button @click="reset" class="btn btn-secondary">Anuluj</button>
          <button @click="refreshActions" class="btn btn-secondary" :disabled="!fileData.value?.length">
            Odśwież akcje
          </button>
          <button @click="performSync" class="btn btn-primary" :disabled="isSyncing">
            {{ isSyncing ? 'Synchronizowanie...' : 'Synchronizuj zaznaczone z Grist' }}
          </button>
        </div>
        
        <div class="tree-header">
          <div class="col-expand"></div>
          <div class="col-check">✔</div>
          <div class="col-item">Item</div>
          <div class="col-part">Part Number</div>
          <div class="col-qty">QTY</div>
          <div class="col-desc">Description</div>
          <div class="col-action">Akcja</div>
        </div>

        <div class="tree-body">
          <TreeNode v-for="node in tree" :key="node.item + node.partNumber" :node="node" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import TreeNode from './components/TreeNode.vue';
import { parseBOMFile, type BOMNode } from './utils/bomParser';
import { initGristApi, fetchGristData, syncToGrist, fetchProjects, currentProjektId } from './utils/gristApi';
import { calculateDiff } from './utils/diffLogic';

const tree = ref<BOMNode[]>([]);
const projektId = ref<number | null>(null);
const autoDetectedProjektId = ref<number | null>(null);
const availableProjects = ref<any[]>([]);
const isSyncing = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const fileData = ref<BOMNode[]>([]); // Store parsed file data for refresh

let cadData: any[] = [];
let structData: any[] = [];

onMounted(async () => {
  console.warn('[GRIST-BOM] App mounted - widget loaded');
  
  // MUST call grist.ready() FIRST before any docApi calls
  // @ts-ignore
  if (typeof grist !== 'undefined') {
    console.warn('[GRIST-BOM] Calling grist.ready()...');
    // @ts-ignore
    grist.ready(); // No parameters - just signal that widget is ready
    console.warn('[GRIST-BOM] grist.ready() called');
  }

  // Wait for grist to be fully ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Load project list immediately
  console.warn('[GRIST-BOM] Fetching projects...');
  availableProjects.value = await fetchProjects();
  console.warn('[GRIST-BOM] Projects fetched:', availableProjects.value.length, 'items');
  if (availableProjects.value.length > 0) {
    console.warn('[GRIST-BOM] First 5 projects:', availableProjects.value.slice(0, 5).map(p => ({ id: p.id, Projekt: p.Projekt })));
  }

  await initGristApi(async (_record) => {
    if (currentProjektId) {
      console.warn('[GRIST-BOM] Auto-detected projektId:', currentProjektId);
      autoDetectedProjektId.value = currentProjektId;
      if (!projektId.value) {
        projektId.value = currentProjektId;
      }
    }
  });
});

const handleDrop = async (e: DragEvent) => {
  const file = e.dataTransfer?.files[0];
  if (file) await processFile(file);
};

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) await processFile(file);
  target.value = ''; // reset
};

const processFile = async (file: File) => {
  try {
    // 1. Parse Excel
    const parsedNodes = await parseBOMFile(file);
    fileData.value = parsedNodes; // Store for refresh
    
    // 2. Fetch Grist Data
    const gristData = await fetchGristData();
    cadData = gristData.cad;
    structData = gristData.struct;
    
    // 3. Diff and create tree
    await refreshActions();
  } catch (err: any) {
    console.error(err);
    alert('Wystąpił błąd podczas przetwarzania pliku: ' + (err.message || String(err)));
  }
};

const refreshActions = async () => {
  if (!fileData.value?.length) return;
  try {
    const gristData = await fetchGristData();
    console.warn('[GRIST-BOM] gristData.cad length:', gristData.cad?.length || 0);
    console.warn('[GRIST-BOM] gristData.struct length:', gristData.struct?.length || 0);
    tree.value = calculateDiff(fileData.value, gristData.cad, gristData.struct, projektId.value);
    console.warn('[GRIST-BOM] Actions refreshed for projektId:', projektId.value, 'Tree nodes:', tree.value.length);
  } catch (err: any) {
    console.error('[GRIST-BOM] Failed to refresh actions:', err);
    alert('Wystąpił błąd podczas odświeżania akcji');
  }
};

const reset = () => {
  tree.value = [];
};

const performSync = async () => {
  if (isSyncing.value) return;
  isSyncing.value = true;
  try {
    await syncToGrist(tree.value, projektId.value);
    alert('Synchronizacja zakończona sukcesem!');
    reset(); // Optionally close tree after sync
  } catch (err) {
    console.error(err);
    alert('Wystąpił błąd podczas synchronizacji.');
  } finally {
    isSyncing.value = false;
  }
};
</script>

<style>
:root {
  --bg-color: #0f172a;
  --panel-bg: #1e293b;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --primary: #3b82f6;
  --primary-hover: #2563eb;
}

body, html {
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  height: 100vh;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  padding: 0.75rem 1.5rem;
  background-color: var(--panel-bg);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.header h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.project-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.project-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.project-select {
  background-color: #0f172a;
  color: var(--text-main);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
  max-width: 260px;
}

.project-select:hover,
.project-select:focus {
  border-color: var(--primary);
}

.auto-badge {
  font-size: 0.75rem;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 20px;
  padding: 2px 10px;
  white-space: nowrap;
}

.warn-badge {
  font-size: 0.75rem;
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 20px;
  padding: 2px 10px;
  white-space: nowrap;
}

.content {
  flex: 1;
  padding: 2rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.upload-zone {
  flex: 1;
  border: 2px dashed rgba(255,255,255,0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.02);
  transition: all 0.2s;
  cursor: pointer;
}

.upload-zone:hover {
  background: rgba(255,255,255,0.05);
  border-color: var(--primary);
}

.hidden-input {
  display: none;
}

.upload-content {
  text-align: center;
}

.upload-content .icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.tree-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--panel-bg);
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.toolbar {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: transparent;
  color: var(--text-main);
  border: 1px solid rgba(255,255,255,0.2);
}

.btn-secondary:hover {
  background-color: rgba(255,255,255,0.1);
}

.tree-header {
  display: flex;
  padding: 0.75rem 4px;
  background-color: rgba(0,0,0,0.2);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
  letter-spacing: 0.05em;
}

.tree-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

/* Widths must match TreeNode.vue */
.col-expand { width: 30px; text-align: center; }
.col-check { width: 30px; text-align: center; }
.col-item { width: 80px; }
.col-part { width: 150px; }
.col-qty { width: 60px; text-align: center; }
.col-desc { flex: 1; }
.col-action { width: 120px; text-align: center; }
</style>
