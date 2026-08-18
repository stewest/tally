"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Button from "@/components/buttons/Button";
import Input from "@/components/form/Input";
import Select from "@/components/form/Select";
import Textarea from "@/components/form/TextArea";
import {
  BudgetFormValues,
  BudgetSchema,
} from "@/app/types/form-validation";
import { BUDGET_PERIODS, TRANSACTION_CATEGORIES } from "@/lib/finance";

interface BudgetFormProps {
  defaultValues?: Partial<BudgetFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (data: BudgetFormValues) => void;
  onCancel: () => void;
}

export default function BudgetForm({
  defaultValues,
  submitLabel = "Save budget",
  isSubmitting = false,
  onSubmit,
  onCancel,
}: BudgetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<BudgetFormValues>({
    resolver: yupResolver(BudgetSchema),
    mode: "onChange",
    defaultValues: {
      category: defaultValues?.category ?? "Groceries",
      period: defaultValues?.period ?? "monthly",
      amount: defaultValues?.amount ?? "",
      startsOn: defaultValues?.startsOn ?? "",
      endsOn: defaultValues?.endsOn ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const onSubmitForm: SubmitHandler<BudgetFormValues> = data => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-2">
      <Select
        id="category"
        label="Category"
        name="category"
        defaultValue="Select a category"
        options={TRANSACTION_CATEGORIES.map(category => ({
          value: category,
          label: category,
        }))}
        register={register}
        error={errors.category?.message}
        required
      />
      <Select
        id="period"
        label="Period"
        name="period"
        defaultValue="Select a period"
        options={BUDGET_PERIODS.map(period => ({
          value: period,
          label: period.charAt(0).toUpperCase() + period.slice(1),
        }))}
        register={register}
        error={errors.period?.message}
        required
        sort={false}
      />
      <Input
        id="amount"
        label="Amount"
        name="amount"
        inputType="text"
        placeholder="600.00"
        register={register}
        error={errors.amount?.message}
      />
      <Input
        id="startsOn"
        label="Starts on"
        name="startsOn"
        inputType="date"
        placeholder=""
        register={register}
        error={errors.startsOn?.message}
      />
      <Input
        id="endsOn"
        label="Ends on"
        name="endsOn"
        inputType="date"
        placeholder=""
        register={register}
        error={errors.endsOn?.message}
      />
      <Textarea
        id="notes"
        label="Notes"
        name="notes"
        placeholder="Optional notes"
        register={register}
        error={errors.notes?.message}
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
