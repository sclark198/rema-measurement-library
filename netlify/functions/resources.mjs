
import {
  submissions,
  normalize,
  moderation,
  store
} from './_shared.mjs';

export default async () => {
  try {
    const [raw, states] = await Promise.all([
      submissions(),
      moderation()
    ]);

    const visible = raw
      .map(normalize)
      .filter(resource =>
        states[resource.id] !== 'hidden' &&
        states[resource.id] !== 'deleted'
      );

    const resources = await Promise.all(
      visible.map(async resource => {
        const saved = await store().get('edit-' + resource.id);
        const edits = saved ? JSON.parse(saved) : {};

        return {
          ...resource,
          ...edits,
          id: resource.id,
          status: 'published'
        };
      })
    );

    return Response.json(
      { resources },
      {
        headers: {
          'cache-control': 'no-store'
        }
      }
    );

  } catch (error) {
    console.error('REMA resources error:', error);

    return Response.json(
      { error: error.message },
      { status: 503 }
    );
  }
};
