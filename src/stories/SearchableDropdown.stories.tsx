import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import SearchableDropdown from "../components/form/SearchableDropdown";

const meta = {
  title: "Components/Form/SearchableDropdown",
  component: SearchableDropdown,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "320px" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    onSelectionChange: fn(),
  },
} satisfies Meta<typeof SearchableDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const userOptions = [
  { value: "user-1", label: "Alice Johnson" },
  { value: "user-2", label: "Bob Smith" },
  { value: "user-3", label: "Charlie Brown" },
  { value: "user-4", label: "Diana Prince" },
  { value: "user-5", label: "Eve Williams" },
];

export const Default: Story = {
  args: {
    id: "user-select",
    label: "Assign User",
    placeholder: "Search for a user...",
    options: userOptions,
  },
};

export const WithPreselectedValue: Story = {
  args: {
    id: "user-preselected",
    label: "Assign User",
    placeholder: "Search for a user...",
    options: userOptions,
    value: "user-2",
  },
};

export const WithError: Story = {
  args: {
    id: "user-error",
    label: "Assign User",
    placeholder: "Search for a user...",
    options: userOptions,
    error: "Please select a user",
  },
};

export const Loading: Story = {
  args: {
    id: "user-loading",
    label: "Assign User",
    placeholder: "Search for a user...",
    options: [],
    isLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    id: "user-disabled",
    label: "Assign User",
    placeholder: "Search for a user...",
    options: userOptions,
    value: "user-1",
    disabled: true,
  },
};

export const WithToggle: Story = {
  args: {
    id: "user-toggle",
    label: "Assign User",
    placeholder: "Search for a user...",
    options: userOptions,
    allowToggle: true,
  },
};

export const EmptyOptions: Story = {
  args: {
    id: "user-empty",
    label: "Assign User",
    placeholder: "Search for a user...",
    options: [],
    notFoundText: "No users available",
  },
};
