import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Link from "next/link";
import { Icon } from "../components/ui/Icon";
import type { IconType } from "../components/ui/Icon";

interface BreadcrumbItem {
  label: string;
  path?: string;
  logo?: IconType;
}

interface BreadcrumbsStoryProps {
  items: BreadcrumbItem[];
}

function BreadcrumbItemEl({ item }: { item: BreadcrumbItem }) {
  const pillClass =
    "flex items-center gap-2 bg-gray-100 px-3 py-2 border border-gray-200 rounded-xl text-gray-900 text-sm";

  const content = (
    <>
      {item.logo && <Icon icon={item.logo} />}
      {item.label}
    </>
  );

  if (item.path) {
    return (
      <Link
        href={item.path}
        className={`${pillClass} hover:bg-gray-200 hover:border-gray-300 cursor-pointer`}
      >
        {content}
      </Link>
    );
  }

  return <div className={pillClass}>{content}</div>;
}

function BreadcrumbsStory({ items }: BreadcrumbsStoryProps) {
  return (
    <nav className="flex items-center gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <BreadcrumbItemEl item={item} />
          {index < items.length - 1 && (
            <Icon icon="chevronRight" className="text-gray-400 text-xs" />
          )}
        </div>
      ))}
    </nav>
  );
}

const meta = {
  title: "Components/Layout/Breadcrumbs",
  component: BreadcrumbsStory,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof BreadcrumbsStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: "Acme Inc.", path: "/dashboard" },
      { label: "Users", path: "/organisation-settings/users" },
      { label: "John Doe" },
    ],
  },
};

export const WithIcons: Story = {
  args: {
    items: [
      { label: "Dashboard", path: "/dashboard", logo: "home" },
      { label: "Settings", path: "/organisation-settings", logo: "cog" },
      { label: "Users", logo: "users" },
    ],
  },
};

export const SingleItem: Story = {
  args: {
    items: [{ label: "Dashboard" }],
  },
};

export const LongTrail: Story = {
  args: {
    items: [
      { label: "Acme Inc.", path: "/dashboard" },
      { label: "Settings", path: "/organisation-settings" },
      { label: "Users", path: "/organisation-settings/users" },
      { label: "John Doe", path: "/organisation-settings/users/123" },
      { label: "Edit" },
    ],
  },
};
