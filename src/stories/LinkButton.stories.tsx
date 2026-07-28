import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import LinkButton from "../components/buttons/LinkButton";

const meta = {
  title: "Components/UI/LinkButton",
  component: LinkButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof LinkButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: "Go to Dashboard",
    href: "/dashboard",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "Settings",
    href: "/settings",
    variant: "secondary",
  },
};

export const Outline: Story = {
  args: {
    children: "Learn More",
    href: "/about",
    variant: "outline",
  },
};

export const Small: Story = {
  args: {
    children: "Small Link",
    href: "#",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    children: "Large Link",
    href: "#",
    size: "lg",
  },
};
