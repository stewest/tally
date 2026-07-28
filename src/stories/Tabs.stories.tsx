import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import Tabs from "../components/ui/Tabs";

const meta: Meta = {
  title: "Components/UI/Tabs",
  component: Tabs,
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
    <Tabs tabs={["Overview", "Settings", "Activity"]}>
      {[
        <div key="overview" className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Overview</h3>
          <p className="text-gray-600">This is the overview tab content.</p>
        </div>,
        <div key="settings" className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Settings</h3>
          <p className="text-gray-600">Manage your settings here.</p>
        </div>,
        <div key="activity" className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Activity</h3>
          <p className="text-gray-600">Recent activity will appear here.</p>
        </div>,
      ]}
    </Tabs>
  ),
};

export const WithRenderProp: Story = {
  render: () => (
    <Tabs
      tabs={["Users", "Roles", "Permissions"]}
      renderContent={(tabName: string) => (
        <div className="p-4">
          <p className="text-gray-600">Content for: {tabName}</p>
        </div>
      )}
    />
  ),
};

export const WithDefaultTab: Story = {
  render: () => (
    <Tabs tabs={["Tab 1", "Tab 2", "Tab 3"]} defaultTab="Tab 2">
      {[
        <div key="1" className="p-4">First tab</div>,
        <div key="2" className="p-4">Second tab (default)</div>,
        <div key="3" className="p-4">Third tab</div>,
      ]}
    </Tabs>
  ),
};

export const WithOnChange: Story = {
  render: () => (
    <Tabs tabs={["General", "Advanced"]} onTabChange={fn()}>
      {[
        <div key="general" className="p-4">General settings</div>,
        <div key="advanced" className="p-4">Advanced settings</div>,
      ]}
    </Tabs>
  ),
};
