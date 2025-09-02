
'use client';

import type { FC } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { TimelineEvent } from '@/types';
import EditEventForm from './EditEventForm';
import type { EditEventFormValues } from './EditEventForm';
import { startOfDay } from 'date-fns';

interface EditEventModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  eventToEdit: TimelineEvent | null;
  onSubmit: (updatedEvent: TimelineEvent, syncToGoogle: boolean) => void;
  isAddingNewEvent?: boolean;
  isGoogleConnected: boolean;
}

const EditEventModal: FC<EditEventModalProps> = ({
  isOpen,
  onOpenChange,
  eventToEdit,
  onSubmit,
  isAddingNewEvent,
  isGoogleConnected,
}) => {
  if (!eventToEdit) {
    return null;
  }

  const handleFormSubmit = (values: EditEventFormValues) => {
    let startDate = new Date(values.startDateTime);
    let endDate: Date | undefined = values.endDateTime ? new Date(values.endDateTime) : undefined;

    // This logic is now primarily handled in the form itself for immediate UI feedback.
    // This block ensures data consistency before saving.
    if (values.isAllDay) {
      startDate = startOfDay(startDate);
      if (!endDate || endDate < startDate) {
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      }
    }
    
    const updatedEvent: TimelineEvent = {
      ...eventToEdit,
      title: values.title,
      notes: values.notes,
      date: startDate,
      endDate: endDate,
      type: values.type,
      isAllDay: values.isAllDay || false,
      color: values.color,
      status: values.status || 'pending',
      tags: values.tags || '',
      location: values.location || '',
      priority: values.priority || 'None',
      url: values.url || '',
      imageUrl: values.imageUrl || '',
    };
    
    onSubmit(updatedEvent, values.syncToGoogle);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const dialogTitle = isAddingNewEvent ? "Add New Event" : "Edit Timeline Event";
  const dialogDescription = isAddingNewEvent
    ? "Fill in the details for your new event."
    : "Make changes to your event details below. Click save when you're done.";


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg frosted-glass p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/30">
          <DialogTitle className="font-headline text-xl text-primary">{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 pt-4 overflow-y-auto max-h-[calc(100vh-15rem)] sm:max-h-[70vh]">
          <EditEventForm
            eventToEdit={eventToEdit}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            isAddingNewEvent={isAddingNewEvent}
            isGoogleConnected={isGoogleConnected}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventModal;
