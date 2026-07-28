import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import FormHeader from "../components/form/FormHeader";

const meta = {
  title: "Components/Form/FormHeader",
  component: FormHeader,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "600px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FormHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "User Information",
    children: (
      <>
        <div className="col-span-6">
          <label className="block text-gray-700 text-sm mb-1">First Name</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="John"
          />
        </div>
        <div className="col-span-6">
          <label className="block text-gray-700 text-sm mb-1">Last Name</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Doe"
          />
        </div>
      </>
    ),
  },
};

export const WithHeaderRight: Story = {
  args: {
    title: "Settings",
    headerRight: (
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
        Save
      </button>
    ),
    children: (
      <div className="col-span-12">
        <label className="block text-gray-700 text-sm mb-1">
          Organization Name
        </label>
        <input
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Acme Inc."
        />
      </div>
    ),
  },
};
