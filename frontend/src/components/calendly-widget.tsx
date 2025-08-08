"use client";
import { InlineWidget } from "react-calendly";

const CalendlyWidget = () => {
  return (
    <div id="calendly-widget">
      <InlineWidget url={process.env.NEXT_PUBLIC_CALENDLY_URL as string} />
    </div>
  );
};

export default CalendlyWidget;
