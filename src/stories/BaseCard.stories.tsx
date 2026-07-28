import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import BaseCard from "../components/ui/BaseCard";

const meta = {
  title: "Components/UI/BaseCard",
  component: BaseCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "400px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BaseCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Card Title</h3>
        <p className="text-gray-600">
          This is a basic card component with default styling.
        </p>
      </div>
    ),
  },
};

export const WithStats: Story = {
  args: {
    children: (
      <div>
        <p className="text-sm text-gray-500 mb-1">Total Users</p>
        <p className="text-3xl font-bold text-gray-900">1,234</p>
        <p className="text-sm text-green-600 mt-1">+12% from last month</p>
      </div>
    ),
  },
};
