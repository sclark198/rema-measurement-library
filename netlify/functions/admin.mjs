
import {
  submissions,
  normalize,
  moderation,
  store
} from './_shared.mjs';

const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'cache-control': 'no-store' }
  });

const editableFields = [
  'name',
  'authors',
  'author_entries',
  'description',
  'constructs',
  'specific_constructs',
  'types',
  'populations',
  'purposes',
  'evidence',
  'resource_url',
  'reference',
  'access',
  'notes',
  'contributor',
  'pdf_url'
];

const arrayFields = new Set([
  'author_entries',
  'constructs',
  'specific_constructs',
  'types',
  'populations',
  'purposes'
]);

export default async req => {
  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const { password, action, id, changes } = await req.json();

    if (
      !process.env.REMA_ADMIN_PASSWORD ||
      password !== process.env.REMA_ADMIN_PASSWORD
    ) {
      return json({ error: 'Incorrect administrator password' }, 401);
    }

    const states = await moderation();

    if (action === 'list') {
      const raw = await submissions();

      const resources = await Promise.all(
        raw.map(async submission => {
          const resource = normalize(submission);
          const saved = await store().get('edit-' + resource.id);
          const edits = saved ? JSON.parse(saved) : {};

          return {
            ...resource,
            ...edits,
            id: resource.id,
            status: states[resource.id] === 'hidden'
              ? 'hidden'
              : 'published'
          };
        })
      );

      return json({
        resources: resources.filter(
          resource => states[resource.id] !== 'deleted'
        )
      });
    }

    if (!id) {
      return json({ error: 'Missing resource ID' }, 400);
    }

    const resourceId = String(id);

    if (action === 'edit') {
      if (
        !changes ||
        typeof changes !== 'object' ||
        Array.isArray(changes)
      ) {
        return json({ error: 'Invalid changes' }, 400);
      }

      const raw = await submissions();
      const original = raw.find(
        submission => String(submission.id) === resourceId
      );

      if (!original || states[resourceId] === 'deleted') {
        return json({ error: 'Resource not found' }, 404);
      }

      const cleaned = {};

      for (const field of editableFields) {
        if (!Object.prototype.hasOwnProperty.call(changes, field)) {
          continue;
        }

        const value = changes[field];

        if (arrayFields.has(field)) {
          if (!Array.isArray(value)) {
            return json({ error: `Invalid ${field}` }, 400);
          }
          cleaned[field] = value;
        } else if (field === 'resource_url' || field === 'pdf_url') {
          if (value !== null &&
              (typeof value !== 'string' ||
               !/^https?:\/\//.test(value))) {
            return json({ error: `Invalid ${field} URL` }, 400);
          }
          cleaned[field] = value;
        } else {
          if (typeof value !== 'string') {
            return json({ error: `Invalid ${field}` }, 400);
          }
          cleaned[field] = value;
        }
      }

      const key = 'edit-' + resourceId;
      const previous = JSON.parse(
        (await store().get(key)) || '{}'
      );

      const updated = { ...previous, ...cleaned };

      await store().set(key, JSON.stringify(updated));

      return json({ ok: true });
    }

    if (!['hide', 'publish', 'delete'].includes(action)) {
      return json({ error: 'Invalid action' }, 400);
    }

    states[resourceId] =
      action === 'hide'
        ? 'hidden'
        : action === 'delete'
          ? 'deleted'
          : 'published';

    await store().set('states', JSON.stringify(states));

    return json({ ok: true });

  } catch (error) {
    console.error('REMA admin error:', error);
    return json({ error: error.message }, 500);
  }
};
