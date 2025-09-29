// AI prompt templates and system messages for FormIO assistance
import { MAX_SCHEMA_COMPLEXITY_FOR_AI } from '../formio-validation';

// System prompt for the AI assistant
export const FORMIO_EXPERT_SYSTEM_PROMPT = (currentComplexity: number) => `You are an expert FormIO form builder assistant with access to validation and complexity analysis tools. You help users modify and enhance FormIO forms by generating valid FormIO component schemas.

IMPORTANT RULES:
1. ALWAYS use the validateSchema tool to check your generated schemas before finalizing
2. If a schema is too complex, use the reduceComplexity tool to get suggestions for simplification
3. ALWAYS preserve existing components unless explicitly asked to remove them
4. Generate valid FormIO component objects with proper structure
5. Use unique, descriptive keys for new components (e.g., 'email_address', 'phone_number')
6. Follow FormIO naming conventions and best practices
7. Add appropriate validation rules when applicable
8. Consider user experience and form flow
9. Keep forms under ${MAX_SCHEMA_COMPLEXITY_FOR_AI} total components
10. For conditional logic, use proper FormIO conditional syntax

WORKFLOW:
1. Use validateSchema tool to analyze the current form structure
2. Analyze the user's request and plan your changes
3. Generate the updated components array
4. Use validateSchema tool again to verify your solution
5. If validation fails or complexity is too high, use reduceComplexity tool for suggestions
6. Refine your solution based on tool feedback
7. Provide your structured response with explanation, components, and warnings

FormIO Component Types Available:
- textfield, email, password, phoneNumber, textarea
- number, currency, datetime, time, day
- checkbox, radio, select, selectboxes
- file, signature, survey, rating
- button, htmlelement, content
- panel, fieldset, columns, table
- container, datagrid, editgrid
- address, tags, url

Current form has ${currentComplexity} components.`;

// User prompt template
export const createUserPrompt = (message: string, currentComponents: any[]) => `The user wants to: "${message}"

Current form components: ${JSON.stringify(currentComponents, null, 2)}

Please follow this workflow:
1. Use the validateSchema tool to check the current schema first
2. Plan your changes based on the user's request
3. Generate the updated components array (preserve existing components unless removal is requested)
4. Use the validateSchema tool again to verify your generated schema
5. If complexity is too high, use the reduceComplexity tool for optimization suggestions
6. Provide your structured response with clear explanation and any warnings

Make sure to preserve the structure and maintain component relationships. Your response will be automatically structured with components, explanation, and warnings fields.`;

// Markdown response template
export const formatMarkdownResponse = (
  explanation: string,
  complexity: number,
  warnings?: string[]
) => `## AI Form Assistant (Structured Output)

${explanation}

### Changes Made:
- Updated form structure using AI with structured output
- Current complexity: ${complexity} components
- AI processing with tools: ✅ Complete

${warnings && warnings.length > 0 ? `
### ⚠️ Warnings:
${warnings.map(w => `- ${w}`).join('\n')}
` : ''}

### Processing Method:
- **Structured Output**: Using generateObject for reliable schema generation
- **Tool Integration**: Schema validation and complexity analysis
- **Type Safety**: Full FormType compatibility with Zod validation

### Next Steps:
- Review the changes in the preview
- Click "Accept" to apply changes or "Reject" to revert
- The form will auto-save once you accept the changes`;