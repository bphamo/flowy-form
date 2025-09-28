/* eslint-disable @typescript-eslint/no-explicit-any */
// AI tools for schema validation and complexity reduction using Vercel AI SDK
import { tool } from 'ai';
import { z } from 'zod';
import type { FormType } from '@formio/react';
import { calculateSchemaComplexity, validateFormioSchema, MAX_SCHEMA_COMPLEXITY_FOR_AI } from '../formio-validation';
import { validateAISolution, extractAllComponentKeys, findDuplicateKeys } from './utils';

// Schema validation tool
export const validateSchemaTool = tool({
  description: 'Validate a FormIO schema for correctness, complexity, and compatibility. Use this to check schemas before finalizing changes.',
  parameters: z.object({
    schema: z.any().describe('The FormIO schema to validate'),
    checkComplexity: z.boolean().default(true).describe('Whether to check schema complexity limits'),
  }),
  execute: async ({ schema, checkComplexity }) => {
    try {
      // Basic FormIO schema validation
      const validation = validateFormioSchema(schema);
      
      // Calculate complexity
      const complexity = calculateSchemaComplexity(schema);
      
      // Check for duplicate keys
      const duplicateKeys = findDuplicateKeys(schema);
      
      // Get all component keys
      const componentKeys = extractAllComponentKeys(schema);
      
      const results = {
        valid: validation.valid,
        complexity,
        maxComplexity: MAX_SCHEMA_COMPLEXITY_FOR_AI,
        componentCount: componentKeys.length,
        duplicateKeys,
        issues: validation.errors || [],
        warnings: [] as string[],
      };
      
      // Add complexity warnings
      if (checkComplexity && complexity > MAX_SCHEMA_COMPLEXITY_FOR_AI) {
        results.warnings.push(`Schema complexity (${complexity}) exceeds recommended limit (${MAX_SCHEMA_COMPLEXITY_FOR_AI})`);
      }
      
      // Add duplicate key warnings
      if (duplicateKeys.length > 0) {
        results.warnings.push(`Found duplicate component keys: ${duplicateKeys.join(', ')}`);
        results.valid = false;
        results.issues.push('Duplicate component keys detected');
      }
      
      return {
        ...results,
        summary: results.valid 
          ? `✅ Schema is valid with ${complexity} components` 
          : `❌ Schema has ${results.issues.length} issues`,
      };
      
    } catch (error) {
      return {
        valid: false,
        complexity: 0,
        maxComplexity: MAX_SCHEMA_COMPLEXITY_FOR_AI,
        componentCount: 0,
        duplicateKeys: [],
        issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        summary: '❌ Schema validation failed due to error',
      };
    }
  },
});

// Complexity reduction tool
export const reduceComplexityTool = tool({
  description: 'Analyze a FormIO schema and suggest ways to reduce complexity while maintaining functionality. Use when schemas exceed complexity limits.',
  parameters: z.object({
    schema: z.any().describe('The FormIO schema to analyze for complexity reduction'),
    targetComplexity: z.number().optional().describe('Target complexity level (defaults to max allowed)'),
  }),
  execute: async ({ schema, targetComplexity = MAX_SCHEMA_COMPLEXITY_FOR_AI }) => {
    try {
      const currentComplexity = calculateSchemaComplexity(schema);
      const components = schema.components || [];
      
      const suggestions: string[] = [];
      const analysisResults = {
        currentComplexity,
        targetComplexity,
        reductionNeeded: currentComplexity - targetComplexity,
        componentTypes: {} as Record<string, number>,
        emptyContainers: [] as string[],
        unnecessaryNesting: [] as string[],
        redundantComponents: [] as string[],
      };
      
      // Analyze component types
      const analyzeComponents = (comps: any[], path = '') => {
        for (let i = 0; i < comps.length; i++) {
          const comp = comps[i];
          const compPath = path ? `${path}.${comp.key || i}` : (comp.key || `component_${i}`);
          
          // Count component types
          analysisResults.componentTypes[comp.type] = (analysisResults.componentTypes[comp.type] || 0) + 1;
          
          // Check for empty containers
          if (['panel', 'fieldset', 'container'].includes(comp.type)) {
            if (!comp.components || comp.components.length === 0) {
              analysisResults.emptyContainers.push(compPath);
              suggestions.push(`Remove empty ${comp.type} container: ${compPath}`);
            }
          }
          
          // Check for unnecessary HTML elements
          if (comp.type === 'htmlelement' && (!comp.content || comp.content.trim().length < 10)) {
            analysisResults.redundantComponents.push(compPath);
            suggestions.push(`Remove minimal HTML element: ${compPath}`);
          }
          
          // Check for single-child containers
          if (['panel', 'fieldset'].includes(comp.type) && comp.components?.length === 1) {
            analysisResults.unnecessaryNesting.push(compPath);
            suggestions.push(`Consider removing single-child container: ${compPath}`);
          }
          
          // Recurse into nested components
          if (comp.components) {
            analyzeComponents(comp.components, compPath);
          }
          if (comp.columns) {
            comp.columns.forEach((col: any, colIndex: number) => {
              if (col.components) {
                analyzeComponents(col.components, `${compPath}.column_${colIndex}`);
              }
            });
          }
        }
      };
      
      analyzeComponents(components);
      
      // Generate specific reduction strategies
      if (analysisResults.reductionNeeded > 0) {
        suggestions.unshift(`Need to reduce complexity by ${analysisResults.reductionNeeded} components`);
        
        if (analysisResults.emptyContainers.length > 0) {
          suggestions.push(`Priority: Remove ${analysisResults.emptyContainers.length} empty containers`);
        }
        
        if (analysisResults.redundantComponents.length > 0) {
          suggestions.push(`Priority: Remove ${analysisResults.redundantComponents.length} redundant components`);
        }
        
        if (analysisResults.unnecessaryNesting.length > 0) {
          suggestions.push(`Consider: Flatten ${analysisResults.unnecessaryNesting.length} single-child containers`);
        }
        
        // Suggest consolidation
        const panelCount = analysisResults.componentTypes['panel'] || 0;
        const fieldsetCount = analysisResults.componentTypes['fieldset'] || 0;
        if (panelCount + fieldsetCount > 3) {
          suggestions.push('Consider consolidating multiple panels/fieldsets into fewer sections');
        }
      }
      
      return {
        ...analysisResults,
        suggestions,
        canReduce: suggestions.length > 0,
        potentialReduction: analysisResults.emptyContainers.length + analysisResults.redundantComponents.length,
        summary: analysisResults.reductionNeeded > 0 
          ? `⚠️ Complexity reduction needed: ${analysisResults.reductionNeeded} components over limit`
          : `✅ Schema complexity is within limits`,
      };
      
    } catch (error) {
      return {
        currentComplexity: 0,
        targetComplexity,
        reductionNeeded: 0,
        componentTypes: {},
        emptyContainers: [],
        unnecessaryNesting: [],
        redundantComponents: [],
        suggestions: [`Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        canReduce: false,
        potentialReduction: 0,
        summary: '❌ Complexity analysis failed',
      };
    }
  },
});

// Export all tools for use in AI service
export const aiTools = {
  validateSchema: validateSchemaTool,
  reduceComplexity: reduceComplexityTool,
};