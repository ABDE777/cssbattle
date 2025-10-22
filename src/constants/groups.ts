export interface GroupOption {
  value: string;
  label: string;
  category: 'DEV' | 'ID';
}

export const GROUP_OPTIONS: GroupOption[] = [
  // DEV Groups
  { value: 'DD101', label: 'DD101', category: 'DEV' },
  { value: 'DD102', label: 'DD102', category: 'DEV' },
  { value: 'DD103', label: 'DD103', category: 'DEV' },
  { value: 'DD104', label: 'DD104', category: 'DEV' },
  { value: 'DD105', label: 'DD105', category: 'DEV' },
  { value: 'DD106', label: 'DD106', category: 'DEV' },
  { value: 'DD107', label: 'DD107', category: 'DEV' },
  { value: 'DEVOWS201', label: 'DEVOWS201', category: 'DEV' },
  { value: 'DEVOWS202', label: 'DEVOWS202', category: 'DEV' },
  { value: 'DEVOWS203', label: 'DEVOWS203', category: 'DEV' },
  { value: 'DEVOWS204', label: 'DEVOWS204', category: 'DEV' },
  
  // ID Groups
  { value: 'ID101', label: 'ID101', category: 'ID' },
  { value: 'ID102', label: 'ID102', category: 'ID' },
  { value: 'ID103', label: 'ID103', category: 'ID' },
  { value: 'ID104', label: 'ID104', category: 'ID' },
  { value: 'IDOSR201', label: 'IDOSR201', category: 'ID' },
  { value: 'IDOSR202', label: 'IDOSR202', category: 'ID' },
  { value: 'IDOSR203', label: 'IDOSR203', category: 'ID' },
  { value: 'IDOSR204', label: 'IDOSR204', category: 'ID' },
];

export const GROUPS = GROUP_OPTIONS.map(g => g.value);
export const DEV_GROUPS = GROUP_OPTIONS.filter(group => group.category === 'DEV');
export const ID_GROUPS = GROUP_OPTIONS.filter(group => group.category === 'ID');