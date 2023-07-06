import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';

export function SuccessAlert({ message }: { message?: string }) {
  return (
    <div className="rounded-md bg-green-100 p-2">
      <div className="flex">
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
        </div>
        <div className="mx-3">
          <p className="text-sm font-medium text-green-800">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function FailedAlert({ message }: { message?: string }) {
  return (
    <div className="rounded-md bg-red-100 p-2">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="mx-3">
          <p className="text-sm font-medium text-red-800">{message}</p>
        </div>
      </div>
    </div>
  );
}
