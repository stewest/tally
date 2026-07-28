"use client";

import { useRouter } from "next/navigation";
import Button from "../buttons/Button";
import { Icon } from "../ui/Icon";

export default function ForbiddenPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Icon icon="exclamationTriangle" className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">403</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don&apos;t have permission to access this page. Please contact
            your administrator if you believe this is an error.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => router.push("/dashboard")} className="w-full">
            <Icon icon="home" className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>

          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full"
          >
            <Icon icon="arrowLeft" className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
