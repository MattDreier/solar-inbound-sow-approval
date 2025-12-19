import { SOWData } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

interface ProposalDisplayProps {
  data: SOWData;
}

export function ProposalDisplay({ data }: ProposalDisplayProps) {
  return (
    <Card>
      <CardContent>
        <a
          href={data.proposalImageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="relative w-full aspect-[8.5/11] bg-dark-surface rounded-md overflow-hidden">
            <Image
              src={data.proposalImageUrl}
              alt="Solar System Proposal"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
              className="object-contain"
              priority
            />
          </div>
          <p className="text-sm text-light-muted mt-3 text-center">
            Click to view full size
          </p>
        </a>
      </CardContent>
    </Card>
  );
}
