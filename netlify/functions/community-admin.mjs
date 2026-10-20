
import { getStore } from '@netlify/blobs';

const store = () => getStore({
  name: 'rema-community',
  consistency: 'strong'
});

const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'cache-control': 'no-store' }
  });

export default async function handler(req) {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const { password, resourceId, commentId, action } =
      await req.json();

    if (
      !process.env.REMA_ADMIN_PASSWORD ||
      password !== process.env.REMA_ADMIN_PASSWORD
    ) {
      return json({ error: 'Unauthorized' }, 401);
    }

    if (
      typeof resourceId !== 'string' ||
      !/^[a-zA-Z0-9_-]{8,100}$/.test(resourceId)
    ) {
      return json({ error: 'Invalid resource' }, 400);
    }

    const key = 'resource-' + resourceId;

    const record = JSON.parse(
      (await store().get(key)) ||
      '{"comments":[],"votes":[]}'
    );

    if (action === 'list') {
      return json({ comments: record.comments });
    }

    if (!['hide', 'restore', 'delete'].includes(action)) {
      return json({ error: 'Invalid action' }, 400);
    }

    const comment = record.comments.find(
      c => c.id === commentId
    );

    if (!comment) {
      return json({ error: 'Comment not found' }, 404);
    }

    if (action === 'delete') {
      record.comments = record.comments.filter(
        c => c.id !== commentId
      );
    } else {
      comment.hidden = action === 'hide';
    }

    await store().set(key, JSON.stringify(record));

    return json({
      ok: true,
      comments: record.comments
    });

  } catch (error) {
    console.error('Comment moderation error:', error);
    return json({ error: 'Request failed' }, 500);
  }
}
