/**
 * Advanced React Query hook for optimistic email management
 * Demonstrates the power of React Query v5 with tRPC
 */

import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";

interface Email {
  id: string;
  title: string;
  recipientCount: number;
  scheduledFor: Date | null;
  intervalDays: number | null;
  isActive: boolean;
  isSent: boolean;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateEmailData {
  title: string;
  subject: string;
  content: string;
  recipients: Array<{ email: string; name?: string }>;
  scheduledFor?: Date;
  intervalDays?: number;
}

export function useOptimisticEmails() {
  const queryClient = useQueryClient();
  const utils = (trpc as any).useUtils();

  // Enhanced create mutation with optimistic updates
  const createEmail = (trpc as any).emails.createEmail.useMutation({
    // Optimistic update - immediately add email to UI
    onMutate: async (newEmailData: any) => {
      // Cancel outgoing refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ["emails"] });

      // Snapshot the previous value
      const previousEmails =
        (queryClient.getQueryData(["emails"]) as Email[]) || [];

      // Create optimistic email object
      const optimisticEmail: Email = {
        id: `temp-${Date.now()}`, // Temporary ID
        title: newEmailData.title,
        recipientCount: newEmailData.recipients.length,
        scheduledFor: newEmailData.scheduledFor || null,
        intervalDays: newEmailData.intervalDays || null,
        isActive: true,
        isSent: false,
        sentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistically update the emails list
      queryClient.setQueryData(
        ["emails"],
        [...previousEmails, optimisticEmail]
      );

      // Return context with previous data for rollback
      return { previousEmails, optimisticEmail };
    },

    // Rollback on error
    onError: (error: any, variables: any, context: any) => {
      if (context?.previousEmails) {
        queryClient.setQueryData(["emails"], context.previousEmails);
      }
      console.error("Failed to create email:", error);
    },

    // Update with real data on success
    onSuccess: (realEmail: any, variables: any, context: any) => {
      // Remove the optimistic email and add the real one
      const previousEmails = context?.previousEmails || [];
      const emailsWithoutOptimistic = previousEmails;
      queryClient.setQueryData(
        ["emails"],
        [...emailsWithoutOptimistic, realEmail]
      );
    },

    // Always refetch to ensure consistency
    onSettled: () => {
      utils.emails.getEmails.invalidate();
    },
  });

  // Enhanced delete mutation with optimistic updates
  const deleteEmail = (trpc as any).emails.deleteEmail.useMutation({
    onMutate: async (variables: any) => {
      await queryClient.cancelQueries({ queryKey: ["emails"] });

      const previousEmails =
        (queryClient.getQueryData(["emails"]) as Email[]) || [];

      // Optimistically remove email
      const filteredEmails = previousEmails.filter(
        (email) => email.id !== variables.id
      );
      queryClient.setQueryData(["emails"], filteredEmails);

      return { previousEmails, deletedId: variables.id };
    },

    onError: (error: any, variables: any, context: any) => {
      if (context?.previousEmails) {
        queryClient.setQueryData(["emails"], context.previousEmails);
      }
      console.error("Failed to delete email:", error);
    },

    onSettled: () => {
      utils.emails.getEmails.invalidate();
    },
  });

  // Enhanced update mutation with optimistic updates
  const updateEmail = (trpc as any).emails.updateEmail.useMutation({
    onMutate: async (variables: any) => {
      await queryClient.cancelQueries({ queryKey: ["emails"] });
      await queryClient.cancelQueries({ queryKey: ["emails", variables.id] });

      const previousEmails =
        (queryClient.getQueryData(["emails"]) as Email[]) || [];
      const previousEmail = queryClient.getQueryData(["emails", variables.id]);

      // Optimistically update the email in the list
      const optimisticEmails = previousEmails.map((email) =>
        email.id === variables.id
          ? {
              ...email,
              title: variables.title || email.title,
              isActive:
                variables.isActive !== undefined
                  ? variables.isActive
                  : email.isActive,
              updatedAt: new Date(),
            }
          : email
      );

      queryClient.setQueryData(["emails"], optimisticEmails);

      return { previousEmails, previousEmail };
    },

    onError: (error: any, variables: any, context: any) => {
      if (context?.previousEmails) {
        queryClient.setQueryData(["emails"], context.previousEmails);
      }
      if (context?.previousEmail) {
        queryClient.setQueryData(
          ["emails", variables.id],
          context.previousEmail
        );
      }
      console.error("Failed to update email:", error);
    },

    onSettled: (data: any, error: any, variables: any) => {
      utils.emails.getEmails.invalidate();
      utils.emails.getEmail.invalidate({ id: variables.id });
    },
  });

  // Prefetch email details for better UX
  const prefetchEmail = (emailId: string) => {
    utils.emails.getEmail.prefetch({ id: emailId });
  };

  // Smart refetch that only updates stale data
  const smartRefresh = () => {
    utils.emails.getEmails.invalidate();
  };

  return {
    createEmail,
    deleteEmail,
    updateEmail,
    prefetchEmail,
    smartRefresh,
  };
}
