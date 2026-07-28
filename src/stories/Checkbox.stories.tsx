import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Checkbox } from "../components/ui/Checkbox";

const meta = {
  title: "Components/UI/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onCheckedChange: fn(),
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  args: {
    id: "checkbox-default",
  },
};

export const Checked: Story = {
  args: {
    id: "checkbox-checked",
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    id: "checkbox-disabled",
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    id: "checkbox-disabled-checked",
    checked: true,
    disabled: true,
  },
};
