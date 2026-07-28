import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spinner, PageSpinner } from "../components/Spinner";

const meta = {
  title: "Components/Spinner",
  component: Spinner,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const CustomClass: Story = {
  args: {
    className: "border-blue-600",
  },
};

export const FullPage: Story = {
  render: () => <PageSpinner />,
  parameters: {
    layout: "fullscreen",
  },
};
