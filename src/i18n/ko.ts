export const ko: Record<string, string> = {
  // Header
  'header.workspaces': '워크스페이스',
  'header.createWorkspace': '워크스페이스 생성',
  'header.openWorkspace': '워크스페이스 열기',
  'header.importWorkspace': '워크스페이스 가져오기',
  'header.manageWorkspace': '워크스페이스 관리',
  'header.import': '가져오기',
  'header.export': '내보내기',
  'header.darkMode': '다크 모드로 전환',
  'header.lightMode': '라이트 모드로 전환',
  'header.help': '도움말',

  // ActionBar
  'action.addTable': '테이블 추가',
  'action.addRelation': '관계 추가',
  'action.undo': '실행 취소 (Ctrl+Z)',
  'action.redo': '다시 실행 (Ctrl+Shift+Z)',
  'action.display': '표시',
  'action.openJsonEditor': 'JSON 에디터 열기',
  'action.closeJsonEditor': 'JSON 에디터 닫기',
  'action.openViews': '뷰 열기',
  'action.closeViews': '뷰 닫기',

  // TableDialog
  'dialog.newTable': '새 테이블',
  'dialog.editTable': '테이블 수정',
  'dialog.physicalName': 'Physical Name *',
  'dialog.logicalName': 'Logical Name',
  'dialog.columns': '컬럼',
  'dialog.addColumn': '+ 컬럼 추가',
  'dialog.cancel': '취소',
  'dialog.create': '생성',
  'dialog.save': '저장',
  'dialog.deleteTable': '테이블 삭제',
  'dialog.removeColumn': '컬럼 삭제',
  'dialog.fkManagedByRelation': 'FK는 Relation에서 관리됩니다',
  'dialog.physicalNameRequired': 'Physical Name은 필수입니다',
  'dialog.duplicateTableName': '이미 존재하는 테이블명입니다',

  // Context menu
  'context.editTable': '테이블 수정',
  'context.addTable': '테이블 추가',
  'context.addRelation': '관계 추가',
  'context.deleteTable': '테이블 삭제',
  'context.deleteRelation': '관계 삭제',
  'context.changeToType': '{{type}} 으로 변경',
  'context.toIdentifying': '식별 관계로 변경',
  'context.toNonIdentifying': '비식별 관계로 변경',

  // Linking
  'linking.pickSource': 'Source 테이블을 클릭하세요',
  'linking.pickTarget': '{{name}} — 연결할 테이블을 클릭하세요',
  'linking.selectType': 'Relation 유형 선택',
  'linking.identifying': '식별 관계',
  'linking.identifyingDesc': 'FK 컬럼 생성',
  'linking.nonIdentifying': '비식별 관계',
  'linking.nonIdentifyingDesc': '관계선만 표시',

  // Delete confirm
  'delete.title': '테이블 삭제',
  'delete.confirm': '{{name}} 테이블을 삭제하시겠습니까?',
  'delete.relationsWarning': '연결된 관계 {{count}}개가 함께 삭제됩니다.',
  'delete.cancel': '취소',
  'delete.delete': '삭제',

  // Toast
  'toast.relationCreated': '{{source}} → {{target}} 관계가 생성되었습니다',
  'toast.tableCreated': '{{name}} 테이블이 생성되었습니다',
  'toast.tableUpdated': '{{name}} 테이블이 수정되었습니다',
  'toast.tableDeleted': '{{name}} 테이블이 삭제되었습니다',

  // RightPanel / TableEditor
  'editor.tableDetail': '테이블 상세',
  'editor.selectTable': '테이블을 선택하세요',
  'editor.apply': '적용',
  'editor.add': '+ 추가',
  'editor.close': '닫기',
  'editor.remove': '삭제',

  // Panels
  'panel.json': 'JSON',
  'panel.views': '뷰',
  'panel.collapse': '접기',

  // ViewsPanel
  'views.tables': '{{count}}개 테이블',
  'views.newGroup': '새 그룹',
  'views.deleteGroup': '그룹 삭제',
  'views.dragTablesHere': '테이블을 여기에 드래그하세요',
  'views.ungrouped': '그룹 없음',
  'views.add': '추가',

  // JsonEditor
  'json.apply': '적용',
  'json.reset': '초기화',

  // Toolbar
  'toolbar.zoomOut': '축소',
  'toolbar.zoomIn': '확대',
  'toolbar.fitView': '전체 보기',
  'toolbar.selectMode': '선택 모드 (V)',
  'toolbar.handTool': '이동 모드 (H)',

  // Empty state
  'empty.noTables': '우클릭하거나 툴바를 사용하여 첫 번째 테이블을 추가하세요',
}
