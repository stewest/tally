import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import FormTabs from "../components/form/FormTabs";

const meta: Meta = {
  title: "Components/Form/FormTabs",
  component: FormTabs,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: "600px" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const WithChildren: Story = {
  render: () => (
    <FormTabs tabs={["Details", "Permissions", "Notifications"]}>
      {[
        <div key="details" className="p-4 space-y-3">
          <label className="block text-gray-700 text-sm mb-1">Name</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter name"
          />
        </div>,
        <div key="permissions" className="p-4">
          <p className="text-gray-600">Configure user permissions here.</p>
        </div>,
        <div key="notifications" className="p-4">
          <p className="text-gray-600">Manage notification preferences.</p>
        </div>,
      ]}
    </FormTabs>
  ),
};

export const WithRenderProp: Story = {
  render: () => (
    <FormTabs
      tabs={["Step 1", "Step 2", "Step 3"]}
      renderContent={(tabName: string) => (
        <div className="p-4">
          <p className="text-gray-600">Form content for: {tabName}</p>
        </div>
      )}
    />
  ),
};

export const WithDefaultTab: Story = {
  render: () => (
    <FormTabs tabs={["General", "Advanced"]} defaultTab="Advanced">
      {[
        <div key="general" className="p-4">General settings form</div>,
        <div key="advanced" className="p-4">Advanced settings form</div>,
      ]}
    </FormTabs>
  ),
};

export const WithOnTabChange: Story = {
  render: () => (
    <FormTabs tabs={["Basic", "Extended"]} onTabChange={fn()}>
      {[
        <div key="basic" className="p-4">Basic fields</div>,
        <div key="extended" className="p-4">Extended fields</div>,
      ]}
    </FormTabs>
  ),
};
