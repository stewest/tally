import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Checkbox from "../components/form/Checkbox";

const meta = {
  title: "Components/Form/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: "terms",
    label: "I agree to the terms and conditions",
    name: "terms",
  },
};

export const WithError: Story = {
  args: {
    id: "terms-error",
    label: "I agree to the terms and conditions",
    name: "terms",
    error: "You must agree to continue",
  },
};
