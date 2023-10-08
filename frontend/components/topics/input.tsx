'use client';

import { Topic } from '@/types';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';
import { useState } from 'react';
import { BackendImage } from '../backend-image';

export function TopicInput({
  values,
  candidates,
  onChange,
}: {
  values: Topic[];
  candidates: Topic[];
  onChange: (values: Topic[]) => void;
}) {
  const [items, setItems] = useState(values);

  return (
    <div className="border-0 rounded-md px-1 py-1 ring-1 ring-gray-300 focus:ring-1 focus:ring-inset focus:ring-indigo-400 shadow-sm bg-white w-full text-sm flex gap-1">
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (over == null || active.id === over.id) {
            return;
          }
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over.id);
          const newItems = arrayMove(items, oldIndex, newIndex);
          setItems(newItems);
          onChange(newItems);
        }}
      >
        <SortableContext items={items}>
          <div className="flex gap-1">
            {items.map((item) => (
              <SortableTopicItem
                key={item.id}
                item={item}
                onDelete={(item) => {
                  const newItems = items.filter((i) => i.id !== item.id);
                  setItems(newItems);
                  onChange(newItems);
                }}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <TopicsComboBox
        candidates={candidates.filter((candidate) => !items.some((item) => item.id === candidate.id))}
        onChange={(topic) => {
          const newItems = [...new Set([...items, topic])];
          setItems(newItems);
          onChange(newItems);
        }}
      />
    </div>
  );
}

function SortableTopicItem({ item, onDelete }: { item: Topic; onDelete: (value: Topic) => void }) {
  const { isDragging, setActivatorNodeRef, attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      className={clsx('relative', isDragging ? 'z-[1]' : '')}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="flex items-center gap-2 px-2 py-1 border border-gray-300 rounded-sm bg-white">
        <div className="flex items-center relative gap-2">
          <span
            className="absolute inset-x-0 -top-px bottom-0"
            ref={setActivatorNodeRef}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            {...attributes}
            {...listeners}
          />
          <BackendImage src={`/topics/${item.handle}/photo`} alt="" className="h-6 w-6 flex-shrink-0 rounded-full" />
          <div className="flex-1">{item.handle}</div>
        </div>
        <div
          className="text-gray-500 hover:text-red-700 hover:cursor-pointer"
          onClick={() => {
            onDelete(item);
          }}
        >
          <XMarkIcon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function TopicsComboBox({ candidates, onChange }: { candidates: Topic[]; onChange: (value: Topic) => void }) {
  const [query, setQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const handleChange = (topic: Topic) => {
    setQuery('');
    setSelectedTopic(null);
    onChange(topic);
  };

  const filteredcandidates =
    query === '' ? candidates : candidates.filter((candidate) => candidate.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Combobox as="div" value={selectedTopic} onChange={handleChange}>
      <div className="relative">
        <Combobox.Input
          className="w-full rounded-md border-0 bg-white py-1 pl-3 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          onKeyDown={(event) => {
            if (filteredcandidates.length === 0 && event.key === 'Enter') {
              event.preventDefault();
            }
          }}
          onChange={(event) => setQuery(event.target.value)}
          displayValue={(person: any) => person?.name}
          placeholder="Add Topic..."
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Combobox.Button>

        {filteredcandidates.length > 0 && (
          <Combobox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredcandidates.map((topic) => (
              <Combobox.Option
                key={topic.id}
                value={topic}
                className={({ active }) =>
                  clsx('relative cursor-default select-none py-2 pl-3 pr-9', active ? 'bg-indigo-600 text-white' : 'text-gray-900')
                }
              >
                {({ active, selected }) => (
                  <>
                    <div className="flex items-center">
                      <BackendImage src={`/topics/${topic.handle}/photo`} alt="" className="h-6 w-6 flex-shrink-0 rounded-full" />
                      <span className={clsx('ml-3 truncate', selected && 'font-semibold')}>{topic.name}</span>
                    </div>

                    {selected && (
                      <span
                        className={clsx('absolute inset-y-0 right-0 flex items-center pr-4', active ? 'text-white' : 'text-indigo-600')}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        )}
      </div>
    </Combobox>
  );
}
