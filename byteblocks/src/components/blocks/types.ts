export type BlockType =
  | 'for_range'
  | 'for_in'
  | 'while_loop'
  | 'if_condition'
  | 'if_else'
  | 'if_collection_contains'
  | 'break_loop'
  | 'var_set'
  | 'var_change'
  | 'list_item_math'
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
  | 'stack_create'
  | 'stack_add'
  | 'stack_remove'
  | 'stack_peek'
  | 'stack_size'
  | 'stack_empty'
  | 'stack_clear'
  | 'queue_create'
  | 'queue_add'
  | 'queue_remove'
  | 'queue_peek'
  | 'queue_size'
  | 'queue_empty'
  | 'queue_clear'

export type BlockCategory =
  | 'control'
  | 'variables'
  | 'functions'
  | 'io'
  | 'data'
  | 'stacks'
  | 'queues'
  | 'dictionaries'
  | 'presets'

export interface BlockItem {
  id: string
  type: BlockType
  varName?: string
  value?: string
  /** Guided math and comparison fields; raw values remain supported for advanced projects. */
  operator?: string
  rightValue?: string
  valueKind?: 'number' | 'variable' | 'list_item'
  valueVariable?: string
  valueList?: string
  valueIndex?: 'first' | 'last' | 'second_last'
  listValues?: string[]
  dictionaryEntries?: { key: string; value: string }[]
  startsEmpty?: boolean
  sourceList?: string
  collectionName?: string
  firstItem?: 'first' | 'last' | 'second_last'
  secondItem?: 'first' | 'last' | 'second_last'
  conditionLeft?: string
  conditionOperator?: string
  conditionRight?: string
  isText?: boolean
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
