import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Popover from "../components/ui/Popover";

const meta = {
  title: "Components/UI/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    position: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Top: Story = {
  args: {
    trigger: (
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Hover me (top)
      </button>
    ),
    content: <p className="text-sm text-gray-700">Popover content on top</p>,
    position: "top",
  },
};

export const Bottom: Story = {
  args: {
    trigger: (
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Hover me (bottom)
      </button>
    ),
    content: (
      <p className="text-sm text-gray-700">Popover content on the bottom</p>
    ),
    position: "bottom",
  },
};

export const Left: Story = {
  args: {
    trigger: (
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Hover me (left)
      </button>
    ),
    content: <p className="text-sm text-gray-700">Popover on the left</p>,
    position: "left",
  },
};

export const Right: Story = {
  args: {
    trigger: (
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Hover me (right)
      </button>
    ),
    content: <p className="text-sm text-gray-700">Popover on the right</p>,
    position: "right",
  },
};

export const RichContent: Story = {
  args: {
    trigger: (
      <span className="text-blue-600 underline cursor-pointer">
        What is this?
      </span>
    ),
    content: (
      <div>
        <p className="font-semibold text-gray-900 mb-1">More Information</p>
        <p className="text-sm text-gray-600">
          This popover can contain any rich content including text, links, and
          other components.
        </p>
      </div>
    ),
    position: "bottom",
  },
};
