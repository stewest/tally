import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import Modal from "../components/Modal";

const meta = {
  title: "Components/Modal",
  component: Modal,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    onClose: fn(),
  },
  argTypes: {
    maxWidth: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", width: "100vw" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Confirm Action",
    children: (
      <div>
        <p className="text-gray-600 mb-4">
          Are you sure you want to proceed with this action?
        </p>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Confirm
          </button>
        </div>
      </div>
    ),
  },
};

export const Small: Story = {
  args: {
    title: "Delete Item",
    maxWidth: "sm",
    children: (
      <div>
        <p className="text-gray-600 mb-4">
          This item will be permanently deleted.
        </p>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    ),
  },
};

export const Large: Story = {
  args: {
    title: "User Details",
    maxWidth: "lg",
    children: (
      <div className="space-y-3">
        <p className="text-gray-600">Name: John Doe</p>
        <p className="text-gray-600">Email: john@example.com</p>
        <p className="text-gray-600">Role: Admin</p>
        <p className="text-gray-600">Last Login: March 23, 2026</p>
      </div>
    ),
  },
};
