import { Formik, Form, Field } from "formik";
import { api } from "~/utils/api";
import { useRouter } from "next/navigation";

interface FormValues {
  email: string;
}

export function Login() {
  const router = useRouter();

  const login = api.auth.login.useMutation({
    onSuccess: () => {
      router.push("/verify");
    },
  });

  return (
    <Formik
      initialValues={{
        email: "",
      }}
      onSubmit={(values: FormValues) => {
        login.mutate({
          email: values.email,
        });
      }}
    >
      <Form className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-normal leading-6 text-dark-1000"
          >
            Email address
          </label>
          <div className="mt-2">
            <Field
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="block w-full rounded-md border-0 bg-dark-500 bg-white/5 py-1.5 text-dark-1000 shadow-sm ring-1 ring-inset ring-dark-900 focus:ring-2 focus:ring-inset focus:ring-dark-900 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="focus-visible:outline-offset- flex w-full justify-center rounded-md bg-dark-1000 px-3 py-2 text-sm font-semibold leading-6 text-dark-50 shadow-sm focus-visible:outline focus-visible:outline-2"
          >
            Sign up
          </button>
        </div>
      </Form>
    </Formik>
  );
}
