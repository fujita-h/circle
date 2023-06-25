'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link as Scroll } from 'react-scroll';
import { classNames } from '@/utils';

const CONTENT_ANCHOR_PREFIX = 'content-line';
const CONTENT_ANCHOR_CLASS_NAME = 'doc-content-lines';

export function ReactiveToC({ children }: { children: string }) {
  const [scrollMarker, setScrollMarker] = useState('');
  const throrttleTimer = useRef(Date.now());
  const throttle = useCallback((fn: () => any, delay: number) => {
    if (throrttleTimer.current + delay < Date.now()) {
      throrttleTimer.current = Date.now();
      return fn();
    }
  }, []);

  const handleScroll = (e: Event) => {
    throttle(() => updateScrollMarker(), 100);
  };

  const updateScrollMarker = useCallback(() => {
    const elements = Array.from(document.getElementsByClassName(CONTENT_ANCHOR_CLASS_NAME));
    const targets = elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { id: element.id, top: rect.top - 1 };
      })
      .sort((a, b) => b.top - a.top);
    const target = targets.find((x) => x.top < 0) ?? targets.slice(-1)[0];
    setScrollMarker(target?.id ?? '');
  }, []);

  useEffect(() => {
    document.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollMarker();
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  });

  const H1 = useCallback(
    ({ node, ...props }: any) => {
      return (
        <div
          className={classNames(
            `${CONTENT_ANCHOR_PREFIX}-${node.position?.start.line.toString()}` == scrollMarker ? 'bg-gray-200' : '',
            'py-1 hover:cursor-pointer hover:bg-gray-300',
          )}
        >
          <Scroll to={`${CONTENT_ANCHOR_PREFIX}-${node.position?.start.line.toString()}`} smooth={true} duration={600}>
            {props.children}
          </Scroll>
        </div>
      );
    },
    [scrollMarker],
  );
  const H2 = useCallback(
    ({ node, ...props }: any) => {
      return (
        <div
          className={classNames(
            `${CONTENT_ANCHOR_PREFIX}-${node.position?.start.line.toString()}` == scrollMarker ? 'bg-gray-200' : '',
            'py-1 pl-3 hover:cursor-pointer hover:bg-gray-300',
          )}
        >
          <Scroll to={`${CONTENT_ANCHOR_PREFIX}-${node.position?.start.line.toString()}`} smooth={true} duration={600}>
            {props.children}
          </Scroll>
        </div>
      );
    },
    [scrollMarker],
  );

  return (
    <ReactMarkdown className="text-sm text-zinc-700" allowedElements={['h1', 'h2']} components={{ h1: H1, h2: H2 }}>
      {children}
    </ReactMarkdown>
  );
}
