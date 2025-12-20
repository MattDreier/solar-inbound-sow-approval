import { Card } from '@/components/ui/Card';

export function DisclaimerSection() {
  return (
    <Card className="bg-status-pending/20 dark:bg-status-pending/30 border-2 border-status-pending/40 dark:border-status-pending/50">
      <div className="py-8 px-8">
        <p className="text-gray-900 dark:text-amber-50 font-bold text-[23px] leading-relaxed tracking-wide text-center">
          THIS IS SUBJECT TO CHANGE AFTER PRE-PRODUCTION UPLOAD AND INSTALLATION
        </p>
      </div>
    </Card>
  );
}
