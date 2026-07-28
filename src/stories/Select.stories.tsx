import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Select from "../components/form/Select";

const meta = {
  title: "Components/Form/Select",
  component: Select,
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
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleOptions = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

export const Default: Story = {
  args: {
    id: "role",
    label: "Role",
    name: "role",
    defaultValue: "Select a role",
    options: sampleOptions,
  },
};

export const Required: Story = {
  args: {
    id: "role-required",
    label: "Role",
    name: "role",
    defaultValue: "Select a role",
    options: sampleOptions,
    required: true,
  },
};

export const WithError: Story = {
  args: {
    id: "role-error",
    label: "Role",
    name: "role",
    defaultValue: "Select a role",
    options: sampleOptions,
    error: "Please select a role",
  },
};

export const Unsorted: Story = {
  args: {
    id: "role-unsorted",
    label: "Role",
    name: "role",
    defaultValue: "Select a role",
    options: [
      { value: "z_last", label: "Zebra" },
      { value: "a_first", label: "Apple" },
      { value: "m_middle", label: "Mango" },
    ],
    sort: false,
  },
};
