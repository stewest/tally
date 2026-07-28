import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Textarea from "../components/form/TextArea";

const meta = {
  title: "Components/Form/TextArea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "480px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: "description",
    label: "Description",
    name: "description",
    placeholder: "Enter a description...",
  },
};

export const WithError: Story = {
  args: {
    id: "description-error",
    label: "Description",
    name: "description",
    placeholder: "Enter a description...",
    error: "Description is required",
  },
};
