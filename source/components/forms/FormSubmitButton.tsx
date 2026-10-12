import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type FormSubmitButtonProps = {
  isSubmitting: boolean;
  label: string;
  submittingLabel?: string;
  className?: string;
};

export function FormSubmitButton({
  isSubmitting,
  label,
  submittingLabel = "Please wait…",
  className,
}: FormSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
      className={cn("w-full", className)}
    >
      {isSubmitting && (
        <svg
          className="h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="4"
          />
          <path
            d="M22 12a10 10 0 0 0-10-10"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      )}
      {isSubmitting ? submittingLabel : label}
    </Button>
  );
}
