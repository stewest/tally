import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Icon } from "../components/ui/Icon";
import type { IconType } from "../components/ui/Icon";

interface NavLink {
  path: string;
  label: string;
  icon: IconType;
}

interface SidebarStoryProps {
  links: NavLink[];
  activePath: string;
  appName: string;
  defaultCollapsed?: boolean;
}

function SidebarStory({
  links,
  activePath,
  appName,
  defaultCollapsed = false,
}: SidebarStoryProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const isActive = (path: string) =>
    activePath === path ||
    (path !== "/dashboard" && activePath?.startsWith(path + "/"));

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-60"
      } h-screen flex flex-col border-r border-gray-200 bg-white transition-all duration-200`}
    >
      <div className="flex items-center justify-between px-4 py-5">
        {!collapsed && (
          <span className="text-lg font-semibold text-gray-900 tracking-tight">
            {appName}
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Icon icon="bars" className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-1 overflow-y-auto">
        <ul className="space-y-0">
          {links.map((navLink) => (
            <li key={navLink.path}>
              <a
                href={navLink.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                  isActive(navLink.path)
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
                title={collapsed ? navLink.label : undefined}
                onClick={(e) => e.preventDefault()}
              >
                <Icon
                  icon={navLink.icon}
                  className={`w-5 h-5 shrink-0 ${
                    isActive(navLink.path) ? "text-gray-900" : "text-gray-500"
                  }`}
                />
                {!collapsed && <span>{navLink.label}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

const meta = {
  title: "Components/Layout/Sidebar",
  component: SidebarStory,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SidebarStory>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultLinks: NavLink[] = [
  { path: "/dashboard", label: "Dashboard", icon: "home" },
  { path: "/organisation-settings/users", label: "Users", icon: "users" },
  { path: "/organisation-settings", label: "Settings", icon: "sliders" },
];

export const Default: Story = {
  args: {
    links: defaultLinks,
    activePath: "/dashboard",
    appName: "App",
  },
};

export const Collapsed: Story = {
  args: {
    links: defaultLinks,
    activePath: "/dashboard",
    appName: "App",
    defaultCollapsed: true,
  },
};

export const CustomBranding: Story = {
  args: {
    links: [
      { path: "/dashboard", label: "Home", icon: "home" },
      { path: "/projects", label: "Projects", icon: "clients" },
      { path: "/analytics", label: "Analytics", icon: "chartLine" },
      { path: "/team", label: "Team", icon: "users" },
      { path: "/settings", label: "Settings", icon: "cog" },
    ],
    activePath: "/projects",
    appName: "Acme Inc.",
  },
};
