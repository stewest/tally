"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Button from "@/components/buttons/Button";
import Checkbox from "@/components/form/Checkbox";
import {
  InsightQueueFormValues,
  InsightQueueSchema,
} from "@/app/types/form-validation";
import type { InsightCategory } from "@db/schema";

interface InsightQueueFormProps {
  isSubmitting?: boolean;
  onSubmit: (categories: InsightCategory[]) => void;
  onCancel: () => void;
}

export default function InsightQueueForm({
  isSubmitting = false,
  onSubmit,
  onCancel,
}: InsightQueueFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<InsightQueueFormValues>({
    resolver: yupResolver(InsightQueueSchema),
    mode: "onChange",
    defaultValues: {
      budgetingSpending: false,
      savingEmergency: false,
      debtCredit: false,
      investingGrowth: false,
    },
  });

  const onSubmitForm: SubmitHandler<InsightQueueFormValues> = data => {
    const categories: InsightCategory[] = [];
    if (data.budgetingSpending) categories.push("budgeting_spending");
    if (data.savingEmergency) categories.push("saving_emergency");
    if (data.debtCredit) categories.push("debt_credit");
    if (data.investingGrowth) categories.push("investing_growth");
    onSubmit(categories);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-2">
      <Checkbox
        id="budgetingSpending"
        label="Budgeting and Spending"
        name="budgetingSpending"
        control={control}
        colSpan=""
        error={errors.budgetingSpending?.message}
      />
      <Checkbox
        id="savingEmergency"
        label="Saving and Emergency Funds"
        name="savingEmergency"
        control={control}
        colSpan=""
      />
      <Checkbox
        id="debtCredit"
        label="Debt and Credit"
        name="debtCredit"
        control={control}
        colSpan=""
      />
      <Checkbox
        id="investingGrowth"
        label="Investing and Growth"
        name="investingGrowth"
        control={control}
        colSpan=""
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
        >
          Queue up an insight
        </Button>
      </div>
    </form>
  );
}
