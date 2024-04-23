import SideNavigation from "./SideNavigation";
import FeedbackButton from "./FeedbackButton";

export default function Dashboard(props: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col items-center bg-light-100 dark:bg-dark-50">
      <div className="m-auto flex h-16 w-full justify-between border-b border-light-600 px-5 py-2 align-middle dark:border-dark-600">
        <div className="my-auto flex w-full items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-dark-1000">
            kan.bn
          </h1>
          <FeedbackButton />
        </div>
      </div>

      <div className="flex h-full w-full">
        <SideNavigation user={{ email: "henry_ball@hotmail.co.uk" }} />
        <div className="w-full overflow-hidden">{props.children}</div>
      </div>
    </div>
  );
}
