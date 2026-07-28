import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InviteBannerContent } from "../components/auth/InviteBanner";

const meta = {
  title: "Components/Auth/InviteBanner",
  component: InviteBannerContent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    visible: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof InviteBannerContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    visible: true,
  },
};

export const Hidden: Story = {
  args: {
    visible: false,
  },
};
