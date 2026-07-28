import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormMessage } from "../components/form/FormMessage";

const meta = {
  title: "Components/Form/FormMessage",
  component: FormMessage,
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
} satisfies Meta<typeof FormMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    message: { success: "Your changes have been saved successfully." },
  },
};

export const Error: Story = {
  args: {
    message: { error: "Something went wrong. Please try again." },
  },
};

export const Info: Story = {
  args: {
    message: { message: "Your session will expire in 5 minutes." },
  },
};
