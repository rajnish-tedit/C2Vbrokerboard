"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FormTextarea } from "@/components/forms/FormInput";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { reasonSchema } from "@/lib/validation";

type ReasonModalProps = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  children?: React.ReactNode;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

export function ReasonModal({
  open,
  title,
  description,
  confirmLabel,
  danger,
  children,
  onCancel,
  onConfirm,
}: ReasonModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ reason: string }>({ resolver: zodResolver(reasonSchema) });

  useEffect(() => {
    if (open) reset({ reason: "" });
  }, [open, reset]);

  return (
    <Modal open={open} onClose={onCancel} title={title} size="md">
      <form
        onSubmit={handleSubmit((v) => onConfirm(v.reason))}
        noValidate
        className="space-y-4"
      >
        <div className="text-sm text-slate-600">{description}</div>
        {children}
        <FormTextarea
          label="Reason (written to the audit log)"
          required
          rows={3}
          error={errors.reason?.message}
          {...register("reason")}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant={danger ? "danger" : "primary"}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
