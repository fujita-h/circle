'use client';

import { BackendImage } from '@/components/backend-image';
import { MarkdownLoader } from './md-loader';
export function CommentList({ comments }: { comments: any[] }) {
  return (
    <div className="divide-y space-y-2 border rounded-md">
      {comments.map((comment) => (
        <div key={comment.id} className="px-3 py-4">
          <Comment comment={comment} />
        </div>
      ))}
    </div>
  );
}

function Comment({ comment }: { comment: any }) {
  const createdAt = new Date(comment.createdAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <div>
      <div className="flex justify-between">
        <a href={`/u/${comment.user.handle}`}>
          <div className="flex items-center space-x-2">
            <BackendImage src={`/users/${comment.user.id}/photo`} className="h-8 w-8 rounded-full" alt="" />
            <div className="text-sm">
              <span className="font-medium text-gray-700 hover:cursor-pointer hover:underline">
                <span>@{comment.user.handle}</span>
                {comment.user.name ? <span> ({comment.user.name})</span> : <></>}
              </span>
            </div>
          </div>
        </a>
        <div className="text-sm text-gray-500">{createdAt}</div>
      </div>
      <div className="mt-4">
        <div className="text-sm text-gray-700">
          <MarkdownLoader commentId={comment.id} />
        </div>
      </div>
    </div>
  );
}
