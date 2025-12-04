import React, { Fragment } from 'react';
import { Dialog, Transition, Disclosure } from '@headlessui/react';
import { Globe, Play, Box, AlertTriangle, X, ChevronDown } from 'lucide-react';
import { HighlightedTextarea } from './HighlightedTextarea';

interface GenericPromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  genericExecutionPrompt: string;
  setGenericExecutionPrompt: (val: string) => void;
  genericEvaluatorPrompt: string;
  setGenericEvaluatorPrompt: (val: string) => void;
  genericFailPrompt: string;
  setGenericFailPrompt: (val: string) => void;
}

interface AccordionItemProps {
  icon: React.ElementType;
  title: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  iconColor?: string;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  icon: Icon,
  title,
  value,
  onChange,
  placeholder,
  iconColor = 'text-blue-600',
}) => {
  return (
    <Disclosure>
      {({ open }) => (
        <div className="border border-gray-200 rounded-lg">
          <Disclosure.Button className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors rounded-lg">
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${iconColor}`} />
              <span className="font-semibold text-gray-900">{title}</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-500 transition-transform ${
                open ? 'rotate-180' : ''
              }`}
            />
          </Disclosure.Button>
          <Disclosure.Panel className="px-4 pb-4">
            <HighlightedTextarea
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              className="p-3"
              rows={16}
            />
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
};

export const GenericPromptsModal: React.FC<GenericPromptsModalProps> = ({
  isOpen,
  onClose,
  genericExecutionPrompt,
  setGenericExecutionPrompt,
  genericEvaluatorPrompt,
  setGenericEvaluatorPrompt,
  genericFailPrompt,
  setGenericFailPrompt,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl h-[90vh] transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all border border-gray-100 flex flex-col">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2"
                  >
                    <Globe className="w-5 h-5 text-blue-600" />
                    Generic Prompts
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 min-h-0 pr-2">
                  <AccordionItem
                    icon={Play}
                    title="Generic Execution Prompt"
                    value={genericExecutionPrompt}
                    onChange={setGenericExecutionPrompt}
                    placeholder="Context that applies to ALL steps (prepended to step context)..."
                  />
                  <AccordionItem
                    icon={Box}
                    title="Generic Evaluator Prompt"
                    value={genericEvaluatorPrompt}
                    onChange={setGenericEvaluatorPrompt}
                    placeholder="Evaluation rules that apply to ALL steps (prepended to evaluator criteria)..."
                  />
                  <AccordionItem
                    icon={AlertTriangle}
                    title="Generic Fail Prompt"
                    value={genericFailPrompt}
                    onChange={setGenericFailPrompt}
                    placeholder="Context for handling failures or retries..."
                    iconColor="text-orange-600"
                  />
                </div>

                <div className="mt-6 flex justify-end flex-shrink-0">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors shadow-sm"
                    onClick={onClose}
                  >
                    Done
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

