import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ColumnDef } from "@tanstack/react-table";
import Table from "../components/ui/Table";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

const sampleData: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin", status: "Active" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Member", status: "Active" },
  { id: 3, name: "Charlie Brown", email: "charlie@example.com", role: "Member", status: "Inactive" },
  { id: 4, name: "Diana Prince", email: "diana@example.com", role: "Admin", status: "Active" },
  { id: 5, name: "Eve Williams", email: "eve@example.com", role: "Member", status: "Active" },
  { id: 6, name: "Frank Castle", email: "frank@example.com", role: "Member", status: "Inactive" },
  { id: 7, name: "Grace Hopper", email: "grace@example.com", role: "Super Admin", status: "Active" },
  { id: 8, name: "Henry Ford", email: "henry@example.com", role: "Member", status: "Active" },
  { id: 9, name: "Iris West", email: "iris@example.com", role: "Admin", status: "Active" },
  { id: 10, name: "Jack Ryan", email: "jack@example.com", role: "Member", status: "Inactive" },
  { id: 11, name: "Karen Page", email: "karen@example.com", role: "Member", status: "Active" },
  { id: 12, name: "Leo Messi", email: "leo@example.com", role: "Member", status: "Active" },
];

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 200,
  },
  {
    accessorKey: "email",
    header: "Email",
    size: 250,
  },
  {
    accessorKey: "role",
    header: "Role",
    size: 150,
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 120,
    cell: ({ getValue }) => {
      const status = getValue() as string;
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            status === "Active"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {status}
        </span>
      );
    },
  },
];

const meta = {
  title: "Components/UI/Table",
  component: Table,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: sampleData,
    columns: columns,
  },
};

export const WithRowClick: Story = {
  args: {
    data: sampleData,
    columns: columns,
    onRowClick: fn(),
  },
};

export const Loading: Story = {
  args: {
    data: [],
    columns: columns,
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns: columns,
    emptyMessage: "No users found. Try adjusting your filters.",
  },
};

export const NoPagination: Story = {
  args: {
    data: sampleData.slice(0, 5),
    columns: columns,
    showPagination: false,
  },
};

export const CustomPageSize: Story = {
  args: {
    data: sampleData,
    columns: columns,
    pageSizeOptions: [5, 10, 25],
  },
};
