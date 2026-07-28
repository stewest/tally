import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Accordion } from "../components/ui/Accordion";

const meta = {
  title: "Components/UI/Accordion",
  component: Accordion,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div style={{ width: "500px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      {
        id: "1",
        title: "What is this template?",
        description: "Learn about the project",
        children: (
          <p className="text-gray-600 mt-3">
            A full-stack Next.js template with Supabase, authentication, and a
            component library.
          </p>
        ),
      },
      {
        id: "2",
        title: "How do I get started?",
        children: (
          <p className="text-gray-600 mt-3">
            Clone the repository, install dependencies, and configure your
            environment variables.
          </p>
        ),
      },
      {
        id: "3",
        title: "Can I customize the theme?",
        children: (
          <p className="text-gray-600 mt-3">
            Yes, all components use Tailwind CSS classes that can be customized.
          </p>
        ),
      },
    ],
  },
};

export const AllowMultiple: Story = {
  args: {
    allowMultiple: true,
    items: [
      {
        id: "faq-1",
        title: "Section One",
        children: <p className="text-gray-600 mt-3">First section content.</p>,
      },
      {
        id: "faq-2",
        title: "Section Two",
        children: <p className="text-gray-600 mt-3">Second section content.</p>,
      },
      {
        id: "faq-3",
        title: "Section Three",
        children: <p className="text-gray-600 mt-3">Third section content.</p>,
      },
    ],
  },
};

export const WithDefaultOpen: Story = {
  args: {
    items: [
      {
        id: "open-1",
        title: "This is open by default",
        defaultOpen: true,
        children: (
          <p className="text-gray-600 mt-3">
            This section starts in an expanded state.
          </p>
        ),
      },
      {
        id: "open-2",
        title: "This is closed",
        children: (
          <p className="text-gray-600 mt-3">Click to expand this section.</p>
        ),
      },
    ],
  },
};
