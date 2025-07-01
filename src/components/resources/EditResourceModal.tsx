
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResourceLink } from "@/types";
import { useEffect } from "react";

const resourceCategories: ResourceLink['category'][] = ['website', 'article', 'book', 'course', 'tool', 'community', 'other'];

const resourceFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  url: z.string().url({ message: "Please enter a valid URL." }),
  description: z.string().optional(),
  category: z.enum(resourceCategories, { required_error: "Category is required." }),
});

type ResourceFormValues = z.infer<typeof resourceFormSchema>;

interface EditResourceModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  resourceToEdit: ResourceLink | null;
  onSave: (resource: ResourceLink) => void;
}

export default function EditResourceModal({ isOpen, onOpenChange, resourceToEdit, onSave }: EditResourceModalProps) {
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: '',
      url: '',
      description: '',
      category: 'website',
    },
  });

  useEffect(() => {
    if (resourceToEdit) {
      form.reset({
        title: resourceToEdit.title,
        url: resourceToEdit.url,
        description: resourceToEdit.description || '',
        category: resourceToEdit.category,
      });
    } else {
      form.reset({
        title: '',
        url: '',
        description: '',
        category: 'website',
      });
    }
  }, [resourceToEdit, form, isOpen]);

  const handleSubmit = (values: ResourceFormValues) => {
    const resourceData: ResourceLink = {
      id: resourceToEdit?.id || `res-${Date.now()}`,
      isAiRecommended: false, // User-added resources are not AI recommended
      ...values,
    };
    onSave(resourceData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg frosted-glass p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/30">
          <DialogTitle className="font-headline text-xl text-primary">{resourceToEdit ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
          <DialogDescription>
            {resourceToEdit ? "Update the details of your bookmarked resource." : "Add a new resource to your collection."}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., React Docs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://react.dev" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A short description of the resource..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {resourceCategories.map(cat => (
                          <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">Save Resource</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
