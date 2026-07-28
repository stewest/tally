import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import RowActionMenu from "../components/ui/RowActionMenu";

const meta = {
  title: "Components/UI/RowActionMenu",
  component: RowActionMenu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RowActionMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { icon: "eye", label: "View", onClick: fn() },
      { icon: "pencil", label: "Edit", onClick: fn() },
      { icon: "trash", label: "Delete", onClick: fn(), destructive: true, dividerBefore: true },
    ],
  },
};

export const SimpleActions: Story = {
  args: {
    items: [
      { icon: "pencil", label: "Edit", onClick: fn() },
      { icon: "copy", label: "Duplicate", onClick: fn() },
    ],
  },
};

export const WithDividers: Story = {
  args: {
    items: [
      { icon: "eye", label: "View Details", onClick: fn() },
      { icon: "pencil", label: "Edit", onClick: fn() },
      { icon: "download", label: "Export", onClick: fn(), dividerBefore: true },
      { icon: "trash", label: "Delete", onClick: fn(), destructive: true, dividerBefore: true },
    ],
  },
};

export const DestructiveOnly: Story = {
  args: {
    items: [
      { icon: "trash", label: "Remove User", onClick: fn(), destructive: true },
    ],
  },
};
