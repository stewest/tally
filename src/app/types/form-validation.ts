import { InferType, object, string } from "yup";

export const ProfileSchema = object({
  firstName: string().required("First name is required"),
  lastName: string().required("Last name is required"),
  email: string()
    .required("Email is required")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Please enter a valid email address"
    ),
});

export type ProfileFormValues = InferType<typeof ProfileSchema>;
