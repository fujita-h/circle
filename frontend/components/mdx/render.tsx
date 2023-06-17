'use client';

import { useState, useEffect, useRef } from 'react';
import * as runtime from 'react/jsx-runtime';
import { compile, run } from '@mdx-js/mdx';
import { ErrorBoundary, DisplayBoundaryError } from '@/components/error-boundary';
import { BackendImage } from '@/components/backend-image';
import rehypeRaw from 'rehype-raw';
export function RenderMDX({ source }: { source: string }) {
  const [content, setContent] = useState<any>();

  // Due to the need for Authorization to get MDX, it is necessary to get it on the client side,
  // and then compile it on the client side.

  // see https://github.com/mdx-js/mdx/blob/main/packages/mdx/lib/core.js to know how compile works.

  useEffect(() => {
    compile(source, {
      format: 'md',
      remarkPlugins: [],
      remarkRehypeOptions: {},
      rehypePlugins: [rehypeRaw], // if format is md, rehypeRaw is required to pass raw html.
      outputFormat: 'function-body',
    })
      .then(async (compiled) => {
        const { default: Content } = await run(compiled, runtime).catch((err) => <div>Error on Render</div>);
        setContent(<Content components={{ Image: BackendImage }}></Content>);
      })
      .catch((err) => {
        console.error(err);
        setContent(<div>Error on Compile</div>);
      });
  }, [source]);

  const handleReset = () => {
    console.log('handleReset');
  };

  return (
    <ErrorBoundary fallback={(error, resetError) => <DisplayBoundaryError error={error} resetError={resetError} />}>
      {content}
    </ErrorBoundary>
  );
}
