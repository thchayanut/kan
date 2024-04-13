export default function VerifyPage() {
  return (
    <main className="bg-dark-50 flex h-screen flex-col items-center justify-center">
      <p className="text-dark-1000 mb-10 text-3xl">Check your inbox</p>
      <div className=" sm:mx-auto sm:w-full sm:max-w-sm">
        <p className="text-dark-1000 text-md mt-5 text-center">
          {`Click on the link we've sent to you@example.com to sign in.`}
        </p>
      </div>
    </main>
  );
}
