import * as XLSX from 'xlsx';

export interface BOMRow {
  Item: string;
  PartNumber: string;
  QTY: number | string;
  Description: string;
  [key: string]: any;
}

export interface BOMNode {
  item: string;
  partNumber: string;
  qty: number | string;
  description: string;
  rawData: BOMRow;
  children: BOMNode[];
  parentItem: string | null;
  // UI state
  selected: boolean;
  expanded: boolean;
  action: 'create' | 'update' | 'none' | 'delete';
  status: string; // e.g. "Aktywny", "Usunięty"
  gristId?: number; // matched BOM_CAD id
  gristStructureId?: number; // matched BOM_struktura id
}

export async function parseBOMFile(file: File): Promise<BOMNode[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Assuming headers are in the first row as user confirmed
  const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  
  // Standardize keys (remove trailing spaces, uppercase)
  const rows: BOMRow[] = json.map(row => {
    const standardizedRow: any = {};
    for (const key in row) {
      standardizedRow[key.trim()] = row[key];
    }
    return {
      Item: String(standardizedRow['Item'] || ''),
      PartNumber: String(standardizedRow['Part Number'] || standardizedRow['PartNumber'] || ''),
      QTY: standardizedRow['QTY'] || standardizedRow['Unit QTY'] || 1,
      Description: String(standardizedRow['Description'] || ''),
      ...standardizedRow
    };
  }).filter(r => r.Item && r.PartNumber); // Skip empty rows

  return buildTree(rows);
}

function buildTree(rows: BOMRow[]): BOMNode[] {
  const rootNodes: BOMNode[] = [];
  const nodeMap = new Map<string, BOMNode>();
  
  // Sort rows by Item just to ensure parents come before children if possible
  // In BOMs, items usually are sorted 1, 1.1, 1.1.1. 
  // We'll process them in the given order but look up parents by substring.
  
  for (const row of rows) {
    const itemStr = row.Item.trim();
    const node: BOMNode = {
      item: itemStr,
      partNumber: row.PartNumber.trim(),
      qty: row.QTY,
      description: row.Description.trim(),
      rawData: row,
      children: [],
      parentItem: null,
      selected: true,
      expanded: true,
      action: 'none',
      status: 'Aktywny'
    };
    
    nodeMap.set(itemStr, node);
  }
  
  for (const node of nodeMap.values()) {
    // Find parent. If Item is "1.1.2", parent is "1.1"
    const parts = node.item.split('.');
    if (parts.length > 1) {
      parts.pop();
      const parentItemStr = parts.join('.');
      node.parentItem = parentItemStr;
      
      const parentNode = nodeMap.get(parentItemStr);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        // Parent not found in map, treat as root
        rootNodes.push(node);
      }
    } else {
      // Top level item (e.g. "1", "2")
      node.parentItem = null;
      rootNodes.push(node);
    }
  }
  
  return rootNodes;
}
