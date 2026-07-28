import Breadcrumbs from "./Breadcrumbs";
import Profile from "./Profile";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <Breadcrumbs />
      </div>
      <div className="flex items-center gap-4">
        <Profile />
      </div>
    </header>
  );
}
