import { Card } from '@/components/ui/card';

export function DisclaimerSection() {
  return (
    <Card className="bg-status-pending/15 shadow-lg border-0">
      <div className="py-8 px-8">
        <p className="text-light-primary font-medium text-[23px] leading-relaxed tracking-wide text-center">
          THIS IS SUBJECT TO CHANGE AFTER PRE-PRODUCTION UPLOAD AND INSTALLATION
        </p>
      </div>
    </Card>
  );
}
