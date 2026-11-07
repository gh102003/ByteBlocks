export type BlockType =
  | 'for_range'
  | 'for_in'
  | 'while_loop'
  | 'if_condition'
  | 'if_else'
  | 'else_if'
  | 'else_clause'
  | 'if_collection_contains'
  | 'break_loop'
  | 'continue_loop'
  | 'var_set'
  | 'var_change'
  | 'var_decrement'
  | 'math_calculate'
  | 'list_item_math'
  | 'function_def'
  | 'return_val'
  | 'function_call'
  | 'print'
  | 'print_formatted'
  | 'list_create'
  | 'list_append'
  | 'list_get'
  | 'list_remove'
  | 'dict_create'
  | 'dict_set'
  | 'dict_get'
  | 'dict_remove'
  | 'dict_keys'
  | 'random_integer'
  | 'random_choice'
  | 'random_shuffle'
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
  | 'repeat'
  | 'decisions'
  | 'variables'
  | 'maths'
  | 'comments'
  | 'functions'
  | 'io'
  | 'data'
  | 'random'
  | 'stacks'
  | 'queues'
  | 'dictionaries'
  | 'presets'

/** A beginner-friendly expression: either a literal number or a named variable. */
export type ValueOperand =
  { kind: 'number'; value: string } | { kind: 'variable'; name: string }

export interface BlockItem {
  id: string
  type: BlockType
  varName?: string
  value?: string
  /** Typed operands used by the guided variable and maths blocks. */
  valueOperand?: ValueOperand
  rightOperand?: ValueOperand
  /** Legacy fields retained so saved projects created before typed operands still load. */
  operator?: string
  rightValue?: string
  valueKind?: 'number' | 'variable'
  valueVariable?: string
  /** A numeric list index or variable name used by the list-get block. */
  valueIndexValue?: string
  listRemoveMode?: 'index' | 'value'
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
  /** Selects either a comparison or a boolean literal predicate. */
  conditionKind?: 'comparison' | 'boolean'
  conditionBoolean?: 'True' | 'False'
  isText?: boolean
  condition?: string
  /** Chooses whether a range ends at a literal number, variable, or list length. */
  rangeMode?: 'number' | 'variable' | 'length'
  rangeCount?: string
  rangeStart?: string
  listName?: string
  itemVar?: string
  funcName?: string
  /** Locks the required entry-point signature supplied by an exercise preset. */
  isProblemFunction?: boolean
  /** Individual function definition parameter slots. funcArgs is retained for saved projects. */
  functionArgs?: string[]
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
