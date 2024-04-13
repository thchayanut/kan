import { Login } from "~/components/auth";

export default function LoginPage() {
  return (
    <main className="flex h-screen flex-col items-center justify-center bg-dark-50">
      <h1 className="mb-6 text-lg font-bold tracking-tight text-dark-1000">
        kan.bn
      </h1>
      <p className="mb-10 text-3xl text-dark-1000">Get started</p>
      <div className="w-full rounded-md border border-dark-600 bg-dark-300 px-10 py-10 sm:max-w-md">
        <div className=" sm:mx-auto sm:w-full sm:max-w-sm">
          <Login />
        </div>
      </div>
      <p className="mt-10 text-center text-sm text-dark-1000">
        {"Already have an account?"}
      </p>
    </main>
  );
}
