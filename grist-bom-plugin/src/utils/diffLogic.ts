import type { BOMNode } from './bomParser';
import { flattenNodes, type GristBOMCADRecord, type GristBOMStrukturaRecord } from './gristApi';

export function calculateDiff(
  nodes: BOMNode[], 
  cadRecords: GristBOMCADRecord[], 
  structRecords: GristBOMStrukturaRecord[],
  projektId: number | null
): BOMNode[] {
  
  // Create a map of CAD records for quick lookup
  // Include ALL records regardless of Projekt, so we can detect parts that exist
  // but belong to a different project
  const cadMap = new Map<string, GristBOMCADRecord>();
  for (const cad of cadRecords) {
    if (cad.Part_Number) {
      cadMap.set(cad.Part_Number.toString(), cad);
    }
  }

  // To check structure, we need to map structural records to Part_Number 
  // Wait, structRecords store Part_Number as ID. We need a reverse map id -> Part_Number string
  const cadIdToPartNumber = new Map<number, string>();
  for (const cad of cadRecords) {
    cadIdToPartNumber.set(cad.id, cad.Part_Number);
  }

  // Create a struct map: ParentPartNumber -> Map<ChildPartNumber, Record>
  // In BOM_struktura, Parent is cad ID. Part_Number is cad ID.
  // Also create a flat map of all Part_Numbers in BOM_struktura for quick lookup
  const structMap = new Map<string, Map<string, GristBOMStrukturaRecord>>();
  const allPartsInStruktura = new Set<string>(); // All Part_Numbers that exist in BOM_struktura
  
  for (const s of structRecords) {
    // If we only want active records for diffing
    // if (s.Status_czesci === 'Usunięty') continue;
    
    const parentId = s.Parent;
    const childId = s.Part_Number;
    
    const parentPartNumber = parentId ? cadIdToPartNumber.get(parentId) || 'root' : 'root';
    const childPartNumber = cadIdToPartNumber.get(childId);
    
    if (childPartNumber) {
      if (!structMap.has(parentPartNumber)) {
        structMap.set(parentPartNumber, new Map());
      }
      structMap.get(parentPartNumber)!.set(childPartNumber, s);
      allPartsInStruktura.add(childPartNumber); // Track all parts in struktura
    }
  }

  const flatNodes = flattenNodes(nodes);
  const nodePartNumbers = new Set<string>();

  // Assign actions
  for (const node of flatNodes) {
    nodePartNumbers.add(node.partNumber);
    const cadRecord = cadMap.get(node.partNumber);
    if (!cadRecord) {
      node.action = 'create';
      node.status = 'Aktywny';
    } else {
      node.gristId = cadRecord.id;
      // Check if part belongs to current project
      const partBelongsToCurrentProject = cadRecord.Projekt === projektId;
      
      if (!partBelongsToCurrentProject) {
        // Part exists in BOM_CAD but with different project
        // Treat as create for current project
        node.action = 'create';
        node.status = 'Aktywny';
      } else {
        // Part exists in BOM_CAD with current project
        // Check if it exists in BOM_struktura (anywhere, regardless of parent)
        const partExistsInStruktura = allPartsInStruktura.has(node.partNumber);
        
        if (!partExistsInStruktura) {
          node.action = 'create';
          node.status = 'Aktywny';
        } else {
          // Part exists in both BOM_CAD and BOM_struktura with current project
          // For now, assume it exists - user wants "none" if part exists in struktura
          // We can check structure details later if needed
          // Try to find the struct record for this parent
          const parentNode = node.parentItem ? flatNodes.find(n => n.item === node.parentItem) : null;
          const parentPartNumber = parentNode ? parentNode.partNumber : 'root';
          
          const childrenMap = structMap.get(parentPartNumber);
          const structRecord = childrenMap?.get(node.partNumber);
          
          if (structRecord) {
            node.gristStructureId = structRecord.id;
            // Check if QTY or Status changed
            if (structRecord.QTY != node.qty || structRecord.Status_czesci === 'Usunięty') {
              node.action = 'update';
              node.status = 'Aktywny';
            } else {
              node.action = 'none';
              node.status = 'Aktywny';
            }
          } else {
            // Part exists in struktura but under different parent or parent mapping issue
            // For now, treat as 'none' since the part itself exists in struktura
            node.action = 'none';
            node.status = 'Aktywny';
          }
        }
      }
    }
  }

  // Handle Soft Deletions:
  // Find all items in structRecords that belong to this project's structure but are NOT in the excel file.
  // This is tricky because we might delete items that belong to other assemblies.
  // The user requested: "wpisz 'Aktywny' jeśli part znajduje się w XLSX oraz 'Usunięty' jeżli part(item) został usunięty".
  // So we will look through structRecords where Parent is one of the nodes in our Excel file.
  // If a structRecord is found, but its Child Part_Number is NOT in our Excel file, we soft delete it.
  
  const allExcelParts = new Set(flatNodes.map(n => n.partNumber));
  
  for (const [parentPN, childrenMap] of structMap.entries()) {
    // Only check assemblies that are present in the Excel file as parents (or root)
    // Wait, if it's root, we might delete everything else in the project. 
    // Let's only soft-delete children of parents that are EXPLICITLY in the Excel file.
    if (parentPN !== 'root' && !allExcelParts.has(parentPN)) {
      continue;
    }

    for (const [childPN, structRecord] of childrenMap.entries()) {
      if (!allExcelParts.has(childPN) && structRecord.Status_czesci !== 'Usunięty') {
        // This item is in Grist but missing from Excel for this parent!
        // We should add it to the UI as a 'delete' node.
        const cadRecord = cadRecords.find(c => c.id === structRecord.Part_Number);
        
        // We create a phantom node to show it in UI as "deleted"
        const phantomNode: BOMNode = {
          item: structRecord.Item || '?',
          partNumber: childPN,
          qty: structRecord.QTY,
          description: cadRecord ? cadRecord.Description : 'Nieznany (Usunięty)',
          rawData: {} as any,
          children: [],
          parentItem: null, // Will try to attach
          selected: true,
          expanded: true,
          action: 'delete',
          status: 'Usunięty',
          gristId: structRecord.Part_Number,
          gristStructureId: structRecord.id
        };
        
        // Try to attach to parent
        if (parentPN !== 'root') {
          const excelParent = flatNodes.find(n => n.partNumber === parentPN);
          if (excelParent) {
            phantomNode.parentItem = excelParent.item;
            excelParent.children.push(phantomNode);
          } else {
            nodes.push(phantomNode);
          }
        } else {
          // It was a root item in Grist, not in Excel.
          // Wait, if we soft delete root items, we might delete other project's root items!
          // We only soft delete if we know what project it is. If we are sure `structRecords` is filtered, okay.
          // For safety, let's only do it for items that HAVE a parent in the excel.
          // If parent is root, and we soft delete, we might delete too much.
          // I will skip root deletions to be safe, unless specifically requested.
        }
      }
    }
  }

  return nodes;
}
