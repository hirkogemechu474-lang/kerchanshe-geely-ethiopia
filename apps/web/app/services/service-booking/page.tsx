"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ServiceBookingRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the correct service page
    router.replace("/service");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-geely-blue mx-auto mb-4"></div>
        <p className="text-steel dark:text-steel-light">Redirecting to service booking...</p>
      </div>
    </div>
  );
}
