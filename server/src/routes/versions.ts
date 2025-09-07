import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index';
import { authMiddleware } from '../middleware/auth';
import { formWriteCheckMiddleware } from '../middleware/role';
import * as versionsService from '../services/versions';

const versionRoutes = new Hono();

// Validation schemas for version operations
const createVersionSchema = z.object({
  description: z.string().optional(),
  schema: z.any().optional(), // Schema is now optional - server will determine base schema
  publish: z.boolean().default(false),
  baseVersionSha: z.string().optional(), // Optional base version to copy schema from
});

const updateVersionSchema = z.object({
  description: z.string().optional(),
  schema: z.any().optional(),
});

const revertVersionSchema = z.object({
  description: z.string().optional(),
});

/**
 * GET /api/forms/:formId/versions
 *
 * Retrieves all versions for a specific form
 * Returns version history with author information
 *
 * Access: Form owner only
 * Auth Required: Yes
 *
 * Response: { versions: FormVersion[], liveVersion: string | null }
 */
versionRoutes.get('/forms/:formId/versions', authMiddleware, formWriteCheckMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('formId'));

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    const versions = await versionsService.getFormVersions(db, formId);
    const publishedVersion = await versionsService.getPublishedVersion(db, formId);

    return c.json({
      data: {
        versions,
        liveVersion: publishedVersion.length > 0 ? publishedVersion[0].versionSha : null,
      },
    });
  } catch (error) {
    console.error('Error fetching form versions:', error);
    return c.json({ error: 'Failed to fetch form versions' }, 500);
  }
});

/**
 * GET /api/forms/:formId/versions/:sha
 *
 * Gets a specific version with schema
 * Used for editing and previewing specific versions
 *
 * Access: Form owner only
 * Auth Required: Yes
 *
 * Response: FormVersion with full schema data
 */
versionRoutes.get('/forms/:formId/versions/:sha', authMiddleware, formWriteCheckMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('formId'));
    const versionSha = c.req.param('sha');

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    if (!versionSha) {
      return c.json({ error: 'Version SHA is required' }, 400);
    }

    const version = await versionsService.getVersionBySha(db, formId, versionSha);

    if (!version) {
      return c.json({ error: 'Version not found' }, 404);
    }

    return c.json({ data: version[0] });
  } catch (error) {
    console.error('Error fetching form version:', error);
    return c.json({ error: 'Failed to fetch form version' }, 500);
  }
});

/**
 * POST /api/forms/:formId/versions
 *
 * Creates a new form version
 * Optionally publishes the version immediately
 * Server determines base schema from live version or creates blank
 *
 * Access: Form owner only
 * Auth Required: Yes
 *
 * Body: { description?, schema?, publish?, baseVersionSha? }
 * Response: { data: { version: FormVersion, sha: string } }
 */
versionRoutes.post('/forms/:formId/versions', authMiddleware, formWriteCheckMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('formId'));
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }
    const body = await c.req.json();

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    const validatedData = createVersionSchema.parse(body);

    let baseSchema;

    if (validatedData.schema) {
      // Use provided schema
      baseSchema = validatedData.schema;
    } else if (validatedData.baseVersionSha) {
      // No schema provided, use baseVersionSha to fetch base version schema
      try {
        const baseVersion = await versionsService.getVersionBySha(db, formId, validatedData.baseVersionSha);
        if (baseVersion.length > 0) {
          // Use base version schema as base
          baseSchema = baseVersion[0].schema;
        } else {
          // No base version exists, use blank schema
          baseSchema = {
            title: '',
            name: '',
            path: '',
            display: 'form',
            type: 'form',
            components: [],
          };
        }
      } catch (error) {
        console.warn('Could not fetch live version, using blank schema:', error);
        // Fallback to blank schema
        baseSchema = {
          title: '',
          name: '',
          path: '',
          display: 'form',
          type: 'form',
          components: [],
        };
      }
    } else {
      // No schema and no baseVersionSha provided, use blank schema
      baseSchema = {
        title: '',
        name: '',
        path: '',
        display: 'form',
        type: 'form',
        components: [],
      };
    }

    // Set appropriate description if none provided
    const description =
      validatedData.description ||
      (validatedData.schema
        ? 'New draft version'
        : (await versionsService.getPublishedVersion(db, formId)).length > 0
          ? 'New draft version'
          : 'Initial draft version');

    const newVersion = await versionsService.createVersion(
      db,
      {
        formId,
        description,
        schema: baseSchema,
        isPublished: validatedData.publish,
        baseVersionSha: validatedData.baseVersionSha,
        auditDescription: validatedData.baseVersionSha
          ? `Created new version from ${validatedData.baseVersionSha.slice(0, 8)}`
          : 'New version created',
      },
      user.id,
    );

    return c.json(
      {
        data: {
          version: newVersion[0],
          sha: newVersion[0].versionSha,
        },
      },
      201,
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', errors: error.issues }, 400);
    }
    console.error('Error creating version:', error);
    return c.json({ error: 'Failed to create version' }, 500);
  }
});

/**
 * PUT /api/forms/:formId/versions/:sha
 *
 * Updates version metadata and schema
 * Only draft versions can be updated
 *
 * Access: Form owner only
 * Auth Required: Yes
 *
 * Body: { description?, schema? }
 * Response: { data: FormVersion }
 */
versionRoutes.put('/forms/:formId/versions/:sha', authMiddleware, formWriteCheckMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('formId'));
    const versionSha = c.req.param('sha');
    const body = await c.req.json();

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    const validatedData = updateVersionSchema.parse(body);

    const updatedVersion = await versionsService.updateVersion(db, formId, versionSha, validatedData);

    if (updatedVersion.length === 0) {
      return c.json({ error: 'Version not found or already published' }, 404);
    }

    return c.json({ data: updatedVersion[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', errors: error.issues }, 400);
    }
    console.error('Error updating version:', error);
    return c.json({ error: 'Failed to update version' }, 500);
  }
});

/**
 * DELETE /api/forms/:formId/versions/:sha
 *
 * Deletes a version (only if not published)
 * Published versions cannot be deleted for data integrity
 *
 * Access: Form owner only
 * Auth Required: Yes
 *
 * Response: { data: { deleted: true } }
 */
versionRoutes.delete('/forms/:formId/versions/:sha', authMiddleware, formWriteCheckMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('formId'));
    const versionSha = c.req.param('sha');

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    const result = await versionsService.deleteVersion(db, formId, versionSha);

    if (result.length === 0) {
      return c.json({ error: 'Version not found or already published' }, 404);
    }

    return c.json({ message: 'Version deleted successfully' });
  } catch (error) {
    console.error('Error deleting version:', error);
    return c.json({ error: 'Failed to delete version' }, 500);
  }
});

/**
 * POST /api/forms/:formId/versions/:sha/publish
 *
 * Publishes a specific version
 * Makes the version live and unpublishes others
 *
 * Access: Form owner only
 * Auth Required: Yes
 *
 * Response: { data: FormVersion }
 */
versionRoutes.post('/forms/:formId/versions/:sha/publish', authMiddleware, formWriteCheckMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('formId'));
    const versionSha = c.req.param('sha');

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    const publishedVersion = await versionsService.publishVersion(db, formId, versionSha);

    if (publishedVersion.length === 0) {
      return c.json({ error: 'Version not found' }, 404);
    }

    return c.json({ data: publishedVersion[0] });
  } catch (error) {
    console.error('Error publishing version:', error);
    return c.json({ error: 'Failed to publish version' }, 500);
  }
});

/**
 * POST /api/forms/:formId/versions/:sha/force-reset
 *
 * Force reset to a specific version
 * Deletes all versions created after the target version and makes target live
 * WARNING: This is destructive and cannot be undone
 *
 * Access: Form owner only
 * Auth Required: Yes
 *
 * Body: { description? }
 * Response: { data: { message: string, deletedCount: number } }
 */
versionRoutes.post('/forms/:formId/versions/:sha/force-reset', authMiddleware, formWriteCheckMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('formId'));
    const versionSha = c.req.param('sha');

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    const result = await versionsService.forceResetToVersion(db, formId, versionSha);

    return c.json({
      data: result,
      message: 'Successfully reset to version and deleted subsequent versions',
    });
  } catch (error) {
    console.error('Error force resetting version:', error);
    return c.json({ error: 'Failed to force reset to version' }, 500);
  }
});

/**
 * POST /api/forms/:formId/versions/:sha/make-live
 *
 * Make an old version live without deleting history
 * Simply changes which version is published
 *
 * Access: Form owner only
 * Auth Required: Yes
 *
 * Response: { data: FormVersion, message: string }
 */
versionRoutes.post('/forms/:formId/versions/:sha/make-live', authMiddleware, formWriteCheckMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('formId'));
    const versionSha = c.req.param('sha');

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    const result = await versionsService.makeVersionLive(db, formId, versionSha);

    return c.json({
      data: result,
      message: 'Successfully made version live',
    });
  } catch (error) {
    console.error('Error making version live:', error);
    return c.json({ error: 'Failed to make version live' }, 500);
  }
});

/**
 * POST /api/forms/:formId/versions/:sha/make-latest
 *
 * Create a new latest version based on an old version
 * Duplicates the old schema as a new draft version
 *
 * Access: Form owner only
 * Auth Required: Yes
 *
 * Body: { description? }
 * Response: { data: FormVersion[] }
 */
versionRoutes.post('/forms/:formId/versions/:sha/make-latest', authMiddleware, formWriteCheckMiddleware, async (c) => {
  try {
    const formId = parseInt(c.req.param('formId'));
    const versionSha = c.req.param('sha');
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }
    const body = await c.req.json();

    if (isNaN(formId)) {
      return c.json({ error: 'Invalid form ID' }, 400);
    }

    const validatedData = revertVersionSchema.parse(body);

    const newVersion = await versionsService.makeVersionLatest(db, formId, versionSha, user.id, validatedData.description);

    return c.json({
      data: newVersion,
      message: 'Successfully created new draft version',
    });
  } catch (error) {
    console.error('Error making version latest:', error);
    return c.json({ error: 'Failed to make version latest' }, 500);
  }
});

export default versionRoutes;
