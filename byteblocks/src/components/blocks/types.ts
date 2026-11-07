export type BlockType =
  | 'for_range'
  | 'for_in'
  | 'while_loop'
  | 'if_condition'
  | 'if_else'
  | 'break_loop'
  | 'var_set'
  | 'var_change'
  | 'function_def'
  | 'return_val'
  | 'function_call'
  | 'print'
  | 'print_formatted'
  | 'list_create'
  | 'list_append'
  | 'dict_create'
  | 'comment'
  | 'custom_code'

export type BlockCategory =
  'control' | 'variables' | 'functions' | 'io' | 'data' | 'presets'

export interface BlockItem {
  id: string
  type: BlockType
  varName?: string
  value?: string
  condition?: string
  rangeCount?: string
  rangeStart?: string
  listName?: string
  itemVar?: string
  funcName?: string
  funcArgs?: string
  commentText?: string
  customCode?: string
  children?: BlockItem[]
  elseChildren?: BlockItem[]
}

export interface BlockDefinition {
  type: BlockType
  category: BlockCategory
  label: string
  color: string
  borderColor: string
  bgHover: string
  defaultValues: Partial<BlockItem>
  isContainer?: boolean
  hasElse?: boolean
}
