export const en: Record<string, string> = {
  // Header
  'header.workspaces': 'Workspaces',
  'header.createWorkspace': 'Create workspace',
  'header.openWorkspace': 'Open workspace',
  'header.importWorkspace': 'Import workspace',
  'header.manageWorkspace': 'Manage workspace',
  'header.import': 'Import',
  'header.export': 'Export',
  'header.darkMode': 'Switch to dark mode',
  'header.lightMode': 'Switch to light mode',
  'header.help': 'Help',

  // ActionBar
  'action.addTable': 'Add Table',
  'action.addRelation': 'Add Relation',
  'action.undo': 'Undo (Ctrl+Z)',
  'action.redo': 'Redo (Ctrl+Shift+Z)',
  'action.display': 'Display',
  'action.openJsonEditor': 'Open JSON Editor',
  'action.closeJsonEditor': 'Close JSON Editor',
  'action.openViews': 'Open Views',
  'action.closeViews': 'Close Views',

  // TableDialog
  'dialog.newTable': 'New Table',
  'dialog.editTable': 'Edit Table',
  'dialog.physicalName': 'Physical Name *',
  'dialog.logicalName': 'Logical Name',
  'dialog.columns': 'Columns',
  'dialog.addColumn': '+ Add Column',
  'dialog.cancel': 'Cancel',
  'dialog.create': 'Create',
  'dialog.save': 'Save',
  'dialog.deleteTable': 'Delete Table',
  'dialog.removeColumn': 'Remove column',
  'dialog.fkManagedByRelation': 'FK is managed by relations',
  'dialog.physicalNameRequired': 'Physical Name is required',
  'dialog.duplicateTableName': 'Table name already exists',

  // Context menu
  'context.editTable': 'Edit Table',
  'context.addTable': 'Add Table',
  'context.addRelation': 'Add Relation',
  'context.deleteTable': 'Delete Table',
  'context.deleteRelation': 'Delete Relation',
  'context.changeToType': 'Change to {{type}}',
  'context.toIdentifying': 'Change to identifying',
  'context.toNonIdentifying': 'Change to non-identifying',

  // Linking
  'linking.pickSource': 'Click the source table',
  'linking.pickTarget': '{{name}} — Click the target table to connect',
  'linking.selectType': 'Select relation type',
  'linking.identifying': 'Identifying',
  'linking.identifyingDesc': 'Creates FK column',
  'linking.nonIdentifying': 'Non-identifying',
  'linking.nonIdentifyingDesc': 'Line only',

  // Delete confirm
  'delete.title': 'Delete Table',
  'delete.confirm': 'Delete {{name}} table?',
  'delete.relationsWarning': '{{count}} related relation(s) will also be deleted.',
  'delete.cancel': 'Cancel',
  'delete.delete': 'Delete',

  // Toast
  'toast.relationCreated': '{{source}} → {{target}} relation created',
  'toast.duplicateRelation': 'Relation already exists between these tables',
  'toast.tableCreated': '{{name}} table created',
  'toast.tableUpdated': '{{name}} table updated',
  'toast.tableDeleted': '{{name}} table deleted',

  // RightPanel / TableEditor
  'editor.tableDetail': 'Table Detail',
  'editor.selectTable': 'Select a table',
  'editor.apply': 'Apply',
  'editor.add': '+ Add',
  'editor.close': 'Close',
  'editor.remove': 'Remove',

  // Panels
  'panel.json': 'JSON',
  'panel.views': 'Views',
  'panel.collapse': 'Collapse',

  // ViewsPanel
  'views.tables': '{{count}} tables',
  'views.newGroup': 'New Group',
  'views.deleteGroup': 'Delete Group',
  'views.dragTablesHere': 'Drag tables here',
  'views.ungrouped': 'Ungrouped',
  'views.add': 'Add',

  // JsonEditor
  'json.apply': 'Apply',
  'json.reset': 'Reset',

  // Toolbar
  'toolbar.zoomOut': 'Zoom out',
  'toolbar.zoomIn': 'Zoom in',
  'toolbar.fitView': 'Zoom to fit all elements in view',
  'toolbar.selectMode': 'Select mode (V)',
  'toolbar.handTool': 'Hand tool — drag to pan (H)',

  // Empty state
  'empty.noTables': 'Right-click or use the toolbar to add your first table',
}
