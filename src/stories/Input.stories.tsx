import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Input from "../components/form/Input";

const meta = {
  title: "Components/Form/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "320px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: "email",
    label: "Email Address",
    name: "email",
    inputType: "email",
    placeholder: "you@example.com",
  },
};

export const Password: Story = {
  args: {
    id: "password",
    label: "Password",
    name: "password",
    inputType: "password",
    placeholder: "Enter your password",
  },
};

export const WithError: Story = {
  args: {
    id: "email-error",
    label: "Email Address",
    name: "email",
    inputType: "email",
    placeholder: "you@example.com",
    error: "Please enter a valid email address",
  },
};

export const NumberInput: Story = {
  args: {
    id: "age",
    label: "Age",
    name: "age",
    inputType: "number",
    placeholder: "25",
  },
};
