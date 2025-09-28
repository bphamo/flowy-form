// FormIO schema validation using Zod
import { z } from 'zod';

// Basic FormIO component schema
const baseComponentSchema = z.object({
  type: z.string().min(1),
  key: z.string().min(1),
  label: z.string().optional(),
  input: z.boolean().default(true),
  tableView: z.boolean().optional(),
  protected: z.boolean().optional(),
  unique: z.boolean().optional(),
  persistent: z.boolean().optional(),
  hidden: z.boolean().optional(),
  clearOnHide: z.boolean().optional(),
  refreshOn: z.string().optional(),
  redrawOn: z.string().optional(),
  modalEdit: z.boolean().optional(),
  dataGridLabel: z.boolean().optional(),
  labelPosition: z.enum(['top', 'bottom', 'left', 'right']).optional(),
  description: z.string().optional(),
  errorLabel: z.string().optional(),
  tooltip: z.string().optional(),
  hideLabel: z.boolean().optional(),
  tabindex: z.number().optional(),
  disabled: z.boolean().optional(),
  autofocus: z.boolean().optional(),
  dbIndex: z.boolean().optional(),
  customDefaultValue: z.string().optional(),
  calculateValue: z.string().optional(),
  calculateServer: z.boolean().optional(),
  widget: z.any().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  validateOn: z.enum(['change', 'blur']).optional(),
  validate: z.object({
    required: z.boolean().optional(),
    custom: z.string().optional(),
    customPrivate: z.boolean().optional(),
    strictDateValidation: z.boolean().optional(),
    multiple: z.boolean().optional(),
    unique: z.boolean().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.string().optional(),
    pattern: z.string().optional(),
    json: z.string().optional(),
  }).optional(),
  conditional: z.object({
    show: z.boolean().optional(),
    when: z.string().optional(),
    eq: z.string().optional(),
    json: z.string().optional(),
  }).optional(),
  overlay: z.object({
    style: z.string().optional(),
    left: z.string().optional(),
    top: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
  }).optional(),
  allowCalculateOverride: z.boolean().optional(),
  encrypted: z.boolean().optional(),
  showCharCount: z.boolean().optional(),
  showWordCount: z.boolean().optional(),
  properties: z.record(z.string(), z.any()).optional(),
  allowMultipleMasks: z.boolean().optional(),
  addons: z.array(z.any()).optional(),
  tree: z.boolean().optional(),
});

// Recursive component schema for nested components (like containers, panels, etc.)
const componentSchema: z.ZodType<any> = baseComponentSchema.extend({
  components: z.lazy(() => z.array(componentSchema)).optional(),
  columns: z.array(z.object({
    components: z.lazy(() => z.array(componentSchema)).optional(),
    width: z.number().optional(),
    offset: z.number().optional(),
    push: z.number().optional(),
    pull: z.number().optional(),
    size: z.string().optional(),
  })).optional(),
  rows: z.array(z.array(z.object({
    components: z.lazy(() => z.array(componentSchema)).optional(),
  }))).optional(),
});

// Main FormIO schema
export const formioSchema = z.object({
  title: z.string().optional(),
  name: z.string().optional(),
  path: z.string().optional(),
  type: z.literal('form').default('form'),
  display: z.enum(['form', 'wizard']).default('form'),
  action: z.string().optional(),
  tags: z.array(z.string()).optional(),
  deleted: z.number().optional(),
  access: z.array(z.object({
    roles: z.array(z.string()).optional(),
    type: z.string().optional(),
  })).optional(),
  submissionAccess: z.array(z.object({
    roles: z.array(z.string()).optional(),
    type: z.string().optional(),
  })).optional(),
  owner: z.string().optional(),
  components: z.array(componentSchema),
  settings: z.object({
    pdf: z.object({
      id: z.string().optional(),
      src: z.string().optional(),
    }).optional(),
  }).optional(),
  properties: z.record(z.string(), z.any()).optional(),
  macros: z.array(z.any()).optional(),
});

export type FormioSchema = z.infer<typeof formioSchema>;

// Validation function for FormIO schemas
export const validateFormioSchema = (schema: unknown): { valid: boolean; errors?: string[]; data?: FormioSchema } => {
  try {
    const validatedSchema = formioSchema.parse(schema);
    return { valid: true, data: validatedSchema };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`);
      return { valid: false, errors };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
};

// Calculate schema complexity (for size limits)
export const calculateSchemaComplexity = (schema: FormioSchema): number => {
  const countComponents = (components: any[]): number => {
    let count = components.length;
    for (const component of components) {
      if (component.components) {
        count += countComponents(component.components);
      }
      if (component.columns) {
        for (const column of component.columns) {
          if (column.components) {
            count += countComponents(column.components);
          }
        }
      }
      if (component.rows) {
        for (const row of component.rows) {
          for (const cell of row) {
            if (cell.components) {
              count += countComponents(cell.components);
            }
          }
        }
      }
    }
    return count;
  };

  return countComponents(schema.components || []);
};

// Maximum number of components allowed for AI assistance
export const MAX_SCHEMA_COMPLEXITY_FOR_AI = 50;