'use client';
import TodaysPlanCard from '../../timeline/TodaysPlanCard';

export default function TodaysPlanWidget({ onAccordionToggle }: { onAccordionToggle?: (isOpen: boolean, contentHeight: number) => void }) {
  // The onAccordionToggle prop would need to be passed down from the main dashboard if complex layout adjustments are needed.
  return <TodaysPlanCard onAccordionToggle={onAccordionToggle} />;
}
