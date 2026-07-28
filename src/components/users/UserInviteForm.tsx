"use client";

import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object, string, InferType } from "yup";
import Input from "@/components/form/Input";
import Select from "@/components/form/Select";
import Button from "@/components/buttons/Button";
import { Role } from "../../../db/schema";

const UserInviteSchema = object({
  email: string()
    .email("Please enter a valid email")
    .required("Email is required"),
  role: string()
    .oneOf(["admin", "member", "landlord"], "Please select a valid role")
    .required("Role is required"),
});

export type UserInviteFormValues = InferType<typeof UserInviteSchema>;

interface UserInviteFormProps {
  onSubmit: (data: UserInviteFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function UserInviteForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: UserInviteFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<UserInviteFormValues>({
    resolver: yupResolver(UserInviteSchema),
    mode: "onChange",
  });

  const onSubmitForm: SubmitHandler<UserInviteFormValues> = async data => {
    onSubmit(data);
    reset();
  };

  const roleOptions: { value: Role; label: string }[] = [
    { value: "member", label: "Member" },
    { value: "admin", label: "Admin" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div className="gap-4">
        <Input
          id="email"
          label="Email Address"
          name="email"
          inputType="email"
          placeholder="user@example.com"
          colSpan="col-span-12"
          register={register}
          error={errors.email?.message}
        />

        <Select
          id="role"
          label="Role"
          name="role"
          defaultValue="Select a role"
          options={roleOptions}
          colSpan="col-span-12"
          register={register}
          error={errors.role?.message}
          required={true}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={() => {}}
          variant="primary"
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? "Sending Invite..." : "Send Invite"}
        </Button>
      </div>
    </form>
  );
}
