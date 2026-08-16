"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { BaseSyntheticEvent, ElementType } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { CustomModal } from "@/components/modals/custom-modal";
import { Button } from "@/components/ui/button";
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
import {
  buildContactMailtoUrl,
  contactSchema,
  type ContactFormValues,
} from "@/lib/contact";

interface ModalData {
  title: string;
  description: string;
  icon: ElementType;
}

function SuccessAnimatedIcon() {
  return (
    <div className="svg-container">
      <svg
        className="ft-green-tick"
        xmlns="http://www.w3.org/2000/svg"
        height="5rem"
        width="5rem"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <circle className="circle" cx="24" cy="24" r="22" />
        <path
          className="tick"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeMiterlimit="10"
          d="M14 27l5.917 4.917L34 17"
        />
      </svg>
    </div>
  );
}

function readHoneypot(event?: BaseSyntheticEvent): string {
  const formElement = event?.currentTarget;
  if (!(formElement instanceof HTMLFormElement)) return "";
  return String(new FormData(formElement).get("website") ?? "");
}

export function ContactForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  const openModal = (data: ModalData) => {
    setModalData(data);
    setIsModalOpen(true);
  };

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
      social: "",
    },
  });

  async function onSubmit(
    values: ContactFormValues,
    event?: BaseSyntheticEvent
  ) {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          website: readHoneypot(event),
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      form.reset();
      openModal({
        title: "Thankyou!",
        description:
          "Your message has been received! I appreciate your contact and will get back to you shortly.",
        icon: SuccessAnimatedIcon,
      });
    } catch (err) {
      console.error("Failed to send the contact message", err);
      // Opens the visitor's mail client; not a page navigation.
      window.location.assign(buildContactMailtoUrl(values));
    }
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="relative space-y-8 min-w-full"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter your message" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="social"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Social (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Link for social account" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div
            className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
            aria-hidden="true"
          >
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Sending..." : "Submit"}
          </Button>
        </form>
      </Form>
      <CustomModal
        title={modalData?.title ?? ""}
        description={modalData?.description ?? ""}
        icon={modalData?.icon ?? null}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
