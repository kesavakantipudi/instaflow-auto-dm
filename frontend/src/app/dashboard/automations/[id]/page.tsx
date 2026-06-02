"use client";

import React from "react";
import AutomationForm from "@/components/automation-form";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function EditAutomationPage({ params }: EditPageProps) {
  const resolvedParams = React.use(params);
  return <AutomationForm automationId={resolvedParams.id} />;
}
