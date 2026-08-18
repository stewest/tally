"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Button from "@/components/buttons/Button";
import Input from "@/components/form/Input";
import Select from "@/components/form/Select";
import Textarea from "@/components/form/TextArea";
import {
  TransactionFormValues,
  TransactionSchema,
} from "@/app/types/form-validation";
import { TRANSACTION_CATEGORIES } from "@/lib/finance";

interface TransactionFormProps {
  defaultValues?: Partial<TransactionFormValues>;
  submitLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (data: TransactionFormValues) => void;
  onCancel: () => void;
}

export default function TransactionForm({
  defaultValues,
  submitLabel = "Save transaction",
  isSubmitting = false,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<TransactionFormValues>({
    resolver: yupResolver(TransactionSchema),
    mode: "onChange",
    defaultValues: {
      occurredAt: defaultValues?.occurredAt ?? "",
      description: defaultValues?.description ?? "",
      amount: defaultValues?.amount ?? "",
      merchant: defaultValues?.merchant ?? "",
      category: defaultValues?.category ?? "",
      account: defaultValues?.account ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const onSubmitForm: SubmitHandler<TransactionFormValues> = data => {
    onSubmit(data);
  };

  const selectedCategory = watch("category") ?? "";
  const categoryOptions = [
    ...TRANSACTION_CATEGORIES.map(category => ({
      value: category,
      label: category,
    })),
    ...(selectedCategory &&
    !(TRANSACTION_CATEGORIES as readonly string[]).includes(selectedCategory)
      ? [{ value: selectedCategory, label: selectedCategory }]
      : []),
  ];

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-2">
      <Input
        id="occurredAt"
        label="Date"
        name="occurredAt"
        inputType="date"
        placeholder=""
        register={register}
        error={errors.occurredAt?.message}
      />
      <Input
        id="description"
        label="Description"
        name="description"
        inputType="text"
        placeholder="Countdown Grey Lynn"
        register={register}
        error={errors.description?.message}
      />
      <Input
        id="amount"
        label="Amount"
        name="amount"
        inputType="text"
        placeholder="-42.50"
        register={register}
        error={errors.amount?.message}
      />
      <Input
        id="merchant"
        label="Merchant"
        name="merchant"
        inputType="text"
        placeholder="Optional"
        register={register}
        error={errors.merchant?.message}
      />
      <Select
        id="category"
        label="Category"
        name="category"
        defaultValue="Uncategorised"
        options={categoryOptions}
        register={register}
        value={selectedCategory}
        error={errors.category?.message}
      />
      <Input
        id="account"
        label="Account"
        name="account"
        inputType="text"
        placeholder="Everyday"
        register={register}
        error={errors.account?.message}
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
