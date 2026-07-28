import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Tag from "../components/ui/Tag";

const meta = {
  title: "Components/UI/Tag",
  component: Tag,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminRole: Story = {
  args: {
    variant: "admin",
  },
};

export const MemberRole: Story = {
  args: {
    variant: "member",
  },
};

export const SuperAdminRole: Story = {
  args: {
    variant: "super_admin",
  },
};

export const PendingStatus: Story = {
  args: {
    variant: "pending",
  },
};

export const AcceptedStatus: Story = {
  args: {
    variant: "accepted",
  },
};

export const ExpiredStatus: Story = {
  args: {
    variant: "expired",
  },
};

export const Active: Story = {
  args: {
    variant: "active",
  },
};

export const Inactive: Story = {
  args: {
    variant: "inactive",
  },
};

export const MediumSize: Story = {
  args: {
    variant: "admin",
    size: "md",
  },
};

export const LargeSize: Story = {
  args: {
    variant: "admin",
    size: "lg",
  },
};
