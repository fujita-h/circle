'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { Schema } from 'hast-util-sanitize';

const CONTENT_ANCHOR_PREFIX = 'content-line';
const CONTENT_ANCHOR_CLASS_NAME = 'doc-content-lines';

export function Parser({ children, addHeaderAnchor = false }: { children: string; addHeaderAnchor?: boolean }) {
  const mySchema: Schema = { ...defaultSchema };

  const H1 = ({ node, ...props }: any) => (
    <h1 id={`${CONTENT_ANCHOR_PREFIX}-${node.position?.start.line.toString()}`} className={CONTENT_ANCHOR_CLASS_NAME}>
      {props.children}
    </h1>
  );
  const H2 = ({ node, ...props }: any) => (
    <h2 id={`${CONTENT_ANCHOR_PREFIX}-${node.position?.start.line.toString()}`} className={CONTENT_ANCHOR_CLASS_NAME}>
      {props.children}
    </h2>
  );

  return (
    <ReactMarkdown
      className="markdown"
      remarkPlugins={[gfm]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, mySchema]]}
      unwrapDisallowed={false}
      components={addHeaderAnchor ? { h1: H1, h2: H2 } : undefined}
    >
      {children}
    </ReactMarkdown>
  );
}
