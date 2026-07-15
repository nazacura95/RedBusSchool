import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({ className = "", ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className={`w-full text-left ${className}`} {...props} />
    </div>
  );
}

export function Thead({ ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="bg-neutral-50 text-xs font-semibold uppercase text-neutral-500" {...props} />;
}

export function Tbody({ ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function Tr({ className = "", ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`border-b border-neutral-100 last:border-0 hover:bg-neutral-50 ${className}`} {...props} />;
}

export function Th({ className = "", ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-4 py-3 ${className}`} {...props} />;
}

export function Td({ className = "", ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 text-neutral-700 ${className}`} {...props} />;
}
