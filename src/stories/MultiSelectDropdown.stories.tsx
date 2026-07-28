import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import MultiSelectDropdown from "../components/form/MultiSelectDropdown";

const meta = {
  title: "Components/Form/MultiSelectDropdown",
  component: MultiSelectDropdown,
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
} satisfies Meta<typeof MultiSelectDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const cityOptions = [
  { value: "london", label: "London" },
  { value: "paris", label: "Paris" },
  { value: "berlin", label: "Berlin" },
  { value: "tokyo", label: "Tokyo" },
  { value: "new-york", label: "New York" },
  { value: "sydney", label: "Sydney" },
];

export const Default: Story = {
  args: {
    id: "cities",
    label: "Cities",
    placeholder: "Select cities...",
    options: cityOptions,
    selectedValues: [],
  },
};

export const WithSelections: Story = {
  args: {
    id: "cities-selected",
    label: "Cities",
    placeholder: "Select cities...",
    options: cityOptions,
    selectedValues: ["london", "paris"],
  },
};

export const WithError: Story = {
  args: {
    id: "cities-error",
    label: "Cities",
    placeholder: "Select cities...",
    options: cityOptions,
    selectedValues: [],
    error: "Please select at least one city",
  },
};

export const NoSelectAll: Story = {
  args: {
    id: "cities-no-select-all",
    label: "Cities",
    placeholder: "Select cities...",
    options: cityOptions,
    selectedValues: [],
    showSelectAll: false,
  },
};

export const ManySelected: Story = {
  args: {
    id: "cities-many",
    label: "Cities",
    placeholder: "Select cities...",
    options: cityOptions,
    selectedValues: ["london", "paris", "berlin", "tokyo"],
  },
};
