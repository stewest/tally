import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import FormDate from "../components/form/FormDate";

const meta = {
  title: "Components/Form/FormDate",
  component: FormDate,
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
} satisfies Meta<typeof FormDate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: "start-date",
    label: "Start Date",
    name: "startDate",
    placeholder: "Select a date",
  },
};

export const WithDefaultValue: Story = {
  args: {
    id: "start-date-default",
    label: "Start Date",
    name: "startDate",
    defaultValue: "2026-03-23",
  },
};

export const WithError: Story = {
  args: {
    id: "start-date-error",
    label: "Start Date",
    name: "startDate",
    error: "Start date is required",
  },
};
